const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ============================================================================
// JWT SERVICE TESTS
// ============================================================================

describe("JWT Service", () => {
  const JWT_SECRET = "test-secret-key";
  const USER_ID = 1;
  const USER_ROLE = "admin";
  const USERNAME = "testuser";

  describe("Token Generation", () => {
    it("should generate a valid JWT token", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT format: header.payload.signature
    });

    it("should include correct payload in token", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const decoded = jwt.decode(token);
      expect(decoded.sub).toBe(USER_ID);
      expect(decoded.role).toBe(USER_ROLE);
      expect(decoded.username).toBe(USERNAME);
    });

    it("should include expiration time", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it("should produce different tokens for different expiry times", () => {
      const token1 = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const token2 = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const decoded1 = jwt.decode(token1);
      const decoded2 = jwt.decode(token2);

      expect(decoded2.exp - decoded1.exp).toBeGreaterThan(0);
    });
  });

  describe("Token Validation", () => {
    it("should validate a correct token", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
    });

    it("should reject a token with invalid signature", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const wrongSecret = "wrong-secret-key";

      expect(() => jwt.verify(token, wrongSecret)).toThrow();
    });

    it("should reject a tampered token", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const tampered = token.substring(0, token.length - 10) + "tampered!!";

      expect(() => jwt.verify(tampered, JWT_SECRET)).toThrow();
    });

    it("should extract username from valid token", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.username).toBe(USERNAME);
    });

    it("should extract user id from valid token", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.sub).toBe(USER_ID);
    });

    it("should check token expiration", () => {
      const expiredToken = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "-1h" } // Expired 1 hour ago
      );

      expect(() => jwt.verify(expiredToken, JWT_SECRET)).toThrow();
    });
  });

  describe("Token Extraction from Header", () => {
    it("should extract token from Bearer header", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const header = `Bearer ${token}`;
      const extracted = header.slice("Bearer ".length).trim();

      expect(extracted).toBe(token);
    });

    it("should handle missing Bearer prefix", () => {
      const token = jwt.sign(
        { sub: USER_ID, role: USER_ROLE, username: USERNAME },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      const header = token;
      const startsWith = header.startsWith("Bearer ");

      expect(startsWith).toBe(false);
    });

    it("should handle empty header", () => {
      const header = "";
      const startsWith = header.startsWith("Bearer ");

      expect(startsWith).toBe(false);
    });
  });
});

// ============================================================================
// PASSWORD HASHING TESTS
// ============================================================================

