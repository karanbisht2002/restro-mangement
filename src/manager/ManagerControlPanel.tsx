import { useState } from "react";
import {
  CalendarCheck,
  ChefHat,
  Megaphone,
  Plus,
  Send,
  Table2,
  Users,
  Utensils,
  X,
} from "lucide-react";
import type { RestaurantTable } from "../api/tables";
import type { TableBooking } from "../api/bookings";
import { broadcastNotice } from "../api/notifications";

interface ManagerControlPanelProps {
  onBookTable: (tableId?: string) => void;
  onNewOrder: (tableId?: string) => void;
  tables?: RestaurantTable[];
  ordersCount?: number;
  bookingsCount?: number;
  bookings?: TableBooking[];
  kitchenClosed?: boolean;
  onToggleKitchenClosed?: () => void;
}

export default function ManagerControlPanel({
  onBookTable,
  onNewOrder,
  tables = [],
  ordersCount = 0,
  bookingsCount = 0,
  bookings = [],
  kitchenClosed = false,
  onToggleKitchenClosed,
}: ManagerControlPanelProps) {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<"All" | "Kitchen" | "Server">("All");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState<"Normal" | "Urgent">("Normal");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const availableTables = tables.filter((t) => t.status === "Available");
  const occupiedTables = tables.filter((t) => t.status === "Occupied");

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setBroadcasting(true);
    const res = await broadcastNotice({
      targetRole: broadcastTarget,
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      priority: broadcastPriority,
      sentBy: "Manager",
    });
    setBroadcasting(false);
    if (res.success) {
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setShowBroadcastModal(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
      }, 1200);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#dfe1dc] bg-[#24312e] p-4 sm:p-6 text-white shadow-xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f4bc83]">
            Manager Control Panel
          </p>
          <h2 className="display-font mt-1 text-2xl font-bold">
            Floor & Service Command
          </h2>
          <p className="mt-1 text-xs text-[#aab8b0]">
            Direct API dispatch for guest table reservations and kitchen order management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#f4bc83]/40 bg-[#3a4d45] px-3.5 py-1.5 text-xs font-bold text-[#f4bc83] transition hover:bg-[#465d53] shadow-sm"
            title="Broadcast announcement to Kitchen, Server, or all staff"
          >
            <Megaphone size={14} />
            Broadcast Notice
          </button>
          {onToggleKitchenClosed && (
            <button
              onClick={onToggleKitchenClosed}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                kitchenClosed
                  ? "border border-red-500/50 bg-red-950/70 text-red-200 hover:bg-red-900"
                  : "border border-[#485b53] bg-[#30403a] text-[#cfe0d0] hover:bg-[#3d524b]"
              }`}
              title={kitchenClosed ? "Kitchen is closed. Click to reopen." : "Kitchen is open. Click to close."}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  kitchenClosed ? "bg-red-500 animate-ping" : "bg-[#9ac49f]"
                }`}
              />
              Kitchen: {kitchenClosed ? "CLOSED (Reopen)" : "OPEN (Close)"}
            </button>
          )}
          <span className="flex items-center gap-2 rounded-full bg-[#30403a] px-3 py-1.5 text-xs font-bold text-[#cfe0d0]">
            <span className="h-2 w-2 rounded-full bg-[#9ac49f] animate-pulse" />
            Manager access active
          </span>
        </div>
      </div>

      {/* Kitchen Closed Warning Banner in Manager Panel */}
      {kitchenClosed && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span>
              <strong>Kitchen is closed.</strong> New table bookings and orders cannot be taken until kitchen reopens.
            </span>
          </div>
          {onToggleKitchenClosed && (
            <button
              onClick={onToggleKitchenClosed}
              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500 transition shrink-0 self-start sm:self-auto"
            >
              Reopen Kitchen
            </button>
          )}
        </div>
      )}

      {/* Primary Action Buttons: Book Table API & New Order API */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-[#485b53] bg-[#2c3c37] p-3.5 sm:p-4 transition hover:border-[#f4bc83]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d524b] text-[#f4bc83] shrink-0">
                  <CalendarCheck size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Book Table API</h3>
              </div>
              <span className="rounded-md bg-[#3d524b] px-2 py-0.5 text-[10px] font-bold text-[#f4bc83] shrink-0 font-mono">
                /api/bookings
              </span>
            </div>
            <p className="mt-2.5 text-xs text-[#aab8b0] leading-relaxed">
              <strong className="text-white font-semibold">{availableTables.length}</strong> tables available • <strong className="text-[#f4bc83] font-semibold">{bookingsCount}</strong> reservations today
            </p>
          </div>
          <div className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-[#3d524b] pt-3">
            <span className="text-[11px] text-[#8ea097]">
              {kitchenClosed ? "Disabled while kitchen is closed" : "Auto-syncs table to Booked"}
            </span>
            <button
              onClick={() => onBookTable()}
              disabled={kitchenClosed}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 sm:py-2 text-xs font-bold transition cursor-pointer ${
                kitchenClosed
                  ? "bg-[#3d524b] text-[#8ea097] cursor-not-allowed opacity-50"
                  : "bg-[#f4bc83] text-[#24312e] hover:bg-[#eab074]"
              }`}
              title={kitchenClosed ? "Kitchen is closed - reservations disabled" : "Reserve a Table"}
            >
              <CalendarCheck size={14} />
              <span>{kitchenClosed ? "Kitchen Closed" : "Reserve a Table"}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[#485b53] bg-[#2c3c37] p-3.5 sm:p-4 transition hover:border-[#9ac49f]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d524b] text-[#9ac49f] shrink-0">
                  <Utensils size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Order Booking API</h3>
              </div>
              <span className="rounded-md bg-[#3d524b] px-2 py-0.5 text-[10px] font-bold text-[#9ac49f] shrink-0 font-mono">
                /api/orders
              </span>
            </div>
            <p className="mt-2.5 text-xs text-[#aab8b0] leading-relaxed">
              <strong className="text-white font-semibold">{ordersCount}</strong> active tickets • <strong className="text-[#9ac49f] font-semibold">{occupiedTables.length}</strong> occupied tables
            </p>
          </div>
          <div className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-[#3d524b] pt-3">
            <span className="text-[11px] text-[#8ea097]">
              {kitchenClosed ? "Disabled while kitchen is closed" : "Dine-in or Takeaway dispatch"}
            </span>
            <button
              onClick={() => onNewOrder()}
              disabled={kitchenClosed}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 sm:py-2 text-xs font-bold transition cursor-pointer ${
                kitchenClosed
                  ? "bg-[#3d524b] text-[#8ea097] cursor-not-allowed opacity-50"
                  : "bg-[#9ac49f] text-[#24312e] hover:bg-[#88b68d]"
              }`}
              title={kitchenClosed ? "Kitchen is closed - new orders disabled" : "Book New Order"}
            >
              <Plus size={14} />
              <span>{kitchenClosed ? "Kitchen Closed" : "Book New Order"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Table Actions Strip */}
      {availableTables.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#3b4b45] bg-[#1d2725] p-3 sm:p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-[#f4bc83]">
              Quick Table Allocations (Available: {availableTables.length})
            </span>
            <span className="text-[10px] text-[#8ea097]">Click table to book or order</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
            {availableTables.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-1 rounded-lg border border-[#3b4b45] bg-[#24312e] px-2 py-1 text-xs text-white"
              >
                <span className="font-bold text-[#9ac49f] text-[11px] sm:text-xs">{t.id}</span>
                <span className="text-[9px] sm:text-[10px] text-[#8ea097]">({t.seats}s)</span>
                <button
                  onClick={() => onBookTable(t.id)}
                  title={`Book table ${t.id}`}
                  className="ml-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#f4bc83] hover:bg-white/10 cursor-pointer"
                >
                  Book
                </button>
                <span className="text-white/20 text-[10px]">|</span>
                <button
                  onClick={() => onNewOrder(t.id)}
                  title={`Take order for table ${t.id}`}
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#9ac49f] hover:bg-white/10 cursor-pointer"
                >
                  Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Reservations (Live from API) */}
      <div className="mt-4 rounded-xl border border-[#3b4b45] bg-[#1d2725] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarCheck size={16} className="text-[#f4bc83]" />
            <span className="text-xs font-bold text-white">
              Active Reservations
            </span>
            <span className="rounded-full bg-[#3d524b] px-2 py-0.5 text-[10px] font-bold text-[#f4bc83]">
              {bookings.length} from /api/bookings
            </span>
          </div>
          <button
            onClick={() => onBookTable()}
            className="text-[11px] font-bold text-[#f4bc83] hover:underline cursor-pointer"
          >
            + New reservation
          </button>
        </div>

        {bookings.length === 0 ? (
          <p className="mt-2 text-xs text-[#8ea097]">No active reservations recorded today.</p>
        ) : (
          <div className="mt-2.5 space-y-2">
            {bookings.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-[#3b4b45] bg-[#24312e] px-3 py-2 text-xs text-white"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#cfe0d0]">{b.customer}</span>
                  <span className="text-[11px] text-[#8ea097]">
                    {b.bookingTime} • {b.guests} guests
                  </span>
                  {b.tableId && (
                    <span className="rounded bg-[#3d524b] px-1.5 py-0.5 text-[10px] font-bold text-[#9ac49f]">
                      Table {b.tableId}
                    </span>
                  )}
                  {b.specialRequests && (
                    <span className="hidden sm:inline text-[11px] text-[#aab8b0] italic">
                      "{b.specialRequests}"
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      b.status === "Booked"
                        ? "bg-[#e5bd7e]/20 text-[#e5bd7e]"
                        : b.status === "Arrived"
                          ? "bg-[#9ac49f]/20 text-[#9ac49f]"
                          : b.status === "Seated"
                            ? "bg-[#d98865]/20 text-[#d98865]"
                            : "bg-white/10 text-white/70"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
            {bookings.length > 4 && (
              <p className="text-[10px] text-[#8ea097] text-right">
                + {bookings.length - 4} more reservations in Reservations tab
              </p>
            )}
          </div>
        )}
      </div>

      {/* Broadcast Notice Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#44554e] bg-[#24312e] p-6 text-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#3b4b45] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#374941] text-[#f4bc83]">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="display-font text-lg font-bold text-white">Broadcast Announcement</h3>
                  <p className="text-xs text-[#aab8b0]">Send instant notification to staff panels</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-lg p-1.5 text-[#aab8b0] hover:bg-[#34443e] hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#3b724c]/30 text-[#9ac49f]">
                  ✓
                </div>
                <h4 className="text-base font-bold text-white">Announcement Broadcasted!</h4>
                <p className="mt-1 text-xs text-[#aab8b0]">
                  Delivered to {broadcastTarget === "All" ? "all staff panels" : `${broadcastTarget} panel`} successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#aab8b0] mb-1.5">
                      Target Audience
                    </label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value as any)}
                      className="w-full rounded-xl border border-[#44554e] bg-[#1a2522] px-3 py-2 text-xs font-semibold text-white focus:border-[#f4bc83] focus:outline-none"
                    >
                      <option value="All">All Panels (Kitchen & Server)</option>
                      <option value="Kitchen">Kitchen Station Only</option>
                      <option value="Server">Servant / Waitstaff Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#aab8b0] mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as any)}
                      className="w-full rounded-xl border border-[#44554e] bg-[#1a2522] px-3 py-2 text-xs font-semibold text-white focus:border-[#f4bc83] focus:outline-none"
                    >
                      <option value="Normal">Normal Notice</option>
                      <option value="Urgent">🚨 Urgent Alert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#aab8b0] mb-1.5">
                    Notice Headline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Rush Hour Prep / 86 Butter Chicken"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#44554e] bg-[#1a2522] px-3.5 py-2 text-xs text-white placeholder-[#6f8279] focus:border-[#f4bc83] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#aab8b0] mb-1.5">
                    Message Details
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter message text that will be shown in the notification drawer..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full resize-none rounded-xl border border-[#44554e] bg-[#1a2522] px-3.5 py-2 text-xs text-white placeholder-[#6f8279] focus:border-[#f4bc83] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-[#3b4b45]">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="rounded-xl border border-[#44554e] px-4 py-2 text-xs font-bold text-[#aab8b0] hover:bg-[#34443e] hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                    className="flex items-center gap-2 rounded-xl bg-[#f4bc83] px-5 py-2 text-xs font-bold text-[#24312e] hover:bg-[#e6ab6e] transition disabled:opacity-50"
                  >
                    <Send size={13} />
                    {broadcasting ? "Sending..." : "Dispatch Broadcast"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
