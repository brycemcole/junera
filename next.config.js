const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

// Explicitly check for production or manually set env
const isProduction = process.env.NODE_ENV === 'production' || process.env.RUN_AGENTS === 'true';

// Start the agent processor
if (isProduction) {
  require('./src/services/startup');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['corestore.blob.core.windows.net', 'logo.clearbit.com'],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        // Add any custom module resolutions if needed
      }
    }
  }
};

module.exports = withPWA(nextConfig);
