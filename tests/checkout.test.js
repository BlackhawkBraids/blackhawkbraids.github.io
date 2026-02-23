"use strict";

const {
  validateCart,
  validateUSShipping,
  buildLineItems,
  ALLOWED_COUNTRIES,
} = require("../src/checkout");

// ── validateCart ─────────────────────────────────────────────────────────────

describe("validateCart", () => {
  test("returns valid result for a well-formed cart", () => {
    const result = validateCart([
      { id: 1, quantity: 1 },
      { id: 14, quantity: 3 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  test("uses catalog data for product details, not client input", () => {
    const result = validateCart([{ id: 14, quantity: 1 }]);
    expect(result.valid).toBe(true);
    expect(result.items[0].product.price).toBe(12);
    expect(result.items[0].product.name).toBe("Edge Control");
  });

  test("returns error for empty array", () => {
    const result = validateCart([]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/non-empty/i);
  });

  test("returns error when cartItems is not an array", () => {
    expect(validateCart(null).valid).toBe(false);
    expect(validateCart("items").valid).toBe(false);
    expect(validateCart(undefined).valid).toBe(false);
  });

  test("returns error for non-existent product ID", () => {
    const result = validateCart([{ id: 9999, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  test("returns error for invalid product ID (zero)", () => {
    const result = validateCart([{ id: 0, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid product id/i);
  });

  test("returns error for invalid product ID (negative)", () => {
    const result = validateCart([{ id: -5, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid product id/i);
  });

  test("returns error for non-integer product ID (float)", () => {
    const result = validateCart([{ id: 1.5, quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid product id/i);
  });

  test("returns error for quantity of zero", () => {
    const result = validateCart([{ id: 1, quantity: 0 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid quantity/i);
  });

  test("returns error for negative quantity", () => {
    const result = validateCart([{ id: 1, quantity: -1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid quantity/i);
  });

  test("returns error when quantity exceeds 99", () => {
    const result = validateCart([{ id: 1, quantity: 100 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid quantity/i);
  });

  test("accepts quantity of 99 (boundary)", () => {
    const result = validateCart([{ id: 1, quantity: 99 }]);
    expect(result.valid).toBe(true);
  });

  test("coerces string IDs and quantities", () => {
    const result = validateCart([{ id: "1", quantity: "2" }]);
    expect(result.valid).toBe(true);
    expect(result.items[0].quantity).toBe(2);
  });
});

// ── validateUSShipping ────────────────────────────────────────────────────────

describe("validateUSShipping", () => {
  test("accepts 'US'", () => {
    expect(validateUSShipping("US").valid).toBe(true);
  });

  test("accepts lowercase 'us'", () => {
    expect(validateUSShipping("us").valid).toBe(true);
  });

  test("accepts 'US' with surrounding whitespace", () => {
    expect(validateUSShipping("  US  ").valid).toBe(true);
  });

  test("rejects 'CA' (Canada)", () => {
    const result = validateUSShipping("CA");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/united states/i);
  });

  test("rejects 'GB' (United Kingdom)", () => {
    const result = validateUSShipping("GB");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/united states/i);
  });

  test("rejects empty string", () => {
    const result = validateUSShipping("");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  test("rejects null", () => {
    expect(validateUSShipping(null).valid).toBe(false);
  });

  test("rejects undefined", () => {
    expect(validateUSShipping(undefined).valid).toBe(false);
  });

  test("rejects a number", () => {
    expect(validateUSShipping(1).valid).toBe(false);
  });
});

// ── buildLineItems ────────────────────────────────────────────────────────────

describe("buildLineItems", () => {
  const validatedItems = [
    {
      product:  { id: 14, name: "Edge Control", description: "Strong-hold edge control gel.", price: 12 },
      quantity: 2,
    },
    {
      product:  { id: 1, name: "Box Braids", description: "Classic box braids, any length.", price: 150 },
      quantity: 1,
    },
  ];

  test("returns an array with the same length as input", () => {
    expect(buildLineItems(validatedItems)).toHaveLength(2);
  });

  test("converts price from dollars to cents", () => {
    const items = buildLineItems(validatedItems);
    expect(items[0].price_data.unit_amount).toBe(1200);
    expect(items[1].price_data.unit_amount).toBe(15000);
  });

  test("passes product name and description to Stripe", () => {
    const items = buildLineItems(validatedItems);
    expect(items[0].price_data.product_data.name).toBe("Edge Control");
    expect(items[0].price_data.product_data.description).toBe("Strong-hold edge control gel.");
  });

  test("sets currency to usd", () => {
    const items = buildLineItems(validatedItems);
    items.forEach((item) => {
      expect(item.price_data.currency).toBe("usd");
    });
  });

  test("preserves quantity", () => {
    const items = buildLineItems(validatedItems);
    expect(items[0].quantity).toBe(2);
    expect(items[1].quantity).toBe(1);
  });
});

// ── ALLOWED_COUNTRIES ─────────────────────────────────────────────────────────

describe("ALLOWED_COUNTRIES", () => {
  test("contains only 'US'", () => {
    expect(ALLOWED_COUNTRIES).toEqual(["US"]);
  });
});
