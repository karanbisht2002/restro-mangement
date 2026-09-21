import { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Coffee,
  Plus,
  Sparkles,
  Table2,
  Users,
  Utensils,
} from "lucide-react";
import type { RestaurantTable, TableStatus } from "../api/tables";
import type { Order } from "../types";

interface ServantControlPanelProps {
  onBookTable: (tableId?: string) => void;
  onNewOrder: (tableId?: string) => void;
  onTableStatusChange?: (id: string, status: TableStatus) => void;
  tables?: RestaurantTable[];
  orders?: Order[];
  kitchenClosed?: boolean;
}

export default function ServantControlPanel({
  onBookTable,
  onNewOrder,
  onTableStatusChange,
  tables = [],
  orders = [],
  kitchenClosed = false,
}: ServantControlPanelProps) {
  const [onDuty, setOnDuty] = useState(true);
  const [activeZone, setActiveZone] = useState("All zones");

  const filteredTables =
    activeZone === "All zones"
      ? tables
      : tables.filter((t) => t.zone === activeZone);

  const availableCount = tables.filter((t) => t.status === "Available").length;
  const occupiedCount = tables.filter((t) => t.status === "Occupied").length;
  const cleaningCount = tables.filter((t) => t.status === "Needs cleaning").length;
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "Served",
  ).length;

  return (
    <section className="mt-8 rounded-2xl border border-[#dfe1dc] bg-[#24312e] p-4 sm:p-6 text-white shadow-xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f4bc83]">
            Servant / Floor Server Panel
          </p>
          <h2 className="display-font mt-1 text-2xl font-bold">
            Live Service & Table Command
          </h2>
          <p className="mt-1 text-xs text-[#aab8b0]">
            Take table orders and record reservations with automatic table lifecycle synchronization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnDuty(!onDuty)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              onDuty
                ? "bg-[#30403a] text-[#cfe0d0] hover:bg-[#3d524b]"
                : "bg-[#453229] text-[#f0baa2] hover:bg-[#523c31]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${onDuty ? "bg-[#9ac49f] animate-pulse" : "bg-[#d98865]"}`}
            />
            {onDuty ? "Server on duty" : "On break"}
          </button>
        </div>
      </div>

      {/* Kitchen Closed Warning Banner for Servers */}
      {kitchenClosed && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-center gap-2.5 shadow-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 animate-ping" />
          <span>
            <strong>Kitchen is currently closed.</strong> New orders and table bookings cannot be taken. Please inform dining guests accordingly.
          </span>
        </div>
      )}

      {/* Primary Action Dispatchers: New Order & Book Table */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-[#485b53] bg-[#2c3c37] p-3.5 sm:p-4 transition hover:border-[#9ac49f]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d524b] text-[#9ac49f] shrink-0">
                  <Utensils size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Take New Order</h3>
              </div>
              <span className="rounded-md bg-[#3d524b] px-2 py-0.5 text-[10px] font-bold text-[#9ac49f] shrink-0 font-mono">
                {activeOrdersCount} in kitchen
              </span>
            </div>
            <p className="mt-2.5 text-xs text-[#aab8b0] leading-relaxed">
              Dispatch ticket to kitchen via <span className="text-[#9ac49f] font-mono text-[11px]">POST /api/orders</span>
            </p>
          </div>
          <div className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-[#3d524b] pt-3">
            <span className="text-[11px] text-[#8ea097]">
              {kitchenClosed ? "Disabled while kitchen is closed" : "Auto-marks table Occupied"}
            </span>
            <button
              onClick={() => onNewOrder()}
              disabled={kitchenClosed}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 sm:py-2 text-xs font-bold transition cursor-pointer ${
                kitchenClosed
                  ? "bg-[#3d524b] text-[#8ea097] cursor-not-allowed opacity-50"
                  : "bg-[#9ac49f] text-[#24312e] hover:bg-[#88b68d]"
              }`}
              title={kitchenClosed ? "Kitchen is closed - new orders disabled" : "Take Order"}
            >
              <Plus size={14} />
              <span>{kitchenClosed ? "Kitchen Closed" : "Take Order"}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[#485b53] bg-[#2c3c37] p-3.5 sm:p-4 transition hover:border-[#f4bc83]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3d524b] text-[#f4bc83] shrink-0">
                  <CalendarCheck size={18} />
                </div>
                <h3 className="text-sm font-bold text-white">Book Guest Table</h3>
              </div>
              <span className="rounded-md bg-[#3d524b] px-2 py-0.5 text-[10px] font-bold text-[#f4bc83] shrink-0 font-mono">
                {availableCount} tables free
              </span>
            </div>
            <p className="mt-2.5 text-xs text-[#aab8b0] leading-relaxed">
              Reserve for walk-in or phone guest via <span className="text-[#f4bc83] font-mono text-[11px]">POST /api/bookings</span>
            </p>
          </div>
          <div className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-[#3d524b] pt-3">
            <span className="text-[11px] text-[#8ea097]">
              {kitchenClosed ? "Disabled while kitchen is closed" : "Auto-marks table Booked"}
            </span>
            <button
              onClick={() => onBookTable()}
              disabled={kitchenClosed}
              className={`flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 sm:py-2 text-xs font-bold transition cursor-pointer ${
                kitchenClosed
                  ? "bg-[#3d524b] text-[#8ea097] cursor-not-allowed opacity-50"
                  : "bg-[#f4bc83] text-[#24312e] hover:bg-[#eab074]"
              }`}
              title={kitchenClosed ? "Kitchen is closed - reservations disabled" : "Book Table"}
            >
              <CalendarCheck size={14} />
              <span>{kitchenClosed ? "Kitchen Closed" : "Book Table"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Floor Snapshot & Fast Table Actions */}
      <div className="mt-5 rounded-xl border border-[#3b4b45] bg-[#1d2725] p-3.5 sm:p-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Table2 size={18} className="text-[#f4bc83]" />
            <span className="text-xs font-bold text-white">
              Floor Tables & Fast Actions
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-[#aab8b0]">
              <span className="text-[#9ac49f] font-semibold">{availableCount} Available</span>
              <span>•</span>
              <span className="text-[#d98865] font-semibold">{occupiedCount} Occupied</span>
              {cleaningCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#e5bd7e] font-semibold">{cleaningCount} Needs Clean</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8ea097]">Filter:</span>
            <select
              value={activeZone}
              onChange={(e) => setActiveZone(e.target.value)}
              className="rounded-lg border border-[#3b4b45] bg-[#24312e] px-2 py-1 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option>All zones</option>
              <option>Window</option>
              <option>Family</option>
              <option>Garden</option>
              <option>Smoking</option>
              <option>Main floor</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredTables.map((table) => {
            const isAvailable = table.status === "Available";
            const isOccupied = table.status === "Occupied";
            const isBooked = table.status === "Booked";
            const isCleaning = table.status === "Needs cleaning";

            return (
              <div
                key={table.id}
                className="flex flex-col justify-between rounded-xl border border-[#3b4b45] bg-[#24312e] p-2.5 transition hover:border-[#63756d]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{table.id}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isAvailable
                        ? "bg-[#9ac49f]"
                        : isOccupied
                          ? "bg-[#d98865]"
                          : isBooked
                            ? "bg-[#e5bd7e]"
                            : "bg-[#aab1ac]"
                    }`}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#8ea097]">
                  <span>{table.seats} seats</span>
                  <span
                    className={`whitespace-nowrap ${
                      isAvailable
                        ? "text-[#9ac49f] font-semibold"
                        : isOccupied
                          ? "text-[#d98865]"
                          : isBooked
                            ? "text-[#e5bd7e]"
                            : "text-[#aab1ac]"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-1 border-t border-[#3b4b45] pt-2">
                  {isAvailable && (
                    <>
                      <button
                        onClick={() => onNewOrder(table.id)}
                        className="flex-1 rounded bg-[#9ac49f]/20 py-1 text-[10px] font-bold text-[#9ac49f] transition hover:bg-[#9ac49f] hover:text-[#24312e]"
                      >
                        Order
                      </button>
                      <button
                        onClick={() => onBookTable(table.id)}
                        className="flex-1 rounded bg-[#f4bc83]/20 py-1 text-[10px] font-bold text-[#f4bc83] transition hover:bg-[#f4bc83] hover:text-[#24312e]"
                      >
                        Book
                      </button>
                    </>
                  )}

                  {isOccupied && (
                    <button
                      onClick={() => onNewOrder(table.id)}
                      className="w-full rounded bg-[#d98865]/20 py-1 text-[10px] font-bold text-[#f0baa2] transition hover:bg-[#d98865] hover:text-white"
                    >
                      + Add Item
                    </button>
                  )}

                  {isBooked && (
                    <button
                      onClick={() => onNewOrder(table.id)}
                      className="w-full rounded bg-[#e5bd7e]/20 py-1 text-[10px] font-bold text-[#fce8c7] transition hover:bg-[#e5bd7e] hover:text-[#24312e]"
                    >
                      Seat & Order
                    </button>
                  )}

                  {isCleaning && (
                    <button
                      onClick={() =>
                        onTableStatusChange &&
                        onTableStatusChange(table.id, "Available")
                      }
                      className="w-full flex items-center justify-center gap-1 rounded bg-white/10 py-1 text-[10px] font-bold text-[#cfe0d0] transition hover:bg-[#9ac49f] hover:text-[#24312e]"
                    >
                      <Sparkles size={11} />
                      Cleaned
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
