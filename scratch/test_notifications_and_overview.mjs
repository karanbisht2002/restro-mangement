import assert from "node:assert";

const BASE_URL = "http://localhost:4000";

async function runTests() {
  console.log("=== Testing 1: Overview API & Midnight Reset ===");
  const overviewRes = await fetch(`${BASE_URL}/api/overview`);
  assert.strictEqual(overviewRes.status, 200, "Overview status should be 200");
  const overviewJson = await overviewRes.json();
  const data = overviewJson.data;

  console.log("Today's revenue:", data.revenue.today);
  console.log("Today's order count:", data.revenue.totalOrdersToday);
  console.log("Weekly chart entries:", data.weeklyChart.length);

  assert.strictEqual(typeof data.revenue.today, "number", "today revenue must be number");
  assert.ok(Array.isArray(data.weeklyChart), "weeklyChart must be array");
  assert.strictEqual(data.weeklyChart.length, 7, "weeklyChart must have 7 days");

  const todayItem = data.weeklyChart.find((d) => d.isToday);
  assert.ok(todayItem, "weeklyChart must contain isToday item");
  console.log("Today's chart item:", todayItem);

  console.log("\n=== Testing 2: Manager Broadcast Notice API ===");
  const broadcastRes = await fetch(`${BASE_URL}/api/notifications/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetRole: "All",
      title: "Evening Special Prep",
      message: "Chef special paneer lababdar is prepared. Ensure tables are properly set.",
      priority: "Normal",
      sentBy: "Manager",
    }),
  });
  assert.strictEqual(broadcastRes.status, 201, "Broadcast should succeed with 201");
  const broadcastJson = await broadcastRes.json();
  assert.ok(broadcastJson.notification?.id, "Must return created notification");
  console.log("Created broadcast notice:", broadcastJson.notification.title);

  console.log("\n=== Testing 3: Website Order Trigger ===");
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-order-source": "website",
    },
    body: JSON.stringify({
      customer: "Amit Sharma",
      table: "Table T04",
      itemList: ["Paneer Tikka", "Garlic Naan"],
      total: 620,
      source: "website",
    }),
  });
  assert.strictEqual(orderRes.status, 201, "Order creation should succeed");
  const orderJson = await orderRes.json();
  console.log("Created order:", orderJson.data.id, "from source:", orderJson.data.source);

  console.log("\n=== Testing 4: Table Booking Trigger ===");
  const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: "Kavita Verma",
      phone: "+91 98765 43210",
      bookingDate: "2026-09-10",
      bookingTime: "19:30",
      guests: 4,
      tableId: "T02",
      deposit: 500,
      source: "Online",
      specialRequests: "Window seat preferred",
    }),
  });
  assert.strictEqual(bookRes.status, 201, "Booking should succeed");
  console.log("Created booking for Kavita Verma");

  console.log("\n=== Testing 5: Table Status 'Needs cleaning' Trigger ===");
  const tableCleanRes = await fetch(`${BASE_URL}/api/tables/T02/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Needs cleaning" }),
  });
  assert.strictEqual(tableCleanRes.status, 200, "Table status update should succeed");
  console.log("Updated T02 status to 'Needs cleaning'");

  console.log("\n=== Testing 6: Fetch Notifications For Manager (Customer & Employee tabs) ===");
  const mgrCustomerRes = await fetch(`${BASE_URL}/api/notifications?role=Manager&category=customer`);
  const mgrCustomer = await mgrCustomerRes.json();
  console.log(`Manager Customer notifications: ${mgrCustomer.count} items`);
  assert.ok(mgrCustomer.data.some((n) => n.category === "customer"), "Should have customer items");

  const mgrEmployeeRes = await fetch(`${BASE_URL}/api/notifications?role=Manager&category=employee`);
  const mgrEmployee = await mgrEmployeeRes.json();
  console.log(`Manager Employee notifications: ${mgrEmployee.count} items`);
  assert.ok(mgrEmployee.data.some((n) => n.category === "employee"), "Should have employee items");

  console.log("\n=== Testing 7: Kitchen & Server Notifications ===");
  const kitchenNotifsRes = await fetch(`${BASE_URL}/api/notifications?role=Kitchen`);
  const kitchenNotifs = await kitchenNotifsRes.json();
  console.log(`Kitchen notifications count: ${kitchenNotifs.count}`);
  assert.ok(kitchenNotifs.count > 0, "Kitchen must have notifications");

  const serverNotifsRes = await fetch(`${BASE_URL}/api/notifications?role=Server`);
  const serverNotifs = await serverNotifsRes.json();
  console.log(`Server notifications count: ${serverNotifs.count}`);
  assert.ok(serverNotifs.count > 0, "Server must have notifications");

  console.log("\n=== Testing 8: Mark Notification Read & Read All ===");
  const notifToRead = kitchenNotifs.data[0];
  if (notifToRead) {
    const readRes = await fetch(`${BASE_URL}/api/notifications/${notifToRead.id}/read`, {
      method: "PATCH",
    });
    assert.strictEqual(readRes.status, 200, "Mark read should return 200");
    console.log(`Marked notification ${notifToRead.id} as read`);
  }

  const readAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "Kitchen" }),
  });
  assert.strictEqual(readAllRes.status, 200, "Mark all read should return 200");
  console.log("Successfully marked all notifications read for Kitchen");

  console.log("\n ALL AUTOMATED API TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
