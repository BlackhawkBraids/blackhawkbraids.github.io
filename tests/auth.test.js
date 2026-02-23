/**
 * Tests for the BlackhawkBraids authentication system.
 * Uses Node.js built-in test runner (node:test).
 */

const { describe, it, before, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const { hashPassword, comparePassword, generateToken, verifyToken } = require("../src/auth");
const { registerUser, authenticateUser, findUserByEmail, _resetUsers } = require("../src/users");
const authenticate = require("../src/middleware/authenticate");
const authorize = require("../src/middleware/authorize");

const TEST_SECRET = "test-secret-key-do-not-use-in-production";

// ── auth.js ───────────────────────────────────────────────────────────────────

describe("hashPassword", () => {
  it("returns a non-empty hash string", async () => {
    const hash = await hashPassword("mysecretpass");
    assert.equal(typeof hash, "string");
    assert.ok(hash.length > 0);
  });

  it("produces a different hash on each call (salt)", async () => {
    const hash1 = await hashPassword("samepassword");
    const hash2 = await hashPassword("samepassword");
    assert.notEqual(hash1, hash2);
  });

  it("throws TypeError for an empty password", async () => {
    await assert.rejects(() => hashPassword(""), TypeError);
  });

  it("throws TypeError for a non-string password", async () => {
    await assert.rejects(() => hashPassword(123), TypeError);
  });
});

describe("comparePassword", () => {
  it("returns true when the password matches the hash", async () => {
    const hash = await hashPassword("correcthorsebatterystaple");
    const result = await comparePassword("correcthorsebatterystaple", hash);
    assert.equal(result, true);
  });

  it("returns false when the password does not match", async () => {
    const hash = await hashPassword("correcthorsebatterystaple");
    const result = await comparePassword("wrongpassword", hash);
    assert.equal(result, false);
  });

  it("throws TypeError for non-string arguments", async () => {
    await assert.rejects(() => comparePassword(null, "hash"), TypeError);
  });
});

describe("generateToken", () => {
  it("returns a string with three dot-separated JWT parts", () => {
    const token = generateToken({ id: 1, email: "a@b.com", role: "customer" }, TEST_SECRET);
    assert.equal(typeof token, "string");
    assert.equal(token.split(".").length, 3);
  });

  it("throws TypeError when payload is not an object", () => {
    assert.throws(() => generateToken("bad", TEST_SECRET), TypeError);
  });

  it("throws TypeError when secret is empty", () => {
    assert.throws(() => generateToken({ id: 1 }, ""), TypeError);
  });
});

describe("verifyToken", () => {
  it("decodes a valid token and returns the payload", () => {
    const payload = { id: 7, email: "user@example.com", role: "stylist" };
    const token = generateToken(payload, TEST_SECRET);
    const decoded = verifyToken(token, TEST_SECRET);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.role, payload.role);
  });

  it("throws when the secret is wrong", () => {
    const token = generateToken({ id: 1 }, TEST_SECRET);
    assert.throws(() => verifyToken(token, "wrong-secret"));
  });

  it("throws when the token is expired", async () => {
    const token = generateToken({ id: 1 }, TEST_SECRET, "1ms");
    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.throws(() => verifyToken(token, TEST_SECRET));
  });

  it("throws TypeError for an empty token", () => {
    assert.throws(() => verifyToken("", TEST_SECRET), TypeError);
  });
});

// ── users.js ──────────────────────────────────────────────────────────────────

describe("registerUser", () => {
  beforeEach(() => _resetUsers());

  it("creates a user and returns the public record", async () => {
    const user = await registerUser({
      email: "alice@example.com",
      password: "Password1!",
      name: "Alice",
    });
    assert.equal(user.email, "alice@example.com");
    assert.equal(user.name, "Alice");
    assert.equal(user.role, "customer");
    assert.ok(typeof user.id === "number");
    assert.equal(user.passwordHash, undefined);
  });

  it("allows explicit role assignment", async () => {
    const user = await registerUser({
      email: "bob@example.com",
      password: "Password1!",
      name: "Bob",
      role: "stylist",
    });
    assert.equal(user.role, "stylist");
  });

  it("rejects duplicate e-mails", async () => {
    await registerUser({ email: "dup@example.com", password: "Password1!", name: "Dup" });
    await assert.rejects(
      () => registerUser({ email: "dup@example.com", password: "Password1!", name: "Dup2" }),
      /already exists/
    );
  });

  it("is case-insensitive for e-mail", async () => {
    await registerUser({ email: "Case@Example.COM", password: "Password1!", name: "Case" });
    await assert.rejects(
      () => registerUser({ email: "case@example.com", password: "Password1!", name: "Case2" }),
      /already exists/
    );
  });

  it("throws TypeError for a short password", async () => {
    await assert.rejects(
      () => registerUser({ email: "short@example.com", password: "short", name: "Short" }),
      TypeError
    );
  });

  it("throws RangeError for an invalid role", async () => {
    await assert.rejects(
      () => registerUser({ email: "bad@example.com", password: "Password1!", name: "Bad", role: "superuser" }),
      RangeError
    );
  });
});

