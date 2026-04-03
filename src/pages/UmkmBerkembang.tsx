import { useMemo, useState } from "react";
import { Calendar, MapPin, Trophy, BookOpen, ExternalLink } from "lucide-react";

type Opportunity = {
  id: string;
  title: string;
  category: "Event & Kompetisi" | "Pelatihan Keuangan" | "Pelatihan Ekspor";
  date: string;
  time: string;
  location: string;
  image?: string;
  short: string;
};

const opportunities: Opportunity[] = [
  {
    id: "evt-1",
    title: "Kompetisi Bisnis Nasional 2025",
    category: "Event & Kompetisi",
    date: "2025-02-15",
    time: "09:00 WIB",
    location: "Jakarta (Offline)",
    image: "/kompetisi-1.png",
    short:
      "Ajang kompetisi rencana bisnis skala nasional untuk pelaku UMKM & startup.",
  },
  {
    id: "evt-2",
    title: "Expo UMKM Nusantara",
    category: "Event & Kompetisi",
    date: "2025-03-10",
    time: "10:00 WIB",
    location: "Bandung (Offline)",
    image: "/kompetisi-2.png",
    short:
      "Pameran produk UMKM unggulan. Luaskan jaringan dan cari buyer potensial.",
  },
  {
    id: "fin-1",
    title: "Bedah Laporan Keuangan untuk Pemula",
    category: "Pelatihan Keuangan",
    date: "2025-01-20",
    time: "19:00 WIB",
    location: "Online (Zoom)",
    image: "/keuangan-1.png",
    short:
      "Belajar membuat Laporan Laba Rugi & Neraca dengan pendekatan praktis.",
  },
  {
    id: "fin-2",
    title: "Kelas HPP & Manajemen Cashflow",
    category: "Pelatihan Keuangan",
    date: "2025-02-05",
    time: "19:30 WIB",
    location: "Online (Google Meet)",
    image: "/keuangan-2.png",
    short:
      "Tentukan Harga Pokok Produksi yang tepat dan kelola arus kas harian UMKM.",
  },
  {
    id: "exp-1",
    title: "Menembus Pasar Eropa: Standar Kemasan",
    category: "Pelatihan Ekspor",
    date: "2025-01-28",
    time: "13:00 WIB",
    location: "Jakarta (Offline)",
    image: "/ekspor-1.png",
    short: "Pelajari standar kemasan dan regulasi untuk ekspor ke Uni Eropa.",
  },
  {
    id: "exp-2",
    title: "Mencari Buyer & Dokumen Bea Cukai",
    category: "Pelatihan Ekspor",
    date: "2025-02-12",
    time: "14:00 WIB",
    location: "Online (Webinar)",
    image: "/ekspor-2.png",
    short:
      "Strategi mencari buyer internasional dan kelengkapan dokumen ekspor.",
  },
  // Additional dummy data
  {
    id: "evt-3",
    title: "Kompetisi Inovasi Produk 2025",
    category: "Event & Kompetisi",
    date: "2025-04-05",
    time: "09:30 WIB",
    location: "Surabaya (Offline)",
    image: "/kompetisi-3.png",
    short:
      "Adu ide dan prototipe produk UMKM. Juri dari akademisi dan industri.",
  },
  {
    id: "evt-4",
    title: "Pitch Day UMKM Digital",
    category: "Event & Kompetisi",
    date: "2025-05-18",
    time: "13:00 WIB",
    location: "Online (Live Stream)",
    image: "/kompetisi-4.png",
    short: "Sesi pitching untuk UMKM digital di hadapan mentor dan investor.",
  },
  {
    id: "fin-3",
    title: "Fundamental Akuntansi untuk UMKM",
    category: "Pelatihan Keuangan",
    date: "2025-03-02",
    time: "19:00 WIB",
    location: "Online (Zoom)",
    image: "/keuangan-3.png",
    short: "Pahami pencatatan dasar, jurnal, dan laporan keuangan sederhana.",
  },
  {
    id: "fin-4",
    title: "Optimasi Pajak UMKM",
    category: "Pelatihan Keuangan",
    date: "2025-03-20",
    time: "19:30 WIB",
    location: "Online (Webinar)",
    image: "/keuangan-4.png",
    short:
      "Panduan praktis kewajiban pajak UMKM dan cara efisiensi yang legal.",
  },
  {
    id: "exp-3",
    title: "Sertifikasi Halal & Standar Global",
    category: "Pelatihan Ekspor",
    date: "2025-04-10",
    time: "10:00 WIB",
    location: "Jakarta (Offline)",
    image: "/ekspor-3.png",
    short:
      "Langkah memperoleh sertifikasi dan memenuhi standar pasar Timur Tengah.",
  },
  {
    id: "exp-4",
    title: "Logistik Ekspor: Incoterms & Freight",
    category: "Pelatihan Ekspor",
    date: "2025-04-28",
    time: "14:00 WIB",
    location: "Online (Webinar)",
    image: "/ekspor-4.png",
    short:
      "Memahami Incoterms, negosiasi freight, dan kelancaran proses pengiriman.",
  },
];

const tabs = [
  { key: "Event & Kompetisi", label: "Event & Kompetisi", icon: Trophy },
  { key: "Pelatihan Keuangan", label: "Pelatihan Keuangan", icon: BookOpen },
  { key: "Pelatihan Ekspor", label: "Pelatihan Ekspor", icon: ExternalLink },
] as const;

function UmkmBerkembang() {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]["key"]>("Event & Kompetisi");

  const filtered = useMemo(
    () => opportunities.filter((o) => o.category === activeTab),
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <header className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
            UMKM Berkembang
          </h1>
        </header>
        <p className="text-sm text-gray-600 mb-6">
          Kurasi konten pengembangan UMKM: pelatihan, kompetisi, dan peluang
          ekspor dari tim riset internal.
        </p>

        {/* Pill Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              {/* Poster / Banner */}
              <div className="relative aspect-video bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="text-gray-400 text-sm">Poster</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border border-blue-200 bg-blue-50 text-blue-700">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-primary line-clamp-2">
                  {item.title}
                </h3>

                {/* Meta */}
                <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-500" /> {item.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon /> {item.time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500" /> {item.location}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                  {item.short}
                </p>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button className="px-3 py-2 rounded-md bg-primary text-white text-sm transition-colors">
                    Lihat Detail
                  </button>
                  <button className="px-3 py-2 rounded-md border text-sm transition-colors hover:bg-gray-50">
                    Daftar Sekarang
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

// Small inline icon to avoid extra import
function ClockIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-500"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 8v5l3 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default UmkmBerkembang;
