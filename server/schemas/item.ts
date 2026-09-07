export type ItemType = "veg" | "non-veg";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  type: ItemType;
  image: string;
  description: string;
  category: string;
  available: boolean;
  preparationTimeMinutes: number;
  allergens: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ItemInput = Omit<MenuItem, "id" | "createdAt" | "updatedAt">;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function validateItemInput(body: unknown): {
  value?: ItemInput;
  errors: string[];
} {
  if (!body || typeof body !== "object") {
    return { errors: ["Request body must be a JSON object."] };
  }

  const input = body as Partial<ItemInput>;
  const errors: string[] = [];

  if (!isNonEmptyString(input.name)) errors.push("name is required.");
  if (
    typeof input.price !== "number" ||
    !Number.isFinite(input.price) ||
    input.price < 0
  ) {
    errors.push("price must be a non-negative number.");
  }
  if (input.type !== "veg" && input.type !== "non-veg") {
    errors.push('type must be either "veg" or "non-veg".');
  }
  if (!isNonEmptyString(input.image)) errors.push("image is required.");
  if (!isNonEmptyString(input.description))
    errors.push("description is required.");
  if (!isNonEmptyString(input.category)) errors.push("category is required.");
  if (typeof input.available !== "boolean")
    errors.push("available must be a boolean.");
  if (
    !Number.isInteger(input.preparationTimeMinutes) ||
    (input.preparationTimeMinutes ?? 0) < 0
  ) {
    errors.push("preparationTimeMinutes must be a non-negative integer.");
  }
  if (
    !Array.isArray(input.allergens) ||
    input.allergens.some((value) => !isNonEmptyString(value))
  ) {
    errors.push("allergens must be an array of strings.");
  }
  if (
    !Array.isArray(input.tags) ||
    input.tags.some((value) => !isNonEmptyString(value))
  ) {
    errors.push("tags must be an array of strings.");
  }

  if (errors.length > 0) return { errors };

  return {
    errors: [],
    value: {
      name: input.name!.trim(),
      price: Number(input.price!.toFixed(2)),
      type: input.type!,
      image: input.image!.trim(),
      description: input.description!.trim(),
      category: input.category!.trim(),
      available: input.available!,
      preparationTimeMinutes: input.preparationTimeMinutes!,
      allergens: input.allergens!.map((value) => value.trim()),
      tags: input.tags!.map((value) => value.trim()),
    },
  };
}
