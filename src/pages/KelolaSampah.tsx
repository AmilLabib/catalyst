import { useMemo, useState } from "react";
import { Truck, Gift, CheckCircle, BarChart } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
} from "recharts";

// Mock Data
const userStats = {
  totalKg: 120, // total recycled
  organicKg: 85,
  plasticKg: 35,
  points: 600,
};

const wasteHistory = [
  { type: "Organik", kg: 85 },
  { type: "Plastik", kg: 25 },
  { type: "Kertas", kg: 10 },
];

const rewards = [
  {
    id: "rw1",
    title: "Voucher Pelatihan Keuangan",
    cost: 50,
    image: "/voucher-1.png",
  },
  {
    id: "rw2",
    title: "Fitur Premium VARITY 1 Bulan",
    cost: 100,
    image: "/voucher-2.png",
  },
  {
    id: "rw3",
    title: "Diskon Konsultasi Pakar",
    cost: 75,
    image: "/voucher-3.png",
  },
];

function KelolaSampah() {
  // Form state
  const [form, setForm] = useState({
    type: "Organik",
    kg: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");

  const canRedeem = (cost: number) => userStats.points >= cost;

  const donutData = useMemo(
    () => [
      {
        name: "Organik",
        value: wasteHistory.find((w) => w.type === "Organik")?.kg ?? 0,
        color: "#486071",
      },
      {
        name: "Plastik",
        value: wasteHistory.find((w) => w.type === "Plastik")?.kg ?? 0,
        color: "#778d9b",
      },
      {
        name: "Kertas",
        value: wasteHistory.find((w) => w.type === "Kertas")?.kg ?? 0,
        color: "#9cb2c1",
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setModalOpen(false)}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-xl shadow-lg p-5">
              <h3 className="text-lg font-semibold text-primary mb-2">
                {modalTitle}
              </h3>
              <p className="text-sm text-gray-700">{modalMessage}</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="px-3 py-2 rounded-md border text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
            Kelola Sampah
          </h1>
        </header>
        <p className="text-sm text-gray-700 mb-6">
          Hubungkan UMKM dengan Mitra Terverifikasi untuk pengelolaan limbah.
          Daur ulang, lacak dampak, dan tukarkan poin untuk alat bisnis.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Eco-Dashboard */}
          <section className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Eco-Dashboard (Impact Tracker)
                </h2>
              </div>
              <span className="text-xs text-gray-500">
                as of {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-xs text-green-700">Total Waste Recycled</p>
                <p className="mt-1 text-3xl font-extrabold text-green-700">
                  {userStats.totalKg} Kg
                </p>
              </div>
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <p className="text-xs text-teal-700">Varity Points</p>
                <p className="mt-1 text-3xl font-extrabold text-teal-700">
                  {userStats.points} Pts
                </p>
              </div>
              <div className="rounded-xl border p-2">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ReTooltip />
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                      >
                        {donutData.map((d, i) => (
                          <Cell key={`slice-${i}`} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Komposisi Limbah: Organik, Plastik, Kertas
                </p>
              </div>
            </div>

            {/* Thank You Card */}
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <p className="text-sm text-green-700">
                Terima kasih telah berkontribusi menjaga bumi! Limbah Anda
                sedang diproses menjadi energi terbarukan.
              </p>
            </div>
          </section>

          {/* Pickup Request Form */}
          <section className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Pickup Request</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="border rounded-md px-3 py-2"
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option>Organik</option>
                <option>Plastik</option>
                <option>Kertas</option>
                <option>Logam/B3</option>
              </select>
              <input
                type="number"
                placeholder="Estimasi Berat (Kg)"
                className="border rounded-md px-3 py-2"
                value={form.kg}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, kg: e.target.value }))
                }
              />
              <input
                type="date"
                className="border rounded-md px-3 py-2"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Catatan (opsional)"
                className="border rounded-md px-3 py-2"
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
              />
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="w-full px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold"
                  onClick={() => {
                    if (!form.kg) return alert("Mohon isi estimasi berat.");
                    setModalTitle("Permintaan Pickup Terkirim");
                    setModalMessage(
                      "Permintaan terkirim ke Dinas Lingkungan Hidup Tangsel. Estimasi jemput: Besok.",
                    );
                    setModalOpen(true);
                  }}
                >
                  Kelola Sampahku
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Pickup oleh Mitra Terverifikasi.
                </p>
              </div>
            </div>
          </section>

          {/* Rewards Marketplace */}
          <section className="lg:col-span-12 bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Rewards Marketplace</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rewards.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden border"
                >
                  <div className="relative h-32 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-primary">{item.title}</p>
                    <p className="text-sm text-gray-600">
                      Cost: {item.cost} Pts
                    </p>
                    <button
                      className={`mt-3 px-3 py-2 rounded-md text-sm ${
                        canRedeem(item.cost)
                          ? "bg-teal-600 text-white"
                          : "bg-gray-200 text-gray-600 cursor-not-allowed"
                      }`}
                      disabled={!canRedeem(item.cost)}
                      onClick={() => {
                        if (!canRedeem(item.cost)) return;
                        setModalTitle("Redeem Berhasil");
                        setModalMessage(
                          "Redeemed! Poin akan dipotong dan benefit diaktifkan.",
                        );
                        setModalOpen(true);
                      }}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default KelolaSampah;
