import { usePageTitleContext } from "../context/PageTitleContext";
import { useDemoMode } from "../context/DemoModeContext";
import { Menu, Bell, Search, PlayCircle } from "lucide-react";

type Props = {
  onMobileMenu?: () => void;
};

export default function Navbar({ onMobileMenu }: Props) {
  const { title: pageTitle } = usePageTitleContext();
  const { triggerDemo } = useDemoMode();

  return (
    <header className="bg-white border-b">
      <div className="max-w-[90rem] mx-auto px-4 md:px-8 py-3 flex items-center gap-4 relative">
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

        {/* Page title + Search bar */}
        <div className="flex-1 flex items-center justify-start gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="px-8 text-base sm:text-lg font-extrabold text-primary truncate max-w-[45vw]">
              {pageTitle}
            </h1>
          </div>
          <div className="w-full max-w-xl relative min-w-0">
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

          <button
            type="button"
            onClick={triggerDemo}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-white hover:bg-primary/90 text-sm"
            aria-label="Demo mode"
            title="Demo mode (inject dummy data)"
          >
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Demo mode</span>
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
