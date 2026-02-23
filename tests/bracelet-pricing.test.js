"use strict";

const {
  calculateBraceletPrice,
  BRACELET_BASE_PRICE,
  WEAVE_ADJUSTMENTS,
  HARDWARE_ADJUSTMENTS,
  NEON_ACCENT_COLORS,
  NEON_ACCENT_ADJUSTMENT,
  OVERSIZE_WRIST_THRESHOLD,
  OVERSIZE_ADJUSTMENT,
} = require("../src/bracelet-pricing");

const { validateCart, buildLineItems } = require("../src/checkout");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Baseline config: no add-ons, produces the base price. */
const BASE_CONFIG = {
  color:    "Black",
  style:    "Tactical Cobra Weave",
  length:   "7in",
  material: "550 Paracord",
  clasp:    "Sliding Knot",
};

/** King Cobra + Neon accent + Steel Shackle — the primary scenario from the issue. */
const KING_COBRA_NEON_SHACKLE_CONFIG = {
  color:    "Neon Blue",
  style:    "King Cobra Weave",
  length:   "7in",
  material: "550 Paracord",
  clasp:    "Shackle Clasp",
};

// ── calculateBraceletPrice — base price ───────────────────────────────────────

describe("calculateBraceletPrice — base price", () => {
  test("returns base price for the standard (no add-on) configuration", () => {
    const result = calculateBraceletPrice(BASE_CONFIG);
    expect(result.base).toBe(BRACELET_BASE_PRICE);
    expect(result.total).toBe(24.99);
    expect(result.adjustments).toHaveLength(0);
  });

  test("base price is $24.99", () => {
    expect(BRACELET_BASE_PRICE).toBe(24.99);
  });
});

// ── calculateBraceletPrice — weave adjustments ────────────────────────────────

describe("calculateBraceletPrice — weave adjustments", () => {
  test("Tactical Cobra Weave adds no surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, style: "Tactical Cobra Weave" });
    expect(result.total).toBe(24.99);
    expect(result.adjustments.find((a) => a.label === "Tactical Cobra Weave")).toBeUndefined();
  });

  test("King Cobra Weave adds +$6", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, style: "King Cobra Weave" });
    expect(result.adjustments).toContainEqual({ label: "King Cobra Weave", amount: 6 });
    expect(result.total).toBe(30.99);
  });

  test("Solomon Bar adds +$3", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, style: "Solomon Bar" });
    expect(result.adjustments).toContainEqual({ label: "Solomon Bar", amount: 3 });
    expect(result.total).toBe(27.99);
  });

  test("Fishtail adds +$3", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, style: "Fishtail" });
    expect(result.adjustments).toContainEqual({ label: "Fishtail", amount: 3 });
    expect(result.total).toBe(27.99);
  });

  test("WEAVE_ADJUSTMENTS exports the correct values", () => {
    expect(WEAVE_ADJUSTMENTS["Tactical Cobra Weave"]).toBe(0);
    expect(WEAVE_ADJUSTMENTS["King Cobra Weave"]).toBe(6);
    expect(WEAVE_ADJUSTMENTS["Solomon Bar"]).toBe(3);
    expect(WEAVE_ADJUSTMENTS["Fishtail"]).toBe(3);
  });
});

// ── calculateBraceletPrice — hardware adjustments ─────────────────────────────

describe("calculateBraceletPrice — hardware / clasp adjustments", () => {
  test("Sliding Knot clasp adds no surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, clasp: "Sliding Knot" });
    expect(result.total).toBe(24.99);
  });

  test("Buckle Clasp adds no surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, clasp: "Buckle Clasp" });
    expect(result.total).toBe(24.99);
  });

  test("Shackle Clasp (steel hardware) adds +$5", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, clasp: "Shackle Clasp" });
    expect(result.adjustments).toContainEqual({ label: "Shackle Clasp", amount: 5 });
    expect(result.total).toBe(29.99);
  });

  test("HARDWARE_ADJUSTMENTS exports the correct values", () => {
    expect(HARDWARE_ADJUSTMENTS["Sliding Knot"]).toBe(0);
    expect(HARDWARE_ADJUSTMENTS["Buckle Clasp"]).toBe(0);
    expect(HARDWARE_ADJUSTMENTS["Shackle Clasp"]).toBe(5);
  });
});

// ── calculateBraceletPrice — neon accent ──────────────────────────────────────

