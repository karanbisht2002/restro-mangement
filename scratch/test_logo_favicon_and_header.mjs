// scratch/test_logo_favicon_and_header.mjs
import assert from "node:assert";

const BASE_URL = "http://localhost:4000";

async function runTest() {
  console.log("=== 🧪 STARTING DYNAMIC LOGO & FAVICON API TEST ===");

  // 1. Fetch current settings
  console.log("\n1. Fetching GET /api/team/settings...");
  const settingsRes = await fetch(`${BASE_URL}/api/team/settings`);
  assert.strictEqual(settingsRes.status, 200, "Settings GET should return 200");
  const settingsJson = await settingsRes.json();
  console.log("Current logoUrl:", settingsJson.data.logoUrl);
  console.log("Current faviconUrl:", settingsJson.data.faviconUrl);
  assert.ok(settingsJson.data.faviconUrl !== undefined, "faviconUrl should exist in settings");

  // 2. Update logo and favicon
  console.log("\n2. Updating logo and favicon via PUT /api/team/settings...");
  const testLogo = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200";
  const testFavicon = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=64";

  const updateRes = await fetch(`${BASE_URL}/api/team/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      logoUrl: testLogo,
      faviconUrl: testFavicon,
    }),
  });
  assert.strictEqual(updateRes.status, 200, "Update settings should return 200");
  const updateJson = await updateRes.json();
  console.log("Updated logoUrl:", updateJson.data.logoUrl);
  console.log("Updated faviconUrl:", updateJson.data.faviconUrl);
  assert.strictEqual(updateJson.data.logoUrl, testLogo, "Logo URL must be saved");
  assert.strictEqual(updateJson.data.faviconUrl, testFavicon, "Favicon URL must be saved");
  console.log("✅ PUT /api/team/settings saved logo & favicon successfully!");

  // 3. Verify GET /api/website/content dynamically reflects logoUrl and faviconUrl
  console.log("\n3. Testing GET /api/website/content for dynamic logo & favicon...");
  const websiteRes = await fetch(`${BASE_URL}/api/website/content`);
  assert.strictEqual(websiteRes.status, 200, "Website content GET should return 200");
  const websiteJson = await websiteRes.json();
  console.log("Website content logoUrl:", websiteJson.data.logoUrl);
  console.log("Website content faviconUrl:", websiteJson.data.faviconUrl);
  assert.strictEqual(websiteJson.data.logoUrl, testLogo, "Website content must dynamically return the dashboard logo");
  assert.strictEqual(websiteJson.data.faviconUrl, testFavicon, "Website content must dynamically return the dashboard favicon");
  console.log("✅ Website content dynamically reflects dashboard logo & favicon!");

  console.log("\n🎉 ALL LOGO & FAVICON DYNAMIC TESTS PASSED SUCCESSFULLY! 🎉");
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
