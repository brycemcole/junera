const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['corestore.blob.core.windows.net', 'logo.clearbit.com'],
  },
};

module.exports = withPWA(nextConfig);
