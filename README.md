# TTB Label Verification App

A web application that verifies alcohol beverage labels against TTB application form data using OCR and text matching algorithms.

**Live Demo:** [https://usdt-label-verifier-code-challenge.vercel.app](https://usdt-label-verifier-code-challenge.vercel.app)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features Implemented

### Core Requirements
- Web form for TTB label application data (brand name, product type, alcohol content, net contents)
- Image upload with validation (JPEG, PNG, WebP up to 5MB)
- Server-side OCR using Tesseract.js
- Text extraction and comparison with form data
- Verification results with match/mismatch status
- Government warning detection
- Error handling for unreadable images and validation failures

### Bonus Features
- **Multi-rotation OCR**: Processes images at 0°, 90°, 180°, 270° to detect vertical/sideways text (common on label sides for government warnings)
- **Visual bounding boxes**: Canvas overlay showing where each field was detected on the label
- **Alcohol type validation**: Type-specific ABV ranges (e.g., cider 0.5-8.5%, spirits 2.5-95%)
- **Automated testing**: 78 passing tests covering text matching, OCR integration, and validation logic
- **Accessible UI**: WCAG 2.1 AA compliant using USWDS design system

## Technology Choices

**Next.js 15 + TypeScript**
- Server-side OCR keeps client bundle small
- API routes provide backend without separate server setup
- TypeScript ensures type safety across 2,500+ lines of code

**Tesseract.js**
- Open source OCR with no API costs or rate limits
- Processes printed text using LSTM neural network
- Runs server-side in Node.js

**US Web Design System (USWDS)**
- Government-standard design appropriate for TTB simulation
- Built-in accessibility compliance
- Professional appearance without custom design work

## Implementation Approach

### OCR Processing

The main challenge was handling text at various orientations on a single label. Government warnings are often printed vertically on label sides, which standard OCR misses.

Solution: Process each image at four rotations (0°, 90°, 180°, 270°), select the best primary orientation based on word count and confidence, then merge text from all rotations. This allows detecting both horizontal brand names and vertical warnings on the same label.

### Text Matching Algorithms

Each field uses different matching strategies based on TTB requirements:

**Brand Name**
- Exact substring match (case-insensitive)
- Fuzzy match using Levenshtein distance (80% threshold)
- Word-by-word matching for partial matches
- Prefers larger text near top of label for bounding box detection

**Alcohol Content**
- Priority 1: "Alc./Vol." patterns (official TTB format)
- Priority 2: "ABV" patterns
- Priority 3: Proof conversion (Proof ÷ 2 = ABV)
- Priority 4: Generic percentage patterns with range validation
- ±0.5% tolerance for exact match, ±2% for loose match

**Net Contents**
- Unit conversion (mL, oz, L → common unit)
- 2% volume tolerance for manufacturing variance
- Handles formats like "750ml", "750 mL", "12 oz", "12 FL OZ"

**Government Warning**
- Detects required phrases: "GOVERNMENT WARNING", "Surgeon General", "pregnancy", "birth defects", "impairs", "health problems"
- At least 60% of phrases must be present
- Cross-rotation detection for vertical text

### Bounding Box Visualization

Tesseract provides word-level coordinates. The system:
1. Extracts text with bounding boxes from all rotations
2. Matches text patterns and collects corresponding boxes
3. Merges adjacent boxes for multi-word phrases
4. Transforms coordinates from rotated space back to original orientation
5. Renders highlights on canvas overlay

## Testing

```bash
npm test              # Run all 78 tests
npm run test:watch    # Watch mode for development
```

Test coverage includes:
- Text matching algorithms (exact, fuzzy, pattern-based)
- Levenshtein distance calculations
- Bounding box merging and deduplication
- Form validation with alcohol type-specific rules
- OCR integration with sample label images
- End-to-end verification flow

Sample test images in `__tests__/labels/`:
- Distilled spirits with vertical government warning
- Import label with multi-line text
- Beer label testing rotation detection

## Configuration

Matching thresholds in `lib/constants.ts`:

```typescript
export const DEFAULT_MATCHING_CONFIG = {
  brandName: {
    fuzzyMatchThreshold: 80,  // 80% similarity required
    wordMatchThreshold: 75,   // 75% of words must match
  },
  productType: {
    fuzzyMatchThreshold: 70,  // More lenient for variations
  },
  alcoholContent: {
    exactTolerance: 0.5,      // ±0.5% for exact match
    looseTolerance: 2.0,      // ±2% flags as mismatch but acknowledges detection
  },
  netContents: {
    volumeTolerance: 0.02,    // 2% variance allowed
  },
};
```

## Project Structure

```
app/
├── api/verify/route.ts          # OCR verification endpoint
├── verify/page.tsx              # Main verification page
└── page.tsx                     # Landing page

components/verification/
├── LabelForm.tsx                # Form with alcohol type dropdown
├── ImageUpload.tsx              # Drag-and-drop with preview
├── VerificationResults.tsx      # Results display
└── LabelCanvas.tsx              # Bounding box visualization

lib/
├── ocr-server.ts                # Multi-rotation OCR processing
├── textMatching.ts              # Matching algorithms
├── bboxMatching.ts              # Bounding box utilities
├── validation.ts                # Input validation with type-specific rules
└── constants.ts                 # TTB requirements and config

__tests__/
├── textMatching.test.ts         # Core matching logic tests
├── bboxMatching.test.ts         # Bounding box tests
├── validation.test.ts           # Validation tests
├── ocr-server.test.ts           # OCR integration tests
└── labels/                      # Sample test images
```

## API

**POST /api/verify**

Request (multipart/form-data):
```
brandName: "Old Tom Distillery"
alcoholType: "distilled-spirits"
productType: "Kentucky Straight Bourbon Whiskey"
alcoholContent: "45"
netContents: "750 mL"
image: <File>
```

Response:
```json
{
  "success": true,
  "result": {
    "overallStatus": "pass",
    "fields": [
      {
        "field": "brandName",
        "status": "match",
        "expected": "Old Tom Distillery",
        "found": "Old Tom Distillery",
        "confidence": 100,
        "message": "Brand name matches label"
      }
    ],
    "rawOCRText": "...",
    "processingTime": 2341,
    "ocrConfidence": 92
  }
}
```

## Assumptions & Limitations

**Assumptions:**
- Images are reasonably clear and well-lit (tested with typical label photos)
- English text only
- Standard image formats (JPEG, PNG, WebP)
- No database needed (stateless verification)

**Limitations:**
- OCR accuracy depends on image quality
- No batch processing (one label at a time)
- Government warning detection checks for key phrases, not exact word-for-word match (as specified in requirements)
- No image preprocessing (contrast enhancement, de-skewing)

**If given more time, I would add:**
- Image preprocessing for low-quality photos
- Exact government warning text validation
- Field of vision validation (verify fields appear on same side)
- Batch processing for multiple labels
- PDF report export

## Deployment

Deployed to Vercel with automatic deployments on push:
- No environment variables required (self-contained)
- Tesseract.js WASM files included in bundle via `next.config.ts`
- Server-side rendering for OCR processing

```bash
npm run build    # Production build
npm start        # Start server
```

## Design Decisions

**Why server-side OCR?**
- Smaller client bundle (Tesseract not shipped to browser)
- Consistent Node.js environment
- Better performance using server CPU
- Trade-off: Slight network latency (acceptable for ~2-3 second processing time)

**Why multi-rotation processing?**
- Real-world labels have vertical text (especially government warnings)
- Standard OCR at 0° misses 90° text entirely
- Processing all rotations and merging results catches text at any orientation
- Adds ~1 second to processing time but significantly improves accuracy

**Why USWDS?**
- Appropriate for government application simulation
- Accessibility built-in (WCAG 2.1 AA compliant)
- Professional appearance without design work

## Documentation

- `docs/project-requirements.md` - Original project specification
- `docs/alcohol-type-requirements.md` - TTB labeling requirements by beverage type
- Inline JSDoc comments on all major functions
- TypeScript interfaces document data structures

---

**Tech Stack:** Next.js 15 • TypeScript 5 • Tesseract.js 6 • USWDS 3.13 • Jest • Vercel
