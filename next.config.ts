import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kept for easy revert to `next/image` on storefront components.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