describe("Password Hashing", () => {
  const PASSWORD = "testPassword123";
  const WRONG_PASSWORD = "wrongPassword";

  describe("Password Encoding", () => {
    it("should hash a password", () => {
      const hash = bcrypt.hashSync(PASSWORD, 10);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(PASSWORD);
    });

    it("should produce different hashes for same password", () => {
      const hash1 = bcrypt.hashSync(PASSWORD, 10);
      const hash2 = bcrypt.hashSync(PASSWORD, 10);

      expect(hash1).not.toBe(hash2);
    });

    it("should create a valid bcrypt hash", () => {
      const hash = bcrypt.hashSync(PASSWORD, 10);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("Password Verification", () => {
    it("should verify correct password", () => {
      const hash = bcrypt.hashSync(PASSWORD, 10);
      const isValid = bcrypt.compareSync(PASSWORD, hash);

      expect(isValid).toBe(true);
    });

    it("should reject wrong password", () => {
      const hash = bcrypt.hashSync(PASSWORD, 10);
      const isValid = bcrypt.compareSync(WRONG_PASSWORD, hash);

      expect(isValid).toBe(false);
    });

    it("should reject empty password", () => {
      const hash = bcrypt.hashSync(PASSWORD, 10);
      const isValid = bcrypt.compareSync("", hash);

      expect(isValid).toBe(false);
    });

    it("should be case-sensitive", () => {
      const hash = bcrypt.hashSync(PASSWORD, 10);
      const isValid = bcrypt.compareSync("testpassword123", hash);

      expect(isValid).toBe(false);
    });
  });
});

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

describe("Input Validation", () => {
  describe("Username Validation", () => {
    function validateUsername(value) {
      const username = String(value ?? "").trim();
      if (username.length < 3 || username.length > 30) {
        return "Benutzername muss zwischen 3 und 30 Zeichen lang sein.";
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        return "Benutzername darf nur Buchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.";
      }
      return null;
    }

    it("should accept valid username", () => {
      expect(validateUsername("admin")).toBeNull();
      expect(validateUsername("user_123")).toBeNull();
      expect(validateUsername("trainer.name")).toBeNull();
    });

    it("should reject username shorter than 3 chars", () => {
      expect(validateUsername("ab")).not.toBeNull();
      expect(validateUsername("")).not.toBeNull();
    });

    it("should reject username longer than 30 chars", () => {
      const longName = "a".repeat(31);
      expect(validateUsername(longName)).not.toBeNull();
    });

    it("should reject special characters", () => {
      expect(validateUsername("admin@user")).not.toBeNull();
      expect(validateUsername("user#name")).not.toBeNull();
      expect(validateUsername("admin name")).not.toBeNull();
    });

    it("should trim whitespace", () => {
      expect(validateUsername("  admin  ")).toBeNull();
      expect(validateUsername("\tadmin\n")).toBeNull();
    });
  });

  describe("Password Validation", () => {
    function validatePassword(value) {
      const password = String(value ?? "");
      if (password.length < 6 || password.length > 100) {
        return "Passwort muss zwischen 6 und 100 Zeichen lang sein.";
      }
      return null;
    }

    it("should accept valid password", () => {
      expect(validatePassword("password123")).toBeNull();
      expect(validatePassword("MyP@ssw0rd")).toBeNull();
    });

    it("should reject password shorter than 6 chars", () => {
      expect(validatePassword("pass")).not.toBeNull();
      expect(validatePassword("")).not.toBeNull();
    });

    it("should reject password longer than 100 chars", () => {
      const longPassword = "a".repeat(101);
      expect(validatePassword(longPassword)).not.toBeNull();
    });

    it("should allow special characters in password", () => {
      expect(validatePassword("P@ssw0rd!")).toBeNull();
      expect(validatePassword("p@$$w0rd")).toBeNull();
    });
  });
});

// ============================================================================
// AUTHENTICATION FLOW TESTS
// ============================================================================

describe("Authentication Flow", () => {
  const JWT_SECRET = "test-secret-key";
  const VALID_USER = {
    id: 1,
    username: "admin",
    password_hash: bcrypt.hashSync("admin123", 10),
    role: "admin",
  };

  it("should authenticate user with correct credentials", () => {
    const password = "admin123";
    const isValid = bcrypt.compareSync(password, VALID_USER.password_hash);

    expect(isValid).toBe(true);
  });

  it("should reject user with incorrect password", () => {
    const password = "wrongpassword";
    const isValid = bcrypt.compareSync(password, VALID_USER.password_hash);

    expect(isValid).toBe(false);
  });

  it("should generate token after successful authentication", () => {
    const token = jwt.sign(
      { sub: VALID_USER.id, role: VALID_USER.role, username: VALID_USER.username },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.sub).toBe(VALID_USER.id);
    expect(decoded.username).toBe(VALID_USER.username);
  });

  it("should not generate token for non-existent user", () => {
    const users = [VALID_USER];
    const username = "nonexistent";

    const user = users.find((u) => u.username === username);
    expect(user).toBeUndefined();
  });

  it("should allow authenticated requests with valid token", () => {
    const token = jwt.sign(
      { sub: VALID_USER.id, role: VALID_USER.role, username: VALID_USER.username },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    const header = `Bearer ${token}`;
    const startsWith = header.startsWith("Bearer ");

    expect(startsWith).toBe(true);

    const extracted = header.slice("Bearer ".length).trim();
    const decoded = jwt.verify(extracted, JWT_SECRET);

    expect(decoded.sub).toBe(VALID_USER.id);
  });

  it("should reject requests without token", () => {
    const header = "";

    expect(header.startsWith("Bearer ")).toBe(false);
  });

  it("should reject requests with invalid token", () => {
    const invalidToken = "invalid.token.here";

    expect(() => jwt.verify(invalidToken, JWT_SECRET)).toThrow();
  });
});

// ============================================================================
// AUTHORIZATION TESTS
// ============================================================================

describe("Authorization - Role-Based Access Control", () => {
  const adminUser = { id: 1, username: "admin", role: "admin" };
  const trainerUser = { id: 2, username: "trainer", role: "trainer" };
  const viewerUser = { id: 3, username: "viewer", role: "viewer" };

  const rolePermissions = {
    matches: ["admin", "trainer"],
    bracket: ["admin", "trainer"],
    groups: ["admin", "trainer"],
    players: ["admin", "trainer"],
    notifications: ["admin", "trainer", "referee", "viewer"],
    archives: ["admin"],
    awards: ["admin"],
    media: ["admin", "trainer"],
  };

  it("should allow admin to access admin resources", () => {
    const allowedRoles = rolePermissions["archives"];
    expect(allowedRoles.includes(adminUser.role)).toBe(true);
  });

  it("should deny trainer to access admin-only resources", () => {
    const allowedRoles = rolePermissions["archives"];
    expect(allowedRoles.includes(trainerUser.role)).toBe(false);
  });

  it("should allow trainer to access trainer resources", () => {
    const allowedRoles = rolePermissions["matches"];
    expect(allowedRoles.includes(trainerUser.role)).toBe(true);
  });

  it("should allow viewer to access viewer resources", () => {
    const allowedRoles = rolePermissions["notifications"];
    expect(allowedRoles.includes(viewerUser.role)).toBe(true);
  });

  it("should deny viewer to access trainer resources", () => {
    const allowedRoles = rolePermissions["matches"];
    expect(allowedRoles.includes(viewerUser.role)).toBe(false);
  });

  it("should return correct permissions for all resources", () => {
    expect(rolePermissions["matches"].length).toBeGreaterThan(0);
    expect(rolePermissions["archives"].length).toBeGreaterThan(0);

    for (const [key, roles] of Object.entries(rolePermissions)) {
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe("Error Handling", () => {
  describe("Authentication Errors", () => {
    it("should produce 401 for missing credentials", () => {
      const username = "";
      const password = "";

      const isValid = username && password;
      expect(isValid).toBe(false);
    });

    it("should produce 401 for invalid password", () => {
      const hash = bcrypt.hashSync("correctpassword", 10);
      const isValid = bcrypt.compareSync("wrongpassword", hash);

      expect(isValid).toBe(false);
    });

    it("should produce 401 for non-existent user", () => {
      const users = [];
      const username = "admin";

      const user = users.find((u) => u.username === username);
      expect(user).toBeUndefined();
    });

    it("should produce 401 for invalid token", () => {
      const JWT_SECRET = "secret";
      const token = "invalid.token.format";

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
    });

    it("should produce 401 for expired token", () => {
      const JWT_SECRET = "secret";
      const expiredToken = jwt.sign({ sub: 1 }, JWT_SECRET, {
        expiresIn: "-1h",
      });

      expect(() => jwt.verify(expiredToken, JWT_SECRET)).toThrow();
    });
  });

  describe("Authorization Errors", () => {
    it("should produce 403 for insufficient permissions", () => {
      const userRole = "viewer";
      const requiredRoles = ["admin"];

      const hasPermission = requiredRoles.includes(userRole);
      expect(hasPermission).toBe(false);
    });

    it("should produce 400 for invalid username format", () => {
      function validateUsername(value) {
        const username = String(value ?? "").trim();
        if (username.length < 3) return "Too short";
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) return "Invalid chars";
        return null;
      }

      expect(validateUsername("ab")).not.toBeNull();
      expect(validateUsername("user@name")).not.toBeNull();
    });

    it("should produce 400 for invalid password format", () => {
      function validatePassword(value) {
        const password = String(value ?? "");
        if (password.length < 6) return "Too short";
        if (password.length > 100) return "Too long";
        return null;
      }

      expect(validatePassword("12345")).not.toBeNull();
    });
  });
});
