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
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Calendar,
  Globe2,
  LayoutDashboard,
  Menu as MenuIcon,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Minus,
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
  MapPin,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Coffee,
  Send,
  Navigation,
  Mail,
  Phone,
  Copy,
  Percent,
  Printer,
  Receipt,
  Banknote,
  History,
  Tag,
  Split,
  ArrowLeft,
  ArrowRight,
  XCircle,
  ShieldAlert,
} from "lucide-react";

import PublicWebsite from "./components/PublicWebsite";
import TableOrderPage from "./components/TableOrderPage";
import WebsiteCmsPage from "./manager/WebsiteCmsPage";
import { BlogPostPage } from "./components/BlogPostPage";

export type AppRoute =
  | "landing"
  | "dashboard"
  | "employee"
  | "orderfromtable"
  | "blog";

export function getRouteFromPath(pathname: string): AppRoute {
  const clean = (pathname || "").toLowerCase().replace(/\/+$/, "") || "/";
  if (clean === "/dashboard" || clean.startsWith("/dashboard/")) {
    return "dashboard";
  }
  if (
    clean === "/employe" ||
    clean === "/employee" ||
    clean.startsWith("/employe/") ||
    clean.startsWith("/employee/")
  ) {
    return "employee";
  }
  if (clean === "/orderfromtable" || clean.startsWith("/orderfromtable/")) {
    return "orderfromtable";
  }
  if (
    clean === "/blog" ||
    clean.startsWith("/blog/") ||
    clean === "/blogs" ||
    clean.startsWith("/blogs/") ||
    clean === "/story" ||
    clean.startsWith("/story/") ||
    clean === "/stories" ||
    clean.startsWith("/stories/")
  ) {
    return "blog";
  }
  return "landing";
}
import { ToastContainer, type ToastItem } from "./components/Toast";
import { fetchTransactions, recordTransaction } from "./api/transactions";
import type { TransactionRecord } from "./types";
import { fetchOverviewMetrics, type OverviewData } from "./api/overview";

export function formatMoney(
  amount: number | string,
  symbol: string = "₹",
): string {
  if (typeof amount === "number") {
    return `${symbol}${amount.toLocaleString()}`;
  }
  const str = String(amount);
  const clean = str.replace(/^[^\d.-]+/, "").trim();
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    return `${symbol}${num.toLocaleString()}`;
  }
  return `${symbol}${amount}`;
}
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
import {
  createOrder,
  fetchOrders,
  updateOrderStatus,
  updateOrder,
} from "./api/orders";
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
import EmployeePortal from "./EmployeePortal";
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  loginWebStaff,
  updateActiveOperators,
  fetchRestaurantSettings,
  updateRestaurantSettings,
  clockInStaff,
  clockOutStaff,
  fetchLeaves,
  updateLeaveStatus,
  fetchAnnouncements,
  createAnnouncement,
  fetchDepartments,
  createDepartment,
  deleteDepartment,
  fetchStaffAttendanceHistory,
  type StaffMember,
  type RestaurantSettings,
  type LeaveRequest,
  type Announcement,
  type AttendanceRecord,
  type StaffAttendanceResponse,
} from "./api/team";
import { setDocumentFavicon } from "./utils/favicon";
import SettingsPage, {
  type StationDisplayPreferences,
  type StoreSettings,
} from "./components/SettingsPage";
import NotificationCenterModal from "./components/NotificationCenterModal";
import TransactionsPage from "./components/TransactionsPage";
import InventoryPage from "./components/InventoryPage";

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
      { label: "Transactions", icon: Receipt },
      { label: "Employees", icon: Users },
      { label: "Dashboard access", icon: ShieldCheck },
      { label: "Website CMS", icon: Globe2 },
      { label: "Settings", icon: Settings2 },
    ],
  },
];

const roleNavGroups: Record<StaffRole, Page[]> = {
  Server: serverPages,
  Kitchen: kitchenPages,
  Manager: managerPages,
};

