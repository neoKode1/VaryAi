import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isUrlExpired } from '@/lib/imageUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting gallery cleanup...');
    
    // Get all gallery items
    const { data: galleryItems, error: fetchError } = await supabase
      .from('galleries')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching gallery items:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 });
    }
    
    if (!galleryItems || galleryItems.length === 0) {
      console.log('✅ No gallery items found');
      return NextResponse.json({ 
        success: true, 
        message: 'No gallery items to clean up',
        cleaned: 0,
        total: 0
      });
    }
    
    console.log(`📊 Found ${galleryItems.length} gallery items to check`);
    
    const expiredItems: string[] = [];
    const validItems: any[] = [];
    
    // Check each item for expired URLs
    for (const item of galleryItems) {
      let isExpired = false;
      
      // Check image URL
      if (item.image_url && isUrlExpired(item.image_url)) {
        console.log(`🔒 Expired image URL found: ${item.id}`);
        isExpired = true;
      }
      
      // Check video URL (if it's a Runway URL with JWT)
      if (item.video_url && item.video_url.includes('_jwt=') && isUrlExpired(item.video_url)) {
        console.log(`🔒 Expired video URL found: ${item.id}`);
        isExpired = true;
      }
      
      if (isExpired) {
        expiredItems.push(item.id);
      } else {
        validItems.push(item);
      }
    }
    
    console.log(`🔍 Found ${expiredItems.length} expired items out of ${galleryItems.length} total`);
    
    if (expiredItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No expired items found',
        cleaned: 0,
        total: galleryItems.length
      });
    }
    
    // Delete expired items
    const { error: deleteError } = await supabase
      .from('galleries')
      .delete()
      .in('id', expiredItems);
    
    if (deleteError) {
      console.error('❌ Error deleting expired items:', deleteError);
      return NextResponse.json({ error: 'Failed to delete expired items' }, { status: 500 });
    }
    
    console.log(`✅ Successfully cleaned up ${expiredItems.length} expired gallery items`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${expiredItems.length} expired items`,
      cleaned: expiredItems.length,
      total: galleryItems.length,
      expiredIds: expiredItems
    });
    
  } catch (error) {
    console.error('💥 Gallery cleanup error:', error);
    return NextResponse.json({ 
      error: 'Gallery cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking gallery for expired items...');
    
    // Get all gallery items
    const { data: galleryItems, error: fetchError } = await supabase
      .from('galleries')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching gallery items:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 });
    }
    
    if (!galleryItems || galleryItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        total: 0,
        expired: 0,
        valid: 0
      });
    }
    
    let expiredCount = 0;
    const expiredItems: any[] = [];
    
    // Check each item for expired URLs
    for (const item of galleryItems) {
      let isExpired = false;
      
      // Check image URL
      if (item.image_url && isUrlExpired(item.image_url)) {
        isExpired = true;
      }
      
      // Check video URL (if it's a Runway URL with JWT)
      if (item.video_url && item.video_url.includes('_jwt=') && isUrlExpired(item.video_url)) {
        isExpired = true;
      }
      
      if (isExpired) {
        expiredCount++;
        expiredItems.push({
          id: item.id,
          created_at: item.created_at,
          image_url: item.image_url,
          video_url: item.video_url
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      total: galleryItems.length,
      expired: expiredCount,
      valid: galleryItems.length - expiredCount,
      expiredItems: expiredItems
    });
    
  } catch (error) {
    console.error('💥 Gallery check error:', error);
    return NextResponse.json({ 
      error: 'Gallery check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
