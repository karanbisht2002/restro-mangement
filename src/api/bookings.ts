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
