import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper handling of Tesseract.js in serverless environments
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
  // Configure webpack to handle Tesseract.js properly
  webpack: (config, { webpack }) => {
    // Some versions of tesseract.js-core still reference the legacy ASM build.
    // Replace that import with the modern WASM shim so webpack can resolve it.
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /tesseract-core\.asm$/,
        "./tesseract-core.wasm.js"
      )
    );

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
