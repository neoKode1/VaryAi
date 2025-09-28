import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const GLIF_API_URL = 'https://simple-api.glif.app';
const GLIF_API_KEY = process.env.GLIF_API_KEY;
const INFINITE_KLING_GLIF_ID = 'clozwqgs60013l80fkgmtf49o'; // Infinite Kling 2.5 Glif ID

if (!GLIF_API_KEY) {
  console.error('❌ GLIF_API_KEY environment variable is not set');
}

export async function POST(request: NextRequest) {
  if (!GLIF_API_KEY) {
    return NextResponse.json({ error: 'Server configuration error: GLIF_API_KEY is not set' }, { status: 500 });
  }

  try {
    const { prompt, imageUrl, videoUrl, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!prompt && !imageUrl && !videoUrl) {
      return NextResponse.json({ error: 'At least one input (prompt, imageUrl, or videoUrl) is required' }, { status: 400 });
    }

    console.log('🎬 Infinite Kling 2.5 request:', { prompt, imageUrl, videoUrl, userId });

    // Prepare inputs for the Infinite Kling 2.5 workflow
    const inputs: any = {};
    
    if (prompt) inputs.prompt = prompt;
    if (imageUrl) inputs.image = imageUrl;
    if (videoUrl) inputs.video = videoUrl;

    // Call Glif API for Infinite Kling 2.5
    const glifResponse = await fetch(`${GLIF_API_URL}/${INFINITE_KLING_GLIF_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLIF_API_KEY}`,
      },
      body: JSON.stringify({
        input: inputs.prompt || inputs.image || inputs.video || 'Generate a video'
      }),
    });

    if (!glifResponse.ok) {
      const errorData = await glifResponse.json();
      console.error('❌ Infinite Kling Glif API error:', errorData);
      throw new Error(errorData.error || 'Infinite Kling generation failed');
    }

    const result = await glifResponse.json();
    console.log('✅ Infinite Kling response:', result);

    // Store the generation in the database
    if (supabaseAdmin && result.output) {
      await supabaseAdmin
        .from('galleries')
        .insert({
          user_id: userId,
          model_name: 'infinite-kling-2.5',
          prompt: prompt || 'Infinite Kling 2.5 generation',
          video_url: result.output,
          status: 'completed',
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      glifId: result.id,
      output: result.output,
      error: result.error,
      price: result.price,
      message: 'Infinite Kling 2.5 generation started successfully'
    });

  } catch (error: any) {
    console.error('❌ Infinite Kling API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Get Infinite Kling generation status
export async function GET(request: NextRequest) {
  if (!GLIF_API_KEY) {
    return NextResponse.json({ error: 'Server configuration error: GLIF_API_KEY is not set' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    console.log('🔍 Checking Infinite Kling status:', { requestId });

    // Check status with Glif API
    const statusResponse = await fetch(`${GLIF_API_URL}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GLIF_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json();
      console.error('❌ Infinite Kling status API error:', errorData);
      throw new Error(errorData.error || 'Failed to get status from Glif');
    }

    const statusResult = await statusResponse.json();
    console.log('✅ Infinite Kling status response:', statusResult);

    return NextResponse.json(statusResult);

  } catch (error: any) {
    console.error('❌ Infinite Kling status API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
