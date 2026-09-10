export const bookingStatuses = [
  "Booked",
  "Arrived",
  "Seated",
  "Completed",
  "Cancelled",
  "No show",
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export const bookingSources = [
  "Phone",
  "Walk-in",
  "Web link",
  "Online",
] as const;

export type BookingSource = (typeof bookingSources)[number];

export type TableBooking = {
  id: string;
  customer: string;
  phone: string;
  bookingDate: string;
  bookingTime: string;
  guests: number;
  tableId: string | null;
  status: BookingStatus;
  deposit: number;
  source: BookingSource;
  specialRequests: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingInput = {
  customer: string;
  phone: string;
  bookingDate: string;
  bookingTime: string;
  guests: number;
  tableId?: string | null;
  deposit?: number;
  source?: BookingSource;
  specialRequests?: string;
};

export async function fetchBookings(params?: {
  date?: string;
  status?: string;
}): Promise<TableBooking[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`/api/bookings${qs}`);
  if (!response.ok) throw new Error("Unable to load table bookings.");
  const result = (await response.json()) as { data: TableBooking[] };
  return result.data;
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<TableBooking> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.details?.join(" ") ??
        errorData.error ??
        "Unable to create table booking.",
    );
  }
  const result = (await response.json()) as { data: TableBooking };
  return result.data;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<TableBooking> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Unable to update booking status.");
  const result = (await response.json()) as { data: TableBooking };
  return result.data;
}

export async function cancelBooking(id: string): Promise<void> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Unable to cancel booking.");
}

export type BookingStats = {
  todayBookings: number;
  todayExpectedGuests: number;
  todayDeposit: number;
  totalBookings: number;
  totalExpectedGuests: number;
  totalDeposit: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
};

export async function fetchBookingStats(): Promise<BookingStats> {
  const response = await fetch("/api/bookings/stats");
  if (!response.ok) throw new Error("Unable to load booking stats.");
  const result = (await response.json()) as {
    data: {
      today_bookings: number;
      today_expected_guests: number;
      today_deposit: number;
      total_bookings: number;
      total_expected_guests: number;
      total_deposit: number;
      active_bookings: number;
      completed_bookings: number;
      cancelled_bookings: number;
    };
  };
  const d = result.data;
  return {
    todayBookings: d.today_bookings,
    todayExpectedGuests: d.today_expected_guests,
    todayDeposit: d.today_deposit,
    totalBookings: d.total_bookings,
    totalExpectedGuests: d.total_expected_guests,
    totalDeposit: d.total_deposit,
    activeBookings: d.active_bookings,
    completedBookings: d.completed_bookings,
    cancelledBookings: d.cancelled_bookings,
  };
}
