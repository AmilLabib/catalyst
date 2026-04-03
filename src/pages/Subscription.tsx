export default function Subscription() {
  return (
    <div className="min-h-screen bg-bg py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-primary mb-2">
          Subscription Packages
        </h1>
        <p className="text-gray-600 mb-8">
          Choose a subscription package that suits your company's conditions and
          objectives.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Free */}
          <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col h-full">
            <div className="flex items-start gap-3">
              <div className="text-primary text-2xl">🎁</div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Free</h2>
                <p className="text-gray-700 mt-2">
                  Paket gratis dengan fitur dasar untuk memulai.
                </p>
              </div>
            </div>

            <div className="mt-4 flex-1">
              <p className="font-medium">Unlocked Features</p>
              <ul className="list-disc ml-5 mt-2 text-gray-700 space-y-1">
                <li>UMKM berkembang</li>
                <li>Tata Kelola Sampah</li>
                <li>Pelaporan Keuangan (Tanpa QR)</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between h-14">
              <div className="text-lg font-bold text-gray-800 flex items-center h-full">
                Free
              </div>
              <button className="bg-primary text-white px-4 py-2 rounded-full h-10 flex items-center justify-center">
                Pilih
              </button>
            </div>
          </div>

          {/* PRO */}
          <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col h-full">
            <div className="flex items-start gap-3">
              <div className="text-primary text-2xl">🚀</div>
              <div>
                <h2 className="text-xl font-semibold text-primary">PRO</h2>
                <p className="text-gray-700 mt-2">
                  Paket untuk tim yang butuh otomatisasi dan dukungan bulanan.
                </p>
              </div>
            </div>

            <div className="mt-4 flex-1">
              <p className="font-medium">Unlocked Features</p>
              <ul className="list-disc ml-5 mt-2 text-gray-700 space-y-1">
                <li>UMKM berkembang</li>
                <li>Tata Kelola Sampah</li>
                <li>Pelaporan Keuangan (Tanpa QR)</li>
                <li>Financial Reporting Authomatization</li>
                <li>Permodalan</li>
                <li>Konsultasi 1x sebulan</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between h-14">
              <div className="text-lg font-bold text-gray-800 flex items-center h-full">
                Rp 53.000 / bulan
              </div>
              <button className="bg-primary text-white px-4 py-2 rounded-full h-10 flex items-center justify-center">
                Pilih
              </button>
            </div>
          </div>

          {/* Business */}
          <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary flex flex-col h-full">
            <div className="flex items-start gap-3">
              <div className="text-primary text-2xl">🏢</div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Business</h2>
                <p className="text-gray-700 mt-2">
                  Paket lengkap untuk perusahaan yang memerlukan audit dan
                  manajemen internal.
                </p>
              </div>
            </div>

            <div className="mt-4 flex-1">
              <p className="font-medium">Unlocked Features</p>
              <ul className="list-disc ml-5 mt-2 text-gray-700 space-y-1">
                <li>UMKM berkembang</li>
                <li>Tata Kelola Sampah</li>
                <li>Pelaporan Keuangan (Tanpa QR)</li>
                <li>Financial Reporting Authomatization</li>
                <li>Permodalan</li>
                <li>Audit Intelligence</li>
                <li>Management Internal</li>
                <li>Konsultasi 3x sebulan</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between h-14">
              <div className="text-lg font-bold text-gray-800 flex items-center h-full">
                Rp 103.000 / bulan
              </div>
              <button className="bg-primary text-white px-4 py-2 rounded-full h-10 flex items-center justify-center">
                Pilih
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
