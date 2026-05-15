import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import Anthropic from "@anthropic-ai/sdk";
import { useLocation } from "react-router-dom";

const getBaseUrl = () => {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5173";
  return `${origin}/anthropic`;
};

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY || "API_KEY_ANDA",
  baseURL: getBaseUrl(),
  dangerouslyAllowBrowser: true, // Required when calling from frontend
});

export default function ClaudeChatBubble() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content:
        "Halo! Saya AI Assistant Anda (Claude). Ada yang bisa saya bantu hari ini?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show tooltip after 2.5 seconds
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    // Hide tooltip after 10 seconds (7.5 seconds visible)
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 10000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Hide tooltip immediately when chat is opened
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");

    // Add user message
    const updatedHistory = [
      ...chatHistory,
      { role: "user", content: userMessage },
    ];
    setChatHistory(updatedHistory);
    setIsLoading(true);

    try {
      // Exclude the initial hardcoded assistant message for the API context
      // to keep it clean, or map everything except it.
      const apiMessages: any[] = updatedHistory.slice(1).map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: `Kamu adalah AI Assistant untuk aplikasi bernama 'Catalys', sebuah platform manajemen keuangan dan operasional untuk UMKM. Selalu jawab menggunakan bahasa indonesia tanpa menggunakan emoji atau karakter untuk menebalkan, memiringkan atau mengubah warna teks. 
        
BERIKUT ADALAH PENGETAHUAN TENTANG WEBSITE INI YANG HARUS KAMU TAHU:
1. Halaman Dashboard: Menampilkan ringkasan total pemasukan, pengeluaran, dan profit.
2. Halaman Financial: Tempat user mencatat transaksi harian, arus kas, dan laporan rugi laba.
3. Halaman Permodalan: Fitur untuk mengajukan pinjaman ke bank atau investor (BCA, Mandiri, dll).
4. Halaman Data-Driven: Berisi chart dan grafik analisis bisnis menggunakan AI.
5. Halaman Internal Management: Mengelola karyawan, KPI, dan sertifikasi/legalitas usaha.

PENTING: Saat ini user sedang berada di halaman/path: '${location.pathname}'.

ATURAN MENJAWAB:
1. JAWAB SECARA SINGKAT, PADAT, DAN LANGSUNG PADA INTINYA. Jangan bertele-tele.
2. DILARANG KERAS MENGGUNAKAN FORMATTING MARKDOWN APAPUN (jangan pakai #, *, **, -, atau tabel). Gunakan teks biasa (plain text) dengan spasi atau baris baru saja.
3. Jawablah selalu dalam Bahasa Indonesia yang baik, ramah, dan solutif.

Jika user bertanya "ini halaman apa?" atau "bagaimana cara pakainya?", atau meminta bantuan, jelaskan sesuai konteks halaman tersebut.`,
        messages:
          apiMessages.length > 0
            ? apiMessages
            : [{ role: "user", content: userMessage }],
      });

      const replyText =
        response.content[0].type === "text"
          ? response.content[0].text
          : "Response received.";

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);
    } catch (error: any) {
      console.error("Claude API Error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Maaf, terjadi kesalahan: ${error.message || "Gagal terhubung ke Claude AI."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Tooltip Bubble */}
      {!isOpen && showTooltip && (
        <div
          className="absolute bottom-[4.5rem] right-0 mb-2 w-64 bg-white text-gray-800 p-3 rounded-2xl shadow-xl border border-gray-100 z-40 animate-bounce cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-start gap-3 relative">
            <div className="bg-primary/10 text-primary p-2 rounded-full shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="pr-4">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                Bingung memakai aplikasi ini?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Yuk, tanya AI Assistant!
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={14} />
            </button>
          </div>
          {/* Tail */}
          <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-80 sm:w-96 h-[30rem] mb-4 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-white/80">Powered by Claude</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
                  chat.role === "user"
                    ? "bg-primary text-white rounded-tr-none self-end"
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-none self-start"
                }`}
              >
                {chat.content}
              </div>
            ))}
            {isLoading && (
              <div className="max-w-[85%] p-3 rounded-xl text-sm bg-white text-gray-800 border border-gray-200 rounded-tl-none self-start flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Mengetik...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              disabled={isLoading}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 size={16} className="ml-0 animate-spin" />
              ) : (
                <Send size={16} className="ml-1" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen
            ? "bg-gray-200 text-gray-600 scale-90"
            : "bg-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-1"
        } w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 z-50`}
        aria-label="Toggle Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
