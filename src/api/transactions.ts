import type { TransactionRecord } from "../types";

export async function fetchTransactions(): Promise<TransactionRecord[]> {
  const response = await fetch("/api/transactions");
  if (!response.ok) throw new Error("Unable to load transactions.");
  const result = (await response.json()) as { data: TransactionRecord[] };
  return result.data;
}

export async function recordTransaction(
  tx: Partial<TransactionRecord>
): Promise<TransactionRecord> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tx),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.error || "Unable to record transaction.");
  }
  const result = (await response.json()) as { data: TransactionRecord };
  return result.data;
}
