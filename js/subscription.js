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

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Failed to fetch subscription:', error.message);
        return null;
    }

    currentSubscription = data;
    return data;
}

/**
 * Check if the user has paid (lifetime or monthly).
 */
function isPaidUser() {
    return currentSubscription?.paid === true;
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
    const sub = await fetchSubscription();
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
