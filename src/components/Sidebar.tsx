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
  Leaf,
  ShieldCheck,
  CircleDollarSign,
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
        className={`bg-white rounded-xl p-3 shadow-md hidden md:block transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? "w-20" : "w-56"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div
            className={`transition-all duration-300 ease-in-out ${
              collapsed ? "w-8" : "w-40"
            }`}
          >
            <img
              src="/logo.png"
              alt="logo"
              className={`block ${collapsed ? "w-8" : "w-20"}`}
            />
          </div>

          <button
            onClick={() => setCollapsed((s) => !s)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1 rounded hover:bg-gray-100"
          >
            {collapsed ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="space-y-1">
          {item("Dashboard", "/dashboard", Home)}
          {item("Financial Reporting", "/financial", BarChart2)}
          {item("Internal Management", "/internal-management", Factory)}
          {item("Data Driven Audit", "/data-driven", AlertTriangle)}
          {item("UMKM Berkembang", "/umkm-berkembang", Trophy)}
          {item("Kelola Sampah", "/kelola-sampah", Leaf)}
          {item("Permodalan", "/permodalan", ShieldCheck)}
          {item("Subscription", "/subscription", CircleDollarSign)}
        </nav>
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
              {item("Kelola Sampah", "/kelola-sampah", Leaf)}
              {item("Permodalan", "/permodalan", ShieldCheck)}
              {item("Subscription", "/subscription", CircleDollarSign)}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