function getNavGroups(role: StaffRole) {
  const allowedPages = roleNavGroups[role];

  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(({ label }) => allowedPages.includes(label)),
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
    total: "1842",
    status: "Queued",
  },
  {
    id: "#1047",
    customer: "Arjun Mehta",
    table: "Table 14",
    items: "4 items",
    itemList: ["Charred paneer tikka", "Truffle mushroom bao", "2 lime sodas"],
    total: "3640",
    status: "Ready",
  },
  {
    id: "#1046",
    customer: "Takeaway · Neha Joshi",
    table: "Takeaway",
    items: "1 item",
    itemList: ["Burnt basque cheesecake"],
    total: "760",
    status: "Served",
  },
  {
    id: "#1045",
    customer: "Kabir and friends",
    table: "Table 03",
    items: "3 items",
    itemList: ["Citrus spritz", "Wild mushroom risotto", "Still water"],
    total: "2250",
    status: "Preparing",
  },
];
const initialTables: RestaurantTable[] = [
  {
    id: "T01",
    seats: 2,
    zone: "Window",
    status: "Available",
    serverName: "Priya S.",
  },
  {
    id: "T02",
    seats: 4,
    zone: "Family",
    status: "Occupied",
    serverName: "Aarav R.",
  },
  {
    id: "T03",
    seats: 4,
    zone: "Family",
    status: "Needs cleaning",
    serverName: "Aarav R.",
  },
  {
    id: "T04",
    seats: 6,
    zone: "Garden",
    status: "Available",
    serverName: "Vikram K.",
  },
  {
    id: "T05",
    seats: 2,
    zone: "Window",
    status: "Booked",
    serverName: "Priya S.",
  },
  {
    id: "T06",
    seats: 8,
    zone: "Family",
    status: "Occupied",
    serverName: "Aarav R.",
  },
  {
    id: "T07",
    seats: 4,
    zone: "Garden",
    status: "Available",
    serverName: "Vikram K.",
  },
  {
    id: "T08",
    seats: 6,
    zone: "Smoking",
    status: "Occupied",
    serverName: "Priya S.",
  },
  {
    id: "T09",
    seats: 2,
    zone: "Window",
    status: "Available",
    serverName: "Priya S.",
  },
  {
    id: "T10",
    seats: 4,
    zone: "Family",
    status: "Booked",
    serverName: "Aarav R.",
  },
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
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    description:
      "Steamed bao filled with roasted wild mushrooms and truffle aioli.",
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
    image:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
    description:
      "Cottage cheese cubes marinated in Kashmiri chili and mustard oil, roasted over charcoal.",
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
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    description:
      "Wok-tossed lotus stem glazed in hot honey, garlic chili oil, and toasted sesame.",
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
    image:
      "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    description:
      "Tender hand-minced lamb skewers perfumed with smoked cloves, mace, and mint chutney.",
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
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    description:
      "Golden crisp butterflied prawns tossed in sriracha tobanjan glaze and scallions.",
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
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
    description:
      "Smoked chicken tikka in silky slow-reduced tomato gravy balanced with fresh citrus zest and fenugreek.",
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
    image:
      "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80",
    description:
      "Creamy aged carnaroli rice with wild porcini, parmesan crisp, and white truffle oil.",
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
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    description:
      "Black lentils simmered overnight over clay oven embers with churned white butter.",
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
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
    description:
      "Crispy skin Atlantic salmon over sweet edamame puree, grilled asparagus, and lemon butter.",
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
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    description:
      "Fragrant aged basmati rice dum-cooked with tender spiced chicken, saffron, and browned onions.",
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
    image:
      "https://images.unsplash.com/photo-1587740896339-96a76170508d?auto=format&fit=crop&w=800&q=80",
    description:
      "Handmade pasta pillows filled with whipped ricotta and baby spinach in sage brown butter.",
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
    image:
      "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    description:
      "Blistered clay-oven flatbread brushed with roasted garlic butter and fresh cilantro.",
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
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    description:
      "Skin-on hand-cut potatoes tossed in aromatic white truffle oil, shaved parmesan, and rosemary.",
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
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    description:
      "Multi-layered flaky whole wheat bread cooked golden brown in tandoor with ghee.",
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
    image:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
    description:
      "Silky baked cheesecake with a deeply caramelized top, Madagascar vanilla, and berry coulis.",
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
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    description:
      "Warm chocolate cake with molten ganache center made with 70% dark chocolate and vanilla bean gelato.",
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
    image:
      "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=800&q=80",
    description:
      "Traditional slow-churned Indian ice cream infused with saffron strands, crushed pistachios, and green cardamom.",
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
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    description:
      "Handcrafted spritz of blood orange, fresh yuzu, elderflower tonic, and bruised thyme sprig.",
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
    image:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    description:
      "Hand-muddled Persian limes, fresh mint leaves, rock salt, and chilled sparkling soda.",
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
    image:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    description:
      "18-hour cold steeped Arabica single-origin coffee poured over botanical tonic and orange peel.",
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
  const tone =
    status === "Notified"
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
              : ["Needs cleaning", "No show", "Low stock", "On break"].includes(
                    status,
                  )
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
    <div className="mb-5 sm:mb-7 flex flex-col justify-between gap-3 sm:gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 sm:mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#b7623d]">
            {eyebrow}
          </p>
        )}
        <h1 className="display-font text-2xl font-bold tracking-tight text-[#24312e] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#84908a]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {action}
        </div>
      )}
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
    <article className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-3.5 sm:p-5 shadow-[0_3px_12px_rgba(36,49,46,.025)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-[#84908a] truncate">
            {label}
          </p>
          <p className="mt-1 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-[#24312e] truncate">
            {value}
          </p>
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${color}`}>
          <StatIcon size={19} className="sm:w-[21px] sm:h-[21px]" />
        </div>
      </div>
      <p className="mt-2.5 sm:mt-4 text-[11px] sm:text-xs font-bold text-[#3b724c] truncate">
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
  onNavigate,
  role,
  tables,
  orders,
  bookings,
  onTableStatusChange,
  kitchenClosed,
  onToggleKitchenClosed,
  userName,
  currencySymbol = "₹",
}: {
  onBook: (tableId?: string) => void;
  onOrder: (tableId?: string) => void;
  onWebsite: () => void;
  onNavigate?: (page: Page) => void;
  role: StaffRole;
  tables: RestaurantTable[];
  orders: Order[];
  bookings: TableBooking[];
  onTableStatusChange: (id: string, status: TableStatus) => void;
  kitchenClosed?: boolean;
  onToggleKitchenClosed?: () => void;
  userName?: string;
  currencySymbol?: string;
}) {
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewData | null>(
    null,
  );

  useEffect(() => {
    fetchOverviewMetrics()
      .then((data) => setOverviewMetrics(data))
      .catch((err) => console.error("Failed to load overview metrics:", err));
  }, [orders, tables, bookings]);

  // Dynamic Occupied count from live state / API
  const occupiedCount = tables.filter((t) => t.status === "Occupied").length;
  const totalTables = tables.length || overviewMetrics?.tables?.total || 1;
  const activeOrdersCount = orders.filter(
    (o) =>
      o.status !== "Served" && o.status !== "Paid" && o.status !== "Cancelled",
  ).length;

  // Dynamic Revenue calculation (strictly today's revenue from API, resets to 0 at midnight)
  const todayRevenue = overviewMetrics?.revenue
    ? overviewMetrics.revenue.today
    : 0;

  // Dynamic greeting & date
  const now = new Date();
  const currentHour = now.getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
        ? "Good afternoon"
        : "Good evening";
  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Weekly chart breakdown from database
  const defaultWeeklyChart = [
    { day: "Mon", heightPercent: 4, revenue: 0, orderCount: 0, isToday: false },
    { day: "Tue", heightPercent: 4, revenue: 0, orderCount: 0, isToday: false },
    { day: "Wed", heightPercent: 4, revenue: 0, orderCount: 0, isToday: false },
    { day: "Thu", heightPercent: 4, revenue: 0, orderCount: 0, isToday: false },
    { day: "Fri", heightPercent: 4, revenue: 0, orderCount: 0, isToday: false },
    { day: "Sat", heightPercent: 4, revenue: 0, orderCount: 0, isToday: false },
    { day: "Sun", heightPercent: 4, revenue: 0, orderCount: 0, isToday: true },
  ];
  const weeklyChartData = overviewMetrics?.weeklyChart?.length
    ? overviewMetrics.weeklyChart
    : defaultWeeklyChart;

  const pacingPercent = overviewMetrics?.revenue?.pacingPercent ?? 0;

  return (
    <>
      <SectionHeading
        eyebrow={formattedDate}
        title={`${greeting}, ${userName ? userName.split(" ")[0] : "Priya"}.`}
        description="Here’s what’s happening at your restaurant today."
        action={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.open("/", "_blank")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-[#24312e] hover:bg-white transition cursor-pointer"
            >
              <Globe2 size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Website</span>
            </button>
            <button
              onClick={() => onBook()}
              disabled={kitchenClosed}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-[#dfe1dc] px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                kitchenClosed
                  ? "bg-[#f0f1ed] text-[#84908a] opacity-50 cursor-not-allowed"
                  : "bg-[#fbfaf7] text-[#315a3d] hover:bg-white"
              }`}
              title={
                kitchenClosed
                  ? "Kitchen is closed. Cannot book tables."
                  : undefined
              }
            >
              <CalendarCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Book table</span>
            </button>
            <button
              onClick={() => onOrder()}
              disabled={kitchenClosed}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-white transition cursor-pointer ${
                kitchenClosed
                  ? "bg-[#74807a] opacity-50 cursor-not-allowed"
                  : "bg-[#24312e] hover:bg-[#315a3d]"
              }`}
              title={
                kitchenClosed
                  ? "Kitchen is closed. Cannot place new orders."
                  : undefined
              }
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>New order</span>
            </button>
          </div>
        }
      />
      <section
        className={`grid gap-3 sm:gap-4 ${role === "Server" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}`}
      >
        {/* Hide Today's earning in Server panel */}
        {role !== "Server" && (
          <StatCard
            label="Today's revenue"
            value={formatMoney(Math.round(todayRevenue), currencySymbol)}
            change={`${pacingPercent >= 0 ? "+" : ""}${pacingPercent}% vs avg`}
            icon={CircleDollarSign}
            color="bg-[#e8f1e8] text-[#3b724c]"
          />
        )}
        <StatCard
          label="Active orders"
          value={String(activeOrdersCount || orders.length)}
          change={`${activeOrdersCount} in service`}
          icon={ShoppingBag}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Tables occupied"
          value={`${occupiedCount} / ${totalTables}`}
          change={`${Math.round((occupiedCount / totalTables) * 100)}% capacity`}
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
      <section
        className={`mt-8 grid gap-6 ${role === "Server" ? "" : "xl:grid-cols-[1.35fr_1fr]"}`}
      >
        {/* Hide Revenue overview chart in Server panel */}
        {role !== "Server" && (
          <article className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6 shadow-xs">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="display-font text-xl font-bold text-[#24312e]">
                  Revenue overview
                </h2>
                <p className="mt-1 text-xs text-[#84908a]">
                  Real order revenue across the last 7 days
                </p>
              </div>
              <span className="rounded-lg border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs font-bold text-[#68736e]">
                Past 7 Days
              </span>
            </div>
            <div className="flex h-48 items-end gap-2 sm:gap-4">
              {weeklyChartData.map((item: any) => (
                <div
                  key={item.day}
                  className="group relative flex flex-1 flex-col items-center gap-2"
                  title={`${item.day}: ${formatMoney(Number(item.revenue || 0), currencySymbol)} (${item.orderCount || 0} orders)`}
                >
                  {/* Real data tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 z-20 hidden whitespace-nowrap rounded-md bg-[#24312e] px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block transition-all">
                    {formatMoney(Number(item.revenue || 0), currencySymbol)} •{" "}
                    {item.orderCount || 0} orders
                  </div>
                  <div
                    className={`w-full max-w-12 rounded-t-lg transition-all duration-300 ${
                      item.isToday
                        ? "bg-[#b7623d]"
                        : Number(item.revenue || 0) > 0
                          ? "bg-[#729e7b]"
                          : "bg-[#d8ded6]"
                    }`}
                    style={{ height: `${item.heightPercent}%` }}
                  />
                  <span className="text-[11px] font-semibold text-[#84908a]">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-[#e9eae6] pt-4 text-xs text-[#84908a]">
              <span className="h-2 w-2 rounded-full bg-[#b7623d]" />
              Today is pacing{" "}
              <strong className="text-[#3b724c]">
                {pacingPercent >= 0
                  ? `+${pacingPercent}% ahead`
                  : `${pacingPercent}% behind`}
              </strong>{" "}
              of your daily average
            </div>
          </article>
        )}
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
              {
                label: "Floor plan",
                Icon: Table2,
                action: () => onNavigate?.("Floor plan"),
              },
              {
                label: "Add menu item",
                Icon: Plus,
                action: () => onNavigate?.("Menu"),
              },
              {
                label: "Staff schedule",
                Icon: CalendarDays,
                action: () => onNavigate?.("Employees"),
              },
              {
                label: "View reports",
                Icon: FileText,
                action: () => onNavigate?.("Transactions"),
              },
            ].map(({ label, Icon, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[#41504a] bg-[#30403a] p-4 text-left transition hover:border-[#f4bc83] hover:bg-[#394a43] cursor-pointer"
              >
                <Icon size={19} className="text-[#f4bc83]" />
                <span className="text-xs font-bold">{label}</span>
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
                    {formatMoney(order.total, currencySymbol)}
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
  currencySymbol = "₹",
  defaultDeposit = 500,
}: {
  bookings: TableBooking[];
  onStatusChange: (id: string, status: BookingStatus) => void;
  onCancelBooking: (id: string) => void;
  onBook: () => void;
  kitchenClosed?: boolean;
  currencySymbol?: string;
  defaultDeposit?: number;
}) {
  const totalGuests = bookings.reduce((sum, b) => sum + (b.guests || 0), 0);
  const totalDeposit = bookings.reduce(
    (sum, b) =>
      sum + (typeof b.deposit === "number" ? b.deposit : defaultDeposit),
    0,
  );

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<
    "Active" | "All" | "Completed" | "Cancelled"
  >("Active");
  const [sortOrder, setSortOrder] = useState<
    "newest" | "date_asc" | "date_desc"
  >("newest");
  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  const activeBookingsCount = bookings.filter(
    (b) =>
      b.status === "Booked" || b.status === "Arrived" || b.status === "Seated",
  ).length;
  const completedBookingsCount = bookings.filter(
    (b) => b.status === "Completed",
  ).length;
  const cancelledBookingsCount = bookings.filter(
    (b) => b.status === "Cancelled" || b.status === "No show",
  ).length;

  const displayedBookings = [...bookings]
    .filter((b) => {
      if (filterTab === "Active")
        return (
          b.status === "Booked" ||
          b.status === "Arrived" ||
          b.status === "Seated"
        );
      if (filterTab === "Completed") return b.status === "Completed";
      if (filterTab === "Cancelled")
        return b.status === "Cancelled" || b.status === "No show";
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return (b.id || "").localeCompare(a.id || "");
      }
      if (sortOrder === "date_asc") {
        return (
          (a.bookingDate || "") +
          " " +
          (a.bookingTime || "")
        ).localeCompare((b.bookingDate || "") + " " + (b.bookingTime || ""));
      }
      if (sortOrder === "date_desc") {
        return (
          (b.bookingDate || "") +
          " " +
          (b.bookingTime || "")
        ).localeCompare((a.bookingDate || "") + " " + (a.bookingTime || ""));
      }
      return 0;
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
            title={
              kitchenClosed
                ? "Kitchen is closed - new reservations disabled"
                : "New reservation"
            }
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
            <strong>Kitchen is currently closed.</strong> New table reservations
            are disabled until the kitchen reopens.
          </span>
        </div>
      )}
      <div className="mb-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
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
          value={`${currencySymbol || "₹"}${totalDeposit.toLocaleString("en-IN")}`}
          change={`${bookings.length} reservations`}
          icon={CreditCard}
          color="bg-[#eee8f6] text-[#72558e]"
        />
      </div>
      <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-3.5 sm:p-6">
        <div className="mb-4 sm:mb-5 flex items-center justify-between">
          <div>
            <h2 className="display-font text-lg sm:text-xl font-bold">
              Reservations Management
            </h2>
            <p className="mt-0.5 text-xs text-[#84908a]">
              Live table booking & arrival management
            </p>
          </div>
          <button
            onClick={onBook}
            className="rounded-lg border border-[#dfe1dc] px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-[#315a3d] hover:bg-white cursor-pointer shrink-0"
          >
            + Quick book
          </button>
        </div>

        {/* Status Filter Tabs & Sort Controls */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#e9eae6] pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 max-w-full">
            {[
              {
                id: "Active",
                label: "Active Bookings",
                count: activeBookingsCount,
              },
              { id: "All", label: "All Reservations", count: bookings.length },
              {
                id: "Completed",
                label: "Completed",
                count: completedBookingsCount,
              },
              {
                id: "Cancelled",
                label: "Cancelled",
                count: cancelledBookingsCount,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                  filterTab === tab.id
                    ? "bg-[#24312e] text-white shadow-xs"
                    : "bg-white text-[#68736e] border border-[#e0e2dc] hover:bg-[#f3f4f0]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    filterTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-[#f0f1ec] text-[#68736e]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#84908a]">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs font-bold text-[#24312e] outline-hidden focus:border-[#24312e] cursor-pointer shadow-2xs"
            >
              <option value="newest">🕒 Newest Booked First (Default)</option>
              <option value="date_asc">📅 Booking Date (Soonest First)</option>
              <option value="date_desc">
                📅 Booking Date (Furthest First)
              </option>
            </select>
          </div>
        </div>

        {displayedBookings.length === 0 ? (
          <div className="py-12 text-center text-[#84908a]">
            <CalendarCheck size={36} className="mx-auto text-[#cbd5e1] mb-2" />
            <p className="font-bold text-sm text-[#24312e]">
              No {filterTab.toLowerCase()} reservations
            </p>
            <p className="text-xs mt-1">
              Bookings will appear here as guests reserve tables.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-3 rounded-xl border border-[#eef0eb] bg-white p-4 sm:grid-cols-[1.4fr_1fr_.7fr_.8fr_1fr] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[#24312e]">
                      {booking.customer}
                    </p>
                    {(booking.payuPaymentId ||
                      booking.paymentId ||
                      booking.stripePaymentId) && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800"
                        title={`PayU Reference: ${booking.payuPaymentId || booking.paymentId || booking.stripePaymentId}`}
                      >
                        <CreditCard size={11} className="text-emerald-600" />
                        PayU Paid
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#84908a]">
                    Deposit {currencySymbol || "₹"}
                    {booking.deposit ?? defaultDeposit} • {booking.source}
                    {booking.specialRequests
                      ? ` • "${booking.specialRequests}"`
                      : ""}
                  </p>
                  {(booking.phone || booking.email) && (
                    <p className="mt-0.5 text-[11px] text-[#84908a] flex flex-wrap items-center gap-2">
                      {booking.phone && <span>📞 {booking.phone}</span>}
                      {booking.email && <span>✉️ {booking.email}</span>}
                    </p>
                  )}
                </div>
                <div className="text-sm text-[#68736e] flex flex-col sm:flex-row sm:items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold w-fit ${
                      booking.bookingDate === todayStr
                        ? "bg-[#e8f1e8] text-[#3b724c]"
                        : "bg-[#f0f1ec] text-[#68736e]"
                    }`}
                  >
                    <CalendarCheck size={11} />
                    {booking.bookingDate === todayStr
                      ? "Today"
                      : booking.bookingDate}
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
      (b.status === "Booked" ||
        b.status === "Arrived" ||
        b.status === "Seated"),
  );
  if (activeBookings.length === 0) return null;

  const nowMs = now.getTime();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const parsed = activeBookings.map((b) => {
    const bookingDateStr = b.bookingDate
      ? b.bookingDate.slice(0, 10)
      : todayStr;
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
        : new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hours,
            minutes,
            0,
            0,
          );

    const diffMinutes = Math.round(
      (scheduledDate.getTime() - nowMs) / (60 * 1000),
    );
    return { booking: b, diffMinutes, hours, minutes, scheduledDate };
  });

  // Sort priorities:
  // 1. Arrived or Seated bookings first
  // 2. Active dining window (-180 to +30 min)
  // 3. Upcoming (>30 min)
  parsed.sort((a, b) => {
    const aPriority =
      a.booking.status === "Arrived" || a.booking.status === "Seated";
    const bPriority =
      b.booking.status === "Arrived" || b.booking.status === "Seated";
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
  const endTimeDisplay = formatTime12h(
    endDate.getHours(),
    endDate.getMinutes(),
  );
  const availableTillDate = new Date(scheduledDate.getTime() - 30 * 60 * 1000);
  const availableTillDisplay = formatTime12h(
    availableTillDate.getHours(),
    availableTillDate.getMinutes(),
  );
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

  const zones = [
    "Main floor",
    "Window",
    "Family",
    "Garden",
    "Bar",
    "Terrace",
    "Private dining",
  ];
  const servers = [
    "Priya S.",
    "Aarav R.",
    "Vikram K.",
    "Ananya P.",
    "Rahul M.",
  ];

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
              <p className="text-xs text-[#aab8b0]">
                Persists directly to database floor layout
              </p>
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
            <label className="mb-1 block font-bold text-[#dfe1dc]">
              Table Number / ID
            </label>
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
            <label className="mb-1 block font-bold text-[#dfe1dc]">
              Seating Capacity
            </label>
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
            <label className="mb-1 block font-bold text-[#dfe1dc]">
              Dining Zone
            </label>
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
            <label className="mb-1 block font-bold text-[#dfe1dc]">
              Assigned Server
            </label>
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
            <label className="mb-1 block font-bold text-[#dfe1dc]">
              Initial Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Available", "Booked", "Occupied"] as TableStatus[]).map(
                (st) => (
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
                ),
              )}
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
            <h3 className="text-base font-bold text-white">
              Delete Table {table.id}?
            </h3>
            <p className="text-xs text-[#aab8b0]">
              This table will be removed from floor plan.
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#cbd5e1] leading-relaxed">
          Table <strong className="text-white">{table.id}</strong> (
          {table.seats} seats, {table.zone}) will be removed. Any existing
          booking records will remain preserved with unassigned seating.
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
  isDemoAccount = false,
  onDemoAction,
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
  isDemoAccount?: boolean;
  onDemoAction?: (action: string) => void;
}) {
  const [selectedTableId, setSelectedTableId] = useState(
    tables[0]?.id || "T01",
  );
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Available" | "Booked" | "Occupied" | "Needs cleaning"
  >("All");
  const [selectedZone, setSelectedZone] = useState<string>("All zones");
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(
    null,
  );

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

  const selectedUpcoming = selected
    ? getUpcomingBookingForTable(selected.id, bookings)
    : null;
  const selectedEffective = selected
    ? getEffectiveStatus(selected)
    : "Available";

  return (
    <>
      <SectionHeading
        eyebrow="Live floor"
        title="Floor plan"
        description="Real-time table seating, automated reservation alerts, and floor layout management."
        action={
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {role === "Manager" && onAddTable && (
              <button
                onClick={() => {
                  if (isDemoAccount) {
                    onDemoAction?.("Adding tables");
                    return;
                  }
                  setShowAddModal(true);
                }}
                aria-disabled={isDemoAccount}
                title={
                  isDemoAccount
                    ? "This feature is disabled for the demo account"
                    : "Add table"
                }
                className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition ${
                  isDemoAccount
                    ? "cursor-not-allowed bg-[#84908a] opacity-60"
                    : "cursor-pointer bg-[#315a3d] hover:bg-[#254630]"
                }`}
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                Add table
              </button>
            )}
            <button
              onClick={() => onBook(selected?.id)}
              disabled={kitchenClosed}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                kitchenClosed
                  ? "border-[#dfe1dc] bg-[#e2e4dd] text-[#84908a] cursor-not-allowed opacity-60"
                  : "border-[#dfe1dc] bg-[#fbfaf7] text-[#315a3d] hover:bg-white"
              }`}
              title={
                kitchenClosed
                  ? "Kitchen is closed - table booking disabled"
                  : "Book table"
              }
            >
              <CalendarCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
              {kitchenClosed ? "Kitchen Closed" : "Book table"}
            </button>
            <button
              onClick={() => onOrder(selected?.id)}
              disabled={kitchenClosed}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                kitchenClosed
                  ? "bg-[#e2e4dd] text-[#84908a] cursor-not-allowed opacity-60"
                  : "bg-[#24312e] text-white hover:bg-[#315a3d]"
              }`}
              title={
                kitchenClosed
                  ? "Kitchen is closed - new orders disabled"
                  : "New order"
              }
            >
              <Utensils size={16} className="sm:w-[18px] sm:h-[18px]" />
              {kitchenClosed ? "Kitchen Closed" : "New order"}
            </button>
          </div>
        }
      />

      {kitchenClosed && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24] shadow-xs">
          <AlertTriangle size={16} className="shrink-0 text-[#721c24]" />
          <span>
            <strong>Kitchen is currently closed.</strong> Table bookings and
            dining orders are disabled until the kitchen reopens.
          </span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          {(
            [
              { id: "All", label: "All", count: tables.length },
              {
                id: "Available",
                label: "Available",
                count: tables.filter(
                  (t) => getEffectiveStatus(t) === "Available",
                ).length,
              },
              {
                id: "Booked",
                label: "Booked",
                count: tables.filter((t) => getEffectiveStatus(t) === "Booked")
                  .length,
              },
              {
                id: "Occupied",
                label: "Occupied",
                count: tables.filter(
                  (t) => getEffectiveStatus(t) === "Occupied",
                ).length,
              },
              {
                id: "Needs cleaning",
                label: "Needs cleaning",
                count: tables.filter(
                  (t) => getEffectiveStatus(t) === "Needs cleaning",
                ).length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#24312e] text-white shadow-sm"
                  : "bg-white text-[#68736e] border border-[#e0e2dc] hover:bg-[#f3f4f0]"
              }`}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-[#f0f1ec] text-[#68736e]"
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
              className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs font-bold text-[#24312e] focus:outline-none focus:ring-2 focus:ring-[#315a3d] cursor-pointer"
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
        <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-3.5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e9eae6] pb-4 text-xs font-semibold text-[#68736e]">
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#9ac49f]" />
                Available (
                {
                  tables.filter((t) => getEffectiveStatus(t) === "Available")
                    .length
                }
                )
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#e5bd7e]" />
                Booked (
                {
                  tables.filter((t) => getEffectiveStatus(t) === "Booked")
                    .length
                }
                )
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#d98865]" />
                Occupied (
                {
                  tables.filter((t) => getEffectiveStatus(t) === "Occupied")
                    .length
                }
                )
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <i className="h-2.5 w-2.5 rounded-full bg-[#aab1ac]" />
                Needs cleaning (
                {
                  tables.filter(
                    (t) => getEffectiveStatus(t) === "Needs cleaning",
                  ).length
                }
                )
              </span>
            </div>
            <span className="text-[11px] text-[#84908a]">
              Showing {filteredTables.length} of {tables.length} tables
            </span>
          </div>

          {filteredTables.length === 0 ? (
            <div className="py-16 text-center text-[#84908a]">
              <Table2 size={40} className="mx-auto text-[#cbd5e1] mb-2" />
              <p className="font-bold text-sm text-[#24312e]">
                No tables match this filter
              </p>
              <p className="text-xs mt-1">
                Try selecting a different status tab or zone.
              </p>
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
                      selected?.id === table.id
                        ? "ring-2 ring-[#24312e] ring-offset-2"
                        : ""
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
                        {upcoming.isArrived ? "Arrived: " : "Dining: "}
                        {upcoming.booking.customer}
                      </span>
                    )}

                    <div
                      className={
                        effective === "Booked" ||
                        (effective === "Occupied" && upcoming)
                          ? "mt-4 flex flex-col items-center"
                          : "flex flex-col items-center"
                      }
                    >
                      <Table2 size={27} />
                      <strong className="mt-1 text-base font-extrabold tracking-tight">
                        {table.id}
                      </strong>
                      <span className="text-[11px] font-semibold opacity-85">
                        {table.seats} seats • {table.zone}
                      </span>

                      {/* Display booking details */}
                      {upcoming && (
                        <div className="mt-1 flex flex-col items-center text-center">
                          {effective === "Occupied" ? (
                            <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9.5px] font-extrabold text-[#946243] whitespace-nowrap">
                              {upcoming.booking.customer} (
                              {upcoming.startTimeDisplay})
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
                onClick={() => {
                  if (isDemoAccount) {
                    onDemoAction?.("Deleting tables");
                    return;
                  }
                  setTableToDelete(selected);
                }}
                aria-disabled={isDemoAccount}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                  isDemoAccount
                    ? "cursor-not-allowed border-white/10 bg-white/10 text-[#84908a] opacity-60"
                    : "cursor-pointer border-red-500/30 bg-red-950/40 text-red-300 hover:bg-red-900/60"
                }`}
                title={
                  isDemoAccount
                    ? "This feature is disabled for the demo account"
                    : "Delete this table from floor plan"
                }
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="display-font text-3xl font-extrabold text-white">
                {selected?.id || "None"}
              </h2>
              <p className="text-xs text-[#aab8b0]">
                {selected?.zone} • {selected?.seats} seats
              </p>
            </div>
            <QrCode className="text-[#f4bc83]" size={28} />
          </div>

          {/* Dining Active / Customer Arrived Banner */}
          {selectedUpcoming && selectedEffective === "Occupied" && (
            <div className="mt-5 rounded-xl border border-[#d98865]/50 bg-[#3a251e] p-3.5 text-orange-100 shadow-md">
              <div className="flex items-center justify-between text-xs font-bold text-[#f4bc83]">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <Clock3 size={15} className="text-[#f4bc83]" />
                  {selectedUpcoming.isArrived
                    ? "Customer Arrived & Seated"
                    : "Dining Session Active"}{" "}
                  ({selectedUpcoming.startTimeDisplay})
                </span>
                <span className="rounded-md bg-[#d98865]/30 border border-[#d98865]/50 px-2 py-0.5 text-[10px] font-extrabold text-[#f4bc83] whitespace-nowrap">
                  Occupied
                </span>
              </div>
              <p className="mt-1.5 text-xs">
                Guest:{" "}
                <strong className="text-white">
                  {selectedUpcoming.booking.customer}
                </strong>{" "}
                ({selectedUpcoming.booking.guests} guests)
              </p>
              {selectedUpcoming.booking.phone && (
                <p className="text-[11px] text-[#f4bc83]/80">
                  Phone: {selectedUpcoming.booking.phone}
                </p>
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
                  Table booked for{" "}
                  <span className="font-extrabold text-[#f4bc83]">
                    {selectedUpcoming.slotDisplay}
                  </span>
                </p>
                <p className="text-[11px] text-[#cbd5e1]">
                  Guest:{" "}
                  <strong className="text-white">
                    {selectedUpcoming.booking.customer}
                  </strong>{" "}
                  ({selectedUpcoming.booking.guests} guests)
                </p>
                {selectedUpcoming.booking.phone && (
                  <p className="text-[11px] text-[#aab8b0]">
                    Phone: {selectedUpcoming.booking.phone}
                  </p>
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
                      onBookingStatusChange(
                        selectedUpcoming.booking.id,
                        "Arrived",
                      );
                      if (selected)
                        onTableStatusChange(selected.id, "Occupied");
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
                <span
                  className={`font-extrabold uppercase tracking-wide whitespace-nowrap ${
                    selectedEffective === "Occupied"
                      ? "text-[#d98865]"
                      : selectedEffective === "Available"
                        ? "text-[#9ac49f]"
                        : "text-[#f4bc83]"
                  }`}
                >
                  {selectedEffective}
                </span>
              </div>

              {/* Status Pills: 4 core states in 2x2 grid, always on same line */}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {(
                  ["Available", "Occupied", "Booked", "Needs cleaning"] as const
                ).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      if (!selected) return;
                      onTableStatusChange(selected.id, status);
                      if (selectedUpcoming) {
                        if (status === "Occupied")
                          onBookingStatusChange?.(
                            selectedUpcoming.booking.id,
                            "Arrived",
                          );
                        else if (status === "Available")
                          onBookingStatusChange?.(
                            selectedUpcoming.booking.id,
                            "Completed",
                          );
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
                ))}
              </div>
            </div>

            {/* Quick action: Mark Free */}
            {selected && selectedEffective !== "Available" && (
              <button
                onClick={() => {
                  onTableStatusChange(selected.id, "Available");
                  if (selectedUpcoming) {
                    onBookingStatusChange?.(
                      selectedUpcoming.booking.id,
                      "Completed",
                    );
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
                <span className="font-semibold">
                  {selected?.serverName || "Priya S."}
                </span>
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
                title={
                  kitchenClosed
                    ? "Kitchen is closed - cannot take new orders"
                    : "Take order"
                }
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
                title={
                  kitchenClosed
                    ? "Kitchen is closed - cannot book tables"
                    : "Book table"
                }
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
  currencySymbol = "₹",
}: {
  orders: Order[];
  onStatusChange: (
    id: string,
    status: OrderStatus,
    actingRole?: StaffRole,
  ) => void;
  onOrder?: () => void;
  kitchenClosed?: boolean;
  role?: StaffRole;
  currencySymbol?: string;
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
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
              kitchenClosed
                ? "bg-[#e2e4dd] text-[#84908a] cursor-not-allowed opacity-60"
                : "bg-[#24312e] text-white hover:bg-[#315a3d]"
            }`}
            title={
              kitchenClosed
                ? "Kitchen is closed - new orders disabled"
                : "New order"
            }
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            {kitchenClosed ? "Kitchen Closed" : "New order"}
          </button>
        }
      />
      {kitchenClosed && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24] shadow-xs">
          <AlertTriangle size={16} className="shrink-0 text-[#721c24]" />
          <span>
            <strong>Kitchen is currently closed.</strong> New orders are
            disabled until the kitchen reopens. Active tickets can still be
            managed and served.
          </span>
        </div>
      )}
      <div className="mb-5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
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
            className={`rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold shrink-0 whitespace-nowrap transition cursor-pointer ${tab === value ? "bg-[#24312e] text-white shadow-xs" : "border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f2f4ef]"}`}
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
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#ead7c8] bg-[#fff5ed] p-3.5 sm:p-4 text-xs sm:text-sm text-[#946243]">
          <Bell className="shrink-0 text-[#b7623d]" size={18} />
          <span>
            <strong>Service bell:</strong>{" "}
            {orders.filter((order) => order.status === "Notified").length} ready
            order(s) are waiting for server pickup.
          </span>
        </div>
      )}
      <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-3.5 sm:p-6">
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
                            {order.items} •{" "}
                            {formatMoney(order.total, currencySymbol)}
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
                              <Clock3
                                size={13}
                                className="shrink-0 text-[#84908a]"
                              />
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
  onStatusChange: (
    id: string,
    status: OrderStatus,
    actingRole?: StaffRole,
  ) => void;
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
    const isCurrentlySoldOut =
      item.available === false || soldOutItems.includes(item.name);
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
        menuItems.map((i) =>
          i.id === item.id ? { ...i, available: newAvailable } : i,
        ),
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl border px-3 py-2 sm:px-3 sm:py-2.5 text-xs font-bold cursor-pointer transition ${soundOn ? "border-[#cfe0d0] bg-[#e8f1e8] text-[#3b724c]" : "border-[#dfe1dc] bg-white text-[#84908a]"}`}
            >
              <Volume2 size={15} />
              {soundOn ? "Alerts on" : "Alerts off"}
            </button>
            {onToggleKitchenClosed && (
              <button
                onClick={onToggleKitchenClosed}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                  kitchenClosed
                    ? "border-red-500/50 bg-red-950/80 text-red-200 hover:bg-red-900"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f2f3ef]"
                }`}
                title={
                  kitchenClosed
                    ? "Kitchen is closed. Click to reopen."
                    : "Kitchen is open. Click to close."
                }
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
      <div className="mb-6 grid gap-2.5 sm:gap-3 grid-cols-3">
        <div className="rounded-xl border border-[#e0e2dc] bg-[#fbfaf7] p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-[#84908a] truncate">
            Open tickets
          </p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-[#24312e] truncate">
            {active.length}
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-bold text-[#3b724c] truncate">
            Live queue
          </p>
        </div>
        <div className="rounded-xl border border-[#e0e2dc] bg-[#fbfaf7] p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-[#84908a] truncate">
            Average prep
          </p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-[#24312e] truncate">
            14 min
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-bold text-[#b7623d] truncate">
            2 min slower
          </p>
        </div>
        <div className="rounded-xl border border-[#e0e2dc] bg-[#fbfaf7] p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-[#84908a] truncate">
            Sold-out items
          </p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-[#24312e] truncate">
            {soldOutItems.length}
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-bold text-[#b7623d] truncate">
            Hidden from QR
          </p>
        </div>
      </div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          {kitchenStations.map((item) => (
            <button
              key={item}
              onClick={() => setStation(item)}
              className={`rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold shrink-0 whitespace-nowrap transition cursor-pointer ${station === item ? "bg-[#24312e] text-white shadow-xs" : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-white"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#84908a] shrink-0">
          <RefreshCw size={13} />
          Last sync just now
        </div>
      </div>
      {kitchenClosed && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-full bg-red-500 animate-ping" />
            <div>
              <strong className="block font-bold text-red-300">
                Kitchen is closed.
              </strong>
              <span className="text-xs text-red-200/90">
                New order intake and table bookings are halted across the entire
                restaurant. Active tickets can still be prepared and served.
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
              Mark an item unavailable here and it is blocked across all order
              creation and the customer menu.
            </p>
          </div>
          <ChefHat size={21} className="text-[#b7623d]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const soldOut =
              item.available === false || soldOutItems.includes(item.name);
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
                    {soldOut ? "Unavailable (Sold out)" : "Available to order"}
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
  currencySymbol = "₹",
  currentUser,
  showToast,
}: {
  item: ApiMenuItem;
  onClose: () => void;
  onUpdated: (updated: ApiMenuItem) => void;
  currencySymbol?: string;
  currentUser?: any;
  showToast?: any;
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
    isDataUrl ? "" : (item.image ?? ""),
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

    if (currentUser?.isDemoAccount) {
      setError("This feature is disabled for the demo account.");
      showToast?.(
        "error",
        "Access Denied",
        "This feature is disabled for the demo account.",
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
      setError(
        err instanceof Error ? err.message : "Failed to update menu item.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24312e]/40 p-4 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fbfaf7] p-4 sm:p-7 shadow-2xl border border-[#dfe1dc]"
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
            Price ({currencySymbol || "₹"}){" "}
            <span className="text-[#b7623d]">*</span>
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
                  <span className="text-xs text-[#84908a]">
                    Preview of URL image
                  </span>
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
            <span className="font-normal text-[#84908a]">comma separated</span>
            <input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="gluten, dairy"
              className="mt-1.5 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b7623d]"
            />
          </label>
          <label className="text-xs font-bold text-[#68736e]">
            Tags{" "}
            <span className="font-normal text-[#84908a]">comma separated</span>
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
  currentUser,
  showToast,
}: {
  item: ApiMenuItem;
  onClose: () => void;
  onDeleted: (itemId: string) => void;
  currentUser?: any;
  showToast?: any;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (currentUser?.isDemoAccount) {
      setError("This feature is disabled for the demo account.");
      showToast?.(
        "error",
        "Access Denied",
        "This feature is disabled for the demo account.",
      );
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteMenuItem(item.id);
      onDeleted(item.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete menu item.",
      );
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
          Are you sure you want to delete{" "}
          <span className="font-bold text-[#24312e]">"{item.name}"</span>? This
          will permanently remove this dish from the restaurant menu.
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
  currencySymbol = "₹",
  currentUser,
  showToast,
}: {
  menuItems: ApiMenuItem[];
  onMenuItemsChange?: (items: ApiMenuItem[]) => void;
  soldOutItems: string[];
  setSoldOutItems: (items: string[]) => void;
  canManage?: boolean;
  canCreate?: boolean;
  currencySymbol?: string;
  currentUser?: any;
  showToast?: any;
}) {
  const isManager = canManage || canCreate || false;
  const blockDemoAction = (action: string) => {
    if (!currentUser?.isDemoAccount) return false;
    showToast?.(
      "error",
      "Demo access only",
      `${action} is disabled for the demo account.`,
    );
    return true;
  };
  const demoActionClass = currentUser?.isDemoAccount
    ? "cursor-not-allowed opacity-60"
    : "cursor-pointer";
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

    if (currentUser?.isDemoAccount) {
      setError("This feature is disabled for the demo account.");
      showToast?.(
        "error",
        "Access Denied",
        "This feature is disabled for the demo account.",
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
    if (blockDemoAction("Changing menu availability")) return;
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
              onClick={() => {
                if (blockDemoAction("Adding menu items")) return;
                setShowCreate(true);
              }}
              aria-disabled={currentUser?.isDemoAccount}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#24312e] px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-white transition ${demoActionClass} ${
                currentUser?.isDemoAccount ? "" : "hover:bg-[#315a3d]"
              }`}
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Add menu item</span>
            </button>
          ) : undefined
        }
      />
      <div className="mb-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold shrink-0 whitespace-nowrap transition cursor-pointer ${category === item ? "bg-[#24312e] text-white shadow-xs" : "border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f2f4ef]"}`}
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
                  isUnavailable
                    ? "border-red-200/90 bg-red-50/20"
                    : "border-[#e0e2dc]"
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
                        title={
                          item.type === "veg" ? "Vegetarian" : "Non-Vegetarian"
                        }
                      />
                      <p
                        className={`font-bold text-[#24312e] ${isUnavailable ? "line-through text-[#84908a]" : ""}`}
                      >
                        {item.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[#84908a]">
                      {item.category} •{" "}
                      {typeof item.price === "number"
                        ? `${currencySymbol || "₹"}${item.price.toLocaleString("en-IN")}`
                        : item.price}
                    </p>
                  </div>

                  {isManager && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(
                            activeDropdownId === item.id ? null : item.id,
                          );
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
                              if (blockDemoAction("Editing menu items")) return;
                              setEditingItem(item);
                              setActiveDropdownId(null);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#24312e] transition ${demoActionClass}`}
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
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#24312e] transition ${demoActionClass}`}
                          >
                            {isUnavailable ? (
                              <>
                                <CheckCircle2
                                  size={15}
                                  className="text-[#3b724c]"
                                />
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
                              if (blockDemoAction("Deleting menu items"))
                                return;
                              setDeletingItem(item);
                              setActiveDropdownId(null);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition ${demoActionClass}`}
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
                Price ({currencySymbol || "₹"}){" "}
                <span className="text-[#b7623d]">*</span>
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
                Preparation time (minutes){" "}
                <span className="text-[#b7623d]">*</span>
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
          currencySymbol={currencySymbol}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {deletingItem && (
        <DeleteMenuItemModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={handleItemDeleted}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </>
  );
}

function ManualBillModal({
  isOpen,
  onClose,
  tables = [],
  menuItems = [],
  soldOutItems = [],
  servants = [],
  taxRate = 5.0,
  serviceCharge = 5.0,
  currencySymbol = "₹",
  onOrderCreated,
  onTableStatusChange,
  showToast,
  role,
}: {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  menuItems: ApiMenuItem[];
  soldOutItems?: string[];
  servants: { id?: string; name: string }[];
  taxRate: number;
  serviceCharge: number;
  currencySymbol: string;
  onOrderCreated?: (order: Order) => void;
  onTableStatusChange?: (id: string, status: TableStatus) => void;
  onDirectSettle?: (invoice: any) => void;
  showToast: (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => void;
  role?: StaffRole | null;
}) {
  if (!isOpen) return null;

  const [orderType, setOrderType] = useState<"Dine in" | "Takeaway">("Dine in");
  const [tableNumber, setTableNumber] = useState<string>(
    tables[0]?.id || "T01",
  );
  const [guestName, setGuestName] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [servantName, setServantName] = useState<string>(
    servants[0]?.name || "",
  );

  interface ManualItem {
    id: string;
    name: string;
    qty: number;
    rate: number;
    total: number;
  }

  const [selectedItems, setSelectedItems] = useState<ManualItem[]>([]);
  const [dishSearch, setDishSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const isDishUnavailable = (item: ApiMenuItem) => {
    return (
      item.available === false ||
      (soldOutItems && soldOutItems.includes(item.name)) ||
      (item as any).status === "Unavailable"
    );
  };

  const categories = [
    "All",
    ...Array.from(new Set(menuItems.map((m) => m.category || "General"))),
  ];

  const filteredMenuItems = menuItems
    .filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
        (item.category &&
          item.category.toLowerCase().includes(dishSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aUnavail = isDishUnavailable(a);
      const bUnavail = isDishUnavailable(b);
      if (aUnavail === bUnavail) return 0;
      return aUnavail ? 1 : -1;
    });

  const handleAddItem = (item: ApiMenuItem) => {
    if (isDishUnavailable(item)) return;

    setSelectedItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.name.toLowerCase() === item.name.toLowerCase(),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: next[idx].qty + 1,
          total: (next[idx].qty + 1) * next[idx].rate,
        };
        return next;
      }
      return [
        ...prev,
        {
          id: item.id || `dish-${Date.now()}-${Math.random()}`,
          name: item.name,
          qty: 1,
          rate: item.price,
          total: item.price,
        },
      ];
    });
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setSelectedItems((prev) => {
      const it = prev[idx];
      if (!it) return prev;
      const nextQty = it.qty + delta;
      if (nextQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      const next = [...prev];
      next[idx] = { ...it, qty: nextQty, total: nextQty * it.rate };
      return next;
    });
  };

  // Calculations
  const subtotal = selectedItems.reduce((sum, it) => sum + it.total, 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const serviceChargeAmount = Number(
    ((subtotal * serviceCharge) / 100).toFixed(2),
  );
  const netPayable = Math.max(
    0,
    Number((subtotal + taxAmount + serviceChargeAmount).toFixed(2)),
  );
  const totalItemCount = selectedItems.reduce((sum, it) => sum + it.qty, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!guestName.trim()) {
      setError("Guest name is mandatory. Please enter the guest's name.");
      return;
    }

    const effectiveTable = orderType === "Takeaway" ? "Takeaway" : tableNumber;

    if (
      orderType === "Dine in" &&
      (!effectiveTable ||
        effectiveTable.trim() === "" ||
        effectiveTable === "Takeaway")
    ) {
      setError(
        "Assigning a table is mandatory for dine-in orders. Please select a table.",
      );
      return;
    }

    if (selectedItems.length === 0) {
      setError("Please select at least one dish for this bill.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItemList = selectedItems.map((it) =>
        it.qty > 1 ? `${it.qty}x ${it.name}` : it.name,
      );

      const customerLabel = guestName.trim();

      // Create order via API
      const newOrder = await createOrder(
        {
          customer: customerLabel,
          table: effectiveTable,
          itemList: formattedItemList,
          total: subtotal,
          serverName: servantName.trim() || undefined,
          orderType: orderType === "Takeaway" ? "Takeaway" : "Dine in",
        },
        role || "Server",
      );

      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      if (orderType === "Dine in" && onTableStatusChange) {
        onTableStatusChange(tableNumber, "Occupied");
      }

      showToast(
        "success",
        "Manual Bill Created",
        `Active bill created for ${effectiveTable} (${customerLabel}).`,
      );
      onClose();
    } catch (err: any) {
      setError(
        err?.message || "Failed to create manual bill. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#fbfaf7] border border-[#dfe1dc] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e9eae6] bg-white px-5 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#24312e]">
                Create Manual Bill
              </h3>
              <p className="text-xs text-[#84908a]">
                Generate a custom dine-in or takeaway bill on the fly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#84908a] hover:bg-[#f0f2ed] hover:text-[#24312e] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2 shrink-0">
            <AlertTriangle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Form Content */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Order Type Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType("Dine in")}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition cursor-pointer ${
                  orderType === "Dine in"
                    ? "border-[#24312e] bg-[#24312e] text-white shadow-xs"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <Utensils size={14} />
                <span>Dine in Table</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("Takeaway")}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition cursor-pointer ${
                  orderType === "Takeaway"
                    ? "border-[#24312e] bg-[#24312e] text-white shadow-xs"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <ShoppingBag size={14} />
                <span>Takeaway / Counter</span>
              </button>
            </div>

            {/* Table, Guest & Servant Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {orderType === "Dine in" ? (
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Assign Table{" "}
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#24312e] cursor-pointer ${
                      !tableNumber && error
                        ? "border-red-400 bg-red-50/50"
                        : "border-[#dfe1dc] bg-white"
                    }`}
                  >
                    <option value="" disabled>
                      -- Select Table (Required) --
                    </option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} ({t.seats} seats · {t.zone}) - {t.status}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Pickup Channel
                  </label>
                  <input
                    type="text"
                    value="Pickup Counter / Takeaway"
                    disabled
                    className="w-full rounded-xl border border-[#dfe1dc] bg-[#eef0eb] px-3 py-2 text-xs text-[#68736e]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Assigned Servant / Waiter
                </label>
                <select
                  value={servantName}
                  onChange={(e) => setServantName(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e] cursor-pointer"
                >
                  <option value="">-- No servant assigned (Optional) --</option>
                  {servants.map((s) => (
                    <option key={s.id || s.name} value={s.name}>
                      {s.name} (Floor Server)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Guest Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saurav Sharma (Required)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#24312e] ${
                    !guestName.trim() && error
                      ? "border-red-400 bg-red-50/50"
                      : "border-[#dfe1dc] bg-white"
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Guests / Covers
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                />
              </div>
            </div>

            {/* Menu Items Selection Section */}
            <div className="rounded-2xl border border-[#e9eae6] bg-white p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9aa39d]">
                  Select Menu Items
                </span>
                {totalItemCount > 0 && (
                  <span className="rounded-full bg-[#e8f1e8] px-2.5 py-0.5 text-[11px] font-bold text-[#315a3d]">
                    {totalItemCount} {totalItemCount === 1 ? "dish" : "dishes"}{" "}
                    selected
                  </span>
                )}
              </div>

              {/* Dish Search & Category Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-2.5 text-[#84908a]"
                  />
                  <input
                    type="text"
                    placeholder="Search menu dishes..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe1dc] bg-[#fbfaf7] pl-7 pr-2.5 py-1.5 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#24312e] text-white"
                        : "bg-[#f0f2ed] text-[#68736e] hover:bg-[#dfe1dc]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Scrollable Dish Grid (3 columns) */}
              <div className="max-h-[380px] overflow-y-auto pr-1">
                {filteredMenuItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#84908a]">
                    No dishes found matching your search.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredMenuItems.map((dish) => {
                      const unavailable = isDishUnavailable(dish);
                      const cartItem = selectedItems.find(
                        (i) => i.name.toLowerCase() === dish.name.toLowerCase(),
                      );
                      const inCartQty = cartItem ? cartItem.qty : 0;

                      return (
                        <div
                          key={dish.id}
                          className={`group flex flex-col justify-between rounded-2xl p-2.5 text-xs border transition ${
                            unavailable
                              ? "bg-[#f4f5f1] border-dashed border-[#dfe1dc] opacity-65"
                              : inCartQty > 0
                                ? "bg-[#f2f7f3] border-[#315a3d]/50 shadow-xs ring-1 ring-[#315a3d]/20"
                                : "bg-white border-[#eef0eb] hover:border-[#dfe1dc] hover:shadow-2xs"
                          }`}
                        >
                          {/* Dish Image */}
                          <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[#e9eee5] flex items-center justify-center text-[#315a3d]">
                            {dish.image ? (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                className={`h-full w-full object-cover transition-transform duration-300 ${
                                  unavailable
                                    ? "grayscale contrast-75"
                                    : "group-hover:scale-105"
                                }`}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <Utensils
                                size={28}
                                className="text-[#315a3d]/50"
                              />
                            )}
                            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-xs px-1.5 py-0.5 shadow-2xs">
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  dish.type === "veg"
                                    ? "bg-[#3b724c]"
                                    : "bg-[#b7623d]"
                                }`}
                              />
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#24312e]">
                                {dish.type === "veg" ? "Veg" : "Non-veg"}
                              </span>
                            </div>
                            {unavailable && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                <span className="flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                                  <Ban size={10} /> Unavailable
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Dish Info */}
                          <div className="mt-2 flex-1">
                            <h4
                              className={`font-bold text-xs line-clamp-1 ${
                                unavailable
                                  ? "text-[#84908a] line-through decoration-[#84908a]/40"
                                  : "text-[#24312e]"
                              }`}
                              title={dish.name}
                            >
                              {dish.name}
                            </h4>
                            <div className="mt-0.5 flex items-center justify-between">
                              <span className="text-[10px] text-[#84908a] line-clamp-1">
                                {dish.category}
                              </span>
                              <span className="text-xs font-black text-[#24312e]">
                                {currencySymbol}
                                {dish.price}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Handler */}
                          <div className="mt-2.5 pt-2 border-t border-[#f0f1ed]">
                            {unavailable ? (
                              <div className="w-full text-center rounded-lg bg-gray-100 py-1 text-[11px] font-semibold text-gray-400 select-none cursor-not-allowed border border-gray-200">
                                Unavailable
                              </div>
                            ) : inCartQty > 0 ? (
                              <div className="flex items-center justify-between rounded-lg border border-[#315a3d]/40 bg-white p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const idx = selectedItems.findIndex(
                                      (i) =>
                                        i.name.toLowerCase() ===
                                        dish.name.toLowerCase(),
                                    );
                                    if (idx >= 0) handleUpdateQty(idx, -1);
                                  }}
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f0f4f1] text-[#315a3d] hover:bg-[#315a3d] hover:text-white transition cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="font-extrabold text-xs text-[#24312e] px-2 min-w-[20px] text-center">
                                  {inCartQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const idx = selectedItems.findIndex(
                                      (i) =>
                                        i.name.toLowerCase() ===
                                        dish.name.toLowerCase(),
                                    );
                                    if (idx >= 0) handleUpdateQty(idx, 1);
                                  }}
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f0f4f1] text-[#315a3d] hover:bg-[#315a3d] hover:text-white transition cursor-pointer"
                                  title="Increase quantity"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddItem(dish)}
                                className="w-full rounded-lg bg-[#e8f1e8] py-1 text-xs font-bold text-[#315a3d] hover:bg-[#315a3d] hover:text-white transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Plus size={12} />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Sticky Action Footer */}
          <div className="border-t border-[#e9eae6] bg-white px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#68736e]">
                {totalItemCount} {totalItemCount === 1 ? "dish" : "dishes"}
              </span>
              <span className="text-xs text-[#dfe1dc]">•</span>
              <span className="text-sm font-extrabold text-[#24312e]">
                Total: {currencySymbol}
                {netPayable.toFixed(2)}
              </span>
              {totalItemCount > 0 && (
                <span className="text-[10px] text-[#84908a] hidden sm:inline">
                  (incl. {taxRate}% GST)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#dfe1dc] bg-white px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="rounded-xl bg-[#24312e] hover:bg-[#315a3d] px-5 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Bill"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function BillingPage({
  tables = [],
  orders = [],
  bookings = [],
  menuItems = [],
  soldOutItems = [],
  restaurantSettings,
  currencySymbol = "₹",
  role,
  servants = [],
  onTableStatusChange,
  onOrderStatusChange,
  onBookingStatusChange,
  onNavigateSettings,
  onNavigateTransactions,
  onOrderCreated,
  onOrderUpdated,
  onOrdersChange,
}: {
  tables?: RestaurantTable[];
  orders?: Order[];
  bookings?: TableBooking[];
  menuItems?: ApiMenuItem[];
  soldOutItems?: string[];
  restaurantSettings?: StoreSettings;
  currencySymbol?: string;
  role?: StaffRole | null;
  servants?: { id?: string; name: string }[];
  onTableStatusChange?: (id: string, status: TableStatus) => void;
  onOrderStatusChange?: (id: string, status: OrderStatus) => void;
  onBookingStatusChange?: (id: string, status: BookingStatus) => void;
  onNavigateSettings?: () => void;
  onNavigateTransactions?: () => void;
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onOrdersChange?: (orders: Order[]) => void;
}) {
  const taxRate = restaurantSettings?.taxRate ?? 5.0;
  const serviceCharge = restaurantSettings?.serviceCharge ?? 5.0;
  const restroName = restaurantSettings?.restaurantName || "Table & Thyme";
  const branchName = restaurantSettings?.branchName || "Downtown Branch";
  const receiptFooter =
    restaurantSettings?.receiptFooter ||
    "Thank you for dining with us! Please visit again.";
  const logoUrl = restaurantSettings?.logoUrl || "";
  const gstNumber = restaurantSettings?.gstNumber || "07AAAAA0000A1Z5";

  // State management
  const [activeTab, setActiveTab] = useState<
    "active-tables" | "takeaway" | "settled-history"
  >("active-tables");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "Card" | "Cash" | "Split"
  >("UPI");
  const [cashTenderedInput, setCashTenderedInput] = useState<string>("");
  const [waiveServiceCharge, setWaiveServiceCharge] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountInput, setCustomDiscountInput] = useState<string>("");
  const [splitCount, setSplitCount] = useState<number>(2);
  const [cardAuthCode, setCardAuthCode] = useState<string>(
    "AUTH-" + Math.floor(100000 + Math.random() * 900000),
  );
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [receiptModalInvoice, setReceiptModalInvoice] = useState<any | null>(
    null,
  );

  // In-billing item editing & POS simulation state
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [showManualBillModal, setShowManualBillModal] =
    useState<boolean>(false);
  const [dishSearchQuery, setDishSearchQuery] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);

  // Recent transaction records state
  const [transactionsList, setTransactionsList] = useState<TransactionRecord[]>(
    [],
  );

  // Date helper to verify transactions made today
  const isTodayDate = (dateVal?: string | Date) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const showToast = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [
      ...prev,
      { id, type, title, message, duration: 4000 },
    ]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  interface BillableItem {
    name: string;
    qty: number;
    rate: number;
    total: number;
  }

  interface BillableSession {
    id: string;
    tableId?: string;
    title: string;
    type: "dine-in" | "takeaway";
    customer: string;
    guests: number;
    server: string;
    time: string;
    items: BillableItem[];
    subtotal: number;
    deposit: number;
    orderIds: string[];
    bookingId?: string;
  }

  const normalizeTableKey = (str: string): string => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const isMatchingTable = (orderTable: string, tableId: string): boolean => {
    if (!orderTable || !tableId) return false;
    const cleanOrder = normalizeTableKey(orderTable);
    const cleanTable = normalizeTableKey(tableId);
    if (cleanOrder === cleanTable) return true;
    const numOrder = cleanOrder
      .replace(/^table/, "")
      .replace(/^t/, "")
      .replace(/^0+/, "");
    const numTable = cleanTable
      .replace(/^table/, "")
      .replace(/^t/, "")
      .replace(/^0+/, "");
    if (numOrder && numTable && numOrder === numTable) return true;
    return false;
  };

  const parseBillableItems = (
    itemList: string[] | undefined,
    orderTotal: number,
    menuItemsList: ApiMenuItem[],
  ): BillableItem[] => {
    if (!itemList || !itemList.length) return [];

    const itemMap = new Map<
      string,
      { qty: number; rate: number; total: number }
    >();

    itemList.forEach((raw) => {
      let qty = 1;
      let name = raw.trim();

      const prefixMatch = name.match(/^(\d+)\s*[xX]?\s+(.+)$/);
      const suffixMatch = name.match(/^(.+?)\s+[xX]\s*(\d+)$/);
      if (prefixMatch) {
        qty = parseInt(prefixMatch[1], 10) || 1;
        name = prefixMatch[2].trim();
      } else if (suffixMatch) {
        name = suffixMatch[1].trim();
        qty = parseInt(suffixMatch[2], 10) || 1;
      }

      const menuItem =
        menuItemsList.find(
          (m) => m.name.toLowerCase().trim() === name.toLowerCase().trim(),
        ) ||
        menuItemsList.find(
          (m) =>
            m.name.toLowerCase().trim().includes(name.toLowerCase().trim()) ||
            name.toLowerCase().trim().includes(m.name.toLowerCase().trim()),
        );

      const displayName = menuItem ? menuItem.name : name;
      const rate = menuItem
        ? menuItem.price
        : Math.round(orderTotal / itemList.length) || 200;

      const existing = itemMap.get(displayName);
      if (existing) {
        existing.qty += qty;
        existing.total += rate * qty;
      } else {
        itemMap.set(displayName, { qty, rate, total: rate * qty });
      }
    });

    return Array.from(itemMap.entries()).map(([name, data]) => ({
      name,
      qty: data.qty,
      rate: data.rate,
      total: data.total,
    }));
  };

  const [sessions, setSessions] = useState<BillableSession[]>([]);
  const [settledSessionIds, setSettledSessionIds] = useState<Set<string>>(
    new Set(),
  );
  const [settledInvoices, setSettledInvoices] = useState<any[]>([]);

  // Fetch transactions and hydrate settled invoices on load or when rates update
  useEffect(() => {
    fetchTransactions()
      .then((data) => {
        if (Array.isArray(data)) {
          setTransactionsList(data);
          // Hydrate settledInvoices from all completed transactions
          const successfulInvoices = data
            .filter((tx) => tx.status === "Success")
            .map((tx) => {
              const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
              const itemsList = Array.isArray(tx.items) ? tx.items : [];
              const calculatedSubtotal =
                itemsList.reduce(
                  (acc: number, it: any) =>
                    acc +
                    (Number(it.total) || Number(it.rate) * Number(it.qty) || 0),
                  0,
                ) || Number(tx.amount || 0);
              return {
                id: tx.id || `inv-${tx.invoiceNo}`,
                invoiceNo: tx.invoiceNo,
                title: tx.sessionTitle || "Table",
                customer: tx.customer || "Guest",
                server: tx.servant || "Staff",
                date: !isNaN(txDate.getTime())
                  ? txDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Today",
                time: !isNaN(txDate.getTime())
                  ? txDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "12:00 PM",
                createdAt: tx.createdAt,
                items: itemsList,
                subtotal: calculatedSubtotal,
                taxRate: taxRate,
                taxAmount: Number(tx.taxAmount || 0),
                serviceCharge: serviceCharge,
                serviceChargeAmount: Number(tx.serviceChargeAmount || 0),
                discountAmount: Number(tx.discountAmount || 0),
                depositCredit: Number(tx.depositCredit || 0),
                total: Number(tx.amount || 0),
                paymentMethod: tx.paymentMode || "UPI",
              };
            });
          setSettledInvoices(successfulInvoices);
        }
      })
      .catch(() => {});
  }, [taxRate, serviceCharge]);

  // Merge live tables and orders dynamically from backend API
  useEffect(() => {
    const dynamicDineIn: BillableSession[] = [];

    tables.forEach((t) => {
      // 1. If table was settled in this session, skip it completely
      const tIdClean = normalizeTableKey(t.id);
      const tNum = t.id.replace(/^t0?/i, "");
      if (
        settledSessionIds.has(t.id) ||
        settledSessionIds.has(tIdClean) ||
        settledSessionIds.has(`table${tNum}`) ||
        settledSessionIds.has(`Table ${tNum}`) ||
        settledSessionIds.has(`Table 0${tNum}`)
      ) {
        return;
      }

      // 2. Only consider ACTIVE orders (not already paid or cancelled)
      const activeTableOrders = orders.filter((o) => {
        if (o.status === "Paid" || o.status === "Cancelled") return false;
        if (o.table && o.table.toLowerCase().includes("takeaway")) return false;
        return isMatchingTable(o.table, t.id);
      });

      // 3. A table is active if it has active orders OR its status is Occupied or Booked
      const isTableOccupied = t.status === "Occupied" || t.status === "Booked";

      if (isTableOccupied || activeTableOrders.length > 0) {
        const booking = bookings.find(
          (b) =>
            isMatchingTable(b.tableId || "", t.id) &&
            b.status !== "Cancelled" &&
            b.status !== "Completed",
        );

        const allRawItems: string[] = [];
        let combinedOrderTotal = 0;
        activeTableOrders.forEach((o) => {
          if (o.itemList && Array.isArray(o.itemList)) {
            allRawItems.push(...o.itemList);
          }
          const cleanTotal =
            parseFloat(String(o.total).replace(/[^0-9.]/g, "")) || 0;
          combinedOrderTotal += cleanTotal;
        });

        const items = parseBillableItems(
          allRawItems,
          combinedOrderTotal,
          menuItems,
        );
        const subtotal =
          items.length > 0
            ? items.reduce((sum, it) => sum + it.total, 0)
            : combinedOrderTotal;

        const depositVal =
          typeof booking?.deposit === "number" ? booking.deposit : 0;
        const serverFromOrder = activeTableOrders.find(
          (o) => o.serverName,
        )?.serverName;
        const assignedServer =
          serverFromOrder || t.serverName || (servants[0]?.name ?? "Arjun Rao");

        dynamicDineIn.push({
          id: t.id,
          tableId: t.id,
          title: t.id.startsWith("T")
            ? `Table ${t.id.replace(/^T0?/, "")}`
            : t.id,
          type: "dine-in",
          customer:
            booking?.customer ||
            activeTableOrders[0]?.customer ||
            "Dining Guest",
          guests: t.seats || 2,
          server: assignedServer,
          time: "Active",
          items,
          subtotal,
          deposit: depositVal,
          orderIds: activeTableOrders.map((o) => o.id),
          bookingId: booking?.id,
        });
      }
    });

    // Also include any active dine-in orders whose table is not in the tables list
    const capturedOrderIds = new Set(dynamicDineIn.flatMap((s) => s.orderIds));
    const uncapturedOrders = orders.filter(
      (o) =>
        !capturedOrderIds.has(o.id) &&
        !o.table.toLowerCase().includes("takeaway") &&
        o.status !== "Paid" &&
        o.status !== "Cancelled",
    );

    const uncapturedByTable = new Map<string, Order[]>();
    uncapturedOrders.forEach((o) => {
      const key = o.table || "Unknown";
      const existing = uncapturedByTable.get(key) || [];
      existing.push(o);
      uncapturedByTable.set(key, existing);
    });

    uncapturedByTable.forEach((tableOrders, tableKey) => {
      if (
        settledSessionIds.has(tableKey) ||
        settledSessionIds.has(normalizeTableKey(tableKey))
      ) {
        return;
      }
      const allRawItems: string[] = [];
      let combinedOrderTotal = 0;
      tableOrders.forEach((o) => {
        if (o.itemList && Array.isArray(o.itemList)) {
          allRawItems.push(...o.itemList);
        }
        const cleanTotal =
          parseFloat(String(o.total).replace(/[^0-9.]/g, "")) || 0;
        combinedOrderTotal += cleanTotal;
      });

      const items = parseBillableItems(
        allRawItems,
        combinedOrderTotal,
        menuItems,
      );
      const subtotal =
        items.length > 0
          ? items.reduce((sum, it) => sum + it.total, 0)
          : combinedOrderTotal;

      const serverFromOrder = tableOrders.find((o) => o.serverName)?.serverName;
      const assignedServer =
        serverFromOrder || (servants[0]?.name ?? "Arjun Rao");

      dynamicDineIn.push({
        id: tableKey,
        tableId: tableKey,
        title: tableKey.startsWith("T")
          ? `Table ${tableKey.replace(/^T0?/, "")}`
          : tableKey,
        type: "dine-in",
        customer: tableOrders[0]?.customer || "Dining Guest",
        guests: 2,
        server: assignedServer,
        time: "Active",
        items,
        subtotal,
        deposit: 0,
        orderIds: tableOrders.map((o) => o.id),
      });
    });

    setSessions(dynamicDineIn);
    if (
      !selectedSessionId ||
      !dynamicDineIn.some((s) => s.id === selectedSessionId)
    ) {
      if (dynamicDineIn.length > 0) {
        setSelectedSessionId(dynamicDineIn[0].id);
      }
    }
  }, [tables, orders, bookings, menuItems, settledSessionIds]);

  // Takeaway sessions
  const takeawaySessions: BillableSession[] = orders
    .filter(
      (o) =>
        o.table.toLowerCase().includes("takeaway") &&
        o.status !== "Paid" &&
        o.status !== "Cancelled",
    )
    .map((o) => {
      const cleanTotal =
        parseFloat(String(o.total).replace(/[^0-9.]/g, "")) || 0;
      const items = parseBillableItems(o.itemList, cleanTotal, menuItems);
      const subtotal =
        items.length > 0
          ? items.reduce((sum, it) => sum + it.total, 0)
          : cleanTotal;

      return {
        id: `takeaway-${o.id}`,
        title: `Takeaway ${o.id}`,
        type: "takeaway",
        customer: o.customer || "Counter Guest",
        guests: 1,
        server: o.serverName || "Pickup Counter",
        time: "Quick Takeaway",
        items,
        subtotal,
        deposit: 0,
        orderIds: [o.id],
      };
    });

  const currentPool = activeTab === "takeaway" ? takeawaySessions : sessions;
  const filteredSessions = currentPool.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.customer.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const selectedSession: BillableSession | null =
    currentPool.find((s) => s.id === selectedSessionId) ||
    currentPool[0] ||
    null;

  // Helper to persist session item modifications to backend API
  const persistSessionItems = async (
    session: BillableSession,
    updatedItems: BillableItem[],
  ) => {
    const newSubtotal = updatedItems.reduce((acc, it) => acc + it.total, 0);

    const newItemList: string[] = [];
    updatedItems.forEach((it) => {
      if (it.qty > 1) {
        newItemList.push(`${it.qty}x ${it.name}`);
      } else {
        newItemList.push(it.name);
      }
    });

    // Optimistic local state update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === session.id
          ? { ...s, items: updatedItems, subtotal: newSubtotal }
          : s,
      ),
    );

    const primaryOrderId =
      session.orderIds && session.orderIds.length > 0
        ? session.orderIds[0]
        : null;

    if (primaryOrderId) {
      try {
        const updated = await updateOrder(primaryOrderId, {
          itemList: newItemList,
          total: newSubtotal,
        });
        if (onOrderUpdated) {
          onOrderUpdated(updated);
        }
      } catch (err) {
        console.error("Failed to sync updated items to order:", err);
      }
    } else {
      try {
        const created = await createOrder(
          {
            customer: session.customer || `Table ${session.title} Guest`,
            table: session.tableId || session.id,
            itemList: newItemList,
            total: newSubtotal,
            serverName: session.server || undefined,
            orderType: session.type === "takeaway" ? "Takeaway" : "Dine in",
          },
          role || "Server",
        );
        if (onOrderCreated) {
          onOrderCreated(created);
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id ? { ...s, orderIds: [created.id] } : s,
          ),
        );
      } catch (err) {
        console.error("Failed to create order from billing:", err);
      }
    }
  };

  // In-Billing Item Manipulation Handlers
  const handleAddItemToSession = async (menuItem: ApiMenuItem) => {
    if (!selectedSession) return;
    const existingIdx = selectedSession.items.findIndex(
      (it) => it.name.toLowerCase() === menuItem.name.toLowerCase(),
    );
    let newItems = [...selectedSession.items];
    if (existingIdx >= 0) {
      const it = newItems[existingIdx];
      newItems[existingIdx] = {
        ...it,
        qty: it.qty + 1,
        total: (it.qty + 1) * it.rate,
      };
    } else {
      newItems.push({
        name: menuItem.name,
        qty: 1,
        rate: menuItem.price,
        total: menuItem.price,
      });
    }

    await persistSessionItems(selectedSession, newItems);
    showToast(
      "success",
      "Dish Added",
      `Added ${menuItem.name} to ${selectedSession.title}`,
    );
  };

  const handleUpdateItemQty = async (itemIdx: number, delta: number) => {
    if (!selectedSession) return;
    let newItems = [...selectedSession.items];
    const it = newItems[itemIdx];
    if (!it) return;
    const nextQty = it.qty + delta;
    if (nextQty <= 0) {
      newItems.splice(itemIdx, 1);
    } else {
      newItems[itemIdx] = {
        ...it,
        qty: nextQty,
        total: nextQty * it.rate,
      };
    }

    await persistSessionItems(selectedSession, newItems);
  };

  const handleRemoveItem = async (itemIdx: number) => {
    if (!selectedSession) return;
    const newItems = selectedSession.items.filter((_, idx) => idx !== itemIdx);
    await persistSessionItems(selectedSession, newItems);
    showToast(
      "info",
      "Item Removed",
      "Dish removed from active billing ticket.",
    );
  };

  const handleUpdateSessionServer = async (newServer: string) => {
    if (!selectedSession) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSession.id ? { ...s, server: newServer } : s,
      ),
    );
    const primaryOrderId = selectedSession.orderIds?.[0];
    if (primaryOrderId) {
      try {
        const updated = await updateOrder(primaryOrderId, {
          serverName: newServer,
        });
        if (onOrderUpdated) onOrderUpdated(updated);
      } catch (err) {
        console.error("Failed to update server on order:", err);
      }
    }
    showToast(
      "success",
      "Servant Assigned",
      `${newServer || "Servant"} assigned to ${selectedSession.title}`,
    );
  };

  // Calculations
  const subtotal = selectedSession?.subtotal || 0;
  const effectiveTaxRate = taxRate;
  const effectiveServiceRate = waiveServiceCharge ? 0 : serviceCharge;
  const taxAmount = Number(((subtotal * effectiveTaxRate) / 100).toFixed(2));
  const serviceChargeAmount = Number(
    ((subtotal * effectiveServiceRate) / 100).toFixed(2),
  );

  let discountAmount = 0;
  if (discountPercent > 0) {
    discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  } else if (Number(customDiscountInput) > 0) {
    discountAmount = Number(customDiscountInput);
  }

  const depositCredit = selectedSession?.deposit || 0;
  const grossPayable =
    subtotal + taxAmount + serviceChargeAmount - discountAmount;
  const finalPayable = Math.max(
    0,
    Number((grossPayable - depositCredit).toFixed(2)),
  );

  const tenderedNum = parseFloat(cashTenderedInput) || 0;
  const changeDue = Math.max(0, tenderedNum - finalPayable);

  // Payment Failure Simulation Handler
  const handlePaymentFailure = async (customReason?: string) => {
    if (!selectedSession) return;
    setIsProcessingPayment(true);
    const reason =
      customReason ||
      (paymentMethod === "UPI"
        ? "UPI QR Scanner timeout: Customer cancelled payment request"
        : paymentMethod === "Card"
          ? "Card declined: Chip read error or daily contactless limit reached"
          : "Cash discrepancy: Insufficient tender provided");

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    setPaymentError(reason);

    const failedTx: Partial<TransactionRecord> = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNo,
      sessionTitle: selectedSession.title,
      customer: selectedSession.customer,
      servant: selectedSession.server || "Unassigned",
      amount: finalPayable,
      paymentMode: paymentMethod === "UPI" ? "UPI / Scanner" : paymentMethod,
      status: "Failed",
      failureReason: reason,
      items: selectedSession.items,
      taxAmount,
      serviceChargeAmount,
      discountAmount,
      depositCredit,
    };

    try {
      const saved = await recordTransaction(failedTx);
      setTransactionsList((prev) => [saved, ...prev]);
    } catch {
      setTransactionsList((prev) => [
        {
          ...failedTx,
          createdAt: new Date().toISOString(),
        } as TransactionRecord,
        ...prev,
      ]);
    } finally {
      setIsProcessingPayment(false);
    }

    showToast("error", "Payment Failed", reason);
    // Table is NOT released, session stays active, stays in billing screen as requested!
  };

  // Payment Success Handler
  const handlePaymentSuccess = async () => {
    if (!selectedSession) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      title: selectedSession.title,
      customer: selectedSession.customer,
      server: selectedSession.server || "Unassigned",
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
      items: selectedSession.items,
      subtotal,
      taxRate: effectiveTaxRate,
      taxAmount,
      serviceCharge: effectiveServiceRate,
      serviceChargeAmount,
      discountAmount,
      depositCredit,
      total: finalPayable,
      paymentMethod: paymentMethod === "UPI" ? "UPI / Scanner" : paymentMethod,
      cashTendered:
        paymentMethod === "Cash" && tenderedNum ? tenderedNum : undefined,
      changeDue:
        paymentMethod === "Cash" && tenderedNum ? changeDue : undefined,
    };

    setSettledInvoices((prev) => [newInvoice, ...prev]);

    const successTx: Partial<TransactionRecord> = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNo,
      sessionTitle: selectedSession.title,
      customer: selectedSession.customer,
      servant: selectedSession.server || "Unassigned",
      amount: finalPayable,
      paymentMode: paymentMethod === "UPI" ? "UPI / Scanner" : paymentMethod,
      status: "Success",
      items: selectedSession.items,
      taxAmount,
      serviceChargeAmount,
      discountAmount,
      depositCredit,
    };

    try {
      const saved = await recordTransaction(successTx);
      setTransactionsList((prev) => [saved, ...prev]);
    } catch {
      setTransactionsList((prev) => [
        {
          ...successTx,
          createdAt: new Date().toISOString(),
        } as TransactionRecord,
        ...prev,
      ]);
    } finally {
      setIsProcessingPayment(false);
    }

    // Release table
    if (selectedSession.tableId && onTableStatusChange) {
      onTableStatusChange(selectedSession.tableId, "Needs cleaning");
    }

    // Update order status: find ALL orders matching this table/session and mark them Paid
    const matchingOrders = orders.filter((o) => {
      if (o.status === "Paid" || o.status === "Cancelled") return false;
      if (selectedSession.orderIds && selectedSession.orderIds.includes(o.id))
        return true;
      if (
        selectedSession.type === "takeaway" &&
        o.table?.toLowerCase().includes("takeaway")
      ) {
        return (
          `takeaway-${o.id}` === selectedSession.id ||
          o.id === selectedSession.id
        );
      }
      return isMatchingTable(
        o.table,
        selectedSession.tableId || selectedSession.id,
      );
    });

    if (onOrderStatusChange) {
      matchingOrders.forEach((order) => {
        onOrderStatusChange(order.id, "Paid");
      });
    }

    // Update booking status
    if (selectedSession.bookingId && onBookingStatusChange) {
      onBookingStatusChange(selectedSession.bookingId, "Completed");
    }

    // Remember in settledSessionIds so it is NEVER re-added by table polling
    setSettledSessionIds((prev) => {
      const next = new Set(prev);
      next.add(selectedSession.id);
      if (selectedSession.tableId) {
        next.add(selectedSession.tableId);
        next.add(selectedSession.tableId.toLowerCase());
        next.add(selectedSession.tableId.toUpperCase());
        next.add(`Table ${selectedSession.tableId.replace(/^T0?/i, "")}`);
        next.add(`Table 0${selectedSession.tableId.replace(/^T0?/i, "")}`);
      }
      return next;
    });

    // Remove from active sessions and select next session
    setSessions((prev) => {
      const remaining = prev.filter(
        (s) =>
          s.id !== selectedSession.id && s.tableId !== selectedSession.tableId,
      );
      if (remaining.length > 0) {
        setSelectedSessionId(remaining[0].id);
      } else {
        setSelectedSessionId("");
      }
      return remaining;
    });

    showToast(
      "success",
      `Payment Succeeded (${invoiceNo})`,
      `${selectedSession.title} settled with ${paymentMethod}. Redirecting to bill printing.`,
    );

    // Prompt print preview immediately upon success
    setReceiptModalInvoice(newInvoice);
  };

  const executeDirectPrint = (inv: any) => {
    setReceiptModalInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Today's settled calculations
  const todaySettledInvoices = settledInvoices.filter((inv) =>
    inv.createdAt ? isTodayDate(inv.createdAt) : true,
  );
  const totalCollectedToday = todaySettledInvoices.reduce(
    (acc, inv) => acc + (Number(inv.total) || 0),
    0,
  );
  const settledCountToday = todaySettledInvoices.length;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Embedded thermal receipt print stylesheet */}
      <style>{`
        @keyframes scanSweep {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .scanner-beam {
          animation: scanSweep 2.2s ease-in-out infinite;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-print-area, #thermal-print-area * {
            visibility: visible !important;
          }
          #thermal-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            display: block !important;
            z-index: 9999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Hidden container exclusively activated for window.print() */}
      <div id="thermal-print-area" className="hidden">
        {receiptModalInvoice && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{
                    maxHeight: "40px",
                    maxWidth: "120px",
                    margin: "0 auto 4px auto",
                    display: "block",
                  }}
                />
              )}
              <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
                {restroName}
              </h2>
              <p style={{ fontSize: "10px", margin: "2px 0" }}>{branchName}</p>
              <p style={{ fontSize: "10px", margin: "2px 0" }}>
                GSTIN: {gstNumber}
              </p>
              <p style={{ fontSize: "10px", margin: "2px 0" }}>TAX INVOICE</p>
            </div>

            <div
              style={{
                borderTop: "1px dashed #000",
                borderBottom: "1px dashed #000",
                padding: "4px 0",
                margin: "6px 0",
                fontSize: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Invoice: {receiptModalInvoice.invoiceNo}</span>
                <span>{receiptModalInvoice.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {receiptModalInvoice.title} ({receiptModalInvoice.customer})
                </span>
                <span>{receiptModalInvoice.date}</span>
              </div>
              <div>Server: {receiptModalInvoice.server}</div>
            </div>

            <div style={{ margin: "6px 0" }}>
              <table
                style={{
                  width: "100%",
                  fontSize: "10px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px dashed #000",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "3px 0", width: "12%" }}>Qty</th>
                    <th style={{ padding: "3px 0", width: "50%" }}>Item</th>
                    <th
                      style={{
                        padding: "3px 0",
                        width: "18%",
                        textAlign: "right",
                      }}
                    >
                      Rate
                    </th>
                    <th
                      style={{
                        padding: "3px 0",
                        width: "20%",
                        textAlign: "right",
                      }}
                    >
                      Amt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receiptModalInvoice.items &&
                    receiptModalInvoice.items.map((it: any, i: number) => (
                      <tr key={i}>
                        <td style={{ padding: "2px 0" }}>{it.qty}</td>
                        <td style={{ padding: "2px 0" }}>{it.name}</td>
                        <td style={{ padding: "2px 0", textAlign: "right" }}>
                          {it.rate}
                        </td>
                        <td style={{ padding: "2px 0", textAlign: "right" }}>
                          {it.total}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                borderTop: "1px dashed #000",
                paddingTop: "4px",
                fontSize: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "2px 0",
                }}
              >
                <span>Subtotal</span>
                <span>
                  {currencySymbol}
                  {Number(receiptModalInvoice.subtotal).toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "2px 0",
                }}
              >
                <span>GST ({receiptModalInvoice.taxRate ?? taxRate}%)</span>
                <span>
                  +{currencySymbol}
                  {Number(receiptModalInvoice.taxAmount).toFixed(2)}
                </span>
              </div>
              {receiptModalInvoice.serviceCharge > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "2px 0",
                  }}
                >
                  <span>
                    Service Charge ({receiptModalInvoice.serviceCharge}%)
                  </span>
                  <span>
                    +{currencySymbol}
                    {Number(receiptModalInvoice.serviceChargeAmount).toFixed(2)}
                  </span>
                </div>
              )}
              {receiptModalInvoice.discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "2px 0",
                  }}
                >
                  <span>Discount</span>
                  <span>
                    -{currencySymbol}
                    {Number(receiptModalInvoice.discountAmount).toFixed(2)}
                  </span>
                </div>
              )}
              {receiptModalInvoice.depositCredit > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    margin: "2px 0",
                  }}
                >
                  <span>Booking Deposit Credit</span>
                  <span>
                    -{currencySymbol}
                    {Number(receiptModalInvoice.depositCredit).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                padding: "4px 0",
                margin: "6px 0",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              <span>TOTAL PAYABLE</span>
              <span>
                {currencySymbol}
                {Number(receiptModalInvoice.total).toFixed(2)}
              </span>
            </div>

            <div style={{ fontSize: "10px", margin: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Payment Mode:</span>
                <span style={{ fontWeight: "bold" }}>
                  PAID via {receiptModalInvoice.paymentMethod}
                </span>
              </div>
              {receiptModalInvoice.cashTendered && (
                <>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Cash Tendered:</span>
                    <span>
                      {currencySymbol}
                      {Number(receiptModalInvoice.cashTendered).toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Change Returned:</span>
                    <span>
                      {currencySymbol}
                      {Number(receiptModalInvoice.changeDue).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: "12px",
                borderTop: "1px dashed #000",
                paddingTop: "6px",
                fontSize: "9px",
              }}
            >
              <p style={{ margin: "2px 0", fontStyle: "italic" }}>
                "{receiptFooter}"
              </p>
              <p style={{ margin: "4px 0 0 0", fontWeight: "bold" }}>
                *** HAVE A DELIGHTFUL DAY ***
              </p>
            </div>
          </div>
        )}
      </div>

      <SectionHeading
        eyebrow="Point of Sale & Invoicing"
        title="Billing & Checkout"
        description="Dynamic item billing, servant assignment, and interactive POS terminal with scanner & card payment."
        action={
          <button
            type="button"
            onClick={() => setShowManualBillModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#24312e] hover:bg-[#315a3d] px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-sm"
            title="Create a custom bill with table, guest, dishes and servant"
          >
            <Plus size={15} />
            <span>Create Manual Bill</span>
          </button>
        }
      />

      {/* Dynamic Tax Rates Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:p-4 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-950 font-medium">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
          <span>
            <strong>Dynamic POS Calculation Active:</strong> All orders
            calculate <strong>{taxRate}% GST</strong> and{" "}
            <strong>{serviceCharge}% Service Charge</strong> under system
            currency{" "}
            <strong className="text-emerald-900 bg-emerald-200/60 px-1.5 py-0.5 rounded text-xs font-bold">
              {currencySymbol}
            </strong>
            .
          </span>
        </div>
        {onNavigateSettings && (
          <button
            onClick={onNavigateSettings}
            className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
          >
            Adjust Rates in Settings →
          </button>
        )}
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          label="Open sessions"
          value={String(sessions.length + takeawaySessions.length)}
          change={`${currencySymbol}${(sessions.reduce((s, t) => s + t.subtotal, 0) + takeawaySessions.reduce((s, t) => s + t.subtotal, 0)).toLocaleString()} running`}
          icon={FileText}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Collected today"
          value={`${currencySymbol}${totalCollectedToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${settledCountToday} bills settled today`}
          icon={CircleDollarSign}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Deposits held"
          value={`${currencySymbol}${sessions.reduce((acc, t) => acc + (t.deposit || 0), 0).toLocaleString()}`}
          change="Auto-deducted on checkout"
          icon={CreditCard}
          color="bg-[#eee8f6] text-[#72558e]"
        />
        <StatCard
          label="Settled bills"
          value={String(settledCountToday)}
          change={`Total: ${currencySymbol}${totalCollectedToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Receipt}
          color="bg-amber-50 text-amber-800"
        />
      </div>

      {/* Section View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e9eae6] pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          <button
            onClick={() => setActiveTab("active-tables")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "active-tables"
                ? "bg-[#24312e] text-white shadow-xs"
                : "border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
            }`}
          >
            <Table2 size={14} />
            <span>Active Dine-In</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("takeaway")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "takeaway"
                ? "bg-[#24312e] text-white shadow-xs"
                : "border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
            }`}
          >
            <ShoppingBag size={14} />
            <span>Takeaway</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
              {takeawaySessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settled-history")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "settled-history"
                ? "bg-[#24312e] text-white shadow-xs"
                : "border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
            }`}
          >
            <History size={14} />
            <span>Settled ({settledInvoices.length})</span>
          </button>

          {/* Direct Link to Manager Transactions Module */}
          {role === "Manager" && onNavigateTransactions && (
            <button
              onClick={onNavigateTransactions}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
              title="Open the separate Transactions module"
            >
              <Receipt size={14} />
              <span>Ledger →</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab !== "settled-history" && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-[#84908a]"
              />
              <input
                type="text"
                placeholder="Search table or customer..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="rounded-xl border border-[#dfe1dc] bg-white pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#24312e] w-44 sm:w-52"
              />
            </div>
          )}
        </div>
      </div>

      {activeTab === "settled-history" ? (
        /* Tab 2: Settled Invoices History Screen */
        <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="display-font text-xl font-bold text-[#24312e]">
                Settled Bills & Invoices Archive
              </h2>
              <p className="mt-1 text-xs text-[#84908a]">
                Audit past customer payments, inspect breakdowns, and reprint
                receipts anytime.
              </p>
            </div>
            <span className="rounded-lg bg-[#e8f1e8] px-3 py-1 text-xs font-bold text-[#3b724c]">
              Total Settled: {currencySymbol}
              {settledInvoices
                .reduce((acc, i) => acc + i.total, 0)
                .toLocaleString()}
            </span>
          </div>

          {settledInvoices.length === 0 ? (
            <div className="py-12 text-center text-[#84908a]">
              <Receipt size={40} className="mx-auto text-[#cbd5e1] mb-2" />
              <p className="font-bold text-sm text-[#24312e]">
                No settled bills yet today
              </p>
              <p className="text-xs mt-1">
                Completed table checkout receipts will be archived here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-wider text-[#9aa39d]">
                  <tr>
                    <th className="pb-3">Invoice #</th>
                    <th className="pb-3">Table / Source</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Server</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3 text-right">Subtotal</th>
                    <th className="pb-3 text-right">GST / Tax</th>
                    <th className="pb-3 text-right">Paid Total</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f1ed]">
                  {settledInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/60 transition">
                      <td className="py-3.5 font-mono font-bold text-[#24312e]">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3.5 font-bold text-[#315a3d]">
                        {inv.title}
                      </td>
                      <td className="py-3.5 text-[#68736e]">{inv.customer}</td>
                      <td className="py-3.5 text-[#45504b] font-medium">
                        {inv.server}
                      </td>
                      <td className="py-3.5 text-[#84908a]">{inv.time}</td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#eef3ee] px-2 py-0.5 text-[10px] font-bold text-[#315a3d]">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-medium">
                        {currencySymbol}
                        {Number(inv.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right text-emerald-700">
                        +{currencySymbol}
                        {Number(inv.taxAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-[#24312e]">
                        {currencySymbol}
                        {Number(inv.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => executeDirectPrint(inv)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe1dc] bg-white px-2.5 py-1 text-xs font-bold text-[#24312e] hover:bg-[#f0f1ed] transition cursor-pointer shadow-2xs"
                        >
                          <Printer size={13} />
                          <span>Re-Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Tab 3: Active Billing Sessions Layout */
        <div className="grid gap-6 lg:grid-cols-[1fr_450px]">
          {/* Left Column: Active Table Sessions */}
          <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="display-font text-xl font-bold text-[#24312e]">
                    {activeTab === "takeaway"
                      ? "Takeaway Tickets"
                      : "Active Table Sessions"}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#84908a]">
                    Select any billable session to modify items, manage
                    servants, or process checkout.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#68736e]">
                  Active Currency:{" "}
                  <strong className="text-[#24312e]">{currencySymbol}</strong>
                </span>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="py-12 text-center text-[#84908a]">
                  <Utensils size={36} className="mx-auto text-[#cbd5e1] mb-2" />
                  <p className="font-bold text-sm text-[#24312e]">
                    No active sessions found
                  </p>
                  <p className="text-xs mt-1 mb-4">
                    Orders sent to tables or counter will appear here for
                    billing.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualBillModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#24312e] hover:bg-[#315a3d] px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                  >
                    <Plus size={14} />
                    <span>+ Create Manual Bill</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map((session) => {
                    const isSelected = selectedSession.id === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border p-4 transition cursor-pointer gap-3 ${
                          isSelected
                            ? "border-[#24312e] bg-[#f2f6f2] shadow-sm ring-1.5 ring-[#24312e]"
                            : "border-[#eef0eb] bg-white hover:border-[#dfe1dc] hover:shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                              isSelected
                                ? "bg-[#24312e] text-white"
                                : "bg-[#f0f2ed] text-[#24312e]"
                            }`}
                          >
                            {session.type === "takeaway"
                              ? "📦"
                              : session.title.replace("Table ", "T")}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-[#24312e]">
                                {session.title}
                                {session.customer &&
                                session.customer !== "Dining Guest" &&
                                !session.title
                                  .toLowerCase()
                                  .includes(session.customer.toLowerCase())
                                  ? ` (${session.customer})`
                                  : ""}
                              </p>
                              {session.deposit > 0 && (
                                <span className="rounded bg-amber-100 text-amber-900 px-1.5 py-0.2 text-[10px] font-bold">
                                  Deposit: {currencySymbol}
                                  {session.deposit}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-[#84908a]">
                              {session.guests} guests • Server:{" "}
                              <span className="text-[#24312e] font-semibold">
                                {session.server || "Unassigned"}
                              </span>
                            </p>
                            <p className="text-[11px] text-[#68736e] mt-1 line-clamp-1">
                              {session.items
                                .map((it) => `${it.qty}x ${it.name}`)
                                .join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#f0f1ed] flex sm:flex-col justify-between sm:justify-start items-baseline sm:items-end">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#84908a] block">
                              Subtotal
                            </span>
                            <p className="font-extrabold text-base text-[#24312e]">
                              {currencySymbol}
                              {session.subtotal.toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-0.5 ${isSelected ? "text-[#315a3d]" : "text-[#b7623d]"}`}
                          >
                            {isSelected
                              ? "Active in Terminal ✓"
                              : "Settle Bill →"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom quick action bar */}
            <div className="mt-6 pt-4 border-t border-[#e9eae6] flex items-center justify-between text-xs text-[#84908a]">
              <span>
                Displaying <strong>{filteredSessions.length}</strong> active
                billable sessions
              </span>
              <button
                onClick={async () => {
                  try {
                    const [freshOrders, freshTables] = await Promise.all([
                      fetchOrders(),
                      fetchTables(),
                    ]);
                    if (onOrdersChange) onOrdersChange(freshOrders);
                    showToast(
                      "info",
                      "Sessions Refreshed",
                      "Loaded updated orders and floor tickets from server.",
                    );
                  } catch {
                    showToast(
                      "error",
                      "Refresh Failed",
                      "Could not refresh from server.",
                    );
                  }
                }}
                className="flex items-center gap-1 font-bold text-[#24312e] hover:underline cursor-pointer"
              >
                <RefreshCw size={13} />
                Refresh Tickets
              </button>
            </div>
          </div>

          {/* Right Column: Live Terminal & POS Checkout */}
          <aside className="rounded-3xl border border-[#dfe1dc] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            {!selectedSession ? (
              <div className="flex h-full min-h-[460px] flex-col items-center justify-center p-6 text-center text-[#84908a]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f2ed] text-[#24312e] mb-3">
                  <CheckCircle2 size={28} className="text-emerald-700" />
                </div>
                <p className="font-bold text-base text-[#24312e]">
                  No Active Session Selected
                </p>
                <p className="text-xs mt-1.5 max-w-xs text-[#84908a]">
                  All active table bills have been settled, or select an open
                  table from the list on the left to proceed with billing.
                </p>
              </div>
            ) : (
              <>
                <div>
                  {/* Receipt Header */}
                  <div className="flex items-center justify-between border-b border-[#e9eae6] pb-4">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="h-10 w-10 rounded-xl object-contain border border-[#dfe1dc] bg-white p-0.5"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
                          <ChefHat size={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm text-[#24312e]">
                          {restroName}
                        </h3>
                        <p className="text-[10px] text-[#84908a] uppercase tracking-wider font-semibold">
                          {selectedSession.title}
                          {selectedSession.customer &&
                          selectedSession.customer !== "Dining Guest" &&
                          !selectedSession.title
                            .toLowerCase()
                            .includes(selectedSession.customer.toLowerCase())
                            ? ` (${selectedSession.customer})`
                            : ""}{" "}
                          · POS Checkout
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        executeDirectPrint({
                          invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
                          title: selectedSession.title,
                          customer: selectedSession.customer,
                          server: selectedSession.server,
                          date: new Date().toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }),
                          time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                          items: selectedSession.items,
                          subtotal,
                          taxRate: effectiveTaxRate,
                          taxAmount,
                          serviceCharge: effectiveServiceRate,
                          serviceChargeAmount,
                          discountAmount,
                          depositCredit,
                          total: finalPayable,
                          paymentMethod,
                          cashTendered:
                            paymentMethod === "Cash" && tenderedNum
                              ? tenderedNum
                              : undefined,
                          changeDue:
                            paymentMethod === "Cash" && tenderedNum
                              ? changeDue
                              : undefined,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3 py-1.5 text-xs font-bold text-[#24312e] hover:bg-[#f0f1ed] transition cursor-pointer shadow-2xs"
                      title="Print preview slip"
                    >
                      <Printer size={14} />
                      <span>Print Slip</span>
                    </button>
                  </div>

                  {/* Guest & Servant Selector (Editable in billing) */}
                  <div className="my-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f7f8f5] px-3.5 py-2.5 text-xs text-[#68736e]">
                    <span>
                      Guest:{" "}
                      <strong className="text-[#24312e]">
                        {selectedSession.customer}
                      </strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#45504b]">
                        Servant:
                      </span>
                      <select
                        value={selectedSession.server || ""}
                        onChange={(e) =>
                          handleUpdateSessionServer(e.target.value)
                        }
                        className="rounded-lg border border-[#dfe1dc] bg-white px-2 py-1 text-xs font-bold text-[#24312e] outline-none focus:border-[#24312e] shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Assign Servant --</option>
                        {servants.map((s) => (
                          <option key={s.id || s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Itemized Order Items with Add & Remove Capabilities */}
                  <div className="space-y-2 border-b border-[#e9eae6] pb-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aa39d]">
                        Itemized Order Dishes (
                        {selectedSession.items.reduce((s, it) => s + it.qty, 0)}
                        )
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddItemModal(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#24312e] px-2 py-1 text-[11px] font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shadow-2xs"
                      >
                        <Plus size={12} />
                        <span>Add Dish</span>
                      </button>
                    </div>

                    {/* Quick Add Dish Modal / Popover */}
                    {showAddItemModal && (
                      <div className="rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 shadow-inner my-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-[#24312e]">
                            Add Dish to {selectedSession.title}
                            {selectedSession.customer &&
                            selectedSession.customer !== "Dining Guest" &&
                            !selectedSession.title
                              .toLowerCase()
                              .includes(selectedSession.customer.toLowerCase())
                              ? ` (${selectedSession.customer})`
                              : ""}
                          </span>
                          <button
                            onClick={() => setShowAddItemModal(false)}
                            className="text-[#84908a] hover:text-[#24312e]"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="relative mb-2">
                          <Search
                            size={13}
                            className="absolute left-2.5 top-2 text-[#84908a]"
                          />
                          <input
                            type="text"
                            placeholder="Search menu items..."
                            value={dishSearchQuery}
                            onChange={(e) => setDishSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-[#dfe1dc] bg-white pl-7 pr-2.5 py-1 text-xs outline-none focus:border-[#24312e]"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {menuItems
                            .filter((m) =>
                              m.name
                                .toLowerCase()
                                .includes(dishSearchQuery.toLowerCase()),
                            )
                            .slice(0, 10)
                            .map((dish) => {
                              const isUnavailable =
                                dish.available === false ||
                                soldOutItems.includes(dish.name) ||
                                (dish as any).status === "Unavailable";
                              return (
                                <div
                                  key={dish.id}
                                  className={`flex items-center justify-between rounded-lg p-2 text-xs border ${
                                    isUnavailable
                                      ? "bg-[#f5f5f2] border-dashed border-[#dfe1dc] opacity-60"
                                      : "bg-white border-[#eef0eb] hover:border-[#dfe1dc]"
                                  }`}
                                >
                                  <div>
                                    <p
                                      className={`font-bold ${isUnavailable ? "text-[#84908a] line-through" : "text-[#24312e]"}`}
                                    >
                                      {dish.name}
                                    </p>
                                    <span className="text-[10px] text-[#84908a]">
                                      {dish.category} · {currencySymbol}
                                      {dish.price}
                                    </span>
                                  </div>
                                  {isUnavailable ? (
                                    <span className="rounded-lg bg-gray-200/80 px-2 py-0.5 text-[11px] font-semibold text-gray-500 border border-gray-300/80 select-none cursor-not-allowed">
                                      Unavailable
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAddItemToSession(dish)
                                      }
                                      className="rounded-lg bg-[#e8f1e8] px-2.5 py-1 text-xs font-bold text-[#315a3d] hover:bg-[#315a3d] hover:text-white transition cursor-pointer"
                                    >
                                      + Add
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {selectedSession.items.length === 0 ? (
                        <div className="py-4 text-center text-[#84908a] text-xs">
                          No dishes in this bill. Click{" "}
                          <strong>+ Add Dish</strong> above to add items.
                        </div>
                      ) : (
                        selectedSession.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl bg-[#fafaf7] p-2 text-[#24312e] border border-[#f0f2ed]"
                          >
                            <div className="flex items-center gap-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center rounded-lg border border-[#dfe1dc] bg-white shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(idx, -1)}
                                  className="px-1.5 py-0.5 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] rounded-l-lg cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  -
                                </button>
                                <span className="px-1.5 text-xs font-black text-[#24312e]">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(idx, 1)}
                                  className="px-1.5 py-0.5 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] rounded-r-lg cursor-pointer"
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>

                              <div>
                                <span className="font-semibold block">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-[#84908a]">
                                  @{currencySymbol}
                                  {item.rate} each
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-bold">
                                {currencySymbol}
                                {item.total.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-[#b7623d] hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Dynamic Charges & Calculations */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-[#68736e]">
                      <span>F&B Subtotal</span>
                      <span className="font-semibold text-[#24312e]">
                        {currencySymbol}
                        {subtotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#68736e]">
                      <span className="flex items-center gap-1">
                        <span>GST / Tax ({taxRate}%)</span>
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] px-1 font-bold">
                          Dynamic
                        </span>
                      </span>
                      <span className="font-semibold text-emerald-700">
                        +{currencySymbol}
                        {taxAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[#68736e]">
                      <div className="flex items-center gap-2">
                        <span>Service Charge ({serviceCharge}%)</span>
                        <label className="flex items-center gap-1 text-[10px] text-[#84908a] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={waiveServiceCharge}
                            onChange={(e) =>
                              setWaiveServiceCharge(e.target.checked)
                            }
                            className="rounded accent-[#24312e]"
                          />
                          <span>Waive</span>
                        </label>
                      </div>
                      <span className="font-semibold text-indigo-700">
                        {waiveServiceCharge ? (
                          <span className="line-through text-[#84908a]">
                            +{currencySymbol}
                            {((subtotal * serviceCharge) / 100).toFixed(2)}
                          </span>
                        ) : (
                          `+${currencySymbol}${serviceChargeAmount.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    {/* Discount */}
                    <div className="rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#68736e] mb-1.5">
                        <span className="flex items-center gap-1">
                          <Tag size={12} className="text-[#b7623d]" />
                          <span>Promotional Discount</span>
                        </span>
                        {discountAmount > 0 && (
                          <span className="text-emerald-700 font-extrabold">
                            -{currencySymbol}
                            {discountAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {[
                          { label: "0%", val: 0 },
                          { label: "5%", val: 5 },
                          { label: "10%", val: 10 },
                          { label: "15%", val: 15 },
                        ].map((d) => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => {
                              setDiscountPercent(d.val);
                              setCustomDiscountInput("");
                            }}
                            className={`flex-1 rounded-lg py-1 text-[11px] font-bold transition ${
                              discountPercent === d.val && !customDiscountInput
                                ? "bg-[#24312e] text-white shadow-2xs"
                                : "bg-white border border-[#dfe1dc] text-[#68736e] hover:bg-[#f0f1ed]"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Advance Booking Deposit Adjustment */}
                    {depositCredit > 0 && (
                      <div className="flex justify-between items-center text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        <div>
                          <p className="font-bold">Booking Deposit Credit</p>
                          <p className="text-[10px] text-amber-700">
                            Paid in advance via reservation
                          </p>
                        </div>
                        <span className="font-extrabold text-sm">
                          -{currencySymbol}
                          {depositCredit.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="border-t border-[#e9eae6] pt-3 flex items-baseline justify-between">
                      <div>
                        <span className="font-bold text-sm text-[#24312e] block">
                          Net Payable Total
                        </span>
                        <span className="text-[10px] text-[#84908a]">
                          Including all dynamic taxes
                        </span>
                      </div>
                      <span className="display-font font-black text-2xl text-[#24312e]">
                        {currencySymbol}
                        {finalPayable.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="mt-4 pt-3 border-t border-[#e9eae6]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aa39d] mb-2">
                      Select POS Terminal Mode
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "UPI", icon: QrCode, label: "POS Scanner" },
                        { id: "Card", icon: CreditCard, label: "POS Card" },
                        { id: "Cash", icon: Banknote, label: "Cash" },
                        { id: "Split", icon: Split, label: "Split" },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSel = paymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(m.id as any);
                              setPaymentError(null);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-bold transition cursor-pointer ${
                              isSel
                                ? "bg-[#24312e] text-white shadow-xs"
                                : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f0f1ed]"
                            }`}
                          >
                            <Icon size={16} />
                            <span className="text-[11px]">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mode 1: Interactive POS Scanner Machine UI */}
                    {paymentMethod === "UPI" && (
                      <div className="mt-3 rounded-2xl border border-[#2d3b37] bg-[#1a2321] p-4 text-white shadow-md">
                        <div className="flex items-center justify-between border-b border-[#2d3b37] pb-2 text-[10px]">
                          <span className="flex items-center gap-1.5 font-mono font-bold text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                            POS SCANNER TERMINAL #TT-SCAN-01
                          </span>
                          <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-emerald-300 font-bold border border-emerald-800">
                            READY TO SCAN
                          </span>
                        </div>

                        <div className="my-3 flex flex-col sm:flex-row items-center gap-4">
                          {/* Realistic QR Scanner Box with Animated Laser Beam */}
                          <div className="relative flex h-28 w-28 items-center justify-center rounded-xl bg-white p-2 shadow-inner shrink-0 overflow-hidden border-2 border-emerald-500">
                            <QrCode size={92} className="text-[#1a2321]" />
                            {/* Animated Laser Sweep */}
                            <div className="scanner-beam absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10b981]" />
                          </div>

                          <div className="text-center sm:text-left">
                            <p className="font-bold text-sm text-emerald-100">
                              {restroName} POS Pay
                            </p>
                            <p className="text-[10px] text-[#9ca3af]">
                              Merchant ID: TT-POS-882910
                            </p>
                            <p className="mt-2 text-xs font-medium text-emerald-300">
                              Scan to pay{" "}
                              <span className="text-base font-black text-white">
                                {currencySymbol}
                                {finalPayable.toFixed(2)}
                              </span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1 justify-center sm:justify-start text-[9px] font-bold text-gray-300">
                              <span className="rounded bg-white/10 px-1.5 py-0.5">
                                Google Pay
                              </span>
                              <span className="rounded bg-white/10 px-1.5 py-0.5">
                                PhonePe
                              </span>
                              <span className="rounded bg-white/10 px-1.5 py-0.5">
                                Paytm
                              </span>
                              <span className="rounded bg-white/10 px-1.5 py-0.5">
                                BHIM
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mode 2: Interactive POS Card Terminal UI */}
                    {paymentMethod === "Card" && (
                      <div className="mt-3 rounded-2xl border border-[#2d3b37] bg-[#1a2321] p-4 text-white shadow-md">
                        <div className="flex items-center justify-between border-b border-[#2d3b37] pb-2 text-[10px]">
                          <span className="flex items-center gap-1.5 font-mono font-bold text-indigo-400">
                            <CreditCard size={13} className="text-indigo-400" />
                            POS SMART TERMINAL #TT-CARD-09
                          </span>
                          <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-indigo-300 font-bold border border-indigo-800">
                            INSERT OR TAP
                          </span>
                        </div>

                        <div className="my-3 space-y-3">
                          <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5 border border-white/10 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-11 items-center justify-center rounded bg-gradient-to-r from-amber-600 to-amber-700 text-[9px] font-bold text-white shadow-2xs">
                                CHIP
                              </div>
                              <div>
                                <p className="font-mono font-bold text-white">
                                  •••• •••• •••• 4092
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  Visa / Mastercard Contactless
                                </p>
                              </div>
                            </div>
                            <span className="font-extrabold text-sm text-emerald-400">
                              {currencySymbol}
                              {finalPayable.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-300">
                            <span>Terminal Auth Code:</span>
                            <input
                              type="text"
                              value={cardAuthCode}
                              onChange={(e) => setCardAuthCode(e.target.value)}
                              className="rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-mono font-bold text-white outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mode 3: Cash */}
                    {paymentMethod === "Cash" && (
                      <div className="mt-3 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <label className="font-bold text-[#24312e]">
                            Cash Tendered:
                          </label>
                          <input
                            type="number"
                            placeholder={String(finalPayable)}
                            value={cashTenderedInput}
                            onChange={(e) =>
                              setCashTenderedInput(e.target.value)
                            }
                            className="w-28 rounded-lg border border-[#dfe1dc] bg-white px-2.5 py-1 text-right text-xs font-bold outline-none focus:border-[#24312e]"
                          />
                        </div>
                        {tenderedNum > 0 && (
                          <div className="mt-2 flex items-center justify-between border-t border-[#e9eae6] pt-2 text-[#315a3d] font-bold">
                            <span>Change to return:</span>
                            <span>
                              {currencySymbol}
                              {changeDue.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode 4: Split */}
                    {paymentMethod === "Split" && (
                      <div className="mt-3 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#24312e]">
                            Split between guests:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSplitCount((c) => Math.max(2, c - 1))
                              }
                              className="h-6 w-6 rounded bg-[#dfe1dc] font-bold text-xs hover:bg-[#d0d3cd] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-sm text-[#24312e]">
                              {splitCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSplitCount((c) => c + 1)}
                              className="h-6 w-6 rounded bg-[#dfe1dc] font-bold text-xs hover:bg-[#d0d3cd] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 border-t border-[#e9eae6] pt-2 flex justify-between font-bold text-[#315a3d]">
                          <span>Each guest pays:</span>
                          <span>
                            {currencySymbol}
                            {(finalPayable / splitCount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Failure Error Banner */}
                  {paymentError && (
                    <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2.5">
                      <XCircle
                        size={17}
                        className="text-red-600 shrink-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-red-900">Payment Failed</p>
                        <p className="mt-0.5 text-red-700">{paymentError}</p>
                        <p className="mt-1 text-[11px] text-red-600 font-medium">
                          Table ticket remains active. Please retry payment or
                          switch mode.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPaymentError(null)}
                        className="text-red-400 hover:text-red-700 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions with Success and Failure Testing Controls */}
                <div className="mt-5 pt-4 border-t border-[#e9eae6] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#84908a] px-1">
                    <span>Testing Simulation Controls:</span>
                    <span className="text-[#24312e]">
                      Instant POS Emulation
                    </span>
                  </div>

                  {/* Success Button */}
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handlePaymentSuccess}
                    className="w-full rounded-xl bg-[#24312e] px-4 py-3 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check size={16} />
                    <span>Simulate Payment Success & Print Bill</span>
                  </button>

                  {/* Failure Button */}
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={() => handlePaymentFailure()}
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 hover:border-red-300 transition cursor-pointer shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={15} className="text-red-600" />
                    <span>Simulate Payment Failure (Test Error State)</span>
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* On-Screen Thermal Receipt Preview & Print Modal */}
      {receiptModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#dfe1dc]">
            <button
              onClick={() => setReceiptModalInvoice(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#84908a] hover:bg-[#f0f1ed] hover:text-[#24312e] transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Authentic Thermal Receipt Design */}
            <div className="rounded-2xl border border-[#e5e7e0] bg-[#fafaf7] p-5 font-mono text-xs text-[#24312e] shadow-inner">
              <div className="text-center pb-3 border-b border-dashed border-[#ccc]">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-9 w-9 mx-auto object-contain rounded-lg mb-1"
                  />
                )}
                <h3 className="font-bold text-base tracking-tight">
                  {restroName}
                </h3>
                <p className="text-[10px] text-[#68736e]">{branchName}</p>
                <p className="text-[10px] text-[#84908a]">GSTIN: {gstNumber}</p>
                <p className="text-[10px] font-bold mt-1 text-[#315a3d]">
                  *** TAX INVOICE ***
                </p>
              </div>

              <div className="py-2.5 border-b border-dashed border-[#ccc] text-[10px] space-y-0.5 text-[#68736e]">
                <div className="flex justify-between">
                  <span>Bill No: {receiptModalInvoice.invoiceNo}</span>
                  <span>{receiptModalInvoice.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {receiptModalInvoice.title} ({receiptModalInvoice.customer})
                  </span>
                  <span>{receiptModalInvoice.date}</span>
                </div>
                <div>
                  Server:{" "}
                  <span className="font-bold text-[#24312e]">
                    {receiptModalInvoice.server}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2.5 border-b border-dashed border-[#ccc]">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-[#ddd] text-left">
                      <th className="pb-1">Qty</th>
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-right">Rate</th>
                      <th className="pb-1 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee]">
                    {receiptModalInvoice.items &&
                      receiptModalInvoice.items.map((it: any, i: number) => (
                        <tr key={i}>
                          <td className="py-1">{it.qty}</td>
                          <td className="py-1">{it.name}</td>
                          <td className="py-1 text-right">{it.rate}</td>
                          <td className="py-1 text-right font-bold">
                            {it.total}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary */}
              <div className="py-2.5 border-b border-dashed border-[#ccc] text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {currencySymbol}
                    {Number(receiptModalInvoice.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({receiptModalInvoice.taxRate ?? taxRate}%)</span>
                  <span>
                    +{currencySymbol}
                    {Number(receiptModalInvoice.taxAmount).toFixed(2)}
                  </span>
                </div>
                {receiptModalInvoice.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Service Charge ({receiptModalInvoice.serviceCharge}%)
                    </span>
                    <span>
                      +{currencySymbol}
                      {Number(receiptModalInvoice.serviceChargeAmount).toFixed(
                        2,
                      )}
                    </span>
                  </div>
                )}
                {receiptModalInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Discount</span>
                    <span>
                      -{currencySymbol}
                      {Number(receiptModalInvoice.discountAmount).toFixed(2)}
                    </span>
                  </div>
                )}
                {receiptModalInvoice.depositCredit > 0 && (
                  <div className="flex justify-between text-amber-900">
                    <span>Deposit Credit</span>
                    <span>
                      -{currencySymbol}
                      {Number(receiptModalInvoice.depositCredit).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="py-2.5 border-b-2 border-double border-[#000] flex justify-between text-sm font-black">
                <span>TOTAL PAID</span>
                <span>
                  {currencySymbol}
                  {Number(receiptModalInvoice.total).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Status:</span>
                  <span className="text-[#3b724c]">
                    PAID via {receiptModalInvoice.paymentMethod}
                  </span>
                </div>
                {receiptModalInvoice.cashTendered && (
                  <>
                    <div className="flex justify-between">
                      <span>Cash Tendered:</span>
                      <span>
                        {currencySymbol}
                        {Number(receiptModalInvoice.cashTendered).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>
                        {currencySymbol}
                        {Number(receiptModalInvoice.changeDue).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 pt-2 text-center text-[9px] text-[#84908a] border-t border-dashed border-[#ccc]">
                <p className="italic">"{receiptFooter}"</p>
                <p className="mt-1 font-bold">*** VISIT AGAIN ***</p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-[#24312e] py-3 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalInvoice(null)}
                className="rounded-xl border border-[#dfe1dc] bg-white px-4 py-3 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Bill Creation Modal */}
      <ManualBillModal
        isOpen={showManualBillModal}
        onClose={() => setShowManualBillModal(false)}
        tables={tables}
        menuItems={menuItems}
        soldOutItems={soldOutItems}
        servants={servants}
        taxRate={taxRate}
        serviceCharge={serviceCharge}
        currencySymbol={currencySymbol}
        onOrderCreated={onOrderCreated}
        onTableStatusChange={onTableStatusChange}
        showToast={showToast}
        role={role}
      />
    </>
  );
}

function AddEmployeeModal({
  onClose,
  onSave,
  departments = [
    "Floor",
    "Kitchen",
    "Bar",
    "Cleaning",
    "Utility",
    "Management",
  ],
  onAddDepartment,
}: {
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    pin: string;
    department: string;
    shift: string;
  }) => Promise<void>;
  departments?: string[];
  onAddDepartment?: (name: string) => Promise<any>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("1234");
  const [department, setDepartment] = useState(departments[0] || "Floor");
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState("");
  const [shift, setShift] = useState("09:00 - 17:00");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Full Name and Phone Number are required.");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    let finalDept = department;
    if (isCustomDept) {
      if (!customDeptInput.trim()) {
        setError("Please specify a department name.");
        return;
      }
      finalDept = customDeptInput.trim();
      if (onAddDepartment) {
        try {
          await onAddDepartment(finalDept);
        } catch {}
      }
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        department: finalDept,
        shift: shift.trim() || "09:00 - 17:00",
      });
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#dfe1dc]">
        <div className="flex items-center justify-between border-b border-[#f0f1ed] pb-3">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-[#315a3d]" />
            <div>
              <h3 className="display-font text-lg font-bold text-[#24312e]">
                Add New Employee
              </h3>
              <p className="text-[11px] text-[#84908a]">
                Register staff for attendance and shift roster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#84908a] hover:text-[#24312e] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Singh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98201 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                4-Digit PIN{" "}
                <span className="font-normal text-[#84908a]">
                  (Mobile GPS Punch)
                </span>
              </label>
              <input
                type="text"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 font-mono outline-hidden focus:border-[#24312e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#24312e]">
                  Department
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDept(!isCustomDept);
                    setCustomDeptInput("");
                  }}
                  className="text-[10px] font-bold text-[#315a3d] hover:underline cursor-pointer"
                >
                  {isCustomDept ? "Select existing" : "+ Add new"}
                </button>
              </div>
              {isCustomDept ? (
                <input
                  type="text"
                  autoFocus
                  placeholder="New department..."
                  value={customDeptInput}
                  onChange={(e) => setCustomDeptInput(e.target.value)}
                  className="w-full rounded-xl border border-[#315a3d] bg-white p-2.5 outline-hidden font-semibold"
                />
              ) : (
                <select
                  value={department}
                  onChange={(e) => {
                    if (e.target.value === "__NEW__") {
                      setIsCustomDept(true);
                      setCustomDeptInput("");
                    } else {
                      setDepartment(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden font-semibold"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add New Department...</option>
                </select>
              )}
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Shift Hours
              </label>
              <input
                type="text"
                placeholder="09:00 - 17:00"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-[#f0f1ed] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer"
            >
              {isSaving ? "Saving..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({
  staff,
  onClose,
  onSave,
  departments = [
    "Floor",
    "Kitchen",
    "Bar",
    "Cleaning",
    "Utility",
    "Management",
  ],
  onAddDepartment,
}: {
  staff: StaffMember;
  onClose: () => void;
  onSave: (id: string, data: Partial<StaffMember>) => Promise<void>;
  departments?: string[];
  onAddDepartment?: (name: string) => Promise<any>;
}) {
  const [name, setName] = useState(staff.name);
  const [phone, setPhone] = useState(staff.phone);
  const [pin, setPin] = useState(staff.pin);
  const [department, setDepartment] = useState(staff.department);
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState("");
  const [shift, setShift] = useState(staff.shift);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deptOptions = Array.from(
    new Set([...departments, staff.department]),
  ).filter(Boolean);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Name and Phone are required.");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    let finalDept = department;
    if (isCustomDept) {
      if (!customDeptInput.trim()) {
        setError("Please specify a department name.");
        return;
      }
      finalDept = customDeptInput.trim();
      if (onAddDepartment) {
        try {
          await onAddDepartment(finalDept);
        } catch {}
      }
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(staff.id, {
        name: name.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        department: finalDept,
        shift,
      });
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#dfe1dc]">
        <div className="flex items-center justify-between border-b border-[#f0f1ed] pb-3">
          <div className="flex items-center gap-2">
            <Pencil size={18} className="text-[#315a3d]" />
            <div>
              <h3 className="display-font text-lg font-bold text-[#24312e]">
                Edit Employee
              </h3>
              <p className="text-[11px] text-[#84908a]">{staff.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#84908a] hover:text-[#24312e] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                4-Digit PIN{" "}
                <span className="font-normal text-[#84908a]">
                  (Mobile GPS Punch)
                </span>
              </label>
              <input
                type="text"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 font-mono outline-hidden focus:border-[#24312e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#24312e]">
                  Department
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDept(!isCustomDept);
                    setCustomDeptInput("");
                  }}
                  className="text-[10px] font-bold text-[#315a3d] hover:underline cursor-pointer"
                >
                  {isCustomDept ? "Select existing" : "+ Add new"}
                </button>
              </div>
              {isCustomDept ? (
                <input
                  type="text"
                  autoFocus
                  placeholder="New department..."
                  value={customDeptInput}
                  onChange={(e) => setCustomDeptInput(e.target.value)}
                  className="w-full rounded-xl border border-[#315a3d] bg-white p-2.5 outline-hidden font-semibold"
                />
              ) : (
                <select
                  value={department}
                  onChange={(e) => {
                    if (e.target.value === "__NEW__") {
                      setIsCustomDept(true);
                      setCustomDeptInput("");
                    } else {
                      setDepartment(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden font-semibold"
                >
                  {deptOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add New Department...</option>
                </select>
              )}
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Shift Hours
              </label>
              <input
                type="text"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-[#f0f1ed] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddDashboardMemberModal({
  onClose,
  onSave,
  departments = [
    "Floor",
    "Kitchen",
    "Bar",
    "Cleaning",
    "Utility",
    "Management",
  ],
  onAddDepartment,
}: {
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    password: string;
    systemRole: "Manager" | "Server" | "Kitchen";
    department: string;
    phone?: string;
  }) => Promise<void>;
  departments?: string[];
  onAddDepartment?: (name: string) => Promise<any>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo123");
  const [systemRole, setSystemRole] = useState<
    "Manager" | "Server" | "Kitchen"
  >("Server");
  const [department, setDepartment] = useState(
    departments.find((d) => d.toLowerCase().includes("floor")) ||
      departments[0] ||
      "Floor",
  );
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (newRole: "Manager" | "Server" | "Kitchen") => {
    setSystemRole(newRole);
    if (newRole === "Manager") {
      const found = departments.find((d) => d.toLowerCase().includes("manage"));
      setDepartment(found || "Management");
    } else if (newRole === "Kitchen") {
      const found = departments.find((d) =>
        d.toLowerCase().includes("kitchen"),
      );
      setDepartment(found || "Kitchen");
    } else {
      const found = departments.find((d) => d.toLowerCase().includes("floor"));
      setDepartment(found || "Floor");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, Dashboard Email, and Password are required.");
      return;
    }
    let finalDept = department;
    if (isCustomDept) {
      if (!customDeptInput.trim()) {
        setError("Please enter a department name.");
        return;
      }
      finalDept = customDeptInput.trim();
      if (onAddDepartment) {
        try {
          await onAddDepartment(finalDept);
        } catch {}
      }
    }
    setIsSaving(true);
    setError(null);
    try {
      const generatedPhone =
        phone.trim() || `+91 98201 ${Date.now().toString().slice(-5)}`;
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        systemRole,
        department: finalDept,
        phone: generatedPhone,
      });
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#dfe1dc]">
        <div className="flex items-center justify-between border-b border-[#f0f1ed] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#315a3d]" />
            <div>
              <h3 className="display-font text-lg font-bold text-[#24312e]">
                Add Dashboard Access
              </h3>
              <p className="text-[11px] text-[#84908a]">
                Create station login credentials for Kitchen, Servant, or
                Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#84908a] hover:text-[#24312e] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chef Sanjay Kumar"
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (!email || email.includes("@tableandthyme.com")) {
                  setEmail(
                    val
                      ? `${val.toLowerCase().replace(/[^a-z0-9]/g, ".")}@tableandthyme.com`
                      : "",
                  );
                }
              }}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Station Access Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange("Manager")}
                className={`rounded-xl border p-2.5 text-center font-bold transition cursor-pointer ${
                  systemRole === "Manager"
                    ? "border-amber-500 bg-amber-50 text-amber-900 shadow-xs"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <ShieldCheck
                  className="mx-auto mb-1 text-amber-700"
                  size={18}
                />
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("Server")}
                className={`rounded-xl border p-2.5 text-center font-bold transition cursor-pointer ${
                  systemRole === "Server"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <Users className="mx-auto mb-1 text-emerald-700" size={18} />
                Servant / Floor
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("Kitchen")}
                className={`rounded-xl border p-2.5 text-center font-bold transition cursor-pointer ${
                  systemRole === "Kitchen"
                    ? "border-purple-500 bg-purple-50 text-purple-900 shadow-xs"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <ChefHat className="mx-auto mb-1 text-purple-700" size={18} />
                Kitchen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Dashboard Work Email{" "}
                <span className="font-normal text-[#84908a]">(Login)</span>
              </label>
              <input
                type="email"
                required
                placeholder="email@tableandthyme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Dashboard Password{" "}
                <span className="font-normal text-[#84908a]">(Login)</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. demo123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 font-mono outline-hidden focus:border-[#24312e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#24312e]">
                  Department
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDept(!isCustomDept);
                    setCustomDeptInput("");
                  }}
                  className="text-[10px] font-bold text-[#315a3d] hover:underline cursor-pointer"
                >
                  {isCustomDept ? "Select existing" : "+ Add new"}
                </button>
              </div>
              {isCustomDept ? (
                <input
                  type="text"
                  autoFocus
                  placeholder="New department..."
                  value={customDeptInput}
                  onChange={(e) => setCustomDeptInput(e.target.value)}
                  className="w-full rounded-xl border border-[#315a3d] bg-white p-2.5 outline-hidden font-semibold"
                />
              ) : (
                <select
                  value={department}
                  onChange={(e) => {
                    if (e.target.value === "__NEW__") {
                      setIsCustomDept(true);
                      setCustomDeptInput("");
                    } else {
                      setDepartment(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add New Department...</option>
                </select>
              )}
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="+91 98201 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-[#f0f1ed] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer"
            >
              {isSaving ? "Creating Access..." : "Grant Dashboard Access"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDashboardMemberModal({
  staff,
  onClose,
  onSave,
  departments = [
    "Floor",
    "Kitchen",
    "Bar",
    "Cleaning",
    "Utility",
    "Management",
  ],
  onAddDepartment,
}: {
  staff: StaffMember;
  onClose: () => void;
  onSave: (id: string, data: Partial<StaffMember>) => Promise<void>;
  departments?: string[];
  onAddDepartment?: (name: string) => Promise<any>;
}) {
  const [name, setName] = useState(staff.name);
  const [email, setEmail] = useState(staff.email || "");
  const [password, setPassword] = useState(staff.password || "demo123");
  const [systemRole, setSystemRole] = useState<
    "Manager" | "Server" | "Kitchen"
  >(
    staff.systemRole === "Manager" || staff.systemRole === "Kitchen"
      ? staff.systemRole
      : "Server",
  );
  const [department, setDepartment] = useState(staff.department);
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allDepts = Array.from(
    new Set([...departments, staff.department]),
  ).filter(Boolean);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, Email, and Password are required.");
      return;
    }
    let finalDept = department;
    if (isCustomDept) {
      if (!customDeptInput.trim()) {
        setError("Please specify a department name.");
        return;
      }
      finalDept = customDeptInput.trim();
      if (onAddDepartment) {
        try {
          await onAddDepartment(finalDept);
        } catch {}
      }
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(staff.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        systemRole,
        department: finalDept,
      });
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#dfe1dc]">
        <div className="flex items-center justify-between border-b border-[#f0f1ed] pb-3">
          <div className="flex items-center gap-2">
            <Pencil size={18} className="text-[#315a3d]" />
            <div>
              <h3 className="display-font text-lg font-bold text-[#24312e]">
                Edit Dashboard Access
              </h3>
              <p className="text-[11px] text-[#84908a]">{staff.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#84908a] hover:text-[#24312e] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Station Access Role
            </label>
            <select
              value={systemRole}
              onChange={(e) =>
                setSystemRole(
                  e.target.value as "Manager" | "Server" | "Kitchen",
                )
              }
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden font-bold"
            >
              <option value="Manager">Manager (Full Control Desk)</option>
              <option value="Server">Server (Servant / Floor Station)</option>
              <option value="Kitchen">Kitchen (Kitchen Head Station)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Dashboard Work Email{" "}
                <span className="font-normal text-[#84908a]">(Login)</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Dashboard Password{" "}
                <span className="font-normal text-[#84908a]">(Login)</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 font-mono outline-hidden focus:border-[#24312e]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#24312e]">
                Department
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomDept(!isCustomDept);
                  setCustomDeptInput("");
                }}
                className="text-[10px] font-bold text-[#315a3d] hover:underline cursor-pointer"
              >
                {isCustomDept ? "Select existing" : "+ Add new"}
              </button>
            </div>
            {isCustomDept ? (
              <input
                type="text"
                autoFocus
                placeholder="New department..."
                value={customDeptInput}
                onChange={(e) => setCustomDeptInput(e.target.value)}
                className="w-full rounded-xl border border-[#315a3d] bg-white p-2.5 outline-hidden font-semibold"
              />
            ) : (
              <select
                value={department}
                onChange={(e) => {
                  if (e.target.value === "__NEW__") {
                    setIsCustomDept(true);
                    setCustomDeptInput("");
                  } else {
                    setDepartment(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden font-semibold"
              >
                {allDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="__NEW__">+ Add New Department...</option>
              </select>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-[#f0f1ed] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GeofenceModal({
  settings,
  onClose,
  onSaved,
}: {
  settings: RestaurantSettings | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [geoLat, setGeoLat] = useState<number>(settings?.latitude || 28.5355);
  const [geoLng, setGeoLng] = useState<number>(settings?.longitude || 77.391);
  const [geoRadius, setGeoRadius] = useState<number>(
    settings?.radiusMeters || 50,
  );
  const [detectingGps, setDetectingGps] = useState(false);
  const [isSavingGeo, setIsSavingGeo] = useState(false);

  const handleSaveGeofence = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingGeo(true);
    try {
      await updateRestaurantSettings({
        latitude: geoLat,
        longitude: geoLng,
        radiusMeters: geoRadius,
      });
      onSaved();
      onClose();
    } catch (err) {
      alert("Failed to save geofence: " + String(err));
    } finally {
      setIsSavingGeo(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        try {
          await updateRestaurantSettings({
            latitude: lat,
            longitude: lng,
            radiusMeters: geoRadius || 50,
          });
          onSaved();
          alert(
            `✓ Restaurant GPS successfully synced to your current coordinates (${lat}°, ${lng}°)!`,
          );
          onClose();
        } catch (err) {
          console.error("Auto save failed:", err);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        alert(
          "GPS Error: " +
            err.message +
            ". Please ensure location permissions are enabled in your browser.",
        );
        setDetectingGps(false);
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#dfe1dc]">
        <div className="flex items-center justify-between border-b border-[#f0f1ed] pb-3">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-[#315a3d]" />
            <h3 className="display-font text-lg font-bold text-[#24312e]">
              Configure Restaurant Geofence
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#84908a] hover:text-[#24312e] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSaveGeofence} className="mt-4 space-y-3 text-xs">
          <p className="text-[#68736e] leading-relaxed">
            Set the physical GPS location of Table & Thyme. Employees must be
            within the specified radius to clock in.
          </p>
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={detectingGps}
            className="w-full rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation size={15} />
            {detectingGps
              ? "Detecting Device Coordinates..."
              : "Set to My Current Location"}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                required
                value={geoLat}
                onChange={(e) => setGeoLat(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 font-mono outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                required
                value={geoLng}
                onChange={(e) => setGeoLng(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 font-mono outline-hidden"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Allowed Radius (Meters)
            </label>
            <input
              type="number"
              min={10}
              max={500}
              required
              value={geoRadius}
              onChange={(e) => setGeoRadius(parseInt(e.target.value, 10) || 50)}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden"
            />
            <p className="mt-1 text-[10px] text-[#84908a]">
              Recommended: 50 meters for standard restaurants; 75 meters for
              large properties.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-[#f0f1ed]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-[#68736e] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingGeo}
              className="rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#315a3d] cursor-pointer"
            >
              {isSavingGeo ? "Saving..." : "Save Geofence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnnouncementModal({
  staffList,
  onClose,
  onSaved,
}: {
  staffList: StaffMember[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annPriority, setAnnPriority] = useState<"Normal" | "Urgent">("Normal");
  const [annTarget, setAnnTarget] = useState<"All" | "Specific">("All");
  const [annTargetStaffId, setAnnTargetStaffId] = useState<string>("");
  const [isPostingAnn, setIsPostingAnn] = useState(false);

  const handleCreateAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annMessage) return;
    setIsPostingAnn(true);
    try {
      await createAnnouncement({
        senderName: "Manager",
        targetType: annTarget,
        targetStaffId: annTarget === "Specific" ? annTargetStaffId : null,
        title: annTitle,
        message: annMessage,
        priority: annPriority,
      });
      onSaved();
      onClose();
    } catch (err) {
      alert("Failed to post announcement: " + String(err));
    } finally {
      setIsPostingAnn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#dfe1dc]">
        <div className="flex items-center justify-between border-b border-[#f0f1ed] pb-3">
          <h3 className="display-font text-lg font-bold text-[#24312e]">
            Compose Notice
          </h3>
          <button
            onClick={onClose}
            className="text-[#84908a] hover:text-[#24312e] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={handleCreateAnnouncement}
          className="mt-4 space-y-3 text-xs"
        >
          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Notice Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule Update / Dinner Shift"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Target Audience
              </label>
              <select
                value={annTarget}
                onChange={(e) =>
                  setAnnTarget(e.target.value as "All" | "Specific")
                }
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden"
              >
                <option value="All">All Employees</option>
                <option value="Specific">Specific Employee</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Priority
              </label>
              <select
                value={annPriority}
                onChange={(e) =>
                  setAnnPriority(e.target.value as "Normal" | "Urgent")
                }
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          {annTarget === "Specific" && (
            <div>
              <label className="block font-bold text-[#24312e] mb-1">
                Select Employee
              </label>
              <select
                required
                value={annTargetStaffId}
                onChange={(e) => setAnnTargetStaffId(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden"
              >
                <option value="">-- Choose Employee --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block font-bold text-[#24312e] mb-1">
              Message
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter notice details for staff..."
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2.5 outline-hidden focus:border-[#24312e]"
            />
          </div>
          <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-[#f0f1ed]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-[#68736e] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPostingAnn}
              className="rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#315a3d] cursor-pointer"
            >
              {isPostingAnn ? "Posting..." : "Broadcast Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffAttendanceDetailModal({
  staff,
  onClose,
}: {
  staff: StaffMember;
  onClose: () => void;
}) {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [data, setData] = useState<StaffAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchStaffAttendanceHistory(
      staff.id,
      selectedMonth === "all" ? undefined : selectedMonth,
    )
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load attendance records",
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [staff.id, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === "all") {
      setSelectedMonth(currentMonthStr);
      return;
    }
    const [year, month] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const handleNextMonth = () => {
    if (selectedMonth === "all") {
      setSelectedMonth(currentMonthStr);
      return;
    }
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const formatMonthTitle = (monthStr: string) => {
    if (monthStr === "all") return "Complete Attendance History (All Time)";
    try {
      const [year, month] = monthStr.split("-").map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return monthStr;
    }
  };

  const monthOptions = (() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      opts.push({
        value: val,
        label: d.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    opts.push({ value: "all", label: "All Recorded History" });
    return opts;
  })();

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "--";
    try {
      return new Date(isoString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "--";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatMinutesToHours = (mins: number) => {
    if (!mins) return "0h 0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const filteredLogs = (data?.logs || []).filter((log) => {
    if (statusFilter === "All") return true;
    return log.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-[#dfe1dc] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e9eae6] bg-[#24312e] p-5 sm:p-6 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3d524b] text-lg font-bold text-[#f4bc83] shadow-md shrink-0">
              {staff.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="display-font text-xl font-bold text-white sm:text-2xl">
                  {staff.name}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    staff.todayStatus === "Clocked in"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : staff.todayStatus === "On break"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : staff.todayStatus === "Clocked out"
                          ? "bg-stone-500/20 text-stone-300 border border-stone-500/40"
                          : "bg-[#3d524b] text-[#cfe0d0]"
                  }`}
                >
                  ● Today: {staff.todayStatus}
                </span>
                {staff.systemRole !== "None" && (
                  <span className="rounded-full bg-[#f4bc83]/20 text-[#f4bc83] border border-[#f4bc83]/30 px-2 py-0.5 text-[10px] font-bold">
                    {staff.systemRole}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#aab8b0]">
                <span>
                  Dept:{" "}
                  <strong className="text-white">{staff.department}</strong>
                </span>
                <span>•</span>
                <span>
                  Shift: <strong className="text-white">{staff.shift}</strong>
                </span>
                <span>•</span>
                <span>
                  Phone: <strong className="text-white">{staff.phone}</strong>
                </span>
                <span>•</span>
                <span>
                  Mobile PIN:{" "}
                  <strong className="text-white font-mono">{staff.pin}</strong>
                </span>
                {staff.email && (
                  <>
                    <span>•</span>
                    <span>
                      Email:{" "}
                      <strong className="text-white">{staff.email}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#aab8b0] hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 bg-[#fbfaf7]">
          {/* Month Navigation & Filter Strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#dfe1dc] bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-xl border border-[#dfe1dc] bg-white p-2 text-[#24312e] hover:bg-[#f0f1ed] transition cursor-pointer shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#84908a] block">
                  Attendance Month
                </span>
                <h4 className="text-base font-bold text-[#24312e]">
                  {formatMonthTitle(selectedMonth)}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-xl border border-[#dfe1dc] bg-white p-2 text-[#24312e] hover:bg-[#f0f1ed] transition cursor-pointer shadow-2xs"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs font-bold text-[#24312e] outline-hidden cursor-pointer shadow-2xs focus:border-[#24312e]"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs font-bold text-[#68736e] outline-hidden cursor-pointer shadow-2xs focus:border-[#24312e]"
              >
                <option value="All">All Statuses</option>
                <option value="Clocked in">Clocked In</option>
                <option value="Clocked out">Clocked Out</option>
                <option value="On break">On Break</option>
              </select>
            </div>
          </div>

          {/* Month Summary KPI Stats */}
          {data?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-2xl border border-[#dfe1dc] bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#84908a] block">
                  Days Present
                </span>
                <p className="mt-1 text-xl font-black text-[#24312e]">
                  {data.summary.daysPresent} Days
                </p>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Shift Attendance
                </span>
              </div>

              <div className="rounded-2xl border border-[#dfe1dc] bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#84908a] block">
                  Total Work Time
                </span>
                <p className="mt-1 text-xl font-black text-[#315a3d]">
                  {data.summary.totalHoursWorked} hrs
                </p>
                <span className="text-[11px] text-[#68736e]">
                  Net of breaks
                </span>
              </div>

              <div className="rounded-2xl border border-[#dfe1dc] bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#84908a] block">
                  Total Break Time
                </span>
                <p className="mt-1 text-xl font-black text-amber-800">
                  {data.summary.totalBreakHours} hrs
                </p>
                <span className="text-[11px] text-[#84908a]">
                  ({data.summary.totalBreakMinutes} total mins)
                </span>
              </div>

              <div className="rounded-2xl border border-[#dfe1dc] bg-white p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#84908a] block">
                  Daily Avg Hours
                </span>
                <p className="mt-1 text-xl font-black text-[#24312e]">
                  {data.summary.avgDailyHours} hrs
                </p>
                <span className="text-[11px] text-[#68736e]">
                  Per active shift
                </span>
              </div>

              <div className="rounded-2xl border border-[#dfe1dc] bg-white p-3.5 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#84908a] block">
                  Punctuality Rate
                </span>
                <p className="mt-1 text-xl font-black text-emerald-700">
                  {data.summary.onTimeRate}%
                </p>
                <span className="text-[11px] text-[#68736e]">
                  On-time arrivals
                </span>
              </div>
            </div>
          )}

          {/* Daily Records Table */}
          <div className="rounded-2xl border border-[#dfe1dc] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#e9eae6] pb-3 mb-3">
              <h4 className="font-bold text-sm text-[#24312e] flex items-center gap-2">
                <Clock3 size={16} className="text-[#315a3d]" />
                Detailed Daily Attendance Logs ({filteredLogs.length})
              </h4>
              <span className="text-xs text-[#84908a]">
                Showing records for {formatMonthTitle(selectedMonth)}
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#84908a]">
                <Clock3
                  size={24}
                  className="mx-auto mb-2 animate-spin text-[#315a3d]"
                />
                Loading attendance history...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-xs text-red-600 font-semibold">
                {error}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#84908a] space-y-1">
                <p className="font-semibold text-[#24312e]">
                  No attendance punches found
                </p>
                <p>
                  No clock-in logs recorded for this employee during the
                  selected period.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-160">
                  <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-wider text-[#84908a]">
                    <tr>
                      <th className="pb-2.5">Date & Day</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Clock In</th>
                      <th className="pb-2.5">Clock Out</th>
                      <th className="pb-2.5">Break Time</th>
                      <th className="pb-2.5">Net Work Time</th>
                      <th className="pb-2.5 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f1ed]">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-[#fbfaf7] transition"
                      >
                        <td className="py-3">
                          <div className="font-bold text-[#24312e]">
                            {formatDate(log.date)}
                          </div>
                          <span className="text-[10px] text-[#84908a]">
                            Scheduled: {staff.shift}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              log.status === "Clocked in"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.status === "On break"
                                  ? "bg-amber-100 text-amber-800"
                                  : log.status === "Clocked out"
                                    ? "bg-stone-100 text-stone-800"
                                    : "bg-[#e8f1e8] text-[#315a3d]"
                            }`}
                          >
                            ● {log.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-[#24312e]">
                            {formatTime(log.clockIn)}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            {log.clockIn ? "Punch verified" : "--"}
                          </span>
                        </td>
                        <td className="py-3">
                          {log.clockOut ? (
                            <div className="font-bold text-[#24312e]">
                              {formatTime(log.clockOut)}
                            </div>
                          ) : log.status === "Clocked in" ||
                            log.status === "On break" ? (
                            <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Active Shift
                            </span>
                          ) : (
                            <span className="text-[#a1aaa4]">--</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-amber-900">
                            {log.totalBreakMinutes > 0
                              ? `${log.totalBreakMinutes} mins`
                              : "0 mins"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="font-mono font-bold text-[#315a3d]">
                            {formatMinutesToHours(
                              Number(log.workDurationMinutes),
                            )}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {log.managerOverride ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                              <ShieldCheck size={11} />
                              Manager Override
                            </span>
                          ) : log.distanceMeters !== null &&
                            log.distanceMeters !== undefined ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <MapPin size={11} />
                              GPS {log.distanceMeters}m (Verified)
                            </span>
                          ) : (
                            <span className="text-[#a1aaa4] text-[11px]">
                              --
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e9eae6] bg-white p-4 flex items-center justify-between text-xs shrink-0">
          <span className="text-[#84908a]">
            Employee ID: <strong className="text-[#24312e]">{staff.id}</strong>{" "}
            • Table & Thyme Attendance Register
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#24312e] px-4 py-2 font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeesPage({
  onOpenPortal,
  departments = [
    "Floor",
    "Kitchen",
    "Bar",
    "Cleaning",
    "Utility",
    "Management",
  ],
  onAddDepartment,
  onDeleteDepartment,
  currentUser,
  showToast,
}: {
  onOpenPortal?: () => void;
  departments?: string[];
  onAddDepartment?: (name: string) => Promise<any>;
  onDeleteDepartment?: (name: string) => Promise<any>;
  currentUser?: any;
  showToast?: any;
}) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<
    "staff" | "leaves" | "announcements"
  >("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaffAttendance, setViewingStaffAttendance] =
    useState<StaffMember | null>(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const blockDemoAction = (action: string) => {
    if (!currentUser?.isDemoAccount) return false;
    showToast?.(
      "error",
      "Demo access only",
      `${action} is disabled for the demo account.`,
    );
    return true;
  };

  const handleQuickAddDepartment = async () => {
    if (blockDemoAction("Adding departments")) return;
    const trimmed = newDeptInput.trim();
    if (!trimmed || !onAddDepartment) return;
    setIsAddingDept(true);
    try {
      await onAddDepartment(trimmed);
      setDeptFilter(trimmed);
      setNewDeptInput("");
      setShowAddDept(false);
    } catch (e) {
      alert("Failed to add department: " + String(e));
    } finally {
      setIsAddingDept(false);
    }
  };

  const loadData = () => {
    fetchStaff()
      .then(setStaffList)
      .catch(() => {});
    fetchRestaurantSettings()
      .then(setSettings)
      .catch(() => {});
    fetchLeaves()
      .then(setLeaves)
      .catch(() => {});
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateStaff = async (data: {
    name: string;
    phone: string;
    pin: string;
    department: string;
    shift: string;
  }) => {
    if (currentUser?.isDemoAccount) {
      if (showToast)
        showToast(
          "error",
          "Access Denied",
          "This feature is disabled for the demo account.",
        );
      return;
    }

    await createStaff({
      ...data,
      systemRole: "None",
      email: `${data.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@gmail.com`,
      password: "demo123",
    });
    loadData();
  };

  const handleUpdateStaff = async (id: string, data: Partial<StaffMember>) => {
    if (currentUser?.isDemoAccount) {
      if (showToast)
        showToast(
          "error",
          "Access Denied",
          "This feature is disabled for the demo account.",
        );
      return;
    }
    await updateStaff(id, data);
    loadData();
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (blockDemoAction("Deleting employees")) return;
    if (
      !confirm(
        `Are you sure you want to remove ${name} from employees? This action cannot be undone.`,
      )
    )
      return;
    try {
      await deleteStaff(id);
      loadData();
    } catch (err) {
      alert("Failed to delete employee: " + String(err));
    }
  };

  const handleToggleAttendance = async (
    staffId: string,
    currentStatus: string,
  ) => {
    try {
      if (currentStatus === "Clocked in") {
        await clockOutStaff(staffId);
      } else {
        await clockInStaff({ staffId, managerOverride: true });
      }
      loadData();
    } catch (err) {
      alert("Failed to update attendance: " + String(err));
    }
  };

  const handleLeaveStatusChange = async (
    id: number,
    status: "Approved" | "Rejected",
  ) => {
    try {
      await updateLeaveStatus(id, status, "Manager");
      loadData();
    } catch (err) {
      alert("Failed to update leave request: " + String(err));
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        try {
          await updateRestaurantSettings({
            latitude: lat,
            longitude: lng,
            radiusMeters: settings?.radiusMeters || 50,
          });
          loadData();
          alert(
            `✓ Restaurant GPS successfully synced to your current coordinates (${lat}°, ${lng}°)!`,
          );
        } catch (err) {
          console.error("Auto save failed:", err);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        alert(
          "GPS Error: " +
            err.message +
            ". Please ensure location permissions are enabled in your browser.",
        );
        setDetectingGps(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const clockedInCount = staffList.filter(
    (s) => s.todayStatus === "Clocked in" || s.todayStatus === "On break",
  ).length;
  const pendingLeavesCount = leaves.filter(
    (l) => l.status === "Pending",
  ).length;
  const attendanceRate =
    staffList.length > 0
      ? Math.round((clockedInCount / staffList.length) * 100)
      : 0;

  const filteredStaff = staffList.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.systemRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.phone.includes(searchQuery);
    const matchesDept = deptFilter === "All" || s.department === deptFilter;
    return matchesQuery && matchesDept;
  });

  const filterDepartments = ["All", ...departments];

  return (
    <>
      <SectionHeading
        eyebrow="Staff Directory"
        title="Employees & Attendance"
        description="Manage employee profiles, credentials, GPS geofenced attendance, leaves, and staff notices."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {onOpenPortal && (
              <button
                onClick={onOpenPortal}
                className="flex items-center gap-2 rounded-xl bg-[#f4bc83] px-4 py-3 text-sm font-bold text-[#684f37] hover:bg-[#eab074] transition shadow-xs cursor-pointer"
              >
                <Smartphone size={17} />
                Open Staff Mobile Portal
              </button>
            )}
            <button
              onClick={() => {
                if (blockDemoAction("Adding employees")) return;
                setShowAddStaffModal(true);
              }}
              aria-disabled={currentUser?.isDemoAccount}
              className={`flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white transition shadow-xs ${
                currentUser?.isDemoAccount
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-[#315a3d]"
              }`}
            >
              <Plus size={18} />
              Add Employee
            </button>
          </div>
        }
      />

      {/* Top Dynamic Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Present today"
          value={`${clockedInCount} / ${staffList.length}`}
          change={`${attendanceRate}% shift attendance`}
          icon={Users}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Total Employees"
          value={String(staffList.length)}
          change="Active in roster"
          icon={UserRound}
          color="bg-[#fff5dc] text-[#946243]"
        />
        <StatCard
          label="Pending leaves"
          value={String(pendingLeavesCount)}
          change={
            pendingLeavesCount > 0 ? "Requires review" : "All requests handled"
          }
          icon={CalendarDays}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Geofence boundary"
          value={`${settings?.radiusMeters || 50}m`}
          change="GPS perimeter active"
          icon={MapPin}
          color="bg-[#eee8f6] text-[#72558e]"
        />
      </div>

      {/* Geofence Radar Information Strip */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f1e8] text-[#315a3d]">
            <MapPin size={18} />
          </div>
          <div>
            <p className="font-bold text-[#24312e]">
              Restaurant Geofence: {settings?.latitude.toFixed(4)}° N,{" "}
              {settings?.longitude.toFixed(4)}° E •{" "}
              {settings?.radiusMeters || 50}m Radius
            </p>
            <p className="text-[11px] text-[#68736e]">
              Staff can only clock in through mobile GPS when within{" "}
              {settings?.radiusMeters || 50} meters of restaurant coordinates.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDetectGPS}
            disabled={detectingGps}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
            title="Update restaurant coordinates to match your current GPS location"
          >
            {detectingGps ? "Detecting..." : "Sync to My GPS"}
          </button>
          <button
            onClick={() => setShowGeofenceModal(true)}
            className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 font-bold text-[#24312e] hover:bg-[#f0f1ed] transition shadow-2xs cursor-pointer"
          >
            Configure GPS Location
          </button>
        </div>
      </div>

      {/* Main Tabs (Staff Attendance, Leaves, Notices) */}
      <div className="mt-6 rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e9eae6] pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("staff")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "staff"
                  ? "bg-[#24312e] text-white shadow-xs"
                  : "bg-white text-[#68736e] border border-[#dfe1dc] hover:text-[#24312e]"
              }`}
            >
              Employees Directory ({staffList.length})
            </button>
            <button
              onClick={() => setActiveTab("leaves")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition relative cursor-pointer ${
                activeTab === "leaves"
                  ? "bg-[#24312e] text-white shadow-xs"
                  : "bg-white text-[#68736e] border border-[#dfe1dc] hover:text-[#24312e]"
              }`}
            >
              Leave Requests
              {pendingLeavesCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                  {pendingLeavesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "announcements"
                  ? "bg-[#24312e] text-white shadow-xs"
                  : "bg-white text-[#68736e] border border-[#dfe1dc] hover:text-[#24312e]"
              }`}
            >
              Broadcast Notices ({announcements.length})
            </button>
          </div>

          {activeTab === "staff" && (
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-[#84908a]"
                />
                <input
                  type="text"
                  placeholder="Search name, role, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white py-2 pl-9 pr-3 text-xs outline-hidden focus:border-[#24312e]"
                />
              </div>
            </div>
          )}

          {activeTab === "announcements" && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="rounded-xl bg-[#24312e] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={14} />
              New Broadcast Notice
            </button>
          )}
        </div>

        {/* TAB 1: EMPLOYEES DIRECTORY & ATTENDANCE */}
        {activeTab === "staff" && (
          <div className="mt-4">
            {/* Department Filter Chips */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#84908a] mr-1">
                Filter Dept:
              </span>
              {filterDepartments.map((dept) => (
                <div key={dept} className="inline-flex items-center">
                  <button
                    onClick={() => setDeptFilter(dept)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      deptFilter === dept
                        ? "bg-[#315a3d] text-white"
                        : "bg-white border border-[#dfe1dc] text-[#68736e] hover:bg-[#f0f1ed]"
                    }`}
                  >
                    <span>{dept}</span>
                    {onDeleteDepartment &&
                      dept !== "All" &&
                      !["Floor", "Kitchen", "Management"].includes(dept) && (
                        <span
                          role="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Delete department "${dept}"? Staff in this department will remain but will need a new department assigned.`,
                              )
                            ) {
                              try {
                                await onDeleteDepartment(dept);
                                if (deptFilter === dept) setDeptFilter("All");
                              } catch (err) {
                                alert(
                                  "Failed to delete department: " + String(err),
                                );
                              }
                            }
                          }}
                          className={`rounded-full p-0.5 hover:bg-rose-500 hover:text-white transition cursor-pointer ${
                            deptFilter === dept
                              ? "text-white/80"
                              : "text-[#84908a]"
                          }`}
                          title={`Delete ${dept} department`}
                        >
                          <X size={11} />
                        </span>
                      )}
                  </button>
                </div>
              ))}

              {onAddDepartment && (
                <>
                  {!showAddDept ? (
                    <button
                      onClick={() => {
                        if (blockDemoAction("Adding departments")) return;
                        setShowAddDept(true);
                      }}
                      aria-disabled={currentUser?.isDemoAccount}
                      className={`flex items-center gap-1 rounded-lg border border-dashed border-[#315a3d]/50 bg-[#e8f1e8]/50 px-2.5 py-1 text-[11px] font-bold text-[#315a3d] transition ${
                        currentUser?.isDemoAccount
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-[#e8f1e8]"
                      }`}
                      title="Add a new restaurant department"
                    >
                      <Plus size={13} />
                      Add Department
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#315a3d] bg-white p-0.5 shadow-xs">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Department name..."
                        value={newDeptInput}
                        onChange={(e) => setNewDeptInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleQuickAddDepartment();
                          } else if (e.key === "Escape") {
                            setShowAddDept(false);
                          }
                        }}
                        className="w-32 sm:w-40 px-2 py-0.5 text-xs outline-hidden font-medium text-[#24312e]"
                      />
                      <button
                        onClick={handleQuickAddDepartment}
                        disabled={isAddingDept || !newDeptInput.trim()}
                        className="rounded-md bg-[#315a3d] px-2 py-1 text-[11px] font-bold text-white hover:bg-[#24312e] disabled:opacity-50 transition cursor-pointer"
                      >
                        {isAddingDept ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddDept(false);
                          setNewDeptInput("");
                        }}
                        className="p-1 text-[#84908a] hover:text-[#24312e] cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">
                  <tr>
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Shift Hours</th>
                    <th className="pb-3">Mobile PIN</th>
                    <th className="pb-3">Today Status</th>
                    <th className="pb-3">GPS Distance</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((person) => (
                    <tr
                      key={person.id}
                      onClick={() => setViewingStaffAttendance(person)}
                      className="border-b border-[#f0f1ed] last:border-0 text-xs hover:bg-[#f3f6f3] transition cursor-pointer group"
                      title={`Click to view month-wise attendance & clock-in/out records for ${person.name}`}
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5c7a6] text-[11px] font-bold text-[#684f37] group-hover:scale-105 transition">
                            {person.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-bold text-[#24312e] group-hover:text-[#315a3d] transition">
                              {person.name}
                            </p>
                            <span className="text-[10px] text-[#84908a]">
                              {person.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-semibold text-[#68736e]">
                        {person.department}
                      </td>
                      <td className="py-3.5 text-[#68736e]">{person.shift}</td>
                      <td className="py-3.5">
                        <div className="font-mono text-[11px] text-[#24312e]">
                          <span>
                            PIN: <strong>{person.pin}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <StatusPill status={person.todayStatus} />
                      </td>
                      <td className="py-3.5 text-[#68736e]">
                        {person.lastDistanceMeters !== null &&
                        person.lastDistanceMeters !== undefined ? (
                          <span className="font-semibold text-emerald-700">
                            {person.lastDistanceMeters}m (Verified)
                          </span>
                        ) : (
                          <span className="text-[#a1aaa4]">--</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingStaffAttendance(person);
                            }}
                            className="rounded-lg border border-[#315a3d]/30 bg-[#e8f1e8] px-2.5 py-1 text-[11px] font-bold text-[#315a3d] hover:bg-[#315a3d] hover:text-white transition cursor-pointer shadow-2xs flex items-center gap-1"
                            title="View full month-wise attendance & clock-in/out logs"
                          >
                            <Eye size={13} />
                            Attendance
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAttendance(
                                person.id,
                                person.todayStatus,
                              );
                            }}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                              person.todayStatus === "Clocked in"
                                ? "bg-stone-200 text-stone-800 hover:bg-stone-300"
                                : "bg-[#315a3d] text-white hover:bg-[#254630]"
                            }`}
                            title="Manager manual punch override"
                          >
                            {person.todayStatus === "Clocked in"
                              ? "Clock Out"
                              : "Clock In"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (blockDemoAction("Editing employees")) return;
                              setEditingStaff(person);
                            }}
                            className={`rounded-lg border border-[#dfe1dc] bg-white p-1.5 text-stone-600 transition shadow-2xs ${
                              currentUser?.isDemoAccount
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:text-[#315a3d] hover:border-[#315a3d]"
                            }`}
                            title="Edit employee details"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStaff(person.id, person.name);
                            }}
                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition cursor-pointer shadow-2xs"
                            title="Delete employee"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVE APPLICATIONS */}
        {activeTab === "leaves" && (
          <div className="mt-4 overflow-x-auto">
            {leaves.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#84908a]">
                No leave applications submitted yet.
              </p>
            ) : (
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">
                  <tr>
                    <th className="pb-3">Staff Member</th>
                    <th className="pb-3">Leave Type</th>
                    <th className="pb-3">Dates</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-[#f0f1ed] last:border-0 text-xs"
                    >
                      <td className="py-3.5 font-bold text-[#24312e]">
                        {l.staffName} ({l.department})
                      </td>
                      <td className="py-3.5 text-[#68736e]">{l.leaveType}</td>
                      <td className="py-3.5 text-[#68736e]">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="py-3.5 text-[#55615b] max-w-64 truncate">
                        {l.reason}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            l.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : l.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {l.status === "Pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                handleLeaveStatusChange(l.id, "Approved")
                              }
                              className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleLeaveStatusChange(l.id, "Rejected")
                              }
                              className="rounded-lg bg-red-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-800 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#84908a]">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: BROADCAST NOTICES */}
        {activeTab === "announcements" && (
          <div className="mt-4 space-y-3">
            {announcements.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#84908a]">
                No broadcast notices sent yet. Click "New Broadcast Notice"
                above to compose one.
              </p>
            ) : (
              announcements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-[#eef0eb] bg-white p-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.priority === "Urgent"
                            ? "bg-red-600 text-white"
                            : "bg-[#315a3d] text-white"
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-[10px] text-[#84908a]">
                        Target:{" "}
                        {item.targetType === "All"
                          ? "All Employees"
                          : `Staff ID: ${item.targetStaffId}`}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#24312e]">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-[#55615b] leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#a1aaa4] shrink-0">
                    From: {item.senderName}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddStaffModal && (
        <AddEmployeeModal
          onClose={() => setShowAddStaffModal(false)}
          onSave={handleCreateStaff}
          departments={departments}
          onAddDepartment={onAddDepartment}
        />
      )}

      {editingStaff && (
        <EditEmployeeModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSave={handleUpdateStaff}
          departments={departments}
          onAddDepartment={onAddDepartment}
        />
      )}

      {showGeofenceModal && (
        <GeofenceModal
          settings={settings}
          onClose={() => setShowGeofenceModal(false)}
          onSaved={loadData}
        />
      )}

      {showAnnouncementModal && (
        <AnnouncementModal
          staffList={staffList}
          onClose={() => setShowAnnouncementModal(false)}
          onSaved={loadData}
        />
      )}

      {viewingStaffAttendance && (
        <StaffAttendanceDetailModal
          staff={viewingStaffAttendance}
          onClose={() => setViewingStaffAttendance(null)}
        />
      )}
    </>
  );
}

function DashboardAccessPage({
  onOpenPortal,
  departments = [
    "Floor",
    "Kitchen",
    "Bar",
    "Cleaning",
    "Utility",
    "Management",
  ],
  onAddDepartment,
  currentUser,
  showToast: showAppToast,
}: {
  onOpenPortal?: () => void;
  departments?: string[];
  onAddDepartment?: (name: string) => Promise<any>;
  currentUser?: any;
  showToast?: any;
}) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "All" | "Manager" | "Server" | "Kitchen"
  >("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    fetchStaff()
      .then((data) => {
        setStaffList(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };
  const blockDemoAction = (action: string) => {
    if (!currentUser?.isDemoAccount) return false;
    showAppToast?.(
      "error",
      "Demo access only",
      `${action} is disabled for the demo account.`,
    );
    return true;
  };

  const handleRoleChange = async (
    staffId: string,
    newRole: StaffMember["systemRole"],
  ) => {
    if (blockDemoAction("Changing dashboard access")) return;
    try {
      const updated = await updateStaff(staffId, { systemRole: newRole });
      showToast(`✓ Updated ${updated.name}'s station role to "${newRole}"!`);
      loadData();
    } catch (err) {
      alert("Failed to change role: " + String(err));
    }
  };

  const handleRevokeRole = async (staffId: string, name: string) => {
    if (blockDemoAction("Revoking dashboard access")) return;
    if (
      !confirm(
        `Revoke dashboard station access for ${name}? They will no longer be able to log into the web dashboard.`,
      )
    )
      return;
    try {
      await updateStaff(staffId, { systemRole: "None" });
      showToast(`✓ Revoked dashboard access for ${name}`);
      loadData();
    } catch (err) {
      alert("Failed to revoke access: " + String(err));
    }
  };

  const handleCreateDashboardMember = async (data: {
    name: string;
    email: string;
    password: string;
    systemRole: "Manager" | "Server" | "Kitchen";
    department: string;
    phone?: string;
  }) => {
    if (blockDemoAction("Adding dashboard members")) return;
    await createStaff({
      name: data.name,
      email: data.email,
      password: data.password,
      systemRole: data.systemRole,
      department: data.department,
      phone: data.phone || `+91 98201 ${Date.now().toString().slice(-5)}`,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      shift: "09:00 - 18:00",
    });
    showToast(`✓ Added ${data.name} with ${data.systemRole} dashboard access!`);
    loadData();
  };

  const handleUpdateDashboardMember = async (
    id: string,
    data: Partial<StaffMember>,
  ) => {
    if (blockDemoAction("Editing dashboard members")) return;
    await updateStaff(id, data);
    showToast("✓ Dashboard credentials updated successfully!");
    loadData();
  };

  const copyCredentials = (person: StaffMember) => {
    const credText = `Email: ${person.email || "N/A"} | Password: ${person.password || "demo123"}`;
    navigator.clipboard.writeText(credText);
    setCopiedId(person.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Only dashboard members (exclude None)
  const dashboardMembers = staffList.filter((s) => s.systemRole !== "None");

  const managers = dashboardMembers.filter((s) => s.systemRole === "Manager");
  const servers = dashboardMembers.filter((s) => s.systemRole === "Server");
  const kitchens = dashboardMembers.filter((s) => s.systemRole === "Kitchen");

  const filteredMembers = dashboardMembers.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.phone.includes(searchQuery);
    const matchesRole = roleFilter === "All" || s.systemRole === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <>
      <SectionHeading
        eyebrow="Access Control & Station Desks"
        title="Dashboard Access"
        description="Manage station logins for Kitchen, Servant, and Manager roles. Members configured here can log into the restaurant software using their email and password."
      />

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span>{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Stat Cards (No Staff Only card) */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Managers"
          value={String(managers.length)}
          change="Full control desk access"
          icon={ShieldCheck}
          color="bg-[#fff5dc] text-[#946243]"
        />
        <StatCard
          label="Servants / Floor"
          value={String(servers.length)}
          change="POS & Floor order access"
          icon={Users}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Kitchen Crew"
          value={String(kitchens.length)}
          change="KDS ticket management"
          icon={ChefHat}
          color="bg-[#eee8f6] text-[#72558e]"
        />
        <StatCard
          label="Total Station Users"
          value={String(dashboardMembers.length)}
          change="Active dashboard logins"
          icon={ShieldCheck}
          color="bg-[#f0f5f2] text-[#24312e]"
        />
      </div>

      {/* Dashboard Accounts Matrix */}
      <div className="mt-6 rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e9eae6] pb-4">
          <div>
            <h3 className="display-font text-base font-bold text-[#24312e]">
              Station Login Accounts
            </h3>
            <p className="mt-0.5 text-xs text-[#68736e]">
              Staff listed here have direct email and password access to the
              restaurant dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-[#84908a]"
              />
              <input
                type="text"
                placeholder="Search station members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-white py-2 pl-9 pr-3 text-xs outline-hidden focus:border-[#24312e]"
              />
            </div>
            <button
              onClick={() => {
                if (blockDemoAction("Adding dashboard members")) return;
                setShowAddModal(true);
              }}
              aria-disabled={currentUser?.isDemoAccount}
              className={`rounded-xl bg-[#24312e] px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 shrink-0 ${
                currentUser?.isDemoAccount
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-[#315a3d]"
              }`}
            >
              <Plus size={14} />
              Add Member
            </button>
          </div>
        </div>

        {/* Role Filters (No Staff Only filter) */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#84908a] mr-1">
            Filter by role:
          </span>
          {(["All", "Manager", "Server", "Kitchen"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                roleFilter === r
                  ? "bg-[#24312e] text-white"
                  : "bg-white border border-[#dfe1dc] text-[#68736e] hover:bg-[#f0f1ed]"
              }`}
            >
              {r === "All"
                ? `All Dashboard (${dashboardMembers.length})`
                : r === "Manager"
                  ? `Managers (${managers.length})`
                  : r === "Server"
                    ? `Servants (${servers.length})`
                    : `Kitchen (${kitchens.length})`}
            </button>
          ))}
        </div>

        {/* Permissions Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">
              <tr>
                <th className="pb-3">Dashboard User</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Dashboard Access Role</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-xs text-[#84908a]"
                  >
                    No dashboard members found matching your filter. Click{" "}
                    <strong>"Add Member"</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b border-[#f0f1ed] last:border-0 text-xs"
                  >
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5c7a6] text-[11px] font-bold text-[#684f37]">
                          {person.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-bold text-[#24312e]">
                            {person.name}
                          </p>
                          <span className="text-[10px] text-[#84908a]">
                            {person.phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-semibold text-[#68736e]">
                      {person.department}
                    </td>
                    <td className="py-3.5">
                      <select
                        value={person.systemRole}
                        onChange={(e) =>
                          handleRoleChange(
                            person.id,
                            e.target.value as StaffMember["systemRole"],
                          )
                        }
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold outline-hidden transition cursor-pointer ${
                          person.systemRole === "Manager"
                            ? "border-amber-400 bg-amber-50 text-amber-900"
                            : person.systemRole === "Server"
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                              : person.systemRole === "Kitchen"
                                ? "border-purple-400 bg-purple-50 text-purple-900"
                                : "border-gray-300 bg-gray-50 text-gray-700"
                        }`}
                      >
                        <option value="Server">Servant / Floor Station</option>
                        <option value="Kitchen">Kitchen Head Station</option>
                        <option value="Manager">Manager Station</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (blockDemoAction("Editing dashboard members"))
                              return;
                            setEditingStaff(person);
                          }}
                          className={`rounded-lg border border-[#dfe1dc] bg-white p-1.5 text-stone-600 transition shadow-2xs ${
                            currentUser?.isDemoAccount
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer hover:text-[#315a3d] hover:border-[#315a3d]"
                          }`}
                          title="Edit station credentials"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleRevokeRole(person.id, person.name)
                          }
                          className={`rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 transition shadow-2xs ${
                            currentUser?.isDemoAccount
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer hover:bg-red-100"
                          }`}
                          title="Revoke station access"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station Role Capabilities Guide Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 mb-2">
            <ShieldCheck size={18} />
            <h4 className="font-bold text-sm">Manager Station Capabilities</h4>
          </div>
          <p className="text-xs text-amber-800/90 leading-relaxed mb-3">
            Full administrative authority over the entire restaurant ecosystem.
          </p>
          <ul className="text-[11px] text-amber-900 space-y-1 list-disc list-inside">
            <li>Overview live financial & occupancy KPIs</li>
            <li>Reservations management & deposits</li>
            <li>Interactive floor plan & table assignment</li>
            <li>Menu items pricing & recipe inventory</li>
            <li>Staff directory, geofence, and permissions</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-900 mb-2">
            <Users size={18} />
            <h4 className="font-bold text-sm">Servant / Floor Capabilities</h4>
          </div>
          <p className="text-xs text-emerald-800/90 leading-relaxed mb-3">
            Dedicated station for front-of-house floor operations & POS
            ordering.
          </p>
          <ul className="text-[11px] text-emerald-900 space-y-1 list-disc list-inside">
            <li>Table seating & live occupancy status</li>
            <li>Punching new dine-in and takeaway orders</li>
            <li>Notified when kitchen marks ticket ready</li>
            <li>Billing checkout & split payment processing</li>
            <li>Table cleaning & reset turnover</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-purple-900 mb-2">
            <ChefHat size={18} />
            <h4 className="font-bold text-sm">Kitchen Head Capabilities</h4>
            <p className="text-xs text-purple-800/90 leading-relaxed mb-3">
              High-speed Kitchen Display System (KDS) for cooking line
              execution.
            </p>
            <ul className="text-[11px] text-purple-900 space-y-1 list-disc list-inside">
              <li>Real-time ticket queue with prep timer</li>
              <li>Mark ticket as Preparing, Ready, or Served</li>
              <li>Toggle 86 / sold-out menu items instantly</li>
              <li>One-click buzzer notification to server station</li>
              <li>Station breakdown for Grill, Pantry, & Pass</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddDashboardMemberModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateDashboardMember}
          departments={departments}
          onAddDepartment={onAddDepartment}
        />
      )}

      {editingStaff && (
        <EditDashboardMemberModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSave={handleUpdateDashboardMember}
          departments={departments}
          onAddDepartment={onAddDepartment}
        />
      )}
    </>
  );
}

const TeamPage = EmployeesPage;

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
      return {
        hour: String(h12).padStart(2, "0"),
        minute: match24[2],
        period: p,
      };
    }
    return { hour: "07", minute: "30", period: "PM" };
  };

  const initial = parse(currentTime);
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initial.period);

  const hours = [
    "12",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
  ];
  const minutes = ["00", "15", "30", "45"];

  const currentPreview = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

  const applyTime = (timeString: string) => {
    onSelectTime(timeString);
    onClose();
  };

  const handleConfirm = () => {
    applyTime(currentPreview);
  };

  const lunchSlots = [
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
  ];
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
              <h3 className="text-base font-bold text-[#24312e]">
                Select Booking Time
              </h3>
              <p className="text-[11px] text-[#84908a]">
                Choose service time or pick a dining slot
              </p>
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
              <span className="text-[11px] font-semibold text-[#b7623d]">
                {selectedHour}
              </span>
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
                <span className="text-[11px] font-semibold text-[#b7623d]">
                  :{selectedMinute}
                </span>
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
                <span className="text-[11px] font-semibold text-[#b7623d]">
                  {selectedPeriod}
                </span>
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
  currencySymbol = "₹",
  defaultDeposit = 500,
}: {
  tables: RestaurantTable[];
  onBookingCreated: (booking: TableBooking) => void;
  onClose: () => void;
  initialTableId?: string;
  kitchenClosed?: boolean;
  currencySymbol?: string;
  defaultDeposit?: number;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<TableBooking | null>(
    null,
  );

  const [guests, setGuests] = useState<number>(2);
  const [bookingTime, setBookingTime] = useState<string>("07:30 PM");
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Determine valid initial table: must be Available and have >= 2 seats
  const initialTable = initialTableId
    ? tables.find((t) => t.id === initialTableId)
    : null;
  const isInitialValid =
    initialTable &&
    initialTable.status === "Available" &&
    initialTable.seats >= 2;
  const [selectedTableId, setSelectedTableId] = useState<string>(
    isInitialValid ? initialTableId! : "Pending",
  );

  // Keep selected table valid when guests count changes
  useEffect(() => {
    if (selectedTableId && selectedTableId !== "Pending") {
      const current = tables.find((t) => t.id === selectedTableId);
      if (
        current &&
        (current.status !== "Available" || current.seats < guests)
      ) {
        const firstValid = tables.find(
          (t) => t.status === "Available" && t.seats >= guests,
        );
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
      setError(
        "Kitchen is closed. Cannot accept new table bookings at this time.",
      );
      return;
    }
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const tableId =
      selectedTableId === "Pending" || !selectedTableId
        ? null
        : selectedTableId;

    if (tableId) {
      const targetTable = tables.find((t) => t.id === tableId);
      if (!targetTable) {
        setError("Selected table does not exist.");
        setSubmitting(false);
        return;
      }
      if (targetTable.status !== "Available") {
        setError(
          `Table ${targetTable.id} is currently ${targetTable.status} and cannot be booked.`,
        );
        setSubmitting(false);
        return;
      }
      if (targetTable.seats < guests) {
        setError(
          `Table ${targetTable.id} only has ${targetTable.seats} seats, which is not enough for ${guests} guests.`,
        );
        setSubmitting(false);
        return;
      }
    }

    try {
      const created = await createBooking({
        customer: String(form.get("customer") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        email: String(form.get("email") || "").trim(),
        bookingDate: String(form.get("bookingDate") || todayStr).trim(),
        bookingTime: String(
          bookingTime || form.get("bookingTime") || "",
        ).trim(),
        guests: Number(guests) || 2,
        tableId: tableId,
        source: (form.get("source") as any) || "Phone",
        specialRequests: String(form.get("specialRequests") || "").trim(),
        deposit: defaultDeposit,
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
      <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#24312e]/40 p-3 sm:p-4 backdrop-blur-sm">
        <div className="my-auto w-full max-w-xl rounded-2xl bg-[#fbfaf7] p-4 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
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
                Select party size, booking time, and an available table with
                sufficient seating capacity.
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
                <span className="font-bold">Kitchen is Closed:</span> Table
                bookings are paused until the kitchen reopens.
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
                {confirmedBooking?.bookingDate} at{" "}
                {confirmedBooking?.bookingTime}
                {confirmedBooking?.tableId
                  ? ` (Table ${confirmedBooking.tableId})`
                  : " (Auto-allocated)"}
                .
              </p>
              <p className="mt-1 text-xs text-[#58715e]">
                The {currencySymbol || "₹"}
                {defaultDeposit} booking deposit is recorded and will be
                adjusted on final billing.
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
                  <AlertTriangle
                    size={15}
                    className="shrink-0 text-[#721c24]"
                  />
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
                  Email address
                  <input
                    name="email"
                    type="email"
                    placeholder="e.g. guest@example.com"
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
                          <span className="text-[10px] text-[#84908a] block -mb-0.5">
                            Booking time
                          </span>
                          <span className="text-sm font-bold text-[#24312e]">
                            {bookingTime}
                          </span>
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
                        {num}
                        {num === 10 ? "+" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign Table: Disables Booked, Occupied, Needs cleaning, and tables with seats < guests */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#68736e]">
                      Select Table ({eligibleTables.length} available for{" "}
                      {guests}+ guests)
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
                      <optgroup
                        label={`Eligible Tables (${guests}+ Seats & Available)`}
                      >
                        {eligibleTables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.id} ({t.seats} seats · {t.zone}) - Available ✓
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {tables.filter(
                      (t) => t.status !== "Available" || t.seats < guests,
                    ).length > 0 && (
                      <optgroup label="Unselectable (Occupied / Booked / Needs cleaning / Too small)">
                        {tables
                          .filter(
                            (t) => t.status !== "Available" || t.seats < guests,
                          )
                          .map((t) => {
                            let reason = "";
                            if (t.status === "Occupied") reason = "Occupied";
                            else if (t.status === "Booked") reason = "Booked";
                            else if (t.status === "Needs cleaning")
                              reason = "Needs cleaning";
                            else if (t.seats < guests)
                              reason = `Too small (${t.seats} < ${guests} seats)`;

                            return (
                              <option key={t.id} value={t.id} disabled>
                                {t.id} ({t.seats} seats · {t.zone}) -
                                Unselectable [{reason}]
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
                          <span className="text-[10px] text-[#84908a]">
                            Pending
                          </span>
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
                              <span className="text-xs font-extrabold">
                                {t.id}
                              </span>
                              <span className="text-[10px] font-semibold">
                                {t.seats} seats • {t.zone}
                              </span>
                              <span className="mt-1 rounded px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-tight bg-[#cfe0d0] text-[#315a3d]">
                                Available ✓
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {eligibleTables.length === 0 && (
                        <p className="mt-2 text-xs text-[#b7623d] bg-[#fff5ed] p-2 rounded-lg border border-[#fbd3bf]">
                          No available table currently has {guests}+ seats.
                          Please choose <strong>Auto-allocate</strong> or select
                          fewer guests.
                        </p>
                      )}
                    </div>

                    {/* Unselectable Tables Section (Occupied, Booked, Cleaning, or seats < guests) */}
                    {tables.some(
                      (t) => t.status !== "Available" || t.seats < guests,
                    ) && (
                      <div className="pt-2 border-t border-[#e2e4dd]">
                        <div className="mb-2 flex items-center justify-between text-[10.5px] font-semibold text-[#84908a]">
                          <span>
                            Unselectable Tables (Occupied / Booked / Cleaning /
                            Below {guests} Seats):
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-[#9ba39e]">
                            Disabled
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 max-h-32 overflow-y-auto pr-1">
                          {tables
                            .filter(
                              (t) =>
                                t.status !== "Available" || t.seats < guests,
                            )
                            .map((t) => {
                              let unselectableTag = "";
                              if (t.status === "Occupied")
                                unselectableTag = "Occupied";
                              else if (t.status === "Booked")
                                unselectableTag = "Booked";
                              else if (t.status === "Needs cleaning")
                                unselectableTag = "Cleaning";
                              else if (t.seats < guests)
                                unselectableTag = `${t.seats} seats (< ${guests})`;

                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  disabled
                                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-[#dcded8] bg-[#eceeea]/70 text-[#9ba39e] cursor-not-allowed opacity-60 text-center"
                                  title={`Table ${t.id} cannot be booked: ${unselectableTag}`}
                                >
                                  <span className="text-xs font-bold">
                                    {t.id}
                                  </span>
                                  <span className="text-[10px]">
                                    {t.seats} seats • {t.zone}
                                  </span>
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
                    <option value="Website">Website</option>
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
                    <span className="float-right text-sm font-extrabold">
                      {currencySymbol || "₹"}
                      {defaultDeposit}
                    </span>
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
                {kitchenClosed
                  ? "Kitchen Closed (Bookings Paused)"
                  : submitting
                    ? "Booking table..."
                    : "Confirm & Book Table"}
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
  currencySymbol = "₹",
  servants = [],
}: {
  tables: RestaurantTable[];
  menuItems: ApiMenuItem[];
  soldOutItems?: string[];
  onOrderCreated: (order: Order) => void;
  onClose: () => void;
  initialTableId?: string;
  kitchenClosed?: boolean;
  role?: StaffRole;
  currencySymbol?: string;
  servants?: { id?: string; name: string }[];
}) {
  const isInitialTakeaway = initialTableId === "Takeaway";
  const [orderType, setOrderType] = useState<"Dine in" | "Takeaway">(
    isInitialTakeaway ? "Takeaway" : "Dine in",
  );
  const [customer, setCustomer] = useState("");
  const [table, setTable] = useState(
    initialTableId && !isInitialTakeaway
      ? initialTableId
      : tables.find((t) => t.status === "Available")?.id ||
          tables[0]?.id ||
          "T01",
  );
  const [servantName, setServantName] = useState<string>("");
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(
    {},
  );
  const [dishSearch, setDishSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isDishUnavailable = (item: ApiMenuItem) => {
    return (
      item.available === false ||
      (soldOutItems && soldOutItems.includes(item.name)) ||
      (item as any).status === "Unavailable"
    );
  };

  const categories = [
    "All",
    ...Array.from(new Set(menuItems.map((m) => m.category || "General"))),
  ];

  const filteredMenuItems = menuItems
    .filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
        (item.category &&
          item.category.toLowerCase().includes(dishSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aUnavail = isDishUnavailable(a);
      const bUnavail = isDishUnavailable(b);
      if (aUnavail === bUnavail) return 0;
      return aUnavail ? 1 : -1;
    });

  const handleAddItem = (item: ApiMenuItem) => {
    if (isDishUnavailable(item)) return;
    setItemQuantities((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const totalItemCount = Object.values(itemQuantities).reduce(
    (sum, q) => sum + q,
    0,
  );
  const orderTotal = menuItems.reduce(
    (sum, item) => sum + item.price * (itemQuantities[item.id] || 0),
    0,
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (kitchenClosed) {
      setError("Kitchen is closed. Cannot accept new orders at this time.");
      return;
    }
    if (!customer.trim()) {
      setError(
        "Guest name is mandatory. Please enter the customer / guest name.",
      );
      return;
    }
    if (
      orderType === "Dine in" &&
      (!table || table.trim() === "" || table === "Takeaway")
    ) {
      setError(
        "Assigning a table is mandatory for dine-in orders. Please select an available table.",
      );
      return;
    }
    if (orderType === "Dine in") {
      const assignedTable = tables.find((t) => t.id === table);
      if (
        assignedTable &&
        assignedTable.status !== "Available" &&
        assignedTable.id !== initialTableId
      ) {
        setError(
          `Table ${table} is currently ${assignedTable.status.toLowerCase()}. Please assign an available table.`,
        );
        return;
      }
    }
    if (totalItemCount === 0) {
      setError("Please select at least one item to order.");
      return;
    }

    const selectedItems = menuItems.filter(
      (i) => (itemQuantities[i.id] || 0) > 0,
    );
    const unavailableInOrder = selectedItems.filter((i) =>
      isDishUnavailable(i),
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
      const formattedItemList = selectedItems.map((i) => {
        const q = itemQuantities[i.id] || 1;
        return q > 1 ? `${q}x ${i.name}` : i.name;
      });

      const order = await createOrder(
        {
          customer: customer.trim(),
          table: orderType === "Dine in" ? table : "Takeaway",
          itemList: formattedItemList,
          total: orderTotal,
          serverName: servantName.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#fbfaf7] border border-[#dfe1dc] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e9eae6] bg-white px-5 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#24312e]">
                Book New Order
              </h3>
              <p className="text-xs text-[#84908a]">
                Create and dispatch an order to the kitchen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#84908a] hover:bg-[#f0f2ed] hover:text-[#24312e] transition cursor-pointer"
            aria-label="Close order dialog"
          >
            <X size={18} />
          </button>
        </div>

        {kitchenClosed && (
          <div className="mx-5 sm:mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2 shrink-0">
            <AlertTriangle size={15} className="shrink-0 text-red-600" />
            <div>
              <span className="font-bold">Kitchen is Closed:</span> New orders
              cannot be taken until the kitchen reopens.
            </div>
          </div>
        )}

        {error && (
          <div className="mx-5 sm:mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2 shrink-0">
            <AlertTriangle size={15} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={submit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Form Content */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Order Type Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType("Dine in")}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition cursor-pointer ${
                  orderType === "Dine in"
                    ? "border-[#24312e] bg-[#24312e] text-white shadow-xs"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <Utensils size={14} />
                <span>Dine in Table</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("Takeaway")}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition cursor-pointer ${
                  orderType === "Takeaway"
                    ? "border-[#24312e] bg-[#24312e] text-white shadow-xs"
                    : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <ShoppingBag size={14} />
                <span>Takeaway / Counter</span>
              </button>
            </div>

            {/* Table, Guest & Servant Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Guest Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    orderType === "Dine in"
                      ? "e.g. Rahul Sharma (Required)"
                      : "e.g. Rahul (Required)"
                  }
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#24312e] ${
                    !customer.trim() && error
                      ? "border-red-400 bg-red-50/50"
                      : "border-[#dfe1dc] bg-white"
                  }`}
                />
              </div>

              {orderType === "Dine in" ? (
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Assign Table{" "}
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    required
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#24312e] cursor-pointer ${
                      !table && error
                        ? "border-red-400 bg-red-50/50"
                        : "border-[#dfe1dc] bg-white"
                    }`}
                  >
                    <option value="" disabled>
                      -- Select Table (Required) --
                    </option>
                    {tables.map((t) => {
                      const isAvailable =
                        t.status === "Available" || t.id === initialTableId;
                      return (
                        <option key={t.id} value={t.id} disabled={!isAvailable}>
                          {t.id} ({t.seats} seats · {t.zone}) - {t.status}{" "}
                          {!isAvailable ? "[Unselectable]" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Order Channel
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Pickup Counter / Takeaway"
                    className="w-full rounded-xl border border-[#dfe1dc] bg-[#eef0eb] px-3 py-2 text-xs text-[#68736e]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Assign Servant / Waiter (Optional)
                </label>
                <select
                  value={servantName}
                  onChange={(e) => setServantName(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e] cursor-pointer"
                >
                  <option value="">-- No servant assigned (Optional) --</option>
                  {servants.map((s) => (
                    <option key={s.id || s.name} value={s.name}>
                      {s.name} (Floor Server)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items Selection Section */}
            <div className="rounded-2xl border border-[#e9eae6] bg-white p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9aa39d]">
                  Select Menu Items
                </span>
                {totalItemCount > 0 && (
                  <span className="rounded-full bg-[#e8f1e8] px-2.5 py-0.5 text-[11px] font-bold text-[#315a3d]">
                    {totalItemCount} {totalItemCount === 1 ? "dish" : "dishes"}{" "}
                    selected
                  </span>
                )}
              </div>

              {/* Dish Search & Category Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-2.5 text-[#84908a]"
                  />
                  <input
                    type="text"
                    placeholder="Search menu dishes..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className="w-full rounded-lg border border-[#dfe1dc] bg-[#fbfaf7] pl-7 pr-2.5 py-1.5 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#24312e] text-white"
                        : "bg-[#f0f2ed] text-[#68736e] hover:bg-[#dfe1dc]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Scrollable Dish Grid (3 columns) */}
              <div className="max-h-[380px] overflow-y-auto pr-1">
                {filteredMenuItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#84908a]">
                    No dishes found matching your search.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredMenuItems.map((dish) => {
                      const unavailable = isDishUnavailable(dish);
                      const inCartQty = itemQuantities[dish.id] || 0;

                      return (
                        <div
                          key={dish.id}
                          className={`group flex flex-col justify-between rounded-2xl p-2.5 text-xs border transition ${
                            unavailable
                              ? "bg-[#f4f5f1] border-dashed border-[#dfe1dc] opacity-65"
                              : inCartQty > 0
                                ? "bg-[#f2f7f3] border-[#315a3d]/50 shadow-xs ring-1 ring-[#315a3d]/20"
                                : "bg-white border-[#eef0eb] hover:border-[#dfe1dc] hover:shadow-2xs"
                          }`}
                        >
                          {/* Dish Image */}
                          <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[#e9eee5] flex items-center justify-center text-[#315a3d]">
                            {dish.image ? (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                className={`h-full w-full object-cover transition-transform duration-300 ${
                                  unavailable
                                    ? "grayscale contrast-75"
                                    : "group-hover:scale-105"
                                }`}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <Utensils
                                size={28}
                                className="text-[#315a3d]/50"
                              />
                            )}
                            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-xs px-1.5 py-0.5 shadow-2xs">
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  dish.type === "veg"
                                    ? "bg-[#3b724c]"
                                    : "bg-[#b7623d]"
                                }`}
                              />
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#24312e]">
                                {dish.type === "veg" ? "Veg" : "Non-veg"}
                              </span>
                            </div>
                            {unavailable && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                <span className="flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                                  <Ban size={10} /> Unavailable
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Dish Info */}
                          <div className="mt-2 flex-1">
                            <h4
                              className={`font-bold text-xs line-clamp-1 ${
                                unavailable
                                  ? "text-[#84908a] line-through decoration-[#84908a]/40"
                                  : "text-[#24312e]"
                              }`}
                              title={dish.name}
                            >
                              {dish.name}
                            </h4>
                            <div className="mt-0.5 flex items-center justify-between">
                              <span className="text-[10px] text-[#84908a] line-clamp-1">
                                {dish.category}
                              </span>
                              <span className="text-xs font-black text-[#24312e]">
                                {currencySymbol || "₹"}
                                {dish.price}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Handler */}
                          <div className="mt-2.5 pt-2 border-t border-[#f0f1ed]">
                            {unavailable ? (
                              <div className="w-full text-center rounded-lg bg-gray-100 py-1 text-[11px] font-semibold text-gray-400 select-none cursor-not-allowed border border-gray-200">
                                Unavailable
                              </div>
                            ) : inCartQty > 0 ? (
                              <div className="flex items-center justify-between rounded-lg border border-[#315a3d]/40 bg-white p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(dish.id, -1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f0f2ed] text-[#24312e] hover:bg-[#dfe1dc] font-bold cursor-pointer transition"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-black text-[#315a3d] px-1">
                                  {inCartQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(dish.id, 1)}
                                  className="flex h-6 w-6 items-center justify-center rounded-md bg-[#24312e] text-white hover:bg-[#315a3d] font-bold cursor-pointer transition"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddItem(dish)}
                                className="flex w-full items-center justify-center gap-1 rounded-lg border border-[#dfe1dc] bg-[#fbfaf7] py-1 text-[11px] font-bold text-[#24312e] hover:border-[#315a3d] hover:bg-[#e8f1e8] hover:text-[#315a3d] cursor-pointer transition"
                              >
                                <Plus size={12} />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="border-t border-[#e9eae6] bg-white p-3.5 sm:p-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-[#84908a]">
                Order Total:
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-[#24312e]">
                  {currencySymbol || "₹"}
                  {orderTotal.toLocaleString("en-IN")}
                </span>
                {totalItemCount > 0 && (
                  <span className="text-[11px] text-[#84908a]">
                    ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#dfe1dc] px-3.5 py-2.5 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || totalItemCount === 0 || kitchenClosed}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#24312e] px-4 sm:px-6 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer whitespace-nowrap min-w-0"
              >
                <ShoppingBag size={14} className="shrink-0" />
                <span className="truncate">
                  {kitchenClosed
                    ? "Kitchen Closed"
                    : submitting
                      ? "Booking..."
                      : totalItemCount > 0
                        ? `Book Order (${totalItemCount})`
                        : "Book Order"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function getRoleEmail(role: StaffRole) {
  return `${role.toLowerCase()}@tableandthyme.com`;
}

const demoAccountEmails: Record<StaffRole, string> = {
  Manager: "demomanager@restrostack.com",
  Kitchen: "demokitchen@restrostack.com",
  Server: "demoservant@restrostack.com",
};

function isDemoAccountEmail(email?: string) {
  const normalizedEmail = email?.trim().toLowerCase();
  return (
    normalizedEmail === "demo@tableandthyme.com" ||
    Object.values(demoAccountEmails).includes(normalizedEmail || "")
  );
}

function LoginPage({
  onLogin,
  restaurantSettings,
  onNavigateWebsite,
  onNavigateEmployeePortal,
}: {
  onLogin: (
    role: StaffRole,
    staff?: {
      id?: string;
      name: string;
      email?: string;
      phone?: string;
      pin?: string;
      department?: string;
      systemRole: StaffRole;
      isDemoAccount?: boolean;
    },
  ) => void;
  restaurantSettings?: StoreSettings;
  onNavigateWebsite?: () => void;
  onNavigateEmployeePortal?: () => void;
}) {
  const [role, setRole] = useState<StaffRole>("Server");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const selectRole = (nextRole: StaffRole) => {
    setRole(nextRole);
    setEmail("");
    setPassword("");
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const user = await loginWebStaff(email.trim(), password);
      if (user && user.id) {
        if (!user.systemRole || user.systemRole === "None") {
          setError(
            "This employee does not have dashboard station access. Only staff with Manager, Servant, or Kitchen access can log in here.",
          );
          return;
        }
        const mappedRole: StaffRole =
          user.systemRole === "Kitchen"
            ? "Kitchen"
            : user.systemRole === "Manager"
              ? "Manager"
              : "Server";
        onLogin(mappedRole, {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          pin: user.pin,
          department: user.department,
          systemRole: mappedRole,
        });
        return;
      }
    } catch {
      // Fall through to preset / demo credentials check
    }

    const expectedEmail = getRoleEmail(role);
    const normalizedEmail = email.trim().toLowerCase();
    const demoRoleEmail = demoAccountEmails[role];
    const isDemoLogin =
      (normalizedEmail === "demo@tableandthyme.com" ||
        normalizedEmail === demoRoleEmail) &&
      password === "demo123";

    if (
      (normalizedEmail !== expectedEmail && !isDemoLogin) ||
      password !== "demo123"
    ) {
      setError(
        "Invalid email or password. Use your station credentials or a demo account below.",
      );
      return;
    }

    const demoNames: Record<StaffRole, string> = {
      Manager: "Demo Manager",
      Kitchen: "Demo Kitchen",
      Server: "Demo Servant",
    };

    onLogin(role, {
      name: isDemoLogin
        ? demoNames[role] || `Demo ${role}`
        : `${role} Operator`,
      email: isDemoLogin ? demoRoleEmail : normalizedEmail,
      department:
        role === "Manager"
          ? "Management"
          : role === "Kitchen"
            ? "Kitchen"
            : "Floor Service",
      systemRole: role,
      isDemoAccount: isDemoLogin,
    });
  };

  return (
    <div className="paper-grid flex min-h-screen items-center justify-center bg-[#f7f4ef] p-5">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] shadow-[0_20px_70px_rgba(36,49,46,.1)] md:grid-cols-[.85fr_1.15fr]">
        <div className="bg-[#24312e] p-8 text-white sm:p-10">
          {restaurantSettings?.logoUrl ? (
            <img
              src={restaurantSettings.logoUrl}
              alt={restaurantSettings.restaurantName || "Logo"}
              className="h-12 w-12 rounded-xl object-contain border border-white/20 bg-white p-1 shadow-xs"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4bc83] text-[#684f37]">
              <ChefHat size={22} />
            </div>
          )}
          <p className="mt-10 text-[10px] font-bold uppercase tracking-[.2em] text-[#f4bc83]">
            {restaurantSettings?.restaurantName || "Table & Thyme"}
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
          <div className="mt-6 rounded-xl border border-[#ead7c8] bg-[#fff5ed] p-4 text-xs text-[#68736e]">
            <p className="font-bold text-[#24312e]">
              Demo Accounts (No Access)
            </p>
            <p className="mt-2">
              Manager: <strong>demomanager@restrostack.com</strong>
            </p>
            <p className="mt-1">
              Kitchen: <strong>demokitchen@restrostack.com</strong>
            </p>
            <p className="mt-1">
              Servant: <strong>demoservant@restrostack.com</strong>
            </p>
            <p className="mt-2 text-[#b7623d]">
              Password for all demo accounts: <strong>demo123</strong>
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#e0e2dc] pt-4 text-xs font-semibold text-[#68736e]">
            <button
              type="button"
              onClick={onNavigateWebsite}
              className="flex items-center gap-1.5 hover:text-[#24312e] transition"
            >
              <ArrowLeft size={14} />
              Restaurant Website (Home)
            </button>
            <button
              type="button"
              onClick={onNavigateEmployeePortal}
              className="flex items-center gap-1.5 font-bold text-[#315a3d] hover:text-[#24312e] transition"
            >
              Staff Mobile Portal
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerWebsite({
  onBack,
  onOpenPortal,
  onOpenDashboard,
  menuItems,
  soldOutItems,
  onOrderCreated,
  kitchenClosed,
  restaurantSettings,
  currencySymbol = "₹",
}: {
  onBack: () => void;
  onOpenPortal?: () => void;
  onOpenDashboard?: () => void;
  menuItems: ApiMenuItem[];
  soldOutItems: string[];
  onOrderCreated: (order: Order) => void;
  kitchenClosed?: boolean;
  restaurantSettings?: StoreSettings;
  currencySymbol?: string;
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
      setOrderMessage(
        "Kitchen is closed. We are currently not accepting new orders.",
      );
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
        source: "website",
      });
      onOrderCreated(order);
      setCart([]);
      setOrderMessage(
        `Order ${formatOrderLabel(order.id, order.customer)} sent to the kitchen.`,
      );
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
          <div className="flex items-center gap-3">
            {restaurantSettings?.logoUrl ? (
              <img
                src={restaurantSettings.logoUrl}
                alt="Logo"
                className="h-10 w-10 rounded-xl object-contain border border-[#dfe1dc] bg-white p-0.5"
              />
            ) : null}
            <div>
              <p className="display-font text-xl font-bold">
                {restaurantSettings?.restaurantName || "Table & Thyme"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#84908a]">
                Table T08 · Digital menu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPortal && (
              <button
                onClick={onOpenPortal}
                className="flex items-center gap-1.5 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3.5 py-2 text-xs font-bold text-[#4d5752] hover:bg-white transition shadow-xs"
                title="Open Staff Mobile Portal"
              >
                <Users size={14} />
                <span className="hidden sm:inline">Staff Portal</span>
              </button>
            )}
            <button
              onClick={onOpenDashboard || onBack}
              className="flex items-center gap-1.5 rounded-xl bg-[#24312e] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition shadow-xs"
              title="Open Management Station Dashboard"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>
            <button
              className="relative rounded-xl bg-[#f0f1ed] p-2.5 text-[#24312e] hover:bg-[#e4e6df] transition"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#b7623d] text-[10px] font-bold text-white">
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
              We are temporarily not taking new orders. You are welcome to
              browse the digital menu.
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
                    {currencySymbol || "₹"}
                    {item.price}
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
              {cart.length} items · {currencySymbol || "₹"}
              {cartTotal.toLocaleString("en-IN")}
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting || cart.length === 0 || kitchenClosed}
              className="rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {kitchenClosed
                ? "Kitchen Closed"
                : submitting
                  ? "Sending..."
                  : "Place order"}
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

function extractBlogIdentifier(pathname: string, search: string): string {
  if (search && search.startsWith("?")) {
    const raw = search.slice(1);
    if (raw.startsWith("id=")) {
      return decodeURIComponent(raw.slice(3));
    }
    const param = raw.split("&")[0];
    if (param && !param.includes("=")) {
      return decodeURIComponent(param);
    }
    const searchParams = new URLSearchParams(search);
    const qId = searchParams.get("id");
    if (qId) return qId;
  }
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "blog" && parts[1]) {
    return decodeURIComponent(parts[1]);
  }
  return "";
}

export default function RestaurantApp() {
  const [role, setRole] = useState<StaffRole | null>(() => {
    try {
      const savedRole = localStorage.getItem("restro-active-role");
      if (
        savedRole === "Manager" ||
        savedRole === "Server" ||
        savedRole === "Kitchen"
      ) {
        return savedRole as StaffRole;
      }
    } catch {}
    return null;
  });
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    pin?: string;
    department?: string;
    systemRole: StaffRole;
    isDemoAccount?: boolean;
  } | null>(() => {
    try {
      const savedUser = localStorage.getItem("restro-active-user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return {
          ...user,
          isDemoAccount:
            Boolean(user.isDemoAccount) || isDemoAccountEmail(user.email),
        };
      }
    } catch {}
    return null;
  });
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    getRouteFromPath(window.location.pathname),
  );
  const [selectedBlogId, setSelectedBlogId] = useState<string>(() => {
    try {
      return (
        extractBlogIdentifier(
          window.location.pathname,
          window.location.search,
        ) || "blog_1"
      );
    } catch {}
    return "blog_1";
  });

  const navigateTo = (path: string) => {
    if (
      window.location.pathname !== path &&
      window.location.pathname + window.location.search !== path
    ) {
      window.history.pushState({}, "", path);
    }
    const cleanPath = path.split("?")[0];
    const search = path.includes("?")
      ? "?" + path.split("?").slice(1).join("?")
      : "";
    const nextRoute = getRouteFromPath(cleanPath);
    if (nextRoute === "blog") {
      const extracted = extractBlogIdentifier(cleanPath, search);
      if (extracted) setSelectedBlogId(extracted);
    }
    setCurrentRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = getRouteFromPath(window.location.pathname);
      setCurrentRoute(nextRoute);
      if (nextRoute === "blog") {
        const extracted = extractBlogIdentifier(
          window.location.pathname,
          window.location.search,
        );
        if (extracted) setSelectedBlogId(extracted);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    try {
      if (role) {
        localStorage.setItem("restro-active-role", role);
      } else {
        localStorage.removeItem("restro-active-role");
      }
    } catch {}
  }, [role]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("restro-active-user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("restro-active-user");
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (
      currentUser &&
      !currentUser.isDemoAccount &&
      isDemoAccountEmail(currentUser.email)
    ) {
      setCurrentUser((user) =>
        user ? { ...user, isDemoAccount: true } : user,
      );
    }
  }, [currentUser]);

  const handleSignOut = () => {
    setRole(null);
    setCurrentUser(null);
    try {
      localStorage.removeItem("restro-active-role");
      localStorage.removeItem("restro-active-user");
    } catch {}
    navigateTo("/dashboard");
  };
  const [stationPreferences, setStationPreferences] =
    useState<StationDisplayPreferences>(() => {
      try {
        const saved = localStorage.getItem("restro-station-preferences");
        if (saved) return JSON.parse(saved);
      } catch {}
      return {
        ticketDensity: "comfortable",
        tableAlerts: true,
      };
    });
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    restaurantName: "Table & Thyme",
    branchName: "Downtown branch",
    currencySymbol: "₹",
    taxRate: 5.0,
    serviceCharge: 5.0,
    receiptFooter: "Thank you for dining with Table & Thyme!",
    estimatedPrepTimeMinutes: 20,
    tableTurnTimeMinutes: 60,
    logoUrl: "",
    faviconUrl: "",
    isCurrencyLocked: false,
    gstNumber: "07AAAAA0000A1Z5",
    address: "Connaught Place, Central Boulevard, New Delhi 110001",
    websiteTheme: "system",
    reservationDeposit: 500,
    payuMerchantKey: "",
    payuMerchantSalt: "",
    payuTestMode: true,
  });

  useEffect(() => {
    fetchRestaurantSettings()
      .then((data) => {
        if (data) {
          setStoreSettings({
            restaurantName: data.restaurantName || "Table & Thyme",
            branchName: data.branchName || "Downtown branch",
            currencySymbol: data.currencySymbol || "₹",
            taxRate: data.taxRate !== undefined ? data.taxRate : 5.0,
            serviceCharge:
              data.serviceCharge !== undefined ? data.serviceCharge : 5.0,
            receiptFooter:
              data.receiptFooter || "Thank you for dining with Table & Thyme!",
            estimatedPrepTimeMinutes: data.estimatedPrepTimeMinutes || 20,
            tableTurnTimeMinutes: data.tableTurnTimeMinutes || 60,
            logoUrl: data.logoUrl || "",
            faviconUrl: data.faviconUrl || "",
            isCurrencyLocked: Boolean(data.isCurrencyLocked),
            gstNumber: data.gstNumber || "07AAAAA0000A1Z5",
            address:
              data.address ||
              "Connaught Place, Central Boulevard, New Delhi 110001",
            websiteTheme: data.websiteTheme || "system",
            reservationDeposit:
              data.reservationDeposit !== undefined
                ? data.reservationDeposit
                : 500,
            payuMerchantKey: data.payuMerchantKey || "",
            payuMerchantSalt: data.payuMerchantSalt || "",
            payuTestMode: data.payuTestMode ?? true,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (storeSettings.restaurantName) {
      document.title = `${storeSettings.restaurantName}${storeSettings.branchName ? ` · ${storeSettings.branchName}` : ""}`;
    }
  }, [storeSettings.restaurantName, storeSettings.branchName]);

  useEffect(() => {
    if (storeSettings.faviconUrl) {
      setDocumentFavicon(storeSettings.faviconUrl);
    }
  }, [storeSettings.faviconUrl]);

  const handleUpdatePreferences = (nextPrefs: StationDisplayPreferences) => {
    setStationPreferences(nextPrefs);
    try {
      localStorage.setItem(
        "restro-station-preferences",
        JSON.stringify(nextPrefs),
      );
    } catch {}
  };

  const handleUpdateStoreSettings = async (updated: StoreSettings) => {
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

    setStoreSettings(updated);
    try {
      const result = await updateRestaurantSettings(updated);
      if (result) {
        setStoreSettings((prev) => ({
          ...prev,
          restaurantName: result.restaurantName || prev.restaurantName,
          branchName: result.branchName || prev.branchName,
          currencySymbol: result.currencySymbol || prev.currencySymbol,
          taxRate: result.taxRate !== undefined ? result.taxRate : prev.taxRate,
          serviceCharge:
            result.serviceCharge !== undefined
              ? result.serviceCharge
              : prev.serviceCharge,
          receiptFooter: result.receiptFooter || prev.receiptFooter,
          estimatedPrepTimeMinutes:
            result.estimatedPrepTimeMinutes || prev.estimatedPrepTimeMinutes,
          tableTurnTimeMinutes:
            result.tableTurnTimeMinutes || prev.tableTurnTimeMinutes,
          logoUrl: result.logoUrl !== undefined ? result.logoUrl : prev.logoUrl,
          faviconUrl:
            result.faviconUrl !== undefined
              ? result.faviconUrl
              : prev.faviconUrl,
          isCurrencyLocked:
            result.isCurrencyLocked !== undefined
              ? result.isCurrencyLocked
              : prev.isCurrencyLocked,
          gstNumber: result.gstNumber || prev.gstNumber,
          address: result.address || prev.address,
          websiteTheme: result.websiteTheme || prev.websiteTheme,
          reservationDeposit:
            result.reservationDeposit !== undefined
              ? result.reservationDeposit
              : prev.reservationDeposit,
          payuMerchantKey:
            result.payuMerchantKey !== undefined
              ? result.payuMerchantKey
              : prev.payuMerchantKey,
          payuMerchantSalt:
            result.payuMerchantSalt !== undefined
              ? result.payuMerchantSalt
              : prev.payuMerchantSalt,
          payuTestMode:
            result.payuTestMode !== undefined
              ? result.payuTestMode
              : prev.payuTestMode,
        }));
      }
    } catch (err) {
      throw err;
    }
  };

  const [departments, setDepartments] = useState<string[]>([
    "Floor",
    "Kitchen",
    "Bar",
    "Cleaning",
    "Utility",
    "Management",
  ]);

  const loadDepartments = async () => {
    try {
      const data = await fetchDepartments();
      if (Array.isArray(data) && data.length > 0) {
        setDepartments(data);
      }
    } catch (e) {
      console.error("Failed to fetch departments", e);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleAddDepartment = async (name: string): Promise<string[]> => {
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return departments;
    }

    const trimmed = name.trim();
    if (!trimmed) return departments;
    try {
      const updated = await createDepartment(trimmed);
      setDepartments(updated);
      return updated;
    } catch (e) {
      alert("Failed to add department: " + String(e));
      throw e;
    }
  };

  const handleDeleteDepartment = async (name: string): Promise<string[]> => {
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return departments;
    }

    try {
      const updated = await deleteDepartment(name);
      setDepartments(updated);
      return updated;
    } catch (e) {
      alert("Failed to delete department: " + String(e));
      throw e;
    }
  };

  const [activeNav, setActiveNav] = useState<Page>("Overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  useEffect(() => {
    fetchStaff()
      .then((data) => {
        if (Array.isArray(data)) setStaffList(data);
      })
      .catch(() => {});
  }, []);

  const servantStaff = staffList.filter((s) => {
    const dept = (s.department || "").toLowerCase();
    const sysRole = (s.systemRole || "").toLowerCase();
    return (
      dept.includes("floor") ||
      dept.includes("server") ||
      dept.includes("servant") ||
      dept.includes("waiter") ||
      sysRole.includes("server") ||
      sysRole.includes("servant")
    );
  });

  const availableServants =
    servantStaff.length > 0
      ? servantStaff
      : [
          {
            id: "staff_103",
            name: "Arjun Rao",
            department: "Floor",
            systemRole: "Server" as const,
          },
          {
            id: "staff_104",
            name: "Neha Joshi",
            department: "Floor",
            systemRole: "Server" as const,
          },
        ];
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
  const [kitchenClosed, setKitchenClosed] = useState<boolean>(false);
  const [selectedTableForBooking, setSelectedTableForBooking] = useState<
    string | undefined
  >();
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<
    string | undefined
  >();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [appToasts, setAppToasts] = useState<ToastItem[]>([]);

  const appShowToast = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => {
    const id = Math.random().toString(36).slice(2, 9);
    setAppToasts((toasts) => [...toasts, { id, type, title, message }]);
  };

  const removeAppToast = (id: string) => {
    setAppToasts((toasts) => toasts.filter((toast) => toast.id !== id));
  };

  const handleOpenBooking = (tableId?: string) => {
    setSelectedTableForBooking(tableId);
    setShowBooking(true);
  };

  const handleOpenNewOrder = (tableId?: string) => {
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }
    setSelectedTableForOrder(tableId);
    setShowNewOrder(true);
  };

  const handleToggleKitchenClosed = async () => {
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

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
        setSoldOutItems((prev) =>
          Array.from(new Set([...prev, ...unavailable])),
        );
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
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

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
      fetchTables()
        .then(setTables)
        .catch(() => {});
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
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

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
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

    try {
      const updated = await updateBookingStatus(id, status);
      setBookings((current) => current.map((b) => (b.id === id ? updated : b)));
      if ((status === "Arrived" || status === "Seated") && updated.tableId) {
        setTables((prev) =>
          prev.map((tbl) =>
            tbl.id === updated.tableId ? { ...tbl, status: "Occupied" } : tbl,
          ),
        );
      }
      fetchTables()
        .then(setTables)
        .catch(() => {});
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
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

    try {
      await cancelBooking(id);
      setBookings((current) => current.filter((b) => b.id !== id));
      fetchTables()
        .then(setTables)
        .catch(() => {});
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
    fetchTables()
      .then(setTables)
      .catch(() => {});
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((current) => [newOrder, ...current]);
    fetchTables()
      .then(setTables)
      .catch(() => {});
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((current) =>
      current.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    );
    fetchTables()
      .then(setTables)
      .catch(() => {});
  };

  const handleAddTable = async (newTable: {
    id: string;
    seats: number;
    zone: string;
    status: TableStatus;
    serverName: string;
  }) => {
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

    const created = await createTable(newTable);
    setTables((current) => {
      const exists = current.some((t) => t.id === created.id);
      return exists
        ? current.map((t) => (t.id === created.id ? created : t))
        : [...current, created];
    });
    fetchTables()
      .then(setTables)
      .catch(() => {});
  };

  const handleDeleteTable = async (id: string) => {
    if (currentUser?.isDemoAccount) {
      alert("This feature is disabled for the demo account.");
      return;
    }

    await deleteTable(id);
    setTables((current) => current.filter((t) => t.id !== id));
    fetchTables()
      .then(setTables)
      .catch(() => {});
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
  if (currentRoute === "landing") {
    return (
      <PublicWebsite
        onNavigateDashboard={() => navigateTo("/dashboard")}
        onNavigateEmployeePortal={() => navigateTo("/employe")}
        onOpenBlog={(slugOrId) => {
          setSelectedBlogId(slugOrId);
          navigateTo(`/blog?${slugOrId}`);
        }}
        restaurantName={storeSettings.restaurantName}
        restaurantAddress={storeSettings.address}
        branchName={storeSettings.branchName}
        websiteTheme={storeSettings.websiteTheme}
        currencySymbol={storeSettings.currencySymbol || "₹"}
        restaurantLogoUrl={storeSettings.logoUrl}
        faviconUrl={storeSettings.faviconUrl}
        kitchenClosed={kitchenClosed}
      />
    );
  }

  if (currentRoute === "blog") {
    return (
      <BlogPostPage
        blogId={selectedBlogId}
        restaurantName={storeSettings.restaurantName}
        restaurantAddress={storeSettings.address}
        branchName={storeSettings.branchName}
        websiteTheme={storeSettings.websiteTheme}
        onBack={() => navigateTo("/")}
        onNavigateBookTable={() => {
          navigateTo("/");
          setTimeout(() => {
            const el = document.getElementById("reservation");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 150);
        }}
        onSelectBlog={(slugOrId) => {
          setSelectedBlogId(slugOrId);
          navigateTo(`/blog?${slugOrId}`);
        }}
        onNavigateEdit={() => {
          setActiveNav("Website CMS");
          navigateTo("/dashboard");
        }}
      />
    );
  }

  if (currentRoute === "orderfromtable") {
    return (
      <TableOrderPage
        menuItems={menuItems}
        soldOutItems={soldOutItems}
        onOrderCreated={handleOrderCreated}
        kitchenClosed={kitchenClosed}
        currencySymbol={storeSettings.currencySymbol || "₹"}
        restaurantName={storeSettings.restaurantName}
      />
    );
  }

  if (currentRoute === "employee") {
    return (
      <EmployeePortal
        onBackToApp={() => navigateTo("/dashboard")}
        onBackToWebsite={() => navigateTo("/")}
      />
    );
  }

  // currentRoute === "dashboard"
  if (!role) {
    return (
      <LoginPage
        restaurantSettings={storeSettings}
        onNavigateWebsite={() => navigateTo("/")}
        onNavigateEmployeePortal={() => navigateTo("/employe")}
        onLogin={(nextRole, staff) => {
          setRole(nextRole);
          const defaultId =
            nextRole === "Kitchen"
              ? "staff_102"
              : nextRole === "Server"
                ? "staff_103"
                : "staff_101";
          const user = staff
            ? {
                id: staff.id || defaultId,
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                pin: staff.pin,
                department: staff.department,
                systemRole: staff.systemRole || nextRole,
                isDemoAccount:
                  Boolean(staff.isDemoAccount) ||
                  isDemoAccountEmail(staff.email),
              }
            : {
                id: defaultId,
                name:
                  nextRole === "Kitchen"
                    ? "Chef Sunita"
                    : nextRole === "Server"
                      ? "Aarav Rao"
                      : "Priya Shah",
                email: `${nextRole.toLowerCase()}@tableandthyme.com`,
                systemRole: nextRole,
                department:
                  nextRole === "Kitchen"
                    ? "Kitchen"
                    : nextRole === "Server"
                      ? "Floor Service"
                      : "Management",
                isDemoAccount: false,
              };
          setCurrentUser(user);
          try {
            localStorage.setItem("restro-active-role", nextRole);
            localStorage.setItem("restro-active-user", JSON.stringify(user));
          } catch {}
          setActiveNav(nextRole === "Kitchen" ? "Kitchen" : "Overview");
          navigateTo("/dashboard");
        }}
      />
    );
  }

  const isDemoAccountUser = Boolean(currentUser?.isDemoAccount);
  const visibleNavGroups = getNavGroups(role);
  const allowedPages = role ? roleNavGroups[role] : [];
  const safeActiveNav =
    role && allowedPages.includes(activeNav)
      ? activeNav
      : allowedPages[0] || "Overview";

  const pageProps = {
    onBook: handleOpenBooking,
    onOrder: handleOpenNewOrder,
  };
  const page =
    safeActiveNav === "Overview" ? (
      <OverviewPage
        userName={currentUser?.name}
        onBook={handleOpenBooking}
        onOrder={handleOpenNewOrder}
        onWebsite={() => navigateTo("/")}
        onNavigate={(page) => setActiveNav(page)}
        role={role}
        tables={tables}
        orders={orders}
        bookings={bookings}
        onTableStatusChange={handleTableStatusChange}
        kitchenClosed={kitchenClosed}
        onToggleKitchenClosed={handleToggleKitchenClosed}
        currencySymbol={storeSettings.currencySymbol || "₹"}
      />
    ) : safeActiveNav === "Reservations" ? (
      <ReservationsPage
        bookings={bookings}
        onStatusChange={handleBookingStatusChange}
        onCancelBooking={handleCancelBooking}
        onBook={() => handleOpenBooking()}
        kitchenClosed={kitchenClosed}
        currencySymbol={storeSettings.currencySymbol || "₹"}
        defaultDeposit={storeSettings.reservationDeposit ?? 500}
      />
    ) : safeActiveNav === "Floor plan" ? (
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
        isDemoAccount={isDemoAccountUser}
        onDemoAction={(action) =>
          appShowToast(
            "error",
            "Demo access only",
            `${action} is disabled for the demo account.`,
          )
        }
      />
    ) : safeActiveNav === "Orders" ? (
      <OrdersPage
        orders={orders}
        onStatusChange={handleStatusChange}
        onOrder={() => handleOpenNewOrder()}
        kitchenClosed={kitchenClosed}
        role={role}
        currencySymbol={storeSettings.currencySymbol || "₹"}
      />
    ) : safeActiveNav === "Kitchen" ? (
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
    ) : safeActiveNav === "Menu" ? (
      <MenuPage
        menuItems={menuItems}
        onMenuItemsChange={setMenuItems}
        soldOutItems={soldOutItems}
        setSoldOutItems={setSoldOutItems}
        canManage={role === "Manager"}
        currencySymbol={storeSettings.currencySymbol || "₹"}
        currentUser={currentUser}
        showToast={appShowToast}
      />
    ) : safeActiveNav === "Inventory" ? (
      <InventoryPage
        currencySymbol={storeSettings.currencySymbol || "₹"}
        role={role}
        currentUser={currentUser}
        showToast={appShowToast}
      />
    ) : safeActiveNav === "Billing" ? (
      <BillingPage
        tables={tables}
        orders={orders}
        bookings={bookings}
        menuItems={menuItems}
        soldOutItems={soldOutItems}
        restaurantSettings={storeSettings}
        currencySymbol={storeSettings.currencySymbol || "₹"}
        role={role}
        servants={availableServants}
        onTableStatusChange={handleTableStatusChange}
        onOrderStatusChange={handleStatusChange}
        onBookingStatusChange={handleBookingStatusChange}
        onOrderCreated={handleOrderCreated}
        onOrderUpdated={handleOrderUpdated}
        onOrdersChange={setOrders}
        onNavigateSettings={() => setActiveNav("Settings")}
        onNavigateTransactions={() => setActiveNav("Transactions")}
      />
    ) : safeActiveNav === "Transactions" ? (
      <TransactionsPage
        currencySymbol={storeSettings.currencySymbol || "₹"}
        role={role}
        restaurantSettings={storeSettings}
        onNavigateBilling={() => setActiveNav("Billing")}
      />
    ) : safeActiveNav === "Dashboard access" ? (
      <DashboardAccessPage
        onOpenPortal={() => navigateTo("/employe")}
        departments={departments}
        onAddDepartment={handleAddDepartment}
        currentUser={currentUser}
        showToast={appShowToast}
      />
    ) : safeActiveNav === "Employees" || safeActiveNav === "Team" ? (
      <EmployeesPage
        onOpenPortal={() => navigateTo("/employe")}
        departments={departments}
        onAddDepartment={handleAddDepartment}
        onDeleteDepartment={handleDeleteDepartment}
        currentUser={currentUser}
        showToast={appShowToast}
      />
    ) : safeActiveNav === "Website CMS" ? (
      <WebsiteCmsPage
        isDemoAccount={isDemoAccountUser}
        showToast={appShowToast}
      />
    ) : safeActiveNav === "Settings" ? (
      <SettingsPage
        currentUser={currentUser}
        onUpdateCurrentUser={(updated) => {
          setCurrentUser((prev) =>
            prev ? { ...prev, ...updated, systemRole: prev.systemRole } : null,
          );
        }}
        stationPreferences={stationPreferences}
        onUpdatePreferences={handleUpdatePreferences}
        restaurantSettings={storeSettings}
        onUpdateRestaurantSettings={handleUpdateStoreSettings}
        departments={departments}
        onAddDepartment={handleAddDepartment}
        onDeleteDepartment={handleDeleteDepartment}
      />
    ) : (
      <div className="p-8 text-center text-[#84908a]">
        Page not available for this role.
      </div>
    );

  return (
    <div className="paper-grid min-h-screen lg:h-screen lg:overflow-hidden lg:flex flex-col lg:flex-row">
      {/* ==================================================== */}
      {/* MOBILE TOP APP BAR (Sticky on < lg screens)          */}
      {/* ==================================================== */}
      <div className="flex items-center justify-between border-b border-[#dfe1dc] bg-[#fbfaf7] px-3.5 py-2.5 lg:hidden sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-xl border border-[#dfe1dc] bg-white p-2 text-[#24312e] hover:bg-[#f0f1ed] transition cursor-pointer shadow-2xs shrink-0"
            aria-label="Open Navigation Menu"
            title="Open navigation menu"
          >
            <MenuIcon size={18} />
          </button>
          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer"
            onClick={() => setActiveNav("Overview")}
          >
            {storeSettings.logoUrl ? (
              <img
                src={storeSettings.logoUrl}
                alt={storeSettings.restaurantName || "Logo"}
                className="h-7 w-7 rounded-lg object-contain border border-[#dfe1dc] bg-white p-0.5 shrink-0"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#24312e] text-[#f4bc83] shrink-0 font-bold">
                <ChefHat size={15} />
              </div>
            )}
            <div className="min-w-0">
              <span className="display-font text-xs font-bold text-[#24312e] truncate block max-w-[130px] sm:max-w-[200px]">
                {storeSettings.restaurantName || "Table & Thyme"}
              </span>
              <span className="text-[9px] font-bold text-[#315a3d] bg-[#e6eee5] px-1.5 py-0.2 rounded-md uppercase tracking-wider truncate inline-block">
                {safeActiveNav}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {kitchenClosed && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 border border-red-300 text-red-800 text-[10px] font-bold">
              <AlertTriangle size={12} />
              <span className="hidden xs:inline">Closed</span>
            </div>
          )}
          <button
            onClick={() => setShowNotificationCenter(true)}
            className="relative rounded-lg border border-[#dfe1dc] bg-white p-1.5 sm:p-2 text-[#68736e] hover:text-[#24312e] transition cursor-pointer"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#b7623d] px-0.5 text-[8px] font-bold text-white">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveNav("Settings")}
            className={`rounded-lg border border-[#dfe1dc] p-1.5 sm:p-2 transition cursor-pointer ${
              safeActiveNav === "Settings"
                ? "bg-[#24312e] text-white"
                : "bg-white text-[#68736e]"
            }`}
            aria-label="Settings"
            title="Settings"
          >
            <Settings2 size={16} />
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-[#dfe1dc] bg-white p-1.5 sm:p-2 text-red-600 hover:bg-red-50 transition cursor-pointer"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE FAST-SWITCH CATEGORY CHIPS                    */}
      {/* ==================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#dfe1dc] bg-[#f8f7f4] px-3 py-1.5 lg:hidden">
        {visibleNavGroups
          .flatMap((g) => g.items)
          .map(({ label, icon: NavIcon }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                safeActiveNav === label
                  ? "bg-[#24312e] text-white shadow-2xs font-bold"
                  : "bg-white border border-[#dfe1dc] text-[#68736e] hover:bg-[#f0f1ed]"
              }`}
            >
              <NavIcon size={13} />
              <span>{label}</span>
            </button>
          ))}
      </div>

      {/* ==================================================== */}
      {/* SLIDE-OVER MOBILE NAVIGATION DRAWER                  */}
      {/* ==================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative flex w-72 max-w-[85vw] flex-col bg-[#fbfaf7] shadow-2xl z-10 border-r border-[#dfe1dc] animate-in slide-in-from-left duration-200">
            {/* Drawer Top */}
            <div className="flex items-center justify-between border-b border-[#dfe1dc] px-5 py-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {storeSettings.logoUrl ? (
                  <img
                    src={storeSettings.logoUrl}
                    alt={storeSettings.restaurantName || "Logo"}
                    className="h-8 w-8 rounded-lg object-contain border border-[#dfe1dc] bg-white p-0.5 shrink-0"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#24312e] text-[#f4bc83] shrink-0 font-bold">
                    <ChefHat size={16} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="display-font text-sm font-bold text-[#24312e] truncate">
                    {storeSettings.restaurantName || "Table & Thyme"}
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#84908a] truncate">
                    {storeSettings.branchName || "Restaurant OS"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-[#68736e] hover:bg-[#f0f1ed] transition cursor-pointer"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Quick Info */}
            <div className="border-b border-[#e9eae6] bg-[#f0f1ed]/60 px-5 py-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4bc83] text-xs font-bold text-[#684f37] shrink-0">
                {currentUser?.name
                  ? currentUser.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : role === "Kitchen"
                    ? "CS"
                    : role === "Server"
                      ? "AR"
                      : "PS"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#24312e]">
                  {currentUser?.name ||
                    (role === "Kitchen"
                      ? "Chef Sunita"
                      : role === "Server"
                        ? "Aarav Rao"
                        : "Priya Shah")}
                </p>
                <p className="truncate text-[10px] text-[#84908a]">
                  {currentUser?.department || role} ({role})
                </p>
              </div>
            </div>

            {/* Drawer Nav Items */}
            <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 space-y-4">
              {visibleNavGroups.map((group) => {
                const navItems = group.items.filter(
                  (item) => item.label !== "Settings",
                );
                if (navItems.length === 0) return null;
                return (
                  <div key={group.title}>
                    <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[.18em] text-[#a1aaa4]">
                      {group.title}
                    </p>
                    <div className="space-y-0.5">
                      {navItems.map(({ label, icon: NavIcon }) => (
                        <button
                          key={label}
                          onClick={() => {
                            setActiveNav(label);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                            safeActiveNav === label
                              ? "bg-[#e6eee5] text-[#315a3d] font-bold shadow-2xs"
                              : "text-[#74807a] hover:bg-[#f0f1ed]"
                          }`}
                        >
                          <NavIcon size={16} strokeWidth={1.8} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="border-t border-[#e4e5df] p-3 space-y-1.5 bg-[#fbfaf7]">
              <button
                onClick={() => {
                  setActiveNav("Settings");
                  setIsMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  safeActiveNav === "Settings"
                    ? "bg-[#e6eee5] text-[#315a3d] font-bold"
                    : "text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <Settings2 size={16} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DESKTOP PERSISTENT SIDEBAR                           */}
      {/* ==================================================== */}
      <aside className="hidden lg:flex w-64 h-screen shrink-0 flex-col border-r border-[#dfe1dc] bg-[#fbfaf7] overflow-y-auto sidebar-scroll">
        <div className="flex shrink-0 items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3 min-w-0">
            {storeSettings.logoUrl ? (
              <img
                src={storeSettings.logoUrl}
                alt={storeSettings.restaurantName || "Logo"}
                className="h-10 w-10 rounded-xl object-contain border border-[#dfe1dc] bg-white p-0.5 shadow-2xs shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83] shrink-0">
                <ChefHat size={21} />
              </div>
            )}
            <div className="min-w-0">
              <p
                className="display-font text-lg font-bold text-[#24312e] truncate max-w-[130px]"
                title={storeSettings.restaurantName}
              >
                {storeSettings.restaurantName || "Table & Thyme"}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#84908a] truncate">
                {storeSettings.branchName || "Restaurant OS"}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-3">
          {visibleNavGroups.map((group) => {
            const navItems = group.items.filter(
              (item) => item.label !== "Settings",
            );
            if (navItems.length === 0) return null;
            return (
              <div key={group.title} className="mb-6">
                <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#a1aaa4]">
                  {group.title}
                </p>
                {navItems.map(({ label, icon: NavIcon }) => (
                  <button
                    key={label}
                    onClick={() => setActiveNav(label)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition cursor-pointer ${safeActiveNav === label ? "bg-[#e6eee5] text-[#315a3d]" : "text-[#74807a] hover:bg-[#f0f1ed]"}`}
                  >
                    <NavIcon size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 border-t border-[#e4e5df] p-4 sticky bottom-0 bg-[#fbfaf7]">
          <button
            onClick={() => setActiveNav("Settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition cursor-pointer ${
              safeActiveNav === "Settings"
                ? "bg-[#e6eee5] text-[#315a3d]"
                : "text-[#74807a] hover:bg-[#f0f1ed]"
            }`}
          >
            <Settings2 size={18} />
            Settings
          </button>
          <div
            onClick={() => setActiveNav("Settings")}
            className="mt-4 flex items-center gap-3 rounded-xl bg-[#f0f1ed] p-3 cursor-pointer hover:bg-[#e7eae4] transition"
            title="Click to view profile & settings"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4bc83] text-xs font-bold text-[#684f37]">
              {currentUser?.name
                ? currentUser.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : role === "Kitchen"
                  ? "CS"
                  : role === "Server"
                    ? "AR"
                    : "PS"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#24312e]">
                {currentUser?.name ||
                  (role === "Kitchen"
                    ? "Chef Sunita"
                    : role === "Server"
                      ? "Aarav Rao"
                      : "Priya Shah")}
              </p>
              <p className="truncate text-[11px] text-[#84908a]">
                {currentUser?.department
                  ? `${currentUser.department} (${role})`
                  : role === "Kitchen"
                    ? "Kitchen Lead (Kitchen)"
                    : role === "Server"
                      ? "Floor Server (Server)"
                      : "General Manager (Manager)"}
              </p>
            </div>
            <ChevronDown className="ml-auto text-[#84908a]" size={15} />
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* MAIN DASHBOARD CONTENT AREA                          */}
      {/* ==================================================== */}
      <main className="min-w-0 flex-1 px-3.5 py-4 sm:px-6 sm:py-6 lg:h-screen lg:overflow-y-auto lg:px-12 lg:py-10">
        <header className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e4e5df] pb-3 sm:pb-5">
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold text-[#84908a] min-w-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[#e8f1e8] text-[#3b724c] shrink-0">
              <UserRound size={15} />
            </div>
            <span className="truncate">
              <span className="font-bold text-[#24312e]">
                {storeSettings.restaurantName || "Table & Thyme"}
              </span>
              {storeSettings.branchName ? ` · ${storeSettings.branchName}` : ""}{" "}
              <span className="mx-1 text-[#c0c5c1]">/</span>{" "}
              <span className="text-[#315a3d] font-bold">{safeActiveNav}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {kitchenClosed && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-red-100 border border-red-300 text-red-800 text-[11px] sm:text-xs font-bold">
                <AlertTriangle size={13} />
                <span>Kitchen Closed</span>
              </div>
            )}
            <button
              onClick={() => setActiveNav("Settings")}
              className={`hidden sm:flex rounded-xl border border-[#dfe1dc] p-2 sm:p-2.5 transition cursor-pointer ${
                safeActiveNav === "Settings"
                  ? "bg-[#24312e] text-white shadow-xs"
                  : "bg-[#fbfaf7] text-[#68736e] hover:bg-white hover:text-[#24312e]"
              }`}
              aria-label="Settings"
              title="Station & User Settings"
            >
              <Settings2 size={16} />
            </button>
            <button
              onClick={() => setShowNotificationCenter(true)}
              className="hidden sm:flex relative rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-2 sm:p-2.5 text-[#68736e] hover:bg-white hover:text-[#24312e] transition cursor-pointer"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b7623d] px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              ) : (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
            {(role === "Server" || role === "Manager") && (
              <>
                <button
                  disabled={kitchenClosed}
                  className={`flex items-center gap-1.5 rounded-lg border border-[#dfe1dc] px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                    kitchenClosed
                      ? "opacity-50 cursor-not-allowed text-[#84908a] bg-[#f0f1ed]"
                      : "text-[#315a3d] bg-white hover:bg-[#f0f1ed] shadow-2xs"
                  }`}
                  onClick={() => handleOpenBooking()}
                  title={
                    kitchenClosed
                      ? "Kitchen is closed. Cannot book tables."
                      : undefined
                  }
                >
                  <CalendarCheck size={13} />
                  <span>Book table</span>
                </button>
                <button
                  disabled={kitchenClosed}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-white transition cursor-pointer shadow-2xs ${
                    kitchenClosed
                      ? "opacity-50 cursor-not-allowed bg-[#74807a]"
                      : "bg-[#24312e] hover:bg-[#315a3d]"
                  }`}
                  onClick={() => handleOpenNewOrder()}
                  title={
                    kitchenClosed
                      ? "Kitchen is closed. Cannot place new orders."
                      : undefined
                  }
                >
                  <Plus size={13} />
                  <span>New order</span>
                </button>
              </>
            )}
            <button
              onClick={() => navigateTo("/employe")}
              className="hidden items-center gap-1.5 rounded-lg border border-[#dfe1dc] px-2.5 py-1.5 text-[11px] font-semibold text-[#68736e] sm:flex hover:bg-white transition"
              title="Open Staff Mobile Portal"
            >
              <Smartphone size={13} />
              <span>Staff portal</span>
            </button>
            <button
              onClick={handleSignOut}
              className="hidden items-center gap-1.5 rounded-lg border border-[#dfe1dc] px-2.5 py-1.5 text-[11px] font-semibold text-[#68736e] sm:flex hover:bg-white transition"
            >
              <LogOut size={13} />
              <span>Sign out</span>
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
                    New orders and table bookings are disabled restaurant-wide
                    until the kitchen is reopened.
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
          currencySymbol={storeSettings.currencySymbol || "₹"}
          defaultDeposit={storeSettings.reservationDeposit ?? 500}
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
          currencySymbol={storeSettings.currencySymbol || "₹"}
          servants={availableServants}
          onOrderCreated={handleOrderCreated}
          onClose={() => {
            setShowNewOrder(false);
            setSelectedTableForOrder(undefined);
          }}
        />
      )}
      {showNotificationCenter && role && (
        <NotificationCenterModal
          isOpen={showNotificationCenter}
          onClose={() => setShowNotificationCenter(false)}
          role={role as any}
          onNavigate={(p) => setActiveNav(p as Page)}
          onUnreadCountChange={(cnt) => setUnreadNotificationCount(cnt)}
        />
      )}
      <ToastContainer toasts={appToasts} onDismiss={removeAppToast} />
    </div>
  );
}
