/**
 * Product catalog for BlackhawkBraids.
 * Each product is the authoritative source for server-side price and stock
 * validation. Stock values represent available units; services use a high
 * sentinel (999) to indicate effectively unlimited availability.
 *
 * Paracord bracelet products carry a `configOptions` object that defines the
 * valid choices a customer may select when customising their order.  The
 * server validates submitted configurations against these allowlists before
 * creating a Stripe Checkout Session.  Live pricing is calculated at checkout
 * time by bracelet-pricing.js; the `price` field below is the minimum
 * fallback (base) price only.
 */
"use strict";

const products = [
  // Braiding Services
  { id: 1,  name: "Box Braids",                  category: "braiding-services", price: 150, stock: 999, description: "Classic box braids, any length." },
  { id: 2,  name: "Knotless Braids",             category: "braiding-services", price: 180, stock: 999, description: "Gentle knotless technique for a natural look." },
  { id: 3,  name: "Cornrows",                    category: "braiding-services", price: 80,  stock: 999, description: "Straight-back or custom cornrow patterns." },
  { id: 4,  name: "Senegalese Twists",           category: "braiding-services", price: 160, stock: 999, description: "Smooth two-strand Senegalese twists." },
  { id: 5,  name: "Butterfly Locs",              category: "braiding-services", price: 200, stock: 999, description: "Trendy distressed butterfly locs." },

  // Natural Hair Services
  { id: 6,  name: "Wash & Go",                   category: "natural-hair",      price: 60,  stock: 999, description: "Full wash, condition, and style." },
  { id: 7,  name: "Twist Out",                   category: "natural-hair",      price: 70,  stock: 999, description: "Defined twist-out styling." },
  { id: 8,  name: "Silk Press",                  category: "natural-hair",      price: 90,  stock: 999, description: "Heat-free silk press for a sleek finish." },
  { id: 9,  name: "Deep Conditioning Treatment", category: "natural-hair",      price: 45,  stock: 999, description: "Intensive moisture and protein treatment." },

  // Wigs & Extensions
  { id: 10, name: "Wig Install (No Glue)",        category: "wigs-extensions",   price: 75,  stock: 999, description: "Secure wig install without adhesive." },
  { id: 11, name: "Closure Install",              category: "wigs-extensions",   price: 120, stock: 999, description: "Lace closure install and blend." },
  { id: 12, name: "Frontal Install",              category: "wigs-extensions",   price: 140, stock: 999, description: "Full frontal lace install." },
  { id: 13, name: "Tape-In Extensions",           category: "wigs-extensions",   price: 200, stock: 999, description: "Seamless tape-in hair extensions." },

  // Hair Products
  { id: 14, name: "Edge Control",                category: "hair-products",      price: 12,  stock: 50,  description: "Strong-hold edge control gel." },
  { id: 15, name: "Braid Spray",                 category: "hair-products",      price: 15,  stock: 30,  description: "Moisturizing spray for braids and twists." },
  { id: 16, name: "Deep Conditioner (8 oz)",     category: "hair-products",      price: 22,  stock: 25,  description: "Professional-grade deep conditioner." },
  { id: 17, name: "Hair Oil Blend",              category: "hair-products",      price: 18,  stock: 40,  description: "Nourishing oil blend for scalp health." },
  { id: 18, name: "Braiding Gel",                category: "hair-products",      price: 10,  stock: 60,  description: "Smooth braiding gel for all hair types." },

  // Paracord Bracelets
  {
    id: 19,
    name: "Custom Paracord Bracelet",
    category: "paracord-bracelets",
    price: 24.99,
    stock: 150,
    description: "Handcrafted paracord bracelet — fully customisable weave, colour, length, material, and clasp. Price adjusts live based on selected options.",
    configOptions: {
      color:    ["Black", "Neon Blue", "Black & Neon Blue", "Olive Drab", "Desert Tan"],
      style:    ["Tactical Cobra Weave", "King Cobra Weave", "Solomon Bar", "Fishtail"],
      length:   ["6in", "7in", "8in", "9in"],
      material: ["550 Paracord", "Type III Paracord", "Micro Cord"],
      clasp:    ["Sliding Knot", "Buckle Clasp", "Shackle Clasp"],
    },
  },
];

const categories = [
  { value: "all",                label: "All Categories" },
  { value: "braiding-services",  label: "Braiding Services" },
  { value: "natural-hair",       label: "Natural Hair Services" },
  { value: "wigs-extensions",    label: "Wigs & Extensions" },
  { value: "hair-products",      label: "Hair Products" },
  { value: "paracord-bracelets", label: "Paracord Bracelets" },
];

module.exports = { products, categories };
