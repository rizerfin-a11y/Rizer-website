/* ============================================================
   timer.js — Live Countdown Timer Component
   ============================================================ */

let timerInterval = null;

/**
 * Start the live countdown timer.
 * @param {string} trialEndISO — ISO timestamp of trial_end from Supabase
 */
function startTrialTimer(trialEndISO) {
    const timerBanner = document.getElementById('trial-timer');
    if (!timerBanner) return;

    timerBanner.style.display = 'flex';

    // Clear any existing timer
    if (timerInterval) clearInterval(timerInterval);

    const trialEnd = new Date(trialEndISO).getTime();

    function updateTimer() {
        const now = Date.now();
        const remaining = trialEnd - now;

        if (remaining <= 0) {
            // Trial has expired
            clearInterval(timerInterval);
            timerBanner.style.display = 'none';
            showPaywall();
            return;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Update display
        const timerText = document.getElementById('trial-timer-text');
        if (timerText) {
            if (remaining < 10 * 60 * 1000) {
                // Under 10 minutes — urgent warning
                timerText.innerHTML = `⚠️ Trial ending soon! <strong>${timeStr}</strong> remaining`;
                timerBanner.className = 'trial-timer-banner urgent';
            } else if (remaining < 60 * 60 * 1000) {
                // Under 1 hour — warning
                timerText.innerHTML = `⏳ Free trial ends in <strong>${timeStr}</strong>`;
                timerBanner.className = 'trial-timer-banner warning';
            } else {
                // Normal
                timerText.innerHTML = `⏳ Free trial ends in <strong>${timeStr}</strong>`;
                timerBanner.className = 'trial-timer-banner';
            }
        }
    }

    // Initial update + start interval
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

/**
 * Hide the timer banner.
 */
function hideTimer() {
    const timerBanner = document.getElementById('trial-timer');
    if (timerBanner) timerBanner.style.display = 'none';
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
