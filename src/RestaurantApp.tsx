import { useEffect, useState } from "react";
import type { ComponentType, FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  Menu as MenuIcon,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  QrCode,
  Search,
  Settings2,
  LogOut,
  ShoppingBag,
  Sparkles,
  Table2,
  Trash2,
  Volume2,
  PauseCircle,
  RefreshCw,
  UserCheck,
  UserRound,
  Users,
  Upload,
  Utensils,
  X,
} from "lucide-react";
import { kitchenPages } from "./kitchen/permissions";
import {
  getNextKitchenStatus,
  kitchenStations,
  kitchenTicketDetails,
  notifyServer,
  toggleSoldOutItem,
} from "./kitchen/actions";
import ManagerControlPanel from "./manager/ManagerControlPanel";
import ServantControlPanel from "./servant/ServantControlPanel";
import { managerPages } from "./manager/permissions";
import { serverPages } from "./servant/permissions";
import type { Order, OrderStatus, Page, StaffRole } from "./types";
import { createOrder, fetchOrders, updateOrderStatus } from "./api/orders";
import {
  createMenuItem,
  fetchMenuItems,
  updateMenuItem,
  deleteMenuItem,
  type MenuItem as ApiMenuItem,
} from "./api/items";
import {
  fetchBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  type TableBooking,
  type BookingStatus,
} from "./api/bookings";
import {
  fetchTables,
  updateTableStatus,
  createTable,
  deleteTable,
  type RestaurantTable,
  type TableStatus,
} from "./api/tables";
import { getKitchenStatus, toggleKitchenStatus } from "./api/kitchen";

type Icon = ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;
const navGroups: { title: string; items: { label: Page; icon: Icon }[] }[] = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Reservations", icon: CalendarCheck },
      { label: "Floor plan", icon: Table2 },
      { label: "Orders", icon: ShoppingBag },
      { label: "Kitchen", icon: ChefHat },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Menu", icon: Utensils },
      { label: "Inventory", icon: Package },
      { label: "Billing", icon: CircleDollarSign },
      { label: "Team", icon: Users },
    ],
  },
];

const roleNavGroups: Record<StaffRole, Page[]> = {
  Server: serverPages,
  Kitchen: kitchenPages,
  Manager: managerPages,
};

