// ============================================================
// razorpay-webhook — Supabase Edge Function
// Receives POST from Razorpay, verifies signature, marks paid.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// HMAC SHA256 signature verification
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signed))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return expectedSignature === signature;
}

serve(async (req: Request) => {
    // Only accept POST
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature') || '';

        // Get secrets from environment
        const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        // 1. Verify the Razorpay webhook signature
        const isValid = await verifySignature(body, signature, webhookSecret);
        if (!isValid) {
            console.error('Invalid webhook signature');
            return new Response('Invalid signature', { status: 400 });
        }

        // 2. Parse the event payload
        const event = JSON.parse(body);
        console.log('Webhook event:', event.event);

        // Only process payment.captured events
        if (event.event !== 'payment.captured') {
            return new Response('Event ignored', { status: 200 });
        }

        const payment = event.payload?.payment?.entity;
        if (!payment) {
            return new Response('No payment entity found', { status: 400 });
        }

        // Extract user info from notes
        const userId = payment.notes?.user_id;
        const email = payment.notes?.email;
        const plan = payment.notes?.plan || 'lifetime';

        if (!userId && !email) {
            console.error('No user_id or email in payment notes');
            return new Response('Missing user identification', { status: 400 });
        }

        // 3. Initialize Supabase with service role key (bypasses RLS)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 4. Update the subscription
        let query = supabaseAdmin.from('subscriptions').update({
            paid: true,
            paid_at: new Date().toISOString(),
            plan: plan,
            expires_at: plan === 'monthly'
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : null,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id || null,
            amount_paid: payment.amount
        });

        // Match by user_id or email
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            query = query.eq('email', email);
        }

        const { error } = await query;

        if (error) {
            console.error('Database update error:', error);
            return new Response('Database error', { status: 500 });
        }

        console.log(`✅ Payment confirmed for user: ${userId || email}, plan: ${plan}`);
        return new Response('OK', { status: 200 });

    } catch (err) {
        console.error('Webhook processing error:', err);
        return new Response('Internal error', { status: 500 });
    }
});
