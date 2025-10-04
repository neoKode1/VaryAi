import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('\n🔔 ===== FAL AI WEBHOOK RECEIVED =====');
  console.log('🔔 Timestamp:', new Date().toISOString());
  console.log('🔔 Request URL:', request.url);
  console.log('🔔 Request method:', request.method);
  
  try {
    // Parse the webhook payload
    const payload = await request.json();
    console.log('🔔 Webhook payload:', JSON.stringify(payload, null, 2));
    
    const { request_id, gateway_request_id, status, payload: resultPayload } = payload;
    
    console.log(`🔔 Request ID: ${request_id}`);
    console.log(`🔔 Gateway Request ID: ${gateway_request_id}`);
    console.log(`🔔 Status: ${status}`);
    
    if (status === 'OK' && resultPayload) {
      console.log('✅ Generation completed successfully!');
      
      // Extract image URLs from the payload
      const images = resultPayload.images || [];
      console.log(`🔔 Generated ${images.length} images`);
      
      // Update the database with the completed generation
      // We'll need to store the request_id to match it with our pending requests
      if (images.length > 0) {
        console.log('🔔 Image URLs:', images.map((img: any) => img.url));
        
        // TODO: Update the database record for this request_id
        // This will be implemented once we have the request tracking system
        
        console.log('✅ Webhook processed successfully');
      }
    } else {
      console.log('❌ Generation failed or status not OK');
      console.log('❌ Status:', status);
      console.log('❌ Payload:', resultPayload);
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received and processed' 
    });
    
  } catch (error) {
    console.error('❌ Error processing FAL AI webhook:', error);
    
    // Still return 200 to prevent webhook retries
    return NextResponse.json({ 
      success: false, 
      error: 'Error processing webhook' 
    });
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  console.log('🔔 FAL AI webhook endpoint - GET request received');
  return NextResponse.json({ 
    message: 'FAL AI webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
