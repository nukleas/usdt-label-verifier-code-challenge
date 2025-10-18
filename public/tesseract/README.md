# Tesseract OCR Files

This directory contains self-contained Tesseract.js files required for OCR processing.

**IMPORTANT:** These files must be committed to version control to ensure the application is fully self-contained and does not rely on external CDNs.

## Files

- `worker.min.js` - Tesseract worker script (109KB)
- `tesseract-core-lstm.wasm.js` - Core WASM engine (3.8MB)
- `eng.traineddata` - English language training data (22MB)

## Why Self-Contained?

As a government application, we must:
- ✅ Not depend on external CDN availability
- ✅ Ensure security by controlling all dependencies
- ✅ Maintain functionality in air-gapped environments
- ✅ Meet compliance requirements for self-hosted solutions

## Source

These files are from:
- `tesseract.js` npm package (v6.0.1)
- `tesseract.js-core` npm package (v6.0.0)
- Tesseract OCR training data repository

## Updates

To update these files:

```bash
# Copy latest worker
cp node_modules/tesseract.js/dist/worker.min.js public/tesseract/

# Copy latest core
cp node_modules/.pnpm/tesseract.js-core@*/node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js public/tesseract/

# Download latest English training data
curl -L https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata -o public/tesseract/eng.traineddata
```
