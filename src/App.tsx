import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import Financial from "./pages/Financial";
import InstructionsModal from "./components/InstructionsModal";
import InternalManagement from "./pages/InternalManagement";
import DataDriven from "./pages/DataDriven";
import UmkmBerkembang from "./pages/UmkmBerkembang";
import KelolaSampah from "./pages/KelolaSampah";
import Permodalan from "./pages/Permodalan";
import Subscription from "./pages/Subscription";

function LoginScreen() {
  const [passwordShown, setPasswordShown] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-6 bg-bg">
      <InstructionsModal
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <img src="/logo.png" alt="VerdeLedger logo" className="w-36" />
        </div>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text">Email</label>
            <input
              name="email"
              type="email"
              className="h-12 rounded-full border-2 border-gray-200 px-4 bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text">Password</label>
            <div className="relative">
              <input
                name="password"
                type={passwordShown ? "text" : "password"}
                className="h-12 rounded-full border-2 border-gray-200 px-4 w-full bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                required
              />
              <button
                type="button"
                aria-label="Toggle password"
                onClick={() => setPasswordShown((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {passwordShown ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button className="mt-2 h-14 rounded-full bg-primary text-white text-lg font-bold">
            Masuk
          </button>

          <div className="flex flex-col items-center gap-1 mt-3">
            <a href="#" className="text-sm underline">
              Lupa Password?
            </a>
            <a href="#" className="text-sm underline font-semibold">
              Daftar Akun
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/financial" element={<Financial />} />
        <Route path="/internal-management" element={<InternalManagement />} />
        <Route path="/data-driven" element={<DataDriven />} />
        <Route path="/umkm-berkembang" element={<UmkmBerkembang />} />
        <Route path="/kelola-sampah" element={<KelolaSampah />} />
        <Route path="/permodalan" element={<Permodalan />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>
    </Routes>
  );
}
