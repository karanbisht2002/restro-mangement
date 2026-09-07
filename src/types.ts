export type Page =
  | "Overview"
  | "Reservations"
  | "Floor plan"
  | "Orders"
  | "Kitchen"
  | "Menu"
  | "Inventory"
  | "Billing"
  | "Team";

export type StaffRole = "Manager" | "Server" | "Kitchen";
export type OrderStatus =
  | "Queued"
  | "Preparing"
  | "Ready"
  | "Notified"
  | "Served";

export type Order = {
  id: string;
  customer: string;
  table: string;
  items: string;
  itemList: string[];
  total: string;
  status: OrderStatus;
};
