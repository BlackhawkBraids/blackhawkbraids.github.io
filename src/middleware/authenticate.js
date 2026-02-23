/**
 * Authentication middleware for BlackhawkBraids.
 * Verifies the JWT sent in the Authorization header and attaches the
 * decoded user payload to `req.user`.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */

const { verifyToken } = require("../auth");

/**
 * Factory function that returns an Express middleware which validates a JWT.
 *
 * @param {string} secret - The JWT secret used to verify tokens.
 * @returns {import("express").RequestHandler}
 *
 * @example
 * const authenticate = require("./middleware/authenticate");
 * app.use("/api", authenticate(process.env.JWT_SECRET));
 */
function authenticate(secret) {
  return function (req, res, next) {
    const authHeader = req.headers && req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    try {
      req.user = verifyToken(token, secret);
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

module.exports = authenticate;
