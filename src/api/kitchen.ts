export interface KitchenStatus {
  closed: boolean;
  closedAt: string | null;
  reason: string;
}

export async function getKitchenStatus(): Promise<KitchenStatus> {
  const response = await fetch("/api/kitchen/status");
  if (!response.ok) {
    throw new Error(`Failed to fetch kitchen status: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data;
}

export async function toggleKitchenStatus(closed?: boolean, reason?: string): Promise<KitchenStatus> {
  const response = await fetch("/api/kitchen/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      typeof closed === "boolean" ? { closed, reason } : { reason },
    ),
  });
  if (!response.ok) {
    throw new Error(`Failed to update kitchen status: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data;
}
