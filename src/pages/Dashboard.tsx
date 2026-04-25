import { Link } from "react-router-dom";
import {
  balanceSheet2024,
  incomeStatement2024,
  cashFlow2024,
  formatRupiah,
} from "../data/financials";
import {
  ShieldCheck,
  Factory,
  AlertTriangle,
  Trophy,
  TrendingUp,
  Wallet,
  PiggyBank,
  Activity,
  ArrowRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { usePageTitle } from "../hooks/usePageTitle";

const trendData = [
  { month: "Jan", revenue: 42_000_000, expenses: 28_000_000 },
  { month: "Feb", revenue: 44_000_000, expenses: 29_500_000 },
  { month: "Mar", revenue: 41_500_000, expenses: 30_200_000 },
  { month: "Apr", revenue: 43_000_000, expenses: 31_000_000 },
  { month: "May", revenue: 39_000_000, expenses: 34_000_000 },
  { month: "Jun", revenue: 37_000_000, expenses: 36_500_000 },
  { month: "Jul", revenue: 36_000_000, expenses: 38_000_000 },
  { month: "Aug", revenue: 38_000_000, expenses: 41_500_000 },
  { month: "Sep", revenue: 39_000_000, expenses: 39_500_000 },
  { month: "Oct", revenue: 40_500_000, expenses: 38_000_000 },
  { month: "Nov", revenue: 39_500_000, expenses: 37_800_000 },
  { month: "Dec", revenue: 38_000_000, expenses: 38_500_000 },
];

const revenueMix = [
  { name: "Online", value: 48 },
  { name: "Offline", value: 32 },
  { name: "Reseller", value: 20 },
];

const mixColors = ["#012a3d", "#60a5fa", "#f59e0b"];

const cardHover =
  "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:ring-1 hover:ring-primary/10";

function formatShortIDR(v: number) {
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function Dashboard() {
  usePageTitle("Dashboard");

  return (
    <div className="min-h-screen">
      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className={`bg-white rounded-2xl border shadow-sm p-4 ${cardHover}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Revenue (2025)</p>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-primary">
            {formatRupiah(incomeStatement2024.revenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Target: +12% YoY</p>
        </div>

        <div
          className={`bg-white rounded-2xl border shadow-sm p-4 ${cardHover}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Net Income</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-primary">
            {formatRupiah(incomeStatement2024.netIncome)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Margin dijaga stabil</p>
        </div>

        <div
          className={`bg-white rounded-2xl border shadow-sm p-4 ${cardHover}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Assets</p>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-primary">
            {formatRupiah(balanceSheet2024.totalAssets)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Risiko terdiversifikasi</p>
        </div>

        <div
          className={`bg-white rounded-2xl border shadow-sm p-4 ${cardHover}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Closing Cash</p>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-primary">
            {formatRupiah(cashFlow2024.closingCash)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Buffer kas aman</p>
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div
          className={`lg:col-span-8 bg-white rounded-2xl border shadow-sm p-5 ${cardHover}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Revenue vs Expenses Trend
              </h2>
              <p className="text-sm text-gray-500">
                Pantau tren bulanan untuk mendeteksi anomali lebih cepat.
              </p>
            </div>
            <span className="text-xs text-gray-500">2024</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trendData}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  width={46}
                  tickFormatter={(v) => formatShortIDR(Number(v))}
                  tickLine={false}
                  axisLine={false}
                />
                <ReTooltip formatter={(value) => formatRupiah(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`lg:col-span-4 bg-white rounded-2xl border shadow-sm p-5 ${cardHover}`}
        >
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Mix</h2>
            <p className="text-sm text-gray-500">
              Komposisi channel (estimasi).
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {revenueMix.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={mixColors[i % mixColors.length]}
                    />
                  ))}
                </Pie>
                <ReTooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {revenueMix.map((m, i) => (
              <div
                key={m.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded"
                    style={{ backgroundColor: mixColors[i % mixColors.length] }}
                  />
                  <span className="text-gray-700">{m.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{m.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Internal Management Summary */}
        <section
          className={`lg:col-span-3 bg-white rounded-xl p-4 shadow ${cardHover} flex flex-col`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Factory className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Internal Management</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Proses Aktif</span>
              <span className="font-bold text-primary">12</span>
            </div>
            <div className="flex justify-between">
              <span>Tugas Selesai (minggu ini)</span>
              <span className="font-bold text-primary">34</span>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Link
              to="/internal-management"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Kelola proses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Data Driven Audit Summary */}
        <section
          className={`lg:col-span-3 bg-white rounded-xl p-4 shadow ${cardHover} flex flex-col`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Data Driven Audit</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Temuan Risiko</span>
              <span className="font-bold text-primary">5</span>
            </div>
            <div className="flex justify-between">
              <span>Rekomendasi</span>
              <span className="font-bold text-primary">8</span>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Link
              to="/data-driven"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Lihat audit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* UMKM Berkembang Summary */}
        <section
          className={`lg:col-span-3 bg-white rounded-xl p-4 shadow ${cardHover} flex flex-col`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">UMKM Berkembang</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Skor Pertumbuhan</span>
              <span className="font-bold text-primary">78 / 100</span>
            </div>
            <div className="flex justify-between">
              <span>Program Aktif</span>
              <span className="font-bold text-primary">4</span>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Link
              to="/umkm-berkembang"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Lihat program <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Kelola Sampah feature removed */}

        {/* Permodalan Summary */}
        <section
          className={`lg:col-span-3 bg-white rounded-xl p-4 shadow ${cardHover} flex flex-col`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Permodalan</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Akses Pendanaan</span>
              <span className="font-bold text-primary">3 opsi</span>
            </div>
            <div className="flex justify-between">
              <span>Status Pengajuan</span>
              <span className="font-bold text-primary">Sedang diproses</span>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Link
              to="/permodalan"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Lihat opsi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
