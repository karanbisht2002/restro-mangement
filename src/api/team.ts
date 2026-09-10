export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  pin: string;
  email?: string;
  password?: string;
  department: string;
  systemRole: "Manager" | "Server" | "Kitchen" | "None";
  shift: string;
  isActiveOperator: boolean;
  createdAt: string;
  updatedAt: string;
  todayStatus: "Clocked in" | "On break" | "Clocked out" | "Scheduled";
  clockInTime?: string | null;
  clockOutTime?: string | null;
  lastDistanceMeters?: number | null;
}

export interface RestaurantSettings {
  id: string;
  restaurantName: string;
  branchName?: string;
  currencySymbol?: string;
  isCurrencyLocked?: boolean;
  unlockCurrency?: boolean;
  logoUrl?: string;
  taxRate?: number;
  serviceCharge?: number;
  receiptFooter?: string;
  estimatedPrepTimeMinutes?: number;
  tableTurnTimeMinutes?: number;
  gstNumber?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  updatedAt: string;
}

export interface LeaveRequest {
  id: number;
  staffId: string;
  staffName: string;
  department: string;
  startDate: string;
  endDate: string;
  leaveType: "Sick" | "Casual" | "Vacation" | "Emergency";
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string | null;
  createdAt: string;
}

export interface Announcement {
  id: number;
  senderName: string;
  targetType: "All" | "Specific";
  targetStaffId?: string | null;
  title: string;
  message: string;
  priority: "Normal" | "Urgent";
  createdAt: string;
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const res = await fetch("/api/team/staff");
  if (!res.ok) throw new Error("Failed to fetch staff directory");
  const json = await res.json();
  return json.data || [];
}

export async function createStaff(data: {
  name: string;
  phone: string;
  pin?: string;
  email?: string;
  password?: string;
  department?: string;
  systemRole?: string;
  shift?: string;
}): Promise<StaffMember> {
  const res = await fetch("/api/team/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create staff member");
  const json = await res.json();
  return json.data;
}

export async function updateStaff(
  id: string,
  data: Partial<StaffMember>,
): Promise<StaffMember> {
  const res = await fetch(`/api/team/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update staff member");
  const json = await res.json();
  return json.data;
}

export async function deleteStaff(id: string): Promise<void> {
  const res = await fetch(`/api/team/staff/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete staff member");
}

export async function updateActiveOperators(operators: {
  managerId?: string;
  serverId?: string;
  kitchenId?: string;
}): Promise<void> {
  const res = await fetch("/api/team/operators", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(operators),
  });
  if (!res.ok) throw new Error("Failed to update active operators");
}

export async function fetchRestaurantSettings(): Promise<RestaurantSettings> {
  const res = await fetch("/api/team/settings");
  if (!res.ok) throw new Error("Failed to fetch restaurant settings");
  const json = await res.json();
  return json.data;
}

export async function updateRestaurantSettings(
  settings: Partial<RestaurantSettings>,
): Promise<RestaurantSettings> {
  const res = await fetch("/api/team/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update restaurant settings");
  const json = await res.json();
  return json.data;
}

export async function clockInStaff(params: {
  staffId: string;
  latitude?: number;
  longitude?: number;
  managerOverride?: boolean;
}): Promise<{
  success: boolean;
  distanceMeters: number;
  verified: boolean;
  message?: string;
}> {
  const res = await fetch("/api/team/attendance/clock-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || "Failed to clock in");
  }
  return json;
}

export async function toggleStaffBreak(
  staffId: string,
  action: "start" | "end",
): Promise<void> {
  const res = await fetch("/api/team/attendance/break", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffId, action }),
  });
  if (!res.ok) throw new Error("Failed to update break status");
}

export async function clockOutStaff(staffId: string): Promise<void> {
  const res = await fetch("/api/team/attendance/clock-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffId }),
  });
  if (!res.ok) throw new Error("Failed to clock out");
}

export async function fetchLeaves(): Promise<LeaveRequest[]> {
  const res = await fetch("/api/team/leaves");
  if (!res.ok) throw new Error("Failed to fetch leaves");
  const json = await res.json();
  return json.data || [];
}

export async function submitLeave(data: {
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
}): Promise<LeaveRequest> {
  const res = await fetch("/api/team/leaves", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit leave");
  const json = await res.json();
  return json.data;
}

export async function updateLeaveStatus(
  id: number,
  status: "Approved" | "Rejected",
  reviewedBy?: string,
): Promise<void> {
  const res = await fetch(`/api/team/leaves/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reviewedBy }),
  });
  if (!res.ok) throw new Error("Failed to update leave status");
}

export async function fetchAnnouncements(staffId?: string): Promise<Announcement[]> {
  const url = staffId
    ? `/api/team/announcements?staffId=${encodeURIComponent(staffId)}`
    : "/api/team/announcements";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch announcements");
  const json = await res.json();
  return json.data || [];
}

export async function createAnnouncement(data: {
  senderName?: string;
  targetType: "All" | "Specific";
  targetStaffId?: string | null;
  title: string;
  message: string;
  priority?: "Normal" | "Urgent";
}): Promise<Announcement> {
  const res = await fetch("/api/team/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create announcement");
  const json = await res.json();
  return json.data;
}

export async function loginStaff(phone: string, pin: string): Promise<StaffMember> {
  const res = await fetch("/api/team/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, pin }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Login failed");
  return json.staff;
}

export async function loginWebStaff(email: string, password: string): Promise<StaffMember> {
  const res = await fetch("/api/team/auth/login-web", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Invalid email or password");
  return json.staff;
}

export async function changeStaffPassword(
  staffId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/team/staff/${staffId}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to change password");
  return json;
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch("/api/team/departments");
  if (!res.ok) throw new Error("Failed to fetch departments");
  const json = await res.json();
  return json.data || [];
}

export async function createDepartment(name: string): Promise<string[]> {
  const res = await fetch("/api/team/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create department");
  return json.data || [];
}

export async function deleteDepartment(name: string): Promise<string[]> {
  const res = await fetch(`/api/team/departments/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete department");
  return json.data || [];
}


