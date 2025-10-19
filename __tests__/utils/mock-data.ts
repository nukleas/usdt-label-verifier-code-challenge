// Mock data for testing
export const mockLabelData = {
  brandName: "Test Brand",
  alcoholType: "wine",
  productType: "Red Wine",
  alcoholContent: "12.5%",
  netContents: "750ml",
  producer: "Test Winery",
  vintage: "2023",
  region: "Napa Valley",
  varietal: "Cabernet Sauvignon",
};

export const mockOcrResult = {
  text: "Test Brand\nTest Product\n12.5% Alcohol by Volume\n750ml\nTest Winery\n2023\nNapa Valley\nCabernet Sauvignon",
  confidence: 0.95,
  words: [
    {
      text: "Test",
      confidence: 0.98,
      bbox: { x0: 10, y0: 10, x1: 50, y1: 30 },
    },
    {
      text: "Brand",
      confidence: 0.97,
      bbox: { x0: 60, y0: 10, x1: 100, y1: 30 },
    },
    {
      text: "12.5%",
      confidence: 0.96,
      bbox: { x0: 10, y0: 40, x1: 80, y1: 60 },
    },
  ],
};

export const mockVerificationResult = {
  isMatch: true,
  confidence: 0.92,
  discrepancies: [],
  matchedFields: [
    {
      field: "brandName",
      confidence: 0.98,
      ocrValue: "Test Brand",
      formValue: "Test Brand",
    },
    {
      field: "alcoholContent",
      confidence: 0.96,
      ocrValue: "12.5%",
      formValue: "12.5%",
    },
  ],
  summary: "All fields match within acceptable confidence levels.",
};
