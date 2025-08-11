/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    legacyBrowsers: false,
  },

  // Configure headers for file downloads
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Configure API routes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '50mb',
  },

  // Webpack configuration for handling large JSON files
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add support for large file processing
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'json-to-zip-converter',
  },

  // Optimize images and static assets
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },

  // Redirect configuration
  async redirects() {
    return [];
  },

  // Rewrite configuration for clean URLs
  async rewrites() {
    return [];
  },

  // Compress responses
  compress: true,

  // PoweredBy header removal for security
  poweredByHeader: false,

  // Trailing slash handling
  trailingSlash: false,

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;