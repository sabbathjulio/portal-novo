// Trigger build for Vercel
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true } // Necessário para SSG
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
