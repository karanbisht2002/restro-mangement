export type Page =
  | "Overview"
  | "Reservations"
  | "Floor plan"
  | "Orders"
  | "Kitchen"
  | "Menu"
  | "Inventory"
  | "Billing"
  | "Transactions"
  | "Employees"
  | "Dashboard access"
  | "Team"
  | "Settings";

export type StaffRole = "Manager" | "Server" | "Kitchen";
export type OrderStatus =
  | "Queued"
  | "Preparing"
  | "Ready"
  | "Notified"
  | "Served"
  | "Paid"
  | "Cancelled";

export type Order = {
  id: string;
  customer: string;
  table: string;
  items: string;
  itemList: string[];
  total: string;
  status: OrderStatus;
  serverName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TransactionRecord = {
  id: string;
  invoiceNo: string;
  sessionTitle: string;
  customer: string;
  servant: string;
  amount: number;
  paymentMode: string;
  status: "Success" | "Failed";
  failureReason?: string;
  items: any[];
  taxAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  depositCredit: number;
  createdAt: string;
};

