import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Wan 2.2 Animate API request received');

    const { 
      videoUrl, 
      imageUrl, 
      resolution = '480p',
      videoQuality = 'high',
      videoWriteMode = 'balanced',
      shift = 5,
      numInferenceSteps = 20,
      enableSafetyChecker = false,
      seed,
      userId 
    } = await request.json();

    if (!videoUrl || !imageUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: videoUrl, imageUrl, userId' },
        { status: 400 }
      );
    }

    // Note: Credit checking is handled in the frontend before calling this API

    // Prepare the request payload for Fal AI
    const payload = {
      video_url: videoUrl,
      image_url: imageUrl,
      resolution,
      video_quality: videoQuality,
      video_write_mode: videoWriteMode,
      shift,
      num_inference_steps: numInferenceSteps,
      enable_safety_checker: enableSafetyChecker,
      ...(seed && { seed })
    };

    console.log('🎬 Wan 2.2 Animate payload:', payload);

    // Call Fal AI API
    const response = await fetch('https://queue.fal.run/fal-ai/wan/v2.2-14b/animate/move', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_AI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Fal AI API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate video with Wan 2.2 Animate' },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Wan 2.2 Animate response:', result);

    // Note: Credit usage is handled in the frontend after successful generation

    // Store the generation in the database
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('galleries')
        .insert({
          user_id: userId,
          model_name: 'wan-2.2-animate',
          prompt: `Wan 2.2 Animate generation with shift: ${shift}`,
          image_url: imageUrl,
          video_url: result.video?.url || null,
          status: 'completed',
          created_at: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      request_id: result.request_id,
      status: result.status,
      video: result.video,
      prompt: result.prompt,
      seed: result.seed
    });

  } catch (error) {
    console.error('❌ Wan 2.2 Animate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle status check requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing request_id parameter' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking Wan 2.2 Animate status for request:', requestId);

    // Check status with Fal AI
    const response = await fetch(`https://queue.fal.run/fal-ai/wan/v2.2-14b/animate/move/requests/${requestId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${process.env.FAL_AI_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Fal AI status check error:', errorText);
      return NextResponse.json(
        { error: 'Failed to check status' },
        { status: response.status }
      );
    }

    const status = await response.json();
    console.log('✅ Wan 2.2 Animate status:', status);

    // If completed, get the result
    if (status.status === 'COMPLETED') {
      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/wan/v2.2-14b/animate/move/requests/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${process.env.FAL_AI_KEY}`,
        },
      });

      if (resultResponse.ok) {
        const result = await resultResponse.json();
        return NextResponse.json({
          ...status,
          result
        });
      }
    }

    return NextResponse.json(status);

  } catch (error) {
    console.error('❌ Wan 2.2 Animate status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
