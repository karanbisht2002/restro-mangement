import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";

export interface TransactionRecord {
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
}

const transactionColumns = `
  id,
  invoice_no AS "invoiceNo",
  session_title AS "sessionTitle",
  customer,
  servant,
  amount::float AS amount,
  payment_mode AS "paymentMode",
  status,
  failure_reason AS "failureReason",
  items,
  tax_amount::float AS "taxAmount",
  service_charge_amount::float AS "serviceChargeAmount",
  discount_amount::float AS "discountAmount",
  deposit_credit::float AS "depositCredit",
  created_at AS "createdAt"
`;

export const transactionsDbRouter: Router = createRouter();

transactionsDbRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ${transactionColumns} FROM transactions ORDER BY created_at DESC`
    );
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(503).json({ error: "Database unavailable.", details: String(error) });
  }
});

transactionsDbRouter.post("/", async (req: Request, res: Response) => {
  try {
    const {
      id = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNo = `INV-${Date.now().toString().slice(-6)}`,
      sessionTitle = "Counter",
      customer = "Guest",
      servant = "Unassigned",
      amount = 0,
      paymentMode = "Cash",
      status = "Success",
      failureReason = null,
      items = [],
      taxAmount = 0,
      serviceChargeAmount = 0,
      discountAmount = 0,
      depositCredit = 0,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions (
        id, invoice_no, session_title, customer, servant, amount,
        payment_mode, status, failure_reason, items, tax_amount,
        service_charge_amount, discount_amount, deposit_credit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING ${transactionColumns}`,
      [
        id,
        invoiceNo,
        sessionTitle,
        customer,
        servant,
        Number(amount) || 0,
        paymentMode,
        status,
        failureReason || null,
        JSON.stringify(items || []),
        Number(taxAmount) || 0,
        Number(serviceChargeAmount) || 0,
        Number(discountAmount) || 0,
        Number(depositCredit) || 0,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to record transaction.", details: String(error) });
  }
});
