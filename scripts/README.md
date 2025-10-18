# Build Scripts

This directory contains build-time scripts for the TTB Label Verification application.

## copy-tesseract-assets.js

Copies Tesseract.js assets from `node_modules` to `public/tesseract-bundled/` for local bundling.

**Purpose**: Eliminates CDN dependencies by bundling Tesseract.js files locally.

**Files copied**:

- `worker.min.js` - Tesseract.js worker script
- `tesseract-core-simd.wasm.js` - SIMD-optimized WASM loader
- `tesseract-core-simd.wasm` - SIMD-optimized WASM binary
- `tesseract-core-lstm.wasm.js` - LSTM WASM loader (fallback)
- `tesseract-core-lstm.wasm` - LSTM WASM binary (fallback)

**Usage**:

```bash
# Run manually
pnpm run copy-tesseract

# Runs automatically during build
pnpm run build
```

**Why this approach**:

- ✅ No external CDN dependencies
- ✅ Works offline
- ✅ Faster loading (no network requests)
- ✅ More reliable in serverless environments
- ✅ Consistent with your application's deployment
