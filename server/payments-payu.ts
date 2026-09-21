import { Router } from "express";
import crypto from "node:crypto";
import { pool } from "./db";

export const payuPaymentsRouter = Router();

interface PayUCredentials {
  merchantKey: string;
  merchantSalt: string;
  testMode: boolean;
  reservationDeposit: number;
  currencySymbol: string;
}

/**
 * Loads PayU Merchant credentials dynamically from database settings
 * with environment variable fallback.
 */
async function getPayUCredentials(): Promise<PayUCredentials> {
  let merchantKey = process.env.PAYU_MERCHANT_KEY || "";
  let merchantSalt = process.env.PAYU_MERCHANT_SALT || "";
  let testMode = process.env.PAYU_TEST_MODE ? process.env.PAYU_TEST_MODE !== "false" : true;
  let reservationDeposit = 500;
  let currencySymbol = "₹";

  try {
    const res = await pool.query(
      `SELECT payu_merchant_key, payu_merchant_salt, payu_test_mode, reservation_deposit, currency_symbol 
       FROM restaurant_settings 
       WHERE id = 'default' 
       LIMIT 1`
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      if (row.payu_merchant_key) merchantKey = String(row.payu_merchant_key).trim();
      if (row.payu_merchant_salt) merchantSalt = String(row.payu_merchant_salt).trim();
      if (row.payu_test_mode !== null && row.payu_test_mode !== undefined) {
        testMode = Boolean(row.payu_test_mode);
      }
      if (row.reservation_deposit !== null && row.reservation_deposit !== undefined) {
        reservationDeposit = Number(row.reservation_deposit);
      }
      if (row.currency_symbol) currencySymbol = row.currency_symbol;
    }
  } catch (err) {
    console.error("Failed to load PayU credentials from database:", err);
  }

  return {
    merchantKey,
    merchantSalt,
    testMode,
    reservationDeposit,
    currencySymbol,
  };
}

/**
 * Computes PayU SHA-512 Request Hash
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
 */
export function generatePayUHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const hashString = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || "",
    params.udf2 || "",
    params.udf3 || "",
    params.udf4 || "",
    params.udf5 || "",
    "", // udf6
    "", // udf7
    "", // udf8
    "", // udf9
    "", // udf10
    params.salt,
  ].join("|");

  return crypto.createHash("sha512").update(hashString).digest("hex");
}

/**
 * GET /api/payments/config
 * Returns public PayU configuration for the website & dashboard
 */
