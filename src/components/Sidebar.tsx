import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  BarChart2,
  Menu,
  X,
  Factory,
  AlertTriangle,
  Trophy,
  ShieldCheck,
  CircleDollarSign,
  Calculator,
  Settings,
  LogOut,
  User2,
  Map,
  ShoppingCart,
} from "lucide-react";

type Props = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen = false, onClose }: Props) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  function item(label: string, to: string, Icon: any) {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 py-3 px-3 rounded-md mb-2 text-sm font-medium transition-colors duration-200 ${
          active ? "bg-primary text-white" : "text-text hover:bg-gray-100"
        } ${collapsed ? "justify-center" : "justify-start"}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span
          className={`transition-all duration-300 ease-in-out origin-left ${
            collapsed
              ? "opacity-0 translate-x-[-6px] w-0 overflow-hidden"
              : "opacity-100 translate-x-0"
          }`}
        >
          {label}
        </span>
      </Link>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r px-4 py-4 transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top logo and toggle */}
        <div className="mb-8 flex items-center justify-between">
          <button
            className="flex items-center gap-2"
            onClick={() => setCollapsed((s) => !s)}
          >
            <img
              src="/logo.png"
              alt="logo"
              className={`transition-all ${collapsed ? "w-8" : "w-9"}`}
            />
            <span
              className={`text-sm font-semibold text-gray-800 tracking-wide transition-all origin-left ${
                collapsed ? "opacity-0 scale-95 w-0" : "opacity-100 scale-100"
              }`}
            >
              Catalyst
            </span>
          </button>

          <button
            onClick={() => setCollapsed((s) => !s)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-md hover:bg-gray-100"
          >
            {collapsed ? (
              <Menu className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto">
          <div>
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-2 ${
                collapsed ? "opacity-0" : "opacity-100"
              }`}
            >
              Overview
            </p>
            <div className="space-y-1">
              {item("Dashboard", "/dashboard", Home)}
              {item("Smart Pricing", "/smart-pricing", Calculator)}
            </div>
          </div>

          <div>
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-2 ${
                collapsed ? "opacity-0" : "opacity-100"
              }`}
            >
              Modules
            </p>
            <div className="space-y-1">
              {item("Kasir POS", "/kasir", ShoppingCart)}
              {item("Financial Reporting", "/financial", BarChart2)}
              {item("Internal Management", "/internal-management", Factory)}
              {item("Data Driven Audit", "/data-driven", AlertTriangle)}
              {item("UMKM Berkembang", "/umkm-berkembang", Trophy)}
              {item("Permodalan", "/permodalan", ShieldCheck)}
              {item("Subscription", "/subscription", CircleDollarSign)}
              {item("Cari Distributor", "/cari-distributor", Map)}
            </div>
          </div>
        </nav>

        {/* Bottom user/settings/logout */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700">
            <User2 className="w-4 h-4" />
            {!collapsed && <span>Profile</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700">
            <Settings className="w-4 h-4" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-red-50 text-sm text-red-600">
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <img src="/logo.png" alt="logo" className="w-10" />
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2" onClick={onClose}>
              {item("Dashboard", "/dashboard", Home)}
              {item("Financial Reporting", "/financial", BarChart2)}
              {item("Internal Management", "/internal-management", Factory)}
              {item("Data Driven Audit", "/data-driven", AlertTriangle)}
              {item("UMKM Berkembang", "/umkm-berkembang", Trophy)}
              {item("Permodalan", "/permodalan", ShieldCheck)}
              {item("Subscription", "/subscription", CircleDollarSign)}
              {item("Cari Distributor", "/cari-distributor", Map)}
              {item("Smart Pricing", "/smart-pricing", Calculator)}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
