import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb",
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/affiliate",
        destination: "https://affiliate.taxcomppro.com",
        permanent: false,
      },
      {
        source: "/affiliate/:path*",
        destination: "https://affiliate.taxcomppro.com/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
