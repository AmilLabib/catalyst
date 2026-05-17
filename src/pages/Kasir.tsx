import { useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

const DUMMY_PRODUCTS: Product[] = [
  { id: "1", name: "Es Teh Manis", price: 5000, category: "Minuman", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Teh" },
  { id: "2", name: "Kopi Hitam", price: 10000, category: "Minuman", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Kopi" },
  { id: "3", name: "Nasi Goreng Spesial", price: 25000, category: "Makanan", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Nasi+Goreng" },
  { id: "4", name: "Mie Goreng Telur", price: 20000, category: "Makanan", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Mie+Goreng" },
  { id: "5", name: "Kerupuk Udang", price: 5000, category: "Snack", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Kerupuk" },
  { id: "6", name: "Sate Ayam (10 Tusuk)", price: 30000, category: "Makanan", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Sate" },
  { id: "7", name: "Jus Jeruk", price: 15000, category: "Minuman", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Jus" },
  { id: "8", name: "Kacang Goreng", price: 8000, category: "Snack", image: "https://placehold.co/150x150/e2e8f0/0f172a?text=Kacang" },
];

const CATEGORIES = ["Semua", "Makanan", "Minuman", "Snack"];

export default function Kasir() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const filteredProducts = DUMMY_PRODUCTS.filter((p) => {
    const matchCategory = activeCategory === "Semua" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.11; // 11% PPN
  const total = subtotal + tax;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] bg-gray-50 overflow-hidden -m-4">
      {/* Left Area: Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar: Search & Categories */}
        <div className="bg-white p-4 border-b flex flex-col gap-4 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary" />
              Kasir / POS
            </h1>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-95 transform"
              >
                <div className="aspect-square bg-gray-100 relative">
                   <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                   <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-md text-xs font-semibold text-primary backdrop-blur-sm shadow-sm">
                     {product.category}
                   </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold mt-1 text-sm">
                    {formatRupiah(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
              <Search className="w-12 h-12 text-gray-300" />
              <p>Produk tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Order Summary / Cart */}
      <div className="w-96 bg-white border-l shadow-xl flex flex-col h-full z-20">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
             Detail Pesanan
             <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
               {cart.reduce((sum, item) => sum + item.quantity, 0)} item
             </span>
          </h2>
          <button 
            onClick={clearCart}
            disabled={cart.length === 0}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Kosongkan keranjang"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <ShoppingCart className="w-16 h-16 text-gray-200" />
              <p className="text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 bg-white">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm leading-tight">{item.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg border p-0.5">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-white rounded-md text-gray-600 shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-white rounded-md text-gray-600 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50/50 border-t flex flex-col gap-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>PPN (11%)</span>
              <span>{formatRupiah(tax)}</span>
            </div>
            <div className="pt-2 border-t border-dashed flex justify-between items-end">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-2xl font-bold text-primary">{formatRupiah(total)}</span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
