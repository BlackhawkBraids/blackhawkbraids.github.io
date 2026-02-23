/**
 * In-memory user store for BlackhawkBraids.
 * Manages user accounts with hashed passwords and roles.
 *
 * Roles used in this application:
 *   "customer"  – a registered client booking services
 *   "stylist"   – a staff member who provides services
 *   "admin"     – full administrative access
 */

const { hashPassword, comparePassword } = require("./auth");

/** @type {Map<string, { id: number, email: string, passwordHash: string, role: string, name: string }>} */
const _users = new Map();
let _nextId = 1;

const VALID_ROLES = ["customer", "stylist", "admin"];

/**
 * Register a new user.
 *
 * @param {{ email: string, password: string, name: string, role?: string }} options
 * @returns {Promise<{ id: number, email: string, role: string, name: string }>}
 *   The newly created user (without the password hash).
 * @throws {TypeError}  If required fields are missing or invalid.
 * @throws {RangeError} If the role is not one of the allowed values.
 * @throws {Error}      If a user with that e-mail already exists.
 */
async function registerUser({ email, password, name, role = "customer" }) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new TypeError("email must be a valid e-mail address");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new TypeError("password must be at least 8 characters");
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new TypeError("name must be a non-empty string");
  }
  if (!VALID_ROLES.includes(role)) {
    throw new RangeError(`role must be one of: ${VALID_ROLES.join(", ")}`);
  }

  const normalised = email.toLowerCase().trim();
  if (_users.has(normalised)) {
    throw new Error("A user with that e-mail already exists");
  }

  const passwordHash = await hashPassword(password);
  const id = _nextId++;
  const user = { id, email: normalised, passwordHash, role, name: name.trim() };
  _users.set(normalised, user);

  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

/**
 * Look up a user by e-mail and verify their password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ id: number, email: string, role: string, name: string } | null>}
 *   The public user record if credentials are valid, or null otherwise.
 */
async function authenticateUser(email, password) {
  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }
  const normalised = email.toLowerCase().trim();
  const user = _users.get(normalised);
  if (!user) return null;

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return null;

  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

/**
 * Find a user by e-mail (without the password hash).
 *
 * @param {string} email
 * @returns {{ id: number, email: string, role: string, name: string } | null}
 */
function findUserByEmail(email) {
  if (typeof email !== "string") return null;
  const user = _users.get(email.toLowerCase().trim());
  if (!user) return null;
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

/**
 * Remove all users (useful for resetting state between tests).
 */
function _resetUsers() {
  _users.clear();
  _nextId = 1;
}

module.exports = { registerUser, authenticateUser, findUserByEmail, _resetUsers, VALID_ROLES };
