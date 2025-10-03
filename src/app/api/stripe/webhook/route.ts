import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

// Validate environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is not set');
}

if (!webhookSecret) {
  console.error('❌ STRIPE_WEBHOOK_SECRET environment variable is not set');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
}) : null;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!stripe || !webhookSecret) {
      console.error('❌ Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the raw body as Buffer to preserve exact formatting for signature verification
    const body = await request.arrayBuffer();
    const signature = request.headers.get('stripe-signature');

    // Debug logging
    console.log('🔍 Webhook Debug Info:');
    console.log('- Body length:', body.byteLength);
    console.log('- Signature present:', !!signature);
    console.log('- Webhook secret present:', !!webhookSecret);

    if (!signature) {
      console.error('❌ No stripe-signature header found');
      return NextResponse.json(
        { error: 'No signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(Buffer.from(body), signature, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', {
        error: err.message,
        type: err.type,
        code: err.code,
        header: err.header,
        payload: err.payload?.substring(0, 200) + '...' // Log first 200 chars
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid signature',
          details: err.message,
          debug: {
            bodyLength: body.length,
            signaturePresent: !!signature,
            webhookSecretPresent: !!webhookSecret
          }
        },
        { status: 400 }
      );
    }

    console.log('🔔 Stripe webhook received:', event.type);

    // Handle the event with proper error handling
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'checkout.session.expired':
          await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
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
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      console.log(`✅ Successfully processed webhook event: ${event.type}`);
      return NextResponse.json({ 
        received: true, 
        event_type: event.type,
        event_id: event.id 
      });

    } catch (handlerError) {
      console.error(`❌ Error processing webhook event ${event.type}:`, handlerError);
      
      // Return 200 to prevent Stripe from retrying, but log the error
      return NextResponse.json({ 
        received: true, 
        error: 'Handler failed but event logged',
        event_type: event.type,
        event_id: event.id 
      });
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
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
    console.error('❌ Missing metadata in checkout session:', { userId, tier });
    throw new Error('Missing required metadata in checkout session');
  }

  try {
    // Handle different types of purchases
    if (tier === 'credit_pack') {
      await handleCreditPackPurchase(session, userId);
    } else {
      await handleSubscriptionPurchase(session, userId, tier);
    }
    console.log(`✅ Successfully processed checkout session ${session.id} for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error processing checkout session ${session.id}:`, error);
    throw error; // Re-throw to be caught by the main handler
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('⏰ Checkout session expired:', session.id);
  
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId) {
    console.error('❌ Missing userId in expired checkout session');
    return;
  }

  // Log the expiration for analytics
  console.log(`📊 Checkout session expired for user ${userId}, tier: ${tier}`);
  
  // You could add logic here to:
  // - Send a reminder email to the user
  // - Update analytics
  // - Clean up any temporary data
}

async function handleCreditPackPurchase(session: Stripe.Checkout.Session, userId: string) {
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ SupabaseAdmin not available');
    throw new Error('Database connection not available');
  }

  // Calculate credits based on amount paid
  const amountPaid = session.amount_total || 0;
  const credits = Math.floor(amountPaid / 0.05); // $0.05 per credit (625 cents / 5 = 125 credits)

  if (credits <= 0) {
    console.error('❌ Invalid credit amount calculated:', { amountPaid, credits });
    throw new Error('Invalid credit amount calculated');
  }

  console.log(`💰 Processing credit purchase: ${credits} credits for user ${userId} ($${amountPaid / 100})`);

  // Add credits to user
  const { error } = await supabaseAdmin.rpc('add_user_credits', {
    p_user_id: userId,
    p_amount: credits,
    p_credit_type: 'purchased',
    p_description: `Credits purchased via Stripe checkout ${session.id}`
  });

  if (error) {
    console.error('❌ Failed to add credits:', error);
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  console.log(`✅ Successfully added ${credits} credits to user ${userId}`);
}

async function handleSubscriptionPurchase(session: Stripe.Checkout.Session, userId: string, tier: string) {
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ SupabaseAdmin not available');
    throw new Error('Database connection not available');
  }

  if (!stripe) {
    console.error('❌ Stripe client not available');
    throw new Error('Stripe client not available');
  }

  if (!session.subscription) {
    console.error('❌ No subscription ID in checkout session');
    throw new Error('No subscription ID in checkout session');
  }

  console.log(`🔄 Processing subscription purchase for user ${userId}, tier: ${tier}`);

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
    console.error('❌ Failed to store subscription:', error);
    throw new Error(`Failed to store subscription: ${error.message}`);
  }

  console.log(`✅ Successfully stored subscription for user ${userId}, tier: ${tier}, status: ${subscription.status}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Subscription created:', subscription.id);
  
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ SupabaseAdmin not available');
    throw new Error('Database connection not available');
  }

  try {
    // Update subscription status if it exists
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
      console.error('❌ Failed to update subscription on creation:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    console.log(`✅ Updated subscription ${subscription.id} on creation`);
  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ SupabaseAdmin not available');
    throw new Error('Database connection not available');
  }

  try {
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
      console.error('❌ Failed to update subscription:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    console.log(`✅ Updated subscription ${subscription.id}, status: ${subscription.status}`);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);
  
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ SupabaseAdmin not available');
    throw new Error('Database connection not available');
  }

  try {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Failed to cancel subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }

    console.log(`✅ Cancelled subscription ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Invoice payment succeeded:', invoice.id);
  
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ SupabaseAdmin not available');
    throw new Error('Database connection not available');
  }

  try {
    // Update subscription status if this is a subscription invoice
    if ((invoice as any).subscription) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', (invoice as any).subscription as string);

      if (error) {
        console.error('❌ Failed to update subscription on payment success:', error);
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      console.log(`✅ Updated subscription ${(invoice as any).subscription} to active on payment success`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment success:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);
  
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('❌ SupabaseAdmin not available');
    throw new Error('Database connection not available');
  }

  try {
    // Update subscription status if this is a subscription invoice
    if ((invoice as any).subscription) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', (invoice as any).subscription as string);

      if (error) {
        console.error('❌ Failed to update subscription on payment failure:', error);
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      console.log(`✅ Updated subscription ${(invoice as any).subscription} to past_due on payment failure`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment failure:', error);
    throw error;
  }
}