import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ClaudeChatBubble from "../components/ClaudeChatBubble";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex relative">
      {/* Sidebar (desktop + mobile handled inside component) */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="px-4 md:px-8 py-6 max-w-[90rem] w-full mx-auto relative">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Chat Bubble */}
      <ClaudeChatBubble />
    </div>
  );
}
