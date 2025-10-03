/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Allow cross-origin requests from local network during development
  allowedDevOrigins: [
    '10.0.0.14', // Your local network IP
    'localhost',
    '127.0.0.1',
  ],
  // Add security headers to fix CSP font loading issues
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://m.stripe.network",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com https://m.stripe.network data:",
              "img-src 'self' data: https: blob:",
              "media-src 'self' data: https: blob: https://api.minimax.io https://cdn.fal.ai https://v3.fal.media https://v3b.fal.media https://*.fal.media https://storage.googleapis.com https://s3.amazonaws.com https://cdn.runwayml.com https://public-cdn-video-data-algeng.oss-cn-wulanchabu.aliyuncs.com https://dnznrvs05pmza.cloudfront.net https://*.cloudfront.net",
              "connect-src 'self' https://api.stripe.com https://vqmzepfbgbwtzbpmrevx.supabase.co https://*.supabase.co https://api.minimax.io https://cdn.fal.ai https://v3.fal.media https://v3b.fal.media https://*.fal.media https://storage.googleapis.com https://s3.amazonaws.com https://cdn.runwayml.com https://api.anthropic.com https://dnznrvs05pmza.cloudfront.net https://*.cloudfront.net",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  webpack: (config) => {
    // Exclude Supabase Edge Functions from Next.js build
    config.externals = config.externals || [];
    config.externals.push({
      'supabase/functions': 'commonjs supabase/functions',
    });
    return config;
  },
}

module.exports = nextConfig
