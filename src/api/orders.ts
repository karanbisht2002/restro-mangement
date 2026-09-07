import type { Order, OrderStatus, StaffRole } from "../types";

type ApiOrder = Omit<Order, "total"> & { total: number | string };

function normalizeOrder(order: ApiOrder): Order {
  return {
    ...order,
    total:
      typeof order.total === "number"
        ? `₹${order.total.toLocaleString("en-IN")}`
        : order.total,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error("Unable to load orders.");
  const result = (await response.json()) as { data: ApiOrder[] };
  return result.data.map(normalizeOrder);
}

export async function createOrder(
  input: {
    customer: string;
    table: string;
    itemList: string[];
    total: number;
    orderType?: "Dine in" | "Takeaway";
    notes?: string;
  },
  role?: StaffRole,
): Promise<Order> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(role ? { "x-staff-role": role } : {}),
    },
    body: JSON.stringify({ ...input, role }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.error || "Unable to create order.");
  }
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}

export async function cancelOrder(id: string): Promise<void> {
  const cleanId = encodeURIComponent(id.trim());
  const response = await fetch(`/api/orders/${cleanId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Unable to cancel order.");
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  role?: StaffRole,
): Promise<Order> {
  const cleanId = encodeURIComponent(id.trim());
  const response = await fetch(`/api/orders/${cleanId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(role ? { "x-staff-role": role } : {}),
    },
    body: JSON.stringify({ status, role }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(
      errJson?.error || `Unable to update order status (${response.status}).`,
    );
  }
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}

/**
 * Kitchen-only action: mark order as Preparing
 */
export async function markOrderPreparing(
  id: string,
  role: StaffRole = "Kitchen",
): Promise<Order> {
  const cleanId = encodeURIComponent(id.trim());
  const response = await fetch(`/api/orders/${cleanId}/prepare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-staff-role": role,
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(
      errJson?.error || `Unable to mark order preparing (${response.status}).`,
    );
  }
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}

/**
 * Kitchen-only action: mark order as Ready
 */
export async function markOrderReady(
  id: string,
  role: StaffRole = "Kitchen",
): Promise<Order> {
  const cleanId = encodeURIComponent(id.trim());
  const response = await fetch(`/api/orders/${cleanId}/ready`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-staff-role": role,
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(
      errJson?.error || `Unable to mark order ready (${response.status}).`,
    );
  }
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}

/**
 * Kitchen-only action: notify servant that food is ready for pickup
 */
export async function notifyServant(
  id: string,
  role: StaffRole = "Kitchen",
): Promise<Order> {
  const cleanId = encodeURIComponent(id.trim());
  const response = await fetch(`/api/orders/${cleanId}/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-staff-role": role,
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(
      errJson?.error || `Unable to notify servant (${response.status}).`,
    );
  }
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}

/**
 * Servant or Manager only action: mark order as Served
 */
export async function markOrderServed(
  id: string,
  role: StaffRole = "Server",
): Promise<Order> {
  const cleanId = encodeURIComponent(id.trim());
  const response = await fetch(`/api/orders/${cleanId}/serve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-staff-role": role,
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(
      errJson?.error || `Unable to mark order served (${response.status}).`,
    );
  }
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}

