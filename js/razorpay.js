/* ============================================================
   razorpay.js — Razorpay Checkout Integration
   ============================================================ */

const RAZORPAY_KEY_ID = 'rzp_live_SdMavU5oQ8bpSJ';

/**
 * Initiate a Razorpay payment.
 * @param {string} plan - 'monthly' or 'lifetime'
 * @param {number} amountInPaise - Amount in paise (₹1 = 100)
 */
async function initiatePayment(plan, amountInPaise) {
    const user = await getCurrentUser();
    if (!user) {
        alert('Please log in first.');
        return;
    }

    // Create a unique order description
    const description = plan === 'lifetime'
        ? 'Rizer Pro — Lifetime Access'
        : 'Rizer Pro — Monthly Subscription';

    const options = {
        key: RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Rizer',
        description: description,
        image: '', // Add your logo URL here if desired
        prefill: {
            email: user.email
        },
        notes: {
            user_id: user.id,
            plan: plan,
            email: user.email
        },
        theme: {
            color: '#6366f1'
        },
        handler: async function (response) {
            // Called on successful payment
            await handlePaymentSuccess(response, plan, amountInPaise);
        },
        modal: {
            ondismiss: function () {
                console.log('Payment modal dismissed');
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

/**
 * Handle successful Razorpay payment.
 * Updates Supabase subscription and unlocks the app.
 * The webhook also updates DB as backup, but this gives instant feedback.
 */
async function handlePaymentSuccess(response, plan, amountInPaise) {
    const user = await getCurrentUser();
    if (!user) return;

    try {
        // Update the subscription in Supabase directly
        const { error } = await supabaseClient
            .from('subscriptions')
            .update({
                paid: true,
                paid_at: new Date().toISOString(),
                plan: plan,
                expires_at: plan === 'monthly'
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    : null,
                razorpay_payment_id: response.razorpay_payment_id || null,
                razorpay_order_id: response.razorpay_order_id || null,
                amount_paid: amountInPaise
            })
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to update subscription:', error);
            // Still try to proceed — the webhook will handle it as backup
        }

        // Refresh subscription data
        await fetchSubscription();

        // Unlock the app
        hidePaywall();
        hideTimer();

        // Show success notification
        if (typeof notify === 'function') {
            notify('🎉 Payment successful! Welcome to Rizer Pro!', 'success');
        }

        // Re-render the page
        if (typeof renderPage === 'function') {
            renderPage();
        }
    } catch (err) {
        console.error('Payment processing error:', err);
        alert('Payment was received! Please refresh the page to continue.');
    }
}
