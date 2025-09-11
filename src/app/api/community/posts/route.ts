import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback to hardcoded values if environment variables are not available
const finalSupabaseUrl = supabaseUrl || 'https://vqmzepfbgbwtzbpmrevx.supabase.co';
const finalSupabaseKey = supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbXplcGZiZ2J3dHpicG1yZXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDk5NjgsImV4cCI6MjA3MjcyNTk2OH0.vwKODtk4ScXWv8ZCTqtkmlMeYLWhUrInxrhaYZnEVqo';

console.log('🔧 [COMMUNITY POSTS] Environment check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  usingFallback: !supabaseUrl || !supabaseServiceKey
});

export async function GET() {
  try {
    console.log('📖 [COMMUNITY POSTS] GET request received - fetching posts');
    
    // Validate configuration
    if (!finalSupabaseUrl || !finalSupabaseKey) {
      console.error('❌ [COMMUNITY POSTS] Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    console.log('✅ [COMMUNITY POSTS] Supabase configured, creating client');
    const supabase = createClient(finalSupabaseUrl, finalSupabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('🔍 [COMMUNITY POSTS] Fetching posts first...');
    // First, fetch posts without user profiles to avoid relationship issues
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('📊 [COMMUNITY POSTS] Posts fetched:', { 
      success: !error, 
      error: error ? error.message : null,
      postCount: posts ? posts.length : 0
    });

    if (error) {
      console.error('❌ [COMMUNITY POSTS] Error fetching posts:', error);
      return NextResponse.json({ success: true, data: [] });
    }

    // Now fetch user profiles for each post
         if (posts && posts.length > 0) {
           console.log('👥 [COMMUNITY POSTS] Fetching user profiles for posts...');
           const userIds = [...new Set(posts.map(post => post.user_id))];
           console.log('🔍 [COMMUNITY POSTS] User IDs to fetch profiles for:', userIds);
           
           const { data: profiles, error: profilesError } = await supabase
             .from('users')
             .select('id, name, display_name, username, profile_picture, email')
             .in('id', userIds);

           console.log('👥 [COMMUNITY POSTS] Profiles fetched:', { 
             success: !profilesError, 
             error: profilesError ? profilesError.message : null,
             profileCount: profiles ? profiles.length : 0,
             profiles: profiles
           });

           // If no profiles found, let's check if users exist in auth.users
           if (!profiles || profiles.length === 0) {
             console.log('⚠️ [COMMUNITY POSTS] No profiles found in users table, checking auth.users...');
             const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
             console.log('👤 [COMMUNITY POSTS] Auth users:', { 
               count: authUsers?.users?.length || 0,
               error: authError ? authError.message : null
             });
             
             // Try to create missing user profiles
             if (authUsers?.users && authUsers.users.length > 0) {
               console.log('🔄 [COMMUNITY POSTS] Attempting to create missing user profiles...');
               for (const authUser of authUsers.users) {
                 const existingUser = profiles?.find(p => p.id === authUser.id);
                 if (!existingUser) {
                   try {
                     const { error: insertError } = await supabase
                       .from('users')
                       .insert({
                         id: authUser.id,
                         email: authUser.email,
                         name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'vARY Ai User',
                         display_name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'vARY Ai User',
                         username: authUser.email?.split('@')[0]?.toLowerCase().replace(/\s+/g, '_') || 'user',
                         profile_picture: authUser.user_metadata?.avatar_url,
                         bio: 'AI enthusiast and creative explorer',
                         preferences: {},
                         usage_stats: {
                           total_generations: 0,
                           image_generations: 0,
                           video_generations: 0,
                           character_variations: 0,
                           background_changes: 0,
                           last_activity: null
                         }
                       });
                     
                     if (insertError) {
                       console.log(`⚠️ [COMMUNITY POSTS] Could not create profile for ${authUser.id}:`, insertError.message);
                     } else {
                       console.log(`✅ [COMMUNITY POSTS] Created profile for user ${authUser.id}`);
                     }
                   } catch (error) {
                     console.log(`⚠️ [COMMUNITY POSTS] Error creating profile for ${authUser.id}:`, error);
                   }
                 }
               }
             }
           }

      // Merge posts with profiles
      const postsWithProfiles = posts.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        return {
          ...post,
          profiles: userProfile ? {
            id: userProfile.id,
            display_name: userProfile.display_name || userProfile.name,
            username: userProfile.username || userProfile.email?.split('@')[0] || 'user',
            avatar_url: userProfile.profile_picture
          } : null
        };
      });

      console.log('✅ [COMMUNITY POSTS] Returning posts with profiles:', postsWithProfiles.length);
      return NextResponse.json({ success: true, data: postsWithProfiles });
    }

    console.log('✅ [COMMUNITY POSTS] No posts found, returning empty array');
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error('❌ [COMMUNITY POSTS] Error in GET /api/community/posts:', error);
    // Return empty array instead of error to prevent 500s
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [COMMUNITY POSTS] POST request received');
    
    // Validate configuration
    if (!finalSupabaseUrl || !finalSupabaseKey) {
      console.error('❌ [COMMUNITY POSTS] Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Check if Supabase is configured
    // Supabase is now configured with hardcoded values

    console.log('✅ [COMMUNITY POSTS] Supabase configured, creating client');
    const supabase = createClient(finalSupabaseUrl, finalSupabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('📝 [COMMUNITY POSTS] Parsing request body...');
    const body = await request.json();
    console.log('📦 [COMMUNITY POSTS] Request body:', JSON.stringify(body, null, 2));
    
    const { content, images, user_id } = body;
    console.log('🔍 [COMMUNITY POSTS] Extracted data:', { 
      content: content ? `${content.substring(0, 50)}...` : 'empty',
      images: images ? `${images.length} images` : 'no images',
      user_id: user_id ? `${user_id.substring(0, 8)}...` : 'missing'
    });

    if (!content && (!images || images.length === 0)) {
      console.log('❌ [COMMUNITY POSTS] Validation failed: No content or images provided');
      return NextResponse.json({ error: 'Content or images required' }, { status: 400 });
    }

    // Allow posts with just content, just images, or both
    const postContent = content || '';
    const postImages = images || [];
    console.log('✅ [COMMUNITY POSTS] Validation passed, preparing post data');

    if (!user_id) {
      console.log('❌ [COMMUNITY POSTS] Validation failed: No user_id provided');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('💾 [COMMUNITY POSTS] Attempting to insert post into database...');
    // Create the post
    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        user_id,
        content: postContent,
        images: postImages,
        likes_count: 0,
        reposts_count: 0,
        comments_count: 0
      })
      .select()
      .single();

    console.log('📊 [COMMUNITY POSTS] Database response:', { 
      success: !error, 
      error: error ? error.message : null,
      postId: post?.id || 'none'
    });

    if (error) {
      console.error('❌ [COMMUNITY POSTS] Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to create post', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('✅ [COMMUNITY POSTS] Post created successfully:', post.id);

    // Track analytics (optional, don't fail if this fails)
    try {
      console.log('📈 [COMMUNITY POSTS] Tracking analytics...');
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'community_post_created',
          user_id,
          metadata: {
            post_id: post.id,
            has_images: images && images.length > 0,
            image_count: images ? images.length : 0
          }
        });
      console.log('✅ [COMMUNITY POSTS] Analytics tracked successfully');
    } catch (analyticsError) {
      console.log('⚠️ [COMMUNITY POSTS] Analytics tracking failed, but post was created successfully');
    }

    console.log('🎉 [COMMUNITY POSTS] Returning success response');
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Error in POST /api/community/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(finalSupabaseUrl, finalSupabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');
    const userId = searchParams.get('user_id');

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Post ID and User ID required' }, { status: 400 });
    }

    // First, verify the user owns this post
    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this post' }, { status: 403 });
    }

    // Delete the post (cascade will handle related comments and interactions)
    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'community_post_deleted',
        user_id: userId,
        metadata: {
          post_id: postId
        }
      });

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/community/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
