# TTB Label Verification App

A web application that verifies alcohol beverage labels against TTB application form data using Google's Gemini AI with multimodal vision capabilities.

**Live Demo:** [https://usdt-label-verifier-code-challenge.vercel.app](https://usdt-label-verifier-code-challenge.vercel.app)

## Quick Start

```bash
npm install

# Set up Google AI API key
cp .env.local.example .env.local
# Edit .env.local and add your Google AI API key

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (60 requests/min, 1500 requests/day on free tier).

## How It Works

The application uses **Gemini 2.5 Pro**, Google's advanced multimodal AI model, for end-to-end label verification:

1. **Image Analysis**: Gemini's vision capabilities extract text from the label at any orientation
2. **Intelligent Matching**: The model compares extracted text against form data with contextual understanding
3. **Bounding Box Detection**: Returns precise coordinates for each detected field on the label
4. **Structured Output**: Delivers verification results in a consistent JSON format

**Key Benefits:**
- **Simple Architecture**: Single API call handles OCR, text extraction, and verification
- **High Accuracy**: Native support for rotated text, contextual understanding, and OCR error correction
- **Visual Feedback**: Bounding boxes highlight detected fields on the label
- **Easy Maintenance**: Update behavior by modifying prompts, not code

---

## Features Implemented

### Core Requirements

- Web form for TTB label application data (brand name, product type, alcohol content, net contents)
- Image upload with validation (JPEG, PNG, WebP up to 5MB)
- AI-powered vision and OCR using Gemini 2.5 Pro
- Text extraction and comparison with form data
- Verification results with match/mismatch status
- Government warning detection
- Error handling for unreadable images and validation failures

### Bonus Features

- **Visual Bounding Boxes**: Canvas overlay showing precise locations where each field was detected
- **Multi-Orientation Support**: Handles text at any angle (0°, 90°, 180°, 270°) including vertical government warnings
- **Alcohol Type Validation**: Type-specific ABV ranges (e.g., cider 0.5-8.5%, spirits 2.5-95%)
- **Fuzzy Matching**: Tolerates OCR variations and formatting differences
- **Accessible UI**: WCAG 2.1 AA compliant using USWDS design system

## Technology Choices

**Next.js 15 + TypeScript**

- Server-side processing keeps client bundle small
- API routes provide backend without separate server setup
- TypeScript ensures type safety across the stack

**Google Gemini 2.5 Pro**

- Multimodal AI with advanced vision and OCR capabilities
- Native bounding box detection for visual feedback
- Handles text at any orientation without preprocessing
- Single API call (~20-25 seconds) for complete verification
- Cost-effective: ~$0.001 per verification (free tier: 1500/day)

**US Web Design System (USWDS)**

- Government-standard design appropriate for TTB simulation
- Built-in accessibility compliance (WCAG 2.1 AA)
- Professional appearance without custom design work

## Implementation Approach

### AI-Powered Verification

The application uses Gemini 2.5 Pro's multimodal capabilities for comprehensive label analysis:

**Prompt Engineering**

A structured prompt instructs the model to:
- Extract all text from the label image (handles any orientation natively)
- Compare extracted values against expected form data
- Apply TTB-specific validation rules (tolerances, format variations)
- Return structured JSON with verification results and bounding boxes

**Matching Rules Encoded in Prompt**

- **Brand Name**: Case-insensitive exact match
- **Product Type**: Exact match with common variations
- **Alcohol Content**: ±0.5% exact tolerance, ±2% loose tolerance, handles "ABV", "Alc./Vol.", and "Proof" formats
- **Net Contents**: 2% volume tolerance, unit conversion (mL, oz, L)
- **Government Warning**: Phrase detection ("GOVERNMENT WARNING", "Surgeon General", "pregnancy", etc.), requires 60% match

**Bounding Box Detection**

Gemini returns bounding boxes in normalized coordinates [ymin, xmin, ymax, xmax] on a 0-1000 scale:
1. Model identifies text regions for each field
2. Coordinates are scaled to actual image dimensions
3. Frontend renders boxes on canvas overlay with field-specific colors

**Performance**

- ~20-25 seconds per verification (primarily model inference time)
- Gemini 2.5 Pro significantly outperforms Flash for complex prompts with vision + reasoning
- Benchmark: Pro is 47.5% faster than Flash for this task (23s vs 45s)

## Testing

```bash
npm test              # Run test suite
npm run test:watch    # Watch mode for development

# Performance benchmarking
npx tsx scripts/race-models.ts    # Compare Gemini Pro vs Flash
```

Test coverage includes:

- Form validation with alcohol type-specific rules
- Text matching fallback logic (for legacy mode)
- Bounding box coordinate transformations
- End-to-end verification flow

Sample test images in `__tests__/labels/`:

- Distilled spirits with vertical government warning
- Import labels with multi-line text
- Beer labels at various orientations

## Configuration

Matching thresholds in `lib/constants.ts`:

```typescript
export const DEFAULT_MATCHING_CONFIG = {
  brandName: {
    fuzzyMatchThreshold: 80, // 80% similarity required
    wordMatchThreshold: 75, // 75% of words must match
  },
  productType: {
    fuzzyMatchThreshold: 70, // More lenient for variations
  },
  alcoholContent: {
    exactTolerance: 0.5, // ±0.5% for exact match
    looseTolerance: 2.0, // ±2% flags as mismatch but acknowledges detection
  },
  netContents: {
    volumeTolerance: 0.02, // 2% variance allowed
  },
};
```

## Project Structure

```
app/
├── api/verify/route.ts          # AI verification endpoint
├── verify/page.tsx              # Main verification page
└── page.tsx                     # Landing page

components/verification/
├── LabelForm.tsx                # Form with alcohol type dropdown
├── ImageUpload.tsx              # Drag-and-drop with preview
├── VerificationResults.tsx      # Results display
└── LabelCanvas.tsx              # Bounding box visualization

lib/
├── llm-verifier.ts              # Gemini 2.5 Pro integration
├── prompts.ts                   # Verification prompt templates
├── validation.ts                # Input validation with type-specific rules
└── constants.ts                 # TTB requirements and config

scripts/
└── race-models.ts               # Performance benchmarking tool

__tests__/
├── validation.test.ts           # Validation tests
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

- Requires `GOOGLE_GENAI_API_KEY` environment variable
- Server-side API routes handle Gemini integration
- Optimized for serverless functions

```bash
npm run build    # Production build
npm start        # Start server
```

Set environment variables in Vercel dashboard:
```
GOOGLE_GENAI_API_KEY=your_api_key_here
```

## Design Decisions

**Why Gemini 2.5 Pro over traditional OCR?**

- **Simplicity**: Single API call vs complex multi-step pipeline
- **Accuracy**: Native multi-orientation support, contextual understanding, OCR error correction
- **Maintainability**: Update behavior via prompts instead of code
- **Bounding Boxes**: Native region detection without complex coordinate transformations
- **Trade-off**: Requires internet connection and API key, ~20-25 second latency

**Why Pro instead of Flash?**

- Benchmark testing showed Pro is 47.5% faster for this complex vision + reasoning task (23s vs 45s)
- Flash is optimized for simple, high-volume tasks; Pro excels at complex prompts
- Pro provides more accurate bounding boxes

**Why server-side processing?**

- Protects API keys from client exposure
- Consistent environment for image processing
- Smaller client bundle

**Why USWDS?**

- Appropriate design system for government application simulation
- Accessibility built-in (WCAG 2.1 AA compliant)
- Professional appearance without custom design work

## Documentation

- `docs/project-requirements.md` - Original project specification
- `docs/alcohol-type-requirements.md` - TTB labeling requirements by beverage type
- Inline JSDoc comments on all major functions
- TypeScript interfaces document data structures

---

**Tech Stack:** Next.js 15 • TypeScript 5 • Google Gemini 2.5 Pro • USWDS 3.13 • Vercel
