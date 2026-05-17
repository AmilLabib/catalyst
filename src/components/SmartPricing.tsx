import { useEffect, useMemo, useState } from "react";
import { fetchMarketPricing } from "../utils/pricing";
import { usePageTitle } from "../hooks/usePageTitle";
import { useDemoMode } from "../context/DemoModeContext";
import {
  BarChart3,
  Image as ImageIcon,
  Sparkles,
  Minus,
  Plus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type FormState = {
  productName: string;
  cogs: number | "";
  monthlyFixed: number | "";
  estMonthlySales: number | "";
};

type ScenarioKey = "baseline" | "optimistic" | "conservative";

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

function roundTo(n: number, step: number) {
  if (step <= 0) return n;
  return Math.round(n / step) * step;
}

function safeNumber(n: number | "") {
  return n === "" ? null : Number(n);
}

function Stepper({
  onDec,
  onInc,
  disabled,
}: {
  onDec: () => void;
  onInc: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onDec}
        disabled={disabled}
        className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onInc}
        disabled={disabled}
        className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SmartPricing() {
  usePageTitle("Smart Pricing");
  const { demoRunId } = useDemoMode();
  const [form, setForm] = useState<FormState>(initialState);
  const [scenario, setScenario] = useState<ScenarioKey>("baseline");
  const [market, setMarket] = useState<{
    average: number;
    lowest: number;
    highest: number;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const priceStep = 500;
  const fixedStep = 50_000;
  const salesStep = 10;

  const presets = useMemo(
    () =>
      ({
        baseline: { label: "Baseline", avgFactor: 1.0, marginTarget: 0.2 },
        optimistic: {
          label: "Optimistic",
          avgFactor: 1.08,
          marginTarget: 0.25,
        },
        conservative: {
          label: "Conservative",
          avgFactor: 0.94,
          marginTarget: 0.15,
        },
      }) satisfies Record<
        ScenarioKey,
        {
          label: string;
          avgFactor: number;
          marginTarget: number;
        }
      >,
    [],
  );

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
    const marginTarget = presets[scenario].marginTarget;
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

  // Navbar Demo Mode integration: trigger the Ice Tea demo on demand.
  useEffect(() => {
    if (!demoRunId) return;
    void handleDemoIcedTea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoRunId]);

  const breakEven = breakEvenPerUnit();

  const cogsNum = safeNumber(form.cogs);
  const fixedNum = safeNumber(form.monthlyFixed);
  const salesNum = safeNumber(form.estMonthlySales);

  const isValid = {
    productName: form.productName.trim().length > 0,
    cogs: cogsNum !== null && cogsNum >= 0,
    monthlyFixed: fixedNum !== null && fixedNum >= 0,
    estMonthlySales: salesNum !== null && salesNum > 0,
  };

  const effectiveMarket = useMemo(() => {
    if (!market) return null;
    const f = presets[scenario].avgFactor;
    return {
      average: Math.max(0, Math.round(market.average * f)),
      lowest: market.lowest,
      highest: market.highest,
    };
  }, [market, presets, scenario]);

  let recommendedPrice: number | null = null;
  let profitMarginPct: number | null = null;
  let rationale =
    "Provide product details and fetch market data to get a recommendation.";

  const recAndMargin = useMemo(() => {
    if (!effectiveMarket || breakEven === null) return null;
    const rec = computeRecommendation(effectiveMarket.average, breakEven);
    const c = cogsNum ?? 0;
    const marginPct = rec !== 0 ? ((rec - c) / rec) * 100 : null;
    const profitPerUnit = rec - c;
    const profitPerMonth = salesNum ? profitPerUnit * salesNum : null;
    return {
      recommended: rec,
      marginPct: marginPct === null ? null : Math.round(marginPct * 100) / 100,
      profitPerUnit,
      profitPerMonth,
    };
  }, [effectiveMarket, breakEven, cogsNum, salesNum]);

  if (effectiveMarket && breakEven !== null) {
    recommendedPrice =
      recAndMargin?.recommended ??
      computeRecommendation(effectiveMarket.average, breakEven);

    // Ensure no division by zero and compute margin as %
    if (recommendedPrice && Number(form.cogs) >= 0 && recommendedPrice !== 0) {
      profitMarginPct =
        Math.round(
          ((recommendedPrice - Number(form.cogs)) / recommendedPrice) * 10000,
        ) / 100;
    } else {
      profitMarginPct = null;
    }

    if (effectiveMarket.average >= breakEven * 1.25) {
      rationale = `Market average (${formatCurrency(Math.round(effectiveMarket.average))}) is well above your break-even (${formatCurrency(Math.round(breakEven))}). We recommend a competitive premium while testing elasticity.`;
    } else if (effectiveMarket.average >= breakEven * 0.95) {
      rationale = `Market average (${formatCurrency(Math.round(effectiveMarket.average))}) is near your break-even. Recommend a modest margin and monitor conversions.`;
    } else {
      rationale = `Market prices (${formatCurrency(Math.round(effectiveMarket.lowest))} - ${formatCurrency(Math.round(effectiveMarket.highest))}) are below your break-even (${formatCurrency(Math.round(breakEven))}). Consider reducing COGS or lowering fixed costs before pricing above break-even.`;
    }
  }

  const comparison = useMemo(() => {
    if (!effectiveMarket || breakEven === null || recommendedPrice === null)
      return null;
    const max = Math.max(
      effectiveMarket.highest,
      effectiveMarket.average,
      recommendedPrice,
    );
    const min = Math.min(
      effectiveMarket.lowest,
      effectiveMarket.average,
      recommendedPrice,
      breakEven,
    );
    const span = Math.max(1, max - min);
    const pct = (v: number) => ((v - min) / span) * 100;
    return {
      min,
      max,
      breakEvenPct: pct(breakEven),
      avgPct: pct(effectiveMarket.average),
      recPct: pct(recommendedPrice),
    };
  }, [effectiveMarket, breakEven, recommendedPrice]);

  const sensitivity = useMemo(() => {
    if (!effectiveMarket || breakEven === null) return null;
    const avg = effectiveMarket.average;
    const variants = [
      { key: "-10%", avg: avg * 0.9 },
      { key: "Base", avg },
      { key: "+10%", avg: avg * 1.1 },
    ] as const;
    return variants.map((v) => {
      const rec = computeRecommendation(v.avg, breakEven);
      const c = cogsNum ?? 0;
      const marginPct = rec !== 0 ? ((rec - c) / rec) * 100 : null;
      return {
        label: v.key,
        recommended: rec,
        marginPct: marginPct === null ? null : Math.round(marginPct * 10) / 10,
      };
    });
  }, [breakEven, cogsNum, computeRecommendation, effectiveMarket]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-3xl border bg-white p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-extrabold">
                Smart Pricing Engine
              </h2>
            </div>
            <p className="text-gray-600 mt-1">
              Dapatkan rekomendasi harga berdasarkan biaya dan snapshot harga
              pasar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(initialState);
                setMarket(null);
                setImageUrl(null);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border bg-gray-50/50 p-5 card-hover">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Scenario
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(presets) as ScenarioKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setScenario(k)}
                      className={`px-3 py-1.5 rounded-xl border text-sm transition-colors ${
                        scenario === k
                          ? "bg-primary text-white border-primary"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {presets[k].label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Mengubah asumsi market average & target margin untuk
                  eksplorasi cepat.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Product name
                </label>
                <input
                  value={form.productName}
                  onChange={(e) => handleChange("productName", e.target.value)}
                  placeholder="e.g. Es Teh Manis"
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                />
                {!isValid.productName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Wajib diisi.
                  </p>
                )}
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleFetchMarket}
                  disabled={!isValid.productName || loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Fetching…" : "Fetch Market Data"}
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  COGS / unit (Rp)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={form.cogs}
                    onChange={(e) => handleChange("cogs", e.target.value)}
                    min={0}
                    step={priceStep}
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Stepper
                    disabled={form.cogs === ""}
                    onDec={() =>
                      setForm((s) => ({
                        ...s,
                        cogs:
                          s.cogs === ""
                            ? ""
                            : Math.max(
                                0,
                                roundTo(Number(s.cogs) - priceStep, priceStep),
                              ),
                      }))
                    }
                    onInc={() =>
                      setForm((s) => ({
                        ...s,
                        cogs:
                          s.cogs === ""
                            ? ""
                            : roundTo(Number(s.cogs) + priceStep, priceStep),
                      }))
                    }
                  />
                </div>
                {form.cogs !== "" && (
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={50_000}
                      step={priceStep}
                      value={Number(form.cogs)}
                      onChange={(e) => handleChange("cogs", e.target.value)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>0</span>
                      <span>50k</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Fixed costs / month (Rp)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={form.monthlyFixed}
                    onChange={(e) =>
                      handleChange("monthlyFixed", e.target.value)
                    }
                    min={0}
                    step={fixedStep}
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Stepper
                    disabled={form.monthlyFixed === ""}
                    onDec={() =>
                      setForm((s) => ({
                        ...s,
                        monthlyFixed:
                          s.monthlyFixed === ""
                            ? ""
                            : Math.max(
                                0,
                                roundTo(
                                  Number(s.monthlyFixed) - fixedStep,
                                  fixedStep,
                                ),
                              ),
                      }))
                    }
                    onInc={() =>
                      setForm((s) => ({
                        ...s,
                        monthlyFixed:
                          s.monthlyFixed === ""
                            ? ""
                            : roundTo(
                                Number(s.monthlyFixed) + fixedStep,
                                fixedStep,
                              ),
                      }))
                    }
                  />
                </div>
                {form.monthlyFixed !== "" && (
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={50_000_000}
                      step={fixedStep}
                      value={Number(form.monthlyFixed)}
                      onChange={(e) =>
                        handleChange("monthlyFixed", e.target.value)
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>0</span>
                      <span>50jt</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Estimated sales / month (units)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={form.estMonthlySales}
                    onChange={(e) =>
                      handleChange("estMonthlySales", e.target.value)
                    }
                    min={0}
                    step={salesStep}
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Stepper
                    disabled={form.estMonthlySales === ""}
                    onDec={() =>
                      setForm((s) => ({
                        ...s,
                        estMonthlySales:
                          s.estMonthlySales === ""
                            ? ""
                            : Math.max(
                                0,
                                roundTo(
                                  Number(s.estMonthlySales) - salesStep,
                                  salesStep,
                                ),
                              ),
                      }))
                    }
                    onInc={() =>
                      setForm((s) => ({
                        ...s,
                        estMonthlySales:
                          s.estMonthlySales === ""
                            ? ""
                            : roundTo(
                                Number(s.estMonthlySales) + salesStep,
                                salesStep,
                              ),
                      }))
                    }
                  />
                </div>
                {form.estMonthlySales !== "" && (
                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={5_000}
                      step={salesStep}
                      value={Number(form.estMonthlySales)}
                      onChange={(e) =>
                        handleChange("estMonthlySales", e.target.value)
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>0</span>
                      <span>5k</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 card-hover">
            <h4 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Quick KPIs
            </h4>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Break-even / unit</span>
                <span className="font-semibold">
                  {breakEven === null ? "—" : formatCurrency(breakEven)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recommended price</span>
                <span className="font-semibold text-primary">
                  {recommendedPrice === null
                    ? "—"
                    : formatCurrency(recommendedPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Margin</span>
                <span className="font-semibold">
                  {profitMarginPct === null ? "—" : `${profitMarginPct}%`}
                </span>
              </div>
              {recAndMargin?.profitPerMonth !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profit / month</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      Math.round(recAndMargin?.profitPerMonth ?? 0),
                    )}
                  </span>
                </div>
              )}

              {sensitivity && (
                <div className="pt-3 mt-3 border-t">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Sensitivity (market avg)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {sensitivity.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border bg-gray-50 p-2"
                      >
                        <p className="text-[11px] text-gray-500">{s.label}</p>
                        <p className="text-xs font-semibold text-gray-900">
                          {formatCurrency(s.recommended)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {s.marginPct === null
                            ? "—"
                            : `${s.marginPct}% margin`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
              Titik aman agar tiap penjualan tidak merugi setelah alokasi biaya
              tetap.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ImageIcon className="w-4 h-4 text-primary" />
                  </div>
                  <h5 className="font-bold text-lg text-gray-900">Market Snapshot</h5>
                </div>
                <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">IDR</span>
              </div>

              {market ? (
                <div className="mt-5">
                  {imageUrl ? (
                    <div className="mb-4 rounded-xl overflow-hidden border border-primary/10 shadow-sm relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      <img
                        src={imageUrl}
                        alt={form.productName || "product"}
                        className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                      <span>Tidak ada gambar produk.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center">
                    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
                      <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Lowest</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatCurrency(market.lowest)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary text-white shadow-lg p-3 sm:p-4 text-center transform scale-105 z-10 border border-white/20">
                      <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-white/80 mb-1">Average</p>
                      <p className="font-extrabold text-white text-sm sm:text-base">
                        {formatCurrency(market.average)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
                      <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Highest</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatCurrency(market.highest)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Belum ada data pasar. <br/>Klik <strong className="text-primary">Fetch Market Data</strong> atau coba demo.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-5 card-hover">
              <h5 className="font-semibold">Recommendation</h5>
              {recommendedPrice === null ? (
                <p className="text-sm text-gray-500 mt-3">
                  Lengkapi input dan ambil data pasar untuk melihat rekomendasi.
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

        {comparison && (
          <div className="mt-6 rounded-2xl border bg-white p-5 card-hover">
            <h4 className="font-semibold">Price Positioning</h4>
            <p className="text-sm text-gray-500 mt-1">
              Bandingkan break-even, market average, dan rekomendasi pada satu
              skala.
            </p>
            <div className="mt-4 relative h-3 rounded-full bg-gray-100 border overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-1 bg-gray-700"
                style={{ left: `${comparison.breakEvenPct}%` }}
                title="Break-even"
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-primary"
                style={{ left: `${comparison.avgPct}%` }}
                title="Market average"
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-emerald-600"
                style={{ left: `${comparison.recPct}%` }}
                title="Recommendation"
              />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Break-even</p>
                <p className="font-semibold">
                  {formatCurrency(Math.round(breakEven ?? 0))}
                </p>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Market avg</p>
                <p className="font-semibold">
                  {formatCurrency(Math.round(market?.average ?? 0))}
                </p>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Recommended</p>
                <p className="font-semibold text-emerald-700">
                  {formatCurrency(Math.round(recommendedPrice ?? 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
