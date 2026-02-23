"use strict";

const {
  validateBraceletConfig,
  formatBraceletConfig,
  REQUIRED_CONFIG_KEYS,
} = require("../src/bracelet-config");

const { validateCart, buildLineItems } = require("../src/checkout");
const { products } = require("../src/products");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Valid bracelet configuration used as the baseline for most tests. */
const VALID_CONFIG = {
  color:    "Black & Neon Blue",
  style:    "Tactical Cobra Weave",
  length:   "7in",
  material: "550 Paracord",
  clasp:    "Sliding Knot",
};

/** configOptions from the paracord bracelet product. */
const bracelet = products.find((p) => p.id === 19);
const CONFIG_OPTIONS = bracelet.configOptions;

// ── validateBraceletConfig ────────────────────────────────────────────────────

describe("validateBraceletConfig", () => {
  test("accepts a fully valid configuration", () => {
    expect(validateBraceletConfig(VALID_CONFIG, CONFIG_OPTIONS).valid).toBe(true);
  });

  test("accepts every valid colour option", () => {
    for (const color of CONFIG_OPTIONS.color) {
      const result = validateBraceletConfig({ ...VALID_CONFIG, color }, CONFIG_OPTIONS);
      expect(result.valid).toBe(true);
    }
  });

  test("accepts every valid weave style", () => {
    for (const style of CONFIG_OPTIONS.style) {
      const result = validateBraceletConfig({ ...VALID_CONFIG, style }, CONFIG_OPTIONS);
      expect(result.valid).toBe(true);
    }
  });

  test("accepts every valid length", () => {
    for (const length of CONFIG_OPTIONS.length) {
      const result = validateBraceletConfig({ ...VALID_CONFIG, length }, CONFIG_OPTIONS);
      expect(result.valid).toBe(true);
    }
  });

  test("accepts every valid material", () => {
    for (const material of CONFIG_OPTIONS.material) {
      const result = validateBraceletConfig({ ...VALID_CONFIG, material }, CONFIG_OPTIONS);
      expect(result.valid).toBe(true);
    }
  });

  test("accepts every valid clasp type", () => {
    for (const clasp of CONFIG_OPTIONS.clasp) {
      const result = validateBraceletConfig({ ...VALID_CONFIG, clasp }, CONFIG_OPTIONS);
      expect(result.valid).toBe(true);
    }
  });

  test("rejects an invalid colour", () => {
    const result = validateBraceletConfig(
      { ...VALID_CONFIG, color: "Hot Pink" },
      CONFIG_OPTIONS
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid value/i);
    expect(result.error).toMatch(/color/i);
  });

  test("rejects an invalid weave style", () => {
    const result = validateBraceletConfig(
      { ...VALID_CONFIG, style: "Double Helix" },
      CONFIG_OPTIONS
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/style/i);
  });

  test("rejects an invalid length", () => {
    const result = validateBraceletConfig(
      { ...VALID_CONFIG, length: "10in" },
      CONFIG_OPTIONS
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/length/i);
  });

  test("rejects an invalid material", () => {
    const result = validateBraceletConfig(
      { ...VALID_CONFIG, material: "Rubber" },
      CONFIG_OPTIONS
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/material/i);
  });

  test("rejects an invalid clasp type", () => {
    const result = validateBraceletConfig(
      { ...VALID_CONFIG, clasp: "Magnetic" },
      CONFIG_OPTIONS
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/clasp/i);
  });

  test("returns an error listing allowed values when a value is invalid", () => {
    const result = validateBraceletConfig(
      { ...VALID_CONFIG, color: "Purple" },
      CONFIG_OPTIONS
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Allowed/i);
  });

  test("rejects when a required key is missing", () => {
    const { color: _omit, ...configWithoutColor } = VALID_CONFIG;
    const result = validateBraceletConfig(configWithoutColor, CONFIG_OPTIONS);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/missing/i);
    expect(result.error).toMatch(/color/i);
  });

  test("rejects when config is null", () => {
    expect(validateBraceletConfig(null, CONFIG_OPTIONS).valid).toBe(false);
  });

  test("rejects when config is undefined", () => {
    expect(validateBraceletConfig(undefined, CONFIG_OPTIONS).valid).toBe(false);
  });

  test("rejects when config is an array", () => {
    expect(validateBraceletConfig([], CONFIG_OPTIONS).valid).toBe(false);
  });

  test("rejects when configOptions is null", () => {
    expect(validateBraceletConfig(VALID_CONFIG, null).valid).toBe(false);
  });

  test("rejects when configOptions is undefined", () => {
    expect(validateBraceletConfig(VALID_CONFIG, undefined).valid).toBe(false);
  });

  test("rejects a non-string value for an option", () => {
    const result = validateBraceletConfig(
      { ...VALID_CONFIG, length: 7 },
      CONFIG_OPTIONS
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/length/i);
  });
});

// ── REQUIRED_CONFIG_KEYS ──────────────────────────────────────────────────────

describe("REQUIRED_CONFIG_KEYS", () => {
  test("includes all five required keys", () => {
    expect(REQUIRED_CONFIG_KEYS).toEqual(
      expect.arrayContaining(["color", "style", "length", "material", "clasp"])
    );
    expect(REQUIRED_CONFIG_KEYS).toHaveLength(5);
  });
});

// ── formatBraceletConfig ──────────────────────────────────────────────────────

