import { useState } from "react";
import {
  CalendarCheck,
  ChefHat,
  Plus,
  Settings2,
  Table2,
  Users,
  Utensils,
} from "lucide-react";
import type { RestaurantTable } from "../api/tables";
import type { TableBooking } from "../api/bookings";

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
  const [serverLive, setServerLive] = useState(true);
  const [kitchenAccepting, setKitchenAccepting] = useState(true);
  const [zone, setZone] = useState("Main floor");

  const availableTables = tables.filter((t) => t.status === "Available");
  const occupiedTables = tables.filter((t) => t.status === "Occupied");

  return (
    <section className="mt-8 rounded-2xl border border-[#dfe1dc] bg-[#24312e] p-5 text-white sm:p-6 shadow-xl">
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
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>
              <strong>Kitchen is closed.</strong> New table bookings and orders cannot be taken until kitchen reopens.
            </span>
          </div>
          {onToggleKitchenClosed && (
            <button
              onClick={onToggleKitchenClosed}
              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500 transition shrink-0"
            >
              Reopen Kitchen
            </button>
          )}
        </div>
      )}

      {/* Primary Action Buttons: Book Table API & New Order API */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-[#485b53] bg-[#2c3c37] p-4 transition hover:border-[#f4bc83]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3d524b] text-[#f4bc83]">
                <CalendarCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Book Table API</h3>
                <p className="text-xs text-[#aab8b0]">
                  {availableTables.length} tables available • {bookingsCount} reservations today
                </p>
              </div>
            </div>
            <span className="rounded-md bg-[#3d524b] px-2 py-0.5 text-[10px] font-bold text-[#f4bc83]">
              /api/bookings
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#3d524b] pt-3">
            <span className="text-[11px] text-[#8ea097]">
              {kitchenClosed ? "Disabled while kitchen is closed" : "Auto-syncs table to Booked"}
            </span>
            <button
              onClick={() => onBookTable()}
              disabled={kitchenClosed}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                kitchenClosed
                  ? "bg-[#3d524b] text-[#8ea097] cursor-not-allowed opacity-50"
                  : "bg-[#f4bc83] text-[#24312e] hover:bg-[#eab074]"
              }`}
              title={kitchenClosed ? "Kitchen is closed - reservations disabled" : "Reserve a Table"}
            >
              <CalendarCheck size={14} />
              {kitchenClosed ? "Kitchen Closed" : "Reserve a Table"}
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[#485b53] bg-[#2c3c37] p-4 transition hover:border-[#f4bc83]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3d524b] text-[#9ac49f]">
                <Utensils size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Order Booking API</h3>
                <p className="text-xs text-[#aab8b0]">
                  {ordersCount} active tickets • {occupiedTables.length} occupied tables
                </p>
              </div>
            </div>
            <span className="rounded-md bg-[#3d524b] px-2 py-0.5 text-[10px] font-bold text-[#9ac49f]">
              /api/orders
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#3d524b] pt-3">
            <span className="text-[11px] text-[#8ea097]">
              {kitchenClosed ? "Disabled while kitchen is closed" : "Dine-in or Takeaway dispatch"}
            </span>
            <button
              onClick={() => onNewOrder()}
              disabled={kitchenClosed}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                kitchenClosed
                  ? "bg-[#3d524b] text-[#8ea097] cursor-not-allowed opacity-50"
                  : "bg-[#9ac49f] text-[#24312e] hover:bg-[#88b68d]"
              }`}
              title={kitchenClosed ? "Kitchen is closed - new orders disabled" : "Book New Order"}
            >
              <Plus size={14} />
              {kitchenClosed ? "Kitchen Closed" : "Book New Order"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Table Actions Strip */}
      {availableTables.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#3b4b45] bg-[#1d2725] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#f4bc83]">
              Quick Table Allocations (Available: {availableTables.length})
            </span>
            <span className="text-[10px] text-[#8ea097]">Click table to book or order</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {availableTables.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-1.5 rounded-lg border border-[#3b4b45] bg-[#24312e] px-2.5 py-1.5 text-xs text-white"
              >
                <span className="font-bold text-[#9ac49f]">{t.id}</span>
                <span className="text-[10px] text-[#8ea097]">({t.seats}s)</span>
                <button
                  onClick={() => onBookTable(t.id)}
                  title={`Book table ${t.id}`}
                  className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#f4bc83] hover:bg-white/10"
                >
                  Book
                </button>
                <span className="text-white/20">|</span>
                <button
                  onClick={() => onNewOrder(t.id)}
                  title={`Take order for table ${t.id}`}
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#9ac49f] hover:bg-white/10"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            className="text-[11px] font-bold text-[#f4bc83] hover:underline"
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
                className="flex items-center justify-between rounded-lg border border-[#3b4b45] bg-[#24312e] px-3 py-2 text-xs text-white"
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

      {/* Shift Controls */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          onClick={() => setServerLive(!serverLive)}
          className="rounded-xl border border-[#41504a] bg-[#30403a] p-3.5 text-left transition hover:border-[#f4bc83]"
        >
          <div className="flex items-center justify-between">
            <Users size={18} className="text-[#f4bc83]" />
            <span
              className={`h-2.5 w-2.5 rounded-full ${serverLive ? "bg-[#9ac49f]" : "bg-[#d98865]"}`}
            />
          </div>
          <p className="mt-3 text-xs font-bold">Server service</p>
          <p className="mt-0.5 text-[11px] text-[#aab8b0]">
            {serverLive
              ? "Accepting table assignments"
              : "Paused for reassignment"}
          </p>
        </button>

        <button
          onClick={() => setKitchenAccepting(!kitchenAccepting)}
          className="rounded-xl border border-[#41504a] bg-[#30403a] p-3.5 text-left transition hover:border-[#f4bc83]"
        >
          <div className="flex items-center justify-between">
            <ChefHat size={18} className="text-[#f4bc83]" />
            <span
              className={`h-2.5 w-2.5 rounded-full ${kitchenAccepting ? "bg-[#9ac49f]" : "bg-[#d98865]"}`}
            />
          </div>
          <p className="mt-3 text-xs font-bold">Kitchen intake</p>
          <p className="mt-0.5 text-[11px] text-[#aab8b0]">
            {kitchenAccepting
              ? "Receiving new kitchen tickets"
              : "Paused for kitchen maintenance"}
          </p>
        </button>

        <label className="rounded-xl border border-[#41504a] bg-[#30403a] p-3.5 text-left">
          <div className="flex items-center justify-between">
            <Table2 size={18} className="text-[#f4bc83]" />
            <Settings2 size={15} className="text-[#aab8b0]" />
          </div>
          <span className="mt-3 block text-xs font-bold">
            Active server zone
          </span>
          <select
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#52625b] bg-[#24312e] px-2 py-1.5 text-xs font-bold text-white outline-none"
          >
            <option>Main floor</option>
            <option>Garden patio</option>
            <option>Private dining</option>
          </select>
        </label>
      </div>
    </section>
  );
}
