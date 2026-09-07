async function run() {
  console.log("--- Starting Order Lifecycle Role Enforcement Tests ---");
  const baseUrl = "http://localhost:4000/api/orders";

  // Test 1: Kitchen cannot create an order
  console.log("\nTest 1: Kitchen trying to create an order (expect 403)");
  const kitchenCreateRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Kitchen" },
    body: JSON.stringify({
      customer: "Chef Test",
      table: "Table 05",
      itemList: ["Garlic Bread"],
      total: 250,
      role: "Kitchen",
    }),
  });
  console.log("Kitchen create status:", kitchenCreateRes.status);
  const kitchenCreateBody = await kitchenCreateRes.json();
  console.log("Kitchen create response:", kitchenCreateBody);
  if (kitchenCreateRes.status !== 403) throw new Error("Expected 403 for Kitchen order creation");

  // Test 2: Server creates an order
  console.log("\nTest 2: Server creates an order (expect 201, status Queued)");
  const serverCreateRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Server" },
    body: JSON.stringify({
      customer: "Role Test Customer",
      table: "Table 07",
      itemList: ["Truffle Pasta", "Mint Mojito"],
      total: 890,
      role: "Server",
    }),
  });
  console.log("Server create status:", serverCreateRes.status);
  const createdOrder = (await serverCreateRes.json()).data;
  console.log("Created order ID:", createdOrder.id, "Status:", createdOrder.status);
  if (createdOrder.status !== "Queued") throw new Error("Expected Queued status");

  const orderId = encodeURIComponent(createdOrder.id);

  // Test 3: Server tries to mark preparing (expect 403)
  console.log("\nTest 3: Server trying to mark preparing (expect 403)");
  const serverPrepareRes = await fetch(`${baseUrl}/${orderId}/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Server" },
    body: JSON.stringify({ role: "Server" }),
  });
  console.log("Server prepare status:", serverPrepareRes.status);
  const serverPrepareBody = await serverPrepareRes.json();
  console.log("Server prepare response:", serverPrepareBody);
  if (serverPrepareRes.status !== 403) throw new Error("Expected 403 for Server calling prepare");

  // Test 4: Kitchen marks preparing (expect 200)
  console.log("\nTest 4: Kitchen marks preparing (expect 200)");
  const kitchenPrepareRes = await fetch(`${baseUrl}/${orderId}/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Kitchen" },
    body: JSON.stringify({ role: "Kitchen" }),
  });
  console.log("Kitchen prepare status:", kitchenPrepareRes.status);
  const preparedOrder = (await kitchenPrepareRes.json()).data;
  console.log("Order status after kitchen prepare:", preparedOrder.status);
  if (preparedOrder.status !== "Preparing") throw new Error("Expected Preparing status");

  // Test 5: Server tries to mark ready (expect 403)
  console.log("\nTest 5: Server trying to mark ready (expect 403)");
  const serverReadyRes = await fetch(`${baseUrl}/${orderId}/ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Server" },
    body: JSON.stringify({ role: "Server" }),
  });
  console.log("Server ready status:", serverReadyRes.status);
  if (serverReadyRes.status !== 403) throw new Error("Expected 403 for Server calling ready");

  // Test 6: Kitchen marks ready (expect 200)
  console.log("\nTest 6: Kitchen marks ready (expect 200)");
  const kitchenReadyRes = await fetch(`${baseUrl}/${orderId}/ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Kitchen" },
    body: JSON.stringify({ role: "Kitchen" }),
  });
  console.log("Kitchen ready status:", kitchenReadyRes.status);
  const readyOrder = (await kitchenReadyRes.json()).data;
  console.log("Order status after kitchen ready:", readyOrder.status);
  if (readyOrder.status !== "Ready") throw new Error("Expected Ready status");

  // Test 7: Server tries to notify servant (expect 403)
  console.log("\nTest 7: Server trying to notify servant (expect 403)");
  const serverNotifyRes = await fetch(`${baseUrl}/${orderId}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Server" },
    body: JSON.stringify({ role: "Server" }),
  });
  console.log("Server notify status:", serverNotifyRes.status);
  if (serverNotifyRes.status !== 403) throw new Error("Expected 403 for Server calling notify");

  // Test 8: Kitchen notifies servant (expect 200)
  console.log("\nTest 8: Kitchen notifies servant (expect 200)");
  const kitchenNotifyRes = await fetch(`${baseUrl}/${orderId}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Kitchen" },
    body: JSON.stringify({ role: "Kitchen" }),
  });
  console.log("Kitchen notify status:", kitchenNotifyRes.status);
  const notifiedOrder = (await kitchenNotifyRes.json()).data;
  console.log("Order status after kitchen notify:", notifiedOrder.status);
  if (notifiedOrder.status !== "Notified") throw new Error("Expected Notified status");

  // Test 9: Kitchen tries to mark served (expect 403)
  console.log("\nTest 9: Kitchen trying to mark served (expect 403)");
  const kitchenServeRes = await fetch(`${baseUrl}/${orderId}/serve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Kitchen" },
    body: JSON.stringify({ role: "Kitchen" }),
  });
  console.log("Kitchen serve status:", kitchenServeRes.status);
  const kitchenServeBody = await kitchenServeRes.json();
  console.log("Kitchen serve response:", kitchenServeBody);
  if (kitchenServeRes.status !== 403) throw new Error("Expected 403 for Kitchen calling serve");

  // Test 10: Server marks served (expect 200)
  console.log("\nTest 10: Server marks served (expect 200)");
  const serverServeRes = await fetch(`${baseUrl}/${orderId}/serve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-staff-role": "Server" },
    body: JSON.stringify({ role: "Server" }),
  });
  console.log("Server serve status:", serverServeRes.status);
  const servedOrder = (await serverServeRes.json()).data;
  console.log("Order status after server marks served:", servedOrder.status);
  if (servedOrder.status !== "Served") throw new Error("Expected Served status");

  // Cleanup: Cancel test order
  console.log("\nCleaning up test order...");
  await fetch(`${baseUrl}/${orderId}`, { method: "DELETE" });
  console.log("--- All Order Lifecycle Role Enforcement Tests Passed! ---");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
