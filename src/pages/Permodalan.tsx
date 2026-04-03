import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Banknote,
  Percent,
  Calendar,
  Briefcase,
  Info,
} from "lucide-react";

type LoanProduct = {
  id: string;
  name: string;
  partnerType: "Bank" | "Fintech";
  productType: "KUR" | "Invoice Financing" | "Micro Working Capital";
  logo?: string;
  interestPa: number;
  maxTenorMonths: number;
  processingDays: number;
};

const loanProducts: LoanProduct[] = [
  {
    id: "p1",
    name: "Bank Maju - KUR",
    partnerType: "Bank",
    productType: "KUR",
    logo: "/permodalan-1.png",
    interestPa: 6.0,
    maxTenorMonths: 36,
    processingDays: 7,
  },
  {
    id: "p2",
    name: "FundIndo - Invoice Financing",
    partnerType: "Fintech",
    productType: "Invoice Financing",
    logo: "/permodalan-3.png",
    interestPa: 12.5,
    maxTenorMonths: 12,
    processingDays: 3,
  },
  {
    id: "p3",
    name: "KreditMikro - Modal Kerja",
    partnerType: "Fintech",
    productType: "Micro Working Capital",
    logo: "/permodalan-2.png",
    interestPa: 18.0,
    maxTenorMonths: 24,
    processingDays: 5,
  },
];

function Permodalan() {
  const preScreenLimit = 50_000_000; // Rp 50jt based on mock performance
  const [amount, setAmount] = useState<number>(20_000_000);
  const [tenor, setTenor] = useState<number>(12);
  type Purpose =
    | "Modal Kerja"
    | "Investasi Alat"
    | "Operasional"
    | "Invoice Financing";
  const [purpose, setPurpose] = useState<Purpose>("Modal Kerja");

  const filtered = useMemo(() => {
    // Simple matching logic: prefer products with tenor >= selected and interest tolerance
    return loanProducts
      .map((p) => {
        let score = 100;
        if (p.maxTenorMonths < tenor) score -= 20;
        if (amount > preScreenLimit) score -= 40;
        // Purpose heuristics
        if (
          purpose === "Invoice Financing" &&
          p.productType !== "Invoice Financing"
        )
          score -= 15;
        if (
          purpose === "Modal Kerja" &&
          p.productType !== "Micro Working Capital" &&
          p.productType !== "KUR"
        )
          score -= 10;
        if (purpose === "Investasi Alat" && p.productType !== "KUR")
          score -= 10;
        score = Math.max(50, Math.min(100, score));
        return { ...p, matchScore: score };
      })
      .sort((a, b) => (b as any).matchScore - (a as any).matchScore);
  }, [amount, tenor, purpose]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <header className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
            Permodalan
          </h1>
        </header>
        <p className="text-sm text-gray-600 mb-6">
          VARITY bukan pemberi pinjaman. Kami penghubung tepercaya ke mitra
          legal (Bank & P2P berizin OJK) dengan rekomendasi berbasis data untuk
          melindungi UMKM dari pinjaman ilegal.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Financial Health & Limit Calculator */}
          <section className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5 text-blue-700" />
              <h2 className="text-xl font-semibold">
                Financial Health & Limit
              </h2>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Berdasarkan performa keuangan Q3 Anda, Anda layak mendapatkan
                pendanaan hingga:
              </p>
              <p className="mt-2 text-3xl font-extrabold text-blue-800">
                Rp {preScreenLimit.toLocaleString("id-ID")}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border border-blue-300 bg-white text-blue-700">
                <ShieldCheck className="w-4 h-4" /> Data Verified by VARITY
                Audit System
              </span>
            </div>
          </section>

          {/* Smart Loan Simulator */}
          <section className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-5 h-5 text-blue-700" />
              <h2 className="text-xl font-semibold">Smart Loan Simulator</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700 mb-1">
                  Nominal Dana yang Dibutuhkan
                </p>
                <input
                  type="range"
                  min={1_000_000}
                  max={preScreenLimit}
                  step={500_000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full"
                />
                <p className="mt-1 text-sm font-semibold text-primary">
                  Rp {amount.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-1">
                  Tenor (Jangka Waktu)
                </p>
                <select
                  className="border rounded-md px-3 py-2 w-full"
                  value={tenor}
                  onChange={(e) => setTenor(Number(e.target.value))}
                >
                  <option value={6}>6 Bulan</option>
                  <option value={12}>12 Bulan</option>
                  <option value={24}>24 Bulan</option>
                  <option value={36}>36 Bulan</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-700 mb-1">Tujuan Pembiayaan</p>
                <select
                  className="border rounded-md px-3 py-2 w-full"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as Purpose)}
                >
                  <option>Modal Kerja</option>
                  <option>Investasi Alat</option>
                  <option>Operasional</option>
                  <option>Invoice Financing</option>
                </select>
              </div>
            </div>
          </section>

          {/* Recommended Partners */}
          <section className="lg:col-span-12 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-blue-700" />
              <h2 className="text-xl font-semibold">Recommended Partners</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden border"
                >
                  <div className="p-4 flex items-center gap-3 border-b">
                    <img
                      src={p.logo}
                      alt={p.name}
                      className="w-10 h-10 rounded"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-primary truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Terdaftar & Diawasi OJK
                      </p>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="inline-flex items-center gap-1">
                      <Percent className="w-4 h-4 text-blue-700" /> Bunga:{" "}
                      {p.interestPa}% p.a.
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-blue-700" /> Tenor Max:{" "}
                      {p.maxTenorMonths} bln
                    </div>
                    <div className="inline-flex items-center gap-1 col-span-2">
                      <Info className="w-4 h-4 text-blue-700" /> Proses:{" "}
                      {p.processingDays} hari
                    </div>
                    <div className="inline-flex items-center gap-2 col-span-2 mt-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        Match Score: {(p as any).matchScore}% Cocok
                      </span>
                    </div>
                    <button className="col-span-2 mt-2 px-3 py-2 rounded-md bg-primary text-white text-sm">
                      Ajukan via Mitra
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Security & Education */}
          <section className="lg:col-span-12 rounded-2xl p-4 border border-blue-200 bg-blue-50">
            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <p className="text-sm text-blue-800">
                VARITY hanya bermitra dengan lembaga legal. Hindari Pinjaman
                Online ilegal yang tidak terdaftar di OJK.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Permodalan;
