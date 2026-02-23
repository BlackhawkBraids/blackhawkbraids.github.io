/**
 * Live pricing engine for BlackhawkBraids custom paracord bracelets.
 *
 * Pricing rules (sourced from ForgeLivePricingEngine agent spec):
 *
 *   Base price:           $24.99
 *
 *   Weave adjustments:
 *     Tactical Cobra Weave   +$0  (standard)
 *     King Cobra Weave       +$6  (double-layer weave, ~2× paracord)
 *     Solomon Bar            +$3
 *     Fishtail               +$3
 *
 *   Hardware adjustments:
 *     Sliding Knot           +$0  (standard)
 *     Buckle Clasp           +$0  (standard plastic buckle)
 *     Shackle Clasp          +$5  (steel shackle, premium hardware)
 *
 *   Accent adjustment:
 *     Neon Accent            +$2  (when color is "Neon Blue" or "Black & Neon Blue")
 *
 *   Oversize surcharge:
 *     Wrist > 8.5 in         +$3
 *
 * The final price is formatted as psychological .99 pricing (e.g. $37.99)
 * and is never less than the base price.
 *
 * BACKEND SAFETY: The frontend may display a live-calculated price for UX
 * purposes, but the server always recalculates using this module before
 * creating a Stripe Checkout Session and rejects any mismatch.
 */
"use strict";

/** Base price for any paracord bracelet before add-ons. */
const BRACELET_BASE_PRICE = 24.99;

/**
 * Dollar adjustment applied for each weave style.
 * Keys must match the `style` values in products.configOptions.
 */
const WEAVE_ADJUSTMENTS = {
  "Tactical Cobra Weave": 0,
  "King Cobra Weave":     6,
  "Solomon Bar":          3,
  "Fishtail":             3,
};

/**
 * Dollar adjustment applied for each clasp/hardware option.
 * Keys must match the `clasp` values in products.configOptions.
 */
const HARDWARE_ADJUSTMENTS = {
  "Sliding Knot":  0,
  "Buckle Clasp":  0,
  "Shackle Clasp": 5,
};

/** Color values that trigger the neon-accent price adjustment. */
const NEON_ACCENT_COLORS = ["Neon Blue", "Black & Neon Blue"];

/** Dollar adjustment added when a neon accent color is selected. */
const NEON_ACCENT_ADJUSTMENT = 2;

/** Wrist size in inches above which the oversize surcharge applies. */
const OVERSIZE_WRIST_THRESHOLD = 8.5;

/** Dollar surcharge for wrists larger than OVERSIZE_WRIST_THRESHOLD. */
const OVERSIZE_ADJUSTMENT = 3;

/**
 * Calculates the live price for a custom paracord bracelet based on the
 * customer's selected configuration.
 *
 * @param {{ style: string, clasp: string, color: string, length: string }} config
 *   Validated bracelet configuration from bracelet-config.js.
 * @returns {{
 *   base: number,
 *   adjustments: Array<{ label: string, amount: number }>,
 *   total: number
 * }}
 *   Price breakdown.  `total` is the final price in dollars, formatted to
 *   .99 psychological pricing.
 * @throws {TypeError} if `config` is not a plain object.
 */
function calculateBraceletPrice(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new TypeError("Bracelet configuration must be a plain object.");
  }

  const adjustments = [];

  // Weave style adjustment
  const weaveAdj = WEAVE_ADJUSTMENTS[config.style] ?? 0;
  if (weaveAdj > 0) {
    adjustments.push({ label: config.style, amount: weaveAdj });
  }

  // Hardware / clasp adjustment
  const hardwareAdj = HARDWARE_ADJUSTMENTS[config.clasp] ?? 0;
  if (hardwareAdj > 0) {
    adjustments.push({ label: config.clasp, amount: hardwareAdj });
  }

  // Neon accent adjustment
  if (NEON_ACCENT_COLORS.includes(config.color)) {
    adjustments.push({ label: "Neon Accent", amount: NEON_ACCENT_ADJUSTMENT });
  }

  // Oversize surcharge — derived from the length config option (e.g. "9in")
  const wristInches = parseFloat(config.length);
  if (!Number.isNaN(wristInches) && wristInches > OVERSIZE_WRIST_THRESHOLD) {
    adjustments.push({ label: "Oversize", amount: OVERSIZE_ADJUSTMENT });
  }

  const adjustmentSum = adjustments.reduce((sum, a) => sum + a.amount, 0);
  const rawTotal = BRACELET_BASE_PRICE + adjustmentSum;

  // Apply psychological .99 pricing: floor to nearest whole dollar, then add $0.99.
  // The base price (24.99) already ends in .99, and all adjustments are whole
  // dollar amounts, so this reliably preserves or restores the .99 suffix.
  const total = parseFloat((Math.floor(rawTotal) + 0.99).toFixed(2));

  return { base: BRACELET_BASE_PRICE, adjustments, total };
}

module.exports = {
  calculateBraceletPrice,
  BRACELET_BASE_PRICE,
  WEAVE_ADJUSTMENTS,
  HARDWARE_ADJUSTMENTS,
  NEON_ACCENT_COLORS,
  NEON_ACCENT_ADJUSTMENT,
  OVERSIZE_WRIST_THRESHOLD,
  OVERSIZE_ADJUSTMENT,
};
