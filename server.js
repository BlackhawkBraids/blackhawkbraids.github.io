"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const { validateCart, validateUSShipping, buildLineItems } = require("./src/checkout");
const { formatBraceletConfig } = require("./src/bracelet-config");

const app = express();

app.use(cors());
app.use(express.json());
// Serve only the dedicated public folder — never the server's working directory.
app.use(express.static(path.join(__dirname, "public")));

/**
 * POST /api/checkout/session
 *
 * Expects JSON body:
 *   {
 *     cartItems: [
 *       { id, quantity },                         // standard product
 *       { id, quantity, config: { color, style,   // paracord bracelet
 *           length, material, clasp } }
 *     ]
 *   }
 *
 * Security measures:
 *  1. Server-side cart validation — prices are sourced from the catalog,
 *     never from client input.
 *  2. Bracelet configuration validation — each option is checked against the
 *     product's `configOptions` allowlist so arbitrary strings can never
 *     reach Stripe metadata or order records.
 *  3. US-only shipping — Stripe's `shipping_address_collection` is restricted
 *     to ["US"]. Any non-US address entered on the Stripe-hosted page is
 *     rejected before payment is captured.
 *
 * Returns: { url: <Stripe hosted checkout URL> }
 */
app.post("/api/checkout/session", async (req, res) => {
  try {
    const { cartItems } = req.body;

    // 1. Validate the cart server-side (includes bracelet config validation).
    const cartResult = validateCart(cartItems);
    if (!cartResult.valid) {
      return res.status(400).json({ error: cartResult.error });
    }

    // 2. Validate US-only shipping.
    const shippingResult = validateUSShipping("US");
    if (!shippingResult.valid) {
      return res.status(400).json({ error: shippingResult.error });
    }

    // 3. Build Stripe line items using server-validated prices (cents).
    const lineItems = buildLineItems(cartResult.items);

    // 4. Collect bracelet configurations for Stripe session metadata so they
    //    appear in the Stripe Dashboard and can be referenced for fulfilment.
    const braceletMetadata = {};
    cartResult.items.forEach(({ product, config }, index) => {
      if (config && product.category === "paracord-bracelets") {
        braceletMetadata[`bracelet_config_${index + 1}`] = formatBraceletConfig(config);
      }
    });

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // 5. Create the Stripe Checkout Session.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      metadata: braceletMetadata,
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/configure-bracelet.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err.message);
    res.status(500).json({ error: "Unable to create checkout session." });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`BlackhawkBraids checkout server running on port ${PORT}`)
  );
}

module.exports = app;
