import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { 
  checkUserGenerationPermission, 
  deductCreditsForGeneration,
  checkLowBalanceNotification 
} from '@/lib/creditEnforcementService';
import { supabaseAdmin } from '@/lib/supabase';

// Function to upload image using Fal AI client's built-in upload
async function uploadImageToTempUrl(base64Data: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const file = new File([buffer], 'image.jpg', { type: 'image/jpeg' });
    const url = await fal.storage.upload(file);
    console.log(`✅ Uploaded image to Fal AI: ${url}`);
    return url;
  } catch (error) {
    console.error('❌ Failed to upload image to Fal AI:', error);
    const dataUri = `data:image/jpeg;base64,${base64Data}`;
    console.log(`⚠️ Using data URI directly: ${dataUri.substring(0, 50)}...`);
    return dataUri;
  }
}

export async function POST(request: NextRequest) {
  console.log('\n🎃 ===== HALLOWEEN ME API REQUEST START =====');
  console.log('🎃 API Route: /api/halloween-me - Request received');
  console.log('🎃 Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    const { images, generationSettings } = body;
    
    console.log('🎃 Request body parsed successfully');
    console.log('🎃 Images count:', images?.length || 0);
    console.log('🎃 Generation settings:', generationSettings);
    
    // Validate we have exactly 2 images
    if (!images || images.length !== 2) {
      return NextResponse.json({
        success: false,
        error: 'Halloween Me requires exactly 2 images'
      }, { status: 400 });
    }
    
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authorization required'
      }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin!.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication'
      }, { status: 401 });
    }
    
    console.log('🎃 User authenticated:', user.id);
    
    // Check user's credit permission
    const creditCheck = await checkUserGenerationPermission(user.id, 'fal-ai/nano-banana/edit');
    
    if (!creditCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: creditCheck.message,
        reason: creditCheck.reason
      }, { status: 402 });
    }
    
    console.log('🎃 Credit check passed');
    
    // Upload images to FAL AI
    console.log('🎃 Uploading images to FAL AI...');
    const imageUrls = await Promise.all(
      images.map(async (imageData: string, index: number) => {
        const url = await uploadImageToTempUrl(imageData);
        console.log(`🎃 Image ${index + 1} uploaded: ${url}`);
        return url;
      })
    );
    
    // The exact prompt for Halloween Me - simplified for Gemini compatibility
    const halloweenPrompt = "Transform the first character into a Halloween costume style inspired by the second character";
    
    console.log('🎃 Using exact Halloween Me prompt:', halloweenPrompt);
    console.log('🎃 Image URLs:', imageUrls);
    
    // Call Nano Banana with the exact prompt
    const falInput = {
      prompt: halloweenPrompt,
      image_urls: imageUrls,
      num_images: 1,
      output_format: "jpeg",
      sync_mode: false
    };
    
    console.log('🎃 FAL AI input:', JSON.stringify(falInput, null, 2));
    
    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: falInput,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`🎃 Generation progress:`, update.logs?.map(log => log.message).join(', '));
        }
      },
    }).catch(error => {
      console.error('💥 ===== HALLOWEEN ME API ERROR =====');
      console.error('💥 Error:', error);
      console.error('💥 Error details:', JSON.stringify(error, null, 2));
      console.error('💥 ===== END HALLOWEEN ME API ERROR =====');
      throw error;
    });
    
    console.log('🎃 FAL AI response:', JSON.stringify(result, null, 2));
    
    const imageUrl = result.data.images[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }
    
    console.log('🎃 Halloween Me generated successfully:', imageUrl);
    
    // Deduct credits
    const creditDeduction = await deductCreditsForGeneration(user.id, 'fal-ai/nano-banana/edit');
    
    if (!creditDeduction.success) {
      console.error('❌ Credit deduction failed:', creditDeduction.error);
    } else {
      console.log(`✅ Credits deducted: ${creditDeduction.creditsUsed}`);
      await checkLowBalanceNotification(user.id);
    }
    
    console.log('🎃 ===== HALLOWEEN ME API REQUEST COMPLETE =====\n');
    
    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      metadata: {
        creditsUsed: creditDeduction.creditsUsed,
        remainingBalance: creditDeduction.remainingBalance
      }
    });
    
  } catch (error) {
    console.error('\n💥 ===== HALLOWEEN ME API ERROR =====');
    console.error('💥 Error:', error);
    console.error('💥 ===== END HALLOWEEN ME API ERROR =====\n');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Halloween Me generation failed'
    }, { status: 500 });
  }
}
