import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createStripeService } from '@/lib/stripeService';

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

    const body = await request.json();
    const { returnUrl } = body;

    // Create Stripe service
    const stripeService = createStripeService();

    // Create customer portal session
    const result = await stripeService.createCustomerPortalSession({
      userId: user.id,
      returnUrl: returnUrl || `${request.nextUrl.origin}/billing`
    });

    return NextResponse.json({
      success: true,
      url: result.url
    });

  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}