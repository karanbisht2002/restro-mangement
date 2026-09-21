import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coffee,
  FileText,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { createOrder } from "../api/orders";
import type { Order } from "../types";
import { formatOrderLabel } from "../RestaurantApp";

export interface MenuItem {
  name: string;
  category: string;
  price: number;
  type: string;
  image?: string;
  description?: string;
  available?: boolean;
}

interface TableOrderPageProps {
  menuItems: MenuItem[];
  soldOutItems: string[];
  onOrderCreated: (order: Order) => void;
  kitchenClosed?: boolean;
  currencySymbol?: string;
  restaurantName?: string;
}

export default function TableOrderPage({
  menuItems,
  soldOutItems,
  onOrderCreated,
  kitchenClosed,
  currencySymbol = "₹",
  restaurantName,
}: TableOrderPageProps) {
  // Read table parameter from URL or fallback
  const [table, setTable] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tbl = urlParams.get("table");
      if (tbl) return tbl.startsWith("Table ") ? tbl : `Table ${tbl}`;
    } catch {}
    return "Table T08";
  });

  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [guestName, setGuestName] = useState("QR Guest");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState("");
  const [serviceAction, setServiceAction] = useState<string | null>(null);

  const availableItems = menuItems.filter(
    (item) => item.available !== false && !soldOutItems.includes(item.name),
  );

  const categories = [
    "All",
    ...Array.from(new Set(availableItems.map((item) => item.category))),
  ];

  const filteredItems = availableItems.filter((item) => {
    const matchesCat = category === "All" || item.category === category;
    const matchesDiet =
      dietaryFilter === "all" ||
      (dietaryFilter === "veg" && item.type.toLowerCase().includes("veg") && !item.type.toLowerCase().includes("non")) ||
      (dietaryFilter === "non-veg" && item.type.toLowerCase().includes("non"));
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesDiet && matchesSearch;
  });

  const cartTotal = cart.reduce(
    (total, { item, quantity }) => total + item.price * quantity,
    0,
  );
  const cartItemCount = cart.reduce((total, { quantity }) => total + quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.item.name === item.name ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemName: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.item.name === itemName ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const submitOrder = async () => {
    if (kitchenClosed) {
      setOrderError("Kitchen intake is currently suspended. Please contact your floor server.");
      return;
    }
    if (cart.length === 0) return;

    setSubmitting(true);
    setOrderError("");

    // Flatten cart items to array of names for Order
    const itemList: string[] = [];
    cart.forEach(({ item, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        itemList.push(item.name);
      }
    });

    try {
      const order = await createOrder({
        customer: guestName.trim() || "Table Guest",
        table,
        itemList,
        total: cartTotal,
        source: "website",
      });
      onOrderCreated(order);
      setOrderSuccess(order);
      setCart([]);
    } catch {
      setOrderError("Unable to place order. Please try again or notify your server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallWaiter = () => {
    setServiceAction("A server has been alerted to your table.");
    setTimeout(() => setServiceAction(null), 4000);
  };

  const handleRequestBill = () => {
    setServiceAction("Bill request dispatched to your assigned floor server.");
    setTimeout(() => setServiceAction(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#111615] text-[#e8ebe7] selection:bg-[#f4bc83] selection:text-[#1d2725]">
      {/* Top Mobile/Table Header */}
      <header className="sticky top-0 z-40 border-b border-[#24312e] bg-[#17201e]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a3a36] text-[#f4bc83] shadow-inner">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="display-font text-base font-bold text-white sm:text-lg">
                  {restaurantName || "Table & Thyme"}
                </h1>
                <span className="rounded-md bg-[#2d3e38] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f4bc83]">
                  Digital Table
                </span>
              </div>
              <p className="text-xs font-semibold text-[#8e9e97]">
                Seated at: <strong className="text-white">{table}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCallWaiter}
              className="flex items-center gap-1.5 rounded-xl border border-[#374c45] bg-[#1f2c28] px-3 py-2 text-xs font-bold text-[#b6c7bf] hover:bg-[#283934] transition active:scale-95"
              title="Call Server"
            >
              <Bell size={14} className="text-[#f4bc83]" />
              <span className="hidden sm:inline">Call Server</span>
            </button>
          </div>
        </div>
      </header>

      {/* Service Action Toast */}
      {serviceAction && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 w-[90%] max-w-md rounded-2xl border border-[#486359] bg-[#1e2e29] p-3 text-center text-xs font-bold text-[#f4bc83] shadow-2xl animate-fade-in">
          {serviceAction}
        </div>
      )}

      {/* Main Dining Container */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {kitchenClosed && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-center">
            <div className="flex items-center justify-center gap-2 font-bold text-red-300 text-sm">
              <AlertTriangle size={18} />
              Kitchen Intake Suspended
            </div>
            <p className="mt-1 text-xs text-red-200/80">
              The kitchen is temporarily not accepting new orders. You may still browse items.
            </p>
          </div>
        )}

        {/* Hero Card for Table Guests */}
        <div className="relative overflow-hidden rounded-3xl border border-[#2b3b36] bg-gradient-to-br from-[#1c2825] via-[#16201e] to-[#111716] p-6 shadow-2xl sm:p-8">
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#f4bc83]/5 blur-3xl" />
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#f4bc83]">
            Instant Digital Dining · {table}
          </p>
          <h2 className="display-font mt-2 text-2xl font-bold text-white sm:text-3xl">
            Order directly from your seat
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#94a8a0]">
            Browse appetizers, woodfired grills, signature cocktails, and mains. Your ticket transmits straight to our central kitchen & floor staff.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#8ba097]">
            <span className="flex items-center gap-1 rounded-lg bg-[#253530] px-2.5 py-1">
              <CheckCircle2 size={13} className="text-[#f4bc83]" /> Express Kitchen Line
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-[#253530] px-2.5 py-1">
              <CheckCircle2 size={13} className="text-[#f4bc83]" /> Live Chef Status
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-[#253530] px-2.5 py-1">
              <CheckCircle2 size={13} className="text-[#f4bc83]" /> Cash / Card at Table
            </span>
          </div>
        </div>

        {/* Search & Dietary Filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-[#6c8077]" />
            <input
              type="text"
              placeholder="Search dishes, drinks, appetizers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#273833] bg-[#192421] py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder-[#687d74] outline-none focus:border-[#f4bc83]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDietaryFilter("all")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                dietaryFilter === "all"
                  ? "bg-[#f4bc83] text-[#1c2623]"
                  : "border border-[#2d4039] bg-[#1b2724] text-[#8e9f98]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter("veg")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                dietaryFilter === "veg"
                  ? "bg-[#2e593d] text-emerald-200 border border-emerald-500"
                  : "border border-[#2d4039] bg-[#1b2724] text-[#8e9f98]"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Veg
            </button>
            <button
              onClick={() => setDietaryFilter("non-veg")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                dietaryFilter === "non-veg"
                  ? "bg-[#592e2e] text-red-200 border border-red-500"
                  : "border border-[#2d4039] bg-[#1b2724] text-[#8e9f98]"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-400" /> Non-Veg
            </button>
          </div>
        </div>

        {/* Category Carousel Tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                category === cat
                  ? "bg-white text-[#151f1c] shadow-md"
                  : "border border-[#263732] bg-[#17221f] text-[#85968f] hover:bg-[#202e2a]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => {
            const inCart = cart.find((c) => c.item.name === item.name);
            const isVeg = item.type.toLowerCase().includes("veg") && !item.type.toLowerCase().includes("non");
            return (
              <div
                key={item.name}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#24332f] bg-[#192320] p-4 transition hover:border-[#3d544c]"
              >
                <div>
                  <div className="relative h-36 w-full overflow-hidden rounded-xl bg-[#222e2a]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#556961]">
                        <Utensils size={28} />
                      </div>
                    )}
                    <span
                      className={`absolute top-2.5 right-2.5 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        isVeg ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50" : "bg-red-950/80 text-red-300 border border-red-500/50"
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <h3 className="mt-3 font-bold text-white text-sm">{item.name}</h3>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[#82968d]">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#23312d] pt-3">
                  <span className="text-base font-extrabold text-[#f4bc83]">
                    {currencySymbol}{item.price.toLocaleString("en-IN")}
                  </span>

                  {inCart ? (
                    <div className="flex items-center gap-2 rounded-xl bg-[#253631] p-1 border border-[#394f47]">
                      <button
                        onClick={() => removeFromCart(item.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a2623] text-white hover:bg-[#344841] transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f4bc83] text-[#1a2623] font-bold hover:bg-[#e6ab70] transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      disabled={kitchenClosed}
                      className="rounded-xl bg-[#f4bc83] px-3.5 py-1.5 text-xs font-bold text-[#1a2623] hover:bg-[#e6ab70] transition shadow-xs disabled:opacity-40"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Placement Box */}
        {cart.length > 0 && (
          <div className="sticky bottom-4 z-40 mt-8 rounded-2xl border-2 border-[#f4bc83]/60 bg-[#16211e]/98 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#283b35] pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#f4bc83]">
                  Table Order Details ({table})
                </p>
                <p className="text-[11px] text-[#869b91]">
                  Review and send directly to the kitchen
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-white">
                  {cartItemCount} item{cartItemCount > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-[#8fa399]">
                  Total: <strong className="text-[#f4bc83]">{currencySymbol}{cartTotal.toLocaleString("en-IN")}</strong>
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#8ba096]">
                  Lead Guest Name / Notes:
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rahul / Less spicy please"
                  className="mt-1 w-full rounded-xl border border-[#2d4039] bg-[#121a18] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#f4bc83]"
                />
              </div>

              <button
                onClick={submitOrder}
                disabled={submitting || kitchenClosed}
                className="mt-2 sm:mt-4 rounded-xl bg-[#f4bc83] px-6 py-3 text-sm font-extrabold text-[#1a2623] hover:bg-[#eab072] transition shadow-lg active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Transmitting Ticket..." : `Place Order (${currencySymbol}${cartTotal.toLocaleString("en-IN")})`}
              </button>
            </div>

            {orderError && (
              <p className="mt-2 text-xs font-bold text-red-400">{orderError}</p>
            )}
          </div>
        )}

        {/* Order Confirmation Modal */}
        {orderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-[#3b544b] bg-[#182421] p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#263e34] text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="display-font mt-4 text-2xl font-bold text-white">
                Order Transmitted!
              </h3>
              <p className="mt-1 text-xs text-[#8ca096]">
                Your order has been routed to the kitchen line.
              </p>

              <div className="mt-5 rounded-2xl bg-[#121b18] p-4 text-left text-xs border border-[#283832]">
                <div className="flex justify-between font-bold text-white">
                  <span>Order ID:</span>
                  <span className="text-[#f4bc83]">{formatOrderLabel(orderSuccess.id, orderSuccess.customer)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[#8ba096]">
                  <span>Table:</span>
                  <span className="text-white">{orderSuccess.table}</span>
                </div>
                <div className="mt-1 flex justify-between text-[#8ba096]">
                  <span>Items:</span>
                  <span className="text-white">{orderSuccess.itemList.length} items</span>
                </div>
                <div className="mt-2 border-t border-[#23312c] pt-2 flex justify-between font-extrabold text-white">
                  <span>Total Amount:</span>
                  <span className="text-[#f4bc83]">{currencySymbol}{Number(orderSuccess.total).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setOrderSuccess(null)}
                  className="w-full rounded-xl bg-[#f4bc83] py-3 text-xs font-bold text-[#182421] hover:bg-[#eab072] transition"
                >
                  Order More Items
                </button>
                <button
                  onClick={handleRequestBill}
                  className="w-full rounded-xl border border-[#384e46] bg-[#1e2e28] py-3 text-xs font-bold text-white hover:bg-[#2b3e36] transition"
                >
                  Request Bill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floor Assistance Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#2d3e38] bg-[#16211e] p-5">
          <div>
            <p className="font-bold text-white text-sm">Need Service Assistance?</p>
            <p className="text-xs text-[#82968d]">
              Our floor captains are available for fresh cutlery, water refills, or custom requests.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleCallWaiter}
              className="flex-1 sm:flex-initial rounded-xl border border-[#3e564d] bg-[#1d2b27] px-4 py-2.5 text-xs font-bold text-[#cfe0d6] hover:bg-[#2a3c36] transition"
            >
              Call Captain
            </button>
            <button
              onClick={handleRequestBill}
              className="flex-1 sm:flex-initial rounded-xl bg-[#b7623d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#c9744e] transition"
            >
              Request Bill
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
