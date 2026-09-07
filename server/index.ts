import express from "express";
import "dotenv/config";
import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { checkDatabaseConnection } from "./db";
import { itemsDbRouter } from "./items-db";
import { ordersDbRouter } from "./orders-db";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use("/api/items", itemsDbRouter);
app.use("/api/orders", ordersDbRouter);

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