describe("formatBraceletConfig", () => {
  test("includes all config values in the output", () => {
    const summary = formatBraceletConfig(VALID_CONFIG);
    expect(summary).toContain("Black & Neon Blue");
    expect(summary).toContain("Tactical Cobra Weave");
    expect(summary).toContain("7in");
    expect(summary).toContain("550 Paracord");
    expect(summary).toContain("Sliding Knot");
  });

  test("labels each value with its option key", () => {
    const summary = formatBraceletConfig(VALID_CONFIG);
    expect(summary).toMatch(/color/i);
    expect(summary).toMatch(/style/i);
    expect(summary).toMatch(/length/i);
    expect(summary).toMatch(/material/i);
    expect(summary).toMatch(/clasp/i);
  });

  test("returns a non-empty string", () => {
    expect(typeof formatBraceletConfig(VALID_CONFIG)).toBe("string");
    expect(formatBraceletConfig(VALID_CONFIG).length).toBeGreaterThan(0);
  });
});

// ── validateCart with bracelet config ────────────────────────────────────────

describe("validateCart — paracord bracelet items", () => {
  test("accepts a bracelet item with a valid configuration", () => {
    const result = validateCart([
      { id: 19, quantity: 1, config: VALID_CONFIG },
    ]);
    expect(result.valid).toBe(true);
    expect(result.items[0].config).toEqual(VALID_CONFIG);
  });

  test("rejects a bracelet item missing the config field entirely", () => {
    const result = validateCart([{ id: 19, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/configuration is required/i);
  });

  test("rejects a bracelet item with an invalid colour", () => {
    const result = validateCart([
      { id: 19, quantity: 1, config: { ...VALID_CONFIG, color: "Pink" } },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid value/i);
  });

  test("rejects a bracelet item with a missing config key", () => {
    const { clasp: _omit, ...configWithoutClasp } = VALID_CONFIG;
    const result = validateCart([
      { id: 19, quantity: 1, config: configWithoutClasp },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/missing/i);
  });

  test("does not require config for non-bracelet products", () => {
    const result = validateCart([{ id: 14, quantity: 1 }]);
    expect(result.valid).toBe(true);
  });

  test("handles a mixed cart (bracelet + standard product)", () => {
    const result = validateCart([
      { id: 19, quantity: 1, config: VALID_CONFIG },
      { id: 14, quantity: 2 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  test("validated item stores the config object", () => {
    const result = validateCart([
      { id: 19, quantity: 1, config: VALID_CONFIG },
    ]);
    expect(result.valid).toBe(true);
    expect(result.items[0].config).toEqual(VALID_CONFIG);
  });
});

// ── buildLineItems with bracelet config ───────────────────────────────────────

describe("buildLineItems — paracord bracelet items", () => {
  test("uses the formatted config as the Stripe line-item description", () => {
    const cartResult = validateCart([
      { id: 19, quantity: 1, config: VALID_CONFIG },
    ]);
    expect(cartResult.valid).toBe(true);

    const lineItems = buildLineItems(cartResult.items);
    const desc = lineItems[0].price_data.product_data.description;

    expect(desc).toContain("Black & Neon Blue");
    expect(desc).toContain("Tactical Cobra Weave");
    expect(desc).toContain("7in");
    expect(desc).toContain("550 Paracord");
    expect(desc).toContain("Sliding Knot");
  });

  test("converts bracelet price to cents (2500)", () => {
    const cartResult = validateCart([
      { id: 19, quantity: 1, config: VALID_CONFIG },
    ]);
    expect(cartResult.valid).toBe(true);

    const lineItems = buildLineItems(cartResult.items);
    expect(lineItems[0].price_data.unit_amount).toBe(2500);
  });

  test("uses the product description for non-bracelet items", () => {
    const cartResult = validateCart([{ id: 14, quantity: 1 }]);
    expect(cartResult.valid).toBe(true);

    const lineItems = buildLineItems(cartResult.items);
    expect(lineItems[0].price_data.product_data.description).toBe(
      "Strong-hold edge control gel."
    );
  });

  test("handles a mixed cart — bracelet gets config description, others get product description", () => {
    const cartResult = validateCart([
      { id: 19, quantity: 1, config: VALID_CONFIG },
      { id: 14, quantity: 2 },
    ]);
    expect(cartResult.valid).toBe(true);

    const lineItems = buildLineItems(cartResult.items);
    expect(lineItems[0].price_data.product_data.description).toContain("Black & Neon Blue");
    expect(lineItems[1].price_data.product_data.description).toBe(
      "Strong-hold edge control gel."
    );
  });
});

// ── products.js — bracelet product shape ──────────────────────────────────────

describe("products — paracord bracelet (id 19)", () => {
  test("exists in the catalog", () => {
    expect(bracelet).toBeDefined();
  });

  test("has the expected price of $25", () => {
    expect(bracelet.price).toBe(25);
  });

  test("has category paracord-bracelets", () => {
    expect(bracelet.category).toBe("paracord-bracelets");
  });

  test("has a configOptions object with all five keys", () => {
    expect(bracelet.configOptions).toBeDefined();
    for (const key of REQUIRED_CONFIG_KEYS) {
      expect(bracelet.configOptions[key]).toBeDefined();
      expect(Array.isArray(bracelet.configOptions[key])).toBe(true);
      expect(bracelet.configOptions[key].length).toBeGreaterThan(0);
    }
  });

  test("includes 'Black & Neon Blue' as a colour option", () => {
    expect(bracelet.configOptions.color).toContain("Black & Neon Blue");
  });

  test("includes 'Tactical Cobra Weave' as a style option", () => {
    expect(bracelet.configOptions.style).toContain("Tactical Cobra Weave");
  });
});
