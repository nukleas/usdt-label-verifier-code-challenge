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
  // Ensure WASM files are served with correct MIME type
  async headers() {
    return [
      {
        source: "/tesseract-bundled/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
