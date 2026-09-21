import express from "express";
import "dotenv/config";
import { createServer } from "node:https";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { checkDatabaseConnection } from "./db";
import { itemsDbRouter } from "./items-db";
import { ordersDbRouter } from "./orders-db";
import { bookingsDbRouter } from "./bookings-db";
import { tablesDbRouter } from "./tables-db";
import { kitchenDbRouter } from "./kitchen-db";
import { overviewDbRouter } from "./overview-db";
import { teamDbRouter } from "./team-db";
import { transactionsDbRouter } from "./transactions-db";
import { inventoryDbRouter } from "./inventory-db";
import { notificationsDbRouter } from "./notifications-db";
import { websiteDbRouter } from "./website-db";
import { payuPaymentsRouter } from "./payments-payu";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/api/items", itemsDbRouter);
app.use("/api/orders", ordersDbRouter);
app.use("/api/bookings", bookingsDbRouter);
app.use("/api/tables", tablesDbRouter);
app.use("/api/kitchen", kitchenDbRouter);
app.use("/api/overview", overviewDbRouter);
app.use("/api/team", teamDbRouter);
app.use("/api/transactions", transactionsDbRouter);
app.use("/api/inventory", inventoryDbRouter);
app.use("/api/notifications", notificationsDbRouter);
app.use("/api/website", websiteDbRouter);
app.use("/api/payments", payuPaymentsRouter);

app.get("/api/health", async (_request, response) => {
  try {
    await checkDatabaseConnection();
    response.json({
      status: "ok",
      service: "restro-management-api",
      database: "connected",
    });
  } catch {
    response.status(503).json({
      status: "degraded",
      service: "restro-management-api",
      database: "unavailable",
    });
  }
});

const distPath = path.resolve(process.cwd(), "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const useHttps =
  process.env.HTTPS === "true" &&
  process.env.SSL_KEY_PATH &&
  process.env.SSL_CERT_PATH;
const protocol = useHttps ? "https" : "http";

if (useHttps) {
  createServer(
    {
      key: readFileSync(process.env.SSL_KEY_PATH!),
      cert: readFileSync(process.env.SSL_CERT_PATH!),
    },
    app,
  ).listen(port, () =>
    console.log(`API listening on ${protocol}://localhost:${port}`),
  );
} else {
  app.listen(port, () =>
    console.log(`API listening on ${protocol}://localhost:${port}`),
  );
}
