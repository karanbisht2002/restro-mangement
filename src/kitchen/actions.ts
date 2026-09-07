import type { OrderStatus } from "../types";

export const kitchenStations = [
  "All stations",
  "Grill",
  "Main course",
  "Bar",
] as const;

export type KitchenStation = (typeof kitchenStations)[number];

export type KitchenTicketDetail = {
  station: Exclude<KitchenStation, "All stations">;
  item: string;
  count: string;
  notes: string;
  age: string;
};

export const kitchenTicketDetails: Record<string, KitchenTicketDetail> = {
  "#1048": {
    station: "Grill",
    item: "Citrus butter chicken",
    count: "2 portions",
    notes: "No onions · extra sauce",
    age: "4 min",
  },
  "#1047": {
    station: "Main course",
    item: "Paneer tikka + bao",
    count: "4 items",
    notes: "One dish dairy-free",
    age: "8 min",
  },
  "#1045": {
    station: "Bar",
    item: "Citrus spritz + water",
    count: "3 items",
    notes: "Serve drinks first",
    age: "2 min",
  },
};

export const getNextKitchenStatus = (status: OrderStatus): OrderStatus => {
  if (status === "Queued") return "Preparing";
  if (status === "Preparing") return "Ready";
  return status;
};

export const notifyServer = (status: OrderStatus): OrderStatus =>
  status === "Ready" ? "Notified" : status;

export const toggleSoldOutItem = (items: string[], item: string) =>
  items.includes(item)
    ? items.filter((current) => current !== item)
    : [...items, item];
