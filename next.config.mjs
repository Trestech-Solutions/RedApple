/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimised images: product photos are resized to the slot they render in
    // (cards use ~104–160px) and served as AVIF/WebP, instead of shipping the
    // full-size upload to every phone.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 160, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    // Tree-shake icon libraries so only the icons actually used are bundled.
    optimizePackageImports: ['lucide-react', '@iconify/react', 'framer-motion'],
  },
}

export default nextConfig
