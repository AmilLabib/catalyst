import { useState } from "react";
import { fetchMarketPricing } from "../utils/pricing";

type FormState = {
  productName: string;
  cogs: number | "";
  monthlyFixed: number | "";
  estMonthlySales: number | "";
};

const initialState: FormState = {
  productName: "",
  cogs: "",
  monthlyFixed: "",
  estMonthlySales: "",
};

function formatCurrency(n: number) {
  // Format numbers as Indonesian Rupiah, no fractional digits
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

export default function SmartPricing() {
  const [form, setForm] = useState<FormState>(initialState);
  const [market, setMarket] = useState<{
    average: number;
    lowest: number;
    highest: number;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (k: keyof FormState, v: string) => {
    if (k === "productName") setForm((s) => ({ ...s, [k]: v }));
    else {
      const num = v === "" ? "" : Number(v);
      setForm((s) => ({ ...s, [k]: Number.isNaN(num) ? "" : num }));
    }
  };

  const breakEvenPerUnit = (): number | null => {
    const { cogs, monthlyFixed, estMonthlySales } = form;
    if (
      cogs === "" ||
      monthlyFixed === "" ||
      estMonthlySales === "" ||
      estMonthlySales === 0
    )
      return null;
    const totalVariable = Number(cogs);
    const allocFixedPerUnit = Number(monthlyFixed) / Number(estMonthlySales);
    return Math.max(0, totalVariable + allocFixedPerUnit);
  };

  const computeRecommendation = (marketAvg: number, breakEven: number) => {
    // Simple strategy:
    // - If market average is well above break-even, recommend between avg and highest (conservative)
    // - If market average near break-even, recommend small premium (10-20%) over break-even
    // - If market average below break-even, recommend price at break-even and suggest cost reduction
    const marginTarget = 0.2; // 20% target margin
    if (marketAvg >= breakEven * 1.25) {
      // market can bear premium
      const recommended = Math.min(
        marketAvg * 1.02,
        breakEven * (1 + marginTarget) + (marketAvg - breakEven) * 0.5,
      );
      return Math.round(recommended);
    }
    if (marketAvg >= breakEven * 0.95) {
      // near market avg: small premium over break-even
      const recommended = Math.max(breakEven * 1.12, marketAvg);
      return Math.round(recommended);
    }
    // market lower than break-even
    return Math.round(breakEven);
  };

  const handleFetchMarket = async () => {
    if (!form.productName) return;
    setLoading(true);
    setImageUrl(null);

    // First try Gemini assistant to fetch live e-commerce data (expects JSON-only reply)
    try {
      const prompt = `You are an e-commerce aggregator. Given the product name \"${String(
        form.productName,
      ).replace(
        /\"/g,
        '\\"',
      )}\", return a JSON object ONLY (no extra text) with the following keys:\n{"average": <number>, "lowest": <number>, "highest": <number>, "image": "<url>"}\nPrices should be numbers representing Indonesian Rupiah (IDR). If you cannot find exact values, provide reasonable estimates. Respond strictly with valid JSON.`;

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const payload = await res.json();
      const assistantReply = payload?.reply ?? payload?.replyText ?? "";

      // Try to parse assistant reply as JSON
      let parsed: any = null;
      try {
        parsed = JSON.parse(assistantReply);
      } catch (err) {
        // If assistant returned extra text, try to extract JSON substring
        const jsonMatch = assistantReply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e) {
            parsed = null;
          }
        }
      }

      if (parsed && (parsed.average || parsed.lowest || parsed.highest)) {
        const m = {
          average: Number(parsed.average) || 0,
          lowest: Number(parsed.lowest) || 0,
          highest: Number(parsed.highest) || 0,
        };
        setMarket(m);
        if (parsed.image) setImageUrl(String(parsed.image));
        else setImageUrl(null);
        setLoading(false);
        return;
      }
      // else fallthrough to mock
    } catch (err) {
      // ignore and fallback to mock
      console.warn("Gemini fetch failed, falling back to mock", err);
    }

    // Fallback: deterministic mock pricing
    const m = await fetchMarketPricing(form.productName);
    setMarket(m);
    setLoading(false);
  };

  const breakEven = breakEvenPerUnit();

  let recommendedPrice: number | null = null;
  let profitMarginPct: number | null = null;
  let rationale =
    "Provide product details and fetch market data to get a recommendation.";

  if (market && breakEven !== null) {
    recommendedPrice = computeRecommendation(market.average, breakEven);
    // Ensure no division by zero and compute margin as %
    if (recommendedPrice && Number(form.cogs) >= 0 && recommendedPrice !== 0) {
      profitMarginPct =
        Math.round(
          ((recommendedPrice - Number(form.cogs)) / recommendedPrice) * 10000,
        ) / 100;
    } else {
      profitMarginPct = null;
    }

    if (market.average >= breakEven * 1.25) {
      rationale = `Market average (${formatCurrency(Math.round(market.average))}) is well above your break-even (${formatCurrency(Math.round(breakEven))}). We recommend a competitive premium while testing elasticity.`;
    } else if (market.average >= breakEven * 0.95) {
      rationale = `Market average (${formatCurrency(Math.round(market.average))}) is near your break-even. Recommend a modest margin and monitor conversions.`;
    } else {
      rationale = `Market prices (${formatCurrency(Math.round(market.lowest))} - ${formatCurrency(Math.round(market.highest))}) are below your break-even (${formatCurrency(Math.round(breakEven))}). Consider reducing COGS or lowering fixed costs before pricing above break-even.`;
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Smart Pricing Engine</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            value={form.productName}
            onChange={(e) => handleChange("productName", e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            COGS per unit (Rp)
          </label>
          <input
            value={form.cogs === "" ? "" : String(form.cogs)}
            onChange={(e) => handleChange("cogs", e.target.value)}
            type="number"
            min="0"
            step="1"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Monthly Fixed Costs (Rp)
          </label>
          <input
            value={form.monthlyFixed === "" ? "" : String(form.monthlyFixed)}
            onChange={(e) => handleChange("monthlyFixed", e.target.value)}
            type="number"
            min="0"
            step="1"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Estimated Monthly Sales (units)
          </label>
          <input
            value={
              form.estMonthlySales === "" ? "" : String(form.estMonthlySales)
            }
            onChange={(e) => handleChange("estMonthlySales", e.target.value)}
            type="number"
            min="0"
            step="1"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleFetchMarket}
          disabled={!form.productName || loading}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Fetching..." : "Fetch Market Data"}
        </button>
        <button
          onClick={() => setForm(initialState)}
          className="px-4 py-2 border rounded"
        >
          Reset
        </button>
      </div>

      <div className="mt-6">
        <div className="bg-gray-50 border rounded p-4">
          <h4 className="font-medium">Break-even per unit</h4>
          <p className="text-2xl mt-2 font-semibold">
            {breakEven === null ? "—" : formatCurrency(breakEven)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white border rounded p-4">
            <h5 className="font-medium">Market Snapshot</h5>
            {market ? (
              <div className="mt-2">
                {imageUrl && (
                  <div className="mb-3">
                    <img
                      src={imageUrl}
                      alt={form.productName || "product"}
                      className="w-28 h-28 object-cover rounded"
                    />
                  </div>
                )}
                <p>
                  Average: <strong>{formatCurrency(market.average)}</strong>
                </p>
                <p>
                  Lowest: <strong>{formatCurrency(market.lowest)}</strong>
                </p>
                <p>
                  Highest: <strong>{formatCurrency(market.highest)}</strong>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No market data yet.</p>
            )}
          </div>

          <div className="bg-white border rounded p-4">
            <h5 className="font-medium">Recommendation</h5>
            {recommendedPrice === null ? (
              <p className="text-sm text-gray-500 mt-2">
                Complete inputs and fetch market data to see a recommendation.
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-2xl font-semibold">
                  {formatCurrency(recommendedPrice)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Projected profit margin: <strong>{profitMarginPct}%</strong>
                </p>
                <p className="mt-3 text-sm text-gray-700">{rationale}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
