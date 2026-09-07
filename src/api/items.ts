export type MenuItem = {
  id: string;
  name: string;
  price: number;
  type: "veg" | "non-veg";
  image: string;
  description: string;
  category: string;
  available: boolean;
  preparationTimeMinutes: number;
  allergens: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const response = await fetch("/api/items");
  if (!response.ok) throw new Error("Unable to load menu items.");
  const result = (await response.json()) as { data: MenuItem[] };
  return result.data;
}

export async function createMenuItem(
  input: Omit<MenuItem, "id" | "createdAt" | "updatedAt">,
): Promise<MenuItem> {
  const response = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as {
    data?: MenuItem;
    details?: string[];
    error?: string;
  };
  if (!response.ok || !result.data)
    throw new Error(
      result.details?.join(" ") ??
        result.error ??
        "Unable to create menu item.",
    );
  return result.data;
}

export async function updateMenuItem(
  id: string,
  input: Partial<Omit<MenuItem, "id" | "createdAt" | "updatedAt">>,
): Promise<MenuItem> {
  const response = await fetch(`/api/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = (await response.json()) as {
    data?: MenuItem;
    details?: string[];
    error?: string;
  };
  if (!response.ok || !result.data)
    throw new Error(
      result.details?.join(" ") ??
        result.error ??
        "Unable to update menu item.",
    );
  return result.data;
}

export async function updateMenuItemAvailability(
  id: string,
  available: boolean,
): Promise<MenuItem> {
  const response = await fetch(
    `/api/items/${encodeURIComponent(id)}/availability`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available }),
    },
  );
  const result = (await response.json()) as {
    data?: MenuItem;
    error?: string;
  };
  if (!response.ok || !result.data) {
    throw new Error(result?.error ?? "Unable to update item availability.");
  }
  return result.data;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const response = await fetch(`/api/items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? "Unable to delete menu item.");
  }
}

