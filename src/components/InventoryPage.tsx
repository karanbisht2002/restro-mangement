import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Clock,
  Trash2,
  Edit3,
  Truck,
  CheckCircle2,
  X,
  History,
  FileText,
  ClipboardList,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  LayoutGrid,
  List,
  Upload,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import {
  fetchInventory,
  createInventoryItem,
  updateInventoryItem,
  restockInventoryItem,
  logDailyUsage,
  fetchInventoryLogs,
  deleteInventoryItem,
  createInventoryCategory,
  createInventoryUnit,
  type InventoryItem,
  type InventoryMetrics,
  type InventoryLog,
  type InventoryUnit,
} from "../api/inventory";
import type { StaffRole } from "../types";

interface InventoryPageProps {
  currencySymbol?: string;
  role?: StaffRole | null;
  currentUser?: { name?: string; role?: string } | null;
  showToast?: (type: "success" | "error" | "info", title: string, message: string) => void;
}

const PRESET_STOCK_IMAGES = [
  { label: "🧀 Paneer / Cheese", url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80" },
  { label: "🍗 Chicken / Meat", url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80" },
  { label: "🥦 Fresh Veggies", url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80" },
  { label: "🍚 Rice & Grains", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80" },
  { label: "🧈 Butter & Ghee", url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80" },
  { label: "🫒 Oils & Spices", url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80" },
  { label: "📦 Packaging", url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80" },
];

export default function InventoryPage({
  currencySymbol = "₹",
  role = "Manager",
  currentUser,
  showToast,
}: InventoryPageProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    todayUsageCount: 0,
    weeklyWastageValue: 0,
  });
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [units, setUnits] = useState<InventoryUnit[]>([
    { name: "kg", label: "Kilogram (kg)" },
    { name: "g", label: "Gram (g)" },
    { name: "L", label: "Liter (L)" },
    { name: "ml", label: "Milliliter (ml)" },
    { name: "pcs", label: "Pieces (pcs)" },
    { name: "bottle", label: "Bottle (bottle)" },
    { name: "box", label: "Box (box)" },
    { name: "pack", label: "Pack (pack)" },
    { name: "crate", label: "Crate (crate)" },
    { name: "can", label: "Can / Tin (can)" },
  ]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Low" | "Out" | "In">("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Selected item for actions
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [itemLogs, setItemLogs] = useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Add & Edit Product form state
  const [addForm, setAddForm] = useState({
    name: "",
    category: "Dairy",
    currentStock: 10,
    minStockLimit: 5,
    unit: "kg",
    costPerUnit: 100,
    supplier: "",
    image: "",
  });

  // Restock form state
  const [restockForm, setRestockForm] = useState({
    quantity: 10,
    costPerUnit: 0,
    supplier: "",
    notes: "",
  });

  // Daily Usage/Waste form state
  const [dailyForm, setDailyForm] = useState({
    usage: 1,
    waste: 0,
    notes: "",
  });

  // Load Inventory Data
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchInventory();
      setItems(data.items);
      setMetrics(data.metrics);
      setCategories(data.categories);
      if (data.units && data.units.length > 0) {
        setUnits(data.units);
      }
    } catch (err: any) {
      if (showToast) {
        showToast("error", "Failed to load inventory", err?.message || "Error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loggedByLabel = useMemo(() => {
    if (currentUser?.name) {
      return `${currentUser.name} (${role || "Staff"})`;
    }
    return role === "Kitchen" ? "Chef Sunita (Kitchen)" : "Priya Shah (Manager)";
  }, [currentUser, role]);

  // Image Upload handler via FileReader
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/webp", 0.9);
            setAddForm((prev) => ({ ...prev, image: compressed }));
          } else {
            setAddForm((prev) => ({ ...prev, image: ev.target?.result as string }));
          }
        } catch {
          setAddForm((prev) => ({ ...prev, image: ev.target?.result as string }));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Open Daily Usage Modal for an item
  const openDailyLog = (item: InventoryItem) => {
    setActiveItem(item);
    setDailyForm({
      usage: 1,
      waste: 0,
      notes: "End-of-day kitchen consumption",
    });
    setFormError("");
    setIsDailyLogModalOpen(true);
  };

  // Open Restock Modal for an item
  const openRestock = (item: InventoryItem) => {
    setActiveItem(item);
    setRestockForm({
      quantity: 10,
      costPerUnit: item.costPerUnit,
      supplier: item.supplier || "",
      notes: "Vendor delivery shipment",
    });
    setFormError("");
    setIsRestockModalOpen(true);
  };

  // Open History for an item
  const openHistory = async (item: InventoryItem) => {
    setActiveItem(item);
    setIsHistoryModalOpen(true);
    setLoadingLogs(true);
    try {
      const logs = await fetchInventoryLogs(item.id);
      setItemLogs(logs);
    } catch {
      setItemLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Open Edit Modal for an item
  const openEdit = (item: InventoryItem) => {
    setActiveItem(item);
    setAddForm({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      minStockLimit: item.minStockLimit,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      supplier: item.supplier || "",
      image: item.image || "",
    });
    setFormError("");
    setIsEditModalOpen(true);
  };

  // Handle Add Product Submit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (addForm.minStockLimit < 0) {
      setFormError("Minimum stock limit cannot be negative.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await createInventoryItem({
        name: addForm.name.trim(),
        category: addForm.category,
        currentStock: Number(addForm.currentStock) || 0,
        minStockLimit: Number(addForm.minStockLimit) || 0,
        unit: addForm.unit,
        costPerUnit: Number(addForm.costPerUnit) || 0,
        supplier: addForm.supplier.trim() || undefined,
        image: addForm.image.trim() || undefined,
        loggedBy: loggedByLabel,
      });

      if (showToast) {
        showToast("success", "Product Added", `${addForm.name} has been added to inventory.`);
      }
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to add product.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Product Submit
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (!addForm.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await updateInventoryItem(activeItem.id, {
        name: addForm.name.trim(),
        category: addForm.category,
        minStockLimit: Number(addForm.minStockLimit) || 0,
        costPerUnit: Number(addForm.costPerUnit) || 0,
        supplier: addForm.supplier.trim() || undefined,
        image: addForm.image.trim() || "",
        unit: addForm.unit,
      });

      if (showToast) {
        showToast("success", "Product Updated", `${addForm.name} updated successfully.`);
      }
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    const addQty = Number(restockForm.quantity);
    if (isNaN(addQty) || addQty <= 0) {
      setFormError("Please enter a valid positive quantity to add.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const res = await restockInventoryItem(activeItem.id, {
        quantity: addQty,
        costPerUnit: Number(restockForm.costPerUnit) || activeItem.costPerUnit,
        supplier: restockForm.supplier.trim() || undefined,
        notes: restockForm.notes.trim() || undefined,
        loggedBy: loggedByLabel,
      });

      if (showToast) {
        showToast(
          "success",
          "Stock Added",
          `Added ${addQty} ${activeItem.unit} to ${activeItem.name}. New total: ${res.newStock} ${activeItem.unit}.`
        );
      }
      setIsRestockModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to restock item.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle End-of-Day Daily Usage Submit
  const handleDailyLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    const usageQty = Math.max(0, Number(dailyForm.usage) || 0);
    const wasteQty = Math.max(0, Number(dailyForm.waste) || 0);
    const totalDeducted = usageQty + wasteQty;

    if (totalDeducted <= 0) {
      setFormError("Please enter usage or waste amount greater than 0.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const res = await logDailyUsage(activeItem.id, {
        usage: usageQty,
        waste: wasteQty,
        notes: dailyForm.notes.trim() || undefined,
        loggedBy: loggedByLabel,
      });

      if (showToast) {
        showToast(
          "success",
          "Daily Usage Logged",
          `Deducted ${totalDeducted} ${activeItem.unit} from ${activeItem.name}. Remaining: ${res.newStock} ${activeItem.unit}.`
        );
      }
      setIsDailyLogModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to log daily usage.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from inventory?`)) {
      return;
    }
    try {
      await deleteInventoryItem(item.id);
      if (showToast) {
        showToast("info", "Item Deleted", `${item.name} was removed from inventory.`);
      }
      loadData();
    } catch (err: any) {
      if (showToast) {
        showToast("error", "Delete Failed", err.message || "Could not delete item.");
      }
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const searchMatch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category
      const categoryMatch = selectedCategory === "All" || item.category === selectedCategory;

      // Status
      const isOut = item.currentStock <= 0;
      const isLow = item.currentStock > 0 && item.currentStock <= item.minStockLimit;
      const isIn = item.currentStock > item.minStockLimit;

      let statusMatch = true;
      if (statusFilter === "Low") statusMatch = isLow;
      if (statusFilter === "Out") statusMatch = isOut;
      if (statusFilter === "In") statusMatch = isIn;

      return searchMatch && categoryMatch && statusMatch;
    });
  }, [items, searchTerm, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[.2em] text-[#84908a]">
            Stock & Raw Materials
          </span>
          <h1 className="display-font text-2xl font-bold text-[#24312e]">Inventory</h1>
          <p className="text-xs text-[#84908a] mt-0.5">
            Real-time stock tracking with configurable low-stock alerts and daily usage deduction.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-xl border border-[#dfe1dc] bg-white px-3 py-2.5 text-xs font-bold text-[#68736e] hover:bg-[#fbfaf7] hover:text-[#24312e] transition cursor-pointer shadow-2xs"
            title="Refresh Inventory"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              if (items.length > 0) {
                openDailyLog(items[0]);
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-[#dfe1dc] bg-[#fff5ed] px-3.5 py-2.5 text-xs font-bold text-[#b7623d] hover:bg-[#ffeade] transition cursor-pointer shadow-2xs"
          >
            <ClipboardList size={15} />
            <span>End-of-Day Log</span>
          </button>

          <button
            onClick={() => {
              setAddForm({
                name: "",
                category: categories.find((c) => c !== "All") || "Dairy",
                currentStock: 10,
                minStockLimit: 5,
                unit: units[0]?.name || "kg",
                costPerUnit: 100,
                supplier: "",
                image: "",
              });
              setFormError("");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        {/* Total Stock Value */}
        <div className="rounded-2xl border border-[#e0e2dc] bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#84908a]">Total Stock Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f1e8] text-[#315a3d]">
              <Package size={17} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-[#24312e]">
            {currencySymbol}{metrics.totalStockValue.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#84908a]">
            <span>Active raw materials value</span>
          </div>
        </div>

        {/* Low Stock Items Alert */}
        <div
          onClick={() => setStatusFilter(statusFilter === "Low" ? "All" : "Low")}
          className={`rounded-2xl border p-4.5 transition cursor-pointer shadow-2xs ${
            metrics.lowStockCount > 0
              ? "border-[#fbd3bf] bg-[#fffaf5] ring-1 ring-[#b7623d]/20"
              : "border-[#e0e2dc] bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#84908a]">Low Stock Items</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              metrics.lowStockCount > 0 ? "bg-[#ffe7d6] text-[#b7623d]" : "bg-[#f0f2ed] text-[#84908a]"
            }`}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div className={`mt-2 text-xl font-black ${metrics.lowStockCount > 0 ? "text-[#b7623d]" : "text-[#24312e]"}`}>
            {metrics.lowStockCount} {metrics.lowStockCount === 1 ? "item" : "items"}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#84908a]">
            {metrics.lowStockCount > 0 ? "Below safety limit · Click to filter" : "All products within safe limit"}
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStatusFilter(statusFilter === "Out" ? "All" : "Out")}
          className={`rounded-2xl border p-4.5 transition cursor-pointer shadow-2xs ${
            metrics.outOfStockCount > 0
              ? "border-red-200 bg-red-50/60 ring-1 ring-red-500/20"
              : "border-[#e0e2dc] bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#84908a]">Out of Stock</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              metrics.outOfStockCount > 0 ? "bg-red-100 text-red-700" : "bg-[#f0f2ed] text-[#84908a]"
            }`}>
              <Flame size={17} />
            </div>
          </div>
          <div className={`mt-2 text-xl font-black ${metrics.outOfStockCount > 0 ? "text-red-700" : "text-[#24312e]"}`}>
            {metrics.outOfStockCount} {metrics.outOfStockCount === 1 ? "item" : "items"}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#84908a]">
            {metrics.outOfStockCount > 0 ? "Depleted stock · Needs refill" : "Zero depleted stock"}
          </div>
        </div>

        {/* Today's Usage */}
        <div className="rounded-2xl border border-[#e0e2dc] bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#84908a]">Today's Usage</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6eee5] text-[#315a3d]">
              <TrendingDown size={17} />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-[#24312e]">
            {metrics.todayUsageCount} <span className="text-xs font-medium text-[#84908a]">units consumed</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#84908a]">
            <span>Weekly waste: {currencySymbol}{metrics.weeklyWastageValue.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Main Catalog Card */}
      <div className="rounded-3xl border border-[#dfe1dc] bg-white shadow-sm overflow-hidden">
        {/* Search & Category Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-[#e9eae6] bg-[#fbfaf7] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-3 text-[#84908a]" />
              <input
                type="text"
                placeholder="Search by ingredient, category, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#dfe1dc] bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-[#24312e] transition"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[#84908a] font-bold mr-1 flex items-center gap-1">
                  <Filter size={12} /> Status:
                </span>
                {(["All", "In", "Low", "Out"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#24312e] text-white shadow-xs"
                        : "bg-[#eef0eb] text-[#68736e] hover:bg-[#dfe1dc]"
                    }`}
                  >
                    {st === "All"
                      ? "All"
                      : st === "In"
                      ? "In Stock"
                      : st === "Low"
                      ? "Low Stock"
                      : "Out of Stock"}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle (Grid vs Table) */}
              <div className="flex items-center rounded-xl border border-[#dfe1dc] bg-[#eef0eb] p-0.5 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#24312e] text-white shadow-xs"
                      : "text-[#68736e] hover:text-[#24312e]"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={13} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#24312e] text-white shadow-xs"
                      : "text-[#68736e] hover:text-[#24312e]"
                  }`}
                  title="Table View"
                >
                  <List size={13} />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1 font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#315a3d] text-white shadow-2xs"
                    : "bg-white border border-[#dfe1dc] text-[#68736e] hover:bg-[#f0f2ed]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-[#84908a]">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-[#315a3d]" />
            <p className="text-sm font-bold text-[#24312e]">Loading inventory products...</p>
            <p className="text-xs text-[#84908a] mt-1">Retrieving stock levels, units, and images.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-[#84908a]">
            <Package size={32} className="mx-auto mb-2 text-[#b0b8b3]" />
            <p className="font-bold text-sm text-[#24312e]">No inventory items found</p>
            <p className="text-xs mt-1">Try adjusting your search or category filter.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* ========================================================= */
          /* STOCK GRID VIEW (DEFAULT & PROMINENT)                     */
          /* ========================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5 p-4 sm:p-5">
            {filteredItems.map((item) => {
              const isOut = item.currentStock <= 0;
              const isLow = item.currentStock > 0 && item.currentStock <= item.minStockLimit;
              const totalValue = item.currentStock * item.costPerUnit;
              const healthPercent = Math.min(
                100,
                Math.round((item.currentStock / Math.max(item.minStockLimit * 2, 1)) * 100)
              );

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-2xs hover:shadow-md ${
                    isOut
                      ? "border-red-200 ring-1 ring-red-500/20"
                      : isLow
                      ? "border-[#fbd3bf] ring-1 ring-[#b7623d]/20"
                      : "border-[#e0e2dc] hover:border-[#24312e]/40"
                  }`}
                >
                  {/* Card Image Cover & Status Overlay */}
                  <div className="relative h-44 w-full bg-[#f4f5f0] overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#84908a]">
                        <Package size={42} className="stroke-[1.3] text-[#b5beb7]" />
                        <span className="text-[10px] font-bold mt-1 text-[#a3aca6]">No Image</span>
                      </div>
                    )}

                    {/* Subtle Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />

                    {/* Top Left: Category Tag */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="rounded-lg bg-[#24312e]/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        {item.category}
                      </span>
                    </div>

                    {/* Top Right: Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-xs backdrop-blur-md ${
                          isOut
                            ? "bg-red-600 text-white"
                            : isLow
                            ? "bg-[#b7623d] text-white animate-pulse"
                            : "bg-[#2d5f39] text-white"
                        }`}
                      >
                        {isOut ? (
                          <>
                            <Flame size={11} /> Out of stock
                          </>
                        ) : isLow ? (
                          <>
                            <AlertTriangle size={11} /> Low stock
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={11} /> In stock
                          </>
                        )}
                      </span>
                    </div>

                    {/* Bottom Left on Image: Supplier */}
                    {item.supplier && (
                      <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[10px] text-white/95 font-medium drop-shadow-xs max-w-[85%] truncate">
                        <Truck size={12} className="text-white/80 shrink-0" />
                        <span className="truncate">{item.supplier}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3
                        className="font-bold text-sm text-[#24312e] leading-snug line-clamp-1"
                        title={item.name}
                      >
                        {item.name}
                      </h3>

                      {/* Stock Quantity vs Safety Limit */}
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#84908a] block">
                            On-Hand Stock
                          </span>
                          <span
                            className={`text-2xl font-black ${
                              isOut ? "text-red-600" : isLow ? "text-[#b7623d]" : "text-[#24312e]"
                            }`}
                          >
                            {item.currentStock}{" "}
                            <span className="text-xs font-bold text-[#84908a]">{item.unit}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#84908a] block">
                            Alert Limit
                          </span>
                          <span className="text-xs font-semibold text-[#68736e]">
                            {item.minStockLimit} {item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Stock Health Bar */}
                      <div className="mt-2.5">
                        <div className="h-1.5 w-full rounded-full bg-[#eef0eb] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isOut ? "bg-red-500 w-0" : isLow ? "bg-[#b7623d]" : "bg-[#315a3d]"
                            }`}
                            style={{ width: `${healthPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Cost per unit & Total Value */}
                      <div className="mt-3 pt-2.5 border-t border-[#f0f1ed] flex items-center justify-between text-xs">
                        <span className="text-[#84908a] text-[11px]">
                          {currencySymbol}{item.costPerUnit} / {item.unit}
                        </span>
                        <span className="font-bold text-[#24312e] text-[11px]">
                          Total: {currencySymbol}{Math.round(totalValue).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-[#f0f1ed] space-y-2">
                      {/* Line 1: history (icon) edit (icon) delete (icon) */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openHistory(item)}
                          className="flex-1 flex items-center justify-center h-8.5 rounded-xl border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f2ed] hover:text-[#24312e] transition cursor-pointer shadow-2xs"
                          title="Audit Trail History"
                        >
                          <History size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="flex-1 flex items-center justify-center h-8.5 rounded-xl border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f2ed] hover:text-[#24312e] transition cursor-pointer shadow-2xs"
                          title="Edit Product"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="flex-1 flex items-center justify-center h-8.5 rounded-xl border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition cursor-pointer shadow-2xs"
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Line 2: usage button in rectangular box */}
                      <button
                        type="button"
                        onClick={() => openDailyLog(item)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#fbd3bf] bg-[#fffaf5] py-2 px-3 text-[11px] font-bold text-[#b7623d] hover:bg-[#ffeade] hover:border-[#b7623d] transition cursor-pointer shadow-2xs"
                        title="Log Daily Usage & Spoilage"
                      >
                        <ClipboardList size={13} />
                        <span>Log Usage & Waste</span>
                      </button>

                      {/* Line 3: restock button in rectangular */}
                      <button
                        type="button"
                        onClick={() => openRestock(item)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#24312e] py-2 px-3 text-[11px] font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shadow-xs"
                        title="Restock Incoming Stock"
                      >
                        <Plus size={13} />
                        <span>Restock</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================= */
          /* TABLE VIEW                                                */
          /* ========================================================= */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-[#e9eae6] bg-[#fbfaf7]/60 text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa39d]">
                <tr>
                  <th className="px-5 py-3.5">Product & Category</th>
                  <th className="px-4 py-3.5">Current Stock</th>
                  <th className="px-4 py-3.5">Alert Limit</th>
                  <th className="px-4 py-3.5">Stock Health</th>
                  <th className="px-4 py-3.5 text-right">Cost / Unit</th>
                  <th className="px-4 py-3.5 text-right">Total Value</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap min-w-[270px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f1ed]">
                {filteredItems.map((item) => {
                  const isOut = item.currentStock <= 0;
                  const isLow = item.currentStock > 0 && item.currentStock <= item.minStockLimit;
                  const totalValue = item.currentStock * item.costPerUnit;
                  const healthPercent = Math.min(
                    100,
                    Math.round((item.currentStock / Math.max(item.minStockLimit * 2, 1)) * 100)
                  );

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#fbfaf7] transition ${
                        isOut ? "bg-red-50/20" : isLow ? "bg-[#fffaf5]" : ""
                      }`}
                    >
                      {/* Product Name, Image & Category */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#f0f2ed] overflow-hidden shrink-0 border border-[#e0e2dc] flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Package size={18} className="text-[#84908a]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#24312e]">{item.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#84908a]">
                              <span className="rounded bg-[#f0f2ed] px-1.5 py-0.5 font-bold text-[#55605b]">
                                {item.category}
                              </span>
                              {item.supplier && <span>· {item.supplier}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm ${
                              isOut ? "text-red-600" : isLow ? "text-[#b7623d]" : "text-[#24312e]"
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                          {isOut ? (
                            <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-700">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="rounded-md bg-[#ffe7d6] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#b7623d]">
                              Low
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Alert Limit */}
                      <td className="px-4 py-3.5 font-medium text-[#68736e]">
                        {item.minStockLimit} {item.unit}
                      </td>

                      {/* Stock Health */}
                      <td className="px-4 py-3.5">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[10px] text-[#84908a] mb-1">
                            <span>{healthPercent}%</span>
                            <span>{isOut ? "Empty" : isLow ? "Re-order" : "Good"}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#eef0eb] overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isOut ? "bg-red-500 w-0" : isLow ? "bg-[#b7623d]" : "bg-[#315a3d]"
                              }`}
                              style={{ width: `${healthPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cost per unit */}
                      <td className="px-4 py-3.5 text-right font-semibold text-[#68736e]">
                        {currencySymbol}{item.costPerUnit} / {item.unit}
                      </td>

                      {/* Total Value */}
                      <td className="px-4 py-3.5 text-right font-black text-[#24312e]">
                        {currencySymbol}{Math.round(totalValue).toLocaleString("en-IN")}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => openDailyLog(item)}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#dfe1dc] bg-white px-2 py-1 text-[10px] font-bold text-[#b7623d] hover:bg-[#fff5ed] hover:border-[#b7623d] transition cursor-pointer shadow-2xs shrink-0"
                            title="Log Day Usage & Waste"
                          >
                            <ClipboardList size={12} />
                            <span className="whitespace-nowrap">Log Usage</span>
                          </button>

                          <button
                            onClick={() => openRestock(item)}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#dfe1dc] bg-white px-2 py-1 text-[10px] font-bold text-[#315a3d] hover:bg-[#e8f1e8] hover:border-[#315a3d] transition cursor-pointer shadow-2xs shrink-0"
                            title="Add Incoming Delivery"
                          >
                            <Plus size={12} />
                            <span className="whitespace-nowrap">Restock</span>
                          </button>

                          <button
                            onClick={() => openHistory(item)}
                            className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed] hover:text-[#24312e] transition cursor-pointer shrink-0"
                            title="Stock Movement Ledger"
                          >
                            <History size={14} />
                          </button>

                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed] hover:text-[#24312e] transition cursor-pointer shrink-0"
                            title="Edit Product Details"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="rounded-lg p-1.5 text-[#84908a] hover:bg-red-50 hover:text-red-600 transition cursor-pointer shrink-0"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW PRODUCT                                 */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#dfe1dc] shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e9eae6] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#24312e]">Add Raw Material</h3>
                  <p className="text-xs text-[#84908a]">Register new ingredient with photo, unit & category</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed]"
              >
                <X size={17} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="mt-4 space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Malai Paneer"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                />
              </div>

              {/* Product Image Section */}
              <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-[#315a3d]" />
                    <span>Product Image</span>
                  </label>
                  {addForm.image && (
                    <button
                      type="button"
                      onClick={() => setAddForm({ ...addForm, image: "" })}
                      className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Preview if image selected */}
                {addForm.image ? (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#dfe1dc] bg-white">
                    <img
                      src={addForm.image}
                      alt="Product Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-xs">
                      Active Photo
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* File Upload Input */}
                    <input
                      type="file"
                      accept="image/*"
                      id="inventory-add-file-upload"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    <label
                      htmlFor="inventory-add-file-upload"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#84908a] bg-white py-2 text-xs font-bold text-[#24312e] hover:bg-[#f0f2ed] transition cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Upload from Device</span>
                    </label>
                  </div>
                )}

                {/* Image URL text input */}
                <div>
                  <input
                    type="url"
                    placeholder="Or paste an Image URL (https://...)"
                    value={addForm.image}
                    onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-[#84908a] uppercase tracking-wider block mb-1.5">
                    Quick Preset Photos
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_STOCK_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, image: preset.url })}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                          addForm.image === preset.url
                            ? "bg-[#315a3d] text-white shadow-2xs"
                            : "bg-white border border-[#dfe1dc] text-[#55605b] hover:bg-[#f0f2ed]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category & Unit of Measurement Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category Column */}
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Category</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  >
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Unit of Measurement Column */}
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Unit of Measure</label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  >
                    {units.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.label || u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Quantities */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Opening Stock ({addForm.unit})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addForm.currentStock}
                    onChange={(e) => setAddForm({ ...addForm, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Low Stock Alert Limit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addForm.minStockLimit}
                    onChange={(e) => setAddForm({ ...addForm, minStockLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                  <p className="text-[10px] text-[#84908a] mt-0.5">Alerts when stock drops to or below this</p>
                </div>
              </div>

              {/* Cost & Supplier */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Cost per Unit ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addForm.costPerUnit}
                    onChange={(e) => setAddForm({ ...addForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Vendor / Supplier (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy Pure Farms"
                    value={addForm.supplier}
                    onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-[#e9eae6] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LOG END-OF-DAY USAGE & WASTAGE                  */}
      {/* ========================================================= */}
      {isDailyLogModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#dfe1dc] shadow-2xl p-6 my-auto">
            <div className="flex items-center justify-between border-b border-[#e9eae6] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff5ed] text-[#b7623d]">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#24312e]">Log End-of-Day Usage</h3>
                  <p className="text-xs text-[#84908a]">Deduct day consumption & wastage</p>
                </div>
              </div>
              <button
                onClick={() => setIsDailyLogModalOpen(false)}
                className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed]"
              >
                <X size={17} />
              </button>
            </div>

            {/* Product Quick Info Card */}
            <div className="mt-4 rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#24312e]">{activeItem.name}</span>
                <span className="rounded bg-[#f0f2ed] px-2 py-0.5 text-[10px] font-bold text-[#55605b]">
                  {activeItem.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#68736e]">
                <span>Current On-Hand Stock:</span>
                <span className="font-black text-[#24312e] text-sm">
                  {activeItem.currentStock} {activeItem.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#84908a]">
                <span>Low Stock Alert Threshold:</span>
                <span className="font-semibold">{activeItem.minStockLimit} {activeItem.unit}</span>
              </div>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleDailyLogSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#24312e] block mb-1">
                  Day's Usage Amount ({activeItem.unit}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  placeholder="e.g. 5"
                  value={dailyForm.usage}
                  onChange={(e) => setDailyForm({ ...dailyForm, usage: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#b7623d]"
                />
                <p className="text-[10px] text-[#84908a] mt-0.5">Quantity consumed during cooking & preparation</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Wastage / Spoilage Amount ({activeItem.unit}) (Optional)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="e.g. 0.5"
                  value={dailyForm.waste}
                  onChange={(e) => setDailyForm({ ...dailyForm, waste: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#b7623d]"
                />
                <p className="text-[10px] text-[#84908a] mt-0.5">Burned, expired, or dropped during shift</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">Shift Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner shift bulk prep"
                  value={dailyForm.notes}
                  onChange={(e) => setDailyForm({ ...dailyForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#b7623d]"
                />
              </div>

              {/* Real-time Calculation Preview */}
              <div className="rounded-xl border border-[#e9eae6] bg-[#f0f2ed] p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-[#68736e]">
                  <span>Previous Stock:</span>
                  <span className="font-bold">{activeItem.currentStock} {activeItem.unit}</span>
                </div>
                <div className="flex items-center justify-between text-[#b7623d]">
                  <span>Total Deduction:</span>
                  <span className="font-bold">-{(dailyForm.usage + dailyForm.waste).toFixed(2)} {activeItem.unit}</span>
                </div>
                <div className="border-t border-[#dfe1dc] pt-1 flex items-center justify-between text-sm font-black text-[#24312e]">
                  <span>New Remaining Stock:</span>
                  <span
                    className={
                      activeItem.currentStock - (dailyForm.usage + dailyForm.waste) <= activeItem.minStockLimit
                        ? "text-[#b7623d]"
                        : "text-[#315a3d]"
                    }
                  >
                    {Math.max(0, Number((activeItem.currentStock - (dailyForm.usage + dailyForm.waste)).toFixed(2)))}{" "}
                    {activeItem.unit}
                  </span>
                </div>
                {activeItem.currentStock - (dailyForm.usage + dailyForm.waste) <= activeItem.minStockLimit && (
                  <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-[#b7623d]">
                    <AlertTriangle size={12} />
                    <span>Warning: Will drop below low-stock limit ({activeItem.minStockLimit} {activeItem.unit})</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDailyLogModalOpen(false)}
                  className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || dailyForm.usage + dailyForm.waste <= 0}
                  className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition disabled:opacity-50"
                >
                  {submitting ? "Deducting..." : "Record & Deduct"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: RESTOCK / ADD STOCK                             */}
      {/* ========================================================= */}
      {isRestockModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#dfe1dc] shadow-2xl p-6 my-auto">
            <div className="flex items-center justify-between border-b border-[#e9eae6] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f1e8] text-[#315a3d]">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#24312e]">Add Stock (Restock)</h3>
                  <p className="text-xs text-[#84908a]">Receive vendor delivery</p>
                </div>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed]"
              >
                <X size={17} />
              </button>
            </div>

            {/* Product Quick Info Card */}
            <div className="mt-4 rounded-2xl border border-[#dfe1dc] bg-[#fbfaf7] p-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#24312e]">{activeItem.name}</span>
                <p className="text-[11px] text-[#84908a] mt-0.5">
                  Current Stock: <strong>{activeItem.currentStock} {activeItem.unit}</strong>
                </p>
              </div>
              <span className="text-xs font-bold text-[#315a3d] bg-[#e8f1e8] px-2 py-1 rounded-lg">
                {currencySymbol}{activeItem.costPerUnit} / {activeItem.unit}
              </span>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#24312e] block mb-1">
                  Incoming Quantity ({activeItem.unit}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0.1}
                  step="any"
                  required
                  placeholder="e.g. 10"
                  value={restockForm.quantity}
                  onChange={(e) => setRestockForm({ ...restockForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#315a3d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Unit Cost ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={restockForm.costPerUnit}
                    onChange={(e) => setRestockForm({ ...restockForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#315a3d]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={restockForm.supplier}
                    onChange={(e) => setRestockForm({ ...restockForm, supplier: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#315a3d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">Invoice / Delivery Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #PO-9842 / Morning shipment"
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#315a3d]"
                />
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-[#e9eae6] bg-[#f0f2ed] p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-[#68736e]">
                  <span>Current:</span>
                  <span className="font-bold">{activeItem.currentStock} {activeItem.unit}</span>
                </div>
                <div className="flex items-center justify-between text-[#315a3d]">
                  <span>Added:</span>
                  <span className="font-bold">+{restockForm.quantity} {activeItem.unit}</span>
                </div>
                <div className="border-t border-[#dfe1dc] pt-1 flex items-center justify-between text-sm font-black text-[#24312e]">
                  <span>New Total Stock:</span>
                  <span className="text-[#315a3d]">
                    {(activeItem.currentStock + restockForm.quantity).toFixed(2)} {activeItem.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || restockForm.quantity <= 0}
                  className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Confirm Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: STOCK AUDIT HISTORY                             */}
      {/* ========================================================= */}
      {isHistoryModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#dfe1dc] shadow-2xl p-6 my-auto flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#e9eae6] pb-3.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#24312e]">Stock Audit Ledger</h3>
                  <p className="text-xs text-[#84908a]">Movement history for {activeItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed]"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              {loadingLogs ? (
                <div className="py-12 text-center text-[#84908a]">
                  <RefreshCw size={18} className="mx-auto mb-2 animate-spin text-[#315a3d]" />
                  <span>Loading audit records...</span>
                </div>
              ) : itemLogs.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#84908a]">
                  No movement records found for this item yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {itemLogs.map((log) => {
                    const isPositive = log.type === "RESTOCK" || log.type === "INITIAL";
                    return (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-[#e9eae6] bg-[#fbfaf7] p-3 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                              log.type === "RESTOCK"
                                ? "bg-[#e8f1e8] text-[#315a3d]"
                                : log.type === "USAGE"
                                ? "bg-[#fff5ed] text-[#b7623d]"
                                : log.type === "WASTAGE"
                                ? "bg-red-100 text-red-700"
                                : "bg-[#f0f2ed] text-[#68736e]"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight size={16} />
                            ) : (
                              <ArrowDownRight size={16} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#24312e]">{log.type}</span>
                              <span className="text-[10px] text-[#84908a]">
                                {new Date(log.createdAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#68736e] mt-0.5">
                              {log.notes || "Stock update"} · By {log.loggedBy}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-black text-sm ${
                              isPositive ? "text-[#315a3d]" : "text-[#b7623d]"
                            }`}
                          >
                            {isPositive ? "+" : "-"}
                            {log.quantity} {log.unit}
                          </span>
                          <p className="text-[10px] text-[#84908a]">
                            {log.previousStock} ➔ {log.newStock} {log.unit}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#e9eae6] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: EDIT PRODUCT DETAILS                            */}
      {/* ========================================================= */}
      {isEditModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#dfe1dc] shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e9eae6] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#24312e]">Edit Product</h3>
                  <p className="text-xs text-[#84908a]">Update image, category, unit, limit & pricing</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed]"
              >
                <X size={17} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditProduct} className="mt-4 space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                />
              </div>

              {/* Product Image Section */}
              <div className="rounded-2xl border border-[#e0e2dc] bg-[#fbfaf7] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-[#315a3d]" />
                    <span>Product Image</span>
                  </label>
                  {addForm.image && (
                    <button
                      type="button"
                      onClick={() => setAddForm({ ...addForm, image: "" })}
                      className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Preview */}
                {addForm.image ? (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#dfe1dc] bg-white">
                    <img
                      src={addForm.image}
                      alt="Product Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-xs">
                      Active Photo
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="inventory-edit-file-upload"
                      className="hidden"
                      onChange={handleImageFileUpload}
                    />
                    <label
                      htmlFor="inventory-edit-file-upload"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#84908a] bg-white py-2 text-xs font-bold text-[#24312e] hover:bg-[#f0f2ed] transition cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Upload from Device</span>
                    </label>
                  </div>
                )}

                {/* Image URL text input */}
                <div>
                  <input
                    type="url"
                    placeholder="Or paste an Image URL (https://...)"
                    value={addForm.image}
                    onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-[#84908a] uppercase tracking-wider block mb-1.5">
                    Quick Preset Photos
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_STOCK_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, image: preset.url })}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                          addForm.image === preset.url
                            ? "bg-[#315a3d] text-white shadow-2xs"
                            : "bg-white border border-[#dfe1dc] text-[#55605b] hover:bg-[#f0f2ed]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category & Unit of Measurement Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category Column */}
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Category</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  >
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Unit of Measurement Column */}
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Unit of Measure</label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  >
                    {units.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.label || u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Low Stock Alert Limit & Unit Cost */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Alert Limit ({addForm.unit}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addForm.minStockLimit}
                    onChange={(e) => setAddForm({ ...addForm, minStockLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                  <p className="text-[10px] text-[#84908a] mt-0.5">Low-stock warning threshold</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Cost per Unit ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addForm.costPerUnit}
                    onChange={(e) => setAddForm({ ...addForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">Vendor / Supplier</label>
                <input
                  type="text"
                  value={addForm.supplier}
                  onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
                  className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-[#e9eae6] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
