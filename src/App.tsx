import { useState } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChefHat,
  CircleDollarSign,
  CheckCircle2,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Settings2,
  ShoppingBag,
  Users,
  Utensils,
  X,
} from "lucide-react";

const stats = [
  {
    label: "Today's revenue",
    value: "$4,286",
    change: "+12.8%",
    icon: CircleDollarSign,
    color: "bg-[#e8f1e8] text-[#3b724c]",
  },
  {
    label: "Active orders",
    value: "18",
    change: "+4 since 11am",
    icon: ShoppingBag,
    color: "bg-[#fbe8dc] text-[#b7623d]",
  },
  {
    label: "Tables occupied",
    value: "14 / 22",
    change: "64% capacity",
    icon: Users,
    color: "bg-[#eee8f6] text-[#72558e]",
  },
];

const orders = [
  {
    id: "#1048",
    table: "Table 08",
    items: "2 items",
    total: "$42.50",
    status: "Preparing",
    tone: "text-[#b7623d] bg-[#fbe8dc]",
  },
  {
    id: "#1047",
    table: "Table 14",
    items: "4 items",
    total: "$86.00",
    status: "Ready",
    tone: "text-[#3b724c] bg-[#e8f1e8]",
  },
  {
    id: "#1046",
    table: "Takeaway",
    items: "1 item",
    total: "$18.00",
    status: "Completed",
    tone: "text-[#68736e] bg-[#eceeea]",
  },
  {
    id: "#1045",
    table: "Table 03",
    items: "3 items",
    total: "$64.75",
    status: "Preparing",
    tone: "text-[#b7623d] bg-[#fbe8dc]",
  },
];

