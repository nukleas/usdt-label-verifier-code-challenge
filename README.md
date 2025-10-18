# TTB Label Verification App

Automated Alcohol Label Verification System for TTB Compliance

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![USWDS](https://img.shields.io/badge/USWDS-3.13-005ea2)](https://designsystem.digital.gov/)
[![Tesseract.js](https://img.shields.io/badge/Tesseract.js-6.0-green)](https://tesseract.projectnaptha.com/)

## Overview

This application simulates a simplified version of the **Alcohol and Tobacco Tax and Trade Bureau (TTB)** label approval process. It uses OCR (Optical Character Recognition) and text matching algorithms to verify that information on an alcohol label matches the data submitted in an application form.

**Live Demo:** [Deployed URL](#) _(Add your Vercel URL here)_

## Features

### Core Features (Required)
✅ **Form Input:** USWDS-compliant form for entering label information
✅ **Image Upload:** Drag-and-drop or file selection with preview
✅ **OCR Processing:** Tesseract.js for server-side text extraction
✅ **Fuzzy Matching:** Text comparison algorithms with configurable thresholds
✅ **Detailed Results:** Field-by-field verification with confidence scores
✅ **Government Warning Detection:** Checks TTB-required warning text
✅ **Error Handling:** Graceful handling of unreadable images, missing fields

### Bonus Features (Extras)
🌟 **Multi-Rotation OCR:** Automatically tries 0°, 90°, 180°, 270° rotations to detect vertical/sideways text
🌟 **Bounding Box Highlighting:** Visual canvas overlay showing where each field was detected on the label
🌟 **Word-Level Analysis:** Enhanced alcohol content matching using word-level confidence scores
🌟 **Coordinate Transformation:** Transforms bounding boxes from rotated orientations back to original image coordinates
🌟 **TypeScript:** Full type safety with comprehensive interfaces
🌟 **Jest Tests:** 76 passing tests covering core matching logic
🌟 **Accessible Design:** WCAG 2.1 AA compliant using USWDS
🌟 **Responsive Layout:** Mobile-first design that works on all devices

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **UI Library:** US Web Design System (USWDS) 3.13
- **Components:** @trussworks/react-uswds 10.0
- **Styling:** SASS with USWDS design tokens

### Backend
- **Runtime:** Next.js API Routes (Node.js)
- **OCR Engine:** Tesseract.js 6.0
- **Image Processing:** Browser File API + FormData

### Deployment
- **Platform:** Vercel (recommended)
- **CI/CD:** Automatic deployments via Git

## Project Structure

```
atf-app/
├── app/
│   ├── api/verify/          # OCR API endpoint
│   ├── verify/              # Main verification page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   ├── globals.css          # Global styles
│   └── uswds.css           # USWDS styles
├── components/
│   └── verification/
│       ├── LabelForm.tsx           # Form input component
│       ├── ImageUpload.tsx         # Image upload with preview
│       ├── VerificationResults.tsx # Results display
│       ├── FieldVerification.tsx   # Individual field status
│       ├── LoadingState.tsx        # Progress indicator
│       └── LabelCanvas.tsx         # Bounding box visualization (bonus)
├── lib/
│   ├── ocr.ts              # Tesseract wrapper (main entry)
│   ├── ocr-core.ts         # Multi-rotation OCR logic (bonus)
│   ├── textMatching.ts     # Matching algorithms + bbox detection
│   ├── bboxMatching.ts     # Bounding box utilities (bonus)
│   ├── validation.ts       # Input validation
│   └── constants.ts        # TTB requirements & config
├── __tests__/              # Jest test suite
│   ├── lib/                # Unit tests (76 tests)
│   └── labels/             # Sample test images
├── types/
│   └── verification.ts     # TypeScript definitions
├── plan/                   # Technical documentation
│   ├── implementation-plan.md
│   ├── architecture.md
│   ├── api-design.md
│   └── matching-logic.md
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- pnpm, npm, or yarn

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd atf-app
```

2. **Install dependencies**

```bash
pnpm install
# or
npm install
# or
yarn install
```

3. **Run the development server**

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

4. **Open in browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## Usage

### 1. Navigate to Verification Page

Click "Get Started" on the landing page or go directly to `/verify`

### 2. Enter Label Information

Fill in the form with information from your alcohol label:
- **Brand Name** (required): e.g., "Old Tom Distillery"
- **Product Type** (required): e.g., "Kentucky Straight Bourbon Whiskey"
- **Alcohol Content** (required): e.g., "45" or "45%"
- **Net Contents** (optional): e.g., "750 mL"

### 3. Upload Label Image

- Select or drag-and-drop an image of the alcohol label
- Accepted formats: JPEG, PNG, WebP
- Maximum size: 5 MB
- Recommended: Clear, well-lit images with minimal glare

### 4. Verify Label

Click "Verify Label" button. The system will:
1. Validate your inputs
2. Process the image with OCR
3. Extract text from the label
4. Compare extracted text with form data
5. Display verification results

### 5. Review Results

Check the verification results:
- ✓ **Match:** Field matches label (green)
- ✗ **Mismatch:** Field doesn't match (red)
- ⚠ **Not Found:** Field not detected on label (yellow)

## How It Works

### OCR Processing

The application uses **Tesseract.js** with **multi-rotation processing** (bonus feature):

1. User uploads an image
2. Server receives the image via API
3. **Multi-Rotation OCR:** System processes the image at 4 orientations (0°, 90°, 180°, 270°)
4. Selects the rotation with highest confidence as the primary orientation
5. Extracts word-level text with bounding box coordinates
6. Transforms coordinates back to original orientation for visual highlighting

### Text Matching Algorithms

The system uses multiple strategies to match form data with OCR text:

#### 1. Brand Name Matching
- **Exact match:** Case-insensitive substring search
- **Fuzzy match:** Levenshtein distance (80% threshold)
- **Word matching:** At least 75% of words must match

#### 2. Product Type Matching
- **Substring match:** Handles variations like "Bourbon" vs "Bourbon Whiskey"
- **Product variations:** Recognizes common synonyms (IPA, India Pale Ale, etc.)
- **Fuzzy match:** 70% similarity threshold

#### 3. Alcohol Content Matching
- **Pattern extraction:** Finds "45%", "45 Alc./Vol.", "90 Proof"
- **Proof conversion:** Automatically converts proof to ABV (Proof / 2)
- **Tolerance:** ±0.5% for exact match, ±2% for loose match

#### 4. Net Contents Matching
- **Unit conversion:** Converts mL, oz, L to common unit
- **Volume tolerance:** 2% variance allowed
- **Format flexibility:** Handles "750ml", "750 mL", "750 ML"

#### 5. Government Warning Detection (Bonus)
- Checks for required phrases: "GOVERNMENT WARNING", "Surgeon General", etc.
- At least 60% of key phrases must be present
- Partial matches flagged as warnings

## API Documentation

### POST /api/verify

Verifies an alcohol label against form data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `brandName` | string | Yes | Brand name |
| `productType` | string | Yes | Product class/type |
| `alcoholContent` | string | Yes | ABV percentage |
| `netContents` | string | No | Volume |
| `image` | File | Yes | Label image |

**Response:**

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

**Error Response:**

```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "field": "image",
    "message": "Image file is required"
  }
}
```

## Configuration

### Matching Thresholds

Adjust matching sensitivity in `/lib/constants.ts`:

```typescript
export const DEFAULT_MATCHING_CONFIG = {
  brandName: {
    fuzzyMatchThreshold: 80,    // 80% similarity
    wordMatchThreshold: 75,     // 75% of words must match
  },
  productType: {
    fuzzyMatchThreshold: 70,    // 70% similarity
  },
  alcoholContent: {
    exactTolerance: 0.5,        // ±0.5%
    looseTolerance: 2.0,        // ±2.0%
  },
  netContents: {
    volumeTolerance: 0.02,      // 2%
  },
};
```

### OCR Settings

Modify Tesseract configuration in `/lib/constants.ts`:

```typescript
export const DEFAULT_OCR_CONFIG = {
  language: "eng",              // English
  oem: 3,                       // Default OCR engine mode
  psm: 3,                       // Automatic page segmentation
  preserveInterwordSpaces: true,
};
```

## Key Implementation Details

### Bonus Feature: Multi-Rotation OCR
To handle **vertical or sideways text** (common on labels, especially government warnings):
- OCR processes image at 4 orientations: 0°, 90°, 180°, 270°
- Selects rotation with highest word confidence as primary
- Keeps all rotation results for cross-orientation text detection (e.g., vertical warning on side)
- Transforms bounding box coordinates from rotated space back to original image orientation
- Enables detection of text in any orientation on a single label

### Bonus Feature: Bounding Box Visual Highlighting
- Tesseract provides word-level bounding boxes (x0, y0, x1, y1 coordinates)
- System traverses Tesseract's tree structure (blocks → paragraphs → lines → words)
- Matches text patterns and extracts corresponding bounding boxes
- Merges adjacent boxes for multi-word phrases (e.g., "GOVERNMENT WARNING")
- Renders highlighted regions on canvas overlay for visual feedback

## Design Decisions

### Why Next.js App Router?
- **Server Components:** Reduced client bundle size
- **API Routes:** Built-in backend without separate server
- **File-based Routing:** Intuitive project structure
- **Vercel Optimized:** Best deployment experience

### Why Server-Side OCR?
✅ **Pros:**
- Smaller client bundle (Tesseract not in browser)
- Better performance using server CPU
- Consistent Node.js environment
- No CORS issues

❌ **Cons:**
- Slight network latency (acceptable)
- Server resource usage (minimal for expected load)

### Why USWDS?
- **Government Standard:** Professional, trustworthy appearance
- **Accessibility:** WCAG 2.1 AA compliant by default
- **Design Tokens:** Consistent theming system
- **Mobile-First:** Responsive out of the box

### Why Tesseract.js?
- **Free & Open Source:** No API costs
- **JavaScript Native:** Works in Node.js
- **Good Accuracy:** Sufficient for printed labels
- **Self-Contained:** No external dependencies

## Testing

### Run Tests

```bash
pnpm test        # Run all tests
pnpm test:watch  # Watch mode
pnpm test:coverage # Coverage report
```

**Test Suite:** 76 passing tests covering:
- Text matching algorithms (exact, fuzzy, pattern-based)
- Bounding box detection and merging
- Form validation
- OCR integration with multi-rotation
- Component rendering

### Test Label Images

Sample test images are included in `__tests__/labels/`:
1. **ABC Distillery Straight Rye Whisky** - Front/back label with government warning
2. **12345 Imports Rum with Coconut Liqueur** - Import label test case
3. **Orpheus Brewing Pineapple Sour Ale** - Beer label with vertical text (tests rotation detection)

## Deployment

### Deploy to Vercel

1. **Connect Repository**

```bash
# Push to GitHub
git push origin main
```

2. **Import to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Import your repository
- Click "Deploy"

3. **Configure Settings** (if needed)
- Framework: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`

4. **Environment Variables** (none required for this project)

### Deploy to Other Platforms

The app can also be deployed to:
- **Netlify:** Add Next.js plugin
- **Railway:** Connect GitHub repo
- **AWS Amplify:** Use Amplify Console
- **Self-Hosted:** Run `pnpm build` && `pnpm start`

## Assumptions & Limitations

### Assumptions
- Images are reasonably clear and well-lit
- English text only (Tesseract configured for English)
- Common image formats (JPEG, PNG, WebP)
- Desktop/tablet primary use case
- No database needed (stateless verification)
- No user authentication required

### Known Limitations
- OCR accuracy depends on image quality (tested with clear, well-lit labels)
- Does not handle multiple languages (English only)
- No batch processing (one label at a time)
- No verification history saved (stateless)
- Maximum image size: 5 MB

### Future Enhancements (If More Time)
- [ ] Image preprocessing (contrast enhancement, de-skewing)
- [ ] Support for multiple product types with conditional field validation (Beer, Wine, Spirits)
- [ ] Exact government warning text validation (currently checks key phrases only)
- [ ] Field of vision validation (verify Brand, ABV, Type appear on same side)
- [ ] Batch processing multiple labels
- [ ] Export results as PDF report
- [ ] User accounts and verification history
- [ ] Integration with real TTB databases

## Contributing

This is a take-home project for demonstration purposes. If you'd like to extend it:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Technical Documentation

Detailed technical documentation is available in the `/plan` directory:

- **[Implementation Plan](./plan/implementation-plan.md):** Development timeline and phases
- **[Architecture](./plan/architecture.md):** System design and data flow
- **[API Design](./plan/api-design.md):** API specifications and examples
- **[Matching Logic](./plan/matching-logic.md):** Algorithm details and test cases

## License

This project is created for educational and demonstration purposes.

## Acknowledgments

- **TTB:** Alcohol and Tobacco Tax and Trade Bureau for regulatory guidelines
- **USWDS:** U.S. Web Design System for accessible components
- **Tesseract.js:** Open-source OCR engine
- **Next.js:** React framework by Vercel
- **TrussWorks:** React USWDS component library

## Support

For questions or issues:
- Open an issue on GitHub
- Check the [technical documentation](./plan)
- Review the [TTB guidelines](https://www.ttb.gov)

---

**Built with ❤️ using Next.js, TypeScript, USWDS, and Tesseract.js**
