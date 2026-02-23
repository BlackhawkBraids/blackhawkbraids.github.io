"use strict";

const request = require("supertest");
const crypto  = require("crypto");

// ── helpers ──────────────────────────────────────────────────────────────────

const TEST_WEBHOOK_SECRET = "whsec_test_secret_for_unit_tests";
const TEST_STRIPE_KEY     = "sk_test_dummy_key_for_tests";

/**
 * Builds a valid Stripe-Signature header value for the given payload.
 * Uses HMAC-SHA256 identical to how Stripe signs real webhook payloads.
 */
function buildStripeSignature(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

// ── setup ─────────────────────────────────────────────────────────────────────

let app;

beforeEach(() => {
  // Reset module registry so each test gets a fresh server instance.
  jest.resetModules();
  process.env.STRIPE_SECRET_KEY     = TEST_STRIPE_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  process.env.BASE_URL              = "http://localhost:3000";
  app = require("../server");
});

// ── GET /api/health ───────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  test("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

// ── POST /api/webhook ─────────────────────────────────────────────────────────

describe("POST /api/webhook", () => {
  test("returns 400 when Stripe-Signature header is missing", async () => {
    const payload = JSON.stringify({ type: "checkout.session.completed" });
    const res = await request(app)
      .post("/api/webhook")
      .set("Content-Type", "application/json")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.text).toMatch(/Webhook Error/i);
  });

  test("returns 400 when signature is invalid", async () => {
    const payload = JSON.stringify({ type: "checkout.session.completed" });
    const res = await request(app)
      .post("/api/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=12345,v1=invalidsig")
      .send(payload);
    expect(res.status).toBe(400);
    expect(res.text).toMatch(/Webhook Error/i);
  });

  test("returns 200 with { received: true } for a valid checkout.session.completed event", async () => {
    const event = {
      id:   "evt_test_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id:           "cs_test_1",
          amount_total: 20400,
          currency:     "usd",
        },
      },
    };
    const payload = JSON.stringify(event);
    const sig     = buildStripeSignature(payload, TEST_WEBHOOK_SECRET);

    const res = await request(app)
      .post("/api/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  test("returns 200 with { received: true } for an unhandled event type", async () => {
    const event = { id: "evt_test_2", type: "customer.created", data: { object: {} } };
    const payload = JSON.stringify(event);
    const sig     = buildStripeSignature(payload, TEST_WEBHOOK_SECRET);

    const res = await request(app)
      .post("/api/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", sig)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  test("returns 500 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    jest.resetModules();
    const appNoSecret = require("../server");

    const payload = JSON.stringify({ type: "checkout.session.completed" });
    const res = await request(appNoSecret)
      .post("/api/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=1,v1=abc")
      .send(payload);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/i);
  });
});
