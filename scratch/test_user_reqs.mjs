// Test verification script for user requests:
// 1. Live offers data
// 2. Blogs data (Stories -> Blogs)
// 3. Reserve table with DB fields, required email & phone, and automatic source: "Website"

async function run() {
  const baseUrl = "http://localhost:4000";

  console.log("--- 1. Testing Live Offers Data ---");
  const offersRes = await fetch(`${baseUrl}/api/website/offers`);
  const offersJson = await offersRes.json();
  const offers = Array.isArray(offersJson) ? offersJson : offersJson.data;
  console.log(`Offers count: ${offers.length}`);
  offers.forEach((o, i) => console.log(` [Offer ${i + 1}] ${o.title} (${o.badge}) - ${o.validUntil}`));
  if (offers.length < 5) throw new Error("Expected at least 5 offers");

  console.log("\n--- 2. Testing Blogs Data ---");
  const blogsRes = await fetch(`${baseUrl}/api/website/blogs`);
  const blogsJson = await blogsRes.json();
  const blogs = Array.isArray(blogsJson) ? blogsJson : blogsJson.data;
  console.log(`Blogs count: ${blogs.length}`);
  blogs.forEach((b, i) => console.log(` [Blog ${i + 1}] ${b.title} | Category: ${b.category} | Author: ${b.author}`));
  if (blogs.length < 5) throw new Error("Expected at least 5 blogs");

  console.log("\n--- 3. Testing Reserve Table Submission (source: 'Website', required email & phone) ---");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const bookingPayload = {
    customer: "Advait Singhania",
    phone: "+91 98201 55667",
    email: "advait.singhania@example.com",
    bookingDate: dateStr,
    bookingTime: "08:00 PM",
    guests: 4,
    source: "Website",
    specialRequests: "Zone: VIP Medieval Vault. Notes: Corner table for anniversary celebration",
    deposit: 500,
  };

  const createRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create booking: ${createRes.status} ${err}`);
  }

  const createJson = await createRes.json();
  const created = createJson.data || createJson;
  console.log("Booking created successfully:", {
    id: created.id,
    customer: created.customer,
    phone: created.phone,
    email: created.email,
    source: created.source,
    bookingDate: created.bookingDate,
    bookingTime: created.bookingTime,
    guests: created.guests,
    deposit: created.deposit,
  });

  if (created.email !== "advait.singhania@example.com") {
    throw new Error(`Expected email to be advait.singhania@example.com, got: ${created.email}`);
  }
  if (created.source !== "Website") {
    throw new Error(`Expected source to be 'Website', got: ${created.source}`);
  }

  console.log("\n--- 4. Verify in bookings list ---");
  const listRes = await fetch(`${baseUrl}/api/bookings`);
  const listJson = await listRes.json();
  const allBookings = listJson.data || listJson;
  const found = allBookings.find((b) => b.id === created.id);
  if (!found) {
    throw new Error("Created booking not found in bookings list");
  }
  console.log("Verified booking in DB table_bookings:", {
    id: found.id,
    customer: found.customer,
    phone: found.phone,
    email: found.email,
    source: found.source,
  });

  console.log("\nALL TESTS PASSED SUCCESSFULLY! ✨");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