describe("calculateBraceletPrice — neon accent", () => {
  test("Black color adds no neon accent surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, color: "Black" });
    expect(result.total).toBe(24.99);
    expect(result.adjustments.find((a) => a.label === "Neon Accent")).toBeUndefined();
  });

  test("Neon Blue color triggers +$2 neon accent surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, color: "Neon Blue" });
    expect(result.adjustments).toContainEqual({ label: "Neon Accent", amount: 2 });
    expect(result.total).toBe(26.99);
  });

  test("Black & Neon Blue color triggers +$2 neon accent surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, color: "Black & Neon Blue" });
    expect(result.adjustments).toContainEqual({ label: "Neon Accent", amount: 2 });
    expect(result.total).toBe(26.99);
  });

  test("Olive Drab color adds no neon accent surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, color: "Olive Drab" });
    expect(result.total).toBe(24.99);
  });

  test("Desert Tan color adds no neon accent surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, color: "Desert Tan" });
    expect(result.total).toBe(24.99);
  });

  test("NEON_ACCENT_COLORS includes 'Neon Blue' and 'Black & Neon Blue'", () => {
    expect(NEON_ACCENT_COLORS).toContain("Neon Blue");
    expect(NEON_ACCENT_COLORS).toContain("Black & Neon Blue");
  });

  test("NEON_ACCENT_ADJUSTMENT is $2", () => {
    expect(NEON_ACCENT_ADJUSTMENT).toBe(2);
  });
});

// ── calculateBraceletPrice — oversize surcharge ───────────────────────────────

describe("calculateBraceletPrice — oversize surcharge", () => {
  test("7in wrist (not oversize) adds no surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, length: "7in" });
    expect(result.total).toBe(24.99);
    expect(result.adjustments.find((a) => a.label === "Oversize")).toBeUndefined();
  });

  test("8in wrist (not oversize) adds no surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, length: "8in" });
    expect(result.total).toBe(24.99);
  });

  test("9in wrist (oversize: > 8.5in) adds +$3 surcharge", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, length: "9in" });
    expect(result.adjustments).toContainEqual({ label: "Oversize", amount: 3 });
    expect(result.total).toBe(27.99);
  });

  test("OVERSIZE_WRIST_THRESHOLD is 8.5 inches", () => {
    expect(OVERSIZE_WRIST_THRESHOLD).toBe(8.5);
  });

  test("OVERSIZE_ADJUSTMENT is $3", () => {
    expect(OVERSIZE_ADJUSTMENT).toBe(3);
  });
});

// ── calculateBraceletPrice — King Cobra + Neon + Steel Shackle ────────────────

describe("calculateBraceletPrice — King Cobra bracelet with neon accent and steel shackle", () => {
  test("returns a breakdown with three adjustments", () => {
    const result = calculateBraceletPrice(KING_COBRA_NEON_SHACKLE_CONFIG);
    expect(result.adjustments).toHaveLength(3);
  });

  test("includes King Cobra Weave (+$6) adjustment", () => {
    const result = calculateBraceletPrice(KING_COBRA_NEON_SHACKLE_CONFIG);
    expect(result.adjustments).toContainEqual({ label: "King Cobra Weave", amount: 6 });
  });

  test("includes Shackle Clasp (+$5) adjustment", () => {
    const result = calculateBraceletPrice(KING_COBRA_NEON_SHACKLE_CONFIG);
    expect(result.adjustments).toContainEqual({ label: "Shackle Clasp", amount: 5 });
  });

  test("includes Neon Accent (+$2) adjustment", () => {
    const result = calculateBraceletPrice(KING_COBRA_NEON_SHACKLE_CONFIG);
    expect(result.adjustments).toContainEqual({ label: "Neon Accent", amount: 2 });
  });

  test("total is $37.99 (base $24.99 + King Cobra $6 + Shackle $5 + Neon $2)", () => {
    const result = calculateBraceletPrice(KING_COBRA_NEON_SHACKLE_CONFIG);
    expect(result.total).toBe(37.99);
  });

  test("base field is always $24.99 regardless of add-ons", () => {
    const result = calculateBraceletPrice(KING_COBRA_NEON_SHACKLE_CONFIG);
    expect(result.base).toBe(24.99);
  });

  test("also works with Black & Neon Blue (two-tone neon accent)", () => {
    const config = { ...KING_COBRA_NEON_SHACKLE_CONFIG, color: "Black & Neon Blue" };
    const result = calculateBraceletPrice(config);
    expect(result.total).toBe(37.99);
  });
});

// ── calculateBraceletPrice — combined oversize scenario ───────────────────────

describe("calculateBraceletPrice — King Cobra + Neon + Shackle + Oversize (9in)", () => {
  test("total is $40.99 (base $24.99 + $6 + $5 + $2 + $3 oversize)", () => {
    const config = { ...KING_COBRA_NEON_SHACKLE_CONFIG, length: "9in" };
    const result = calculateBraceletPrice(config);
    expect(result.adjustments).toHaveLength(4);
    expect(result.total).toBe(40.99);
  });
});

// ── calculateBraceletPrice — psychological pricing ────────────────────────────

