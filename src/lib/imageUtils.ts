import { supabase } from './supabase';

/**
 * Get a signed URL for an image from Supabase storage
 * This ensures the image can be accessed even if the bucket is private
 */
export const getSignedImageUrl = async (imagePath: string): Promise<string> => {
  try {
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Extract bucket and path from the imagePath
    const pathParts = imagePath.split('/');
    const bucket = pathParts[0] || 'images';
    const fileName = pathParts.slice(1).join('/');

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      // Fallback to public URL
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      return publicData.publicUrl;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedImageUrl:', error);
    return imagePath; // Return original path as fallback
  }
};

/**
 * Check if an image URL is accessible
 */
export const checkImageAccessibility = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking image accessibility:', error);
    return false;
  }
};

/**
 * Get optimized image URL with fallback
 */
export const getOptimizedImageUrl = async (imagePath: string): Promise<string> => {
  try {
    // First try to get signed URL
    const signedUrl = await getSignedImageUrl(imagePath);
    
    // Check if the signed URL is accessible
    const isAccessible = await checkImageAccessibility(signedUrl);
    
    if (isAccessible) {
      return signedUrl;
    }
    
    // If signed URL fails, try public URL
    const pathParts = imagePath.split('/');
    const bucket = pathParts[0] || 'images';
    const fileName = pathParts.slice(1).join('/');
    
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    const isPublicAccessible = await checkImageAccessibility(publicData.publicUrl);
    
    if (isPublicAccessible) {
      return publicData.publicUrl;
    }
    
    // If all else fails, return placeholder
    return '/api/placeholder/400/400';
  } catch (error) {
    console.error('Error in getOptimizedImageUrl:', error);
    return '/api/placeholder/400/400';
  }
};

/**
 * Check if a URL is expired (for Runway URLs with JWT tokens)
 */
export const isUrlExpired = (imageUrl: string): boolean => {
  if (!imageUrl.includes('_jwt=')) {
    return false;
  }
  
  try {
    const jwtMatch = imageUrl.match(/_jwt=([^&]+)/);
    if (jwtMatch) {
      const jwtToken = jwtMatch[1];
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      
      return exp && exp < now;
    }
  } catch (error) {
    console.warn('Could not parse JWT token:', error);
  }
  
  return false;
};

/**
 * Get proxied image URL for CORS-problematic URLs
 */
export const getProxiedImageUrl = (imageUrl: string | null | undefined): string => {
  // Handle null/undefined cases
  if (!imageUrl) {
    return '/api/placeholder/400/400';
  }
  
  // Check if URL is expired
  if (isUrlExpired(imageUrl)) {
    console.log('🔒 URL is expired, using placeholder:', imageUrl);
    return '/api/placeholder/400/400?text=Image+Expired';
  }
  
  // Check if URL is from a CORS-problematic domain
  const corsProblematicDomains = [
    'dnznrvs05pmza.cloudfront.net',
    'cloudfront.net',
    'oss-cn-wulanchabu.aliyuncs.com'
  ];
  
  const isCorsProblematic = corsProblematicDomains.some(domain => 
    imageUrl.includes(domain)
  );
  
  if (isCorsProblematic) {
    // Use our image proxy to avoid CORS issues
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  
  return imageUrl;
};