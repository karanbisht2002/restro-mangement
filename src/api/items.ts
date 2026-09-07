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
