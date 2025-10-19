import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper handling of Tesseract.js in serverless environments
  serverExternalPackages: ["tesseract.js"],
  // Include Tesseract.js-core WASM files in serverless bundle
  outputFileTracingIncludes: {
    "/api/verify": [
      "./node_modules/tesseract.js-core/**/*.wasm",
      "./node_modules/tesseract.js-core/**/*.js",
    ],
  },
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
};

export default nextConfig;
