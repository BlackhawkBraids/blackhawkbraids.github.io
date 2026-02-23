/**
 * Bracelet configuration validation for BlackhawkBraids.
 *
 * Paracord bracelet products (category: "paracord-bracelets") support
 * customer-selectable options (color, style, length, material, clasp).
 * This module provides server-side validation that rejects any value not
 * present in the product's authoritative `configOptions` allowlist, so
 * client-submitted choices can never inject arbitrary strings into Stripe
 * metadata or order records.
 */
"use strict";

/** Required configuration keys for every paracord-bracelet order. */
const REQUIRED_CONFIG_KEYS = ["color", "style", "length", "material", "clasp"];

/**
 * Validates a bracelet configuration object against the product's
 * `configOptions` allowlist.
 *
 * @param {object} config        - The customer-submitted configuration.
 * @param {object} configOptions - The product's allowlist (from products.js).
 * @returns {{ valid: boolean, error?: string }}
 */
function validateBraceletConfig(config, configOptions) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { valid: false, error: "Bracelet configuration is required." };
  }

  if (!configOptions || typeof configOptions !== "object") {
    return { valid: false, error: "Product configuration options are unavailable." };
  }

  for (const key of REQUIRED_CONFIG_KEYS) {
    if (!(key in config)) {
      return { valid: false, error: `Missing bracelet configuration option: "${key}".` };
    }

    const value   = config[key];
    const allowed = configOptions[key];

    if (!Array.isArray(allowed)) {
      return { valid: false, error: `No allowed values defined for bracelet option "${key}".` };
    }

    if (typeof value !== "string" || !allowed.includes(value)) {
      return {
        valid: false,
        error: `Invalid value "${value}" for bracelet option "${key}". Allowed: ${allowed.join(", ")}.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Builds a human-readable summary of the bracelet configuration to include
 * in the Stripe line-item description and session metadata.
 *
 * @param {object} config - A validated bracelet configuration.
 * @returns {string}
 */
function formatBraceletConfig(config) {
  return (
    `Color: ${config.color} | Style: ${config.style} | ` +
    `Length: ${config.length} | Material: ${config.material} | Clasp: ${config.clasp}`
  );
}

module.exports = { validateBraceletConfig, formatBraceletConfig, REQUIRED_CONFIG_KEYS };
