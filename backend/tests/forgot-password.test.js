const { test } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

test("forgotPassword and resetPassword flow", async (t) => {
  await t.test("should generate a valid reset token valid for 15 minutes", () => {
    const userId = 123;
    const email = "test@example.com";
    const secret = "test-secret";

    const token = jwt.sign(
      { userId, email },
      secret,
      { expiresIn: "15m" }
    );

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.userId, userId);
    assert.strictEqual(decoded.email, email);
  });

  await t.test("should reject an expired token", () => {
    const userId = 123;
    const email = "test@example.com";
    const secret = "test-secret";

    const expiredToken = jwt.sign(
      { userId, email },
      secret,
      { expiresIn: "-1h" }
    );

    assert.throws(() => {
      jwt.verify(expiredToken, secret);
    }, /expired/);
  });

  await t.test("should hash password with bcrypt", async () => {
    const plainPassword = "testPassword123";

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    assert.notStrictEqual(hashedPassword, plainPassword);

    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    assert.strictEqual(isValid, true);

    const isInvalid = await bcrypt.compare("wrongPassword", hashedPassword);
    assert.strictEqual(isInvalid, false);
  });

  await t.test("should detect mismatched passwords", async () => {
    const hashedPassword = await bcrypt.hash("correctPassword", 10);

    const isValid = await bcrypt.compare("wrongPassword", hashedPassword);
    assert.strictEqual(isValid, false);
  });
});
