// scratch/test_stripe_and_deposit.mjs
import assert from "node:assert";

const BASE_URL = "http://localhost:4000";

async function runTests() {
  console.log("=== 🧪 STARTING STRIPE & DYNAMIC DEPOSIT TESTS ===");

  // Test 1: Payments Config API
  console.log("\n1. Testing GET /api/payments/config...");
  const configRes = await fetch(`${BASE_URL}/api/payments/config`);
  assert.strictEqual(configRes.status, 200, "Config endpoint status should be 200");
  const configJson = await configRes.json();
  console.log("Payment config:", configJson);
  assert.strictEqual(configJson.success, true, "Config success should be true");
  assert.ok(typeof configJson.data.reservationDeposit === "number", "reservationDeposit should be a number");
  assert.ok(["live", "test", "sandbox"].includes(configJson.data.mode), "mode should be live, test, or sandbox");
  console.log("✅ GET /api/payments/config passed!");

  // Test 2: Payments Create Intent API
  console.log("\n2. Testing POST /api/payments/create-intent...");
  const intentRes = await fetch(`${BASE_URL}/api/payments/create-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: configJson.data.reservationDeposit,
      currency: "inr",
      bookingDetails: {
        name: "Karan Bisht Verification",
        phone: "9876543210",
        email: "karan@example.com",
        guests: 4,
        bookingDate: "2026-09-16",
        bookingTime: "08:00 PM",
      },
    }),
  });
  assert.strictEqual(intentRes.status, 200, "Create intent status should be 200");
  const intentJson = await intentRes.json();
  console.log("Payment Intent Result:", intentJson);
  assert.strictEqual(intentJson.success, true, "Create intent success should be true");
  assert.ok(intentJson.paymentIntentId, "paymentIntentId must be present");
  console.log("✅ POST /api/payments/create-intent passed! ID:", intentJson.paymentIntentId);

  // Test 3: Payments Verify API
  console.log("\n3. Testing POST /api/payments/verify...");
  const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: intentJson.paymentIntentId,
    }),
  });
  const verifyJson = await verifyRes.json();
  console.log("Payment Verify Result:", verifyJson);
  assert.strictEqual(verifyJson.success, true, "Verify success should be true");
  console.log("✅ POST /api/payments/verify passed!");

  // Test 4: Website Content API returns dynamic deposit & Stripe key
  console.log("\n4. Testing GET /api/website/content...");
  const contentRes = await fetch(`${BASE_URL}/api/website/content`);
  const contentJson = await contentRes.json();
  assert.strictEqual(contentJson.success, true, "Website content success should be true");
  console.log("Website content deposit:", contentJson.data.reservationDeposit, "currency:", contentJson.data.currencySymbol);
  assert.strictEqual(typeof contentJson.data.reservationDeposit, "number", "reservationDeposit should be in website content");
  console.log("✅ GET /api/website/content passed!");

  // Test 5: Create Booking with Stripe Payment ID and verify it appears at the TOP
  console.log("\n5. Testing POST /api/bookings and verifying sort order (created_at DESC)...");
  const testCustomer = `Karan Stripe Test ${Date.now()}`;
  const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: testCustomer,
      phone: "9876543210",
      email: "karan.stripe@example.com",
      bookingDate: "2026-09-15",
      bookingTime: "01:00 PM",
      guests: 3,
      source: "Website",
      deposit: configJson.data.reservationDeposit,
      stripePaymentId: intentJson.paymentIntentId,
      paymentStatus: "Paid",
    }),
  });
  assert.strictEqual(bookingRes.status, 201, "Booking creation should return 201");
  const bookingJson = await bookingRes.json();
  console.log("Created booking:", bookingJson.data.id, bookingJson.data.customer, "Stripe ID:", bookingJson.data.stripePaymentId);

  // Fetch bookings list and check top entry
  const listRes = await fetch(`${BASE_URL}/api/bookings`);
  const listJson = await listRes.json();
  assert.ok(Array.isArray(listJson.data), "Bookings should be an array");
  console.log("Top booking in list:", listJson.data[0]?.customer, "ID:", listJson.data[0]?.id, "Created:", listJson.data[0]?.createdAt);
  assert.strictEqual(listJson.data[0]?.customer, testCustomer, "Newly created booking MUST appear at the top!");
  assert.strictEqual(listJson.data[0]?.stripePaymentId, intentJson.paymentIntentId, "Stripe payment ID must be retained");
  assert.strictEqual(listJson.data[0]?.paymentStatus, "Paid", "Payment status must be Paid");
  console.log("✅ Bookings sort order verified: new booking is at the TOP!");

  // Test 6: Test dynamic deposit update via Settings API
  console.log("\n6. Testing dynamic deposit update via PUT /api/team/settings...");
  const newDeposit = 650;
  const updateSettingsRes = await fetch(`${BASE_URL}/api/team/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reservationDeposit: newDeposit,
      stripePublishableKey: "pk_test_sample12345",
      stripeSecretKey: "sk_test_sample67890",
    }),
  });
  const updatedSettingsJson = await updateSettingsRes.json();
  console.log("Updated settings result:", updatedSettingsJson.data.reservationDeposit, updatedSettingsJson.data.stripePublishableKey);
  assert.strictEqual(Number(updatedSettingsJson.data.reservationDeposit), newDeposit, "Deposit must update to 650");

  // Verify website content reflects updated deposit
  const reContentRes = await fetch(`${BASE_URL}/api/website/content`);
  const reContentJson = await reContentRes.json();
  console.log("Re-fetched website content deposit:", reContentJson.data.reservationDeposit);
  assert.strictEqual(reContentJson.data.reservationDeposit, newDeposit, "Website content must dynamically reflect updated deposit");

  // Reset back to 500 for clean state
  await fetch(`${BASE_URL}/api/team/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reservationDeposit: 500,
      stripePublishableKey: "",
      stripeSecretKey: "",
    }),
  });
  console.log("Reset deposit to 500. All tests passed!");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
