/**
 * Product filtering module for BlackhawkBraids.
 * Supports filtering by category and price range.
 */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {string} category
 * @property {number} price
 * @property {string} description
 */

/**
 * @typedef {Object} FilterOptions
 * @property {string}  [category]  - Category value to match, or "all" / omitted to include all categories.
 * @property {number}  [minPrice]  - Minimum price (inclusive). Defaults to 0.
 * @property {number}  [maxPrice]  - Maximum price (inclusive). Defaults to Infinity.
 */

/**
 * Filter an array of products by category and/or price range.
 *
 * @param {Product[]} products - The full product list to filter.
 * @param {FilterOptions} options - The active filter criteria.
 * @returns {Product[]} The filtered list of products.
 */
function filterProducts(products, options = {}) {
  const {
    category = "all",
    minPrice = 0,
    maxPrice = Infinity,
  } = options;

  if (!Array.isArray(products)) {
    throw new TypeError("products must be an array");
  }

  const resolvedMin = Number.isFinite(minPrice) ? minPrice : 0;
  const resolvedMax = Number.isFinite(maxPrice) ? maxPrice : Infinity;

  if (resolvedMin < 0) {
    throw new RangeError("minPrice must be >= 0");
  }
  if (resolvedMax < resolvedMin) {
    throw new RangeError("maxPrice must be >= minPrice");
  }

  return products.filter((product) => {
    const matchesCategory =
      !category || category === "all" || product.category === category;

    const matchesPrice =
      product.price >= resolvedMin && product.price <= resolvedMax;

    return matchesCategory && matchesPrice;
  });
}

/**
 * Return the lowest and highest prices found in a product list.
 *
 * @param {Product[]} products
 * @returns {{ min: number, max: number }}
 */
function getPriceRange(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return { min: 0, max: 0 };
  }
  const prices = products.map((p) => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { filterProducts, getPriceRange };
}
