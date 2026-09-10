export interface NotificationItem {
  id: string;
  targetRole: "Manager" | "Kitchen" | "Server" | "All";
  category: "customer" | "employee" | "station";
  type: string;
  title: string;
  summary: string;
  details?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface FetchNotificationsParams {
  role?: string;
  category?: "all" | "customer" | "employee" | "station";
  limit?: number;
}

export interface NotificationsResponse {
  data: NotificationItem[];
  unreadCount: number;
  count: number;
}

const API_BASE = "/api/notifications";

export async function fetchNotifications(
  params: FetchNotificationsParams = {}
): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params.role) searchParams.set("role", params.role);
  if (params.category && params.category !== "all") searchParams.set("category", params.category);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }
  return response.json();
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${id}/read`, {
      method: "PATCH",
    });
    return response.ok;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

export async function markAllNotificationsRead(role?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/read-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

export async function broadcastNotice(params: {
  targetRole: "Kitchen" | "Server" | "All";
  title: string;
  message: string;
  priority?: "Normal" | "Urgent";
  sentBy?: string;
}): Promise<{ success: boolean; notification?: NotificationItem; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to broadcast notification." };
    }
    return { success: true, notification: data.notification };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
