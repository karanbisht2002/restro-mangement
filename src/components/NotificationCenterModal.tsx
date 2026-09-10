import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  X,
  ChevronRight,
  Clock,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  CalendarCheck,
  Users,
  Sparkles,
  Megaphone,
  Package,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "../api/notifications";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "Manager" | "Kitchen" | "Server";
  onNavigate?: (page: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  role,
  onNavigate,
  onUnreadCountChange,
}: NotificationCenterModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "customer" | "employee">("all");
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchNotifications({
        role,
        limit: 80,
      });
      setNotifications(res.data);
      onUnreadCountChange?.(res.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, role]);

  // Periodic background check for live unread counter (every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications({ role, limit: 1 })
        .then((res) => onUnreadCountChange?.(res.unreadCount))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [role]);

  // Filtering by category for Manager
  const filteredNotifications = useMemo(() => {
    if (role !== "Manager") return notifications;
    if (activeTab === "customer") {
      return notifications.filter((n) => n.category === "customer");
    }
    if (activeTab === "employee") {
      return notifications.filter((n) => n.category === "employee");
    }
    return notifications;
  }, [notifications, role, activeTab]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      await markNotificationRead(item.id);
      // update unread count
      const remainingUnread = notifications.filter(
        (n) => !n.isRead && n.id !== item.id
      ).length;
      onUnreadCountChange?.(remainingUnread);
    }
    setSelectedNotif(item);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onUnreadCountChange?.(0);
    await markAllNotificationsRead(role);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 60) return "just now";
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  const getNotifIcon = (type: string, category: string) => {
    switch (type) {
      case "table_booked":
        return <CalendarCheck className="text-[#3b724c]" size={16} />;
      case "website_order":
      case "new_order":
        return <ShoppingBag className="text-[#b7623d]" size={16} />;
      case "order_ready":
        return <Sparkles className="text-[#e28442]" size={16} />;
      case "order_served":
        return <CheckCircle2 className="text-[#3b724c]" size={16} />;
      case "manager_broadcast":
        return <Megaphone className="text-[#d97706]" size={16} />;
      case "table_needs_cleaning":
        return <Sparkles className="text-[#b45309]" size={16} />;
      case "employee_clock_in":
      case "employee_clock_out":
      case "employee_break_start":
      case "employee_break_end":
      case "employee_leave_request":
        return <Users className="text-[#6366f1]" size={16} />;
      case "inventory_out_of_stock":
        return <AlertCircle className="text-red-500" size={16} />;
      case "inventory_low_stock":
        return <AlertTriangle className="text-amber-500" size={16} />;
      case "inventory_restocked":
      case "inventory_usage_logged":
        return <Package className="text-[#0d9488]" size={16} />;
      default:
        return category === "customer" ? (
          <Users className="text-[#3b724c]" size={16} />
        ) : (
          <Bell className="text-[#68736e]" size={16} />
        );
    }
  };

  const getCategoryBadge = (item: NotificationItem) => {
    if (item.type === "manager_broadcast") {
      return (
        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
          Announcement
        </span>
      );
    }
    if (item.category === "customer") {
      return (
        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
          Customer
        </span>
      );
    }
    if (item.category === "employee") {
      return (
        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
          Employee
        </span>
      );
    }
    return (
      <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600 border border-stone-200">
        Station
      </span>
    );
  };

  const handleActionNavigation = (item: NotificationItem) => {
    if (!onNavigate) return;
    if (item.type === "table_booked") onNavigate("Reservations");
    else if (item.type === "website_order" || item.type === "new_order") onNavigate("Orders");
    else if (item.type === "order_ready" || item.type === "order_served") {
      onNavigate(role === "Kitchen" ? "Kitchen" : "Orders");
    } else if (item.type === "table_needs_cleaning") onNavigate("Floor plan");
    else if (item.type.startsWith("employee_")) onNavigate("Employees");
    else if (item.type.startsWith("inventory_")) onNavigate("Inventory");
    onClose();
    setSelectedNotif(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Notification Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24312e] text-[#f4bc83]">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="display-font text-lg font-bold text-[#24312e]">
                  Notifications
                </h3>
                <p className="text-xs text-[#84908a]">
                  {role} Panel Feed • {notifications.filter((n) => !n.isRead).length} unread
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#57645f] hover:bg-[#f0f2ee] transition"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">Mark read</span>
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[#84908a] hover:bg-[#f0f2ee] hover:text-[#24312e] transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Category Tabs for Manager */}
          {role === "Manager" && (
            <div className="mt-3 flex rounded-xl bg-[#f0f2ee] p-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 rounded-lg py-1.5 text-center transition ${
                  activeTab === "all"
                    ? "bg-white text-[#24312e] shadow-xs"
                    : "text-[#68736e] hover:text-[#24312e]"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("customer")}
                className={`flex-1 rounded-lg py-1.5 text-center transition ${
                  activeTab === "customer"
                    ? "bg-white text-[#24312e] shadow-xs"
                    : "text-[#68736e] hover:text-[#24312e]"
                }`}
              >
                Customer ({notifications.filter((n) => n.category === "customer").length})
              </button>
              <button
                onClick={() => setActiveTab("employee")}
                className={`flex-1 rounded-lg py-1.5 text-center transition ${
                  activeTab === "employee"
                    ? "bg-white text-[#24312e] shadow-xs"
                    : "text-[#68736e] hover:text-[#24312e]"
                }`}
              >
                Employee ({notifications.filter((n) => n.category === "employee").length})
              </button>
            </div>
          )}
        </div>

        {/* Listing of concise notifications */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2ee]">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-xs text-[#84908a]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#24312e] border-t-transparent" />
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center text-[#84908a]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f6f3] text-[#aab8b0]">
                <Bell size={22} />
              </div>
              <p className="text-sm font-bold text-[#24312e]">No notifications yet</p>
              <p className="text-xs text-[#84908a] max-w-xs">
                {activeTab === "customer"
                  ? "Customer bookings and website orders will show here."
                  : activeTab === "employee"
                  ? "Staff shifts, leaves, table cleaning, and inventory alerts will show here."
                  : "Important updates for your role will appear here automatically."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item)}
                className={`group flex items-start gap-3 p-4 transition cursor-pointer ${
                  item.isRead
                    ? "bg-white hover:bg-[#faf9f6]"
                    : "bg-[#fbfaf5] hover:bg-[#f6f4ec]"
                }`}
              >
                {/* Status Dot / Icon */}
                <div className="relative mt-0.5 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f2ee]">
                    {getNotifIcon(item.type, item.category)}
                  </div>
                  {!item.isRead && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#b7623d] ring-2 ring-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <h4
                        className={`text-xs truncate ${
                          item.isRead ? "font-semibold text-[#24312e]" : "font-bold text-[#1a2522]"
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#84908a]">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-[#57645f] line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getCategoryBadge(item)}
                      {item.details?.priority === "Urgent" && (
                        <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#b7623d] group-hover:translate-x-0.5 transition-transform">
                      Details <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal View */}
      {selectedNotif && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#dfe1dc] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 text-[#24312e]">
            <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f2ee]">
                  {getNotifIcon(selectedNotif.type, selectedNotif.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(selectedNotif)}
                    <span className="text-[11px] text-[#84908a]">
                      {formatTimeAgo(selectedNotif.createdAt)}
                    </span>
                  </div>
                  <h3 className="display-font mt-1 text-base font-bold text-[#24312e]">
                    {selectedNotif.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="rounded-lg p-1.5 text-[#84908a] hover:bg-[#f0f2ee] hover:text-[#24312e] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification Body */}
            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-[#fbfaf7] border border-[#e5e7eb] p-3.5 leading-relaxed text-[#41504a]">
                {selectedNotif.summary}
              </div>

              {/* Extended Details / Metadata */}
              {selectedNotif.details && Object.keys(selectedNotif.details).length > 0 && (
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 divide-y divide-[#f0f2ee]">
                  <div className="pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#84908a]">
                      Event Details
                    </p>
                  </div>
                  <div className="pt-2 space-y-1.5">
                    {selectedNotif.details.customer && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Customer:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.customer}</span>
                      </div>
                    )}
                    {selectedNotif.details.phone && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Phone:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.phone}</span>
                      </div>
                    )}
                    {selectedNotif.details.table && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Table:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.table}</span>
                      </div>
                    )}
                    {selectedNotif.details.guests !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Party Size:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.guests} guests</span>
                      </div>
                    )}
                    {selectedNotif.details.date && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Date & Time:</span>
                        <span className="font-semibold text-[#24312e]">
                          {selectedNotif.details.date} at {selectedNotif.details.time || ""}
                        </span>
                      </div>
                    )}
                    {selectedNotif.details.total !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Total Amount:</span>
                        <span className="font-bold text-[#3b724c]">₹{selectedNotif.details.total}</span>
                      </div>
                    )}
                    {selectedNotif.details.staffName && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Staff Member:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.staffName}</span>
                      </div>
                    )}
                    {selectedNotif.details.department && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Department:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.department}</span>
                      </div>
                    )}
                    {selectedNotif.details.leaveType && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Leave Type:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.leaveType}</span>
                      </div>
                    )}
                    {selectedNotif.details.reason && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Reason:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.reason}</span>
                      </div>
                    )}
                    {selectedNotif.details.itemName && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Inventory Item:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.itemName}</span>
                      </div>
                    )}
                    {selectedNotif.details.newStock !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Current Stock:</span>
                        <span className="font-semibold text-[#24312e]">
                          {selectedNotif.details.newStock} {selectedNotif.details.unit || ""}
                        </span>
                      </div>
                    )}
                    {selectedNotif.details.fullMessage && (
                      <div className="mt-2 rounded-lg bg-[#f0f2ee] p-2 text-xs text-[#24312e]">
                        {selectedNotif.details.fullMessage}
                      </div>
                    )}
                    {selectedNotif.details.specialRequests && (
                      <div className="flex justify-between">
                        <span className="text-[#84908a]">Special Request:</span>
                        <span className="font-semibold text-[#24312e]">{selectedNotif.details.specialRequests}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="mt-5 flex items-center justify-between border-t border-[#e5e7eb] pt-3">
              <span className="text-[11px] text-[#84908a]">
                Received {new Date(selectedNotif.createdAt).toLocaleTimeString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="rounded-xl border border-[#dfe1dc] px-3.5 py-1.5 text-xs font-semibold text-[#57645f] hover:bg-[#f0f2ee] transition"
                >
                  Close
                </button>
                {onNavigate && (
                  <button
                    onClick={() => handleActionNavigation(selectedNotif)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#24312e] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#31423e] transition"
                  >
                    View Section <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
