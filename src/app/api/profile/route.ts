import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Profile API GET request received');
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseAdminAvailable: !!supabaseAdmin
    });
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token extracted, length:', token.length);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Auth error or no user:', authError?.message || 'No user');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get user profile from database using admin client
    console.log('📊 Fetching user profile from database...');
    const client = supabaseAdmin || supabase;
    const { data: profile, error: profileError } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    console.log('📊 Profile found:', profile ? 'Yes' : 'No');

    // Get user's gallery data
    console.log('🖼️ Fetching user gallery...');
    console.log('🔍 [GALLERY DEBUG] User ID:', user.id);
    console.log('🔍 [GALLERY DEBUG] User email:', user.email);
    
    // Create a user-authenticated client for gallery query
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: gallery, error: galleryError } = await userClient
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (galleryError) {
      console.error('❌ Error fetching gallery:', galleryError);
      console.error('❌ [GALLERY DEBUG] Gallery error details:', {
        message: galleryError.message,
        code: galleryError.code,
        details: galleryError.details,
        hint: galleryError.hint
      });
      // Don't fail the entire request if gallery fetch fails
    } else {
      console.log('🖼️ Gallery items found:', gallery?.length || 0);
      console.log('🔍 [GALLERY DEBUG] Gallery query successful:', {
        user_id: user.id,
        items_count: gallery?.length || 0,
        first_item_id: gallery?.[0]?.id || 'none',
        last_item_id: gallery?.[gallery.length - 1]?.id || 'none',
        timestamp: new Date().toISOString()
      });
      
      if (gallery && gallery.length === 0) {
        console.log('⚠️ [GALLERY DEBUG] Fetching user gallery but gallery items found is zero - this may indicate a database issue or RLS policy problem');
        
        // Let's also check if there are any gallery items at all for this user (bypassing RLS)
        console.log('🔍 [GALLERY DEBUG] Checking total gallery count for user...');
        if (!supabaseAdmin) {
          console.error('❌ [GALLERY DEBUG] SupabaseAdmin not available for admin query');
        } else {
          const { data: totalGallery, error: totalError } = await supabaseAdmin
            .from('galleries')
            .select('id, user_id, created_at')
            .eq('user_id', user.id);
          
          if (totalError) {
            console.error('❌ [GALLERY DEBUG] Error checking total gallery count:', totalError);
          } else {
            console.log('🔍 [GALLERY DEBUG] Total gallery items (admin query):', totalGallery?.length || 0);
            if (totalGallery && totalGallery.length > 0) {
              console.log('⚠️ [GALLERY DEBUG] RLS POLICY ISSUE DETECTED: Admin query found items but user query returned zero');
              console.log('🔍 [GALLERY DEBUG] Sample items:', totalGallery.slice(0, 3).map(item => ({
                id: item.id,
                user_id: item.user_id,
                created_at: item.created_at
              })));
            }
          }
        }
      }
    }

    // If no profile exists, create a default one
    if (!profile) {
      const defaultProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        username: user.email?.split('@')[0]?.toLowerCase().replace(/\s+/g, '_') || 'user',
        bio: 'AI enthusiast and creative explorer',
        profile_picture: null,
        social_links: {
          twitter: '',
          instagram: '',
          website: ''
        },
        background_image: null,
        preferences: {
          defaultModel: 'runway-t2i',
          defaultStyle: 'realistic',
          notifications: true,
          publicProfile: false,
          toastyNotifications: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create a user-authenticated client for profile creation
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      
      const { data: newProfile, error: insertError } = await userClient
        .from('users')
        .insert(defaultProfile)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      console.log('✅ Created new profile and returning response');
      return NextResponse.json({ profile: newProfile, gallery: gallery || [] });
    }

    console.log('✅ Returning existing profile response');
    return NextResponse.json({ profile, gallery: gallery || [] });
  } catch (error) {
    console.error('❌ Profile API error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, profile_picture, bio, social_links, preferences, background_image, display_name, username } = body;

    // Update user profile in database
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (username !== undefined) updateData.username = username;
    if (profile_picture !== undefined) updateData.profile_picture = profile_picture;
    if (bio !== undefined) updateData.bio = bio;
    if (social_links !== undefined) updateData.social_links = social_links;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (background_image !== undefined) updateData.background_image = background_image;

    console.log('Updating profile with data:', updateData);

    // First, check if profile exists using admin client
    const client = supabaseAdmin || supabase;
    const { data: existingProfile, error: fetchError } = await client
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    let updatedProfile;
    let updateError;

    if (fetchError && fetchError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('Profile does not exist, creating new profile for user:', user.id);
      
      const newProfileData = {
        id: user.id,
        email: user.email,
        name: name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        display_name: display_name || name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        username: username || user.email?.split('@')[0]?.toLowerCase().replace(/\s+/g, '_') || 'user',
        profile_picture: profile_picture || null,
        bio: bio || 'AI enthusiast and creative explorer',
        social_links: social_links || {
          twitter: '',
          instagram: '',
          website: ''
        },
        preferences: preferences || {
          defaultModel: 'runway-t2i',
          defaultStyle: 'realistic',
          notifications: true,
          publicProfile: false,
          toastyNotifications: true
        },
        background_image: background_image || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create a user-authenticated client for profile creation
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      
      const { data: createdProfile, error: createError } = await userClient
        .from('users')
        .insert(newProfileData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({ 
          error: 'Failed to create profile', 
          details: createError.message,
          code: createError.code 
        }, { status: 500 });
      }

      updatedProfile = createdProfile;
    } else if (fetchError) {
      console.error('Error checking profile existence:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to check profile', 
        details: fetchError.message,
        code: fetchError.code 
      }, { status: 500 });
    } else {
      // Profile exists, update it using admin client, fallback to regular client
      const client = supabaseAdmin || supabase;
      const { data: updated, error: updateErr } = await client
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Error updating profile:', updateErr);
        console.error('Update data that failed:', updateData);
        console.error('User ID:', user.id);
        return NextResponse.json({ 
          error: 'Failed to update profile', 
          details: updateErr.message,
          code: updateErr.code 
        }, { status: 500 });
      }

      updatedProfile = updated;
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    console.error('❌ Update error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}