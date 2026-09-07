export const tableStatuses = [
  "Available",
  "Occupied",
  "Booked",
  "Arrived",
  "Needs cleaning",
] as const;

export type TableStatus = (typeof tableStatuses)[number];

export type RestaurantTable = {
  id: string;
  seats: number;
  zone: string;
  status: TableStatus;
  serverName: string;
  createdAt: string;
  updatedAt: string;
};

export type TableInput = {
  id: string;
  seats: number;
  zone: string;
  status?: TableStatus;
  serverName?: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function validateTableInput(body: unknown): {
  value?: TableInput;
  errors: string[];
} {
  if (!body || typeof body !== "object") {
    return { errors: ["Request body must be a JSON object."] };
  }

  const input = body as Partial<TableInput>;
  const errors: string[] = [];

  if (!isNonEmptyString(input.id)) errors.push("table id is required.");
  if (
    typeof input.seats !== "number" ||
    !Number.isInteger(input.seats) ||
    input.seats <= 0
  ) {
    errors.push("seats must be a positive integer.");
  }
  if (!isNonEmptyString(input.zone)) errors.push("zone is required.");
  if (
    input.status !== undefined &&
    !tableStatuses.includes(input.status as TableStatus)
  ) {
    errors.push(`status must be one of: ${tableStatuses.join(", ")}.`);
  }

  if (errors.length > 0) return { errors };

  return {
    errors: [],
    value: {
      id: input.id!.trim(),
      seats: input.seats!,
      zone: input.zone!.trim(),
      status: input.status ?? "Available",
      serverName: input.serverName ? input.serverName.trim() : "Priya S.",
    },
  };
}
