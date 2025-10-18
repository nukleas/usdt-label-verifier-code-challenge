import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper handling of Tesseract.js in serverless environments
  serverExternalPackages: ["tesseract.js"],
  // Configure webpack to handle Tesseract.js properly
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Tesseract.js worker files from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        "tesseract.js": "tesseract.js",
      });
    }
    return config;
  },
};

export default nextConfig;
