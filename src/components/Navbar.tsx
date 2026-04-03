import { Link } from "react-router-dom";
import { Menu, Calculator } from "lucide-react";

type Props = {
  onMobileMenu?: () => void;
};

export default function Navbar({ onMobileMenu }: Props) {
  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-[90rem] mx-auto px-4 md:pl-4 py-4 flex items-center justify-between">
        <div className="md:hidden">
          <button
            onClick={onMobileMenu}
            aria-label="Open menu"
            className="p-2 rounded hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center md:justify-start">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="logo" className="w-10 md:w-12" />
            <span className="text-xl md:text-2xl font-extrabold text-primary tracking-wide">
              CATALYST
            </span>
          </Link>
        </div>

        <div className="md:block hidden">
          <Link
            to="/smart-pricing"
            className="inline-flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100"
          >
            <Calculator className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Smart Pricing
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
