/* ============================================================
   paywall.js — Payment Wall (Blocks App After Trial)
   ============================================================ */

/**
 * Show the payment wall overlay — blocks entire screen.
 * Cannot be dismissed.
 */
function showPaywall() {
  let overlay = document.getElementById('paywall-overlay');

  // Create the overlay if it doesn't exist
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'paywall-overlay';
    overlay.innerHTML = `
      <div class="paywall-card">
        <div class="paywall-icon">🔒</div>
        <h1 class="paywall-title">Your Free Trial Has Ended</h1>
        <p class="paywall-desc">
          Upgrade to Rizer Pro to continue mastering your productivity with unlimited access to all features.
        </p>

        <div class="paywall-plans">
          <!-- Monthly Plan -->
          <div class="paywall-plan" id="plan-monthly">
            <div class="paywall-plan-tag">Popular</div>
            <h3>Monthly</h3>
            <div class="paywall-price">₹1 <span>/month</span></div>
            <ul class="paywall-features">
              <li>✅ Unlimited tasks & goals</li>
              <li>✅ Google Calendar sync</li>
              <li>✅ Advanced analytics</li>
              <li>✅ Priority support</li>
            </ul>
            <button class="paywall-btn paywall-btn-primary" onclick="initiatePayment('monthly', 100)">
              Subscribe Monthly
            </button>
          </div>

          <!-- Lifetime Plan -->
          <div class="paywall-plan paywall-plan-featured" id="plan-lifetime">
            <div class="paywall-plan-tag best">Best Value</div>
            <h3>Lifetime</h3>
            <div class="paywall-price">₹2 <span>one time</span></div>
            <ul class="paywall-features">
              <li>✅ Everything in Monthly</li>
              <li>✅ Pay once, use forever</li>
              <li>✅ All future updates</li>
              <li>✅ Beta access to new features</li>
            </ul>
            <button class="paywall-btn paywall-btn-featured" onclick="initiatePayment('lifetime', 200)">
              Get Lifetime Access
            </button>
          </div>
        </div>

        <div class="paywall-footer">
          <p>🔒 Secure payment powered by Razorpay</p>
          <div class="paywall-links">
            <a href="refund.html" target="_blank">Refund Policy</a>
            <a href="terms.html" target="_blank">Terms</a>
            <a href="privacy.html" target="_blank">Privacy</a>
          </div>
          <button class="paywall-logout-btn" onclick="logoutUser()">← Sign out</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  overlay.style.display = 'flex';
}

/**
 * Hide the payment wall (called after successful payment).
 */
function hidePaywall() {
  const overlay = document.getElementById('paywall-overlay');
  if (overlay) overlay.style.display = 'none';
}
