import { NextRequest, NextResponse } from 'next/server';

const GLIF_API_URL = 'https://simple-api.glif.app';
const GLIF_API_KEY = process.env.GLIF_API_KEY;

if (!GLIF_API_KEY) {
  console.error('❌ GLIF_API_KEY environment variable is not set');
}

export async function POST(request: NextRequest) {
  if (!GLIF_API_KEY) {
    return NextResponse.json({ error: 'Server configuration error: GLIF_API_KEY is not set' }, { status: 500 });
  }

  try {
    const { glifId, inputs, visibility = 'PRIVATE' } = await request.json();

    if (!glifId) {
      return NextResponse.json({ error: 'Glif ID is required' }, { status: 400 });
    }

    if (!inputs) {
      return NextResponse.json({ error: 'Inputs are required' }, { status: 400 });
    }

    console.log('🎬 Glif API request:', { glifId, inputs, visibility });

    // Call Glif API
    const glifResponse = await fetch(GLIF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLIF_API_KEY}`,
      },
      body: JSON.stringify({
        id: glifId,
        inputs,
        visibility
      }),
    });

    if (!glifResponse.ok) {
      const errorData = await glifResponse.json();
      console.error('❌ Glif API error:', errorData);
      throw new Error(errorData.error || 'Glif API request failed');
    }

    const result = await glifResponse.json();
    console.log('✅ Glif API response:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Glif API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Get Glif workflow status/result
export async function GET(request: NextRequest) {
  if (!GLIF_API_KEY) {
    return NextResponse.json({ error: 'Server configuration error: GLIF_API_KEY is not set' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const glifId = searchParams.get('glifId');
    const requestId = searchParams.get('requestId');

    if (!glifId) {
      return NextResponse.json({ error: 'Glif ID is required' }, { status: 400 });
    }

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    console.log('🔍 Checking Glif status:', { glifId, requestId });

    // Check status with Glif API
    const statusResponse = await fetch(`${GLIF_API_URL}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GLIF_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json();
      console.error('❌ Glif status API error:', errorData);
      throw new Error(errorData.error || 'Failed to get status from Glif');
    }

    const statusResult = await statusResponse.json();
    console.log('✅ Glif status response:', statusResult);

    return NextResponse.json(statusResult);

  } catch (error: any) {
    console.error('❌ Glif status API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