function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  return (
    <div className="paper-grid min-h-screen lg:flex">
      <aside className="flex w-full flex-col border-b border-[#dfe1dc] bg-[#fbfaf7] lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-6 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
              <ChefHat size={21} />
            </div>
            <div>
              <p className="display-font text-lg font-bold text-[#24312e]">
                Table & Thyme
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#84908a]">
                Kitchen OS
              </p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 text-[#68736e] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:px-3 lg:py-7">
          {[
            ["Overview", LayoutDashboard],
            ["Orders", ShoppingBag],
            ["Floor plan", Utensils],
            ["Menu", Menu],
            ["Team", Users],
          ].map(([label, Icon]) => (
            <button
              key={label as string}
              onClick={() => setActiveNav(label as string)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeNav === label ? "bg-[#e6eee5] text-[#315a3d]" : "text-[#74807a] hover:bg-[#f0f1ed]"}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label as string}</span>
            </button>
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
              <p className="text-[11px] text-[#84908a]">Manager</p>
            </div>
            <ChevronDown className="ml-auto text-[#84908a]" size={15} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#84908a]">
              <CalendarDays size={14} /> Tuesday, September 24, 2024
            </div>
            <h1 className="display-font text-4xl font-bold tracking-tight text-[#24312e] sm:text-5xl">
              Good afternoon, Aarav.
            </h1>
            <p className="mt-2 text-sm text-[#84908a]">
              Here’s what’s happening at your restaurant today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-3 text-[#68736e] hover:bg-white"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b7623d]" />
            </button>
            <button
              onClick={() => {
                setBookingConfirmed(false);
                setShowBooking(true);
              }}
              className="hidden items-center gap-2 rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-4 py-3 text-sm font-bold text-[#315a3d] transition hover:bg-white sm:flex"
            >
              <CalendarCheck size={18} />
              Book table
            </button>
            <button
              onClick={() => setShowNewOrder(true)}
              className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#315a3d]"
            >
              <Plus size={18} />
              New order
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, change, icon: Icon, color }) => (
            <article
              key={label}
              className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 shadow-[0_3px_12px_rgba(36,49,46,.025)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#84908a]">{label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-[#24312e]">
                    {value}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${color}`}>
                  <Icon size={21} />
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-[#3b724c]">
                {change}{" "}
                <span className="font-medium text-[#84908a]">vs yesterday</span>
              </p>
            </article>
          ))}
        </section>

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
              <span className="h-2 w-2 rounded-full bg-[#b7623d]" /> Today is
              pacing <strong className="text-[#3b724c]">18% ahead</strong> of
              your daily average
            </div>
          </article>
          <article className="rounded-2xl border border-[#e0e2dc] bg-[#24312e] p-5 text-white sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="display-font text-xl font-bold">
                  Quick actions
                </h2>
                <p className="mt-1 text-xs text-[#aab8b0]">
                  Keep service moving smoothly
                </p>
              </div>
              <Clock3 className="text-[#f4bc83]" size={22} />
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ["Floor plan", Users],
                ["Add menu item", Plus],
                ["Staff schedule", CalendarDays],
                ["View reports", CircleDollarSign],
              ].map(([label, Icon]) => (
                <button
                  key={label as string}
                  className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[#41504a] bg-[#30403a] p-4 text-left transition hover:border-[#f4bc83]"
                >
                  <Icon size={19} className="text-[#f4bc83]" />
                  <span className="text-xs font-bold">{label as string}</span>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="display-font text-xl font-bold text-[#24312e]">
                Recent orders
              </h2>
              <p className="mt-1 text-xs text-[#84908a]">
                Live activity from your floor
              </p>
            </div>
            <button className="text-xs font-bold text-[#b7623d] hover:underline">
              View all orders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-[#e9eae6] text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">
                <tr>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#f0f1ed] last:border-0"
                  >
                    <td className="py-4 font-bold text-[#24312e]">
                      {order.id}
                    </td>
                    <td className="py-4 text-[#68736e]">{order.table}</td>
                    <td className="py-4 text-[#68736e]">{order.items}</td>
                    <td className="py-4 font-bold text-[#24312e]">
                      {order.total}
                    </td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${order.tone}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        className="rounded-lg p-2 text-[#9aa39d] hover:bg-[#f0f1ed]"
                        aria-label={`More actions for ${order.id}`}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      {showNewOrder && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#24312e]/35 p-5">
          <div className="w-full max-w-md rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="display-font text-2xl font-bold text-[#24312e]">
                Start an order
              </h2>
              <button
                onClick={() => setShowNewOrder(false)}
                className="rounded-lg p-2 text-[#84908a] hover:bg-[#f0f1ed]"
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#84908a]">
              Choose how this order is coming in.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                onClick={() => setShowNewOrder(false)}
                className="flex items-center gap-3 rounded-xl border border-[#dfe1dc] p-4 text-left hover:border-[#b7623d]"
              >
                <Utensils className="text-[#b7623d]" />
                <span>
                  <strong className="block text-sm text-[#24312e]">
                    Dine in
                  </strong>
                  <small className="text-xs text-[#84908a]">
                    Assign a table and start service
                  </small>
                </span>
              </button>
              <button
                onClick={() => setShowNewOrder(false)}
                className="flex items-center gap-3 rounded-xl border border-[#dfe1dc] p-4 text-left hover:border-[#b7623d]"
              >
                <ShoppingBag className="text-[#b7623d]" />
                <span>
                  <strong className="block text-sm text-[#24312e]">
                    Takeaway
                  </strong>
                  <small className="text-xs text-[#84908a]">
                    Create a pickup order
                  </small>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {showBooking && (
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-[#24312e]/35 p-5">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#b7623d]">
                  <CalendarCheck size={15} /> Reservation
                </div>
                <h2 className="display-font text-2xl font-bold text-[#24312e]">
                  Book a table
                </h2>
                <p className="mt-2 text-sm text-[#84908a]">
                  Reserve a table for your guests and secure the booking.
                </p>
              </div>
              <button
                onClick={() => setShowBooking(false)}
                className="rounded-lg p-2 text-[#84908a] hover:bg-[#f0f1ed]"
                aria-label="Close booking dialog"
              >
                <X size={19} />
              </button>
            </div>
            {bookingConfirmed ? (
              <div className="mt-8 rounded-xl border border-[#cfe0d0] bg-[#e8f1e8] p-5 text-center">
                <CheckCircle2 className="mx-auto text-[#3b724c]" size={34} />
                <h3 className="mt-3 font-bold text-[#315a3d]">
                  Table reserved successfully
                </h3>
                <p className="mt-2 text-sm text-[#58715e]">
                  Your ₹500 booking deposit is confirmed and will be adjusted
                  against the final bill.
                </p>
                <button
                  onClick={() => setShowBooking(false)}
                  className="mt-5 rounded-xl bg-[#24312e] px-5 py-3 text-sm font-bold text-white hover:bg-[#315a3d]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                className="mt-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  setBookingConfirmed(true);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-[#68736e]">
                    Guest name
                    <input
                      required
                      type="text"
                      placeholder="Enter guest name"
                      className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none placeholder:text-[#aab1ac] focus:border-[#b7623d]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#68736e]">
                    Contact number
                    <input
                      required
                      type="tel"
                      placeholder="e.g. 98765 43210"
                      className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none placeholder:text-[#aab1ac] focus:border-[#b7623d]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#68736e]">
                    Date
                    <input
                      required
                      type="date"
                      className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none focus:border-[#b7623d]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#68736e]">
                    Time
                    <input
                      required
                      type="time"
                      className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none focus:border-[#b7623d]"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#68736e]">
                    Number of guests
                    <select
                      required
                      defaultValue="2"
                      className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none focus:border-[#b7623d]"
                    >
                      <option value="2">2 guests</option>
                      <option value="4">4 guests</option>
                      <option value="6">6 guests</option>
                      <option value="8">8+ guests</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-[#68736e]">
                    Booking source
                    <select
                      required
                      defaultValue="Phone"
                      className="mt-2 w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none focus:border-[#b7623d]"
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
                    className="mt-2 w-full resize-none rounded-xl border border-[#dfe1dc] bg-white px-3 py-3 text-sm font-medium text-[#24312e] outline-none placeholder:text-[#aab1ac] focus:border-[#b7623d]"
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
                      This amount will be collected now and adjusted against the
                      guest’s final bill.
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#24312e] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#315a3d]"
                >
                  <CreditCard size={17} />
                  Continue to pay ₹500
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
