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
  "Website",
] as const;

export type BookingSource = (typeof bookingSources)[number];

export type TableBooking = {
  id: string;
  customer: string;
  phone: string;
  email?: string;
  bookingDate: string;
  bookingTime: string;
  guests: number;
  tableId: string | null;
  status: BookingStatus;
  deposit: number;
  source: BookingSource;
  specialRequests: string;
  paymentId?: string;
  payuPaymentId?: string;
  stripePaymentId?: string;
  paymentStatus?: "Paid" | "Pending" | "Refunded" | "Waived";
  createdAt: string;
  updatedAt: string;
};

export type BookingInput = {
  customer: string;
  phone: string;
  email?: string;
  bookingDate: string;
  bookingTime: string;
  guests: number;
  tableId?: string | null;
  deposit?: number;
  source?: BookingSource;
  specialRequests?: string;
  paymentId?: string;
  payuPaymentId?: string;
  stripePaymentId?: string;
  paymentStatus?: "Paid" | "Pending" | "Refunded" | "Waived";
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function validateBookingInput(body: unknown): {
  value?: BookingInput;
  errors: string[];
} {
  if (!body || typeof body !== "object") {
    return { errors: ["Request body must be a JSON object."] };
  }

  const input = body as Partial<BookingInput>;
  const errors: string[] = [];

  if (!isNonEmptyString(input.customer)) {
    errors.push("customer name is required.");
  }
  if (!isNonEmptyString(input.phone)) {
    errors.push("phone number is required.");
  }
  if (!isNonEmptyString(input.bookingDate)) {
    errors.push("bookingDate is required.");
  }
  if (!isNonEmptyString(input.bookingTime)) {
    errors.push("bookingTime is required.");
  }
  if (
    typeof input.guests !== "number" ||
    !Number.isInteger(input.guests) ||
    input.guests <= 0
  ) {
    errors.push("guests must be a positive integer.");
  }
  if (
    input.deposit !== undefined &&
    (typeof input.deposit !== "number" || !Number.isFinite(input.deposit) || input.deposit < 0)
  ) {
    errors.push("deposit must be a non-negative number.");
  }
  if (
    input.source !== undefined &&
    !bookingSources.includes(input.source as BookingSource)
  ) {
    errors.push(`source must be one of: ${bookingSources.join(", ")}.`);
  }

  if (errors.length > 0) return { errors };

  return {
    errors: [],
    value: {
      customer: input.customer!.trim(),
      phone: input.phone!.trim(),
      email: input.email ? input.email.trim() : "",
      bookingDate: input.bookingDate!.trim(),
      bookingTime: input.bookingTime!.trim(),
      guests: input.guests!,
      tableId: input.tableId && isNonEmptyString(input.tableId) ? input.tableId.trim() : null,
      deposit: input.deposit !== undefined ? Number(input.deposit.toFixed(2)) : 500,
      source: input.source ?? "Phone",
      specialRequests: input.specialRequests ? input.specialRequests.trim() : "",
      paymentId: input.paymentId?.trim() || input.payuPaymentId?.trim() || input.stripePaymentId?.trim() || "",
      payuPaymentId: input.payuPaymentId?.trim() || input.paymentId?.trim() || input.stripePaymentId?.trim() || "",
      stripePaymentId: input.stripePaymentId ? input.stripePaymentId.trim() : "",
      paymentStatus: input.paymentStatus ?? "Paid",
    },
  };
}
