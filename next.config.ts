import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Allow dev HMR when using local hostname overrides (hosts → 127.0.0.1). See nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins */
  allowedDevOrigins: ["vorton.az", "vorton.uk"],
  // Kept for easy revert to `next/image` on storefront components.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
