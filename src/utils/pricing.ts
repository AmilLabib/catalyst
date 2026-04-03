// Mock utility to simulate fetching competitor pricing data from marketplaces
export type MarketPricing = {
  average: number;
  lowest: number;
  highest: number;
};

export function fetchMarketPricing(
  productName: string,
): Promise<MarketPricing> {
  // Simulate network latency and return deterministic mock data based on product name
  return new Promise((resolve) => {
    const seed = Array.from(productName).reduce(
      (s, ch) => s + ch.charCodeAt(0),
      0,
    );
    // create some variation
    const base = 10 + (seed % 90); // between 10 and 99
    const avg = Math.round((base + (seed % 30)) * 100) / 100;
    const lowest = Math.round(avg * (0.8 + (seed % 5) * 0.02) * 100) / 100;
    const highest = Math.round(avg * (1.1 + (seed % 7) * 0.03) * 100) / 100;

    setTimeout(
      () => resolve({ average: avg, lowest, highest }),
      500 + (seed % 400),
    );
  });
}
