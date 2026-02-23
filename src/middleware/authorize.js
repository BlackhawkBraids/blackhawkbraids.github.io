/**
 * Role-based authorization middleware for BlackhawkBraids.
 * Must be used after the `authenticate` middleware so that `req.user` is set.
 *
 * Roles (least → most privileged):
 *   "customer"  – registered client
 *   "stylist"   – staff member
 *   "admin"     – full administrative access
 */

/**
 * Factory function that returns an Express middleware which allows only
 * users whose role is in `allowedRoles`.
 *
 * @param {...string} allowedRoles - One or more roles that may access the route.
 * @returns {import("express").RequestHandler}
 *
 * @example
 * const authorize = require("./middleware/authorize");
 *
 * // Only admins may access this route
 * router.delete("/users/:id", authenticate(secret), authorize("admin"), deleteUser);
 *
 * // Both stylists and admins may access this route
 * router.get("/appointments", authenticate(secret), authorize("stylist", "admin"), listAppointments);
 */
function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = authorize;
