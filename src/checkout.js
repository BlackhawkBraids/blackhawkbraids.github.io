/**
 * Checkout module for BlackhawkBraids.
 * Handles server-side cart validation, US-only shipping enforcement,
 * discount-code application, stock deduction, and Stripe line-item
 * construction.
 *
 * All prices are sourced from the authoritative server-side product catalog —
 * client-submitted prices are never trusted.
 *
 * Paracord bracelet items may carry an optional `config` field.  When
 * present, each configuration value is validated against the product's
 * `configOptions` allowlist, and the final price is calculated live by
 * bracelet-pricing.js rather than using the catalog's static base price.
 */

"use strict";

const { products } = require("./products");
const { validateBraceletConfig, formatBraceletConfig } = require("./bracelet-config");
const { calculateBraceletPrice } = require("./bracelet-pricing");

/** Countries to which shipping is permitted. */
const ALLOWED_COUNTRIES = ["US"];

/**
 * Discount code registry.
 * Each entry maps a code (upper-case) to its discount rule:
 *   - type "percent"  → percentage off the subtotal (0–100)
 *   - type "flat"     → fixed dollar amount off the subtotal
 */
const DISCOUNT_CODES = {
  BRAID10:  { type: "percent", value: 10 },
  BRAID20:  { type: "percent", value: 20 },
  WELCOME5: { type: "flat",    value: 5  },
  SAVE15:   { type: "flat",    value: 15 },
};

/**
 * @typedef {{ id: number, name: string, price: number, stock: number, description: string, category: string, configOptions?: object }} Product
 * @typedef {{ product: Product, quantity: number, config?: object }} ValidatedItem
 */

/**
 * Validates cart items against the authoritative product catalog.
 * Looks up each product by ID and uses the catalog price, ignoring any
 * price submitted by the client.
 *
 * For paracord-bracelet products, an optional `config` field on the cart
 * item is validated against the product's `configOptions` allowlist.
 *
 * @param {Array<{id: number|string, quantity: number|string, config?: object}>} cartItems
 * @returns {{ valid: true, items: ValidatedItem[] } | { valid: false, error: string }}
 */
function validateCart(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { valid: false, error: "Cart must be a non-empty array." };
  }

  const validated = [];

  for (const item of cartItems) {
    const id       = Number(item.id);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(id) || id <= 0) {
      return { valid: false, error: `Invalid product ID: ${item.id}` };
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return {
        valid: false,
        error: `Invalid quantity for product ${id}: must be between 1 and 99.`,
      };
    }

    const product = products.find((p) => p.id === id);
    if (!product) {
      return { valid: false, error: `Product not found: ${id}` };
    }

    // Validate bracelet configuration when the product supports it.
    if (product.category === "paracord-bracelets") {
      if (!item.config) {
        return {
          valid: false,
          error: `Bracelet configuration is required for product ${id}.`,
        };
      }
      const configResult = validateBraceletConfig(item.config, product.configOptions);
      if (!configResult.valid) {
        return { valid: false, error: configResult.error };
      }
    }

    validated.push({
      product,
      quantity,
      ...(item.config ? { config: item.config } : {}),
    });
  }

  return { valid: true, items: validated };
}

/**
 * Validates that the shipping destination is within the United States.
 *
 * @param {string} country - ISO 3166-1 alpha-2 country code (e.g. "US")
 * @returns {{ valid: boolean, error?: string }}
 */
function validateUSShipping(country) {
  if (!country || typeof country !== "string") {
    return { valid: false, error: "Shipping country is required." };
  }

  if (!ALLOWED_COUNTRIES.includes(country.trim().toUpperCase())) {
    return {
      valid: false,
      error: "Shipping is only available within the United States.",
    };
  }

  return { valid: true };
}

/**
 * Applies a discount code to a subtotal.
 *
 * @param {string} code    - The discount code entered by the customer.
 * @param {number} subtotal - The order subtotal in dollars (before discount).
 * @returns {{
 *   valid: boolean,
 *   discountAmount?: number,
 *   total?: number,
 *   error?: string
 * }}
 */
function applyDiscount(code, subtotal) {
  if (!code || typeof code !== "string") {
    return { valid: false, error: "Discount code is required." };
  }

  if (typeof subtotal !== "number" || subtotal < 0) {
    return { valid: false, error: "Subtotal must be a non-negative number." };
  }

  const discount = DISCOUNT_CODES[code.trim().toUpperCase()];
  if (!discount) {
    return { valid: false, error: `Invalid discount code: ${code}` };
  }

  let discountAmount;
  if (discount.type === "percent") {
    discountAmount = parseFloat(((subtotal * discount.value) / 100).toFixed(2));
  } else {
    // flat discount — cannot exceed the subtotal
    discountAmount = Math.min(discount.value, subtotal);
  }

  const total = parseFloat((subtotal - discountAmount).toFixed(2));
  return { valid: true, discountAmount, total };
}

/**
 * Deducts ordered quantities from in-memory product stock.
 * Validates that sufficient stock exists for every item before making any
 * changes (all-or-nothing semantics).
 *
 * @param {ValidatedItem[]} validatedItems - Output of a successful validateCart call.
 * @returns {{ success: boolean, error?: string }}
 */
function deductStock(validatedItems) {
  if (!Array.isArray(validatedItems) || validatedItems.length === 0) {
    return { success: false, error: "No items provided for stock deduction." };
  }

  // First pass: check availability for all items before mutating anything.
  for (const { product, quantity } of validatedItems) {
    const catalog = products.find((p) => p.id === product.id);
    if (!catalog) {
      return { success: false, error: `Product not found in catalog: ${product.id}` };
    }
    if (catalog.stock < quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${catalog.name}": ${catalog.stock} available, ${quantity} requested.`,
      };
    }
  }

  // Second pass: commit the deductions.
  for (const { product, quantity } of validatedItems) {
    const catalog = products.find((p) => p.id === product.id);
    catalog.stock -= quantity;
  }

  return { success: true };
}

/**
 * Builds a Stripe `line_items` array from server-validated cart items.
 * Prices are converted from dollars to cents as required by Stripe.
 *
 * For paracord-bracelet items the customer's validated configuration is
 * appended to the product description, and the live price is calculated
 * by calculateBraceletPrice() rather than the static catalog price.
 *
 * @param {ValidatedItem[]} validatedItems
 * @returns {Array} Stripe line_items array
 */
function buildLineItems(validatedItems) {
  return validatedItems.map(({ product, quantity, config }) => {
    let description = product.description;
    let price = product.price;

    if (config && product.category === "paracord-bracelets") {
      description = formatBraceletConfig(config);
      price = calculateBraceletPrice(config).total;
    }

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description,
        },
        unit_amount: Math.round(price * 100),
      },
      quantity,
    };
  });
}

module.exports = {
  validateCart,
  validateUSShipping,
  applyDiscount,
  deductStock,
  buildLineItems,
  ALLOWED_COUNTRIES,
  DISCOUNT_CODES,
};
