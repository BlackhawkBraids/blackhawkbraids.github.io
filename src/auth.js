/**
 * Authentication module for BlackhawkBraids.
 * Provides password hashing with bcrypt and JWT token management.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const BCRYPT_ROUNDS = 10;
const DEFAULT_TOKEN_EXPIRY = "1h";

/**
 * Hash a plain-text password using bcrypt.
 *
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} The bcrypt hash of the password.
 */
async function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("password must be a non-empty string");
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 *
 * @param {string} password - The plain-text password to verify.
 * @param {string} hash     - The stored bcrypt hash to compare against.
 * @returns {Promise<boolean>} True if the password matches the hash.
 */
async function comparePassword(password, hash) {
  if (typeof password !== "string" || typeof hash !== "string") {
    throw new TypeError("password and hash must be strings");
  }
  return bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT for a user.
 *
 * @param {{ id: number, email: string, role: string }} payload - User identity data to embed.
 * @param {string} secret  - The secret key used to sign the token.
 * @param {string} [expiresIn] - Token lifetime (e.g. "1h", "7d"). Defaults to "1h".
 * @returns {string} A signed JWT string.
 */
function generateToken(payload, secret, expiresIn = DEFAULT_TOKEN_EXPIRY) {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("payload must be an object");
  }
  if (typeof secret !== "string" || secret.length === 0) {
    throw new TypeError("secret must be a non-empty string");
  }
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify and decode a JWT.
 *
 * @param {string} token  - The JWT string to verify.
 * @param {string} secret - The secret key used to verify the token.
 * @returns {{ id: number, email: string, role: string, iat: number, exp: number }}
 *   The decoded token payload.
 * @throws {JsonWebTokenError|TokenExpiredError} If the token is invalid or expired.
 */
function verifyToken(token, secret) {
  if (typeof token !== "string" || token.length === 0) {
    throw new TypeError("token must be a non-empty string");
  }
  if (typeof secret !== "string" || secret.length === 0) {
    throw new TypeError("secret must be a non-empty string");
  }
  return jwt.verify(token, secret);
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
