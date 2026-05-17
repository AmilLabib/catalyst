import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { usePageTitle } from "../hooks/usePageTitle";

interface TooltipData {
  x: number;
  y: number;
  provinceName: string;
  distributors: string[];
  keterangan: {
    jenisBarang: string;
    skala: string;
  };
}

// Data Dummy Distributor
const distributorsByProvince: Record<string, string[]> = {
  Aceh: ["PT. Distribusi Sabang", "CV. Aceh Maju"],
  "Sumatera Utara": ["PT. Lintas Medan", "CV. Logistik Danau Toba"],
  "Sumatera Barat": ["UD. Minang Jaya", "CV. Padang Logistik"],
  Riau: ["PT. Riau Mandiri", "CV. Dumai Express"],
  "Kepulauan Riau": ["CV. Batam Center", "UD. Bintan Logistik"],
  Jambi: ["PT. Jambi Sejahtera", "CV. Muaro Jambi"],
  "Sumatera Selatan": ["CV. Sriwijaya Distribusi", "UD. Palembang Jaya"],
  Bengkulu: ["CV. Bengkulu Indah", "UD. Rejang Lebong"],
  Lampung: ["PT. Lampung Express", "CV. Krakatau Logistik"],
  "Bangka Belitung": ["UD. Timah Logistik", "CV. Bangka Belitung"],
  "Kepulauan Bangka Belitung": ["UD. Belitung Indah", "CV. Pangkal Pinang"],
  "DKI Jakarta": ["PT. Mega Distribusi Jakarta", "CV. Batavia Logistik"],
  "Jawa Barat": ["CV. Bandung Express", "UD. Priangan Jaya"],
  "Jawa Tengah": ["PT. Semar Logistik", "CV. Borobudur Distribusi"],
  "DI Yogyakarta": ["UD. Mataram Logistik", "CV. Jogja Istimewa"],
  "Jawa Timur": ["PT. Bromo Logistik", "CV. Surabaya Distribusi"],
  Banten: ["UD. Banten Jaya", "CV. Krakatau Express"],
  Bali: ["PT. Dewata Logistik", "CV. Bali Makmur"],
  "Nusa Tenggara Barat": ["UD. Rinjani Distribusi", "CV. Lombok Logistik"],
  "Nusa Tenggara Timur": ["PT. Komodo Express", "CV. Kupang Sejahtera"],
  "Kalimantan Barat": ["CV. Khatulistiwa Logistik", "UD. Pontianak Jaya"],
  "Kalimantan Tengah": ["PT. Palangkaraya Indah", "CV. Borneo Distribusi"],
  "Kalimantan Selatan": ["UD. Banjar Logistik", "CV. Martapura Jaya"],
  "Kalimantan Timur": ["PT. Mahakam Logistik", "CV. Balikpapan Express"],
  "Kalimantan Utara": ["UD. Tarakan Distribusi", "CV. Kaltara Logistik"],
  "Sulawesi Utara": ["PT. Minahasa Logistik", "CV. Manado Express"],
  "Sulawesi Tengah": ["UD. Palu Distribusi", "CV. Poso Jaya"],
  "Sulawesi Selatan": ["PT. Celebes Logistik", "CV. Makassar Express"],
  "Sulawesi Tenggara": ["UD. Kendari Distribusi", "CV. Buton Raya"],
  Gorontalo: ["PT. Gorontalo Logistik", "CV. Limboto Express"],
  "Sulawesi Barat": ["UD. Mamuju Distribusi", "CV. Majene Raya"],
  Maluku: ["PT. Ambon Logistik", "CV. Pattimura Express"],
  "Maluku Utara": ["UD. Ternate Distribusi", "CV. Halmahera Raya"],
  Papua: ["PT. Cendrawasih Logistik", "CV. Jayapura Express"],
  "Papua Barat": ["UD. Sorong Distribusi", "CV. Manokwari Raya"],
};