describe("calculateBraceletPrice — psychological .99 pricing", () => {
  test("all valid configurations produce a price ending in .99", () => {
    const configs = [
      BASE_CONFIG,
      { ...BASE_CONFIG, style: "King Cobra Weave" },
      { ...BASE_CONFIG, clasp: "Shackle Clasp" },
      { ...BASE_CONFIG, color: "Neon Blue" },
      { ...BASE_CONFIG, length: "9in" },
      KING_COBRA_NEON_SHACKLE_CONFIG,
    ];
    for (const config of configs) {
      const { total } = calculateBraceletPrice(config);
      expect(total % 1).toBeCloseTo(0.99, 5);
    }
  });
});

// ── calculateBraceletPrice — return shape ─────────────────────────────────────

describe("calculateBraceletPrice — return shape", () => {
  test("returns an object with base, adjustments, and total", () => {
    const result = calculateBraceletPrice(BASE_CONFIG);
    expect(result).toHaveProperty("base");
    expect(result).toHaveProperty("adjustments");
    expect(result).toHaveProperty("total");
  });

  test("adjustments is an array", () => {
    expect(Array.isArray(calculateBraceletPrice(BASE_CONFIG).adjustments)).toBe(true);
  });

  test("each adjustment has a label (string) and amount (number)", () => {
    const { adjustments } = calculateBraceletPrice(KING_COBRA_NEON_SHACKLE_CONFIG);
    for (const adj of adjustments) {
      expect(typeof adj.label).toBe("string");
      expect(typeof adj.amount).toBe("number");
    }
  });

  test("total is a number", () => {
    expect(typeof calculateBraceletPrice(BASE_CONFIG).total).toBe("number");
  });
});

// ── calculateBraceletPrice — error handling ───────────────────────────────────

describe("calculateBraceletPrice — error handling", () => {
  test("throws TypeError when config is null", () => {
    expect(() => calculateBraceletPrice(null)).toThrow(TypeError);
  });

  test("throws TypeError when config is undefined", () => {
    expect(() => calculateBraceletPrice(undefined)).toThrow(TypeError);
  });

  test("throws TypeError when config is an array", () => {
    expect(() => calculateBraceletPrice([])).toThrow(TypeError);
  });

  test("returns base price when style is unknown (no adjustment applied)", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, style: "Unknown Weave" });
    expect(result.total).toBe(24.99);
  });

  test("returns base price when clasp is unknown (no adjustment applied)", () => {
    const result = calculateBraceletPrice({ ...BASE_CONFIG, clasp: "Unknown Clasp" });
    expect(result.total).toBe(24.99);
  });
});

// ── buildLineItems — live pricing for bracelet items ──────────────────────────

describe("buildLineItems — live pricing for King Cobra bracelet", () => {
  test("uses live-calculated price (not static catalog price) for bracelet items", () => {
    const cartResult = validateCart([
      { id: 19, quantity: 1, config: KING_COBRA_NEON_SHACKLE_CONFIG },
    ]);
    expect(cartResult.valid).toBe(true);

    const lineItems = buildLineItems(cartResult.items);
    // King Cobra + Neon + Shackle = $37.99 → 3799 cents
    expect(lineItems[0].price_data.unit_amount).toBe(3799);
  });

  test("King Cobra + Neon + Shackle line item is $37.99 (3799 cents)", () => {
    const cartResult = validateCart([
      { id: 19, quantity: 1, config: KING_COBRA_NEON_SHACKLE_CONFIG },
    ]);
    const lineItems = buildLineItems(cartResult.items);
    expect(lineItems[0].price_data.unit_amount).toBe(3799);
  });

  test("standard bracelet (no add-ons) line item is $24.99 (2499 cents)", () => {
    const cartResult = validateCart([
      { id: 19, quantity: 1, config: BASE_CONFIG },
    ]);
    expect(cartResult.valid).toBe(true);
    const lineItems = buildLineItems(cartResult.items);
    expect(lineItems[0].price_data.unit_amount).toBe(2499);
  });

  test("non-bracelet items use the static catalog price unchanged", () => {
    const cartResult = validateCart([{ id: 14, quantity: 2 }]);
    expect(cartResult.valid).toBe(true);
    const lineItems = buildLineItems(cartResult.items);
    // Edge Control catalog price = $12 → 1200 cents
    expect(lineItems[0].price_data.unit_amount).toBe(1200);
  });

  test("bracelet line item description includes configuration details", () => {
    const cartResult = validateCart([
      { id: 19, quantity: 1, config: KING_COBRA_NEON_SHACKLE_CONFIG },
    ]);
    const lineItems = buildLineItems(cartResult.items);
    const desc = lineItems[0].price_data.product_data.description;
    expect(desc).toContain("King Cobra Weave");
    expect(desc).toContain("Neon Blue");
    expect(desc).toContain("Shackle Clasp");
  });
});
