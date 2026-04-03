import { useMemo, useState } from "react";
import {
  AlertTriangle,
  TrendingDown,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Cell,
  BarChart,
} from "recharts";

// Mock Audit Data with deliberate negative trends
const mockAuditData = {
  financial: {
    series: [
      { month: "Jan", revenue: 42_000_000, expenses: 28_000_000 },
      { month: "Feb", revenue: 44_000_000, expenses: 29_500_000 },
      { month: "Mar", revenue: 41_500_000, expenses: 30_200_000 },
      { month: "Apr", revenue: 43_000_000, expenses: 31_000_000 },
      { month: "May", revenue: 39_000_000, expenses: 34_000_000 }, // net profit drop begins
      { month: "Jun", revenue: 37_000_000, expenses: 36_500_000 },
      { month: "Jul", revenue: 36_000_000, expenses: 38_000_000 }, // net profit negative
      { month: "Aug", revenue: 38_000_000, expenses: 41_500_000 }, // Beban Umum spike
      { month: "Sep", revenue: 39_000_000, expenses: 39_500_000 },
      { month: "Oct", revenue: 40_500_000, expenses: 38_000_000 },
      { month: "Nov", revenue: 39_500_000, expenses: 37_800_000 },
      { month: "Dec", revenue: 38_000_000, expenses: 38_500_000 },
    ],
    spikeIndex: 7, // Aug: expenses spike
    whatIf: {
      text: "AI Warning: Beban operasional naik 20% di luar tren. Rekomendasi: Audit pos pengeluaran 'Miscellaneous'. Potensi penghematan: Rp 2.5jt.",
    },
  },
  sales: {
    perHour: [
      { hour: "10:00", count: 32 },
      { hour: "11:00", count: 48 },
      { hour: "12:00", count: 75 },
      { hour: "13:00", count: 68 },
      { hour: "14:00", count: 50 },
      { hour: "15:00", count: 54 },
      { hour: "16:00", count: 70 },
      { hour: "17:00", count: 90 },
      { hour: "18:00", count: 110 },
      { hour: "19:00", count: 135 }, // peak
      { hour: "20:00", count: 120 },
      { hour: "21:00", count: 98 },
      { hour: "22:00", count: 60 },
    ],
    peakHour: "19:00",
    advice:
      "Penjualan tertinggi hari Sabtu pukul 19:00. Pastikan stok 'Menu Best Seller' aman 2 jam sebelumnya untuk menghindari lost sales.",
  },
  hr: {
    absenteeism: 0.15, // 15%
    note: "Tingkat ketidakhadiran tinggi (15%). Cek jadwal shift malam.",
  },
};

function DataDriven() {
  const [showWhatIf, setShowWhatIf] = useState(true);

  const spikeIdx = mockAuditData.financial.spikeIndex;
  const financialSeries = mockAuditData.financial.series;
  const peakHour = mockAuditData.sales.peakHour;

  const barColors = useMemo(
    () =>
      mockAuditData.sales.perHour.map(
        (item) =>
          item.hour === peakHour
            ? "#f59e0b" /* gold-ish */
            : "#60a5fa" /* blue */
      ),
    [peakHour]
  );

  const isHrAlert = mockAuditData.hr.absenteeism > 0.1;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <header className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
            AI Online Audit
          </h1>
        </header>
        <p className="text-sm text-gray-600 mb-6">
          Deteksi anomali real-time dan rekomendasi berbasis data untuk
          keputusan bisnis yang lebih baik.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Financial Audit Section */}
          <section className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold">
                  Financial Audit (Anomaly Detection)
                </h2>
              </div>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> as of{" "}
                {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={financialSeries}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${v}`
                    }
                    width={40}
                  />
                  <ReTooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Anomaly badge */}
            <div className="mt-3">
              {typeof spikeIdx === "number" && financialSeries[spikeIdx] ? (
                <button
                  onClick={() => setShowWhatIf(true)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 border border-red-200"
                >
                  <AlertTriangle className="w-4 h-4" /> ANOMALI TERDETEKSI:
                  PERIKSA
                </button>
              ) : null}
            </div>

            {/* What-If Analysis */}
            {showWhatIf && (
              <div className="mt-4 border rounded-xl p-4 bg-red-50 border-red-200">
                <p className="text-sm text-red-700">
                  {mockAuditData.financial.whatIf.text}
                </p>
              </div>
            )}
          </section>

          {/* Sales Intelligence Section */}
          <section className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">
                Sales Intelligence (Peak Time & Stock)
              </h2>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockAuditData.sales.perHour}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                  <YAxis width={40} />
                  <ReTooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {mockAuditData.sales.perHour.map((_, i) => (
                      <Cell key={`bar-${i}`} fill={barColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-sm text-gray-700 mt-3">
              {mockAuditData.sales.advice}
            </p>
          </section>

          {/* HR Performance Audit */}
          <section className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold">HR Performance Audit</h2>
            </div>

            <div
              className={`rounded-xl p-4 border ${
                isHrAlert
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <p
                className={`text-sm ${
                  isHrAlert ? "text-red-700" : "text-green-700"
                }`}
              >
                {mockAuditData.hr.note}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Absenteeism: {(mockAuditData.hr.absenteeism * 100).toFixed(0)}%
              </p>
            </div>
          </section>

          {/* Strategic Summary */}
          <section className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-2">Strategic Summary</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>
                Audit pos pengeluaran 'Miscellaneous' untuk meredam lonjakan
                Beban Umum.
              </li>
              <li>
                Amankan stok menu best seller 2 jam sebelum puncak penjualan.
              </li>
              <li>Tinjau jadwal shift malam dan kebijakan kehadiran.</li>
            </ul>
            <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white shadow">
              Konsultasikan Masalah Ini dengan Pakar VARITY
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DataDriven;
