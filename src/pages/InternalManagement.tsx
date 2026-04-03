import { useEffect, useMemo, useState } from "react";
import {
  Factory,
  Users,
  Clock,
  Brain,
  CreditCard,
  QrCode,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  FunnelChart,
  Funnel,
} from "recharts";
import { formatRupiah } from "../data/financials";

// Mock data to render immediately
const mockData = {
  inventory: {
    rawMaterials: [
      {
        name: "Daging Sapi",
        category: "Meat",
        qty: 45,
        unit: "kg",
        unitCost: 120_000,
      },
      { name: "Ayam", category: "Meat", qty: 70, unit: "kg", unitCost: 48_000 },
      {
        name: "Sayur Mix",
        category: "Vegetables",
        qty: 120,
        unit: "kg",
        unitCost: 12_000,
      },
      {
        name: "Bumbu Rempah",
        category: "Spices",
        qty: 30,
        unit: "kg",
        unitCost: 80_000,
      },
    ],
    wip: [
      { name: "Rendang Marinasi", qty: 25, unit: "kg", unitCost: 160_000 },
      { name: "Kaldu Dasar", qty: 40, unit: "kg", unitCost: 40_000 },
    ],
    finishedGoods: [
      { name: "Rendang Daging", qty: 180, unit: "porsi", unitCost: 35_000 },
      { name: "Soto Ayam", qty: 220, unit: "porsi", unitCost: 18_000 },
    ],
    cogsMonthToDate: 48_500_000,
  },
  suppliers: [
    {
      name: "Pasar Induk Kramat Jati",
      materials: ["Sayur Mix", "Bumbu Rempah"],
    },
    { name: "Supplier Daging A", materials: ["Daging Sapi"] },
    { name: "Peternak Ayam B", materials: ["Ayam"] },
  ],
  workforce: {
    attendance: [
      {
        name: "Budi",
        role: "Cook",
        date: "2025-12-23",
        checkIn: "08:03",
        checkOut: "17:15",
        status: "On-time",
      },
      {
        name: "Siti",
        role: "Cashier",
        date: "2025-12-23",
        checkIn: "08:10",
        checkOut: "17:20",
        status: "Slightly Late",
      },
      {
        name: "Andi",
        role: "Waiter",
        date: "2025-12-23",
        checkIn: "07:55",
        checkOut: "16:50",
        status: "Early",
      },
      {
        name: "Rina",
        role: "Cook",
        date: "2025-12-23",
        checkIn: "08:05",
        checkOut: "17:05",
        status: "On-time",
      },
    ],
    roleSuitability: {
      employee: "Budi",
      sector: "Kitchen / Cook",
      score: 92,
      insights:
        "High compatibility. Strong consistency in prep speed and taste score; recommended for main course station leadership.",
    },
  },
  business: {
    customerInsights: {
      avgOrderValue: 52_000,
      retentionRate: 0.68,
      weeklyOrders: 820,
      trend: +0.06, // +6% WoW
    },
    campaignNotes:
      "Promo Tahun Baru: Paket Rendang + Es Teh 10% off. Kerja sama dengan Food Delivery X untuk free ongkir di radius 3 km.",
    payments: {
      qrisStatus: "Active" as "Active" | "Inactive",
      merchantName: "Warung Nusantara Bu Rina",
      merchantId: "IDM-QRIS-88231",
    },
  },
};

const palette = {
  raw: "#3b82f6", // blue
  wip: "#f59e0b", // orange
  finished: "#10b981", // green
};

type Supplier = { name: string; materials: string[] };
type Material = { name: string };
type WipItem = { name: string };
type FinalItem = { name: string };

