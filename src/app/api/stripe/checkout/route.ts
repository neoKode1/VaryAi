import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createStripeService } from '@/lib/stripeService';
import { CreateCheckoutSessionRequest } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const body: CreateCheckoutSessionRequest = await request.json();
    const { tier, successUrl, cancelUrl } = body;

    // Validate input
    if (!tier || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create Stripe service
    const stripeService = createStripeService();

    // Create checkout session
    const result = await stripeService.createCheckoutSession({
      userId: user.id,
      tier,
      successUrl,
      cancelUrl
    });

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}