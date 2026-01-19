/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better error handling
  transpilePackages: ['firebase', 'undici'],
  reactStrictMode: true,

  // Ensure Tailwind CSS is processed
  experimental: {
    // appDir is enabled by default in Next.js 14
  },
}

export default nextConfig