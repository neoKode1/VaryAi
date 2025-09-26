import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Environment API called');
    
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseAdminAvailable: !!supabaseAdmin,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };
    
    console.log('🔧 Environment check results:', envCheck);
    
    // Test basic Supabase connection
    let connectionTest = 'Not tested';
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        connectionTest = `Error: ${error.message}`;
      } else {
        connectionTest = 'Success';
      }
    } catch (err) {
      connectionTest = `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({
      environment: envCheck,
      connectionTest,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test Environment API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}