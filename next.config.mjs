import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to silence the warning
  turbopack: {},
};

// Only apply PWA wrapper in production builds
export default process.env.NODE_ENV === 'production' 
  ? withPWA(nextConfig) 
  : nextConfig;