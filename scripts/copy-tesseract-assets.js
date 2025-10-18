#!/usr/bin/env node

/**
 * Copy Tesseract.js assets to public directory for local bundling
 * This eliminates the need for CDN dependencies in serverless environments
 */

const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "../node_modules/.pnpm");
const targetDir = path.join(__dirname, "../public/tesseract-bundled");

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Files to copy from tesseract.js
const tesseractFiles = [
  "tesseract.js@6.0.1/node_modules/tesseract.js/dist/worker.min.js",
  "tesseract.js@6.0.1/node_modules/tesseract.js/dist/tesseract.min.js",
];

// Files to copy from tesseract.js-core
const coreFiles = [
  "tesseract.js-core@6.0.0/node_modules/tesseract.js-core/tesseract-core-simd.wasm.js",
  "tesseract.js-core@6.0.0/node_modules/tesseract.js-core/tesseract-core-simd.wasm",
  "tesseract.js-core@6.0.0/node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js",
  "tesseract.js-core@6.0.0/node_modules/tesseract.js-core/tesseract-core-lstm.wasm",
];

console.log("Copying Tesseract.js assets for local bundling...");

// Copy tesseract.js files
tesseractFiles.forEach((file) => {
  const sourcePath = path.join(sourceDir, file);
  const fileName = path.basename(file);
  const targetPath = path.join(targetDir, fileName);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✓ Copied ${fileName}`);
  } else {
    console.warn(`⚠ File not found: ${sourcePath}`);
  }
});

// Copy tesseract.js-core files
coreFiles.forEach((file) => {
  const sourcePath = path.join(sourceDir, file);
  const fileName = path.basename(file);
  const targetPath = path.join(targetDir, fileName);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✓ Copied ${fileName}`);
  } else {
    console.warn(`⚠ File not found: ${sourcePath}`);
  }
});

// Copy language data if available
const langSource = path.join(
  sourceDir,
  "tesseract.js@6.0.1/node_modules/tesseract.js/src/traineddata"
);
const langTarget = path.join(targetDir, "traineddata");

if (fs.existsSync(langSource)) {
  if (!fs.existsSync(langTarget)) {
    fs.mkdirSync(langTarget, { recursive: true });
  }

  // Copy eng.traineddata if it exists
  const engSource = path.join(langSource, "eng.traineddata");
  const engTarget = path.join(langTarget, "eng.traineddata");

  if (fs.existsSync(engSource)) {
    fs.copyFileSync(engSource, engTarget);
    console.log("✓ Copied eng.traineddata");
  }
}

console.log("\n🎉 Tesseract.js assets copied successfully!");
console.log("📁 Files are now available in public/tesseract-bundled/");
console.log("🔧 Update your OCR configuration to use these local files.");
