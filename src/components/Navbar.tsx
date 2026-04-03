import { Link } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";

type Props = {
  onMobileMenu?: () => void;
};

export default function Navbar({ onMobileMenu }: Props) {
  return (
    <header className="bg-white border-b">
      <div className="max-w-[90rem] mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={onMobileMenu}
            aria-label="Open menu"
            className="p-2 rounded hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {/* Logo / title */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:inline text-lg md:text-xl font-extrabold text-primary tracking-wide">
              Dashboard
            </span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xl relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search reports, customers, or insights..."
              className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-100 border border-transparent focus:border-primary/40 focus:bg-white focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full hover:bg-gray-100"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 block w-2 h-2 rounded-full bg-red-500" />
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              AL
            </div>
            <div className="leading-tight">
              <p className="text-xs font-medium text-gray-800">Amil Labib</p>
              <p className="text-[11px] text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