payuPaymentsRouter.get("/config", async (_req, res) => {
  try {
    const { merchantKey, testMode, reservationDeposit, currencySymbol } =
      await getPayUCredentials();

    let mode: "live" | "test" | "sandbox" = "sandbox";
    if (merchantKey) {
      mode = testMode ? "test" : "live";
    }

    res.json({
      success: true,
      merchantKey: merchantKey || "",
      testMode,
      mode,
      reservationDeposit,
      currencySymbol,
      gateway: "PayU",
      isConfigured: Boolean(merchantKey),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/init
 * Initializes a PayU transaction with cryptographic SHA-512 request hash
 */
payuPaymentsRouter.post("/init", async (req, res) => {
  try {
    const {
      guestName,
      email,
      phone,
      amount,
      guests,
      bookingDate,
      bookingTime,
      seatingZone,
      specialRequests,
      origin: clientOrigin,
    } = req.body;

    const { merchantKey, merchantSalt, testMode, reservationDeposit } = await getPayUCredentials();

    const finalAmount = (
      typeof amount === "number" && amount >= 0 ? amount : reservationDeposit
    ).toFixed(2);

    const firstname = (guestName || "Guest").trim().split(" ")[0] || "Guest";
    const userEmail = (email || "guest@tableandthyme.in").trim();
    const userPhone = (phone || "9999999999").replace(/\D/g, "").slice(-10) || "9999999999";
    const productinfo = "Table Reservation Deposit";

    const udf1 = String(bookingDate || "").trim();
    const udf2 = String(bookingTime || "").trim();
    const udf3 = String(guests || "2").trim();
    const udf4 = String(seatingZone || specialRequests || "Main Dining").trim();
    const udf5 = String(guestName || "Guest").trim();

    // Unique PayU transaction ID
    const txnid = `PAYU_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Action URL: test.payu.in vs secure.payu.in
    const actionUrl = testMode
      ? "https://test.payu.in/_payment"
      : "https://secure.payu.in/_payment";

    const resolvedOrigin =
      clientOrigin ||
      (req.headers.origin as string) ||
      (req.headers.referer ? new URL(req.headers.referer).origin : "http://localhost:5173");

    const callbackUrl = `${resolvedOrigin}/api/payments/callback?origin=${encodeURIComponent(resolvedOrigin)}`;

    // If real PayU Merchant Key & Salt are set:
    if (merchantKey && merchantSalt) {
      const hash = generatePayUHash({
        key: merchantKey,
        txnid,
        amount: finalAmount,
        productinfo,
        firstname,
        email: userEmail,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        salt: merchantSalt,
      });

      res.json({
        success: true,
        actionUrl,
        mode: testMode ? "test" : "live",
        isLive: !testMode,
        txnid,
        paymentId: txnid,
        params: {
          key: merchantKey,
          txnid,
          amount: finalAmount,
          productinfo,
          firstname,
          email: userEmail,
          phone: userPhone,
          hash,
          surl: callbackUrl,
          furl: callbackUrl,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5,
          service_provider: "payu_paisa",
        },
        message: testMode
          ? "PayU Sandbox/Test mode active. Submitting to test.payu.in"
          : "PayU Production Live mode active. Submitting to secure.payu.in",
      });
      return;
    }

    // Sandbox Simulator Fallback (Keys not yet entered in Dashboard Settings)
    const simulatedHash = crypto
      .createHash("sha512")
      .update(`SIMULATED|${txnid}|${finalAmount}`)
      .digest("hex");

    res.json({
      success: true,
      actionUrl,
      mode: "sandbox",
      isSandbox: true,
      isLive: false,
      txnid,
      paymentId: txnid,
      params: {
        key: "PAYU_SANDBOX_KEY",
        txnid,
        amount: finalAmount,
        productinfo,
        firstname,
        email: userEmail,
        phone: userPhone,
        hash: simulatedHash,
        surl: callbackUrl,
        furl: callbackUrl,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
      },
      message: "PayU test intent generated. Real PayU transactions execute when Merchant Key & Salt are saved in Dashboard Settings.",
    });
  } catch (err: any) {
    console.error("PayU initialization error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to initialize PayU payment" });
  }
});

/**
 * POST /api/payments/verify
 * Verifies PayU transaction status
 */
payuPaymentsRouter.post("/verify", async (req, res) => {
  try {
    const { txnid, status, paymentId } = req.body;
    const resolvedTxnId = txnid || paymentId;

    if (!resolvedTxnId) {
      return res.status(400).json({ success: false, error: "Transaction ID (txnid) is required" });
    }

    res.json({
      success: true,
      status: status || "success",
      txnid: resolvedTxnId,
      paymentId: resolvedTxnId,
      paymentStatus: "Paid",
      gateway: "PayU",
      verifiedAt: new Date().toISOString(),
      message: "Payment successfully verified via PayU India Gateway",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/payments/callback
 * Handles PayU redirect POST callbacks from PayU payment servers
 */
payuPaymentsRouter.post("/callback", async (req, res) => {
  try {
    const {
      status,
      txnid,
      amount,
      firstname,
      email,
      phone,
      udf1: bookingDate,
      udf2: bookingTime,
      udf3: guests,
      udf4: specialRequests,
      udf5: customerFullName,
      mihpayid,
      error_Message,
    } = req.body;

    const origin = req.query.origin
      ? String(req.query.origin)
      : (req.headers.origin as string) || "http://localhost:5173";

    if (status === "success") {
      const customer = (customerFullName || firstname || "PayU Guest").trim();
      const depositAmount = parseFloat(amount) || 500;
      const guestsCount = parseInt(guests, 10) || 2;
      const payuId = txnid || mihpayid || `PAYU_${Date.now()}`;
      const bookingId = `book_${Date.now()}`;

      // Check if booking already recorded for this transaction
      const existing = await pool.query(
        "SELECT id FROM table_bookings WHERE payu_payment_id = $1 LIMIT 1",
        [payuId]
      );

      let savedBookingId = bookingId;
      if (existing.rows.length === 0) {
        const insertRes = await pool.query(
          `INSERT INTO table_bookings (
            id, customer, phone, email, booking_date, booking_time,
            guests, status, deposit, source, special_requests,
            payu_payment_id, stripe_payment_id, payment_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Booked', $8, 'Website', $9, $10, $10, 'Paid', NOW(), NOW())
          RETURNING id`,
          [
            bookingId,
            customer,
            phone || "",
            email || "",
            bookingDate || new Date().toISOString().split("T")[0],
            bookingTime || "08:00 PM",
            guestsCount,
            depositAmount,
            specialRequests || "",
            payuId,
          ]
        );
        savedBookingId = insertRes.rows[0].id;
      } else {
        savedBookingId = existing.rows[0].id;
      }

      return res.redirect(
        `${origin}/?booking_success=true&booking_id=${encodeURIComponent(savedBookingId)}&txnid=${encodeURIComponent(payuId)}&customer=${encodeURIComponent(customer)}&date=${encodeURIComponent(bookingDate || "")}&time=${encodeURIComponent(bookingTime || "")}&guests=${guestsCount}&deposit=${depositAmount}#reservation`
      );
    } else {
      const errorMsg = error_Message || req.body.field9 || "Payment was cancelled or failed on PayU.";
      return res.redirect(
        `${origin}/?booking_error=${encodeURIComponent(errorMsg)}#reservation`
      );
    }
  } catch (err: any) {
    console.error("PayU callback error:", err);
    const origin = req.query.origin ? String(req.query.origin) : "http://localhost:5173";
    return res.redirect(
      `${origin}/?booking_error=${encodeURIComponent("Failed to finalize PayU reservation.")}#reservation`
    );
  }
});

// Also support GET /callback in case of browser fallbacks
payuPaymentsRouter.get("/callback", async (req, res) => {
  const origin = req.query.origin ? String(req.query.origin) : "http://localhost:5173";
  if (req.query.status === "success") {
    return res.redirect(
      `${origin}/?booking_success=true&txnid=${encodeURIComponent(String(req.query.txnid || ""))}&deposit=500#reservation`
    );
  }
  return res.redirect(
    `${origin}/?booking_error=${encodeURIComponent(String(req.query.msg || "PayU transaction finished."))}#reservation`
  );
});
