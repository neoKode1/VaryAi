import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

// Clean implementation based on official FAL AI nano-banana schema
export async function POST(request: NextRequest) {
  console.log('\n🚀 ===== CLEAN NANO-BANANA API REQUEST START =====');
  console.log('🚀 Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    console.log('📝 Request body:', JSON.stringify(body, null, 2));
    
    const { prompt, image_urls, num_images = 1, output_format = "jpeg", sync_mode = false, aspect_ratio } = body;
    
    // Validate required fields according to schema
    if (!prompt || prompt.length < 3 || prompt.length > 5000) {
      return NextResponse.json({
        success: false,
        error: 'Prompt must be between 3 and 5000 characters'
      }, { status: 400 });
    }
    
    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0 || image_urls.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'image_urls must be an array with 1-10 items'
      }, { status: 400 });
    }
    
    if (num_images < 1 || num_images > 4) {
      return NextResponse.json({
        success: false,
        error: 'num_images must be between 1 and 4'
      }, { status: 400 });
    }
    
    console.log(`📝 Validated input:`);
    console.log(`   - Prompt: "${prompt}" (${prompt.length} chars)`);
    console.log(`   - Image URLs: ${image_urls.length} images`);
    console.log(`   - Num images: ${num_images}`);
    console.log(`   - Output format: ${output_format}`);
    console.log(`   - Sync mode: ${sync_mode}`);
    console.log(`   - Aspect ratio: ${aspect_ratio || 'None'}`);
    
    // Build input according to official schema
    const falInput: any = {
      prompt,
      image_urls,
      num_images,
      output_format,
      sync_mode
    };
    
    // Add aspect_ratio only if provided
    if (aspect_ratio) {
      falInput.aspect_ratio = aspect_ratio;
    }
    
    console.log(`\n🚀 Submitting to FAL AI queue...`);
    console.log(`🚀 Input:`, JSON.stringify(falInput, null, 2));
    
    // Submit to FAL AI queue using official schema
    const result = await fal.queue.submit("fal-ai/nano-banana/edit", {
      input: falInput
    });
    
    console.log(`\n✅ Queue submission successful!`);
    console.log(`✅ Request ID: ${result.request_id}`);
    console.log(`✅ Status: ${result.status}`);
    console.log(`✅ Status URL: ${result.status_url}`);
    
    // Return the queue status for polling
    return NextResponse.json({
      success: true,
      request_id: result.request_id,
      status: result.status,
      status_url: result.status_url,
      queue_position: result.queue_position,
      message: 'Request submitted to queue successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in clean nano-banana API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint to check request status
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const request_id = url.searchParams.get('request_id');
  
  if (!request_id) {
    return NextResponse.json({
      success: false,
      error: 'request_id parameter is required'
    }, { status: 400 });
  }
  
  try {
    console.log(`🔍 Checking status for request: ${request_id}`);
    
    const status = await fal.queue.status("fal-ai/nano-banana/edit", request_id);
    
    console.log(`📊 Status for ${request_id}:`, status);
    
    return NextResponse.json({
      success: true,
      request_id,
      status: status.status,
      queue_position: status.queue_position,
      logs: status.logs,
      metrics: status.metrics
    });
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check status'
    }, { status: 500 });
  }
}
