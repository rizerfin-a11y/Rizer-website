/* ============================================================
   auth.js — Supabase Authentication (Signup, Login, Logout)
   ============================================================ */

/**
 * Sign up a new user with email & password.
 * Supabase trigger auto-creates the subscription row.
 */
async function signupUser(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showAuthError(error.message);
        return null;
    }

    return data;
}

/**
 * Log in an existing user.
 */
async function loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showAuthError(error.message);
        return null;
    }

    return data;
}

/**
 * Log out the current user.
 */
async function logoutUser() {
    await supabase.auth.signOut();
    // Clear local app state
    localStorage.removeItem('spp_data');
    window.location.href = 'login.html';
}

/**
 * Get the current session (returns null if not logged in).
 */
async function getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Get the current user (returns null if not logged in).
 */
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Check if user is authenticated. If not, redirect to login.
 * Call this at the top of every protected page.
 */
async function requireAuth() {
    const session = await getCurrentSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

/**
 * Display an error message on the auth form.
 */
function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
}

/**
 * Display a success message on the auth form.
 */
function showAuthSuccess(msg) {
    const el = document.getElementById('auth-success');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
}
