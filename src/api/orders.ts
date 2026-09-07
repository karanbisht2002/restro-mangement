import type { Order, OrderStatus } from "../types";

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

export async function createOrder(input: {
  customer: string;
  table: string;
  itemList: string[];
  total: number;
}): Promise<Order> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Unable to create order.");
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const response = await fetch(`/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Unable to update order status.");
  const result = (await response.json()) as { data: ApiOrder };
  return normalizeOrder(result.data);
}
