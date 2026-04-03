import { Link } from "react-router-dom";
import {
  balanceSheet2024,
  incomeStatement2024,
  cashFlow2024,
  formatRupiah,
} from "../data/financials";
import {
  Leaf,
  ShieldCheck,
  BarChart2,
  Factory,
  AlertTriangle,
  Trophy,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Ikhtisar singkat dari halaman-halaman penting
          </p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Summary */}
        <section className="lg:col-span-4 bg-white rounded-xl p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Financial Summary</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Pendapatan</span>
              <span className="font-bold text-primary">
                {formatRupiah(incomeStatement2024.revenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Laba Bersih</span>
              <span className="font-bold text-primary">
                {formatRupiah(incomeStatement2024.netIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Aset</span>
              <span className="font-bold text-primary">
                {formatRupiah(balanceSheet2024.totalAssets)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kas Akhir</span>
              <span className="font-bold text-primary">
                {formatRupiah(cashFlow2024.closingCash)}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <Link
              to="/financial"
              className="text-primary text-sm hover:underline"
            >
              Lihat detail
            </Link>
          </div>
        </section>

        {/* Internal Management Summary */}
        <section className="lg:col-span-4 bg-white rounded-xl p-4 shadow">
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
          <div className="mt-3">
            <Link
              to="/internal-management"
              className="text-primary text-sm hover:underline"
            >
              Kelola proses
            </Link>
          </div>
        </section>

        {/* Data Driven Audit Summary */}
        <section className="lg:col-span-4 bg-white rounded-xl p-4 shadow">
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
          <div className="mt-3">
            <Link
              to="/data-driven"
              className="text-primary text-sm hover:underline"
            >
              Lihat audit
            </Link>
          </div>
        </section>

        {/* UMKM Berkembang Summary */}
        <section className="lg:col-span-4 bg-white rounded-xl p-4 shadow">
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
          <div className="mt-3">
            <Link
              to="/umkm-berkembang"
              className="text-primary text-sm hover:underline"
            >
              Lihat program
            </Link>
          </div>
        </section>

        {/* Kelola Sampah Summary */}
        <section className="lg:col-span-4 bg-white rounded-xl p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Kelola Sampah</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Total Daur Ulang</span>
              <span className="font-bold text-primary">120 Kg</span>
            </div>
            <div className="flex justify-between">
              <span>Varity Points</span>
              <span className="font-bold text-primary">600</span>
            </div>
          </div>
          <div className="mt-3">
            <Link
              to="/kelola-sampah"
              className="text-primary text-sm hover:underline"
            >
              Kelola
            </Link>
          </div>
        </section>

        {/* Permodalan Summary */}
        <section className="lg:col-span-4 bg-white rounded-xl p-4 shadow">
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
          <div className="mt-3">
            <Link
              to="/permodalan"
              className="text-primary text-sm hover:underline"
            >
              Lihat opsi
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
