/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true } // Necessário para SSG
};

export default nextConfig;
