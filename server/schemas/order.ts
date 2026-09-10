export const orderStatuses = [
  "Queued",
  "Preparing",
  "Ready",
  "Notified",
  "Served",
  "Paid",
  "Cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderTypes = ["Dine in", "Takeaway"] as const;
export type OrderType = (typeof orderTypes)[number];

export type Order = {
  id: string;
  customer: string;
  table: string;
  items: string;
  itemList: string[];
  total: number;
  status: OrderStatus;
  serverName?: string;
  orderType?: OrderType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderInput = {
  customer: string;
  table: string;
  itemList: string[];
  total: number;
  serverName?: string;
  orderType?: OrderType;
  notes?: string;
};

export function validateOrderInput(body: unknown): {
  value?: OrderInput;
  errors: string[];
} {
  if (!body || typeof body !== "object") {
    return { errors: ["Request body must be a JSON object."] };
  }

  const input = body as Partial<OrderInput>;
  const errors: string[] = [];
  if (typeof input.customer !== "string" || !input.customer.trim())
    errors.push("customer is required.");
  if (typeof input.table !== "string" || !input.table.trim())
    errors.push("table is required.");
  if (
    !Array.isArray(input.itemList) ||
    input.itemList.length === 0 ||
    input.itemList.some((item) => typeof item !== "string" || !item.trim())
  )
    errors.push("itemList must contain at least one item.");
  if (
    typeof input.total !== "number" ||
    !Number.isFinite(input.total) ||
    input.total < 0
  )
    errors.push("total must be a non-negative number.");
  if (
    input.orderType !== undefined &&
    !orderTypes.includes(input.orderType as OrderType)
  ) {
    errors.push(`orderType must be one of: ${orderTypes.join(", ")}.`);
  }

  if (errors.length > 0) return { errors };

  return {
    errors: [],
    value: {
      customer: input.customer!.trim(),
      table: input.table!.trim(),
      itemList: input.itemList!.map((item) => item.trim()),
      total: Number(input.total!.toFixed(2)),
      serverName: typeof input.serverName === "string" ? input.serverName.trim() : undefined,
      orderType: input.orderType ?? (input.table!.toLowerCase().includes("takeaway") ? "Takeaway" : "Dine in"),
      notes: typeof input.notes === "string" ? input.notes.trim() : "",
    },
  };
}
