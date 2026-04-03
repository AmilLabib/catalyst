import { useMemo, useState } from "react";
import { fetchMarketPricing } from "../utils/pricing";
import {
  BarChart3,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";

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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

  const handleDemoIcedTea = async () => {
    // Fill with reasonable demo values for 'Ice Tea'
    setForm({
      productName: "Ice Tea",
      cogs: 2500,
      monthlyFixed: 1200000,
      estMonthlySales: 800,
    });

    setLoading(true);
    // Use deterministic demo market numbers (in IDR)
    const demoMarket = { average: 8000, lowest: 6500, highest: 12000 };
    // image lives in public/ice-tea.png
    setMarket(demoMarket);
    setImageUrl("/ice-tea.png");
    setLoading(false);
  };

  const breakEven = breakEvenPerUnit();

  const score = useMemo(() => {
    if (!market || breakEven === null) return null;
    const ideal = market.average;
    if (ideal <= 0) return null;
    // Score how close our recommendation is to market avg while still >= break-even.
    // 0..100 where 100 is very close to market avg, and penalize if under break-even.
    const rec = computeRecommendation(ideal, breakEven);
    const distance = Math.abs(rec - ideal) / ideal; // 0..inf
    const base = 100 - distance * 100;
    const penalty = rec < breakEven ? 35 : 0;
    return Math.round(clamp(base - penalty, 0, 100));
  }, [market, breakEven]);

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
    <div className="max-w-4xl mx-auto">
      <div className="rounded-2xl shadow-md overflow-hidden border bg-white">
        <div className="px-6 py-5 bg-gradient-to-r from-primary/10 via-white to-primary/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border text-primary text-xs font-semibold">
                <Sparkles className="w-4 h-4" /> AI-assisted pricing
              </div>
              <h3 className="text-2xl font-extrabold text-primary mt-2">
                Smart Pricing Engine
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Masukkan biaya & volume, ambil data pasar, lalu dapatkan
                rekomendasi harga yang kompetitif.
              </p>
            </div>

            {score !== null && (
              <div className="rounded-xl border bg-white px-4 py-3 min-w-[10rem]">
                <p className="text-xs text-gray-500">Pricing fit score</p>
                <p className="text-2xl font-extrabold text-primary">
                  {score}/100
                </p>
                <p className="text-xs text-gray-500">(closer to market avg)</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Product Name
              </label>
              <input
                value={form.productName}
                onChange={(e) => handleChange("productName", e.target.value)}
                placeholder="e.g., Ice Tea"
                className="mt-1 block w-full rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                COGS per unit (Rp)
              </label>
              <input
                value={form.cogs === "" ? "" : String(form.cogs)}
                onChange={(e) => handleChange("cogs", e.target.value)}
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 2500"
                className="mt-1 block w-full rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Termasuk bahan, kemasan, dan biaya variabel per unit.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Monthly Fixed Costs (Rp)
              </label>
              <input
                value={
                  form.monthlyFixed === "" ? "" : String(form.monthlyFixed)
                }
                onChange={(e) => handleChange("monthlyFixed", e.target.value)}
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 1200000"
                className="mt-1 block w-full rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Contoh: sewa, listrik, gaji tetap, subscription, dll.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Estimated Monthly Sales (units)
              </label>
              <input
                value={
                  form.estMonthlySales === ""
                    ? ""
                    : String(form.estMonthlySales)
                }
                onChange={(e) =>
                  handleChange("estMonthlySales", e.target.value)
                }
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 800"
                className="mt-1 block w-full rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={handleFetchMarket}
              disabled={!form.productName || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              <TrendingUp className="w-4 h-4" />
              {loading ? "Fetching..." : "Fetch Market Data"}
            </button>
            <button
              onClick={handleDemoIcedTea}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white shadow-sm hover:bg-amber-600"
            >
              <ImageIcon className="w-4 h-4" /> Demo: Ice Tea
            </button>
            <button
              onClick={() => setForm(initialState)}
              className="px-4 py-2.5 rounded-xl border bg-white hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 rounded-2xl border bg-gradient-to-b from-gray-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Break-even per unit</h4>
                </div>
                <span className="text-xs text-gray-500">minimum price</span>
              </div>
              <p className="text-3xl mt-3 font-extrabold text-primary">
                {breakEven === null ? "—" : formatCurrency(breakEven)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Titik aman agar tiap penjualan tidak merugi setelah alokasi
                biaya tetap.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold">Market Snapshot</h5>
                  <span className="text-xs text-gray-500">IDR</span>
                </div>

                {market ? (
                  <div className="mt-3">
                    {imageUrl ? (
                      <div className="mb-3 rounded-xl overflow-hidden border bg-gray-50">
                        <img
                          src={imageUrl}
                          alt={form.productName || "product"}
                          className="w-full h-40 object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="mb-3 rounded-xl border bg-gray-50 p-4 text-sm text-gray-500 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Tidak ada gambar
                        produk.
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-gray-50 border p-3">
                        <p className="text-xs text-gray-500">Lowest</p>
                        <p className="font-bold text-gray-900">
                          {formatCurrency(market.lowest)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border p-3">
                        <p className="text-xs text-gray-500">Average</p>
                        <p className="font-extrabold text-primary">
                          {formatCurrency(market.average)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-gray-50 border p-3">
                        <p className="text-xs text-gray-500">Highest</p>
                        <p className="font-bold text-gray-900">
                          {formatCurrency(market.highest)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-3">
                    Belum ada data pasar. Klik{" "}
                    <strong>Fetch Market Data</strong> atau coba demo.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <h5 className="font-semibold">Recommendation</h5>
                {recommendedPrice === null ? (
                  <p className="text-sm text-gray-500 mt-3">
                    Lengkapi input dan ambil data pasar untuk melihat
                    rekomendasi.
                  </p>
                ) : (
                  <div className="mt-3">
                    <p className="text-3xl font-extrabold text-primary">
                      {formatCurrency(recommendedPrice)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <span>Projected profit margin:</span>
                      <span className="font-semibold text-gray-900">
                        {profitMarginPct}%
                      </span>
                    </div>
                    <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                      {rationale}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
