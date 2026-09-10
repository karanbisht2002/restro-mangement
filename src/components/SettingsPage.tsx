import { useState, useEffect, useCallback } from "react";
import {
  UserRound,
  KeyRound,
  Sliders,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  Receipt,
  Percent,
  Upload,
  Image as ImageIcon,
  Lock,
  Unlock,
  Trash2,
  Calculator,
  Sparkles,
  Package,
  Plus,
  X,
  AlertTriangle,
  Layers,
  Scale,
  Truck,
  ArrowRight,
} from "lucide-react";
import { updateStaff, changeStaffPassword } from "../api/team";
import {
  fetchInventory,
  fetchInventoryMeta,
  createInventoryCategory,
  deleteInventoryCategory,
  createInventoryUnit,
  deleteInventoryUnit,
  createInventoryItem,
  type InventoryItem,
  type InventoryUnit,
} from "../api/inventory";
import { ToastContainer, type ToastItem } from "./Toast";

export interface StationDisplayPreferences {
  ticketDensity: "comfortable" | "compact";
  tableAlerts: boolean;
}

export interface StoreSettings {
  restaurantName: string;
  branchName: string;
  currencySymbol: string;
  taxRate: number;
  serviceCharge: number;
  receiptFooter: string;
  estimatedPrepTimeMinutes: number;
  tableTurnTimeMinutes: number;
  logoUrl?: string;
  isCurrencyLocked?: boolean;
  unlockCurrency?: boolean;
  gstNumber?: string;
}

interface SettingsPageProps {
  currentUser: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    pin?: string;
    department?: string;
    systemRole: string;
  } | null;
  onUpdateCurrentUser: (updated: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    pin?: string;
    department?: string;
    systemRole: string;
  }) => void;
  stationPreferences: StationDisplayPreferences;
  onUpdatePreferences: (prefs: StationDisplayPreferences) => void;
  restaurantSettings: StoreSettings;
  onUpdateRestaurantSettings: (updated: StoreSettings) => Promise<void>;
  departments: string[];
  onAddDepartment: (name: string) => Promise<string[]>;
  onDeleteDepartment: (name: string) => Promise<string[]>;
}

type SettingsSection = "profile" | "security" | "display" | "restaurant" | "inventory";

