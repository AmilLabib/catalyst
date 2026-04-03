import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// 🟢 KITA KUNCI MODELNYA DI SINI
// Gak usah auto-detect lagi biar gak nyasar ke model beta/berat
const MODEL_NAME = "gemini-2.0-flash-lite-preview";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

app.post("/api/gemini", async (req, res) => {
  const { message } = req.body;

  if (!GEMINI_KEY)
    return res.status(500).json({ error: "No API Key defined in .env" });
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    console.log(`🚀 Mengirim request ke model: ${MODEL_NAME}...`);

    // Langsung tembak URL spesifik modelnya
    const finalUrl = `${BASE_URL}/models/${MODEL_NAME}:generateContent?key=${GEMINI_KEY}`;

    const payload = {
      contents: [{ parts: [{ text: message }] }],
    };

    const response = await fetch(finalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Google Error:", data);
      return res
        .status(response.status)
        .json({ error: "Google Error", details: data });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ reply: replyText || "No response text." });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