const getKeteranganTambahan = (provinsi: string) => {
  const infoSpesifik: Record<
    string,
    { jenisBarang: string; skala: string }
  > = {
    "DKI Jakarta": {
      jenisBarang: "FMCG, Elektronik, Tekstil",
      skala: "Nasional & Internasional",
    },
    "Jawa Timur": {
      jenisBarang: "Bahan Pokok, Manufaktur",
      skala: "Regional Jawa & Indonesia Timur",
    },
    "Jawa Barat": {
      jenisBarang: "Tekstil, Manufaktur, Makanan Ringan",
      skala: "Regional Jawa Barat & Nasional",
    },
    "Sumatera Utara": {
      jenisBarang: "Agrikultur, FMCG",
      skala: "Regional Sumatera",
    },
    "Sulawesi Selatan": {
      jenisBarang: "Hasil Laut, Bahan Pokok",
      skala: "Hub Indonesia Timur",
    },
  };
  return (
    infoSpesifik[provinsi] || {
      jenisBarang: "Barang Campuran Umum",
      skala: "Distribusi Lokal & Antar Kota",
    }
  );
};

const geoUrl =
  "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json";

const CariDistributor = () => {
  usePageTitle("Cari Distributor");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const handleClick = (
    geo: any,
    e: React.MouseEvent<SVGPathElement, MouseEvent>,
  ) => {
    let rawName =
      geo.properties.Propinsi ||
      geo.properties.name ||
      geo.properties.state ||
      "";

    if (rawName.toLowerCase().includes("jakarta")) rawName = "DKI Jakarta";
    if (rawName.toLowerCase().includes("yogyakarta")) rawName = "DI Yogyakarta";
    if (rawName.toLowerCase().includes("bangka"))
      rawName = "Kepulauan Bangka Belitung";

    const matchedKey = Object.keys(distributorsByProvince).find(
      (key) => key.toLowerCase() === rawName.toLowerCase(),
    );

    const finalName = matchedKey || rawName;
    const distributors = distributorsByProvince[finalName] || [];
    const keterangan = getKeteranganTambahan(finalName);

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      provinceName: finalName,
      distributors: distributors,
      keterangan: keterangan,
    });
  };

  const closeTooltip = () => setTooltip(null);

  return (
    <div
      className="min-h-screen bg-transparent relative"
      onClick={closeTooltip}
    >
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-b from-[#f2fcf9] from-2% to-white rounded-2xl p-6 shadow-md border border-gray-100 card-hover min-w-0">
          <h3 className="font-semibold text-xl text-gray-800 mb-2">
            Peta Jaringan Distributor
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Klik pada area provinsi di peta untuk melihat popup daftar distributor dan
            infonya.
          </p>

          <div className="h-[32rem] w-full bg-[#f0f8ff] rounded-xl overflow-hidden relative cursor-pointer flex items-center justify-center border border-blue-100">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1200,
                center: [118, -2.5],
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    let geoName =
                      geo.properties.Propinsi ||
                      geo.properties.name ||
                      geo.properties.state ||
                      "";
                    if (geoName.toLowerCase().includes("jakarta"))
                      geoName = "DKI Jakarta";
                    if (geoName.toLowerCase().includes("yogyakarta"))
                      geoName = "DI Yogyakarta";

                    const isSelected =
                      tooltip?.provinceName.toLowerCase() ===
                      geoName.toLowerCase();

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isSelected ? "#10b981" : "#cbd5e1"}
                        stroke="#ffffff"
                        strokeWidth={0.8}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          handleClick(geo, e);
                        }}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#6ee7b7", outline: "none" },
                          pressed: { fill: "#059669", outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 pointer-events-none transform -translate-x-1/2 -translate-y-[110%]"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <div className="absolute w-3 h-3 bg-white border-b border-r border-gray-200 transform rotate-45 left-1/2 -bottom-1.5 -translate-x-1/2"></div>

          <h4 className="font-bold text-gray-800 text-lg border-b pb-2 mb-2">
            {tooltip.provinceName}
          </h4>

          {tooltip.distributors.length > 0 ? (
            <div className="mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Daftar Distributor:
              </span>
              <ul className="mt-1 space-y-1">
                {tooltip.distributors.map((d, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 font-medium flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mb-3">
              Tidak ada data distributor.
            </p>
          )}

          <div className="bg-emerald-50 p-2 rounded text-xs space-y-1.5 border border-emerald-100">
            <p>
              <strong className="text-emerald-900">Jenis Barang:</strong>{" "}
              <span className="text-emerald-700">{tooltip.keterangan.jenisBarang}</span>
            </p>
            <p>
              <strong className="text-emerald-900">Skala:</strong>{" "}
              <span className="text-emerald-700">
                {tooltip.keterangan.skala}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CariDistributor;