const PRESET_STOCK_IMAGES = [
  { label: "🧀 Paneer / Cheese", url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80" },
  { label: "🍗 Chicken / Meat", url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80" },
  { label: "🥦 Fresh Veggies", url: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80" },
  { label: "🍚 Rice & Grains", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80" },
  { label: "🧈 Butter & Ghee", url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80" },
  { label: "🫒 Oils & Spices", url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80" },
  { label: "📦 Packaging", url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80" },
];

export default function SettingsPage({
  currentUser,
  onUpdateCurrentUser,
  stationPreferences,
  onUpdatePreferences,
  restaurantSettings,
  onUpdateRestaurantSettings,
  departments,
  onAddDepartment,
  onDeleteDepartment,
}: SettingsPageProps) {
  const isManager = currentUser?.systemRole === "Manager";
  const canManageInventory = isManager || currentUser?.systemRole === "Kitchen";
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  // Departments input state
  const [newDeptInput, setNewDeptInput] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  // Profile State
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [pin, setPin] = useState(currentUser?.pin || "1234");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Restaurant & Billing State (Manager only)
  const [storeName, setStoreName] = useState(restaurantSettings.restaurantName);
  const [branchName, setBranchName] = useState(restaurantSettings.branchName);
  const [currency, setCurrency] = useState(restaurantSettings.currencySymbol);
  const [taxRate, setTaxRate] = useState(restaurantSettings.taxRate);
  const [serviceCharge, setServiceCharge] = useState(restaurantSettings.serviceCharge);
  const [receiptFooter, setReceiptFooter] = useState(restaurantSettings.receiptFooter);
  const [prepTime, setPrepTime] = useState(restaurantSettings.estimatedPrepTimeMinutes);
  const [turnTime, setTurnTime] = useState(restaurantSettings.tableTurnTimeMinutes);
  const [logoUrl, setLogoUrl] = useState(restaurantSettings.logoUrl || "");
  const [gstNumber, setGstNumber] = useState(restaurantSettings.gstNumber || "07AAAAA0000A1Z5");
  const [isCurrencyLocked, setIsCurrencyLocked] = useState(Boolean(restaurantSettings.isCurrencyLocked));
  const [unlockCurrencyConfirmed, setUnlockCurrencyConfirmed] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);

  // Inventory & Raw Materials Settings State
  const [invCategories, setInvCategories] = useState<string[]>([]);
  const [invUnits, setInvUnits] = useState<InventoryUnit[]>([]);
  const [invItems, setInvItems] = useState<InventoryItem[]>([]);
  const [loadingInvData, setLoadingInvData] = useState(false);

  // Category addition in settings
  const [newCatInput, setNewCatInput] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  // Unit addition in settings
  const [newUnitSym, setNewUnitSym] = useState("");
  const [newUnitLbl, setNewUnitLbl] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);

  // Add Product modal in settings
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addProdForm, setAddProdForm] = useState({
    name: "",
    category: "Dairy",
    currentStock: 10,
    minStockLimit: 5,
    unit: "kg",
    costPerUnit: 100,
    supplier: "",
    image: "",
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Floating Toast Notifications State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setPin(currentUser.pin || "1234");
    }
  }, [currentUser]);

  useEffect(() => {
    setStoreName(restaurantSettings.restaurantName);
    setBranchName(restaurantSettings.branchName);
    setCurrency(restaurantSettings.currencySymbol);
    setTaxRate(restaurantSettings.taxRate);
    setServiceCharge(restaurantSettings.serviceCharge);
    setReceiptFooter(restaurantSettings.receiptFooter);
    setPrepTime(restaurantSettings.estimatedPrepTimeMinutes);
    setTurnTime(restaurantSettings.tableTurnTimeMinutes);
    setLogoUrl(restaurantSettings.logoUrl || "");
    setGstNumber(restaurantSettings.gstNumber || "07AAAAA0000A1Z5");
    setIsCurrencyLocked(Boolean(restaurantSettings.isCurrencyLocked));
    setUnlockCurrencyConfirmed(false);
  }, [restaurantSettings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Validation Error", "Full name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    try {
      if (currentUser?.id) {
        await updateStaff(currentUser.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          pin: pin.trim(),
        });
      }
      onUpdateCurrentUser({
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        systemRole: currentUser?.systemRole || "Server",
      });
      showToast("success", "Profile Updated", "Your staff profile details have been saved.");
    } catch (err: unknown) {
      showToast("error", "Update Failed", err instanceof Error ? err.message : "Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      showToast("error", "Password Too Short", "New password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "Password Mismatch", "New password and confirmation do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      if (currentUser?.id) {
        await changeStaffPassword(currentUser.id, currentPassword, newPassword);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Password Updated", "Station login credentials changed successfully.");
    } catch (err: unknown) {
      showToast("error", "Security Error", err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if SVG format
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setLogoUrl(reader.result);
          showToast("info", "Logo Ready", "Vector SVG logo loaded. Click 'Save Restaurant Settings' to apply.");
        }
      };
      reader.onerror = () => {
        setLogoUploadError("Failed to read image file.");
        showToast("error", "File Error", "Failed to read the SVG file.");
      };
      reader.readAsDataURL(file);
      return;
    }

    // For raster images (JPEG, PNG, WebP), resize and optimize using canvas
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 400; // 400x400 is ideal for high-DPI logos while keeping size under 50KB
          let { width, height } = img;
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
            const compressed = canvas.toDataURL("image/webp", 0.92);
            setLogoUrl(compressed);
            showToast("info", "Logo Prepared", "Image optimized for web display. Click 'Save Restaurant Settings' to apply.");
          } else {
            setLogoUrl(ev.target?.result as string);
          }
        } catch {
          setLogoUrl(ev.target?.result as string);
        }
      };
      img.onerror = () => {
        setLogoUploadError("Could not render the chosen image file.");
        showToast("error", "Image Error", "Could not render the chosen image file.");
      };
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => {
      setLogoUploadError("Failed to read image file.");
      showToast("error", "File Error", "Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      showToast("error", "Validation Error", "Restaurant name cannot be blank.");
      return;
    }
    setSavingStore(true);
    try {
      await onUpdateRestaurantSettings({
        restaurantName: storeName.trim(),
        branchName: branchName.trim(),
        currencySymbol: currency.trim() || "₹",
        taxRate: Number(taxRate) || 0,
        serviceCharge: Number(serviceCharge) || 0,
        receiptFooter: receiptFooter.trim(),
        estimatedPrepTimeMinutes: Number(prepTime) || 20,
        tableTurnTimeMinutes: Number(turnTime) || 60,
        logoUrl: logoUrl.trim(),
        gstNumber: gstNumber.trim() || "07AAAAA0000A1Z5",
        isCurrencyLocked: isCurrencyLocked,
        unlockCurrency: unlockCurrencyConfirmed,
      });
      setUnlockCurrencyConfirmed(false);
      showToast(
        "success",
        "Settings Saved Successfully",
        `"${storeName.trim()}" identity, GST (${gstNumber.trim() || "07AAAAA0000A1Z5"}), and billing rates updated across the system!`
      );
    } catch (err: unknown) {
      showToast("error", "Save Failed", err instanceof Error ? err.message : "Failed to save restaurant settings.");
    } finally {
      setSavingStore(false);
    }
  };

  // Inventory & Stock Configuration Handlers
  const loadInventorySettingsData = useCallback(async () => {
    setLoadingInvData(true);
    try {
      const [metaRes, invRes] = await Promise.all([
        fetchInventoryMeta(),
        fetchInventory(),
      ]);
      setInvCategories(metaRes.categories || []);
      setInvUnits(metaRes.units || []);
      setInvItems(invRes.items || []);
    } catch (err: any) {
      console.error("Failed to load inventory data in settings:", err);
    } finally {
      setLoadingInvData(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "inventory") {
      loadInventorySettingsData();
    }
  }, [activeSection, loadInventorySettingsData]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    setAddingCat(true);
    try {
      const res = await createInventoryCategory(newCatInput.trim());
      setInvCategories((prev) => (prev.includes(res.name) ? prev : [...prev, res.name]));
      setNewCatInput("");
      showToast("success", "Category Added", `Category "${res.name}" added successfully.`);
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Failed to add category");
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!window.confirm(`Are you sure you want to remove the category "${catName}"?`)) return;
    try {
      await deleteInventoryCategory(catName);
      setInvCategories((prev) => prev.filter((c) => c !== catName));
      showToast("success", "Category Removed", `Category "${catName}" has been removed.`);
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Failed to delete category");
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitSym.trim()) return;
    setAddingUnit(true);
    try {
      const cleanSym = newUnitSym.trim();
      const cleanLbl = (newUnitLbl || cleanSym).trim();
      const res = await createInventoryUnit(cleanSym, cleanLbl);
      setInvUnits((prev) => [...prev.filter((u) => u.name !== cleanSym), res.unit]);
      setNewUnitSym("");
      setNewUnitLbl("");
      showToast("success", "Unit Added", `Unit "${cleanSym}" added successfully.`);
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Failed to add unit");
    } finally {
      setAddingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitName: string) => {
    if (!window.confirm(`Are you sure you want to delete unit "${unitName}"?`)) return;
    try {
      await deleteInventoryUnit(unitName);
      setInvUnits((prev) => prev.filter((u) => u.name !== unitName));
      showToast("success", "Unit Removed", `Unit "${unitName}" deleted.`);
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Failed to delete unit");
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            setAddProdForm((prev) => ({ ...prev, image: compressed }));
          } else {
            setAddProdForm((prev) => ({ ...prev, image: ev.target?.result as string }));
          }
        } catch {
          setAddProdForm((prev) => ({ ...prev, image: ev.target?.result as string }));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProductInSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProdForm.name.trim()) {
      showToast("error", "Error", "Product name is required.");
      return;
    }
    setSavingProduct(true);
    try {
      const res = await createInventoryItem({
        name: addProdForm.name.trim(),
        category: addProdForm.category || "General",
        currentStock: Number(addProdForm.currentStock) || 0,
        minStockLimit: Number(addProdForm.minStockLimit) || 0,
        unit: addProdForm.unit || "kg",
        costPerUnit: Number(addProdForm.costPerUnit) || 0,
        supplier: addProdForm.supplier.trim() || undefined,
        image: addProdForm.image || undefined,
        loggedBy: currentUser?.name || "Manager",
      });
      setInvItems((prev) => [res, ...prev]);
      setIsAddProductOpen(false);
      showToast("success", "Product Created", `"${res.name}" registered in inventory.`);
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Failed to create product");
    } finally {
      setSavingProduct(false);
    }
  };

  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <div className="space-y-6 relative">
      {/* Beautiful Floating Toast System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Heading */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#b7623d]">
          Preferences & Station Configuration
        </span>
        <h1 className="display-font mt-1 text-2xl font-bold text-[#24312e] sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-xs text-[#68736e] sm:text-sm">
          Manage your account profile, station security credentials, display layout, and restaurant operations.
        </p>
      </div>

      {/* Main Settings Layout (Desktop 2-Column: Navigation Tabs on Left, Content on Right) */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Navigation Section Cards */}
        <div className="flex flex-row gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          <button
            onClick={() => setActiveSection("profile")}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSection === "profile"
                ? "bg-[#24312e] text-white shadow-xs"
                : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f0f1ed] hover:text-[#24312e]"
            }`}
          >
            <UserRound size={16} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveSection("security")}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSection === "security"
                ? "bg-[#24312e] text-white shadow-xs"
                : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f0f1ed] hover:text-[#24312e]"
            }`}
          >
            <KeyRound size={16} />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveSection("display")}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSection === "display"
                ? "bg-[#24312e] text-white shadow-xs"
                : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f0f1ed] hover:text-[#24312e]"
            }`}
          >
            <Sliders size={16} />
            <span>Display & Table Alerts</span>
          </button>

          {isManager && (
            <button
              onClick={() => setActiveSection("restaurant")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-bold transition cursor-pointer shrink-0 ${
                activeSection === "restaurant"
                  ? "bg-[#24312e] text-white shadow-xs"
                  : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f0f1ed] hover:text-[#24312e]"
              }`}
            >
              <Building2 size={16} />
              <span>Restaurant & Billing</span>
            </button>
          )}

          {canManageInventory && (
            <button
              onClick={() => setActiveSection("inventory")}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-bold transition cursor-pointer shrink-0 ${
                activeSection === "inventory"
                  ? "bg-[#24312e] text-white shadow-xs"
                  : "border border-[#dfe1dc] bg-[#fbfaf7] text-[#68736e] hover:bg-[#f0f1ed] hover:text-[#24312e]"
              }`}
            >
              <Package size={16} />
              <span>Inventory & Stock</span>
            </button>
          )}
        </div>

        {/* Section Content Pane */}
        <div className="space-y-6">
          {/* SECTION 1: MY PROFILE */}
          {activeSection === "profile" && (
            <div className="rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e9eae6] pb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4bc83] text-lg font-bold text-[#684f37] shadow-xs">
                    {initials}
                  </div>
                  <div>
                    <h2 className="display-font text-base font-bold text-[#24312e]">
                      {name || "Station User"}
                    </h2>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#e6eee5] px-2 py-0.5 text-[11px] font-bold text-[#315a3d]">
                        <ShieldCheck size={12} />
                        {currentUser?.systemRole || "Staff"}
                      </span>
                      <span className="text-xs text-[#84908a]">
                        Department: {currentUser?.department || "Operations"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                      placeholder="e.g. Priya Shah"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                      Station Work Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                      placeholder="station@tableandthyme.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                      Quick Attendance PIN (4-digit)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                      placeholder="1234"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#e9eae6]">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 rounded-xl bg-[#24312e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    {savingProfile ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 2: SECURITY & PASSWORD */}
          {activeSection === "security" && (
            <div className="rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] p-6 shadow-xs space-y-6">
              <div className="border-b border-[#e9eae6] pb-4">
                <h2 className="display-font text-base font-bold text-[#24312e]">
                  Station Login Password
                </h2>
                <p className="mt-0.5 text-xs text-[#84908a]">
                  Update your dashboard login credentials. Must be at least 4 characters long.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                    Current Password
                  </label>
                  <div className="relative max-w-md">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password (demo123 for presets)"
                      className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 pr-10 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-[#84908a] hover:text-[#24312e]"
                    >
                      {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 4 characters"
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 pr-10 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-[#84908a] hover:text-[#24312e]"
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#e9eae6]">
                  <button
                    type="submit"
                    disabled={updatingPassword || !newPassword}
                    className="flex items-center gap-2 rounded-xl bg-[#24312e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound size={14} />
                    {updatingPassword ? "Updating..." : "Update Station Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 3: DISPLAY & TABLE ALERTS (NO SOUND) */}
          {activeSection === "display" && (
            <div className="rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] p-6 shadow-xs space-y-6">
              <div className="border-b border-[#e9eae6] pb-4">
                <h2 className="display-font text-base font-bold text-[#24312e]">
                  Display & Station Layout
                </h2>
                <p className="mt-0.5 text-xs text-[#84908a]">
                  Configure visual densities and table turnaround alert highlights.
                </p>
              </div>

              {/* Layout Density */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#24312e]">Ticket & Order Display Density</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePreferences({ ...stationPreferences, ticketDensity: "comfortable" })
                    }
                    className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                      stationPreferences.ticketDensity === "comfortable"
                        ? "border-[#24312e] bg-[#e6eee5]/50 text-[#24312e] shadow-xs"
                        : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                    }`}
                  >
                    <p className="text-xs font-bold">Comfortable (Standard)</p>
                    <p className="mt-1 text-[11px] text-[#84908a]">
                      Spacious ticket cards with visible modifiers, timestamps, and item notes.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePreferences({ ...stationPreferences, ticketDensity: "compact" })
                    }
                    className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                      stationPreferences.ticketDensity === "compact"
                        ? "border-[#24312e] bg-[#e6eee5]/50 text-[#24312e] shadow-xs"
                        : "border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed]"
                    }`}
                  >
                    <p className="text-xs font-bold">Compact (Rush Mode)</p>
                    <p className="mt-1 text-[11px] text-[#84908a]">
                      Tighter cards designed to fit maximum active tickets on screen during dinner rushes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Table Alert Notifications */}
              <div className="rounded-2xl border border-[#dfe1dc] bg-white p-4.5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-[#24312e]">
                    Table Turn Time Visual Warnings
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#84908a]">
                    Highlights occupied floor plan tables that have exceeded the standard dining limit (default 60 mins).
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdatePreferences({
                      ...stationPreferences,
                      tableAlerts: !stationPreferences.tableAlerts,
                    })
                  }
                  className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer shrink-0 ${
                    stationPreferences.tableAlerts ? "bg-[#24312e]" : "bg-[#dfe1dc]"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      stationPreferences.tableAlerts ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: RESTAURANT & BILLING (MANAGER ONLY) */}
          {activeSection === "restaurant" && isManager && (
            <div className="rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] p-6 shadow-xs space-y-6">
              <div className="border-b border-[#e9eae6] pb-4">
                <h2 className="display-font text-base font-bold text-[#24312e]">
                  Restaurant Store & Invoicing Configuration
                </h2>
                <p className="mt-0.5 text-xs text-[#84908a]">
                  Store identity, branch names, tax rates, and bill print settings.
                </p>
              </div>

              <form onSubmit={handleSaveStore} className="space-y-6">
                {/* Brand Logo Upload & Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                        <ImageIcon size={14} />
                        Website & Brand Logo
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#84908a]">
                        Upload your restaurant logo to display across the sidebar, header, staff login, and digital menu.
                      </p>
                    </div>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                        Remove Logo
                      </button>
                    )}
                  </div>

                  {logoUploadError && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{logoUploadError}</span>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-[140px_1fr] items-center rounded-2xl border border-[#dfe1dc] bg-white p-4">
                    {/* Live Preview Box */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-[#dfe1dc] bg-[#fbfaf7] text-center">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Restaurant Logo"
                          className="h-16 w-16 object-contain rounded-xl border border-[#e0e2dc] bg-white shadow-2xs"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
                          <ImageIcon size={28} />
                        </div>
                      )}
                      <span className="mt-2 text-[10px] font-semibold text-[#84908a]">
                        {logoUrl ? "Active Logo" : "Default Icon"}
                      </span>
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shadow-xs">
                          <Upload size={14} />
                          <span>Choose Logo Image</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            onChange={handleLogoFileChange}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-[#84908a]">
                          PNG, JPG, SVG, WebP (max 2.5MB)
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#68736e] mb-1">
                          Or enter logo image URL:
                        </label>
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] px-3.5 py-2 text-xs text-[#24312e] outline-hidden focus:border-[#24312e] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity & Legal Information */}
                <div className="space-y-3 pt-3 border-t border-[#e9eae6]">
                  <h3 className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                    <Building2 size={14} />
                    Branch & Tax Registration Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                        Restaurant Name
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                        placeholder="Table & Thyme"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        required
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                        placeholder="Downtown branch"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5 flex items-center justify-between">
                        <span>GST Number (GSTIN)</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          Invoices & Slips
                        </span>
                      </label>
                      <input
                        type="text"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-[#24312e] outline-hidden focus:border-[#24312e]"
                        placeholder="07AAAAA0000A1Z5"
                      />
                      <p className="mt-1 text-[10.5px] text-[#84908a]">
                        Displayed on tax receipts, billing slips & customer invoices
                      </p>
                    </div>
                  </div>
                </div>

                {/* Restaurant Departments Management */}
                <div className="space-y-3 pt-3 border-t border-[#e9eae6]">
                  <div>
                    <h3 className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                      <Building2 size={14} />
                      Restaurant Departments Directory ({departments.length})
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[#84908a]">
                      Define all official departments available for staff scheduling and dashboard station assignments.
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {departments.map((dept) => (
                      <span
                        key={dept}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#24312e] shadow-xs"
                      >
                        {dept}
                        {!["Floor", "Kitchen", "Management"].includes(dept) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await onDeleteDepartment(dept);
                                showToast("success", "Department Removed", `Removed department "${dept}".`);
                              } catch {
                                showToast("error", "Delete Failed", "Failed to delete department.");
                              }
                            }}
                            className="ml-1 text-[#84908a] hover:text-rose-600 transition cursor-pointer font-bold"
                            title={`Delete ${dept}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Add Department Input */}
                  <div className="flex items-center gap-2 max-w-md pt-2">
                    <input
                      type="text"
                      placeholder="New department name (e.g. Bakery, Cashier)..."
                      value={newDeptInput}
                      onChange={(e) => setNewDeptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!newDeptInput.trim() || savingDept) return;
                          setSavingDept(true);
                          onAddDepartment(newDeptInput.trim())
                            .then(() => {
                              const name = newDeptInput.trim();
                              setNewDeptInput("");
                              showToast("success", "Department Added", `Added department "${name}".`);
                            })
                            .catch(() => showToast("error", "Action Failed", "Failed to add department."))
                            .finally(() => setSavingDept(false));
                        }
                      }}
                      className="flex-1 rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                    />
                    <button
                      type="button"
                      disabled={savingDept || !newDeptInput.trim()}
                      onClick={async () => {
                        if (!newDeptInput.trim()) return;
                        setSavingDept(true);
                        try {
                          await onAddDepartment(newDeptInput.trim());
                          const addedName = newDeptInput.trim();
                          setNewDeptInput("");
                          showToast("success", "Department Added", `Added department "${addedName}".`);
                        } catch {
                          showToast("error", "Action Failed", "Failed to add department.");
                        } finally {
                          setSavingDept(false);
                        }
                      }}
                      className="rounded-xl bg-[#24312e] px-4 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {savingDept ? "Adding..." : "+ Add Department"}
                    </button>
                  </div>
                </div>

                {/* System Currency & Currency Lock Feature */}
                <div className="space-y-3 pt-3 border-t border-[#e9eae6]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                        {isCurrencyLocked && !unlockCurrencyConfirmed ? (
                          <Lock size={14} className="text-amber-600" />
                        ) : (
                          <Unlock size={14} className="text-emerald-600" />
                        )}
                        System-wide Currency
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#84908a]">
                        Set one standard currency for all POS terminals, orders, billing, and digital menu.
                      </p>
                    </div>

                    {isCurrencyLocked && !unlockCurrencyConfirmed ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-900">
                        <Lock size={12} />
                        Locked (Manager Editing Disabled)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-900">
                        <Unlock size={12} />
                        Editable Currency
                      </span>
                    )}
                  </div>

                  {/* Preset Currency Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { code: "INR", symbol: "₹", label: "₹ INR" },
                      { code: "USD", symbol: "$", label: "$ USD" },
                      { code: "EUR", symbol: "€", label: "€ EUR" },
                      { code: "GBP", symbol: "£", label: "£ GBP" },
                      { code: "AED", symbol: "د.إ", label: "د.إ AED" },
                      { code: "CAD", symbol: "C$", label: "C$ CAD" },
                      { code: "AUD", symbol: "A$", label: "A$ AUD" },
                      { code: "SGD", symbol: "S$", label: "S$ SGD" },
                      { code: "JPY", symbol: "¥", label: "¥ JPY" },
                    ].map((preset) => {
                      const isSelected = currency === preset.symbol;
                      return (
                        <button
                          key={preset.code}
                          type="button"
                          onClick={() => {
                            setCurrency(preset.symbol);
                            setUnlockCurrencyConfirmed(true);
                          }}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-[#24312e] text-white shadow-xs"
                              : "border border-[#dfe1dc] bg-white text-[#68736e] hover:bg-[#f0f1ed] hover:text-[#24312e]"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                        Selected Currency Symbol
                      </label>
                      <input
                        type="text"
                        value={currency}
                        onChange={(e) => {
                          setCurrency(e.target.value);
                          setUnlockCurrencyConfirmed(true);
                        }}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs font-bold text-[#24312e] outline-hidden focus:border-[#24312e]"
                        placeholder="₹"
                      />
                    </div>

                    {/* Currency Lock / Unlock controls */}
                    <div className="flex flex-col justify-end">
                      {isCurrencyLocked && !unlockCurrencyConfirmed ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                          <p className="text-[11px] text-amber-900 leading-snug">
                            This currency is locked. Need to adjust it?
                          </p>
                          <label className="mt-1.5 flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={unlockCurrencyConfirmed}
                              onChange={(e) => setUnlockCurrencyConfirmed(e.target.checked)}
                              className="rounded accent-[#24312e]"
                            />
                            <span>Unlock currency for modifications</span>
                          </label>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-[#dfe1dc] bg-[#fbfaf7] p-3">
                          <label className="flex items-start gap-2 text-xs font-bold text-[#24312e] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isCurrencyLocked}
                              onChange={(e) => setIsCurrencyLocked(e.target.checked)}
                              className="mt-0.5 rounded accent-[#24312e]"
                            />
                            <div>
                              <span>Lock currency system-wide</span>
                              <p className="font-normal text-[11px] text-[#84908a] mt-0.5">
                                Once locked, managers cannot change the currency. All orders, tables, and receipts will standardize on this currency.
                              </p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Taxes & Dynamic Charges */}
                <div className="space-y-4 pt-3 border-t border-[#e9eae6]">
                  <div>
                    <h3 className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                      <Percent size={14} />
                      Dynamic Taxes & Charges
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[#84908a]">
                      Change GST / VAT and Service Charge anytime. Rates are dynamically calculated on all billing bills and checkout invoices.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                        Tax Rate (GST / VAT %)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                        placeholder="5.0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                        Service Charge (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                        placeholder="5.0"
                      />
                    </div>
                  </div>

                  {/* Live Calculation Preview Card */}
                  <div className="rounded-2xl border border-[#dfe1dc] bg-[#eef3ee] p-4.5">
                    <div className="flex items-center gap-2 mb-2 text-[#315a3d]">
                      <Calculator size={15} />
                      <h4 className="text-xs font-bold">
                        Live Calculation Preview (Sample Bill: {currency}1,000.00)
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="rounded-xl bg-white p-2.5 border border-[#dfe1dc]">
                        <span className="text-[10px] text-[#84908a] block uppercase font-semibold">Subtotal</span>
                        <span className="font-bold text-[#24312e]">{currency}1,000.00</span>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 border border-[#dfe1dc]">
                        <span className="text-[10px] text-[#84908a] block uppercase font-semibold">
                          GST ({Number(taxRate) || 0}%)
                        </span>
                        <span className="font-bold text-emerald-700">
                          +{currency}{(1000 * ((Number(taxRate) || 0) / 100)).toFixed(2)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 border border-[#dfe1dc]">
                        <span className="text-[10px] text-[#84908a] block uppercase font-semibold">
                          Service Chg ({Number(serviceCharge) || 0}%)
                        </span>
                        <span className="font-bold text-indigo-700">
                          +{currency}{(1000 * ((Number(serviceCharge) || 0) / 100)).toFixed(2)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-[#24312e] text-white p-2.5">
                        <span className="text-[10px] text-[#aab8b0] block uppercase font-semibold">Total Payable</span>
                        <span className="font-extrabold text-[#f4bc83]">
                          {currency}
                          {(
                            1000 +
                            1000 * ((Number(taxRate) || 0) / 100) +
                            1000 * ((Number(serviceCharge) || 0) / 100)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kitchen and table limits */}
                <div className="space-y-3 pt-3 border-t border-[#e9eae6]">
                  <h3 className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                    <Clock size={14} />
                    Operational Timing Rules
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                        Default Order Prep Estimate (Minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={prepTime}
                        onChange={(e) => setPrepTime(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#24312e] mb-1.5">
                        Table Turnaround Limit (Minutes)
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="240"
                        value={turnTime}
                        onChange={(e) => setTurnTime(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt note */}
                <div className="space-y-3 pt-3 border-t border-[#e9eae6]">
                  <h3 className="text-xs font-bold text-[#24312e] flex items-center gap-1.5">
                    <Receipt size={14} />
                    Bill & Receipt Footer Message
                  </h3>
                  <textarea
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3.5 py-2.5 text-xs text-[#24312e] outline-hidden focus:border-[#24312e]"
                    placeholder="Thank you for dining with Table & Thyme!"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-[#e9eae6]">
                  <button
                    type="submit"
                    disabled={savingStore}
                    className="flex items-center gap-2 rounded-xl bg-[#24312e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    {savingStore ? "Saving..." : "Save Restaurant Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 5: INVENTORY & RAW MATERIALS CONFIGURATION */}
          {activeSection === "inventory" && (
            <div className="space-y-6">
              {/* Top Banner Card with Quick Action */}
              <div className="rounded-3xl border border-[#dfe1dc] bg-gradient-to-br from-[#fbfaf7] via-white to-[#f4f7f4] p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#24312e] text-[#f4bc83] shadow-xs shrink-0">
                      <Package size={24} />
                    </div>
                    <div>
                      <h2 className="display-font text-lg font-bold text-[#24312e]">
                        Inventory & Stock Management
                      </h2>
                      <p className="mt-0.5 text-xs text-[#68736e]">
                        Configure stock categories, units of measurement, and register new raw materials with photos and low-stock safety thresholds.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAddProdForm({
                        name: "",
                        category: invCategories[0] || "Dairy",
                        currentStock: 10,
                        minStockLimit: 5,
                        unit: invUnits[0]?.name || "kg",
                        costPerUnit: 100,
                        supplier: "",
                        image: "",
                      });
                      setIsAddProductOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-[#24312e] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus size={15} />
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Quick KPI stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#e9eae6]">
                  <div className="rounded-xl border border-[#dfe1dc] bg-white p-3">
                    <span className="text-[10px] font-bold text-[#84908a] uppercase tracking-wider block">
                      Total Stock Products
                    </span>
                    <span className="text-lg font-black text-[#24312e]">{invItems.length}</span>
                  </div>
                  <div className="rounded-xl border border-[#dfe1dc] bg-white p-3">
                    <span className="text-[10px] font-bold text-[#84908a] uppercase tracking-wider block">
                      Configured Categories
                    </span>
                    <span className="text-lg font-black text-[#24312e]">{invCategories.length}</span>
                  </div>
                  <div className="rounded-xl border border-[#dfe1dc] bg-white p-3 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-[#84908a] uppercase tracking-wider block">
                      Measurement Units
                    </span>
                    <span className="text-lg font-black text-[#24312e]">{invUnits.length}</span>
                  </div>
                </div>
              </div>

              {/* CARD 1: INVENTORY CATEGORIES MANAGEMENT */}
              <div className="rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e9eae6] pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#24312e] flex items-center gap-2">
                      <Layers size={16} className="text-[#315a3d]" />
                      Stock Categories
                    </h3>
                    <p className="text-xs text-[#84908a] mt-0.5">
                      Define ingredient groupings like Dairy, Produce, Meat, Dry Grocery, Packaging.
                    </p>
                  </div>

                  {/* Inline Add Category Form */}
                  <form onSubmit={handleAddCategory} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Category name (e.g. Frozen Foods)"
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs text-[#24312e] outline-none focus:border-[#24312e] w-52 sm:w-60"
                    />
                    <button
                      type="submit"
                      disabled={addingCat || !newCatInput.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-[#24312e] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={13} />
                      <span>{addingCat ? "Adding..." : "Add"}</span>
                    </button>
                  </form>
                </div>

                {/* Categories Badge List */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {loadingInvData ? (
                    <span className="text-xs text-[#84908a]">Loading categories...</span>
                  ) : invCategories.length === 0 ? (
                    <span className="text-xs text-[#84908a]">No categories registered yet.</span>
                  ) : (
                    invCategories.map((cat) => {
                      const itemCount = invItems.filter((i) => i.category === cat).length;
                      return (
                        <div
                          key={cat}
                          className="flex items-center gap-2 rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 shadow-2xs group hover:border-[#24312e]/40 transition"
                        >
                          <span className="text-xs font-bold text-[#24312e]">{cat}</span>
                          <span className="rounded-md bg-[#f0f2ed] px-1.5 py-0.5 text-[10px] font-bold text-[#68736e]">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="text-[#b0b8b3] hover:text-red-600 transition cursor-pointer ml-0.5"
                            title={`Delete ${cat}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CARD 2: UNITS OF MEASUREMENT MANAGEMENT */}
              <div className="rounded-3xl border border-[#dfe1dc] bg-[#fbfaf7] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e9eae6] pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#24312e] flex items-center gap-2">
                      <Scale size={16} className="text-[#315a3d]" />
                      Units of Measurement
                    </h3>
                    <p className="text-xs text-[#84908a] mt-0.5">
                      Configure measurement metrics (kg, liters, pcs, boxes, crates, etc.).
                    </p>
                  </div>

                  {/* Inline Add Unit Form */}
                  <form onSubmit={handleAddUnit} className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Symbol (e.g. tray)"
                      value={newUnitSym}
                      onChange={(e) => setNewUnitSym(e.target.value)}
                      className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs text-[#24312e] outline-none focus:border-[#24312e] w-28"
                    />
                    <input
                      type="text"
                      placeholder="Display label (e.g. Tray)"
                      value={newUnitLbl}
                      onChange={(e) => setNewUnitLbl(e.target.value)}
                      className="rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs text-[#24312e] outline-none focus:border-[#24312e] w-36 sm:w-44"
                    />
                    <button
                      type="submit"
                      disabled={addingUnit || !newUnitSym.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-[#24312e] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#315a3d] transition cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={13} />
                      <span>{addingUnit ? "Adding..." : "Add Unit"}</span>
                    </button>
                  </form>
                </div>

                {/* Units Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                  {loadingInvData ? (
                    <span className="text-xs text-[#84908a]">Loading units...</span>
                  ) : invUnits.length === 0 ? (
                    <span className="text-xs text-[#84908a]">No units configured yet.</span>
                  ) : (
                    invUnits.map((u) => (
                      <div
                        key={u.name}
                        className="flex items-center justify-between rounded-xl border border-[#dfe1dc] bg-white p-2.5 shadow-2xs hover:border-[#24312e]/40 transition"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#24312e]">{u.name}</span>
                          </div>
                          <p className="text-[11px] text-[#84908a] truncate max-w-[120px]">
                            {u.label || u.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(u.name)}
                          className="text-[#b0b8b3] hover:text-red-600 transition cursor-pointer p-1 rounded-md hover:bg-red-50"
                          title={`Delete unit ${u.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CARD 3: STOCK CATALOG OVERVIEW TABLE */}
              <div className="rounded-3xl border border-[#dfe1dc] bg-white shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#e9eae6] bg-[#fbfaf7] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#24312e]">Registered Stock Items</h3>
                    <p className="text-xs text-[#84908a] mt-0.5">
                      Visual catalog showing product photo, category, and threshold limit.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddProdForm({
                        name: "",
                        category: invCategories[0] || "Dairy",
                        currentStock: 10,
                        minStockLimit: 5,
                        unit: invUnits[0]?.name || "kg",
                        costPerUnit: 100,
                        supplier: "",
                        image: "",
                      });
                      setIsAddProductOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-[#dfe1dc] bg-white px-3 py-1.5 text-xs font-bold text-[#24312e] hover:bg-[#f0f2ed] transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#e9eae6] bg-[#fbfaf7]/60 text-[10px] font-bold uppercase tracking-wider text-[#84908a]">
                      <tr>
                        <th className="px-4 py-3">Item & Image</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Current Stock</th>
                        <th className="px-4 py-3">Safety Limit</th>
                        <th className="px-4 py-3 text-right">Cost / Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1ed]">
                      {invItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#84908a]">
                            No inventory items found. Click "Add New Product" to create one.
                          </td>
                        </tr>
                      ) : (
                        invItems.slice(0, 8).map((item) => (
                          <tr key={item.id} className="hover:bg-[#fbfaf7]">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-lg bg-[#f0f2ed] overflow-hidden shrink-0 border border-[#dfe1dc] flex items-center justify-center">
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
                                    <Package size={16} className="text-[#84908a]" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-[#24312e]">{item.name}</span>
                                  {item.supplier && (
                                    <span className="block text-[10px] text-[#84908a]">
                                      {item.supplier}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-[#55605b] font-medium">
                              <span className="rounded bg-[#f0f2ed] px-1.5 py-0.5 text-[10px] font-bold">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-[#24312e]">
                              {item.currentStock} {item.unit}
                            </td>
                            <td className="px-4 py-2.5 text-[#68736e]">
                              {item.minStockLimit} {item.unit}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-[#24312e]">
                              {restaurantSettings.currencySymbol}{item.costPerUnit} / {item.unit}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD PRODUCT MODAL IN SETTINGS */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#24312e]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#dfe1dc] shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e9eae6] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#24312e]">Add Raw Material</h3>
                  <p className="text-xs text-[#84908a]">Register a new product with image, category & unit</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ed]"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateProductInSettings} className="mt-4 space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-[#68736e] block mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Malai Paneer"
                  value={addProdForm.name}
                  onChange={(e) => setAddProdForm({ ...addProdForm, name: e.target.value })}
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
                  {addProdForm.image && (
                    <button
                      type="button"
                      onClick={() => setAddProdForm({ ...addProdForm, image: "" })}
                      className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Preview if image selected */}
                {addProdForm.image ? (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#dfe1dc] bg-white">
                    <img
                      src={addProdForm.image}
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
                      id="settings-inv-upload"
                      className="hidden"
                      onChange={handleProductImageUpload}
                    />
                    <label
                      htmlFor="settings-inv-upload"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#84908a] bg-white py-2 text-xs font-bold text-[#24312e] hover:bg-[#f0f2ed] transition cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Upload from Device</span>
                    </label>
                  </div>
                )}

                {/* URL Input */}
                <div>
                  <input
                    type="url"
                    placeholder="Or paste an Image URL (https://...)"
                    value={addProdForm.image}
                    onChange={(e) => setAddProdForm({ ...addProdForm, image: e.target.value })}
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
                        onClick={() => setAddProdForm({ ...addProdForm, image: preset.url })}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                          addProdForm.image === preset.url
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

              {/* Category & Unit of Measure Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Category</label>
                  <select
                    value={addProdForm.category}
                    onChange={(e) => setAddProdForm({ ...addProdForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  >
                    {invCategories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Unit of Measure */}
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Unit of Measure</label>
                  <select
                    value={addProdForm.unit}
                    onChange={(e) => setAddProdForm({ ...addProdForm, unit: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  >
                    {invUnits.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.label || u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opening Stock & Low Stock Limit */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Opening Stock ({addProdForm.unit})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addProdForm.currentStock}
                    onChange={(e) => setAddProdForm({ ...addProdForm, currentStock: parseFloat(e.target.value) || 0 })}
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
                    value={addProdForm.minStockLimit}
                    onChange={(e) => setAddProdForm({ ...addProdForm, minStockLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                  <p className="text-[10px] text-[#84908a] mt-0.5">Threshold for warning alert</p>
                </div>
              </div>

              {/* Cost & Supplier */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">
                    Cost per Unit ({restaurantSettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addProdForm.costPerUnit}
                    onChange={(e) => setAddProdForm({ ...addProdForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#68736e] block mb-1">Vendor / Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Dairy Farms"
                    value={addProdForm.supplier}
                    onChange={(e) => setAddProdForm({ ...addProdForm, supplier: e.target.value })}
                    className="w-full rounded-xl border border-[#dfe1dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#24312e]"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#e9eae6] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="rounded-xl border border-[#dfe1dc] px-4 py-2 text-xs font-bold text-[#68736e] hover:bg-[#f0f1ed]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-xl bg-[#24312e] px-5 py-2 text-xs font-bold text-white hover:bg-[#315a3d] transition disabled:opacity-50"
                >
                  {savingProduct ? "Saving..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
