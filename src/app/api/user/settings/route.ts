import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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

    // Get user settings
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        name: profile.name || '',
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        email_notifications: profile.email_notifications ?? true,
        marketing_emails: profile.marketing_emails ?? false,
        two_factor_enabled: profile.two_factor_enabled ?? false,
        api_access_enabled: profile.api_access_enabled ?? false
      }
    });

  } catch (error) {
    console.error('Get user settings error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      name,
      display_name,
      username,
      bio,
      email_notifications,
      marketing_emails,
      two_factor_enabled,
      api_access_enabled
    } = body;

    // Update user settings
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        display_name,
        username,
        bio,
        email_notifications,
        marketing_emails,
        two_factor_enabled,
        api_access_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to update user settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update user settings error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