describe("authenticateUser", () => {
  before(async () => {
    _resetUsers();
    await registerUser({ email: "login@example.com", password: "MyPassword1!", name: "Login" });
  });

  it("returns the user record for valid credentials", async () => {
    const user = await authenticateUser("login@example.com", "MyPassword1!");
    assert.ok(user !== null);
    assert.equal(user.email, "login@example.com");
    assert.equal(user.passwordHash, undefined);
  });

  it("returns null for a wrong password", async () => {
    const user = await authenticateUser("login@example.com", "WrongPassword!");
    assert.equal(user, null);
  });

  it("returns null for an unknown e-mail", async () => {
    const user = await authenticateUser("nobody@example.com", "Password1!");
    assert.equal(user, null);
  });

  it("is case-insensitive for e-mail during login", async () => {
    const user = await authenticateUser("LOGIN@EXAMPLE.COM", "MyPassword1!");
    assert.ok(user !== null);
  });
});

describe("findUserByEmail", () => {
  before(async () => {
    _resetUsers();
    await registerUser({ email: "find@example.com", password: "Password1!", name: "Find" });
  });

  it("returns the public user record when found", () => {
    const user = findUserByEmail("find@example.com");
    assert.ok(user !== null);
    assert.equal(user.email, "find@example.com");
    assert.equal(user.passwordHash, undefined);
  });

  it("returns null for an unknown e-mail", () => {
    const user = findUserByEmail("ghost@example.com");
    assert.equal(user, null);
  });
});

// ── middleware/authenticate.js ────────────────────────────────────────────────

describe("authenticate middleware", () => {
  const makeReqRes = (token) => {
    const req = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    const res = {
      _status: null,
      _body: null,
      status(code) { this._status = code; return this; },
      json(body)   { this._body = body; return this; },
    };
    return { req, res };
  };

  it("calls next() and sets req.user for a valid token", (_, done) => {
    const token = generateToken({ id: 1, email: "mw@example.com", role: "admin" }, TEST_SECRET);
    const { req, res } = makeReqRes(token);
    const mw = authenticate(TEST_SECRET);
    mw(req, res, () => {
      assert.equal(req.user.email, "mw@example.com");
      assert.equal(req.user.role, "admin");
      done();
    });
  });

  it("returns 401 when no Authorization header is present", (_, done) => {
    const { req, res } = makeReqRes(null);
    const mw = authenticate(TEST_SECRET);
    mw(req, res, () => done(new Error("next() should not have been called")));
    setImmediate(() => {
      assert.equal(res._status, 401);
      done();
    });
  });

  it("returns 401 for an invalid token", (_, done) => {
    const { req, res } = makeReqRes("not.a.valid.token");
    const mw = authenticate(TEST_SECRET);
    mw(req, res, () => done(new Error("next() should not have been called")));
    setImmediate(() => {
      assert.equal(res._status, 401);
      done();
    });
  });

  it("returns 401 for a token signed with the wrong secret", (_, done) => {
    const token = generateToken({ id: 1, role: "customer" }, "different-secret");
    const { req, res } = makeReqRes(token);
    const mw = authenticate(TEST_SECRET);
    mw(req, res, () => done(new Error("next() should not have been called")));
    setImmediate(() => {
      assert.equal(res._status, 401);
      done();
    });
  });
});

// ── middleware/authorize.js ───────────────────────────────────────────────────

describe("authorize middleware", () => {
  const makeReq = (role) => ({ user: role ? { id: 1, role } : undefined });
  const makeRes = () => {
    const res = {
      _status: null,
      _body: null,
      status(code) { this._status = code; return this; },
      json(body)   { this._body = body; return this; },
    };
    return res;
  };

  it("calls next() when the user role is allowed", (_, done) => {
    const mw = authorize("admin");
    mw(makeReq("admin"), makeRes(), () => done());
  });

  it("calls next() when any of multiple allowed roles match", (_, done) => {
    const mw = authorize("stylist", "admin");
    mw(makeReq("stylist"), makeRes(), () => done());
  });

  it("returns 403 when the role is not in the allowed list", (_, done) => {
    const res = makeRes();
    const mw = authorize("admin");
    mw(makeReq("customer"), res, () => done(new Error("next() should not have been called")));
    setImmediate(() => {
      assert.equal(res._status, 403);
      done();
    });
  });

  it("returns 401 when req.user is not set", (_, done) => {
    const res = makeRes();
    const mw = authorize("admin");
    mw(makeReq(null), res, () => done(new Error("next() should not have been called")));
    setImmediate(() => {
      assert.equal(res._status, 401);
      done();
    });
  });
});
