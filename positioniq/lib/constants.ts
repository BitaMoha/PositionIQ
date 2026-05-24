export const DEMO_PROJECT_ID = "11111111-1111-1111-1111-111111111111";

// Stripe is "us" — only Adyen is analyzed as the competitor
export const COMPETITOR_PAGES: Record<string, string[]> = {
  Adyen: [
    "https://www.adyen.com",
    "https://www.adyen.com/pricing",
    "https://www.adyen.com/our-solution",
  ],
};

export const VOC_SOURCES: Array<{ url: string; competitor: string; source_type: "g2" | "github" }> = [
  { url: "https://www.g2.com/products/adyen/reviews", competitor: "Adyen", source_type: "g2" },
  { url: "https://github.com/Adyen/adyen-node-api-library/issues", competitor: "Adyen", source_type: "github" },
  { url: "https://github.com/Adyen/adyen-web/issues", competitor: "Adyen", source_type: "github" },
];