function getNavGroups(role: StaffRole) {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(({ label }) =>
        roleNavGroups[role].includes(label),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function formatOrderLabel(id: string, customer?: string): string {
  let orderNum = id || "";
  if (orderNum.startsWith("order_")) {
    const rawNum = orderNum.replace("order_", "");
    orderNum = rawNum.length > 5 ? rawNum.slice(-5) : rawNum;
  }
  if (!orderNum.startsWith("#")) {
    orderNum = `#${orderNum}`;
  }
  const cleanCustomer = (customer || "").trim();
  if (!cleanCustomer) {
    return orderNum;
  }
  return `${orderNum}(${cleanCustomer})`;
}

const initialOrders: Order[] = [
  {
    id: "#1048",
    customer: "Riya Sharma",
    table: "Table 08",
    items: "2 items",
    itemList: ["Citrus butter chicken", "Garlic naan"],
    total: "₹1,842",
    status: "Queued",
  },
  {
    id: "#1047",
    customer: "Arjun Mehta",
    table: "Table 14",
    items: "4 items",
    itemList: ["Charred paneer tikka", "Truffle mushroom bao", "2 lime sodas"],
    total: "₹3,640",
    status: "Ready",
  },
  {
    id: "#1046",
    customer: "Takeaway · Neha Joshi",
    table: "Takeaway",
    items: "1 item",
    itemList: ["Burnt basque cheesecake"],
    total: "₹760",
    status: "Served",
  },
  {
    id: "#1045",
    customer: "Kabir and friends",
    table: "Table 03",
    items: "3 items",
    itemList: ["Citrus spritz", "Wild mushroom risotto", "Still water"],
    total: "₹2,250",
    status: "Preparing",
  },
];
const initialTables: RestaurantTable[] = [
  { id: "T01", seats: 2, zone: "Window", status: "Available", serverName: "Priya S." },
  { id: "T02", seats: 4, zone: "Family", status: "Occupied", serverName: "Aarav R." },
  { id: "T03", seats: 4, zone: "Family", status: "Needs cleaning", serverName: "Aarav R." },
  { id: "T04", seats: 6, zone: "Garden", status: "Available", serverName: "Vikram K." },
  { id: "T05", seats: 2, zone: "Window", status: "Booked", serverName: "Priya S." },
  { id: "T06", seats: 8, zone: "Family", status: "Occupied", serverName: "Aarav R." },
  { id: "T07", seats: 4, zone: "Garden", status: "Available", serverName: "Vikram K." },
  { id: "T08", seats: 6, zone: "Smoking", status: "Occupied", serverName: "Priya S." },
  { id: "T09", seats: 2, zone: "Window", status: "Available", serverName: "Priya S." },
  { id: "T10", seats: 4, zone: "Family", status: "Booked", serverName: "Aarav R." },
];

const initialReservations: TableBooking[] = [
  {
    id: "book_101",
    customer: "Maya Kapoor",
    phone: "+91 98201 12345",
    bookingDate: new Date().toISOString().slice(0, 10),
    bookingTime: "12:30 PM",
    guests: 4,
    tableId: "T05",
    status: "Booked",
    deposit: 500,
    source: "Phone",
    specialRequests: "Window table preferred",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "book_102",
    customer: "Rohan Mehta",
    phone: "+91 98202 23456",
    bookingDate: new Date().toISOString().slice(0, 10),
    bookingTime: "1:00 PM",
    guests: 2,
    tableId: "T01",
    status: "Arrived",
    deposit: 500,
    source: "Walk-in",
    specialRequests: "",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "book_103",
    customer: "The Sharma party",
    phone: "+91 98203 34567",
    bookingDate: new Date().toISOString().slice(0, 10),
    bookingTime: "7:30 PM",
    guests: 6,
    tableId: null,
    status: "Booked",
    deposit: 500,
    source: "Web link",
    specialRequests: "Birthday celebration",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "book_104",
    customer: "Anika Singh",
    phone: "+91 98204 45678",
    bookingDate: new Date().toISOString().slice(0, 10),
    bookingTime: "8:00 PM",
    guests: 3,
    tableId: "T10",
    status: "No show",
    deposit: 500,
    source: "Phone",
    specialRequests: "High chair needed",
    createdAt: "",
    updatedAt: "",
  },
];
const fallbackMenuItems: ApiMenuItem[] = [
  // Small plates
  {
    id: "item_truffle_bao",
    name: "Truffle mushroom bao",
    category: "Small plates",
    price: 420,
    type: "veg",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    description: "Steamed bao filled with roasted wild mushrooms and truffle aioli.",
    available: true,
    preparationTimeMinutes: 12,
    allergens: ["gluten", "soy"],
    tags: ["vegan", "popular", "signature"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_paneer_tikka",
    name: "Charred paneer tikka",
    category: "Small plates",
    price: 480,
    type: "veg",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
    description: "Cottage cheese cubes marinated in Kashmiri chili and mustard oil, roasted over charcoal.",
    available: true,
    preparationTimeMinutes: 15,
    allergens: ["dairy"],
    tags: ["veg", "tandoor", "chef-special"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_lotus_stem",
    name: "Crispy honey chili lotus stem",
    category: "Small plates",
    price: 390,
    type: "veg",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    description: "Wok-tossed lotus stem glazed in hot honey, garlic chili oil, and toasted sesame.",
    available: true,
    preparationTimeMinutes: 10,
    allergens: ["sesame", "soy"],
    tags: ["veg", "crispy", "snack"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_lamb_seekh",
    name: "Spiced lamb seekh kebab",
    category: "Small plates",
    price: 620,
    type: "non-veg",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    description: "Tender hand-minced lamb skewers perfumed with smoked cloves, mace, and mint chutney.",
    available: true,
    preparationTimeMinutes: 18,
    allergens: ["dairy"],
    tags: ["non-veg", "tandoor", "popular"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_dynamite_prawns",
    name: "Dynamite prawns",
    category: "Small plates",
    price: 650,
    type: "non-veg",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    description: "Golden crisp butterflied prawns tossed in sriracha tobanjan glaze and scallions.",
    available: true,
    preparationTimeMinutes: 14,
    allergens: ["crustacean", "egg"],
    tags: ["non-veg", "spicy", "signature"],
    createdAt: "",
    updatedAt: "",
  },

  // Mains
  {
    id: "item_butter_chicken",
    name: "Citrus butter chicken",
    category: "Mains",
    price: 680,
    type: "non-veg",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
    description: "Smoked chicken tikka in silky slow-reduced tomato gravy balanced with fresh citrus zest and fenugreek.",
    available: true,
    preparationTimeMinutes: 20,
    allergens: ["dairy"],
    tags: ["non-veg", "popular", "bestseller"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_mushroom_risotto",
    name: "Wild mushroom risotto",
    category: "Mains",
    price: 590,
    type: "veg",
    image: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80",
    description: "Creamy aged carnaroli rice with wild porcini, parmesan crisp, and white truffle oil.",
    available: true,
    preparationTimeMinutes: 22,
    allergens: ["dairy"],
    tags: ["veg", "gluten-free"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_dal_makhani",
    name: "Slow-cooked dal makhani",
    category: "Mains",
    price: 490,
    type: "veg",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    description: "Black lentils simmered overnight over clay oven embers with churned white butter.",
    available: true,
    preparationTimeMinutes: 15,
    allergens: ["dairy"],
    tags: ["veg", "signature", "comfort"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_salmon",
    name: "Pan-seared Norwegian salmon",
    category: "Mains",
    price: 890,
    type: "non-veg",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
    description: "Crispy skin Atlantic salmon over sweet edamame puree, grilled asparagus, and lemon butter.",
    available: true,
    preparationTimeMinutes: 25,
    allergens: ["fish", "dairy"],
    tags: ["non-veg", "chef-special", "healthy"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_dum_biryani",
    name: "Awadhi chicken dum biryani",
    category: "Mains",
    price: 640,
    type: "non-veg",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    description: "Fragrant aged basmati rice dum-cooked with tender spiced chicken, saffron, and browned onions.",
    available: true,
    preparationTimeMinutes: 25,
    allergens: ["dairy"],
    tags: ["non-veg", "popular", "royal"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_ravioli",
    name: "Ricotta & spinach ravioli",
    category: "Mains",
    price: 560,
    type: "veg",
    image: "https://images.unsplash.com/photo-1587740896339-96a76170508d?auto=format&fit=crop&w=800&q=80",
    description: "Handmade pasta pillows filled with whipped ricotta and baby spinach in sage brown butter.",
    available: true,
    preparationTimeMinutes: 18,
    allergens: ["gluten", "dairy", "egg"],
    tags: ["veg", "handcrafted"],
    createdAt: "",
    updatedAt: "",
  },

  // Sides & Breads
  {
    id: "item_garlic_naan",
    name: "Garlic naan",
    category: "Sides & Breads",
    price: 120,
    type: "veg",
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    description: "Blistered clay-oven flatbread brushed with roasted garlic butter and fresh cilantro.",
    available: true,
    preparationTimeMinutes: 6,
    allergens: ["gluten", "dairy"],
    tags: ["veg", "tandoor", "bestseller"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_truffle_fries",
    name: "Truffle parmesan fries",
    category: "Sides & Breads",
    price: 290,
    type: "veg",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    description: "Skin-on hand-cut potatoes tossed in aromatic white truffle oil, shaved parmesan, and rosemary.",
    available: true,
    preparationTimeMinutes: 8,
    allergens: ["dairy"],
    tags: ["veg", "crispy"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_laccha_paratha",
    name: "Laccha paratha",
    category: "Sides & Breads",
    price: 110,
    type: "veg",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    description: "Multi-layered flaky whole wheat bread cooked golden brown in tandoor with ghee.",
    available: true,
    preparationTimeMinutes: 6,
    allergens: ["gluten", "dairy"],
    tags: ["veg", "traditional"],
    createdAt: "",
    updatedAt: "",
  },

  // Desserts
  {
    id: "item_cheesecake",
    name: "Burnt basque cheesecake",
    category: "Desserts",
    price: 380,
    type: "veg",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
    description: "Silky baked cheesecake with a deeply caramelized top, Madagascar vanilla, and berry coulis.",
    available: true,
    preparationTimeMinutes: 5,
    allergens: ["dairy", "egg"],
    tags: ["veg", "popular", "signature"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_chocolate_fondant",
    name: "Belgian dark chocolate fondant",
    category: "Desserts",
    price: 420,
    type: "veg",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    description: "Warm chocolate cake with molten ganache center made with 70% dark chocolate and vanilla bean gelato.",
    available: true,
    preparationTimeMinutes: 12,
    allergens: ["dairy", "gluten", "egg"],
    tags: ["veg", "decadent"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_pistachio_kulfi",
    name: "Saffron pistachio kulfi",
    category: "Desserts",
    price: 280,
    type: "veg",
    image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=800&q=80",
    description: "Traditional slow-churned Indian ice cream infused with saffron strands, crushed pistachios, and green cardamom.",
    available: true,
    preparationTimeMinutes: 5,
    allergens: ["dairy", "nuts"],
    tags: ["veg", "traditional", "gluten-free"],
    createdAt: "",
    updatedAt: "",
  },

  // Beverages
  {
    id: "item_citrus_spritz",
    name: "Citrus spritz",
    category: "Beverages",
    price: 280,
    type: "veg",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    description: "Handcrafted spritz of blood orange, fresh yuzu, elderflower tonic, and bruised thyme sprig.",
    available: true,
    preparationTimeMinutes: 4,
    allergens: [],
    tags: ["vegan", "refreshing", "mocktail"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_lime_soda",
    name: "Fresh lime soda",
    category: "Beverages",
    price: 180,
    type: "veg",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    description: "Hand-muddled Persian limes, fresh mint leaves, rock salt, and chilled sparkling soda.",
    available: true,
    preparationTimeMinutes: 3,
    allergens: [],
    tags: ["vegan", "classic"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "item_cold_brew",
    name: "Artisanal cold brew tonic",
    category: "Beverages",
    price: 310,
    type: "veg",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    description: "18-hour cold steeped Arabica single-origin coffee poured over botanical tonic and orange peel.",
    available: true,
    preparationTimeMinutes: 3,
    allergens: [],
    tags: ["vegan", "artisan-coffee"],
    createdAt: "",
    updatedAt: "",
  },
];
const inventory = [
  {
    name: "Arborio rice",
    unit: "kg",
    current: 18,
    minimum: 10,
    cost: "₹280 / kg",
  },
  { name: "Paneer", unit: "kg", current: 4, minimum: 8, cost: "₹420 / kg" },
  {
    name: "Chicken breast",
    unit: "kg",
    current: 22,
    minimum: 12,
    cost: "₹360 / kg",
  },
  {
    name: "Truffle oil",
    unit: "bottle",
    current: 3,
    minimum: 5,
    cost: "₹1,200 / bottle",
  },
];

function StatusPill({ status }: { status: string }) {
  const tone = status === "Notified"
    ? "bg-[#fff5ed] text-[#b7623d] border border-[#fbd3bf]"
    : status === "Cancelled"
    ? "bg-[#fdeded] text-[#b73d3d] border border-[#fbd2d2]"
    : status === "Completed"
    ? "bg-[#eee8f6] text-[#72558e] border border-[#e0d4ee]"
    : [
        "Ready",
        "Available",
        "Arrived",
        "Clocked in",
        "In stock",
      ].includes(status)
      ? "bg-[#e8f1e8] text-[#3b724c]"
      : ["Preparing", "Booked"].includes(status)
        ? "bg-[#fbe8dc] text-[#b7623d]"
        : ["Needs cleaning", "No show", "Low stock", "On break"].includes(status)
          ? "bg-[#f4e9e1] text-[#946243]"
          : "bg-[#eceeea] text-[#68736e]";
  return (
    <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${tone}`}>
      {status}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#b7623d]">
            {eyebrow}
          </p>
        )}
        <h1 className="display-font text-3xl font-bold tracking-tight text-[#24312e] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-[#84908a]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon: StatIcon,
  color,
}: {
  label: string;
  value: string;
  change: string;
  icon: Icon;
  color: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 shadow-[0_3px_12px_rgba(36,49,46,.025)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#84908a]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#24312e]">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <StatIcon size={21} />
        </div>
      </div>
      <p className="mt-4 text-xs font-bold text-[#3b724c]">
        {change}{" "}
        <span className="font-medium text-[#84908a]">vs yesterday</span>
      </p>
    </article>
  );
}

function OverviewPage({
  onBook,
  onOrder,
  onWebsite,
  role,
  tables,
  orders,
  bookings,
  onTableStatusChange,
  kitchenClosed,
  onToggleKitchenClosed,
}: {
  onBook: (tableId?: string) => void;
  onOrder: (tableId?: string) => void;
  onWebsite: () => void;
  role: StaffRole;
  tables: RestaurantTable[];
  orders: Order[];
  bookings: TableBooking[];
  onTableStatusChange: (id: string, status: TableStatus) => void;
  kitchenClosed?: boolean;
  onToggleKitchenClosed?: () => void;
}) {
  const occupiedCount = tables.filter((t) => t.status === "Occupied").length;
  const activeOrdersCount = orders.filter((o) => o.status !== "Served").length;

  return (
    <>
      <SectionHeading
        eyebrow="Tuesday, September 24, 2024"
        title="Good afternoon, Aarav."
        description="Here’s what’s happening at your restaurant today."
        action={
          <div className="flex gap-3">
            <button
              onClick={onWebsite}
              className="hidden items-center gap-2 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-4 py-3 text-sm font-bold text-[#68736e] hover:bg-white sm:flex"
            >
              <Globe2 size={18} />
              Open website
            </button>
            <button
              onClick={() => onBook()}
              disabled={kitchenClosed}
              className={`flex items-center gap-2 rounded-xl border border-[#dfe1dc] px-4 py-3 text-sm font-bold transition ${
                kitchenClosed
                  ? "bg-[#f0f1ed] text-[#84908a] opacity-50 cursor-not-allowed"
                  : "bg-[#fbfaf7] text-[#315a3d] hover:bg-white"
              }`}
              title={kitchenClosed ? "Kitchen is closed. Cannot book tables." : undefined}
            >
              <CalendarCheck size={18} />
              Book table
            </button>
            <button
              onClick={() => onOrder()}
              disabled={kitchenClosed}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${
                kitchenClosed
                  ? "bg-[#74807a] opacity-50 cursor-not-allowed"
                  : "bg-[#24312e] hover:bg-[#315a3d]"
              }`}
              title={kitchenClosed ? "Kitchen is closed. Cannot place new orders." : undefined}
            >
              <Plus size={18} />
              New order
            </button>
          </div>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Today's revenue"
          value="₹1,84,286"
          change="+12.8%"
          icon={CircleDollarSign}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Active orders"
          value={String(activeOrdersCount || orders.length)}
          change="+4 since 11am"
          icon={ShoppingBag}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Tables occupied"
          value={`${occupiedCount} / ${tables.length}`}
          change={`${Math.round((occupiedCount / (tables.length || 1)) * 100)}% capacity`}
          icon={Users}
          color="bg-[#eee8f6] text-[#72558e]"
        />
      </section>
      {role === "Manager" && (
        <ManagerControlPanel
          onBookTable={onBook}
          onNewOrder={onOrder}
          tables={tables}
          ordersCount={orders.length}
          bookingsCount={bookings.length}
          bookings={bookings}
          kitchenClosed={kitchenClosed}
          onToggleKitchenClosed={onToggleKitchenClosed}
        />
      )}
      {role === "Server" && (
        <ServantControlPanel
          onBookTable={onBook}
          onNewOrder={onOrder}
          onTableStatusChange={onTableStatusChange}
          tables={tables}
          orders={orders}
          kitchenClosed={kitchenClosed}
        />
      )}
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="display-font text-xl font-bold text-[#24312e]">
                Revenue overview
              </h2>
              <p className="mt-1 text-xs text-[#84908a]">
                Your earnings across the last 7 days
              </p>
            </div>
            <button className="flex items-center gap-1 rounded-lg border border-[#dfe1dc] px-3 py-2 text-xs font-bold text-[#68736e]">
              This week <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex h-48 items-end gap-2 sm:gap-4">
            {[42, 55, 49, 74, 63, 82, 96].map((height, index) => (
              <div
                key={height}
                className="flex flex-1 flex-col items-center gap-3"
              >
                <div
                  className={`w-full max-w-12 rounded-t-lg ${index === 6 ? "bg-[#b7623d]" : "bg-[#c8d9c6]"}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[11px] font-medium text-[#84908a]">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-[#e9eae6] pt-4 text-xs text-[#84908a]">
            <span className="h-2 w-2 rounded-full bg-[#b7623d]" />
            Today is pacing{" "}
            <strong className="text-[#3b724c]">18% ahead</strong> of your daily
            average
          </div>
        </article>
        <article className="rounded-2xl border border-[#e0e2dc] bg-[#24312e] p-5 text-white sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="display-font text-xl font-bold">Quick actions</h2>
              <p className="mt-1 text-xs text-[#aab8b0]">
                Keep service moving smoothly
              </p>
            </div>
            <Clock3 className="text-[#f4bc83]" size={22} />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            {[
              ["Floor plan", Table2],
              ["Add menu item", Plus],
              ["Staff schedule", CalendarDays],
              ["View reports", FileText],
            ].map(([label, ActionIcon]) => (
              <button
                key={label as string}
                className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[#41504a] bg-[#30403a] p-4 text-left transition hover:border-[#f4bc83]"
              >
                <ActionIcon size={19} className="text-[#f4bc83]" />
                <span className="text-xs font-bold">{label as string}</span>
              </button>
            ))}
          </div>
        </article>
      </section>
      <section className="mt-8 rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="display-font text-xl font-bold text-[#24312e]">
            Recent orders
          </h2>
          <p className="mt-1 text-xs text-[#84908a]">
            Live activity from your floor
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-155 text-left text-sm">
            <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">
              <tr>
                <th className="pb-3">Order</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#f0f1ed] last:border-0"
                >
                  <td className="py-4 font-bold text-[#24312e]">
                    {formatOrderLabel(order.id, order.customer)}
                  </td>
                  <td className="py-4 text-[#68736e]">{order.table}</td>
                  <td className="py-4 text-[#68736e]">{order.items}</td>
                  <td className="py-4 font-bold text-[#24312e]">
                    {order.total}
                  </td>
                  <td className="py-4">
                    <StatusPill status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ReservationsPage({
  bookings,
  onStatusChange,
  onCancelBooking,
  onBook,
  kitchenClosed = false,
}: {
  bookings: TableBooking[];
  onStatusChange: (id: string, status: BookingStatus) => void;
  onCancelBooking: (id: string) => void;
  onBook: () => void;
  kitchenClosed?: boolean;
}) {
  const totalGuests = bookings.reduce((sum, b) => sum + (b.guests || 0), 0);
  const totalDeposit = bookings.reduce(
    (sum, b) => sum + (typeof b.deposit === "number" ? b.deposit : 500),
    0,
  );

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"Active" | "All" | "Completed" | "Cancelled">("Active");
  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  const activeBookingsCount = bookings.filter((b) => b.status === "Booked" || b.status === "Arrived" || b.status === "Seated").length;
  const completedBookingsCount = bookings.filter((b) => b.status === "Completed").length;
  const cancelledBookingsCount = bookings.filter((b) => b.status === "Cancelled" || b.status === "No show").length;

  const displayedBookings = bookings.filter((b) => {
    if (filterTab === "Active") return b.status === "Booked" || b.status === "Arrived" || b.status === "Seated";
    if (filterTab === "Completed") return b.status === "Completed";
    if (filterTab === "Cancelled") return b.status === "Cancelled" || b.status === "No show";
    return true;
  });

  return (
    <>
      {activeDropdownId && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setActiveDropdownId(null)}
        />
      )}

      <SectionHeading
        eyebrow="Guest experience"
        title="Reservations"
        description="Keep your floor moving with clear booking windows and table assignments."
        action={
          <button
            onClick={onBook}
            disabled={kitchenClosed}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              kitchenClosed
                ? "bg-[#e2e4dd] text-[#84908a] cursor-not-allowed opacity-60"
                : "bg-[#24312e] text-white hover:bg-[#315a3d]"
            }`}
            title={kitchenClosed ? "Kitchen is closed - new reservations disabled" : "New reservation"}
          >
            <Plus size={18} />
            {kitchenClosed ? "Kitchen Closed" : "New reservation"}
          </button>
        }
      />
      {kitchenClosed && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24] shadow-xs">
          <AlertTriangle size={16} className="shrink-0 text-[#721c24]" />
          <span>
            <strong>Kitchen is currently closed.</strong> New table reservations are disabled until the kitchen reopens.
          </span>
        </div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Today's bookings"
          value={String(bookings.length)}
          change="Live reservations"
          icon={CalendarCheck}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Expected guests"
          value={String(totalGuests)}
          change="Confirmed covers"
          icon={Users}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Deposit collected"
          value={`₹${totalDeposit.toLocaleString("en-IN")}`}
          change={`${bookings.length} reservations`}
          icon={CreditCard}
          color="bg-[#eee8f6] text-[#72558e]"
        />
      </div>
      <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="display-font text-xl font-bold">
              Reservations Management
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              Live table booking & arrival management
            </p>
          </div>
          <button
            onClick={onBook}
            className="rounded-lg border border-[#dfe1dc] px-3 py-1.5 text-xs font-bold text-[#315a3d] hover:bg-white"
          >
            + Quick book
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-[#e9eae6] pb-3">
          {[
            { id: "Active", label: "Active Bookings", count: activeBookingsCount },
            { id: "All", label: "All Reservations", count: bookings.length },
            { id: "Completed", label: "Completed", count: completedBookingsCount },
            { id: "Cancelled", label: "Cancelled", count: cancelledBookingsCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? "bg-[#24312e] text-white shadow-xs"
                  : "bg-white text-[#68736e] border border-[#e0e2dc] hover:bg-[#f3f4f0]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  filterTab === tab.id ? "bg-white/20 text-white" : "bg-[#f0f1ec] text-[#68736e]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {displayedBookings.length === 0 ? (
          <div className="py-12 text-center text-[#84908a]">
            <CalendarCheck size={36} className="mx-auto text-[#cbd5e1] mb-2" />
            <p className="font-bold text-sm text-[#24312e]">No {filterTab.toLowerCase()} reservations</p>
            <p className="text-xs mt-1">Bookings will appear here as guests reserve tables.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-3 rounded-xl border border-[#eef0eb] bg-white p-4 sm:grid-cols-[1.4fr_1fr_.7fr_.8fr_1fr] sm:items-center"
              >
                <div>
                  <p className="font-bold text-[#24312e]">{booking.customer}</p>
                  <p className="mt-0.5 text-xs text-[#84908a]">
                    Deposit ₹{booking.deposit} • {booking.source}
                    {booking.specialRequests ? ` • "${booking.specialRequests}"` : ""}
                  </p>
                  {booking.phone && (
                    <p className="mt-0.5 text-[11px] text-[#aab1ac]">{booking.phone}</p>
                  )}
                </div>
                <div className="text-sm text-[#68736e] flex flex-col sm:flex-row sm:items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold w-fit ${
                    booking.bookingDate === todayStr ? "bg-[#e8f1e8] text-[#3b724c]" : "bg-[#f0f1ec] text-[#68736e]"
                  }`}>
                    <CalendarCheck size={11} />
                    {booking.bookingDate === todayStr ? "Today" : booking.bookingDate}
                  </span>
                  <span className="flex items-center text-xs font-semibold text-[#24312e]">
                    <Clock3 className="mr-1 inline text-[#84908a]" size={13} />
                    {booking.bookingTime}
                  </span>
                </div>
                <p className="text-sm text-[#68736e]">
                  {booking.guests} guests
                </p>
                <div>
                  {booking.tableId ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[#315a3d]/30 bg-[#e8f1e8] px-2.5 py-1 font-bold text-xs text-[#315a3d]">
                      <Table2 size={13} />
                      {booking.tableId}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-[#b7623d]">
                      Auto-allocate
                    </span>
                  )}
                </div>
              <div className="flex items-center gap-2">
                <StatusPill status={booking.status} />

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownId(
                        activeDropdownId === booking.id ? null : booking.id,
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[#dfe1dc] bg-white px-2.5 py-1 text-xs font-semibold text-[#24312e] hover:bg-[#f2f4ef] transition shadow-2xs"
                    aria-label="Change status"
                  >
                    <span>Action</span>
                    <ChevronDown size={13} className="text-[#84908a]" />
                  </button>

                  {activeDropdownId === booking.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 z-30 w-36 rounded-xl border border-[#dfe1dc] bg-white p-1.5 shadow-xl animate-in fade-in"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onStatusChange(booking.id, "Arrived");
                          setActiveDropdownId(null);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                          booking.status === "Arrived"
                            ? "bg-[#e8f1e8] font-bold text-[#3b724c]"
                            : "text-[#24312e] hover:bg-[#e8f1e8] hover:text-[#3b724c]"
                        }`}
                      >
                        <CheckCircle2 size={14} className="text-[#3b724c]" />
                        <span>Arrived</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onStatusChange(booking.id, "Completed");
                          setActiveDropdownId(null);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                          booking.status === "Completed"
                            ? "bg-[#eee8f6] font-bold text-[#72558e]"
                            : "text-[#24312e] hover:bg-[#eee8f6] hover:text-[#72558e]"
                        }`}
                      >
                        <Check size={14} className="text-[#72558e]" />
                        <span>Completed</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onStatusChange(booking.id, "Cancelled");
                          setActiveDropdownId(null);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                          booking.status === "Cancelled"
                            ? "bg-red-50 font-bold text-red-600"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <Ban size={14} className="text-red-600" />
                        <span>Canceled</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}



function formatTime12h(hours: number, minutes: number): string {
  const meridiem = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mStr = minutes === 0 ? "00" : String(minutes).padStart(2, "0");
  return `${h12}:${mStr} ${meridiem}`;
}

export type TableUpcomingBooking = {
  booking: TableBooking;
  minutesUntil: number;
  isArrived: boolean;
  isSeated: boolean;
  isTimeStarted: boolean;
  isUpcomingSoon: boolean;
  isBookedForLater: boolean;
  isCurrentlyReserved: boolean;
  timeDisplay: string;
  startTimeDisplay: string;
  endTimeDisplay: string;
  slotDisplay: string;
  availableTillDisplay: string;
};

export function getUpcomingBookingForTable(
  tableId: string,
  bookings: TableBooking[] = [],
  now = new Date(),
): TableUpcomingBooking | null {
  const activeBookings = bookings.filter(
    (b) =>
      b.tableId === tableId &&
      (b.status === "Booked" || b.status === "Arrived" || b.status === "Seated"),
  );
  if (activeBookings.length === 0) return null;

  const nowMs = now.getTime();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const parsed = activeBookings.map((b) => {
    const bookingDateStr = b.bookingDate ? b.bookingDate.slice(0, 10) : todayStr;
    const cleanTime = (b.bookingTime || "").trim();
    const match = cleanTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    let hours = 12;
    let minutes = 0;
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = match[2] ? parseInt(match[2], 10) : 0;
      const meridiem = match[3]?.toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
    }

    const parts = bookingDateStr.split("-").map(Number);
    const scheduledDate =
      parts.length === 3 && !parts.some(isNaN)
        ? new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, 0, 0)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    const diffMinutes = Math.round((scheduledDate.getTime() - nowMs) / (60 * 1000));
    return { booking: b, diffMinutes, hours, minutes, scheduledDate };
  });

  // Sort priorities:
  // 1. Arrived or Seated bookings first
  // 2. Active dining window (-180 to +30 min)
  // 3. Upcoming (>30 min)
  parsed.sort((a, b) => {
    const aPriority = a.booking.status === "Arrived" || a.booking.status === "Seated";
    const bPriority = b.booking.status === "Arrived" || b.booking.status === "Seated";
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    const aActive = a.diffMinutes >= -180 && a.diffMinutes <= 30;
    const bActive = b.diffMinutes >= -180 && b.diffMinutes <= 30;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    const aFuture = a.diffMinutes > 30;
    const bFuture = b.diffMinutes > 30;
    if (aFuture && bFuture) return a.diffMinutes - b.diffMinutes;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;

    return Math.abs(a.diffMinutes) - Math.abs(b.diffMinutes);
  });

  const closest = parsed[0];
  const { booking, diffMinutes, hours, minutes, scheduledDate } = closest;

  const isArrived = booking.status === "Arrived";
  const isSeated = booking.status === "Seated";
  // Reservation start time reached or past within active 3-hour window
  const isTimeStarted = diffMinutes <= 0 && diffMinutes >= -180;
  const isUpcomingSoon = diffMinutes > 0 && diffMinutes <= 30;
  const isBookedForLater = diffMinutes > 30;
  const isCurrentlyReserved = isTimeStarted || isUpcomingSoon;

  const startTimeDisplay = formatTime12h(hours, minutes);
  const endDate = new Date(scheduledDate.getTime() + 60 * 60 * 1000);
  const endTimeDisplay = formatTime12h(endDate.getHours(), endDate.getMinutes());
  const availableTillDate = new Date(scheduledDate.getTime() - 30 * 60 * 1000);
  const availableTillDisplay = formatTime12h(availableTillDate.getHours(), availableTillDate.getMinutes());
  const slotDisplay = `${startTimeDisplay} – ${endTimeDisplay}`;

  let timeDisplay = startTimeDisplay;
  if (isArrived) {
    timeDisplay = "Arrived";
  } else if (diffMinutes > 0 && diffMinutes <= 30) {
    timeDisplay = `in ${diffMinutes}m`;
  } else if (diffMinutes <= 0 && diffMinutes >= -30) {
    timeDisplay = "Due now";
  } else if (diffMinutes < -30 && diffMinutes >= -180) {
    timeDisplay = `${Math.abs(diffMinutes)}m ago`;
  }

  return {
    booking,
    minutesUntil: diffMinutes,
    isArrived,
    isSeated,
    isTimeStarted,
    isUpcomingSoon,
    isBookedForLater,
    isCurrentlyReserved,
    timeDisplay,
    startTimeDisplay,
    endTimeDisplay,
    slotDisplay,
    availableTillDisplay,
  };
}

function AddTableModal({
  existingTables,
  onClose,
  onAddTable,
}: {
  existingTables: RestaurantTable[];
  onClose: () => void;
  onAddTable: (table: {
    id: string;
    seats: number;
    zone: string;
    status: TableStatus;
    serverName: string;
  }) => Promise<void>;
}) {
  const highestNumber = existingTables.reduce((max, t) => {
    const num = parseInt(t.id.replace(/\D/g, ""), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const defaultNextId = `T${String(highestNumber + 1).padStart(2, "0")}`;

  const [tableId, setTableId] = useState(defaultNextId);
  const [seats, setSeats] = useState(4);
  const [zone, setZone] = useState("Main floor");
  const [serverName, setServerName] = useState("Priya S.");
  const [status, setStatus] = useState<TableStatus>("Available");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const zones = ["Main floor", "Window", "Family", "Garden", "Bar", "Terrace", "Private dining"];
  const servers = ["Priya S.", "Aarav R.", "Vikram K.", "Ananya P.", "Rahul M."];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanId = tableId.trim().toUpperCase();
    if (!cleanId) {
      setError("Table ID is required (e.g. T11).");
      return;
    }
    if (existingTables.some((t) => t.id.toUpperCase() === cleanId)) {
      setError(`Table ${cleanId} already exists. Please pick a different ID.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onAddTable({
        id: cleanId,
        seats: Number(seats) || 4,
        zone: zone.trim() || "Main floor",
        status,
        serverName: serverName.trim() || "Priya S.",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add table.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#3e4f48] bg-[#1e2a27] p-6 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#30403a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315a3d] text-[#9ac49f]">
              <Table2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add New Table</h3>
              <p className="text-xs text-[#aab8b0]">Persists directly to database floor layout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#aab8b0] hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-bold text-[#dfe1dc]">Table Number / ID</label>
            <input
              type="text"
              required
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="e.g. T11, VIP-1"
              className="w-full rounded-xl border border-[#3e4f48] bg-[#273632] px-3.5 py-2.5 font-bold uppercase text-white placeholder:text-[#687a72] focus:border-[#9ac49f] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#dfe1dc]">Seating Capacity</label>
            <div className="flex gap-2">
              {[2, 4, 6, 8, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setSeats(num)}
                  className={`flex-1 rounded-xl py-2 font-bold transition ${
                    seats === num
                      ? "bg-[#9ac49f] text-[#24312e]"
                      : "border border-[#3e4f48] bg-[#273632] text-white hover:bg-[#31433e]"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-[#aab8b0]">Custom seats:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value) || 1)}
                className="w-20 rounded-lg border border-[#3e4f48] bg-[#273632] px-2.5 py-1 text-center font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#dfe1dc]">Dining Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full rounded-xl border border-[#3e4f48] bg-[#273632] px-3.5 py-2.5 font-medium text-white focus:border-[#9ac49f] focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#dfe1dc]">Assigned Server</label>
            <select
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full rounded-xl border border-[#3e4f48] bg-[#273632] px-3.5 py-2.5 font-medium text-white focus:border-[#9ac49f] focus:outline-none"
            >
              {servers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#dfe1dc]">Initial Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Available", "Booked", "Occupied"] as TableStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`rounded-xl py-2 font-bold text-center transition ${
                    status === st
                      ? "bg-[#f4bc83] text-[#24312e]"
                      : "border border-[#3e4f48] bg-[#273632] text-white hover:bg-[#31433e]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#41504a] bg-transparent py-2.5 font-bold text-[#dfe1dc] hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#315a3d] py-2.5 font-bold text-white hover:bg-[#254630] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Table
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTableModal({
  table,
  onClose,
  onConfirm,
}: {
  table: RestaurantTable;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete table.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-[#1e2a27] p-6 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Delete Table {table.id}?</h3>
            <p className="text-xs text-[#aab8b0]">This table will be removed from floor plan.</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#cbd5e1] leading-relaxed">
          Table <strong className="text-white">{table.id}</strong> ({table.seats} seats, {table.zone}) will be removed. Any existing booking records will remain preserved with unassigned seating.
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-950/40 p-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#41504a] bg-transparent py-2.5 text-xs font-bold text-[#dfe1dc] hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {deleting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Delete Table
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FloorPlanPage({
  tables,
  bookings = [],
  role,
  onTableStatusChange,
  onBookingStatusChange,
  onBook,
  onOrder,
  onAddTable,
  onDeleteTable,
  kitchenClosed = false,
}: {
  tables: RestaurantTable[];
  bookings?: TableBooking[];
  role: StaffRole;
  onTableStatusChange: (id: string, status: TableStatus) => void;
  onBookingStatusChange?: (id: string, status: BookingStatus) => void;
  onBook: (tableId?: string) => void;
  onOrder: (tableId?: string) => void;
  onAddTable?: (table: {
    id: string;
    seats: number;
    zone: string;
    status: TableStatus;
    serverName: string;
  }) => Promise<void>;
  onDeleteTable?: (id: string) => Promise<void>;
  kitchenClosed?: boolean;
}) {
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id || "T01");
  const [statusFilter, setStatusFilter] = useState<"All" | "Available" | "Booked" | "Occupied" | "Needs cleaning">("All");
  const [selectedZone, setSelectedZone] = useState<string>("All zones");
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null);

  const selected = tables.find((t) => t.id === selectedTableId) || tables[0];
  const zones = Array.from(new Set(tables.map((t) => t.zone).filter(Boolean)));

  // Helper to determine the effective status on the floor:
  // 1. Occupied (customer arrived in reservations, seated, or dining time active now)
  // 2. Needs cleaning
  // 3. Booked (scheduled for later, before 30min / advance)
  // 4. Available
  const getEffectiveStatus = (
    t: RestaurantTable,
  ): "Available" | "Occupied" | "Booked" | "Needs cleaning" => {
    if (t.status === "Occupied") return "Occupied";
    if (t.status === "Needs cleaning") return "Needs cleaning";

    const upcoming = getUpcomingBookingForTable(t.id, bookings);
    if (upcoming) {
      // When customer arrives in reservations or is seated, they take their seat -> Occupied!
      if (upcoming.isArrived || upcoming.isSeated || upcoming.isTimeStarted) {
        return "Occupied";
      }

      // Future booking (e.g. booked for 6:00pm, before start time / before 30min):
      return "Booked";
    }

    if (t.status === "Booked") return "Booked";
    return "Available";
  };

  const filteredTables = tables.filter((t) => {
    const effective = getEffectiveStatus(t);
    let matchesStatus = true;
    if (statusFilter === "Available") {
      matchesStatus = effective === "Available";
    } else if (statusFilter === "Booked") {
      matchesStatus = effective === "Booked";
    } else if (statusFilter === "Occupied") {
      matchesStatus = effective === "Occupied";
    } else if (statusFilter === "Needs cleaning") {
      matchesStatus = effective === "Needs cleaning";
    }

    const matchesZone = selectedZone === "All zones" || t.zone === selectedZone;
    return matchesStatus && matchesZone;
  });

  const selectedUpcoming = selected ? getUpcomingBookingForTable(selected.id, bookings) : null;
  const selectedEffective = selected ? getEffectiveStatus(selected) : "Available";

  return (
    <>
      <SectionHeading
        eyebrow="Live floor"
        title="Floor plan"
        description="Real-time table seating, automated reservation alerts, and floor layout management."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {role === "Manager" && onAddTable && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#315a3d] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#254630] transition"
              >
                <Plus size={18} />
                Add table
              </button>
            )}
            <button
              onClick={() => onBook(selected?.id)}
              disabled={kitchenClosed}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                kitchenClosed
                  ? "border-[#dfe1dc] bg-[#e2e4dd] text-[#84908a] cursor-not-allowed opacity-60"
                  : "border-[#dfe1dc] bg-[#fbfaf7] text-[#315a3d] hover:bg-white"
              }`}
              title={kitchenClosed ? "Kitchen is closed - table booking disabled" : "Book table"}
            >
              <CalendarCheck size={18} />
              {kitchenClosed ? "Kitchen Closed" : "Book table"}
            </button>
            <button
              onClick={() => onOrder(selected?.id)}
              disabled={kitchenClosed}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                kitchenClosed
                  ? "bg-[#e2e4dd] text-[#84908a] cursor-not-allowed opacity-60"
                  : "bg-[#24312e] text-white hover:bg-[#315a3d]"
              }`}
              title={kitchenClosed ? "Kitchen is closed - new orders disabled" : "New order"}
            >
              <Utensils size={18} />
              {kitchenClosed ? "Kitchen Closed" : "New order"}
            </button>
          </div>
        }
      />

      {kitchenClosed && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24] shadow-xs">
          <AlertTriangle size={16} className="shrink-0 text-[#721c24]" />
          <span>
            <strong>Kitchen is currently closed.</strong> Table bookings and dining orders are disabled until the kitchen reopens.
          </span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {(
            [
              { id: "All", label: "All", count: tables.length },
              {
                id: "Available",
                label: "Available",
                count: tables.filter((t) => getEffectiveStatus(t) === "Available").length,
              },
              {
                id: "Booked",
                label: "Booked",
                count: tables.filter((t) => getEffectiveStatus(t) === "Booked").length,
              },
              {
                id: "Occupied",
                label: "Occupied",
                count: tables.filter((t) => getEffectiveStatus(t) === "Occupied").length,
              },
              {
                id: "Needs cleaning",
                label: "Needs cleaning",
                count: tables.filter((t) => getEffectiveStatus(t) === "Needs cleaning").length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#24312e] text-white shadow-sm"
                  : "bg-white text-[#68736e] border border-[#e0e2dc] hover:bg-[#f3f4f0]"
              }`}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  statusFilter === tab.id ? "bg-white/20 text-white" : "bg-[#f0f1ec] text-[#68736e]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {zones.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#84908a]">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs font-bold text-[#24312e] focus:outline-none focus:ring-2 focus:ring-[#315a3d]"
            >
              <option value="All zones">All zones</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Floor layout grid */}
        <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e9eae6] pb-4 text-xs font-semibold text-[#68736e]">
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#9ac49f]" />
                Available ({tables.filter((t) => getEffectiveStatus(t) === "Available").length})
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#e5bd7e]" />
                Booked ({tables.filter((t) => getEffectiveStatus(t) === "Booked").length})
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#d98865]" />
                Occupied ({tables.filter((t) => getEffectiveStatus(t) === "Occupied").length})
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#aab1ac]" />
                Needs cleaning ({tables.filter((t) => getEffectiveStatus(t) === "Needs cleaning").length})
              </span>
            </div>
            <span className="text-[11px] text-[#84908a]">
              Showing {filteredTables.length} of {tables.length} tables
            </span>
          </div>

          {filteredTables.length === 0 ? (
            <div className="py-16 text-center text-[#84908a]">
              <Table2 size={40} className="mx-auto text-[#cbd5e1] mb-2" />
              <p className="font-bold text-sm text-[#24312e]">No tables match this filter</p>
              <p className="text-xs mt-1">Try selecting a different status tab or zone.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4">
              {filteredTables.map((table) => {
                const upcoming = getUpcomingBookingForTable(table.id, bookings);
                const effective = getEffectiveStatus(table);

                let tableColor = "border-[#9ac49f] bg-[#e8f1e8] text-[#315a3d]"; // Available
                if (effective === "Occupied") {
                  tableColor = "border-[#d98865] bg-[#fbe8dc] text-[#946243]";
                } else if (effective === "Needs cleaning") {
                  tableColor = "border-[#aab1ac] bg-[#eceeea] text-[#68736e]";
                } else if (effective === "Booked") {
                  tableColor = "border-[#e5bd7e] bg-[#fff8ea] text-[#87632e]";
                }

                return (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={`relative flex min-h-[148px] flex-col items-center justify-center rounded-2xl border-2 p-3 transition hover:-translate-y-1 ${
                      selected?.id === table.id ? "ring-2 ring-[#24312e] ring-offset-2" : ""
                    } ${tableColor}`}
                  >
                    {/* Arrived banner: Guest has arrived! */}
                    {/* Booked banner: Scheduled for later */}
                    {effective === "Booked" && upcoming && (
                      <span className="absolute top-2 left-2 right-2 rounded-md bg-[#87632e] text-amber-100 text-[8.5px] font-extrabold py-0.5 px-1.5 flex items-center justify-center gap-1 shadow-sm whitespace-nowrap">
                        <Clock3 size={9} />
                        Booked: {upcoming.startTimeDisplay}
                      </span>
                    )}

                    {/* Occupied banner: Dining session active / customer arrived */}
                    {effective === "Occupied" && upcoming && (
                      <span className="absolute top-2 left-2 right-2 rounded-md bg-[#b7623d] text-white text-[8.5px] font-extrabold py-0.5 px-1.5 flex items-center justify-center gap-1 shadow-sm whitespace-nowrap">
                        <Users size={9} />
                        {upcoming.isArrived ? "Arrived: " : "Dining: "}{upcoming.booking.customer}
                      </span>
                    )}

                    <div className={effective === "Booked" || (effective === "Occupied" && upcoming) ? "mt-4 flex flex-col items-center" : "flex flex-col items-center"}>
                      <Table2 size={27} />
                      <strong className="mt-1 text-base font-extrabold tracking-tight">{table.id}</strong>
                      <span className="text-[11px] font-semibold opacity-85">
                        {table.seats} seats • {table.zone}
                      </span>

                      {/* Display booking details */}
                      {upcoming && (
                        <div className="mt-1 flex flex-col items-center text-center">
                          {effective === "Occupied" ? (
                            <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9.5px] font-extrabold text-[#946243] whitespace-nowrap">
                              {upcoming.booking.customer} ({upcoming.startTimeDisplay})
                            </span>
                          ) : effective === "Booked" ? (
                            <span className="rounded bg-amber-500/15 border border-amber-600/30 px-1.5 py-0.2 text-[9px] font-bold text-[#87632e] whitespace-nowrap">
                              {upcoming.booking.customer}
                            </span>
                          ) : null}
                        </div>
                      )}

                      <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider opacity-85 whitespace-nowrap">
                        {effective}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Table Drawer */}
        <aside className="flex flex-col rounded-2xl border border-[#e0e2dc] bg-[#24312e] p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f4bc83]">
              Selected table
            </p>
            {selected && role === "Manager" && onDeleteTable && (
              <button
                onClick={() => setTableToDelete(selected)}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/40 px-2 py-1 text-[11px] font-bold text-red-300 hover:bg-red-900/60 transition"
                title="Delete this table from floor plan"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="display-font text-3xl font-extrabold text-white">{selected?.id || "None"}</h2>
              <p className="text-xs text-[#aab8b0]">{selected?.zone} • {selected?.seats} seats</p>
            </div>
            <QrCode className="text-[#f4bc83]" size={28} />
          </div>

          {/* Dining Active / Customer Arrived Banner */}
          {selectedUpcoming && selectedEffective === "Occupied" && (
            <div className="mt-5 rounded-xl border border-[#d98865]/50 bg-[#3a251e] p-3.5 text-orange-100 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-[#f4bc83]">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <Clock3 size={15} className="text-[#f4bc83]" />
                  {selectedUpcoming.isArrived ? "Customer Arrived & Seated" : "Dining Session Active"} ({selectedUpcoming.startTimeDisplay})
                </span>
                <span className="rounded-md bg-[#d98865]/30 border border-[#d98865]/50 px-2 py-0.5 text-[10px] font-extrabold text-[#f4bc83] whitespace-nowrap">
                  Occupied
                </span>
              </div>
              <p className="mt-1.5 text-xs">
                Guest: <strong className="text-white">{selectedUpcoming.booking.customer}</strong> ({selectedUpcoming.booking.guests} guests)
              </p>
              {selectedUpcoming.booking.phone && (
                <p className="text-[11px] text-[#f4bc83]/80">Phone: {selectedUpcoming.booking.phone}</p>
              )}
              {selectedUpcoming.booking.specialRequests && (
                <p className="mt-1 text-[11px] italic text-[#f4bc83]/70">
                  &ldquo;{selectedUpcoming.booking.specialRequests}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Booked for Later Banner (Scheduled for later in the day) */}
          {selectedUpcoming && selectedEffective === "Booked" && (
            <div className="mt-5 rounded-xl border border-[#e5bd7e]/40 bg-[#352a1c] p-3.5 text-amber-100 shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#f4bc83] whitespace-nowrap">
                  <Clock3 size={14} className="text-[#f4bc83]" />
                  Upcoming Booking ({selectedUpcoming.startTimeDisplay})
                </span>
                <span className="rounded-md bg-[#e5bd7e]/20 border border-[#e5bd7e]/40 px-2 py-0.5 text-[10px] font-extrabold text-[#f4bc83] whitespace-nowrap">
                  Booked
                </span>
              </div>

              <div className="mt-2.5 space-y-1 text-xs">
                <p className="font-semibold text-white">
                  Table booked for <span className="font-extrabold text-[#f4bc83]">{selectedUpcoming.slotDisplay}</span>
                </p>
                <p className="text-[11px] text-[#cbd5e1]">
                  Guest: <strong className="text-white">{selectedUpcoming.booking.customer}</strong> ({selectedUpcoming.booking.guests} guests)
                </p>
                {selectedUpcoming.booking.phone && (
                  <p className="text-[11px] text-[#aab8b0]">Phone: {selectedUpcoming.booking.phone}</p>
                )}
                {selectedUpcoming.booking.specialRequests && (
                  <p className="text-[11px] italic text-[#aab8b0]">
                    &ldquo;{selectedUpcoming.booking.specialRequests}&rdquo;
                  </p>
                )}
              </div>

              {onBookingStatusChange && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      onBookingStatusChange(selectedUpcoming.booking.id, "Arrived");
                      if (selected) onTableStatusChange(selected.id, "Occupied");
                    }}
                    className="flex-1 rounded-lg bg-[#9ac49f] py-2 text-xs font-bold text-[#24312e] hover:bg-[#88b68d] transition shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle2 size={13} />
                    Customer arrived (Occupied)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table Details & Status Controls */}
          <div className="mt-5 space-y-4 border-t border-[#41504a] pt-4 text-xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[#aab8b0]">Table Status</span>
                <span className={`font-extrabold uppercase tracking-wide whitespace-nowrap ${
                  selectedEffective === "Occupied"
                    ? "text-[#d98865]"
                    : selectedEffective === "Available"
                      ? "text-[#9ac49f]"
                      : "text-[#f4bc83]"
                }`}>
                  {selectedEffective}
                </span>
              </div>

              {/* Status Pills: 4 core states in 2x2 grid, always on same line */}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {(["Available", "Occupied", "Booked", "Needs cleaning"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => {
                        if (!selected) return;
                        onTableStatusChange(selected.id, status);
                        if (selectedUpcoming) {
                          if (status === "Occupied") onBookingStatusChange?.(selectedUpcoming.booking.id, "Arrived");
                          else if (status === "Available") onBookingStatusChange?.(selectedUpcoming.booking.id, "Completed");
                        }
                      }}
                      className={`rounded-lg py-2 px-2 text-center text-[10px] font-bold transition whitespace-nowrap flex items-center justify-center ${
                        selectedEffective === status
                          ? status === "Occupied"
                            ? "bg-[#d98865] text-white shadow-sm"
                            : status === "Available"
                              ? "bg-[#9ac49f] text-[#24312e] shadow-sm"
                              : "bg-[#f4bc83] text-[#24312e] shadow-sm"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <span className="whitespace-nowrap">{status}</span>
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Quick action: Mark Free */}
            {selected && selectedEffective !== "Available" && (
              <button
                onClick={() => {
                  onTableStatusChange(selected.id, "Available");
                  if (selectedUpcoming) {
                    onBookingStatusChange?.(selectedUpcoming.booking.id, "Completed");
                  }
                }}
                className="w-full rounded-xl border border-[#9ac49f]/40 bg-[#9ac49f]/15 py-2 text-xs font-bold text-[#9ac49f] hover:bg-[#9ac49f]/25 transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Check size={14} />
                Mark table free (Available)
              </button>
            )}

            <div className="space-y-2 border-t border-[#41504a]/60 pt-3">
              <div className="flex justify-between">
                <span className="text-[#aab8b0]">Capacity</span>
                <span className="font-semibold">{selected?.seats} guests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#aab8b0]">Zone</span>
                <span className="font-semibold">{selected?.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#aab8b0]">Assigned Server</span>
                <span className="font-semibold">{selected?.serverName || "Priya S."}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-auto pt-5 space-y-2.5">
            {kitchenClosed && (
              <p className="text-center text-[11px] font-bold text-red-300 bg-red-950/40 p-2 rounded-lg border border-red-500/30">
                🔴 Kitchen closed • New orders & bookings paused
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => selected && onOrder(selected.id)}
                disabled={kitchenClosed}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  kitchenClosed
                    ? "bg-white/10 text-[#84908a] cursor-not-allowed opacity-50"
                    : "bg-[#9ac49f] text-[#24312e] hover:bg-[#88b68d]"
                }`}
                title={kitchenClosed ? "Kitchen is closed - cannot take new orders" : "Take order"}
              >
                <Utensils size={14} />
                {kitchenClosed ? "Kitchen Closed" : "Take order"}
              </button>
              <button
                onClick={() => selected && onBook(selected.id)}
                disabled={kitchenClosed}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  kitchenClosed
                    ? "bg-white/10 text-[#84908a] cursor-not-allowed opacity-50"
                    : "bg-[#f4bc83] text-[#24312e] hover:bg-[#eab074]"
                }`}
                title={kitchenClosed ? "Kitchen is closed - cannot book tables" : "Book table"}
              >
                <CalendarCheck size={14} />
                {kitchenClosed ? "Kitchen Closed" : "Book table"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showAddModal && onAddTable && (
        <AddTableModal
          existingTables={tables}
          onClose={() => setShowAddModal(false)}
          onAddTable={onAddTable}
        />
      )}

      {tableToDelete && onDeleteTable && (
        <DeleteTableModal
          table={tableToDelete}
          onClose={() => setTableToDelete(null)}
          onConfirm={async () => {
            await onDeleteTable(tableToDelete.id);
            setTableToDelete(null);
          }}
        />
      )}
    </>
  );
}

function OrdersPage({
  orders,
  onStatusChange,
  onOrder,
  kitchenClosed = false,
  role,
}: {
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus, actingRole?: StaffRole) => void;
  onOrder?: () => void;
  kitchenClosed?: boolean;
  role?: StaffRole;
}) {
  const [tab, setTab] = useState<"all" | "pending" | "new" | "served">("all");
  return (
    <>
      <SectionHeading
        eyebrow="Service control"
        title="Orders"
        description="Every customer, server, and takeaway order in one live queue."
        action={
          <button
            onClick={onOrder}
            disabled={kitchenClosed}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              kitchenClosed
                ? "bg-[#e2e4dd] text-[#84908a] cursor-not-allowed opacity-60"
                : "bg-[#24312e] text-white hover:bg-[#315a3d]"
            }`}
            title={kitchenClosed ? "Kitchen is closed - new orders disabled" : "New order"}
          >
            <Plus size={18} />
            {kitchenClosed ? "Kitchen Closed" : "New order"}
          </button>
        }
      />
      {kitchenClosed && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24] shadow-xs">
          <AlertTriangle size={16} className="shrink-0 text-[#721c24]" />
          <span>
            <strong>Kitchen is currently closed.</strong> New orders are disabled until the kitchen reopens. Active tickets can still be managed and served.
          </span>
        </div>
      )}
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {[
          ["all", "All orders"],
          ["pending", "Pending"],
          ["new", "New for server"],
          ["served", "Served"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() =>
              setTab(value as "all" | "pending" | "new" | "served")
            }
            className={`rounded-full px-4 py-2 text-xs font-bold ${tab === value ? "bg-[#24312e] text-white" : "border border-[#dfe1dc] text-[#68736e]"}`}
          >
            {label}{" "}
            {value === "new" &&
            orders.filter((order) => order.status === "Notified").length > 0
              ? `(${orders.filter((order) => order.status === "Notified").length})`
              : ""}
          </button>
        ))}
      </div>
      {orders.some((order) => order.status === "Notified") && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#ead7c8] bg-[#fff5ed] p-4 text-sm text-[#946243]">
          <Bell className="shrink-0 text-[#b7623d]" size={18} />
          <span>
            <strong>Service bell:</strong>{" "}
            {orders.filter((order) => order.status === "Notified").length} ready
            order(s) are waiting for server pickup.
          </span>
        </div>
      )}
      <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-4">
          {["Queued", "Preparing", "Ready", "Served"].map((stage) => {
            const stageOrders = orders.filter((order) => {
              const matchesTab =
                tab === "all" ||
                (tab === "new" && order.status === "Notified") ||
                (tab === "pending" &&
                  ["Queued", "Preparing", "Ready"].includes(order.status)) ||
                (tab === "served" && order.status === "Served");
              const displayStage =
                order.status === "Notified" ? "Ready" : order.status;
              return matchesTab && displayStage === stage;
            });
            return (
              <div key={stage}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-bold text-[#24312e]">{stage}</h2>
                  <span className="rounded-full bg-[#eceeea] px-2 py-1 text-[10px] font-bold text-[#68736e]">
                    {stageOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {stageOrders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-xl border border-[#eef0eb] bg-white p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-[#24312e]">
                            {formatOrderLabel(order.id, order.customer)}{" "}
                            <span className="ml-2 text-xs font-medium text-[#84908a]">
                              {order.table}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-[#68736e]">
                            {order.items} • {order.total}
                          </p>
                        </div>
                        <StatusPill status={order.status} />
                      </div>
                      <div className="mt-3 rounded-lg bg-[#f7f7f3] px-3 py-2 text-xs text-[#68736e]">
                        {order.itemList.map((item) => (
                          <p key={item} className="py-0.5">
                            <span className="mr-2 text-[#b7623d]">•</span>
                            {item}
                          </p>
                        ))}
                      </div>
                      <div className="mt-4 border-t border-[#f0f1ed] pt-3">
                        {order.status === "Queued" && (
                          <div className="flex w-full items-center justify-between rounded-xl bg-[#f7f8f6] px-3 py-2 text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-[#68736e]">
                              <Clock3 size={13} className="shrink-0 text-[#84908a]" />
                              In kitchen queue
                            </span>
                            <span className="shrink-0 rounded-md border border-[#e2e4dd] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#84908a] shadow-2xs">
                              Waiting for cook
                            </span>
                          </div>
                        )}

                        {order.status === "Preparing" && (
                          <div className="flex w-full items-center justify-between rounded-xl border border-[#fbd3bf]/70 bg-[#fff8f3] px-3 py-2 text-xs">
                            <span className="flex items-center gap-2 font-semibold text-[#b7623d]">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b7623d] opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b7623d]"></span>
                              </span>
                              In preparation
                            </span>
                            <span className="shrink-0 rounded-md border border-[#fbd3bf] bg-white px-2 py-0.5 text-[11px] font-bold text-[#b7623d] shadow-2xs">
                              Cooking
                            </span>
                          </div>
                        )}

                        {(order.status === "Ready" ||
                          order.status === "Notified") && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between px-0.5 text-xs">
                              <span
                                className={`flex items-center gap-1.5 font-semibold ${
                                  order.status === "Notified"
                                    ? "text-[#b7623d]"
                                    : "text-[#315a3d]"
                                }`}
                              >
                                {order.status === "Notified" ? (
                                  <>
                                    <Bell
                                      size={13}
                                      className="shrink-0 animate-bounce text-[#b7623d]"
                                    />
                                    <span>Kitchen notified server</span>
                                  </>
                                ) : (
                                  <>
                                    <Check
                                      size={13}
                                      className="shrink-0 text-[#315a3d]"
                                    />
                                    <span>Ready for pickup</span>
                                  </>
                                )}
                              </span>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  order.status === "Notified"
                                    ? "border border-[#fbd3bf] bg-[#fff5ed] text-[#b7623d]"
                                    : "border border-[#cfe0d0] bg-[#e8f1e8] text-[#315a3d]"
                                }`}
                              >
                                Ready
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onStatusChange(
                                  order.id,
                                  "Served",
                                  role || "Server",
                                )
                              }
                              className="flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#315a3d] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#24472d] active:scale-[0.98]"
                            >
                              <Check
                                size={15}
                                strokeWidth={2.5}
                                className="shrink-0"
                              />
                              <span>Mark as Served</span>
                            </button>
                          </div>
                        )}

                        {order.status === "Served" && (
                          <div className="flex w-full items-center justify-between rounded-xl border border-[#d6e5d6] bg-[#eef5ee] px-3 py-2 text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-[#3b724c]">
                              <CheckCircle2
                                size={14}
                                className="shrink-0 text-[#3b724c]"
                              />
                              Served to table
                            </span>
                            <span className="text-[11px] font-medium text-[#68736e]">
                              Completed
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function KitchenPage({
  orders,
  menuItems,
  onMenuItemsChange,
  onStatusChange,
  soldOutItems,
  setSoldOutItems,
  kitchenClosed = false,
  onToggleKitchenClosed,
  role = "Kitchen",
}: {
  orders: Order[];
  menuItems: ApiMenuItem[];
  onMenuItemsChange?: (items: ApiMenuItem[]) => void;
  onStatusChange: (id: string, status: OrderStatus, actingRole?: StaffRole) => void;
  soldOutItems: string[];
  setSoldOutItems: (items: string[]) => void;
  kitchenClosed?: boolean;
  onToggleKitchenClosed?: () => void;
  role?: StaffRole;
}) {
  const [station, setStation] = useState("All stations");
  const [soundOn, setSoundOn] = useState(true);
  const active = orders
    .filter((order) =>
      ["Queued", "Preparing", "Ready", "Notified"].includes(order.status),
    )
    .filter(
      (order) =>
        station === "All stations" ||
        kitchenTicketDetails[order.id]?.station === station,
    );
  const servedOrders = orders.filter((order) => order.status === "Served");
  const moveTicket = (id: string, nextStatus: OrderStatus) =>
    onStatusChange(id, nextStatus, role || "Kitchen");
  const toggleSoldOut = async (item: ApiMenuItem) => {
    const isCurrentlySoldOut = item.available === false || soldOutItems.includes(item.name);
    const newAvailable = isCurrentlySoldOut;
    try {
      await updateMenuItem(item.id, { available: newAvailable });
    } catch {
      // offline fallback
    }
    if (newAvailable) {
      setSoldOutItems(soldOutItems.filter((name) => name !== item.name));
    } else {
      if (!soldOutItems.includes(item.name)) {
        setSoldOutItems([...soldOutItems, item.name]);
      }
    }
    if (onMenuItemsChange) {
      onMenuItemsChange(
        menuItems.map((i) => (i.id === item.id ? { ...i, available: newAvailable } : i)),
      );
    }
  };
  return (
    <>
      <SectionHeading
        eyebrow="Kitchen display system"
        title="Kitchen"
        description="Digital KOTs organized by station. Move every ticket from queued to ready for pickup."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${soundOn ? "border-[#cfe0d0] bg-[#e8f1e8] text-[#3b724c]" : "border-[#dfe1dc] text-[#84908a]"}`}
            >
              <Volume2 size={16} />
              {soundOn ? "Alerts on" : "Alerts off"}
            </button>
            {onToggleKitchenClosed && (
              <button
                onClick={onToggleKitchenClosed}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-3 text-xs font-bold transition shadow-xs ${
                  kitchenClosed
                    ? "border-red-500/50 bg-red-950/80 text-red-200 hover:bg-red-900"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f2f3ef]"
                }`}
                title={kitchenClosed ? "Kitchen is closed. Click to reopen." : "Kitchen is open. Click to close."}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    kitchenClosed ? "bg-red-500 animate-ping" : "bg-[#3b724c]"
                  }`}
                />
                {kitchenClosed ? "Kitchen Closed (Reopen)" : "Close Kitchen"}
              </button>
            )}
          </div>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e0e2dc] bg-[#fbfaf7] p-4">
          <p className="text-xs text-[#84908a]">Open tickets</p>
          <p className="mt-2 text-2xl font-bold text-[#24312e]">
            {active.length}
          </p>
          <p className="mt-1 text-[11px] font-bold text-[#3b724c]">
            Live queue
          </p>
        </div>
        <div className="rounded-xl border border-[#e0e2dc] bg-[#fbfaf7] p-4">
          <p className="text-xs text-[#84908a]">Average prep</p>
          <p className="mt-2 text-2xl font-bold text-[#24312e]">14 min</p>
          <p className="mt-1 text-[11px] font-bold text-[#b7623d]">
            2 min slower today
          </p>
        </div>
        <div className="rounded-xl border border-[#e0e2dc] bg-[#fbfaf7] p-4">
          <p className="text-xs text-[#84908a]">Sold-out items</p>
          <p className="mt-2 text-2xl font-bold text-[#24312e]">
            {soldOutItems.length}
          </p>
          <p className="mt-1 text-[11px] font-bold text-[#b7623d]">
            Hidden from QR menu
          </p>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {kitchenStations.map((item) => (
            <button
              key={item}
              onClick={() => setStation(item)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${station === item ? "bg-[#24312e] text-white" : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#84908a]">
          <RefreshCw size={14} />
          Last sync just now
        </div>
      </div>
      {kitchenClosed && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-full bg-red-500 animate-ping" />
            <div>
              <strong className="block font-bold text-red-300">Kitchen is closed.</strong>
              <span className="text-xs text-red-200/90">
                New order intake and table bookings are halted across the entire restaurant. Active tickets can still be prepared and served.
              </span>
            </div>
          </div>
          {onToggleKitchenClosed && (
            <button
              type="button"
              onClick={onToggleKitchenClosed}
              className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-sm"
            >
              Reopen Kitchen
            </button>
          )}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        {["Queued", "Preparing", "Ready"].map((column) => (
          <div key={column}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-[#24312e]">{column}</h2>
              <span className="rounded-full bg-[#eceeea] px-2 py-1 text-[10px] font-bold text-[#68736e]">
                {
                  active.filter((order) =>
                    column === "Ready"
                      ? order.status === "Ready" || order.status === "Notified"
                      : order.status === column,
                  ).length
                }
              </span>
            </div>
            <div className="space-y-3">
              {active
                .filter((order) =>
                  column === "Ready"
                    ? order.status === "Ready" || order.status === "Notified"
                    : order.status === column,
                )
                .map((order) => {
                  const detail = kitchenTicketDetails[order.id] ?? {
                    station: "Main course",
                    item: "Chef special",
                    count: order.items,
                    notes: "Check the order note",
                    age: "1 min",
                  };
                  return (
                    <article
                      key={order.id}
                      className={`rounded-2xl border bg-[#fbfaf7] p-4 ${column === "Queued" && detail.age === "8 min" ? "border-[#d98865] shadow-[0_0_0_2px_rgba(217,136,101,.12)]" : "border-[#e0e2dc]"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-[#24312e]">
                            {formatOrderLabel(order.id, order.customer)}{" "}
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#b7623d]">
                              {detail.station}
                            </span>
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-[#84908a]">
                            <Clock3 size={13} />
                            {order.table} • {detail.age} ago
                          </p>
                        </div>
                        <MoreHorizontal size={17} className="text-[#84908a]" />
                      </div>
                      <div className="my-4 rounded-xl bg-[#f0f1ed] p-3 text-sm text-[#24312e]">
                        <div className="flex items-center justify-between">
                          <p className="font-bold">{detail.item}</p>
                          <span className="text-xs font-bold text-[#68736e]">
                            {detail.count}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[#68736e]">
                          {detail.notes}
                        </p>
                        <div className="mt-3 border-t border-[#dfe1dc] pt-2 text-xs text-[#68736e]">
                          {order.itemList.map((item) => (
                            <p key={item} className="py-0.5">
                              <span className="mr-2 text-[#b7623d]">•</span>
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {column === "Queued" && (
                          <button
                            type="button"
                            onClick={() => moveTicket(order.id, "Preparing")}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#24312e] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <Clock3 size={15} />
                            Mark preparing
                          </button>
                        )}
                        {column === "Preparing" && (
                          <button
                            type="button"
                            onClick={() => moveTicket(order.id, "Ready")}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#24312e] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <Check size={15} />
                            Mark ready
                          </button>
                        )}
                        {column === "Ready" && order.status === "Ready" && (
                          <button
                            type="button"
                            onClick={() => moveTicket(order.id, "Notified")}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b7623d] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#944e2f] transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <Bell size={15} />
                            Notify servant
                          </button>
                        )}
                        {column === "Ready" && order.status === "Notified" && (
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#fbd3bf] bg-[#fff5ed] px-3 py-2 text-xs font-bold text-[#b7623d]">
                            <Bell size={14} className="text-[#b7623d]" />
                            Servant notified • Waiting for pickup
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="display-font text-xl font-bold text-[#24312e]">
              Served orders
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              Completed service history from the kitchen handoff.
            </p>
          </div>
          <span className="rounded-full bg-[#e8f1e8] px-3 py-1.5 text-[11px] font-bold text-[#3b724c]">
            {servedOrders.length} served
          </span>
        </div>
        {servedOrders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#dfe1dc] p-5 text-center text-sm text-[#84908a]">
            No served orders yet.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {servedOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-[#eef0eb] bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[#24312e]">
                      {formatOrderLabel(order.id, order.customer)}{" "}
                      <span className="ml-2 text-xs font-medium text-[#84908a]">
                        {order.table}
                      </span>
                    </p>
                  </div>
                  <StatusPill status="Served" />
                </div>
                <div className="mt-3 rounded-lg bg-[#f7f7f3] px-3 py-2 text-xs text-[#68736e]">
                  {order.itemList.map((item) => (
                    <p key={item} className="py-0.5">
                      <span className="mr-2 text-[#3b724c]">•</span>
                      {item}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-8 rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="display-font text-xl font-bold text-[#24312e]">
              Availability controls
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              Mark an item unavailable here and it is blocked across all order creation and the customer menu.
            </p>
          </div>
          <ChefHat size={21} className="text-[#b7623d]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const soldOut = item.available === false || soldOutItems.includes(item.name);
            return (
              <button
                key={item.id || item.name}
                onClick={() => toggleSoldOut(item)}
                className="flex items-center justify-between rounded-xl border border-[#eef0eb] bg-white p-4 text-left transition hover:border-[#dfe1dc]"
              >
                <span>
                  <strong className="block text-sm text-[#24312e]">
                    {item.name}
                  </strong>
                  <small className="mt-1 block text-xs text-[#84908a]">
                    {soldOut
                      ? "Unavailable (Sold out)"
                      : "Available to order"}
                  </small>
                </span>
                <span
                  className={`h-3 w-3 rounded-full ${soldOut ? "bg-[#b7623d]" : "bg-[#3b724c]"}`}
                />
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function compressImage(file: File): Promise<{ dataUrl: string; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const maxDimension = 900;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: event.target?.result as string, name: file.name });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ dataUrl, name: file.name });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function EditMenuItemModal({
  item,
  onClose,
  onUpdated,
}: {
  item: ApiMenuItem;
  onClose: () => void;
  onUpdated: (updated: ApiMenuItem) => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [type, setType] = useState<"veg" | "non-veg">(item.type);
  const [category, setCategory] = useState(item.category);
  const [preparationTimeMinutes, setPreparationTimeMinutes] = useState(
    (item.preparationTimeMinutes ?? 15).toString(),
  );
  const [available, setAvailable] = useState(item.available !== false);
  const [description, setDescription] = useState(item.description ?? "");
  const [allergens, setAllergens] = useState((item.allergens ?? []).join(", "));
  const [tags, setTags] = useState((item.tags ?? []).join(", "));

  const isDataUrl = item.image?.startsWith("data:");
  const [imageSource, setImageSource] = useState<"upload" | "url">(
    isDataUrl || !item.image ? "upload" : "url",
  );
  const [uploadedImage, setUploadedImage] = useState<string>(
    isDataUrl ? item.image : "",
  );
  const [imageFileName, setImageFileName] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState<string>(
    isDataUrl ? "" : item.image ?? "",
  );
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }
    setError("");
    try {
      const res = await compressImage(file);
      setUploadedImage(res.dataUrl);
      setImageFileName(res.name);
    } catch {
      setError("Unable to process the selected image.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const finalImage =
      imageSource === "upload" ? uploadedImage : imageUrlInput.trim();
    if (!finalImage) {
      setError(
        imageSource === "upload"
          ? "Please upload a dish photo from your system."
          : "Please enter a valid image URL.",
      );
      setSaving(false);
      return;
    }

    try {
      const updated = await updateMenuItem(item.id, {
        name: name.trim(),
        price: Number(price),
        type,
        image: finalImage,
        description: description.trim(),
        category: category.trim(),
        available,
        preparationTimeMinutes: Number(preparationTimeMinutes) || 15,
        allergens: allergens
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        tags: tags
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update menu item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24312e]/40 p-4 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl sm:p-7 border border-[#dfe1dc]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b7623d]">
              Menu management
            </p>
            <h2 className="display-font mt-1 text-2xl font-bold text-[#24312e]">
              Edit menu item
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#84908a] transition hover:bg-[#eceeea]"
            aria-label="Close edit modal"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#68736e]">
            Item name <span className="text-[#b7623d]">*</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paneer tikka"
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            />
          </label>
          <label className="text-xs font-bold text-[#68736e]">
            Price (₹) <span className="text-[#b7623d]">*</span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="420"
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            />
          </label>
          <label className="text-xs font-bold text-[#68736e]">
            Type <span className="text-[#b7623d]">*</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "veg" | "non-veg")}
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            >
              <option value="veg">Veg</option>
              <option value="non-veg">Non-veg</option>
            </select>
          </label>
          <label className="text-xs font-bold text-[#68736e]">
            Category <span className="text-[#b7623d]">*</span>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Mains"
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            />
          </label>
          <label className="text-xs font-bold text-[#68736e]">
            Preparation time (minutes) <span className="text-[#b7623d]">*</span>
            <input
              required
              min="0"
              type="number"
              value={preparationTimeMinutes}
              onChange={(e) => setPreparationTimeMinutes(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            />
          </label>
          <label className="text-xs font-bold text-[#68736e]">
            Availability status <span className="text-[#b7623d]">*</span>
            <select
              value={available ? "available" : "unavailable"}
              onChange={(e) => setAvailable(e.target.value === "available")}
              className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none ${
                available
                  ? "border-[#cfe0d0] bg-[#f0f7f1] text-[#2b653b]"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <option value="available">✓ Available to order</option>
              <option value="unavailable">✕ Unavailable (Sold out)</option>
            </select>
          </label>
        </div>

        {/* Dish Photo Upload / URL Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#68736e]">
              Dish image <span className="text-[#b7623d]">*</span>
            </label>
            <div className="flex items-center gap-1.5 rounded-lg bg-[#eceeea] p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setImageSource("upload")}
                className={`rounded-md px-2.5 py-1 font-bold transition ${
                  imageSource === "upload"
                    ? "bg-white text-[#24312e] shadow-xs"
                    : "text-[#68736e]"
                }`}
              >
                Upload from system
              </button>
              <button
                type="button"
                onClick={() => setImageSource("url")}
                className={`rounded-md px-2.5 py-1 font-bold transition ${
                  imageSource === "url"
                    ? "bg-white text-[#24312e] shadow-xs"
                    : "text-[#68736e]"
                }`}
              >
                Image URL
              </button>
            </div>
          </div>

          {imageSource === "upload" ? (
            <div>
              {uploadedImage ? (
                <div className="mt-2 flex items-center gap-3.5 rounded-xl border border-[#dfe1dc] bg-white p-3 shadow-xs">
                  <img
                    src={uploadedImage}
                    alt="Dish preview"
                    className="h-16 w-16 shrink-0 rounded-lg border border-[#e0e2dc] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#24312e]">
                      {imageFileName || "Uploaded image"}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#3b724c]">
                      Ready to use
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImage("");
                      setImageFileName("");
                    }}
                    className="rounded-lg border border-[#dfe1dc] px-3 py-1.5 text-xs font-bold text-[#b7623d] transition hover:bg-[#fff5ed]"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? "border-[#b7623d] bg-[#fff5ed]"
                      : "border-[#dfe1dc] bg-white hover:border-[#b7623d] hover:bg-[#fbfaf7]"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0f1ed] text-[#315a3d]">
                    <Upload size={20} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#24312e]">
                    Click to upload an image from your computer
                  </p>
                  <p className="mt-1 text-[11px] text-[#84908a]">
                    Drag & drop or browse • PNG, JPG, WebP (auto-optimized)
                  </p>
                </label>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
              />
              {imageUrlInput && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={imageUrlInput}
                    alt="URL preview"
                    className="h-12 w-12 rounded-lg border border-[#e0e2dc] object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span className="text-xs text-[#84908a]">Preview of URL image</span>
                </div>
              )}
            </div>
          )}
        </div>

        <label className="mt-4 block text-xs font-bold text-[#68736e]">
          Description <span className="text-[#b7623d]">*</span>
          <textarea
            required
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the dish"
            className="mt-1.5 w-full resize-none rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#68736e]">
            Allergens{" "}
            <span className="font-normal text-[#84908a]">
              comma separated
            </span>
            <input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="gluten, dairy"
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            />
          </label>
          <label className="text-xs font-bold text-[#68736e]">
            Tags{" "}
            <span className="font-normal text-[#84908a]">
              comma separated
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="popular, chef-special"
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-[#fff5ed] px-3 py-2 text-xs font-bold text-[#b7623d]">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-[#dfe1dc] bg-white px-4 py-2.5 text-sm font-bold text-[#68736e] hover:bg-[#f2f4ef] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#24312e] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#315a3d] disabled:opacity-50"
          >
            {saving ? "Saving changes..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteMenuItemModal({
  item,
  onClose,
  onDeleted,
}: {
  item: ApiMenuItem;
  onClose: () => void;
  onDeleted: (itemId: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteMenuItem(item.id);
      onDeleted(item.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete menu item.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24312e]/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl border border-[#dfe1dc]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
          <Trash2 size={24} />
        </div>
        <h3 className="display-font text-xl font-bold text-[#24312e]">
          Delete Menu Item
        </h3>
        <p className="mt-2 text-sm text-[#68736e]">
          Are you sure you want to delete <span className="font-bold text-[#24312e]">"{item.name}"</span>? This will permanently remove this dish from the restaurant menu.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-[#fff5ed] p-2.5 text-xs font-bold text-[#b7623d]">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-[#dfe1dc] bg-white px-4 py-2.5 text-sm font-bold text-[#68736e] hover:bg-[#f2f4ef] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Yes, Delete Dish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuPage({
  menuItems,
  onMenuItemsChange,
  soldOutItems,
  setSoldOutItems,
  canManage = false,
  canCreate,
}: {
  menuItems: ApiMenuItem[];
  onMenuItemsChange?: (items: ApiMenuItem[]) => void;
  soldOutItems: string[];
  setSoldOutItems: (items: string[]) => void;
  canManage?: boolean;
  canCreate?: boolean;
}) {
  const isManager = canManage || canCreate || false;
  const [category, setCategory] = useState("All items");
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiMenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ApiMenuItem | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [imageSource, setImageSource] = useState<"upload" | "url">("upload");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const allCategories = Array.from(
    new Set(menuItems.map((item) => item.category).filter(Boolean)),
  );
  const preferredCategoryOrder = [
    "Small plates",
    "Mains",
    "Sides & Breads",
    "Desserts",
    "Beverages",
  ];
  const sortedCategories = [
    ...preferredCategoryOrder.filter((c) => allCategories.includes(c)),
    ...allCategories.filter((c) => !preferredCategoryOrder.includes(c)),
  ];
  const categories = ["All items", ...sortedCategories];

  const resetCreateForm = () => {
    setShowCreate(false);
    setUploadedImage("");
    setImageFileName("");
    setImageUrlInput("");
    setImageSource("upload");
    setError("");
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }
    setError("");
    try {
      const res = await compressImage(file);
      setUploadedImage(res.dataUrl);
      setImageFileName(res.name);
    } catch {
      setError("Unable to process the selected image.");
    }
  };

  const submitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const finalImage =
      imageSource === "upload" ? uploadedImage : imageUrlInput.trim();
    if (!finalImage) {
      setError(
        imageSource === "upload"
          ? "Please upload a dish photo from your system."
          : "Please enter a valid image URL.",
      );
      setSaving(false);
      return;
    }

    try {
      const item = await createMenuItem({
        name: String(form.get("name")),
        price: Number(form.get("price")),
        type: String(form.get("type")) as "veg" | "non-veg",
        image: finalImage,
        description: String(form.get("description")),
        category: String(form.get("category")),
        available: true,
        preparationTimeMinutes: Number(form.get("preparationTimeMinutes")),
        allergens: String(form.get("allergens"))
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        tags: String(form.get("tags"))
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      });
      if (onMenuItemsChange) {
        onMenuItemsChange([item, ...menuItems]);
      }
      resetCreateForm();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create menu item.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleItemUpdated = (updated: ApiMenuItem) => {
    if (onMenuItemsChange) {
      onMenuItemsChange(
        menuItems.map((i) => (i.id === updated.id ? updated : i)),
      );
    }
    if (updated.available === false) {
      if (!soldOutItems.includes(updated.name)) {
        setSoldOutItems([...soldOutItems, updated.name]);
      }
    } else {
      setSoldOutItems(soldOutItems.filter((name) => name !== updated.name));
    }
  };

  const handleItemDeleted = (deletedId: string) => {
    const deletedItem = menuItems.find((i) => i.id === deletedId);
    if (onMenuItemsChange) {
      onMenuItemsChange(menuItems.filter((i) => i.id !== deletedId));
    }
    if (deletedItem) {
      setSoldOutItems(soldOutItems.filter((name) => name !== deletedItem.name));
    }
  };

  const handleToggleAvailability = async (item: ApiMenuItem) => {
    const isUnavailable =
      item.available === false || soldOutItems.includes(item.name);
    const newAvailable = isUnavailable; // if unavailable, toggles to true
    try {
      await updateMenuItem(item.id, { available: newAvailable });
    } catch (err) {
      console.error("Failed to update availability in DB:", err);
    }
    if (onMenuItemsChange) {
      onMenuItemsChange(
        menuItems.map((i) =>
          i.id === item.id ? { ...i, available: newAvailable } : i,
        ),
      );
    }
    if (newAvailable) {
      setSoldOutItems(soldOutItems.filter((name) => name !== item.name));
    } else {
      if (!soldOutItems.includes(item.name)) {
        setSoldOutItems([...soldOutItems, item.name]);
      }
    }
  };

  return (
    <>
      {activeDropdownId && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setActiveDropdownId(null)}
        />
      )}

      <SectionHeading
        eyebrow="Menu engineering"
        title="Menu"
        description="Manage dishes, variants, add-ons, dietary tags, and live restaurant availability."
        action={
          isManager ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#315a3d]"
            >
              <Plus size={18} /> Add menu item
            </button>
          ) : undefined
        }
      />
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? "bg-[#24312e] text-white" : "border border-[#dfe1dc] text-[#68736e] hover:bg-white"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {menuItems
          .filter(
            (item) => category === "All items" || item.category === category,
          )
          .map((item) => {
            const isUnavailable =
              item.available === false || soldOutItems.includes(item.name);
            return (
              <article
                key={item.id || item.name}
                className={`relative overflow-hidden rounded-2xl border bg-[#fbfaf7] p-5 shadow-xs transition ${
                  isUnavailable ? "border-red-200/90 bg-red-50/20" : "border-[#e0e2dc]"
                }`}
              >
                <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-[#e9eee5] text-[#315a3d]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`h-full w-full object-cover ${isUnavailable ? "grayscale-[40%] contrast-90" : ""}`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Utensils size={34} strokeWidth={1.2} />
                  )}
                  {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                      <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                        <Ban size={13} /> Unavailable / Sold Out
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${item.type === "veg" ? "bg-[#3b724c]" : "bg-[#b7623d]"}`}
                        title={item.type === "veg" ? "Vegetarian" : "Non-Vegetarian"}
                      />
                      <p className={`font-bold text-[#24312e] ${isUnavailable ? "line-through text-[#84908a]" : ""}`}>
                        {item.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[#84908a]">
                      {item.category} •{" "}
                      {typeof item.price === "number"
                        ? `₹${item.price.toLocaleString("en-IN")}`
                        : item.price}
                    </p>
                  </div>

                  {isManager && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                        }}
                        className="rounded-lg p-1.5 text-[#84908a] transition hover:bg-[#eceeea] hover:text-[#24312e]"
                        aria-label="Item actions"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeDropdownId === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-[#dfe1dc] bg-white p-1.5 shadow-xl animate-in fade-in"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setActiveDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#24312e] hover:bg-[#f2f4ef] transition"
                          >
                            <Pencil size={15} className="text-[#68736e]" />
                            Edit item
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleAvailability(item);
                              setActiveDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#24312e] hover:bg-[#f2f4ef] transition"
                          >
                            {isUnavailable ? (
                              <>
                                <CheckCircle2 size={15} className="text-[#3b724c]" />
                                Mark available
                              </>
                            ) : (
                              <>
                                <Ban size={15} className="text-[#b7623d]" />
                                Mark unavailable
                              </>
                            )}
                          </button>
                          <div className="my-1 border-t border-[#edf0ec]" />
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingItem(item);
                              setActiveDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 size={15} className="text-red-600" />
                            Delete item
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {item.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-[#68736e]">
                    {item.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#eceeea] px-2 py-1 text-[10px] font-bold text-[#68736e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!isManager}
                  onClick={() => handleToggleAvailability(item)}
                  title={
                    isManager
                      ? isUnavailable
                        ? "Click to make available across restaurant"
                        : "Click to mark unavailable (sold out) across restaurant"
                      : undefined
                  }
                  className={`mt-4 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    isUnavailable
                      ? "border-red-200 bg-red-50/90 text-red-700 hover:bg-red-100"
                      : "border-[#dfe1dc] bg-white text-[#3b724c] hover:bg-[#f2f4ef]"
                  } ${!isManager ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-1.5">
                    {isUnavailable ? (
                      <>
                        <Ban size={14} className="text-red-600" />
                        <span>Unavailable (Sold out)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} className="text-[#3b724c]" />
                        <span>Available to order</span>
                      </>
                    )}
                  </span>
                  {isManager && (
                    <span className="text-[10px] uppercase font-semibold text-[#84908a]">
                      {isUnavailable ? "Make available" : "Mark unavailable"}
                    </span>
                  )}
                </button>
              </article>
            );
          })}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24312e]/40 p-5 backdrop-blur-xs">
          <form
            onSubmit={submitItem}
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl sm:p-7 border border-[#dfe1dc]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b7623d]">
                  Menu engineering
                </p>
                <h2 className="display-font mt-1 text-2xl font-bold text-[#24312e]">
                  Create menu item
                </h2>
              </div>
              <button
                type="button"
                onClick={resetCreateForm}
                className="rounded-lg p-2 text-[#84908a] transition hover:bg-[#eceeea]"
                aria-label="Close create menu item"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#68736e]">
                Item name <span className="text-[#b7623d]">*</span>
                <input
                  name="name"
                  required
                  placeholder="e.g. Paneer tikka"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Price (₹) <span className="text-[#b7623d]">*</span>
                <input
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  placeholder="420"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Type <span className="text-[#b7623d]">*</span>
                <select
                  name="type"
                  defaultValue="veg"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-veg</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Category <span className="text-[#b7623d]">*</span>
                <input
                  name="category"
                  required
                  placeholder="Mains"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e] sm:col-span-2">
                Preparation time (minutes) <span className="text-[#b7623d]">*</span>
                <input
                  name="preparationTimeMinutes"
                  required
                  min="0"
                  type="number"
                  defaultValue="15"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
            </div>

            {/* Dish Photo Upload / URL Section */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#68736e]">
                  Dish image <span className="text-[#b7623d]">*</span>
                </label>
                <div className="flex items-center gap-1.5 rounded-lg bg-[#eceeea] p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImageSource("upload")}
                    className={`rounded-md px-2.5 py-1 font-bold transition ${imageSource === "upload" ? "bg-white text-[#24312e] shadow-xs" : "text-[#68736e]"}`}
                  >
                    Upload from system
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource("url")}
                    className={`rounded-md px-2.5 py-1 font-bold transition ${imageSource === "url" ? "bg-white text-[#24312e] shadow-xs" : "text-[#68736e]"}`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {imageSource === "upload" ? (
                <div>
                  {uploadedImage ? (
                    <div className="mt-2 flex items-center gap-3.5 rounded-xl border border-[#dfe1dc] bg-white p-3 shadow-xs">
                      <img
                        src={uploadedImage}
                        alt="Dish preview"
                        className="h-16 w-16 shrink-0 rounded-lg border border-[#e0e2dc] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#24312e]">
                          {imageFileName || "Uploaded image"}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#3b724c]">
                          Ready to upload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage("");
                          setImageFileName("");
                        }}
                        className="rounded-lg border border-[#dfe1dc] px-3 py-1.5 text-xs font-bold text-[#b7623d] transition hover:bg-[#fff5ed]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageFile(file);
                      }}
                      className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                        isDragging
                          ? "border-[#b7623d] bg-[#fff5ed]"
                          : "border-[#dfe1dc] bg-white hover:border-[#b7623d] hover:bg-[#fbfaf7]"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFile(file);
                        }}
                      />
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0f1ed] text-[#315a3d]">
                        <Upload size={20} />
                      </div>
                      <p className="mt-2 text-xs font-bold text-[#24312e]">
                        Click to upload an image from your computer
                      </p>
                      <p className="mt-1 text-[11px] text-[#84908a]">
                        Drag & drop or browse • PNG, JPG, WebP (auto-optimized)
                      </p>
                    </label>
                  )}
                </div>
              ) : (
                <input
                  name="image"
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                />
              )}
            </div>

            <label className="mt-4 block text-xs font-bold text-[#68736e]">
              Description <span className="text-[#b7623d]">*</span>
              <textarea
                name="description"
                required
                rows={2}
                placeholder="Describe the dish"
                className="mt-1.5 w-full resize-none rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#68736e]">
                Allergens{" "}
                <span className="font-normal text-[#84908a]">
                  comma separated
                </span>
                <input
                  name="allergens"
                  placeholder="gluten, dairy"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Tags{" "}
                <span className="font-normal text-[#84908a]">
                  comma separated
                </span>
                <input
                  name="tags"
                  placeholder="popular, chef-special"
                  className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-[#fff5ed] px-3 py-2 text-xs font-bold text-[#b7623d]">
                {error}
              </p>
            )}
            <button
              disabled={saving}
              type="submit"
              className="mt-5 w-full rounded-xl bg-[#24312e] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#315a3d] disabled:opacity-50"
            >
              {saving ? "Saving item..." : "Create menu item"}
            </button>
          </form>
        </div>
      )}

      {editingItem && (
        <EditMenuItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={handleItemUpdated}
        />
      )}

      {deletingItem && (
        <DeleteMenuItemModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={handleItemDeleted}
        />
      )}
    </>
  );
}

function InventoryPage() {
  return (
    <>
      <SectionHeading
        eyebrow="Stock and recipes"
        title="Inventory"
        description="Track raw materials, recipe costing, wastage, and purchase receipts."
        action={
          <button className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white">
            <Plus size={18} />
            Add stock
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Stock value"
          value="₹2,84,600"
          change="+4.2% this month"
          icon={Package}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Low stock items"
          value="2"
          change="Needs attention"
          icon={AlertTriangle}
          color="bg-[#fff5dc] text-[#946243]"
        />
        <StatCard
          label="Wastage this week"
          value="₹4,280"
          change="-8.4% vs last week"
          icon={Trash2}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="display-font text-xl font-bold">
              Raw material catalog
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              Auto-depletion is active when an order enters preparation.
            </p>
          </div>
          <Search size={18} className="text-[#68736e]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-155 text-left text-sm">
            <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">
              <tr>
                <th className="pb-3">Ingredient</th>
                <th className="pb-3">On hand</th>
                <th className="pb-3">Minimum</th>
                <th className="pb-3">Cost</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const low = item.current < item.minimum;
                return (
                  <tr
                    key={item.name}
                    className="border-b border-[#f0f1ed] last:border-0"
                  >
                    <td className="py-4 font-bold text-[#24312e]">
                      {item.name}
                    </td>
                    <td className="py-4 text-[#68736e]">
                      {item.current} {item.unit}
                    </td>
                    <td className="py-4 text-[#68736e]">
                      {item.minimum} {item.unit}
                    </td>
                    <td className="py-4 text-[#68736e]">{item.cost}</td>
                    <td className="py-4">
                      <StatusPill status={low ? "Low stock" : "In stock"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function BillingPage() {
  return (
    <>
      <SectionHeading
        eyebrow="Point of sale"
        title="Billing"
        description="Close sessions, split bills, apply taxes, and release tables."
        action={
          <button className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white">
            <Plus size={18} />
            Open bill
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open bills"
          value="8"
          change="₹42,680 running total"
          icon={FileText}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Collected today"
          value="₹1,84,286"
          change="Across 46 payments"
          icon={CircleDollarSign}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Deposits to adjust"
          value="₹12,000"
          change="24 reserved guests"
          icon={CreditCard}
          color="bg-[#eee8f6] text-[#72558e]"
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="display-font text-xl font-bold">
              Active table sessions
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              Deposits are automatically shown as credits.
            </p>
          </div>
          {["Table 02", "Table 06", "Table 08", "Table 14"].map(
            (table, index) => (
              <div
                key={table}
                className="flex items-center justify-between border-b border-[#f0f1ed] py-4 last:border-0"
              >
                <div>
                  <p className="font-bold text-[#24312e]">{table}</p>
                  <p className="mt-1 text-xs text-[#84908a]">
                    {index + 2} guests • {index + 1} orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#24312e]">
                    ₹{[2480, 3640, 1842, 4820][index].toLocaleString()}
                  </p>
                  <button className="mt-1 text-xs font-bold text-[#b7623d]">
                    Open bill
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
        <aside className="rounded-2xl border border-[#e0e2dc] bg-[#24312e] p-6 text-white">
          <Sparkles className="text-[#f4bc83]" size={22} />
          <h2 className="display-font mt-4 text-2xl font-bold">Fast close</h2>
          <p className="mt-2 text-sm leading-6 text-[#aab8b0]">
            Select a table to split items, add a discount, and collect payment.
          </p>
          <button className="mt-7 w-full rounded-xl bg-[#f4bc83] px-4 py-3 text-sm font-bold text-[#684f37]">
            Start checkout
          </button>
        </aside>
      </div>
    </>
  );
}

function TeamPage() {
  const staff = [
    {
      name: "Priya Shah",
      role: "Floor server",
      shift: "09:00 - 17:00",
      status: "Clocked in",
    },
    {
      name: "Kabir Malik",
      role: "Head chef",
      shift: "11:00 - 23:00",
      status: "Clocked in",
    },
    {
      name: "Neha Joshi",
      role: "Billing",
      shift: "12:00 - 20:00",
      status: "On break",
    },
    {
      name: "Arjun Rao",
      role: "Server",
      shift: "17:00 - 23:00",
      status: "Scheduled",
    },
  ];
  return (
    <>
      <SectionHeading
        eyebrow="People and permissions"
        title="Team"
        description="Manage roles, shifts, attendance, and server coverage by zone."
        action={
          <button className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white">
            <Plus size={18} />
            Invite staff
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Present today"
          value="18 / 22"
          change="82% attendance"
          icon={Users}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Hours this week"
          value="486h"
          change="Across 22 staff"
          icon={Clock3}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Open shifts"
          value="3"
          change="Needs assignment"
          icon={CalendarDays}
          color="bg-[#fff5dc] text-[#946243]"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="display-font text-xl font-bold">Today’s staff</h2>
          <p className="mt-1 text-xs text-[#84908a]">
            Attendance ledger updates as team members clock in.
          </p>
        </div>
        <div className="space-y-2">
          {staff.map((person) => (
            <div
              key={person.name}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-[#eef0eb] bg-white p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5c7a6] text-xs font-bold text-[#684f37]">
                {person.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}
              </div>
              <div className="min-w-32 flex-1">
                <p className="font-bold text-[#24312e]">{person.name}</p>
                <p className="mt-1 text-xs text-[#84908a]">{person.role}</p>
              </div>
              <p className="text-sm text-[#68736e]">{person.shift}</p>
              <StatusPill status={person.status} />
              <MoreHorizontal size={17} className="text-[#84908a]" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TimeSelectionModal({
  currentTime,
  onSelectTime,
  onClose,
}: {
  currentTime: string;
  onSelectTime: (time: string) => void;
  onClose: () => void;
}) {
  const parse = (timeStr: string) => {
    const match = (timeStr || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let h = match[1].padStart(2, "0");
      let m = match[2];
      let p = (match[3] || "PM").toUpperCase();
      return { hour: h, minute: m, period: p };
    }
    // Fallback 24-hour match
    const match24 = (timeStr || "").match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const numH = parseInt(match24[1], 10);
      const p = numH >= 12 ? "PM" : "AM";
      const h12 = numH % 12 === 0 ? 12 : numH % 12;
      return { hour: String(h12).padStart(2, "0"), minute: match24[2], period: p };
    }
    return { hour: "07", minute: "30", period: "PM" };
  };

  const initial = parse(currentTime);
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initial.period);

  const hours = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
  const minutes = ["00", "15", "30", "45"];

  const currentPreview = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

  const applyTime = (timeString: string) => {
    onSelectTime(timeString);
    onClose();
  };

  const handleConfirm = () => {
    applyTime(currentPreview);
  };

  const lunchSlots = ["12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM"];
  const dinnerSlots = [
    "06:30 PM",
    "07:00 PM",
    "07:30 PM",
    "08:00 PM",
    "08:30 PM",
    "09:00 PM",
    "09:30 PM",
    "10:00 PM",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#fbfaf7] p-5 shadow-2xl border border-[#dfe1dc] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#e2e4dd] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbe8dc] text-[#b7623d]">
              <Clock3 size={19} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#24312e]">Select Booking Time</h3>
              <p className="text-[11px] text-[#84908a]">Choose service time or pick a dining slot</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#84908a] hover:bg-black/5 transition"
            aria-label="Close time selector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected time preview banner */}
        <div className="mt-4 rounded-xl border border-[#cfe0d0] bg-[#e8f1e8] p-3 text-center shadow-inner">
          <span className="text-[11px] font-bold text-[#58715e] uppercase tracking-wider block">
            Selected Time
          </span>
          <div className="text-3xl font-black text-[#315a3d] tracking-wide mt-0.5 flex items-center justify-center gap-2">
            <Clock3 size={24} className="text-[#3b724c]" />
            <span>{currentPreview}</span>
          </div>
        </div>

        {/* Custom Hour, Minute, AM/PM selector */}
        <div className="mt-4 rounded-xl border border-[#e2e4dd] bg-white p-3.5 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#68736e]">Hour</span>
              <span className="text-[11px] font-semibold text-[#b7623d]">{selectedHour}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHour(h)}
                  className={`rounded-lg py-1.5 text-xs font-bold transition ${
                    selectedHour === h
                      ? "bg-[#24312e] text-white shadow-sm ring-1 ring-[#24312e]"
                      : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f2f3ef]"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#f0f1ec]">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#68736e]">Minute</span>
                <span className="text-[11px] font-semibold text-[#b7623d]">:{selectedMinute}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMinute(m)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition ${
                      selectedMinute === m
                        ? "bg-[#24312e] text-white shadow-sm"
                        : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f2f3ef]"
                    }`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#68736e]">Period</span>
                <span className="text-[11px] font-semibold text-[#b7623d]">{selectedPeriod}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {["AM", "PM"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPeriod(p)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition ${
                      selectedPeriod === p
                        ? "bg-[#b7623d] text-white shadow-sm"
                        : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f2f3ef]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preset Dining Slots */}
        <div className="mt-3.5 rounded-xl border border-[#e2e4dd] bg-[#f7f8f4] p-3 space-y-2.5">
          <div>
            <span className="text-[10.5px] font-bold text-[#b7623d] uppercase tracking-wider block mb-1">
              ☀️ Lunch Service Slots
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {lunchSlots.map((slot) => {
                const isCurrent = currentPreview === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      const p = parse(slot);
                      setSelectedHour(p.hour);
                      setSelectedMinute(p.minute);
                      setSelectedPeriod(p.period);
                    }}
                    className={`rounded-lg py-1 px-2 text-xs font-semibold border transition ${
                      isCurrent
                        ? "border-[#b7623d] bg-[#fff5ed] text-[#b7623d] font-bold shadow-xs"
                        : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f2f3ef]"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[10.5px] font-bold text-[#315a3d] uppercase tracking-wider block mb-1">
              🌙 Dinner Service Slots
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {dinnerSlots.map((slot) => {
                const isCurrent = currentPreview === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      const p = parse(slot);
                      setSelectedHour(p.hour);
                      setSelectedMinute(p.minute);
                      setSelectedPeriod(p.period);
                    }}
                    className={`rounded-lg py-1 px-2 text-xs font-semibold border transition ${
                      isCurrent
                        ? "border-[#315a3d] bg-[#e8f1e8] text-[#315a3d] font-bold shadow-xs"
                        : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f2f3ef]"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-[#e2e4dd] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f2f3ef] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] shadow-sm transition flex items-center gap-1.5"
          >
            <Check size={14} />
            Set Time ({currentPreview})
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({
  tables,
  onBookingCreated,
  onClose,
  initialTableId,
  kitchenClosed,
}: {
  tables: RestaurantTable[];
  onBookingCreated: (booking: TableBooking) => void;
  onClose: () => void;
  initialTableId?: string;
  kitchenClosed?: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<TableBooking | null>(null);

  const [guests, setGuests] = useState<number>(2);
  const [bookingTime, setBookingTime] = useState<string>("07:30 PM");
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Determine valid initial table: must be Available and have >= 2 seats
  const initialTable = initialTableId ? tables.find((t) => t.id === initialTableId) : null;
  const isInitialValid = initialTable && initialTable.status === "Available" && initialTable.seats >= 2;
  const [selectedTableId, setSelectedTableId] = useState<string>(isInitialValid ? initialTableId! : "Pending");

  // Keep selected table valid when guests count changes
  useEffect(() => {
    if (selectedTableId && selectedTableId !== "Pending") {
      const current = tables.find((t) => t.id === selectedTableId);
      if (current && (current.status !== "Available" || current.seats < guests)) {
        const firstValid = tables.find((t) => t.status === "Available" && t.seats >= guests);
        setSelectedTableId(firstValid ? firstValid.id : "Pending");
      }
    }
  }, [guests, tables, selectedTableId]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const eligibleTables = tables.filter(
    (t) => t.status === "Available" && t.seats >= guests,
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (kitchenClosed) {
      setError("Kitchen is closed. Cannot accept new table bookings at this time.");
      return;
    }
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const tableId = selectedTableId === "Pending" || !selectedTableId ? null : selectedTableId;

    if (tableId) {
      const targetTable = tables.find((t) => t.id === tableId);
      if (!targetTable) {
        setError("Selected table does not exist.");
        setSubmitting(false);
        return;
      }
      if (targetTable.status !== "Available") {
        setError(`Table ${targetTable.id} is currently ${targetTable.status} and cannot be booked.`);
        setSubmitting(false);
        return;
      }
      if (targetTable.seats < guests) {
        setError(`Table ${targetTable.id} only has ${targetTable.seats} seats, which is not enough for ${guests} guests.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const created = await createBooking({
        customer: String(form.get("customer") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        bookingDate: String(form.get("bookingDate") || todayStr).trim(),
        bookingTime: String(bookingTime || form.get("bookingTime") || "").trim(),
        guests: Number(guests) || 2,
        tableId: tableId,
        source: (form.get("source") as any) || "Phone",
        specialRequests: String(form.get("specialRequests") || "").trim(),
        deposit: 500,
      });
      setConfirmedBooking(created);
      onBookingCreated(created);
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book table.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showTimePicker && (
        <TimeSelectionModal
          currentTime={bookingTime}
          onSelectTime={(newTime) => setBookingTime(newTime)}
          onClose={() => setShowTimePicker(false)}
        />
      )}
      <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#24312e]/40 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-xl rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl sm:p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#b7623d]">
              <CalendarCheck size={15} />
              Reservation
            </div>
            <h2 className="display-font text-2xl font-bold text-[#24312e]">
              Book a table
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              Select party size, booking time, and an available table with sufficient seating capacity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#84908a] hover:bg-black/5 transition"
            aria-label="Close booking dialog"
          >
            <X size={19} />
          </button>
        </div>

        {kitchenClosed && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-red-600" />
            <div>
              <span className="font-bold">Kitchen is Closed:</span> Table bookings are paused until the kitchen reopens.
            </div>
          </div>
        )}

        {confirmed ? (
          <div className="mt-8 rounded-xl border border-[#cfe0d0] bg-[#e8f1e8] p-5 text-center">
            <CheckCircle2 className="mx-auto text-[#3b724c]" size={34} />
            <h3 className="mt-3 font-bold text-[#315a3d]">
              Table reserved successfully
            </h3>
            <p className="mt-2 text-sm text-[#58715e]">
              Booking confirmed for {confirmedBooking?.customer} on{" "}
              {confirmedBooking?.bookingDate} at {confirmedBooking?.bookingTime}
              {confirmedBooking?.tableId ? ` (Table ${confirmedBooking.tableId})` : " (Auto-allocated)"}.
            </p>
            <p className="mt-1 text-xs text-[#58715e]">
              The ₹500 booking deposit is recorded and will be adjusted on final billing.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-[#24312e] px-5 py-3 text-sm font-bold text-white hover:bg-[#315a3d]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6">
            {error && (
              <div className="mb-4 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs text-[#721c24] flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-[#721c24]" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#68736e]">
                Guest name <span className="text-[#b7623d]">*</span>
                <input
                  required
                  name="customer"
                  type="text"
                  placeholder="e.g. Maya Kapoor"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm font-medium text-[#24312e] outline-none placeholder:text-[#aab1ac] focus:border-[#b7623d]"
                />
              </label>

              <label className="text-xs font-bold text-[#68736e]">
                Contact number <span className="text-[#b7623d]">*</span>
                <input
                  required
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm font-medium text-[#24312e] outline-none placeholder:text-[#aab1ac] focus:border-[#b7623d]"
                />
              </label>

              <label className="text-xs font-bold text-[#68736e]">
                Date <span className="text-[#b7623d]">*</span>
                <input
                  required
                  name="bookingDate"
                  type="date"
                  defaultValue={todayStr}
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm font-medium text-[#24312e] outline-none focus:border-[#b7623d]"
                />
              </label>

              {/* Time selection with Popup Trigger */}
              <div>
                <label className="text-xs font-bold text-[#68736e] block">
                  Time <span className="text-[#b7623d]">*</span>
                </label>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm font-medium text-[#24312e] outline-none hover:border-[#b7623d] focus:border-[#b7623d] transition shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbe8dc] text-[#b7623d] group-hover:bg-[#b7623d] group-hover:text-white transition">
                        <Clock3 size={16} />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-[#84908a] block -mb-0.5">Booking time</span>
                        <span className="text-sm font-bold text-[#24312e]">{bookingTime}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#b7623d] bg-[#fff5ed] px-2.5 py-1 rounded-lg border border-[#fbd3bf] group-hover:bg-[#b7623d] group-hover:text-white transition flex items-center gap-1">
                      <Clock3 size={12} />
                      Select Time ▾
                    </span>
                  </button>
                  <input
                    type="hidden"
                    name="bookingTime"
                    value={bookingTime}
                  />
                </div>
              </div>

              {/* Number of guests: Controls table eligibility */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#68736e]">
                    Number of guests <span className="text-[#b7623d]">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#b7623d]">
                    Showing eligible tables with {guests}+ seats
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuests(num)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                        guests === num
                          ? "bg-[#24312e] text-white shadow-sm ring-2 ring-[#24312e] ring-offset-1"
                          : "border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f2f3ef]"
                      }`}
                    >
                      {num}{num === 10 ? "+" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Table: Disables Booked, Occupied, Needs cleaning, and tables with seats < guests */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#68736e]">
                    Select Table ({eligibleTables.length} available for {guests}+ guests)
                  </label>
                  <span className="text-[11px] font-bold text-[#315a3d]">
                    {eligibleTables.length > 0
                      ? `✓ ${eligibleTables.length} tables fit ${guests} guests`
                      : `⚠️ No available table with ${guests}+ seats`}
                  </span>
                </div>

                <select
                  name="tableId"
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm font-medium text-[#24312e] outline-none focus:border-[#b7623d]"
                >
                  <option value="Pending">Auto-allocate (Pending)</option>
                  {eligibleTables.length > 0 && (
                    <optgroup label={`Eligible Tables (${guests}+ Seats & Available)`}>
                      {eligibleTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} ({t.seats} seats · {t.zone}) - Available ✓
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {tables.filter((t) => t.status !== "Available" || t.seats < guests).length > 0 && (
                    <optgroup label="Unselectable (Occupied / Booked / Needs cleaning / Too small)">
                      {tables
                        .filter((t) => t.status !== "Available" || t.seats < guests)
                        .map((t) => {
                          let reason = "";
                          if (t.status === "Occupied") reason = "Occupied";
                          else if (t.status === "Booked") reason = "Booked";
                          else if (t.status === "Needs cleaning") reason = "Needs cleaning";
                          else if (t.seats < guests) reason = `Too small (${t.seats} < ${guests} seats)`;

                          return (
                            <option key={t.id} value={t.id} disabled>
                              {t.id} ({t.seats} seats · {t.zone}) - Unselectable [{reason}]
                            </option>
                          );
                        })}
                    </optgroup>
                  )}
                </select>

                {/* Visual table quick picker cards */}
                <div className="mt-3 rounded-xl border border-[#e2e4dd] bg-[#f7f8f4] p-3 space-y-3">
                  {/* Eligible Section (Tables >= guests & Available) */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#315a3d]">
                      <span className="flex items-center gap-1">
                        <Table2 size={13} />
                        Eligible Tables ({guests}+ seats & Available):
                      </span>
                      <span className="text-[10px] text-[#24312e]">
                        Selected: <strong>{selectedTableId}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setSelectedTableId("Pending")}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                          selectedTableId === "Pending"
                            ? "border-[#315a3d] bg-[#e8f1e8] ring-2 ring-[#315a3d] text-[#315a3d] font-bold shadow-sm"
                            : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-white/80"
                        }`}
                      >
                        <span className="text-xs font-bold">Auto</span>
                        <span className="text-[10px] text-[#84908a]">Pending</span>
                      </button>

                      {eligibleTables.map((t) => {
                        const isSelected = selectedTableId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTableId(t.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                              isSelected
                                ? "border-[#315a3d] bg-[#e8f1e8] ring-2 ring-[#315a3d] text-[#315a3d] font-bold shadow-sm"
                                : "border-[#9ac49f] bg-white text-[#24312e] hover:bg-[#f0f1ed] hover:border-[#315a3d]"
                            }`}
                          >
                            <span className="text-xs font-extrabold">{t.id}</span>
                            <span className="text-[10px] font-semibold">{t.seats} seats • {t.zone}</span>
                            <span className="mt-1 rounded px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-tight bg-[#cfe0d0] text-[#315a3d]">
                              Available ✓
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {eligibleTables.length === 0 && (
                      <p className="mt-2 text-xs text-[#b7623d] bg-[#fff5ed] p-2 rounded-lg border border-[#fbd3bf]">
                        No available table currently has {guests}+ seats. Please choose <strong>Auto-allocate</strong> or select fewer guests.
                      </p>
                    )}
                  </div>

                  {/* Unselectable Tables Section (Occupied, Booked, Cleaning, or seats < guests) */}
                  {tables.some((t) => t.status !== "Available" || t.seats < guests) && (
                    <div className="pt-2 border-t border-[#e2e4dd]">
                      <div className="mb-2 flex items-center justify-between text-[10.5px] font-semibold text-[#84908a]">
                        <span>Unselectable Tables (Occupied / Booked / Cleaning / Below {guests} Seats):</span>
                        <span className="text-[9px] uppercase tracking-wider text-[#9ba39e]">Disabled</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 max-h-32 overflow-y-auto pr-1">
                        {tables
                          .filter((t) => t.status !== "Available" || t.seats < guests)
                          .map((t) => {
                            let unselectableTag = "";
                            if (t.status === "Occupied") unselectableTag = "Occupied";
                            else if (t.status === "Booked") unselectableTag = "Booked";
                            else if (t.status === "Needs cleaning") unselectableTag = "Cleaning";
                            else if (t.seats < guests) unselectableTag = `${t.seats} seats (< ${guests})`;

                            return (
                              <button
                                key={t.id}
                                type="button"
                                disabled
                                className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-[#dcded8] bg-[#eceeea]/70 text-[#9ba39e] cursor-not-allowed opacity-60 text-center"
                                title={`Table ${t.id} cannot be booked: ${unselectableTag}`}
                              >
                                <span className="text-xs font-bold">{t.id}</span>
                                <span className="text-[10px]">{t.seats} seats • {t.zone}</span>
                                <span className="mt-1 rounded px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-tight bg-[#dedfd9] text-[#78827c]">
                                  {unselectableTag}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <label className="text-xs font-bold text-[#68736e] sm:col-span-2">
                Booking source
                <select
                  required
                  name="source"
                  defaultValue="Phone"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm font-medium text-[#24312e] outline-none"
                >
                  <option value="Phone">Phone</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Web link">Web link</option>
                  <option value="Online">Online</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-xs font-bold text-[#68736e]">
              Special requests
              <textarea
                name="specialRequests"
                rows={2}
                placeholder="Birthday celebration, high chair, dietary needs, preferred seating..."
                className="mt-2 w-full resize-none rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm font-medium text-[#24312e] outline-none"
              />
            </label>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#ead7c8] bg-[#fff5ed] p-3.5">
              <CreditCard
                className="mt-0.5 shrink-0 text-[#b7623d]"
                size={18}
              />
              <div className="flex-1 text-xs">
                <p className="font-bold text-[#684f37]">
                  Booking deposit{" "}
                  <span className="float-right text-sm font-extrabold">₹500</span>
                </p>
                <p className="mt-0.5 text-[11px] text-[#8f7055]">
                  Recorded and adjusted against guest’s final bill.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || kitchenClosed}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#24312e] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#315a3d] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <CreditCard size={17} />
              {kitchenClosed ? "Kitchen Closed (Bookings Paused)" : submitting ? "Booking table..." : "Confirm & Book Table"}
            </button>
          </form>
        )}
      </div>
    </div>
    </>
  );
}

function NewOrderModal({
  tables,
  menuItems,
  soldOutItems = [],
  onOrderCreated,
  onClose,
  initialTableId,
  kitchenClosed,
  role,
}: {
  tables: RestaurantTable[];
  menuItems: ApiMenuItem[];
  soldOutItems?: string[];
  onOrderCreated: (order: Order) => void;
  onClose: () => void;
  initialTableId?: string;
  kitchenClosed?: boolean;
  role?: StaffRole;
}) {
  const isInitialTakeaway = initialTableId === "Takeaway";
  const [orderType, setOrderType] = useState<"Dine in" | "Takeaway">(
    isInitialTakeaway ? "Takeaway" : "Dine in",
  );
  const [customer, setCustomer] = useState("");
  const [table, setTable] = useState(
    initialTableId && !isInitialTakeaway
      ? initialTableId
      : tables.find((t) => t.status === "Available")?.id || tables[0]?.id || "T01",
  );
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedItems = menuItems.filter((item) =>
    selectedItemIds.includes(item.id),
  );
  const orderTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (kitchenClosed) {
      setError("Kitchen is closed. Cannot accept new orders at this time.");
      return;
    }
    if (selectedItemIds.length === 0) {
      setError("Please select at least one item to order.");
      return;
    }
    const unavailableInOrder = selectedItems.filter(
      (i) => i.available === false || soldOutItems.includes(i.name),
    );
    if (unavailableInOrder.length > 0) {
      setError(
        `Unavailable dish selected: ${unavailableInOrder.map((i) => i.name).join(", ")}. Please remove before ordering.`,
      );
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const order = await createOrder(
        {
          customer:
            customer.trim() ||
            (orderType === "Dine in" ? `Table ${table} Guest` : "Takeaway Guest"),
          table: orderType === "Dine in" ? table : "Takeaway",
          itemList: selectedItems.map((i) => i.name),
          total: orderTotal,
          orderType,
        },
        role || "Server",
      );
      onOrderCreated(order);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#24312e]/35 p-5">
      <div className="my-auto w-full max-w-lg rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display-font text-2xl font-bold text-[#24312e]">
              Book New Order
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              Create and dispatch an order to the kitchen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#84908a]"
            aria-label="Close order dialog"
          >
            <X size={19} />
          </button>
        </div>

        {kitchenClosed && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-red-600" />
            <div>
              <span className="font-bold">Kitchen is Closed:</span> New orders cannot be taken until the kitchen reopens.
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs text-[#721c24]">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType("Dine in")}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-bold border transition ${
                orderType === "Dine in"
                  ? "border-[#b7623d] bg-[#fff5ed] text-[#b7623d]"
                  : "border-[#dfe1dc] bg-white text-[#68736e]"
              }`}
            >
              <Utensils size={16} />
              Dine in
            </button>
            <button
              type="button"
              onClick={() => setOrderType("Takeaway")}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-bold border transition ${
                orderType === "Takeaway"
                  ? "border-[#b7623d] bg-[#fff5ed] text-[#b7623d]"
                  : "border-[#dfe1dc] bg-white text-[#68736e]"
              }`}
            >
              <ShoppingBag size={16} />
              Takeaway
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#68736e]">
              Customer name
              <input
                type="text"
                placeholder={
                  orderType === "Dine in" ? "e.g. Table guest" : "e.g. Rahul"
                }
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
              />
            </label>
            {orderType === "Dine in" ? (
              <label className="text-xs font-bold text-[#68736e]">
                Assign Table
                <select
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none"
                >
                  {tables.map((t) => {
                    const isAvailable = t.status === "Available" || t.id === initialTableId;
                    return (
                      <option key={t.id} value={t.id} disabled={!isAvailable}>
                        {t.id} ({t.seats} seats · {t.zone}) - {t.status} {!isAvailable ? "[Unselectable]" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>
            ) : (
              <label className="text-xs font-bold text-[#68736e]">
                Order channel
                <input
                  type="text"
                  disabled
                  value="Pickup Counter"
                  className="mt-1 w-full rounded-xl border border-[#dfe1dc] bg-[#eef0eb] px-3 py-2.5 text-sm text-[#68736e]"
                />
              </label>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-[#68736e]">
              Select dishes ({selectedItemIds.length} selected):
            </p>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-[#dfe1dc] bg-white p-2 space-y-1.5">
              {menuItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                const isUnavailable =
                  item.available === false || soldOutItems.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => toggleItem(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left text-xs transition ${
                      isUnavailable
                        ? "cursor-not-allowed bg-[#f3f4f1] text-[#9ba39e] opacity-60"
                        : isSelected
                        ? "bg-[#e8f1e8] font-bold text-[#315a3d]"
                        : "hover:bg-[#fbfaf7] text-[#24312e]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isUnavailable
                            ? "bg-[#9ba39e]"
                            : item.type === "veg"
                            ? "bg-[#3b724c]"
                            : "bg-[#b7623d]"
                        }`}
                      />
                      <span className={isUnavailable ? "line-through text-[#84908a]" : ""}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#84908a]">
                        ({item.category})
                      </span>
                      {isUnavailable && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <span className={isUnavailable ? "text-[#9ba39e]" : ""}>₹{item.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#f0f2ed] p-3 text-sm font-bold text-[#24312e]">
            <span>Order total:</span>
            <span>₹{orderTotal.toLocaleString("en-IN")}</span>
          </div>

          <button
            type="submit"
            disabled={submitting || selectedItemIds.length === 0 || kitchenClosed}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white hover:bg-[#315a3d] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ShoppingBag size={17} />
            {kitchenClosed
              ? "Kitchen Closed (Orders Paused)"
              : submitting
              ? "Booking order..."
              : `Book Order (${selectedItemIds.length} item${selectedItemIds.length === 1 ? "" : "s"})`}
          </button>
        </form>
      </div>
    </div>
  );
}

function getRoleEmail(role: StaffRole) {
  return `${role.toLowerCase()}@tableandthyme.com`;
}

function LoginPage({ onLogin }: { onLogin: (role: StaffRole) => void }) {
  const [role, setRole] = useState<StaffRole>("Server");
  const [email, setEmail] = useState(getRoleEmail("Server"));
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  const selectRole = (nextRole: StaffRole) => {
    setRole(nextRole);
    setEmail(getRoleEmail(nextRole));
    setError("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expectedEmail = getRoleEmail(role);
    if (
      email.trim().toLowerCase() !== expectedEmail ||
      password !== "demo123"
    ) {
      setError("Use the demo credentials shown below.");
      return;
    }
    onLogin(role);
  };

  return (
    <div className="paper-grid flex min-h-screen items-center justify-center bg-[#f7f4ef] p-5">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] shadow-[0_20px_70px_rgba(36,49,46,.1)] md:grid-cols-[.85fr_1.15fr]">
        <div className="bg-[#24312e] p-8 text-white sm:p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4bc83] text-[#684f37]">
            <ChefHat size={22} />
          </div>
          <p className="mt-10 text-[10px] font-bold uppercase tracking-[.2em] text-[#f4bc83]">
            Table & Thyme
          </p>
          <h1 className="display-font mt-3 text-4xl font-bold leading-tight">
            A calmer shift starts with a clear service desk.
          </h1>
          <p className="mt-5 text-sm leading-6 text-[#aab8b0]">
            Use your staff account to manage orders, reservations, tables, and
            kitchen tickets from one place.
          </p>
          <div className="mt-10 space-y-3 text-sm text-[#d3ddd6]">
            <p className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#f4bc83]" />
              Live floor and order status
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#f4bc83]" />
              QR ordering for every table
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#f4bc83]" />
              Kitchen and server handoff
            </p>
          </div>
        </div>
        <div className="p-7 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#b7623d]">
              Staff sign in
            </p>
            <h2 className="display-font mt-2 text-3xl font-bold text-[#24312e]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[#84908a]">
              Choose your workspace to continue.
            </p>
          </div>
          <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-[#f0f1ed] p-1">
            <button
              onClick={() => selectRole("Manager")}
              className={`rounded-lg px-2 py-2.5 text-xs font-bold ${role === "Manager" ? "bg-white text-[#315a3d] shadow-sm" : "text-[#84908a]"}`}
            >
              <Settings2 className="mr-1 inline" size={14} />
              Manager
            </button>
            <button
              onClick={() => selectRole("Server")}
              className={`rounded-lg px-3 py-2.5 text-sm font-bold ${role === "Server" ? "bg-white text-[#315a3d] shadow-sm" : "text-[#84908a]"}`}
            >
              <Users className="mr-2 inline" size={16} />
              Server
            </button>
            <button
              onClick={() => selectRole("Kitchen")}
              className={`rounded-lg px-3 py-2.5 text-sm font-bold ${role === "Kitchen" ? "bg-white text-[#315a3d] shadow-sm" : "text-[#84908a]"}`}
            >
              <ChefHat className="mr-2 inline" size={16} />
              Kitchen
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-bold text-[#68736e]">
              Work email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm text-[#24312e] outline-none focus:border-[#b7623d]"
              />
            </label>
            <label className="block text-xs font-bold text-[#68736e]">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm text-[#24312e] outline-none focus:border-[#b7623d]"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-[#fff5ed] px-3 py-2 text-xs font-bold text-[#b7623d]">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#24312e] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#315a3d]"
            >
              Sign in as {role}
            </button>
          </form>
          <div className="mt-6 rounded-xl border border-[#e0e2dc] bg-[#f7f7f3] p-4 text-xs text-[#68736e]">
            <p className="font-bold text-[#24312e]">
              Frontend demo credentials
            </p>
            <p className="mt-2">
              Server: <strong>server@tableandthyme.com</strong>
            </p>
            <p className="mt-1">
              Kitchen: <strong>kitchen@tableandthyme.com</strong>
            </p>
            <p className="mt-1">
              Manager: <strong>manager@tableandthyme.com</strong>
            </p>
            <p className="mt-1">
              Password: <strong>demo123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerWebsite({
  onBack,
  menuItems,
  soldOutItems,
  onOrderCreated,
  kitchenClosed,
}: {
  onBack: () => void;
  menuItems: ApiMenuItem[];
  soldOutItems: string[];
  onOrderCreated: (order: Order) => void;
  kitchenClosed?: boolean;
}) {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<string[]>([]);
  const [customer, setCustomer] = useState("QR guest");
  const [submitting, setSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const websiteItems = menuItems.filter(
    (item) => item.available !== false && !soldOutItems.includes(item.name),
  );
  const categories = [
    "All",
    ...Array.from(new Set(websiteItems.map((item) => item.category))),
  ];
  const cartTotal = cart.reduce((total, itemName) => {
    const item = menuItems.find((candidate) => candidate.name === itemName);
    return total + (item?.price ?? 0);
  }, 0);
  const submitOrder = async () => {
    if (kitchenClosed) {
      setOrderMessage("Kitchen is closed. We are currently not accepting new orders.");
      return;
    }
    if (cart.length === 0) return;
    setSubmitting(true);
    setOrderMessage("");
    try {
      const order = await createOrder({
        customer,
        table: "Table T08",
        itemList: cart,
        total: cartTotal,
      });
      onOrderCreated(order);
      setCart([]);
      setOrderMessage(`Order ${formatOrderLabel(order.id, order.customer)} sent to the kitchen.`);
    } catch {
      setOrderMessage("Unable to send the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#24312e]">
      <header className="border-b border-[#e4e5df] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <div>
            <p className="display-font text-xl font-bold">Table & Thyme</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#84908a]">
              Table T08 · Digital menu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="rounded-xl border border-[#dfe1dc] px-3 py-2 text-xs font-bold text-[#68736e]"
            >
              Staff view
            </button>
            <button
              className="relative rounded-xl bg-[#24312e] p-3 text-white"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#b7623d] text-[10px] font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        {kitchenClosed && (
          <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 font-bold text-red-800 text-sm">
              <AlertTriangle size={18} />
              Kitchen is Currently Closed
            </div>
            <p className="mt-1 text-xs text-red-600">
              We are temporarily not taking new orders. You are welcome to browse the digital menu.
            </p>
          </div>
        )}
        <div className="rounded-2xl bg-[#e8f1e8] p-6 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#3b724c]">
            Good food, no waiting
          </p>
          <h1 className="display-font mt-2 text-3xl font-bold sm:text-4xl">
            Order from your table
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#58715e]">
            Browse the menu, add notes for the kitchen, and send your order
            directly to the team.
          </p>
        </div>
        <div className="mt-8 flex gap-2 overflow-x-auto">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${category === item ? "bg-[#24312e] text-white" : "border border-[#dfe1dc] bg-white text-[#68736e]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {websiteItems
            .filter((item) => category === "All" || item.category === category)
            .map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-[#e0e2dc] bg-white p-4"
              >
                <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-[#f0f1ed] text-[#315a3d]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-[#84908a]">
                      No Image Available
                    </span>
                  )}
                  <span
                    className={`absolute right-3 top-3 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      item.type === "veg"
                        ? "bg-[#e8f1e8] text-[#3b724c]"
                        : "bg-[#fbe8dc] text-[#b7623d]"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-[#24312e]">{item.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-[#84908a]">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-extrabold text-[#24312e]">
                    ₹{item.price}
                  </span>
                  <button
                    onClick={() => setCart((prev) => [...prev, item.name])}
                    className="rounded-lg bg-[#24312e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#315a3d]"
                  >
                    Add
                  </button>
                </div>
              </article>
            ))}
        </div>
        <div className="mt-8 rounded-2xl border border-[#e0e2dc] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-bold text-[#68736e]">
              Guest name
              <input
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm text-[#24312e] outline-none focus:border-[#b7623d]"
              />
            </label>
            <div className="text-sm font-bold text-[#24312e]">
              {cart.length} items · ₹{cartTotal.toLocaleString("en-IN")}
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting || cart.length === 0 || kitchenClosed}
              className="rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {kitchenClosed ? "Kitchen Closed" : submitting ? "Sending..." : "Place order"}
            </button>
          </div>
          {orderMessage && (
            <p className="mt-3 text-xs font-bold text-[#3b724c]">
              {orderMessage}
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-[#ead7c8] bg-[#fff5ed] p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-[#684f37]">Need something?</p>
            <p className="mt-1 text-xs text-[#84908a]">
              Call the server, request water, or ask for the bill.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-[#e6cbb8] px-3 py-2 text-xs font-bold text-[#946243]">
              Call waiter
            </button>
            <button className="rounded-lg bg-[#b7623d] px-3 py-2 text-xs font-bold text-white">
              Request bill
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RestaurantApp() {
  const [role, setRole] = useState<StaffRole | null>(null);
  const [activeNav, setActiveNav] = useState<Page>("Overview");
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = window.localStorage.getItem("table-thyme-orders");
    if (!savedOrders) return initialOrders;

    try {
      return (JSON.parse(savedOrders) as Order[]).map((order) => ({
        ...order,
        status:
          order.status === ("Completed" as OrderStatus)
            ? "Served"
            : order.status,
      }));
    } catch {
      return initialOrders;
    }
  });
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>(fallbackMenuItems);
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [bookings, setBookings] = useState<TableBooking[]>(initialReservations);
  const [soldOutItems, setSoldOutItems] = useState<string[]>([
    "Wild mushroom risotto",
  ]);
  const [showBooking, setShowBooking] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);
  const [kitchenClosed, setKitchenClosed] = useState<boolean>(false);
  const [selectedTableForBooking, setSelectedTableForBooking] = useState<string | undefined>();
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | undefined>();

  const handleOpenBooking = (tableId?: string) => {
    setSelectedTableForBooking(tableId);
    setShowBooking(true);
  };

  const handleOpenNewOrder = (tableId?: string) => {
    setSelectedTableForOrder(tableId);
    setShowNewOrder(true);
  };

  const handleToggleKitchenClosed = async () => {
    try {
      const res = await toggleKitchenStatus();
      setKitchenClosed(res.closed);
    } catch {
      setKitchenClosed((prev) => !prev);
    }
  };

  useEffect(() => {
    getKitchenStatus()
      .then((status) => setKitchenClosed(status.closed))
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.localStorage.setItem("table-thyme-orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(() => {
        // Keep the seeded frontend orders available when the API is offline.
      });
  }, []);

  useEffect(() => {
    fetchMenuItems()
      .then((items) => {
        const list = items.length > 0 ? items : fallbackMenuItems;
        setMenuItems(list);
        const unavailable = list
          .filter((item) => item.available === false)
          .map((item) => item.name);
        setSoldOutItems((prev) => Array.from(new Set([...prev, ...unavailable])));
      })
      .catch(() => {
        // Keep the local menu available when the API is offline.
      });
  }, []);

  useEffect(() => {
    fetchTables()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTables(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBookings()
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(() => {});
  }, []);

  const handleStatusChange = async (
    id: string,
    status: OrderStatus,
    actingRole?: StaffRole,
  ) => {
    const effectiveRole = actingRole || role || undefined;
    const previousOrders = orders;

    // Immediate optimistic update so buttons and tickets react without latency
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === id ? { ...order, status } : order,
      ),
    );

    try {
      const updatedOrder = await updateOrderStatus(id, status, effectiveRole);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === id ? updatedOrder : order)),
      );
      fetchTables().then(setTables).catch(() => {});
    } catch (err: unknown) {
      console.error("Failed to update order status on server:", err);
      // Rollback optimistic state on error
      setOrders(previousOrders);
      const message =
        err instanceof Error ? err.message : "Failed to update order status";
      alert(message);
    }
  };

  const handleTableStatusChange = async (id: string, status: TableStatus) => {
    try {
      const updated = await updateTableStatus(id, status);
      setTables((current) => current.map((t) => (t.id === id ? updated : t)));
    } catch {
      setTables((current) =>
        current.map((t) => (t.id === id ? { ...t, status } : t)),
      );
    }
  };

  const handleBookingStatusChange = async (
    id: string,
    status: BookingStatus,
  ) => {
    try {
      const updated = await updateBookingStatus(id, status);
      setBookings((current) =>
        current.map((b) => (b.id === id ? updated : b)),
      );
      if ((status === "Arrived" || status === "Seated") && updated.tableId) {
        setTables((prev) =>
          prev.map((tbl) =>
            tbl.id === updated.tableId ? { ...tbl, status: "Occupied" } : tbl,
          ),
        );
      }
      fetchTables().then(setTables).catch(() => {});
    } catch {
      setBookings((current) =>
        current.map((b) => (b.id === id ? { ...b, status } : b)),
      );
      if (status === "Arrived" || status === "Seated") {
        const found = bookings.find((b) => b.id === id);
        if (found?.tableId) {
          setTables((prev) =>
            prev.map((tbl) =>
              tbl.id === found.tableId ? { ...tbl, status: "Occupied" } : tbl,
            ),
          );
        }
      }
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await cancelBooking(id);
      setBookings((current) => current.filter((b) => b.id !== id));
      fetchTables().then(setTables).catch(() => {});
    } catch {
      setBookings((current) => current.filter((b) => b.id !== id));
    }
  };

  const handleBookingCreated = (newBooking: TableBooking) => {
    setBookings((current) => {
      const filtered = current.filter((b) => b.id !== newBooking.id);
      return [newBooking, ...filtered];
    });
    fetchBookings()
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(() => {});
    fetchTables().then(setTables).catch(() => {});
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((current) => [newOrder, ...current]);
    fetchTables().then(setTables).catch(() => {});
  };

  const handleAddTable = async (newTable: {
    id: string;
    seats: number;
    zone: string;
    status: TableStatus;
    serverName: string;
  }) => {
    const created = await createTable(newTable);
    setTables((current) => {
      const exists = current.some((t) => t.id === created.id);
      return exists
        ? current.map((t) => (t.id === created.id ? created : t))
        : [...current, created];
    });
    fetchTables().then(setTables).catch(() => {});
  };

  const handleDeleteTable = async (id: string) => {
    await deleteTable(id);
    setTables((current) => current.filter((t) => t.id !== id));
    fetchTables().then(setTables).catch(() => {});
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTables()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setTables(data);
        })
        .catch(() => {});

      fetchBookings()
        .then((data) => {
          if (Array.isArray(data)) setBookings(data);
        })
        .catch(() => {});

      fetchOrders()
        .then((data) => {
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(() => {});

      getKitchenStatus()
        .then((status) => setKitchenClosed(status.closed))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncOrders = (event: StorageEvent) => {
      if (event.key !== "table-thyme-orders" || !event.newValue) return;
      setOrders(JSON.parse(event.newValue) as Order[]);
    };

    window.addEventListener("storage", syncOrders);
    return () => window.removeEventListener("storage", syncOrders);
  }, []);
  if (!role)
    return (
      <LoginPage
        onLogin={(nextRole) => {
          setRole(nextRole);
          setActiveNav(nextRole === "Kitchen" ? "Kitchen" : "Overview");
        }}
      />
    );
  if (showWebsite)
    return (
      <CustomerWebsite
        onBack={() => setShowWebsite(false)}
        menuItems={menuItems}
        soldOutItems={soldOutItems}
        onOrderCreated={handleOrderCreated}
        kitchenClosed={kitchenClosed}
      />
    );
  const visibleNavGroups = getNavGroups(role);
  const pageProps = {
    onBook: handleOpenBooking,
    onOrder: handleOpenNewOrder,
  };
  const page =
    activeNav === "Overview" ? (
      <OverviewPage
        onBook={handleOpenBooking}
        onOrder={handleOpenNewOrder}
        onWebsite={() => setShowWebsite(true)}
        role={role}
        tables={tables}
        orders={orders}
        bookings={bookings}
        onTableStatusChange={handleTableStatusChange}
        kitchenClosed={kitchenClosed}
        onToggleKitchenClosed={handleToggleKitchenClosed}
      />
    ) : activeNav === "Reservations" ? (
      <ReservationsPage
        bookings={bookings}
        onStatusChange={handleBookingStatusChange}
        onCancelBooking={handleCancelBooking}
        onBook={() => handleOpenBooking()}
        kitchenClosed={kitchenClosed}
      />
    ) : activeNav === "Floor plan" ? (
      <FloorPlanPage
        tables={tables}
        bookings={bookings}
        role={role}
        onTableStatusChange={handleTableStatusChange}
        onBookingStatusChange={handleBookingStatusChange}
        onBook={handleOpenBooking}
        onOrder={handleOpenNewOrder}
        onAddTable={handleAddTable}
        onDeleteTable={handleDeleteTable}
        kitchenClosed={kitchenClosed}
      />
    ) : activeNav === "Orders" ? (
      <OrdersPage
        orders={orders}
        onStatusChange={handleStatusChange}
        onOrder={() => handleOpenNewOrder()}
        kitchenClosed={kitchenClosed}
        role={role}
      />
    ) : activeNav === "Kitchen" ? (
      <KitchenPage
        orders={orders}
        menuItems={menuItems}
        onMenuItemsChange={setMenuItems}
        onStatusChange={handleStatusChange}
        soldOutItems={soldOutItems}
        setSoldOutItems={setSoldOutItems}
        kitchenClosed={kitchenClosed}
        onToggleKitchenClosed={handleToggleKitchenClosed}
        role={role}
      />
    ) : activeNav === "Menu" ? (
      <MenuPage
        menuItems={menuItems}
        onMenuItemsChange={setMenuItems}
        soldOutItems={soldOutItems}
        setSoldOutItems={setSoldOutItems}
        canManage={role === "Manager"}
      />
    ) : activeNav === "Inventory" ? (
      <InventoryPage />
    ) : activeNav === "Billing" ? (
      <BillingPage />
    ) : (
      <TeamPage />
    );
  return (
    <div className="paper-grid min-h-screen lg:flex">
      <aside className="flex w-full flex-col border-b border-[#dfe1dc] bg-[#fbfaf7] lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
              <ChefHat size={21} />
            </div>
            <div>
              <p className="display-font text-lg font-bold text-[#24312e]">
                Table & Thyme
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#84908a]">
                Restaurant OS
              </p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 text-[#68736e] lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon size={21} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:px-3 lg:py-3">
          {visibleNavGroups.map((group) => (
            <div key={group.title} className="lg:mb-6">
              <p className="hidden px-4 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#a1aaa4] lg:block">
                {group.title}
              </p>
              {group.items.map(({ label, icon: NavIcon }) => (
                <button
                  key={label}
                  onClick={() => setActiveNav(label)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeNav === label ? "bg-[#e6eee5] text-[#315a3d]" : "text-[#74807a] hover:bg-[#f0f1ed]"}`}
                >
                  <NavIcon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-[#e4e5df] p-4 lg:block">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#74807a] hover:bg-[#f0f1ed]">
            <Settings2 size={18} />
            Settings
          </button>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f0f1ed] p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5c7a6] text-xs font-bold text-[#684f37]">
              AR
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#24312e]">
                Aarav Rao
              </p>
              <p className="text-[11px] text-[#84908a]">{role}</p>
            </div>
            <ChevronDown className="ml-auto text-[#84908a]" size={15} />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="mb-8 flex items-center justify-between border-b border-[#e4e5df] pb-5">
          <div className="flex items-center gap-3 text-xs font-semibold text-[#84908a]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f1e8] text-[#3b724c]">
              <UserRound size={16} />
            </div>
            <span>
              Downtown branch <span className="mx-1 text-[#c0c5c1]">/</span>{" "}
              {activeNav}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {kitchenClosed && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
                <AlertTriangle size={14} />
                Kitchen Closed
              </div>
            )}
            <button
              className="relative rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 text-[#68736e]"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b7623d]" />
            </button>
            {(role === "Server" || role === "Manager") && (
              <>
                <button
                  disabled={kitchenClosed}
                  className={`hidden items-center gap-2 rounded-xl border border-[#dfe1dc] px-3 py-2.5 text-xs font-bold sm:flex transition ${
                    kitchenClosed
                      ? "opacity-50 cursor-not-allowed text-[#84908a] bg-[#f0f1ed]"
                      : "text-[#315a3d] hover:bg-white"
                  }`}
                  onClick={() => handleOpenBooking()}
                  title={kitchenClosed ? "Kitchen is closed. Cannot book tables." : undefined}
                >
                  <CalendarCheck size={16} />
                  Book table
                </button>
                <button
                  disabled={kitchenClosed}
                  className={`hidden items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-white sm:flex transition ${
                    kitchenClosed
                      ? "opacity-50 cursor-not-allowed bg-[#74807a]"
                      : "bg-[#24312e] hover:bg-[#315a3d]"
                  }`}
                  onClick={() => handleOpenNewOrder()}
                  title={kitchenClosed ? "Kitchen is closed. Cannot place new orders." : undefined}
                >
                  <Plus size={16} />
                  New order
                </button>
              </>
            )}
            <button
              onClick={() => setRole(null)}
              className="hidden items-center gap-2 rounded-xl border border-[#dfe1dc] px-3 py-2.5 text-xs font-bold text-[#68736e] sm:flex hover:bg-white"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>
        {kitchenClosed && (
          <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-bold">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-900">
                    Kitchen is Closed — Intake Suspended
                  </h3>
                  <p className="text-xs text-red-700">
                    New orders and table bookings are disabled restaurant-wide until the kitchen is reopened.
                  </p>
                </div>
              </div>
              {(role === "Kitchen" || role === "Manager") && (
                <button
                  onClick={handleToggleKitchenClosed}
                  className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-sm"
                >
                  <ChefHat size={15} />
                  Reopen Kitchen
                </button>
              )}
            </div>
          </div>
        )}
        {page}
      </main>
      {showBooking && (
        <BookingModal
          tables={tables}
          initialTableId={selectedTableForBooking}
          kitchenClosed={kitchenClosed}
          onBookingCreated={handleBookingCreated}
          onClose={() => {
            setShowBooking(false);
            setSelectedTableForBooking(undefined);
          }}
        />
      )}
      {showNewOrder && (
        <NewOrderModal
          tables={tables}
          menuItems={menuItems}
          soldOutItems={soldOutItems}
          initialTableId={selectedTableForOrder}
          kitchenClosed={kitchenClosed}
          role={role || undefined}
          onOrderCreated={handleOrderCreated}
          onClose={() => {
            setShowNewOrder(false);
            setSelectedTableForOrder(undefined);
          }}
        />
      )}
    </div>
  );
}
