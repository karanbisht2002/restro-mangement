export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLimit: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  image?: string;
  lastRestockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMetrics {
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayUsageCount: number;
  weeklyWastageValue: number;
}

export interface InventoryUnit {
  name: string;
  label: string;
}

export interface InventoryMeta {
  categories: string[];
  units: InventoryUnit[];
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  type: "RESTOCK" | "USAGE" | "WASTAGE" | "ADJUSTMENT" | "INITIAL";
  quantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  cost: number;
  notes: string | null;
  loggedBy: string;
  createdAt: string;
}

export interface InventoryResponse {
  items: InventoryItem[];
  metrics: InventoryMetrics;
  categories: string[];
  units?: InventoryUnit[];
}

export interface CreateInventoryItemPayload {
  name: string;
  category: string;
  currentStock: number;
  minStockLimit: number;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  image?: string;
  loggedBy?: string;
}

export interface RestockPayload {
  quantity: number;
  costPerUnit?: number;
  supplier?: string;
  notes?: string;
  loggedBy?: string;
}

export interface DailyLogPayload {
  usage: number;
  waste?: number;
  notes?: string;
  loggedBy?: string;
}

const API_BASE = "/api/inventory";

export async function fetchInventory(): Promise<InventoryResponse> {
  const res = await fetch(API_BASE);
  if (!res.ok) {
    throw new Error(`Failed to fetch inventory (${res.status})`);
  }
  return res.json();
}

export async function createInventoryItem(
  payload: CreateInventoryItemPayload
): Promise<InventoryItem> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to add product (${res.status})`);
  }
  const data = await res.json();
  return data.item;
}

export async function updateInventoryItem(
  id: string,
  payload: Partial<CreateInventoryItemPayload>
): Promise<InventoryItem> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update product (${res.status})`);
  }
  const data = await res.json();
  return data.item;
}

export async function restockInventoryItem(
  id: string,
  payload: RestockPayload
): Promise<{ item: InventoryItem; newStock: number }> {
  const res = await fetch(`${API_BASE}/${id}/restock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to restock item (${res.status})`);
  }
  return res.json();
}

export async function logDailyUsage(
  id: string,
  payload: DailyLogPayload
): Promise<{
  item: InventoryItem;
  deducted: number;
  usage: number;
  waste: number;
  newStock: number;
}> {
  const res = await fetch(`${API_BASE}/${id}/daily-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to log daily usage (${res.status})`);
  }
  return res.json();
}

export async function fetchInventoryLogs(itemId?: string): Promise<InventoryLog[]> {
  const url = itemId ? `${API_BASE}/logs?itemId=${encodeURIComponent(itemId)}` : `${API_BASE}/logs`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch inventory logs (${res.status})`);
  }
  const data = await res.json();
  return data.logs || [];
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete item (${res.status})`);
  }
  return true;
}

export async function fetchInventoryMeta(): Promise<InventoryMeta> {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) {
    throw new Error(`Failed to fetch inventory metadata (${res.status})`);
  }
  return res.json();
}

export async function createInventoryCategory(name: string): Promise<{ success: boolean; name: string }> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to add category (${res.status})`);
  }
  return res.json();
}

export async function deleteInventoryCategory(name: string): Promise<{ success: boolean; name: string }> {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete category (${res.status})`);
  }
  return res.json();
}

export async function createInventoryUnit(
  name: string,
  label?: string
): Promise<{ success: boolean; unit: InventoryUnit }> {
  const res = await fetch(`${API_BASE}/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, label }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to add unit of measurement (${res.status})`);
  }
  return res.json();
}

export async function deleteInventoryUnit(name: string): Promise<{ success: boolean; name: string }> {
  const res = await fetch(`${API_BASE}/units/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete unit (${res.status})`);
  }
  return res.json();
}

