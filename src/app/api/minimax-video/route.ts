import { NextRequest, NextResponse } from 'next/server';

// OPTIONS endpoint for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// GET endpoint to proxy Minimax video downloads with authentication
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  
  if (!fileId) {
    return NextResponse.json({
      error: 'File ID is required'
    }, { status: 400 });
  }
  
  if (!process.env.MINIMAX_API_KEY) {
    return NextResponse.json({
      error: 'Minimax API key not configured'
    }, { status: 500 });
  }
  
  try {
    console.log(`🎬 Proxying Minimax video download for file ID: ${fileId}`);
    
    // Fetch the video from Minimax with proper authentication
    const response = await fetch(`https://api.minimax.io/v1/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Minimax video download failed: ${response.status} - ${response.statusText}`);
      return NextResponse.json({
        error: `Failed to download video: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }
    
    // Get the video data
    const videoBuffer = await response.arrayBuffer();
    
    // Get content type from the response
    const contentType = response.headers.get('content-type') || 'video/mp4';
    
    console.log(`✅ Video downloaded successfully, size: ${videoBuffer.byteLength} bytes, type: ${contentType}`);
    
    // Return the video with proper headers
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': videoBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      }
    });
    
  } catch (error) {
    console.error('💥 Error proxying Minimax video:', error);
    return NextResponse.json({
      error: 'Failed to proxy video download'
    }, { status: 500 });
  }
}
