import assert from "node:assert";

const BASE_URL = "http://localhost:4000";

async function runTests() {
  console.log("=== 🧪 STARTING PAYU PAYMENT GATEWAY INTEGRATION TESTS ===");

  // 1. GET /api/payments/config
  console.log("\n1. Testing GET /api/payments/config...");
  const configRes = await fetch(`${BASE_URL}/api/payments/config`);
  assert.strictEqual(configRes.status, 200, "PayU config status should be 200");
  const configJson = await configRes.json();
  console.log("PayU Config response:", configJson);
  assert.strictEqual(configJson.gateway, "PayU", "Gateway should be PayU");
  assert.ok(configJson.reservationDeposit !== undefined, "Reservation deposit should be present");
  console.log("✅ GET /api/payments/config verified!");

  // 2. POST /api/payments/init
  console.log("\n2. Testing POST /api/payments/init...");
  const initRes = await fetch(`${BASE_URL}/api/payments/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestName: "Karan Bisht",
      email: "karan@example.com",
      phone: "+91 9876543210",
      amount: configJson.reservationDeposit || 500,
      guests: 4,
      bookingDate: "2026-09-20",
      bookingTime: "08:30 PM",
    }),
  });
  assert.strictEqual(initRes.status, 200, "PayU init status should be 200");
  const initJson = await initRes.json();
  console.log("PayU Init result:", initJson);
  assert.strictEqual(initJson.success, true, "PayU init should succeed");
  assert.ok(initJson.txnid && initJson.txnid.startsWith("PAYU_"), "Txnid must start with PAYU_");
  assert.ok(initJson.params && initJson.params.hash, "PayU SHA-512 hash must be generated");
  console.log("✅ POST /api/payments/init successfully generated PayU txnid and SHA-512 hash!");

  // 3. POST /api/payments/verify
  console.log("\n3. Testing POST /api/payments/verify...");
  const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txnid: initJson.txnid,
      status: "success",
    }),
  });
  assert.strictEqual(verifyRes.status, 200, "Verify status should be 200");
  const verifyJson = await verifyRes.json();
  console.log("PayU Verify result:", verifyJson);
  assert.strictEqual(verifyJson.success, true);
  assert.strictEqual(verifyJson.gateway, "PayU");
  console.log("✅ POST /api/payments/verify passed!");

  // 4. Create Booking with PayU payment reference
  console.log("\n4. Creating table reservation with PayU payment...");
  const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: "Karan Bisht - PayU VIP",
      phone: "9876543210",
      email: "karan@example.com",
      bookingDate: "2026-09-20",
      bookingTime: "08:30 PM",
      guests: 4,
      deposit: configJson.reservationDeposit || 500,
      source: "Website",
      specialRequests: "PayU Verified Booking",
      payuPaymentId: initJson.txnid,
      paymentStatus: "Paid",
    }),
  });
  assert.strictEqual(bookingRes.status, 201, "Booking creation should return 201");
  const bookingJson = await bookingRes.json();
  console.log("Created Booking:", bookingJson.data);
  assert.strictEqual(bookingJson.data.payuPaymentId, initJson.txnid, "payuPaymentId must match generated txnid");
  assert.strictEqual(bookingJson.data.paymentStatus, "Paid");
  console.log("✅ Reservation created with PayU payment reference!");

  // 5. Verify booking order in GET /api/bookings
  console.log("\n5. Checking GET /api/bookings sort order...");
  const listRes = await fetch(`${BASE_URL}/api/bookings`);
  assert.strictEqual(listRes.status, 200);
  const listJson = await listRes.json();
  const topBooking = listJson.data[0];
  console.log("Top booking in list:", topBooking.customer, "| ID:", topBooking.id, "| PayU Txn:", topBooking.payuPaymentId);
  assert.strictEqual(topBooking.id, bookingJson.data.id, "Newly created reservation must be at the very top!");
  console.log("✅ Newest PayU reservation is correctly displayed at the top!");

  // 6. Test Settings updates for PayU Merchant Key & Salt
  console.log("\n6. Testing PUT /api/team/settings for PayU credentials...");
  const testKey = "gtKFFxTest";
  const testSalt = "eCwWELxiTest";
  const updateSettingsRes = await fetch(`${BASE_URL}/api/team/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payuMerchantKey: testKey,
      payuMerchantSalt: testSalt,
      payuTestMode: true,
      reservationDeposit: 650,
    }),
  });
  assert.strictEqual(updateSettingsRes.status, 200);
  const updateSettingsJson = await updateSettingsRes.json();
  console.log("Updated Settings:", {
    key: updateSettingsJson.data.payuMerchantKey,
    testMode: updateSettingsJson.data.payuTestMode,
    deposit: updateSettingsJson.data.reservationDeposit,
  });
  assert.strictEqual(updateSettingsJson.data.payuMerchantKey, testKey);
  assert.strictEqual(updateSettingsJson.data.reservationDeposit, 650);
  console.log("✅ PUT /api/team/settings correctly stored PayU credentials & updated deposit!");

  // 7. Verify GET /api/website/content has new PayU details
  console.log("\n7. Testing GET /api/website/content dynamic reflection...");
  const contentRes = await fetch(`${BASE_URL}/api/website/content`);
  assert.strictEqual(contentRes.status, 200);
  const contentJson = await contentRes.json();
  console.log("Website content PayU info:", {
    key: contentJson.data.payuMerchantKey,
    testMode: contentJson.data.payuTestMode,
    deposit: contentJson.data.reservationDeposit,
  });
  assert.strictEqual(contentJson.data.payuMerchantKey, testKey);
  assert.strictEqual(contentJson.data.reservationDeposit, 650);
  console.log("✅ Website content dynamically reflects updated PayU key and deposit!");

  console.log("\n🎉 ALL PAYU TESTS PASSED SUCCESSFULLY! 🎉");
}

runTests().catch((err) => {
  console.error("❌ PayU Test failed:", err);
  process.exit(1);
});
