/* ============================================================
   subscription.js — Trial Status & Access Control
   ============================================================ */

/** Global subscription data (fetched from Supabase) */
let currentSubscription = null;

/**
 * Fetch the current user's subscription from Supabase.
 * Returns the subscription object or null.
 */
async function fetchSubscription() {
    const user = await getCurrentUser();
    if (!user) return null;

    // 1. Try to fetch existing subscription
    const { data, error } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

    if (error) {
        console.error('Failed to fetch subscription:', error.message);
        return null;
    }

    // 2. If no subscription found, create one (Initial signup)
    if (!data) {
        console.log('No subscription found, creating new one for user:', user.id);
        const trialDuration = 24 * 60 * 60 * 1000; // 24 hours
        const newSub = {
            user_id: user.id,
            email: user.email,
            paid: false,
            trial_end: new Date(Date.now() + trialDuration).toISOString(),
            created_at: new Date().toISOString()
        };

        const { data: createdData, error: createError } = await supabaseClient
            .from('subscriptions')
            .insert(newSub)
            .select()
            .single();

        if (createError) {
            console.error('Failed to create initial subscription:', createError.message);
            return null;
        }
        currentSubscription = createdData;
        return createdData;
    }

    currentSubscription = data;

    // Sync GCal token to local state
    if (data.gcal_token) {
        state.gcalToken = data.gcal_token;
        state.gcalConnected = true;
        state.gcalPermission = true;
    }

    return data;
}

/**
 * Check if the user has paid (lifetime or monthly).
 */
function isPaidUser() {
    if (!currentSubscription || currentSubscription.paid !== true) return false;

    // If it's a monthly plan, check if it has expired
    if (currentSubscription.plan === 'monthly' && currentSubscription.expires_at) {
        const expiryDate = new Date(currentSubscription.expires_at);
        if (new Date() > expiryDate) {
            return false; // Subscription expired
        }
    }

    return true; // Active lifetime or active monthly
}

/**
 * Check if the trial is still active.
 */
function isTrialActive() {
    if (!currentSubscription) return false;
    if (currentSubscription.paid) return false; // paid users don't need trial
    const trialEnd = new Date(currentSubscription.trial_end);
    return new Date() < trialEnd;
}

/**
 * Check if the trial has expired.
 */
function isTrialExpired() {
    if (!currentSubscription) return true;
    if (currentSubscription.paid) return false;
    const trialEnd = new Date(currentSubscription.trial_end);
    return new Date() >= trialEnd;
}

/**
 * Get remaining trial time in milliseconds.
 */
function getTrialRemaining() {
    if (!currentSubscription) return 0;
    const trialEnd = new Date(currentSubscription.trial_end);
    const remaining = trialEnd.getTime() - Date.now();
    return Math.max(0, remaining);
}

/**
 * Master access control — runs on every page load.
 * 
 * Flow:
 *   1. Check if logged in → if not, redirect to login
 *   2. Fetch subscription
 *   3. If paid → show app normally
 *   4. If trial active → show app + timer
 *   5. If trial expired → show paywall
 */
async function enforceAccess() {
    // 1. Check auth
    const session = await getCurrentSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fetch subscription
    let sub = await fetchSubscription();

    // 2b. If we have a provider_token in the current session, save it to the subscription
    if (session.provider_token) {
        console.log('Found Google Provider Token, saving to Supabase...');
        const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({ gcal_token: session.provider_token })
            .eq('user_id', session.user.id);

        if (!updateError) {
            // Update local copy too
            if (sub) sub.gcal_token = session.provider_token;
            state.gcalToken = session.provider_token;
            state.gcalConnected = true;
            state.gcalPermission = true;
            save();
        }
    }

    if (!sub) {
        // Edge case: subscription row not created yet, wait and retry
        await new Promise(r => setTimeout(r, 1500));
        const retried = await fetchSubscription();
        if (!retried) {
            console.error('No subscription found for user');
            showPaywall();
            return;
        }
    }

    // 3. Check access level
    if (isPaidUser()) {
        // Full access — hide timer and paywall
        hideTimer();
        hidePaywall();
        enterAppFromAuth();
    } else if (isTrialActive()) {
        // Trial active — show app with countdown
        hidePaywall();
        enterAppFromAuth();
        startTrialTimer(currentSubscription.trial_end);
    } else {
        // Trial expired — block with paywall
        enterAppFromAuth();
        showPaywall();
    }
}

/**
 * Enter the app UI (show app, hide landing page).
 * Bridges with the existing enterApp() flow.
 */
function enterAppFromAuth() {
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (app) app.style.display = 'flex';
    window.scrollTo(0, 0);

    // Set state as logged in (not guest)  
    if (typeof state !== 'undefined') {
        state.isGuest = false;
        if (typeof save === 'function') save();
    }

    // Init the existing app
    if (typeof init === 'function') init();
}
