export type TableStatus =
  | "Available"
  | "Occupied"
  | "Booked"
  | "Arrived"
  | "Needs cleaning";

export type RestaurantTable = {
  id: string;
  seats: number;
  zone: string;
  status: TableStatus;
  serverName: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchTables(): Promise<RestaurantTable[]> {
  const response = await fetch("/api/tables");
  if (!response.ok) throw new Error("Unable to load tables.");
  const result = (await response.json()) as { data: RestaurantTable[] };
  return result.data;
}

export async function updateTableStatus(
  id: string,
  status: TableStatus,
): Promise<RestaurantTable> {
  const response = await fetch(`/api/tables/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Unable to update table status.");
  const result = (await response.json()) as { data: RestaurantTable };
  return result.data;
}

export async function createTable(input: {
  id: string;
  seats: number;
  zone: string;
  status?: TableStatus;
  serverName?: string;
}): Promise<RestaurantTable> {
  const response = await fetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Unable to create table.");
  }
  const result = (await response.json()) as { data: RestaurantTable };
  return result.data;
}

export async function deleteTable(id: string): Promise<{ message: string; id: string }> {
  const response = await fetch(`/api/tables/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Unable to delete table.");
  }
  return response.json();
}

