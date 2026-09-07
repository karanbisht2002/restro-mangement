import { useEffect, useState } from "react";
import type { ComponentType, FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
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
  UserRound,
  Users,
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
import { managerPages } from "./manager/permissions";
import { serverPages } from "./servant/permissions";
import type { Order, OrderStatus, Page, StaffRole } from "./types";
import { createOrder, fetchOrders, updateOrderStatus } from "./api/orders";
import {
  createMenuItem,
  fetchMenuItems,
  type MenuItem as ApiMenuItem,
} from "./api/items";

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
const tables = [
  { id: "T01", seats: 2, zone: "Window", status: "Available" },
  { id: "T02", seats: 4, zone: "Family", status: "Occupied" },
  { id: "T03", seats: 4, zone: "Family", status: "Needs cleaning" },
  { id: "T04", seats: 6, zone: "Garden", status: "Available" },
  { id: "T05", seats: 2, zone: "Window", status: "Booked" },
  { id: "T06", seats: 8, zone: "Family", status: "Occupied" },
  { id: "T07", seats: 4, zone: "Garden", status: "Available" },
  { id: "T08", seats: 6, zone: "Smoking", status: "Occupied" },
  { id: "T09", seats: 2, zone: "Window", status: "Available" },
  { id: "T10", seats: 4, zone: "Family", status: "Booked" },
];
const reservations = [
  {
    name: "Maya Kapoor",
    time: "12:30 PM",
    guests: 4,
    table: "T05",
    status: "Booked",
    deposit: "₹500",
  },
  {
    name: "Rohan Mehta",
    time: "1:00 PM",
    guests: 2,
    table: "T01",
    status: "Arrived",
    deposit: "₹500",
  },
  {
    name: "The Sharma party",
    time: "7:30 PM",
    guests: 6,
    table: "Pending",
    status: "Booked",
    deposit: "₹500",
  },
  {
    name: "Anika Singh",
    time: "8:00 PM",
    guests: 3,
    table: "T10",
    status: "No show",
    deposit: "₹500",
  },
];
const fallbackMenuItems: ApiMenuItem[] = [
  {
    id: "fallback-bao",
    name: "Truffle mushroom bao",
    category: "Small plates",
    price: 420,
    type: "veg",
    image: "",
    description: "Steamed bao filled with roasted mushrooms and truffle aioli.",
    available: true,
    preparationTimeMinutes: 12,
    allergens: ["gluten", "soy"],
    tags: ["vegan", "popular"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-paneer",
    name: "Charred paneer tikka",
    category: "Small plates",
    price: 520,
    type: "veg",
    image: "",
    description: "Charred paneer with peppers and house spices.",
    available: true,
    preparationTimeMinutes: 15,
    allergens: ["dairy"],
    tags: ["veg"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-chicken",
    name: "Citrus butter chicken",
    category: "Mains",
    price: 680,
    type: "non-veg",
    image: "",
    description: "Tender chicken in a bright citrus butter sauce.",
    available: true,
    preparationTimeMinutes: 20,
    allergens: ["dairy"],
    tags: ["non-veg", "popular"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-risotto",
    name: "Wild mushroom risotto",
    category: "Mains",
    price: 590,
    type: "veg",
    image: "",
    description: "Creamy Arborio rice with wild mushrooms and herbs.",
    available: false,
    preparationTimeMinutes: 22,
    allergens: ["dairy"],
    tags: ["veg"],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-cheesecake",
    name: "Burnt basque cheesecake",
    category: "Desserts",
    price: 360,
    type: "veg",
    image: "",
    description: "Silky baked cheesecake with a caramelized top.",
    available: true,
    preparationTimeMinutes: 8,
    allergens: ["dairy", "egg"],
    tags: ["veg"],
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
  const tone = [
    "Ready",
    "Notified",
    "Available",
    "Completed",
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
  isManager,
}: {
  onBook: () => void;
  onOrder: () => void;
  onWebsite: () => void;
  isManager: boolean;
}) {
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
              onClick={onBook}
              className="flex items-center gap-2 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-4 py-3 text-sm font-bold text-[#315a3d] hover:bg-white"
            >
              <CalendarCheck size={18} />
              Book table
            </button>
            <button
              onClick={onOrder}
              className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white hover:bg-[#315a3d]"
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
          value="18"
          change="+4 since 11am"
          icon={ShoppingBag}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Tables occupied"
          value="14 / 22"
          change="64% capacity"
          icon={Users}
          color="bg-[#eee8f6] text-[#72558e]"
        />
      </section>
      {isManager && <ManagerControlPanel />}
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
              {initialOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#f0f1ed] last:border-0"
                >
                  <td className="py-4 font-bold text-[#24312e]">{order.id}</td>
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

function ReservationsPage({ onBook }: { onBook: () => void }) {
  return (
    <>
      <SectionHeading
        eyebrow="Guest experience"
        title="Reservations"
        description="Keep your floor moving with clear booking windows and table assignments."
        action={
          <button
            onClick={onBook}
            className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white hover:bg-[#315a3d]"
          >
            <Plus size={18} />
            New reservation
          </button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Today's bookings"
          value="24"
          change="+6 this week"
          icon={CalendarCheck}
          color="bg-[#fbe8dc] text-[#b7623d]"
        />
        <StatCard
          label="Expected guests"
          value="86"
          change="72% confirmed"
          icon={Users}
          color="bg-[#e8f1e8] text-[#3b724c]"
        />
        <StatCard
          label="Deposit collected"
          value="₹12,000"
          change="24 reservations"
          icon={CreditCard}
          color="bg-[#eee8f6] text-[#72558e]"
        />
      </div>
      <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="display-font text-xl font-bold">
              Tuesday, September 24
            </h2>
            <p className="mt-1 text-xs text-[#84908a]">
              90-minute turnover buffer enabled
            </p>
          </div>
          <button
            className="rounded-lg border border-[#dfe1dc] p-2 text-[#68736e]"
            aria-label="Change reservation date"
          >
            <CalendarDays size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {reservations.map((reservation) => (
            <div
              key={`${reservation.name}-${reservation.time}`}
              className="grid gap-3 rounded-xl border border-[#eef0eb] bg-white p-4 sm:grid-cols-[1.4fr_1fr_.7fr_.8fr_.7fr] sm:items-center"
            >
              <div>
                <p className="font-bold text-[#24312e]">{reservation.name}</p>
                <p className="mt-1 text-xs text-[#84908a]">
                  Deposit {reservation.deposit} • adjusted on final bill
                </p>
              </div>
              <p className="text-sm text-[#68736e]">
                <Clock3 className="mr-1 inline" size={14} />
                {reservation.time}
              </p>
              <p className="text-sm text-[#68736e]">
                {reservation.guests} guests
              </p>
              <p className="text-sm text-[#68736e]">
                {reservation.table === "Pending" ? (
                  <span className="text-[#b7623d]">Auto-allocate</span>
                ) : (
                  reservation.table
                )}
              </p>
              <StatusPill status={reservation.status} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function FloorPlanPage({ onBook }: { onBook: () => void }) {
  const [selectedTable, setSelectedTable] = useState("T02");
  const selected = tables.find((table) => table.id === selectedTable);
  return (
    <>
      <SectionHeading
        eyebrow="Live floor"
        title="Floor plan"
        description="Manage table status, seating zones, QR codes, and server coverage."
        action={
          <div className="flex gap-3">
            <button
              onClick={onBook}
              className="flex items-center gap-2 rounded-xl border border-[#dfe1dc] px-4 py-3 text-sm font-bold text-[#315a3d]"
            >
              <CalendarCheck size={18} />
              Book table
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white">
              <Plus size={18} />
              Add table
            </button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-7">
          <div className="mb-7 flex flex-wrap gap-4 text-xs font-semibold text-[#68736e]">
            <span>
              <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#9ac49f]" />
              Available
            </span>
            <span>
              <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#d98865]" />
              Occupied
            </span>
            <span>
              <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#e5bd7e]" />
              Booked
            </span>
            <span>
              <i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#aab1ac]" />
              Cleaning
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tables.map((table) => {
              const tableColor =
                table.status === "Available"
                  ? "border-[#9ac49f] bg-[#e8f1e8] text-[#315a3d]"
                  : table.status === "Occupied"
                    ? "border-[#d98865] bg-[#fbe8dc] text-[#946243]"
                    : table.status === "Booked"
                      ? "border-[#e5bd7e] bg-[#fff5dc] text-[#87632e]"
                      : "border-[#aab1ac] bg-[#eceeea] text-[#68736e]";
              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 transition hover:-translate-y-0.5 ${selectedTable === table.id ? "ring-2 ring-[#24312e] ring-offset-2" : ""} ${tableColor}`}
                >
                  <Table2 size={27} />
                  <strong className="mt-2 text-sm">{table.id}</strong>
                  <span className="text-[10px]">{table.seats} seats</span>
                  <span className="absolute bottom-2 text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {table.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <aside className="rounded-2xl border border-[#e0e2dc] bg-[#24312e] p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f4bc83]">
            Selected table
          </p>
          <div className="mt-4 flex items-center justify-between">
            <h2 className="display-font text-2xl font-bold">{selected?.id}</h2>
            <QrCode className="text-[#f4bc83]" />
          </div>
          <div className="mt-6 space-y-4 border-t border-[#41504a] pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#aab8b0]">Status</span>
              <span>{selected?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#aab8b0]">Capacity</span>
              <span>{selected?.seats} guests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#aab8b0]">Zone</span>
              <span>{selected?.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#aab8b0]">Server</span>
              <span>Priya S.</span>
            </div>
          </div>
          <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f4bc83] px-4 py-3 text-sm font-bold text-[#684f37]">
            <QrCode size={17} />
            View permanent QR
          </button>
        </aside>
      </div>
    </>
  );
}

function OrdersPage({
  orders,
  onStatusChange,
}: {
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [tab, setTab] = useState<"all" | "pending" | "new" | "served">("all");
  const advance = (id: string) => {
    const order = orders.find((candidate) => candidate.id === id);
    if (order)
      onStatusChange(id, order.status === "Ready" ? "Notified" : "Served");
  };
  return (
    <>
      <SectionHeading
        eyebrow="Service control"
        title="Orders"
        description="Every customer, server, and takeaway order in one live queue."
        action={
          <button className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white">
            <Plus size={18} />
            New order
          </button>
        }
      />
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
                            {order.id}{" "}
                            <span className="ml-2 text-xs font-medium text-[#84908a]">
                              {order.table}
                            </span>
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#315a3d]">
                            {order.customer}
                          </p>
                          <p className="mt-2 text-xs text-[#68736e]">
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
                      <div className="mt-4 flex items-center justify-between border-t border-[#f0f1ed] pt-3">
                        <span className="text-xs text-[#84908a]">
                          {order.status === "Notified"
                            ? "Kitchen marked this order ready"
                            : "Shared table session"}
                        </span>
                        {(order.status === "Ready" ||
                          order.status === "Notified") && (
                          <button
                            onClick={() => advance(order.id)}
                            className="rounded-lg bg-[#e8f1e8] px-3 py-2 text-xs font-bold text-[#3b724c]"
                          >
                            {order.status === "Notified"
                              ? "Mark served"
                              : "Move to next stage"}
                          </button>
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
  onStatusChange,
  soldOutItems,
  setSoldOutItems,
}: {
  orders: Order[];
  menuItems: ApiMenuItem[];
  onStatusChange: (id: string, status: OrderStatus) => void;
  soldOutItems: string[];
  setSoldOutItems: (items: string[]) => void;
}) {
  const [station, setStation] = useState("All stations");
  const [soundOn, setSoundOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const active = orders
    .filter((order) => ["Queued", "Preparing", "Ready"].includes(order.status))
    .filter(
      (order) =>
        station === "All stations" ||
        kitchenTicketDetails[order.id]?.station === station,
    );
  const servedOrders = orders.filter((order) => order.status === "Served");
  const moveTicket = (id: string, nextStatus: OrderStatus) =>
    onStatusChange(id, nextStatus);
  const toggleSoldOut = (item: string) =>
    setSoldOutItems(toggleSoldOutItem(soldOutItems, item));
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
            <button
              onClick={() => setPaused(!paused)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${paused ? "border-[#ead7c8] bg-[#fff5ed] text-[#b7623d]" : "border-[#dfe1dc] text-[#68736e]"}`}
            >
              <PauseCircle size={16} />
              {paused ? "Resume intake" : "Pause intake"}
            </button>
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
      {paused && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#ead7c8] bg-[#fff5ed] p-4 text-sm text-[#946243]">
          <PauseCircle size={18} />
          <span>
            <strong>New ticket intake is paused.</strong> Existing tickets can
            still be completed.
          </span>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        {["Queued", "Preparing", "Ready"].map((column) => (
          <div key={column}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-[#24312e]">{column}</h2>
              <span className="rounded-full bg-[#eceeea] px-2 py-1 text-[10px] font-bold text-[#68736e]">
                {active.filter((order) => order.status === column).length}
              </span>
            </div>
            <div className="space-y-3">
              {active
                .filter((order) => order.status === column)
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
                            {order.id}{" "}
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#b7623d]">
                              {detail.station}
                            </span>
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#315a3d]">
                            {order.customer}
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
                      <button
                        onClick={() =>
                          moveTicket(
                            order.id,
                            column === "Ready"
                              ? notifyServer(order.status)
                              : getNextKitchenStatus(order.status),
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#24312e] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d]"
                      >
                        <Check size={15} />
                        {column === "Ready"
                          ? "Notify server"
                          : `Mark ${column === "Queued" ? "preparing" : "ready"}`}
                      </button>
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
                      {order.id}{" "}
                      <span className="ml-2 text-xs font-medium text-[#84908a]">
                        {order.table}
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#315a3d]">
                      {order.customer}
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
              Mark an item sold out here and it disappears from the customer
              website.
            </p>
          </div>
          <ChefHat size={21} className="text-[#b7623d]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const soldOut = soldOutItems.includes(item.name);
            return (
              <button
                key={item}
                onClick={() => toggleSoldOut(item.name)}
                className="flex items-center justify-between rounded-xl border border-[#eef0eb] bg-white p-4 text-left"
              >
                <span>
                  <strong className="block text-sm text-[#24312e]">
                    {item.name}
                  </strong>
                  <small className="mt-1 block text-xs text-[#84908a]">
                    {soldOut
                      ? "Not accepting new orders"
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

function MenuPage({
  menuItems,
  soldOutItems,
  setSoldOutItems,
  canCreate,
}: {
  menuItems: ApiMenuItem[];
  soldOutItems: string[];
  setSoldOutItems: (items: string[]) => void;
  canCreate: boolean;
}) {
  const [category, setCategory] = useState("All items");
  const [showCreate, setShowCreate] = useState(false);
  const [createdItems, setCreatedItems] = useState<ApiMenuItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const categories = ["All items", "Small plates", "Mains", "Desserts"];
  const allItems = [...menuItems, ...createdItems];

  const submitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const item = await createMenuItem({
        name: String(form.get("name")),
        price: Number(form.get("price")),
        type: String(form.get("type")) as "veg" | "non-veg",
        image: String(form.get("image")),
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
      setCreatedItems((items) => [item, ...items]);
      setShowCreate(false);
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
  return (
    <>
      <SectionHeading
        eyebrow="Menu engineering"
        title="Menu"
        description="Manage dishes, variants, add-ons, dietary tags, and live availability."
        action={
          canCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white"
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
            className={`rounded-full px-4 py-2 text-xs font-bold ${category === item ? "bg-[#24312e] text-white" : "border border-[#dfe1dc] text-[#68736e]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allItems
          .filter(
            (item) => category === "All items" || item.category === category,
          )
          .map((item) => {
            const isSoldOut = soldOutItems.includes(item.name);
            return (
              <article
                key={item.name}
                className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5"
              >
                <div className="flex h-28 items-center justify-center rounded-xl bg-[#e9eee5] text-[#315a3d]">
                  <Utensils size={34} strokeWidth={1.2} />
                </div>
                <div className="mt-4 flex justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#24312e]">{item.name}</p>
                    <p className="mt-1 text-xs text-[#84908a]">
                      {item.category} •{" "}
                      {typeof item.price === "number"
                        ? `₹${item.price.toLocaleString("en-IN")}`
                        : item.price}
                    </p>
                  </div>
                  <MoreHorizontal size={18} className="text-[#84908a]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#eceeea] px-2 py-1 text-[10px] font-bold text-[#68736e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setSoldOutItems(
                      isSoldOut
                        ? soldOutItems.filter((name) => name !== item.name)
                        : [...soldOutItems, item.name],
                    )
                  }
                  className={`mt-4 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-bold ${isSoldOut ? "border-[#ead7c8] bg-[#fff5ed] text-[#b7623d]" : "border-[#dfe1dc] text-[#3b724c]"}`}
                >
                  <span>
                    {isSoldOut
                      ? "Sold out on digital menu"
                      : "Available online"}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${isSoldOut ? "bg-[#b7623d]" : "bg-[#3b724c]"}`}
                  />
                </button>
              </article>
            );
          })}
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#24312e]/35 p-5">
          <form
            onSubmit={submitItem}
            className="my-auto w-full max-w-lg rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b7623d]">
                  Menu engineering
                </p>
                <h2 className="display-font mt-2 text-2xl font-bold text-[#24312e]">
                  Create menu item
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-[#84908a]"
                aria-label="Close create menu item"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#68736e]">
                Item name
                <input
                  name="name"
                  required
                  placeholder="e.g. Paneer tikka"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Price
                <input
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  placeholder="420"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Type
                <select
                  name="type"
                  defaultValue="veg"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-veg</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Category
                <input
                  name="category"
                  required
                  placeholder="Mains"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Preparation time (minutes)
                <input
                  name="preparationTimeMinutes"
                  required
                  min="0"
                  type="number"
                  defaultValue="15"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Image URL
                <input
                  name="image"
                  required
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
                />
              </label>
            </div>
            <label className="mt-4 block text-xs font-bold text-[#68736e]">
              Description
              <textarea
                name="description"
                required
                rows={2}
                placeholder="Describe the dish"
                className="mt-2 w-full resize-none rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
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
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
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
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] px-3 py-3 text-sm outline-none focus:border-[#b7623d]"
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
              className="mt-5 w-full rounded-xl bg-[#24312e] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving item..." : "Create menu item"}
            </button>
          </form>
        </div>
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

function BookingModal({ onClose }: { onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirmed(true);
  };
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#24312e]/35 p-5">
      <div className="my-auto w-full max-w-lg rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#b7623d]">
              <CalendarCheck size={15} />
              Reservation
            </div>
            <h2 className="display-font text-2xl font-bold text-[#24312e]">
              Book a table
            </h2>
            <p className="mt-2 text-sm text-[#84908a]">
              Reserve a table and secure the guest’s visit.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#84908a]"
            aria-label="Close booking dialog"
          >
            <X size={19} />
          </button>
        </div>
        {confirmed ? (
          <div className="mt-8 rounded-xl border border-[#cfe0d0] bg-[#e8f1e8] p-5 text-center">
            <CheckCircle2 className="mx-auto text-[#3b724c]" size={34} />
            <h3 className="mt-3 font-bold text-[#315a3d]">
              Table reserved successfully
            </h3>
            <p className="mt-2 text-sm text-[#58715e]">
              The ₹500 booking deposit is confirmed and will be adjusted against
              the final bill.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-[#24312e] px-5 py-3 text-sm font-bold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Guest name", "text", "Enter guest name"],
                ["Contact number", "tel", "e.g. 98765 43210"],
                ["Date", "date", ""],
                ["Time", "time", ""],
              ].map(([label, type, placeholder]) => (
                <label key={label} className="text-xs font-bold text-[#68736e]">
                  {label}
                  <input
                    required
                    type={type}
                    placeholder={placeholder}
                    className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none placeholder:text-[#aab1ac] focus:border-[#b7623d]"
                  />
                </label>
              ))}
              <label className="text-xs font-bold text-[#68736e]">
                Number of guests
                <select
                  required
                  defaultValue="2"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none"
                >
                  <option>2 guests</option>
                  <option>4 guests</option>
                  <option>6 guests</option>
                  <option>8+ guests</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#68736e]">
                Booking source
                <select
                  required
                  defaultValue="Phone"
                  className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none"
                >
                  <option>Phone</option>
                  <option>Walk-in</option>
                  <option>Web link</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block text-xs font-bold text-[#68736e]">
              Special requests
              <textarea
                rows={2}
                placeholder="Birthday, dietary needs, preferred seating..."
                className="mt-2 w-full resize-none rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none"
              />
            </label>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#ead7c8] bg-[#fff5ed] p-4">
              <CreditCard
                className="mt-0.5 shrink-0 text-[#b7623d]"
                size={19}
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-[#684f37]">
                  Booking deposit{" "}
                  <span className="float-right text-base">₹500</span>
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8f7055]">
                  Collected now and adjusted against the guest’s final bill.
                </p>
              </div>
            </div>
            <button
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#24312e] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#315a3d]"
            >
              <CreditCard size={17} />
              Continue to pay ₹500
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function NewOrderModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#24312e]/35 p-5">
      <div className="w-full max-w-md rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="display-font text-2xl font-bold text-[#24312e]">
            Start an order
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#84908a]"
            aria-label="Close order dialog"
          >
            <X size={19} />
          </button>
        </div>
        <p className="mt-2 text-sm text-[#84908a]">
          Choose how this order is coming in.
        </p>
        <div className="mt-6 grid gap-3">
          {[
            ["Dine in", "Assign a table and start service", Utensils],
            ["Takeaway", "Create a pickup order", ShoppingBag],
          ].map(([title, description, OrderIcon]) => (
            <button
              key={title as string}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-[#dfe1dc] p-4 text-left hover:border-[#b7623d]"
            >
              <OrderIcon className="text-[#b7623d]" />
              <span>
                <strong className="block text-sm text-[#24312e]">
                  {title as string}
                </strong>
                <small className="text-xs text-[#84908a]">
                  {description as string}
                </small>
              </span>
            </button>
          ))}
        </div>
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
}: {
  onBack: () => void;
  menuItems: ApiMenuItem[];
  soldOutItems: string[];
  onOrderCreated: (order: Order) => void;
}) {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<string[]>([]);
  const [customer, setCustomer] = useState("QR guest");
  const [submitting, setSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const websiteItems = menuItems.filter(
    (item) => !soldOutItems.includes(item.name),
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
      setOrderMessage(`Order ${order.id} sent to the kitchen.`);
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
                <div className="flex h-32 items-center justify-center rounded-xl bg-[#f0f1ed] text-[#315a3d]">
                  <Utensils size={34} strokeWidth={1.2} />
                </div>
                <p className="mt-4 font-bold">{item.name}</p>
                <p className="mt-1 text-xs text-[#84908a]">{item.category}</p>
                <div className="mt-4 flex items-center justify-between">
                  <strong>₹{item.price.toLocaleString("en-IN")}</strong>
                  <button
                    onClick={() => setCart([...cart, item.name])}
                    className="rounded-lg bg-[#24312e] px-3 py-2 text-xs font-bold text-white"
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
              disabled={submitting || cart.length === 0}
              className="rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Sending..." : "Place order"}
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
            <p className="mt-1 text-xs text-[#8f7055]">
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
  const [soldOutItems, setSoldOutItems] = useState<string[]>([
    "Wild mushroom risotto",
  ]);
  const [showBooking, setShowBooking] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);
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
      .then((items) =>
        setMenuItems(items.length > 0 ? items : fallbackMenuItems),
      )
      .catch(() => {
        // Keep the local menu available when the API is offline.
      });
  }, []);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      const updatedOrder = await updateOrderStatus(id, status);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === id ? updatedOrder : order)),
      );
    } catch {
      // The UI remains unchanged when the API cannot be reached.
    }
  };

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
        onOrderCreated={(order) =>
          setOrders((currentOrders) => [order, ...currentOrders])
        }
      />
    );
  const visibleNavGroups = getNavGroups(role);
  const pageProps = { onBook: () => setShowBooking(true) };
  const page =
    activeNav === "Overview" ? (
      <OverviewPage
        onBook={pageProps.onBook}
        onOrder={() => setShowNewOrder(true)}
        onWebsite={() => setShowWebsite(true)}
        isManager={role === "Manager"}
      />
    ) : activeNav === "Reservations" ? (
      <ReservationsPage {...pageProps} />
    ) : activeNav === "Floor plan" ? (
      <FloorPlanPage {...pageProps} />
    ) : activeNav === "Orders" ? (
      <OrdersPage orders={orders} onStatusChange={handleStatusChange} />
    ) : activeNav === "Kitchen" ? (
      <KitchenPage
        orders={orders}
        menuItems={menuItems}
        onStatusChange={handleStatusChange}
        soldOutItems={soldOutItems}
        setSoldOutItems={setSoldOutItems}
      />
    ) : activeNav === "Menu" ? (
      <MenuPage
        menuItems={menuItems}
        soldOutItems={soldOutItems}
        setSoldOutItems={setSoldOutItems}
        canCreate={role === "Manager"}
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
            <button
              className="relative rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 text-[#68736e]"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b7623d]" />
            </button>
            {(role === "Server" || role === "Manager") && (
              <button
                className="hidden items-center gap-2 rounded-xl border border-[#dfe1dc] px-3 py-2.5 text-xs font-bold text-[#315a3d] sm:flex"
                onClick={() => setShowBooking(true)}
              >
                <CalendarCheck size={16} />
                Book table
              </button>
            )}
            <button
              onClick={() => setRole(null)}
              className="hidden items-center gap-2 rounded-xl border border-[#dfe1dc] px-3 py-2.5 text-xs font-bold text-[#68736e] sm:flex"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>
        {page}
      </main>
      {showBooking && <BookingModal onClose={() => setShowBooking(false)} />}
      {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} />}
    </div>
  );
}
