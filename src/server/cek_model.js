// Hapus import dotenv, kita tembak langsung biar yakin
const GEMINI_KEY = "AIzaSyAkP18ZDXS_ruoTtOTLwkTRfhpP2K5cvpI"; // <-- Key lu gua taruh sini langsung

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`;

console.log("🔍 Sedang mengabsen model pake Key langsung...");

async function checkModels() {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.log("❌ Error dari Google:", data.error.message);
      // Kalau errornya 'API key not valid' lagi, berarti Key-nya emang mati/diblokir.
    } else {
      console.log("\n✅ KEY VALID! INI DAFTAR MODEL LU:");
      console.log("-----------------------------------");

      // Filter model yang bisa generate text
      const available = data.models.filter((m) =>
        m.supportedGenerationMethods.includes("generateContent")
      );

      if (available.length === 0) {
        console.log("⚠️ Key valid, tapi gak ada model yang available. Aneh.");
      }

      available.forEach((m) => {
        const cleanName = m.name.replace("models/", "");
        console.log(`👉 ${cleanName}`);
      });
      console.log("-----------------------------------");
    }
  } catch (err) {
    console.error("❌ Error Koneksi:", err);
  }
}

checkModels();
