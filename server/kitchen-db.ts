import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

let kitchenClosed = false;
let closedAt: string | null = null;
let closedReason = "Kitchen closed by staff";

export function isKitchenClosed(): boolean {
  return kitchenClosed;
}

export function setKitchenClosed(closed: boolean, reason?: string) {
  kitchenClosed = closed;
  closedAt = closed ? new Date().toISOString() : null;
  if (reason) {
    closedReason = reason;
  }
}

export function getKitchenStatusData() {
  return {
    closed: kitchenClosed,
    closedAt,
    reason: closedReason,
  };
}

export const kitchenDbRouter: Router = createRouter();

// GET /api/kitchen & GET /api/kitchen/status
kitchenDbRouter.get(["/", "/status"], (_request: Request, response: Response) => {
  response.json({
    data: getKitchenStatusData(),
  });
});

// POST /api/kitchen/toggle
kitchenDbRouter.post("/toggle", (_request: Request, response: Response) => {
  setKitchenClosed(!kitchenClosed);
  response.json({
    data: getKitchenStatusData(),
    message: kitchenClosed ? "Kitchen is now closed" : "Kitchen is now open",
  });
});

// POST /api/kitchen/status
kitchenDbRouter.post("/status", (request: Request, response: Response) => {
  const { closed, reason } = request.body || {};
  if (typeof closed === "boolean") {
    setKitchenClosed(closed, typeof reason === "string" ? reason : undefined);
  } else {
    setKitchenClosed(!kitchenClosed);
  }
  response.json({
    data: getKitchenStatusData(),
    message: kitchenClosed ? "Kitchen is now closed" : "Kitchen is now open",
  });
});
