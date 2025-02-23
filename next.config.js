const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

// Explicitly check for production or manually set env
const isProduction = process.env.NODE_ENV === 'production' || process.env.RUN_AGENTS === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['corestore.blob.core.windows.net', 'logo.clearbit.com', 'avatars.githubusercontent.com'],
  },
  experimental: {
    instrumentation: true,
    turbo: {
      resolveAlias: {
        // Add any custom module resolutions if needed
      }
    }
  },
  onDemandEntries: {
    // Configure page buffer period and size
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
};

if (isProduction) {
  nextConfig.webpack = (config, { isServer }) => {
    return config;
  };
}

module.exports = withPWA(nextConfig);