function SupplyChainDiagram({
  suppliers,
  rawMaterials,
  wip,
  finished,
}: {
  suppliers: Supplier[];
  rawMaterials: Material[];
  wip: WipItem[];
  finished: FinalItem[];
}) {
  // Layout constants
  const colGap = 240;
  const nodeW = 180;
  const nodeH = 40;
  const margin = { top: 24, right: 40, bottom: 24, left: 40 };
  const cols = 4;

  const maxRows = Math.max(
    suppliers.length,
    rawMaterials.length,
    wip.length,
    finished.length
  );
  const vGap = 28;
  const height =
    margin.top + margin.bottom + maxRows * nodeH + (maxRows - 1) * vGap;
  const width = margin.left + margin.right + (cols - 1) * colGap + nodeW;

  const colX = [
    margin.left,
    margin.left + colGap,
    margin.left + colGap * 2,
    margin.left + colGap * 3,
  ];

  function columnYs(count: number) {
    // center nodes vertically
    const used = count * nodeH + (count - 1) * vGap;
    const start = margin.top + (height - margin.top - margin.bottom - used) / 2;
    return new Array(count).fill(0).map((_, i) => start + i * (nodeH + vGap));
  }

  const ySup = columnYs(suppliers.length);
  const yRaw = columnYs(rawMaterials.length);
  const yWip = columnYs(wip.length);
  const yFin = columnYs(finished.length);

  // Build quick name->index maps
  const rawIdx = new Map(rawMaterials.map((m, i) => [m.name, i] as const));
  const wipIdx = new Map(wip.map((m, i) => [m.name, i] as const));
  const finIdx = new Map(finished.map((m, i) => [m.name, i] as const));

  // Edges: supplier -> raw
  const edgesSupRaw: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  }> = [];
  suppliers.forEach((s, si) => {
    s.materials.forEach((mat) => {
      const ri = rawIdx.get(mat);
      if (ri !== undefined) {
        edgesSupRaw.push({
          from: { x: colX[0] + nodeW, y: ySup[si] + nodeH / 2 },
          to: { x: colX[1], y: yRaw[ri] + nodeH / 2 },
        });
      }
    });
  });

  // Heuristic edges: raw -> WIP
  const rawToWipPairs: Record<string, string[]> = {
    "Daging Sapi": ["Rendang Marinasi"],
    "Bumbu Rempah": ["Rendang Marinasi"],
    Ayam: ["Kaldu Dasar"],
    "Sayur Mix": ["Kaldu Dasar"],
  };
  const edgesRawWip: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  }> = [];
  rawMaterials.forEach((r, ri) => {
    (rawToWipPairs[r.name] || []).forEach((wName) => {
      const wi = wipIdx.get(wName);
      if (wi !== undefined) {
        edgesRawWip.push({
          from: { x: colX[1] + nodeW, y: yRaw[ri] + nodeH / 2 },
          to: { x: colX[2], y: yWip[wi] + nodeH / 2 },
        });
      }
    });
  });

  // Heuristic edges: WIP -> Final
  const wipToFinalPairs: Record<string, string[]> = {
    "Rendang Marinasi": ["Rendang Daging"],
    "Kaldu Dasar": ["Soto Ayam"],
  };
  const edgesWipFin: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  }> = [];
  wip.forEach((w, wi) => {
    (wipToFinalPairs[w.name] || []).forEach((fName) => {
      const fi = finIdx.get(fName);
      if (fi !== undefined) {
        edgesWipFin.push({
          from: { x: colX[2] + nodeW, y: yWip[wi] + nodeH / 2 },
          to: { x: colX[3], y: yFin[fi] + nodeH / 2 },
        });
      }
    });
  });

  // Render
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: width }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Column titles */}
          <g fontSize={12} fill="#374151">
            <text
              x={colX[0] + nodeW / 2}
              y={16}
              textAnchor="middle"
              fontWeight={600}
            >
              Suppliers
            </text>
            <text
              x={colX[1] + nodeW / 2}
              y={16}
              textAnchor="middle"
              fontWeight={600}
            >
              Raw Materials
            </text>
            <text
              x={colX[2] + nodeW / 2}
              y={16}
              textAnchor="middle"
              fontWeight={600}
            >
              WIP
            </text>
            <text
              x={colX[3] + nodeW / 2}
              y={16}
              textAnchor="middle"
              fontWeight={600}
            >
              Final Products
            </text>
          </g>

          {/* Edges */}
          <g stroke="#9ca3af" strokeWidth={1.5} fill="none" opacity={0.9}>
            {edgesSupRaw.map((e, i) => (
              <path
                key={`sr-${i}`}
                d={`M ${e.from.x} ${e.from.y} C ${e.from.x + 40} ${e.from.y}, ${
                  e.to.x - 40
                } ${e.to.y}, ${e.to.x} ${e.to.y}`}
              />
            ))}
            {edgesRawWip.map((e, i) => (
              <path
                key={`rw-${i}`}
                d={`M ${e.from.x} ${e.from.y} C ${e.from.x + 40} ${e.from.y}, ${
                  e.to.x - 40
                } ${e.to.y}, ${e.to.x} ${e.to.y}`}
              />
            ))}
            {edgesWipFin.map((e, i) => (
              <path
                key={`wf-${i}`}
                d={`M ${e.from.x} ${e.from.y} C ${e.from.x + 40} ${e.from.y}, ${
                  e.to.x - 40
                } ${e.to.y}, ${e.to.x} ${e.to.y}`}
              />
            ))}
          </g>

          {/* Nodes */}
          {/* Suppliers */}
          {suppliers.map((s, i) => (
            <g key={`sup-${s.name}`}>
              <rect
                x={colX[0]}
                y={ySup[i]}
                width={nodeW}
                height={nodeH}
                rx={8}
                fill="#f8fafc"
                stroke="#cbd5e1"
              />
              <text
                x={colX[0] + 12}
                y={ySup[i] + 24}
                fontSize={12}
                fill="#111827"
              >
                {s.name}
              </text>
            </g>
          ))}

          {/* Raw */}
          {rawMaterials.map((r, i) => (
            <g key={`raw-${r.name}`}>
              <rect
                x={colX[1]}
                y={yRaw[i]}
                width={nodeW}
                height={nodeH}
                rx={8}
                fill="#eff6ff"
                stroke="#bfdbfe"
              />
              <text
                x={colX[1] + 12}
                y={yRaw[i] + 24}
                fontSize={12}
                fill="#1e40af"
              >
                {r.name}
              </text>
            </g>
          ))}

          {/* WIP */}
          {wip.map((w, i) => (
            <g key={`wip-${w.name}`}>
              <rect
                x={colX[2]}
                y={yWip[i]}
                width={nodeW}
                height={nodeH}
                rx={8}
                fill="#fff7ed"
                stroke="#fed7aa"
              />
              <text
                x={colX[2] + 12}
                y={yWip[i] + 24}
                fontSize={12}
                fill="#9a3412"
              >
                {w.name}
              </text>
            </g>
          ))}

          {/* Final */}
          {finished.map((f, i) => (
            <g key={`fin-${f.name}`}>
              <rect
                x={colX[3]}
                y={yFin[i]}
                width={nodeW}
                height={nodeH}
                rx={8}
                fill="#ecfdf5"
                stroke="#bbf7d0"
              />
              <text
                x={colX[3] + 12}
                y={yFin[i] + 24}
                fontSize={12}
                fill="#065f46"
              >
                {f.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function RadialGauge({
  value,
  size = 120,
  stroke = 12,
  color = "#10b981",
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-gray-800"
        style={{ fontSize: 18, fontWeight: 700 }}
      >
        {clamped}%
      </text>
    </svg>
  );
}

export default function InternalManagement() {
  const [note, setNote] = useState<string>(mockData.business.campaignNotes);
  const [attendance, setAttendance] = useState(() => [
    ...mockData.workforce.attendance,
  ]);
  const [newAtt, setNewAtt] = useState({
    name: "",
    role: "",
    date: new Date().toISOString().slice(0, 10),
    checkIn: "08:00",
    checkOut: "17:00",
    status: "On-time" as "On-time" | "Slightly Late" | "Early",
  });

  // Aggregate inventory values
  const rawValue = useMemo(
    () =>
      mockData.inventory.rawMaterials.reduce(
        (s, m) => s + m.qty * m.unitCost,
        0
      ),
    []
  );
  const wipValue = useMemo(
    () => mockData.inventory.wip.reduce((s, m) => s + m.qty * m.unitCost, 0),
    []
  );
  const finishedValue = useMemo(
    () =>
      mockData.inventory.finishedGoods.reduce(
        (s, m) => s + m.qty * m.unitCost,
        0
      ),
    []
  );

  // removed funnel chart data
  const funnelData = useMemo(
    () => [
      { name: "Raw Material", value: Math.round(rawValue) },
      { name: "WIP", value: Math.round(wipValue) },
      { name: "Final Product", value: Math.round(finishedValue) },
      { name: "COGS (MTD)", value: mockData.inventory.cogsMonthToDate },
    ],
    [rawValue, wipValue, finishedValue]
  );

  const inventoryBars = useMemo(
    () => [
      { stage: "Raw", value: rawValue, color: palette.raw },
      { stage: "WIP", value: wipValue, color: palette.wip },
      { stage: "Final", value: finishedValue, color: palette.finished },
    ],
    [rawValue, wipValue, finishedValue]
  );

  // Optional: local persistence for notes (lightweight enhancement)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("im_campaign_note");
      if (stored) setNote(stored);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("im_campaign_note", note);
    } catch {}
  }, [note]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <header className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">
            Internal Management
          </h1>
        </header>

        <p className="text-sm text-gray-600 mb-6">
          Operasional harian UMKM Kuliner: pantau rantai pasok, persediaan,
          tenaga kerja, dan kontrol internal dalam satu dasbor.
        </p>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Supply Chain & Cost Accounting - prominent */}
          <section className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-md min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold">
                  Supply Chain & Cost Accounting
                </h2>
              </div>
              <span className="text-xs text-gray-500">
                as of {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            {/* Funnel Chart (restored) */}
            <div className="mt-6">
              <h3 className="text-base font-semibold mb-2">Cost Funnel</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <ReTooltip
                      formatter={(v: number) => formatRupiah(Number(v))}
                    />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive={false}
                    >
                      {/* Blue palette for slices */}
                      {/* Order matches funnelData entries */}
                      <Cell fill="#bfdbfe" />
                      <Cell fill="#93c5fd" />
                      <Cell fill="#60a5fa" />
                      <Cell fill="#3b82f6" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">Raw</p>
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(rawValue)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">WIP</p>
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(wipValue)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">Final</p>
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(finishedValue)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">COGS (MTD)</p>
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(mockData.inventory.cogsMonthToDate)}
                </p>
              </div>
            </div>

            {/* Inventory Bar Chart */}
            <div className="mt-5 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inventoryBars}
                  margin={{ top: 8, right: 16, left: -24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) =>
                      Number(v) >= 1_000_000
                        ? `${(Number(v) / 1_000_000).toFixed(1)}M`
                        : `${v}`
                    }
                    width={40}
                  />
                  <ReTooltip
                    formatter={(v: number) => formatRupiah(Number(v))}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {inventoryBars.map((d, i) => (
                      <Cell key={`bar-${i}`} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Supply Chain Diagram */}
            <div className="mt-6">
              <h3 className="text-base font-semibold mb-2">
                Supply Chain Diagram
              </h3>
              <SupplyChainDiagram
                suppliers={mockData.suppliers}
                rawMaterials={mockData.inventory.rawMaterials.map((m) => ({
                  name: m.name,
                }))}
                wip={mockData.inventory.wip.map((m) => ({ name: m.name }))}
                finished={mockData.inventory.finishedGoods.map((m) => ({
                  name: m.name,
                }))}
              />
            </div>
          </section>

          {/* Human Resources */}
          <section className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-md min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold">Smart Workforce</h2>
            </div>

            {/* Attendance */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium">Attendance</h3>
              </div>

              <div className="overflow-x-auto -mx-1">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Role</th>
                      <th className="py-2 pr-3">In</th>
                      <th className="py-2 pr-3">Out</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {a.name}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-600">
                          {a.role}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {a.checkIn}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {a.checkOut}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs border ${
                              a.status === "On-time"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : a.status === "Slightly Late"
                                ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() =>
                              setAttendance((prev) =>
                                prev.filter((_, i2) => i2 !== idx)
                              )
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Add entry form (moved below table) */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  className="border rounded-md px-3 py-2"
                  value={newAtt.name}
                  onChange={(e) =>
                    setNewAtt((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Role (e.g., Cook)"
                  className="border rounded-md px-3 py-2"
                  value={newAtt.role}
                  onChange={(e) =>
                    setNewAtt((p) => ({ ...p, role: e.target.value }))
                  }
                />
                <input
                  type="date"
                  className="border rounded-md px-3 py-2"
                  value={newAtt.date}
                  onChange={(e) =>
                    setNewAtt((p) => ({ ...p, date: e.target.value }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    className="border rounded-md px-3 py-2"
                    value={newAtt.checkIn}
                    onChange={(e) =>
                      setNewAtt((p) => ({ ...p, checkIn: e.target.value }))
                    }
                  />
                  <input
                    type="time"
                    className="border rounded-md px-3 py-2"
                    value={newAtt.checkOut}
                    onChange={(e) =>
                      setNewAtt((p) => ({ ...p, checkOut: e.target.value }))
                    }
                  />
                </div>
                <select
                  className="border rounded-md px-3 py-2"
                  value={newAtt.status}
                  onChange={(e) =>
                    setNewAtt((p) => ({
                      ...p,
                      status: e.target.value as
                        | "On-time"
                        | "Slightly Late"
                        | "Early",
                    }))
                  }
                >
                  <option>On-time</option>
                  <option>Slightly Late</option>
                  <option>Early</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-primary text-white"
                    onClick={() => {
                      if (!newAtt.name.trim() || !newAtt.role.trim()) return;
                      setAttendance((prev) => [{ ...newAtt }, ...prev]);
                      setNewAtt((p) => ({
                        ...p,
                        name: "",
                        role: "",
                      }));
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md border"
                    onClick={() =>
                      setNewAtt({
                        name: "",
                        role: "",
                        date: new Date().toISOString().slice(0, 10),
                        checkIn: "08:00",
                        checkOut: "17:00",
                        status: "On-time",
                      })
                    }
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div className="mt-6 border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">AI Role Suitability Match</h3>
              </div>
              <div className="flex items-center gap-4">
                <RadialGauge
                  value={mockData.workforce.roleSuitability.score}
                  color="#8b5cf6"
                />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {mockData.workforce.roleSuitability.employee}
                  </p>
                  <p className="text-sm text-gray-600">
                    Sector: {mockData.workforce.roleSuitability.sector}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    {mockData.workforce.roleSuitability.insights}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Business Tools Row */}
          <section className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Insights */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold">Customer Insights</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${
                    mockData.business.customerInsights.trend >= 0
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {(mockData.business.customerInsights.trend * 100).toFixed(0)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(
                      mockData.business.customerInsights.avgOrderValue
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Retention</p>
                  <p className="text-2xl font-bold text-primary">
                    {(
                      mockData.business.customerInsights.retentionRate * 100
                    ).toFixed(0)}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weekly Orders</p>
                  <p className="text-2xl font-bold text-primary">
                    {mockData.business.customerInsights.weeklyOrders}
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Notes */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold">Campaign Notes</h3>
              </div>
              <div className="rounded-xl p-3" style={{ background: "#fef3c7" }}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-36 bg-transparent outline-none text-sm"
                  placeholder="Write your promo plan..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Autosaved locally.</p>
            </div>

            {/* Payments / QRIS */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold">My QRIS</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${
                    mockData.business.payments.qrisStatus === "Active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {mockData.business.payments.qrisStatus}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 rounded-lg border grid place-items-center bg-gray-50">
                  <QrCode className="w-10 h-10 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {mockData.business.payments.merchantName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {mockData.business.payments.merchantId}
                  </p>
                </div>
              </div>
              <button className="mt-4 px-3 py-2 rounded-md border text-sm">
                Download QR
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
