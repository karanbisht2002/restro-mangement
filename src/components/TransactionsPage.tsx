import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  Printer,
  RefreshCw,
  Receipt,
  ShieldAlert,
  ArrowUpDown,
  User,
  Copy,
  Check,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import { fetchTransactions } from "../api/transactions";
import type { TransactionRecord, StaffRole } from "../types";
import type { StoreSettings } from "./SettingsPage";

interface TransactionsPageProps {
  currencySymbol: string;
  role: StaffRole;
  restaurantSettings?: StoreSettings;
  onNavigateBilling?: () => void;
}

export default function TransactionsPage({
  currencySymbol,
  role,
  restaurantSettings,
  onNavigateBilling,
}: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "Failed">("All");
  const [modeFilter, setModeFilter] = useState<string>("All");
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const successTxs = useMemo(() => transactions.filter((t) => t.status === "Success"), [transactions]);
  const failedTxs = useMemo(() => transactions.filter((t) => t.status === "Failed"), [transactions]);
  const totalVolume = useMemo(() => successTxs.reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [successTxs]);
  const successRate = transactions.length
    ? Math.round((successTxs.length / transactions.length) * 100)
    : 100;

  // Filtered List
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== "All" && tx.status !== statusFilter) return false;
      if (modeFilter !== "All") {
        if (modeFilter === "UPI" && !tx.paymentMode.includes("UPI") && !tx.paymentMode.includes("Scanner")) return false;
        if (modeFilter === "Card" && !tx.paymentMode.includes("Card")) return false;
        if (modeFilter === "Cash" && !tx.paymentMode.includes("Cash")) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = tx.invoiceNo.toLowerCase().includes(q);
        const matchCustomer = tx.customer.toLowerCase().includes(q);
        const matchTable = tx.sessionTitle.toLowerCase().includes(q);
        const matchServant = (tx.servant || "").toLowerCase().includes(q);
        const matchReason = (tx.failureReason || "").toLowerCase().includes(q);
        if (!matchInv && !matchCustomer && !matchTable && !matchServant && !matchReason) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, modeFilter, searchQuery]);

  // Access Control Guard
  if (role !== "Manager") {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 shadow-sm border border-red-100">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-[#24312e]">Access Restricted</h2>
        <p className="mt-2 max-w-md text-xs text-[#84908a]">
          The Transactions & Payment Audit Ledger is reserved exclusively for restaurant Managers. Please contact your administrator if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
              Manager Module
            </span>
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              Live POS Ledger
            </span>
          </div>
          <h1 className="display-font mt-1 text-2xl font-bold text-[#24312e] sm:text-3xl">
            Transactions & Payment Audit
          </h1>
          <p className="mt-1 text-xs text-[#84908a]">
            Separate audit trail of POS scanner & card payments, declined attempts, waiter attribution, and tax receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateBilling && (
            <button
              onClick={onNavigateBilling}
              className="flex items-center gap-1.5 rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2 text-xs font-bold text-[#24312e] hover:bg-[#f0f1ed] transition shadow-2xs cursor-pointer"
            >
              <Receipt size={14} />
              <span>Go to Billing</span>
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a2422] transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Processed Volume */}
        <div className="rounded-2xl border border-[#e2e4df] bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#84908a]">
              Settled Volume
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Banknote size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-[#24312e]">
            {currencySymbol}
            {totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="mt-1 block text-[11px] font-medium text-emerald-700">
            Across {successTxs.length} verified transactions
          </span>
        </div>

        {/* Successful Settlements */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Successful Payments
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">
            {successTxs.length}
          </p>
          <span className="mt-1 block text-[11px] font-medium text-emerald-800">
            100% funds captured & tables cleared
          </span>
        </div>

        {/* Failed / Declined Attempts */}
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
              Declined / Failed
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-800">
              <XCircle size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-red-950">
            {failedTxs.length}
          </p>
          <span className="mt-1 block text-[11px] font-medium text-red-700">
            {failedTxs.length ? "Kept in billing screen (No loss)" : "No payment failures recorded"}
          </span>
        </div>

        {/* Success Rate */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Settlement Rate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <Sparkles size={15} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-950">
            {successRate}%
          </p>
          <span className="mt-1 block text-[11px] font-medium text-blue-800">
            Terminal reliability score
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#dfe1dc] bg-white p-3 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["All", "Success", "Failed"] as const).map((filter) => {
            const count =
              filter === "All"
                ? transactions.length
                : filter === "Success"
                ? successTxs.length
                : failedTxs.length;
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-[#24312e] text-white shadow-xs"
                    : "text-[#68736e] hover:bg-[#f0f1ed]"
                }`}
              >
                <span>{filter}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-[#eceee9] text-[#24312e]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Payment Mode Selector & Search Input */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-xl border border-[#dfe1dc] bg-[#fafaf7] px-3 py-1.5 text-xs font-semibold text-[#24312e] outline-none focus:border-[#24312e]"
          >
            <option value="All">All Payment Modes</option>
            <option value="UPI">UPI / Scanner Only</option>
            <option value="Card">Card Reader Only</option>
            <option value="Cash">Cash Only</option>
          </select>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-2.5 text-[#84908a]" />
            <input
              type="text"
              placeholder="Search invoice, customer, servant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#dfe1dc] bg-[#fafaf7] pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#24312e]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-[#84908a] hover:text-[#24312e]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-[#dfe1dc] bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw size={28} className="mx-auto animate-spin text-[#84908a]" />
            <p className="mt-2 text-xs font-bold text-[#84908a]">Loading transaction ledger...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-[#84908a]">
            <Receipt size={40} className="mx-auto text-[#cbd5e1] mb-2" />
            <p className="font-bold text-sm text-[#24312e]">No transactions found</p>
            <p className="text-xs mt-1">No payment records match your active filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[1100px] border-collapse">
              <thead className="border-b border-[#e2e5df] bg-[#f8faf8] text-[10.5px] font-bold uppercase tracking-wider text-[#5f6e67]">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap w-[120px]">Status</th>
                  <th className="py-3.5 px-3.5 whitespace-nowrap w-[145px]">Invoice #</th>
                  <th className="py-3.5 px-3.5 whitespace-nowrap w-[140px]">Mode</th>
                  <th className="py-3.5 px-3.5 whitespace-nowrap w-[125px]">Table / Source</th>
                  <th className="py-3.5 px-3.5 whitespace-nowrap w-[130px]">Customer</th>
                  <th className="py-3.5 px-3.5 whitespace-nowrap w-[120px]">Servant</th>
                  <th className="py-3.5 px-3.5 text-right whitespace-nowrap w-[115px]">Amount</th>
                  <th className="py-3.5 px-3.5 whitespace-nowrap w-[125px]">Date & Time</th>
                  <th className="py-3.5 px-3.5 whitespace-nowrap">Diagnostics & Notes</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap w-[120px]">Invoice Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0eb]">
                {filteredList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#fbfcfb] transition-colors">
                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.status === "Success" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-[#eaf5ee] px-2.5 py-1 text-[10.5px] font-bold text-emerald-800 tracking-wide shadow-2xs">
                          <CheckCircle2 size={12} className="stroke-[2.5]" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-1 text-[10.5px] font-bold text-rose-700 tracking-wide shadow-2xs">
                          <XCircle size={12} className="stroke-[2.5]" />
                          FAILED
                        </span>
                      )}
                    </td>

                    {/* Invoice Number */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e7e1] bg-[#f8faf8] px-2.5 py-1 shadow-2xs">
                        <span className="font-mono text-xs font-bold text-[#1f2d29] tracking-tight">{tx.invoiceNo}</span>
                        <button
                          onClick={() => copyToClipboard(tx.invoiceNo, tx.id)}
                          title="Copy Invoice Number"
                          className="text-[#84908a] hover:text-[#1f2d29] transition p-0.5 rounded hover:bg-[#e9ece6] cursor-pointer"
                        >
                          {copiedId === tx.id ? <Check size={11} className="text-emerald-600 stroke-[2.5]" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e7e1] bg-white px-2.5 py-1 text-xs font-semibold text-[#24312e] shadow-2xs">
                        {tx.paymentMode === "UPI / Scanner" || tx.paymentMode === "UPI" ? (
                          <>
                            <QrCode size={13} className="text-emerald-700 shrink-0" />
                            <span>UPI / Scanner</span>
                          </>
                        ) : tx.paymentMode === "Card" ? (
                          <>
                            <CreditCard size={13} className="text-indigo-700 shrink-0" />
                            <span>Card</span>
                          </>
                        ) : (
                          <>
                            <Banknote size={13} className="text-amber-700 shrink-0" />
                            <span>Cash</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Table / Source */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center font-bold text-xs text-[#2b5839] bg-[#eef5f0] border border-[#d6e7db] px-2.5 py-1 rounded-lg">
                        {tx.sessionTitle}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-medium text-xs text-[#24312e]">
                        {tx.customer || "Dining Guest"}
                      </span>
                    </td>

                    {/* Servant */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {tx.servant && tx.servant !== "Unassigned" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8e3dc] bg-[#f0f6f2] px-2.5 py-1 text-xs font-medium text-[#264e36]">
                          <User size={11} className="shrink-0 text-[#315a3d]" />
                          <span>{tx.servant}</span>
                        </span>
                      ) : (
                        <span className="text-[#9aa5a0] text-xs italic">--</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <span className="font-extrabold text-xs text-[#192421] font-mono tracking-tight">
                        {currencySymbol}{Number(tx.amount).toFixed(2)}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-[#24312e]">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Today"}
                        </span>
                        <span className="text-[11px] text-[#84908a]">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </td>

                    {/* Diagnostics */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {tx.status === "Failed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md max-w-md truncate" title={tx.failureReason}>
                          ⚠️ {tx.failureReason || "Transaction declined"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <Check size={12} className="stroke-[2.5] text-emerald-600" />
                          Settled & table released
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe2dc] bg-white px-3 py-1.5 text-xs font-bold text-[#24312e] hover:bg-[#24312e] hover:text-white hover:border-[#24312e] transition shadow-2xs cursor-pointer"
                      >
                        <Printer size={13} />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slip Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Close Button */}
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#84908a] hover:bg-[#f0f1ed] hover:text-[#24312e] cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Thermal Print Slip View */}
            <div className="text-center font-mono">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#24312e] text-white mb-2">
                <Receipt size={20} />
              </div>
              <h3 className="text-base font-bold text-[#24312e]">
                {restaurantSettings?.restaurantName || "Table & Thyme Bistro"}
              </h3>
              <p className="text-[10px] text-[#84908a]">
                {restaurantSettings?.branchName || "Downtown Branch"}
              </p>
              <p className="text-[10px] font-semibold text-[#4e5b56]">
                GSTIN: {restaurantSettings?.gstNumber || "07AAAAA0000A1Z5"}
              </p>
              <p className="text-[10px] text-[#84908a]">
                GST Rate: {restaurantSettings?.taxRate ?? 5.0}% · Service Charge: {restaurantSettings?.serviceCharge ?? 5.0}%
              </p>

              <div className="my-3 border-b border-dashed border-[#84908a]" />

              <div className="flex justify-between text-[11px] text-[#24312e]">
                <span>INVOICE:</span>
                <span className="font-bold">{selectedTx.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#24312e]">
                <span>SESSION:</span>
                <span className="font-bold">{selectedTx.sessionTitle}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#24312e]">
                <span>CUSTOMER:</span>
                <span>{selectedTx.customer}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#24312e]">
                <span>SERVER:</span>
                <span className="font-bold">{selectedTx.servant || "Counter Cashier"}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#24312e]">
                <span>PAYMENT MODE:</span>
                <span className="font-bold">{selectedTx.paymentMode}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#24312e]">
                <span>STATUS:</span>
                <span className={selectedTx.status === "Success" ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                  {selectedTx.status.toUpperCase()}
                </span>
              </div>

              <div className="my-3 border-b border-dashed border-[#84908a]" />

              {/* Items */}
              <div className="space-y-1.5 text-[11px] text-[#24312e]">
                {Array.isArray(selectedTx.items) && selectedTx.items.length > 0 ? (
                  selectedTx.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-left truncate max-w-[170px]">
                        {item.qty}x {item.name}
                      </span>
                      <span>{currencySymbol}{Number(item.total).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span>1x Order Items</span>
                    <span>{currencySymbol}{Number(selectedTx.amount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="my-3 border-b border-dashed border-[#84908a]" />

              <div className="flex justify-between text-xs font-black text-[#24312e]">
                <span>TOTAL AMOUNT:</span>
                <span>{currencySymbol}{Number(selectedTx.amount).toFixed(2)}</span>
              </div>

              {selectedTx.failureReason && (
                <div className="mt-3 rounded-lg bg-red-50 p-2 text-left text-[10px] text-red-700">
                  <span className="font-bold">Failure Reason: </span>
                  {selectedTx.failureReason}
                </div>
              )}

              <p className="mt-4 text-[10px] text-[#84908a]">
                Thank you for dining with us!
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-[#24312e] py-2 text-xs font-bold text-white hover:bg-[#1a2422] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer size={14} />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="flex-1 rounded-xl border border-[#dfe1dc] bg-white py-2 text-xs font-bold text-[#24312e] hover:bg-[#f0f1ed] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
