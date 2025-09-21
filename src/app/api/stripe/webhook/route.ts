import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('🔔 Stripe webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout session completed:', session.id);
  
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Handle different types of purchases
  if (tier === 'credit_pack') {
    await handleCreditPackPurchase(session, userId);
  } else {
    await handleSubscriptionPurchase(session, userId, tier);
  }
}

async function handleCreditPackPurchase(session: Stripe.Checkout.Session, userId: string) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('SupabaseAdmin not available');
      return;
    }

    // Calculate credits based on amount paid
    const amountPaid = session.amount_total || 0;
    const credits = Math.floor(amountPaid / 0.04); // $0.04 per credit

    // Add credits to user
    const { error } = await supabaseAdmin.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: credits,
      p_credit_type: 'purchased',
      p_description: `Credits purchased via Stripe checkout ${session.id}`
    });

    if (error) {
      console.error('Failed to add credits:', error);
    } else {
      console.log(`✅ Added ${credits} credits to user ${userId}`);
    }
  } catch (error) {
    console.error('Error handling credit pack purchase:', error);
  }
}

async function handleSubscriptionPurchase(session: Stripe.Checkout.Session, userId: string, tier: string) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('SupabaseAdmin not available');
      return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Store subscription in database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        tier: tier,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store subscription:', error);
    } else {
      console.log(`✅ Stored subscription for user ${userId}, tier: ${tier}`);
    }
  } catch (error) {
    console.error('Error handling subscription purchase:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Subscription created:', subscription.id);
  // Additional logic for new subscriptions can be added here
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('SupabaseAdmin not available');
      return;
    }

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update subscription:', error);
    } else {
      console.log(`✅ Updated subscription ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);
  
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('SupabaseAdmin not available');
      return;
    }

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to cancel subscription:', error);
    } else {
      console.log(`✅ Cancelled subscription ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Invoice payment succeeded:', invoice.id);
  // Additional logic for successful payments can be added here
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);
  // Additional logic for failed payments can be added here
}