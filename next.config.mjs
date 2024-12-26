import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  images: {
    domains: ['corestore.blob.core.windows.net', 'logo.clearbit.com'],
  },
  pwa: {
    dest: 'public', // Output directory for the service worker and other PWA files
    register: true, // Automatically register the service worker
    skipWaiting: true, // Skip waiting for old service worker to deactivate
  },
});

export default nextConfig;
