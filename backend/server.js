const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Load environment file when present (dev convenience)
try {
  require("dotenv").config();
} catch (_err) {
  // noop if dotenv not installed / no .env
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

// In production, ensure a non-default JWT secret is set
if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-change-me") {
  console.error("FATAL: JWT_SECRET is not set. Please set JWT_SECRET in the environment.");
  process.exit(1);
}

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fußballturnier API",
      version: "1.0.0",
      description: "API für das Fußballturnier-Management-System",
    },
    servers: [
      {
        url: API_URL,
        description:
          process.env.NODE_ENV === "production" ? "Production server" : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [__filename],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const DATA_DIR = path.join(__dirname, "database");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MATCHES_FILE = path.join(DATA_DIR, "matches.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");
// Storage for the current frontend (code/fußballturnier/app.js),
// which uses the data model { tournament, teams, groups, matches }.
const TOURNAMENT_FILE = path.join(DATA_DIR, "tournament-data.json");

app.use(cors());
app.use(express.json({ limit: "8mb" }));

// Security headers.
// Note: the frontend (code/fußballturnier) uses inline onclick="..." handlers,
// which the default CSP (script-src-attr 'none') blocks. Allow inline event
// handlers so the buttons work, while keeping the rest of helmet's defaults.
try {
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "script-src-attr": ["'unsafe-inline'"],
        },
      },
    })
  );
} catch (_e) {
  // helmet may not be installed in some dev setups
}

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================================================
// SECURITY LOGGING
// ============================================================================

/**
 * Log security events (login attempts, access control, token issues)
 * Never logs passwords, complete tokens, or sensitive data
 * @param {string} event - Type of event (LOGIN_SUCCESS, LOGIN_FAILED, etc.)
 * @param {string} username - Username involved
 * @param {object} details - Additional details
 */
function logSecurityEvent(event, username, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    username: username || "unknown",
    ...details,
  };

  // In production, send to secure logging service
  // For now, log to console with appropriate level
  if (event.includes("FAILED") || event.includes("DENIED")) {
    console.warn(`[SECURITY] ${timestamp} - ${event}:`, logEntry);
  } else if (event.includes("SUCCESS")) {
    console.info(`[SECURITY] ${timestamp} - ${event}:`, logEntry);
  } else {
    console.log(`[SECURITY] ${timestamp} - ${event}:`, logEntry);
  }
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

initFiles();
seedDefaults();
// seedTournament() is called after DEMO_TOURNAMENT is defined (see below).

const editableKeys = new Set([
  "matches",
  "bracket",
  "groups",
  "players",
  "notifications",
  "archives",
  "awards",
  "media",
]);

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

function initFiles() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(MATCHES_FILE)) {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({
        bracket: null,
        groups: [],
        players: {},
        notifications: [],
        archives: [],
        awards: { mvp: "", topScorer: "", fairPlayTeam: "" },
        media: [],
      })
    );
  }
}

function seedDefaults() {
  const users = readJson(USERS_FILE);
  if (users.length > 0) return;

  const now = new Date().toISOString();
  const defaults = [
    {
      id: 1,
      username: "admin",
      password_hash: bcrypt.hashSync("admin123", 10),
      role: "admin",
      created_at: now,
    },
    {
      id: 2,
      username: "gast",
      password_hash: bcrypt.hashSync("gast123", 10),
      role: "viewer",
      created_at: now,
    },
    {
      id: 3,
      username: "trainer",
      password_hash: bcrypt.hashSync("trainer123", 10),
      role: "trainer",
      created_at: now,
    },
    {
      id: 4,
      username: "schiri",
      password_hash: bcrypt.hashSync("schiri123", 10),
      role: "referee",
      created_at: now,
    },
    {
      id: 5,
      username: "user1",
      password_hash: bcrypt.hashSync("user123", 10),
      role: "viewer",
      created_at: now,
    },
  ];

  writeJson(USERS_FILE, defaults);
}

// ============================================================================
// TOURNAMENT DATA (frontend app.js model: { tournament, teams, groups, matches })
// ============================================================================

// Demo data so the app shows a populated tournament right away (presentation).
const DEMO_TOURNAMENT = {
  tournament: {
    name: "HTL Cup 2025",
    date: "2026-06-23",
    location: "Sporthalle HTL",
    description: "Das große Schul-Fußballturnier — Demo-Daten zum Präsentieren.",
    pin: "1234",
  },
  teams: [
    { id: "t1", name: "Die Adler", color: "#2d6a4f", players: ["Max Mustermann", "Tobias Huber", "Jonas Berger", "Felix Wagner", "Lukas Gruber"] },
    { id: "t2", name: "Blitz United", color: "#1d4ed8", players: ["David Steiner", "Paul Mayer", "Elias Fischer", "Noah Bauer", "Simon Reiter"] },
    { id: "t3", name: "FC Donnerschlag", color: "#dc2626", players: ["Leon Hofer", "Jakob Moser", "Samuel Lang", "Daniel Wolf", "Florian Eder"] },
    { id: "t4", name: "Sturmtruppe", color: "#ea580c", players: ["Marcel Pichler", "Tim Brunner", "Lena Köhler", "Anna Wimmer", "Sarah Holzer"] },
    { id: "t5", name: "Goldene Löwen", color: "#ca8a04", players: ["Julian Maier", "Fabian Auer", "Niklas Graf", "Moritz Kaiser", "Benedikt Lechner"] },
    { id: "t6", name: "Eisbären", color: "#0891b2", players: ["Sebastian Ortner", "Philipp Reisinger", "Matteo Stadler", "Raphael Binder", "Vincent Hauser"] },
  ],
  groups: [
    { id: "g1", name: "Gruppe A", teamIds: ["t1", "t2", "t3"] },
    { id: "g2", name: "Gruppe B", teamIds: ["t4", "t5", "t6"] },
  ],
  matches: [
    // Gruppe A
    { id: "m1", groupId: "g1", phase: "group", round: null, homeId: "t1", awayId: "t2", date: "2026-06-23", time: "09:00", field: "Platz 1", homeScore: 2, awayScore: 1, played: true },
    { id: "m2", groupId: "g1", phase: "group", round: null, homeId: "t1", awayId: "t3", date: "2026-06-23", time: "10:00", field: "Platz 1", homeScore: 3, awayScore: 3, played: true },
    { id: "m3", groupId: "g1", phase: "group", round: null, homeId: "t2", awayId: "t3", date: "2026-06-23", time: "11:00", field: "Platz 1", homeScore: 0, awayScore: 2, played: true },
    // Gruppe B
    { id: "m4", groupId: "g2", phase: "group", round: null, homeId: "t4", awayId: "t5", date: "2026-06-23", time: "09:00", field: "Platz 2", homeScore: 1, awayScore: 1, played: true },
    { id: "m5", groupId: "g2", phase: "group", round: null, homeId: "t4", awayId: "t6", date: "2026-06-23", time: "10:00", field: "Platz 2", homeScore: 4, awayScore: 0, played: true },
    { id: "m6", groupId: "g2", phase: "group", round: null, homeId: "t5", awayId: "t6", date: "2026-06-23", time: "11:00", field: "Platz 2", homeScore: 2, awayScore: 2, played: true },
    // Halbfinale (KO) — Sieger/Zweiter der Gruppen, ein Spiel bereits entschieden
    { id: "m7", groupId: null, phase: "knockout", round: "Halbfinale", homeId: "t1", awayId: "t5", date: "2026-06-23", time: "13:00", field: "Platz 1", homeScore: 2, awayScore: 0, penaltyHome: null, penaltyAway: null, played: true },
    { id: "m8", groupId: null, phase: "knockout", round: "Halbfinale", homeId: "t4", awayId: "t3", date: "2026-06-23", time: "13:45", field: "Platz 1", homeScore: null, awayScore: null, penaltyHome: null, penaltyAway: null, played: false },
  ],
};

function seedTournament() {
  if (!fs.existsSync(TOURNAMENT_FILE)) {
    writeJson(TOURNAMENT_FILE, DEMO_TOURNAMENT);
  }
}

function readTournament() {
  try {
    return JSON.parse(fs.readFileSync(TOURNAMENT_FILE, "utf8"));
  } catch (_error) {
    return DEMO_TOURNAMENT;
  }
}

// Seed demo tournament now that DEMO_TOURNAMENT is initialized.
seedTournament();

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return [];
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readJson(USERS_FILE);
    const user = users.find((u) => u.id === payload.sub);
    
    if (user) {
      req.user = { id: user.id, username: user.username, role: user.role };
      logSecurityEvent("TOKEN_VERIFIED", user.username, {
        ip: req.ip,
        method: req.method,
        path: req.path,
      });
    } else {
      req.user = null;
      logSecurityEvent("TOKEN_USER_NOT_FOUND", "unknown", { ip: req.ip });
    }
  } catch (error) {
    req.user = null;
    logSecurityEvent("TOKEN_INVALID", "unknown", {
      ip: req.ip,
      reason: error.message,
    });
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    logSecurityEvent("AUTH_REQUIRED_DENIED", "unknown", {
      ip: req.ip,
      method: req.method,
      path: req.path,
    });
    return res.status(401).json({ message: "Nicht eingeloggt." });
  }
  return next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      logSecurityEvent("AUTH_REQUIRED_DENIED", "unknown", {
        ip: req.ip,
        method: req.method,
        path: req.path,
      });
      return res.status(401).json({ message: "Nicht eingeloggt." });
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent("ROLE_DENIED", req.user.username, {
        ip: req.ip,
        method: req.method,
        path: req.path,
        required_roles: roles,
        user_role: req.user.role,
      });
      return res.status(403).json({ message: "Keine Berechtigung." });
    }
    return next();
  };
}

function safeUsers() {
  return readJson(USERS_FILE)
    .map((user) => ({ username: user.username, role: user.role }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

function cleanUsername(value) {
  return String(value ?? "").trim();
}

function validateUsername(value) {
  const username = cleanUsername(value);
  if (username.length < 3 || username.length > 30) {
    return "Benutzername muss zwischen 3 und 30 Zeichen lang sein.";
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return "Benutzername darf nur Buchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.";
  }
  return null;
}

function validatePassword(value) {
  const password = String(value ?? "");
  if (password.length < 6 || password.length > 100) {
    return "Passwort muss zwischen 6 und 100 Zeichen lang sein.";
  }
  return null;
}

function getWholeState() {
  const matches = readJson(MATCHES_FILE);
  const state = readJson(STATE_FILE);

  return {
    matches,
    bracket: state.bracket,
    groups: state.groups,
    players: state.players,
    notifications: state.notifications,
    archives: state.archives,
    awards: state.awards,
    media: state.media,
  };
}

function updateStateKey(key, value) {
  if (key === "matches") {
    writeJson(MATCHES_FILE, value);
    return;
  }

  const state = readJson(STATE_FILE);
  state[key] = value;
  writeJson(STATE_FILE, state);
}

app.use(authOptional);

// Serve frontend static files (if frontend exists in ../code/fußballturnier)
const FRONTEND_DIR = path.join(__dirname, "..", "code", "fußballturnier");
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));

  // SPA fallback: send index.html for non-API routes
  app.get(/^\/(?!api|api-docs).*/, (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, "index.html"));
  });
}

// Dev-only helpers
function resetDatabase() {
  const now = new Date().toISOString();
  const defaults = [
    {
      id: 1,
      username: "admin",
      password_hash: bcrypt.hashSync("admin123", 10),
      role: "admin",
      created_at: now,
    },
    {
      id: 2,
      username: "gast",
      password_hash: bcrypt.hashSync("gast123", 10),
      role: "viewer",
      created_at: now,
    },
    {
      id: 3,
      username: "trainer",
      password_hash: bcrypt.hashSync("trainer123", 10),
      role: "trainer",
      created_at: now,
    },
    {
      id: 4,
      username: "schiri",
      password_hash: bcrypt.hashSync("schiri123", 10),
      role: "referee",
      created_at: now,
    },
    {
      id: 5,
      username: "user1",
      password_hash: bcrypt.hashSync("user123", 10),
      role: "viewer",
      created_at: now,
    },
  ];

  writeJson(USERS_FILE, defaults);
  writeJson(TOURNAMENT_FILE, DEMO_TOURNAMENT);
  writeJson(MATCHES_FILE, []);
  writeJson(
    STATE_FILE,
    JSON.stringify({
      bracket: null,
      groups: [],
      players: {},
      notifications: [],
      archives: [],
      awards: { mvp: "", topScorer: "", fairPlayTeam: "" },
      media: [],
    })
      ? JSON.parse(
          JSON.stringify({
            bracket: null,
            groups: [],
            players: {},
            notifications: [],
            archives: [],
            awards: { mvp: "", topScorer: "", fairPlayTeam: "" },
            media: [],
          })
        )
      : {}
  );
}

// Expose a simple dev-only reset endpoint (only when not in production)
if (process.env.NODE_ENV !== "production") {
  app.post("/api/dev/reset", (_req, res) => {
    try {
      resetDatabase();
      return res.json({ ok: true, message: "Database reset to demo defaults." });
    } catch (err) {
      return res.status(500).json({ ok: false, error: String(err) });
    }
  });
}

/**
 * @swagger
 * /api/tournament-data:
 *   get:
 *     summary: Get the full tournament data (frontend app.js model)
 *     description: Returns the stored tournament object { tournament, teams, groups, matches }
 *     responses:
 *       200:
 *         description: Tournament data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *   put:
 *     summary: Replace the full tournament data
 *     description: Stores the complete { tournament, teams, groups, matches } object sent by the frontend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Saved
 *       400:
 *         description: Invalid body
 */
app.get("/api/tournament-data", (_req, res) => {
  res.json(readTournament());
});

app.put("/api/tournament-data", (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Ungültige Turnierdaten." });
  }
  // Light validation: expected top-level shape from app.js
  const safe = {
    tournament: body.tournament || {},
    teams: Array.isArray(body.teams) ? body.teams : [],
    groups: Array.isArray(body.groups) ? body.groups : [],
    matches: Array.isArray(body.matches) ? body.matches : [],
  };
  writeJson(TOURNAMENT_FILE, safe);
  return res.json({ message: "Turnierdaten gespeichert." });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 time:
 *                   type: string
 *                   format: date-time
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test endpoint for swagger visibility
 *     description: A simple endpoint to verify that the API and swagger are working.
 *     responses:
 *       200:
 *         description: Test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test erfolgreich"
 */
app.get("/api/test", (_req, res) => {
  res.json({ message: "Test erfolgreich" });
});

/**
 * @swagger
 * /api/bootstrap:
 *   get:
 *     summary: Bootstrap data
 *     description: Returns initial data including current user, users list, and application state
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bootstrap data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentUser:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       role:
 *                         type: string
 *                 state:
 *                   type: object
 */
app.get("/api/bootstrap", (req, res) => {
  res.json({
    currentUser: req.user ? { username: req.user.username, role: req.user.role } : null,
    users: safeUsers(),
    state: getWholeState(),
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Login failed
 */
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const cleanName = cleanUsername(username);

  if (!cleanName || !password) {
    logSecurityEvent("LOGIN_INVALID_INPUT", "unknown", {
      ip: req.ip,
      reason: "Missing credentials",
    });
    return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
  }

  const usernameError = validateUsername(cleanName);
  if (usernameError) {
    logSecurityEvent("LOGIN_INVALID_USERNAME", cleanName, {
      ip: req.ip,
      reason: usernameError,
    });
    return res.status(400).json({ message: usernameError });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    logSecurityEvent("LOGIN_INVALID_PASSWORD_FORMAT", cleanName, {
      ip: req.ip,
      reason: passwordError,
    });
    return res.status(400).json({ message: passwordError });
  }

  const users = readJson(USERS_FILE);
  const user = users.find((u) => u.username === cleanName);

  if (!user) {
    logSecurityEvent("LOGIN_USER_NOT_FOUND", cleanName, {
      ip: req.ip,
    });
    return res.status(401).json({ message: "Login fehlgeschlagen." });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    logSecurityEvent("LOGIN_WRONG_PASSWORD", cleanName, {
      ip: req.ip,
    });
    return res.status(401).json({ message: "Login fehlgeschlagen." });
  }

  const token = jwt.sign({ sub: user.id, role: user.role, username: user.username }, JWT_SECRET, {
    expiresIn: "12h",
  });

  logSecurityEvent("LOGIN_SUCCESS", cleanName, {
    ip: req.ip,
    role: user.role,
  });

  return res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
    },
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logs out the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
app.post("/api/auth/logout", requireAuth, (req, res) => {
  logSecurityEvent("LOGOUT_SUCCESS", req.user.username, {
    ip: req.ip,
  });
  return res.json({ message: "Logout erfolgreich." });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Registers a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [viewer, trainer, referee]
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid input or username taken
 */
app.post("/api/auth/register", (req, res) => {
  const { username, password, role } = req.body || {};

  const cleanName = cleanUsername(username);

  if (!cleanName || !password) {
    logSecurityEvent("REGISTER_INVALID_INPUT", "unknown", {
      ip: req.ip,
      reason: "Missing credentials",
    });
    return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
  }

  const usernameError = validateUsername(cleanName);
  if (usernameError) {
    logSecurityEvent("REGISTER_INVALID_USERNAME", cleanName, {
      ip: req.ip,
      reason: usernameError,
    });
    return res.status(400).json({ message: usernameError });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    logSecurityEvent("REGISTER_INVALID_PASSWORD_FORMAT", cleanName, {
      ip: req.ip,
      reason: passwordError,
    });
    return res.status(400).json({ message: passwordError });
  }

  const allowedRoles = ["viewer", "trainer", "referee"];
  const finalRole = allowedRoles.includes(role) ? role : "viewer";

  const users = readJson(USERS_FILE);
  const exists = users.find((u) => u.username.toLowerCase() === cleanName.toLowerCase());

  if (exists) {
    logSecurityEvent("REGISTER_USERNAME_TAKEN", cleanName, {
      ip: req.ip,
    });
    return res.status(400).json({ message: "Benutzername bereits vergeben." });
  }

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(String(password), 10);
  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  const newUser = {
    id: newId,
    username: cleanName,
    password_hash: hash,
    role: finalRole,
    created_at: now,
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  logSecurityEvent("REGISTER_SUCCESS", cleanName, {
    ip: req.ip,
    role: finalRole,
  });

  return res.status(201).json({
    message: "Registrierung erfolgreich.",
    user: {
      username: cleanName,
      role: finalRole,
    },
  });
});

/**
 * @swagger
 * /api/auth/admin:
 *   post:
 *     summary: Create admin user
 *     description: Creates a new admin user (requires admin role)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
app.post("/api/auth/admin", requireRole(["admin"]), (req, res) => {
  const { username, password } = req.body || {};

  const cleanName = cleanUsername(username);

  if (!cleanName || !password) {
    logSecurityEvent("CREATE_ADMIN_INVALID_INPUT", req.user.username, {
      ip: req.ip,
      reason: "Missing credentials",
    });
    return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
  }

  const usernameError = validateUsername(cleanName);
  if (usernameError) {
    logSecurityEvent("CREATE_ADMIN_INVALID_USERNAME", req.user.username, {
      ip: req.ip,
      reason: usernameError,
    });
    return res.status(400).json({ message: usernameError });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    logSecurityEvent("CREATE_ADMIN_INVALID_PASSWORD_FORMAT", req.user.username, {
      ip: req.ip,
      reason: passwordError,
    });
    return res.status(400).json({ message: passwordError });
  }

  const users = readJson(USERS_FILE);
  const exists = users.find((u) => u.username.toLowerCase() === cleanName.toLowerCase());

  if (exists) {
    logSecurityEvent("CREATE_ADMIN_USERNAME_TAKEN", req.user.username, {
      ip: req.ip,
    });
    return res.status(400).json({ message: "Benutzername bereits vergeben." });
  }

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(String(password), 10);
  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  const newUser = {
    id: newId,
    username: cleanName,
    password_hash: hash,
    role: "admin",
    created_at: now,
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  logSecurityEvent("CREATE_ADMIN_SUCCESS", req.user.username, {
    ip: req.ip,
    new_admin_username: cleanName,
  });

  return res.status(201).json({
    message: "Admin erstellt.",
    user: {
      username: cleanName,
      role: "admin",
    },
  });
});

/**
 * @swagger
 * /api/state/{key}:
 *   put:
 *     summary: Update state key
 *     description: Updates a specific state key with new value
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [matches, bracket, groups, players, notifications, archives, awards, media]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: any
 *     responses:
 *       200:
 *         description: State updated
 *       400:
 *         description: Invalid key or missing value
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
app.put("/api/state/:key", requireAuth, (req, res) => {
  const { key } = req.params;
  if (!editableKeys.has(key)) {
    return res.status(400).json({ message: "Unbekannter Bereich." });
  }

  const roles = rolePermissions[key] || [];
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Keine Berechtigung fuer diesen Bereich." });
  }

  if (!Object.prototype.hasOwnProperty.call(req.body || {}, "value")) {
    return res.status(400).json({ message: "Feld 'value' fehlt." });
  }

  updateStateKey(key, req.body.value);
  return res.json({ message: "Gespeichert.", key });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get users list
 *     description: Returns a list of all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       role:
 *                         type: string
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
app.get("/api/users", requireRole(["admin"]), (_req, res) => {
  return res.json({ users: safeUsers() });
});

/**
 * @swagger
 * /api/team-points:
 *   get:
 *     summary: Get team points
 *     description: Returns the current points for all teams based on match results
 *     responses:
 *       200:
 *         description: Team points
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *                 description: Points for the team
 */
app.get("/api/team-points", (req, res) => {
  const matches = readJson(MATCHES_FILE);
  const points = {};

  matches.forEach((match) => {
    if (match.result) {
      const heim = match.heimTeam;
      const gast = match.gastTeam;
      if (!points[heim]) points[heim] = 0;
      if (!points[gast]) points[gast] = 0;

      if (match.result.heim > match.result.gast) {
        points[heim] += 3;
      } else if (match.result.heim < match.result.gast) {
        points[gast] += 3;
      } else {
        points[heim] += 1;
        points[gast] += 1;
      }
    }
  });

  res.json(points);
});

// ============================================================================
// LIVE SECTION APIs
// ============================================================================

/**
 * @swagger
 * /api/live/games:
 *   get:
 *     summary: Get today's games
 *     description: Returns all games scheduled for today with live status
 *     responses:
 *       200:
 *         description: List of games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   homeTeam:
 *                     type: string
 *                   awayTeam:
 *                     type: string
 *                   homeScore:
 *                     type: integer
 *                   awayScore:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   currentMinute:
 *                     type: integer
 *                   displayScore:
 *                     type: string
 *                   penaltiesEnabled:
 *                     type: boolean
 */
app.get("/api/live/games", (req, res) => {
  const matches = readJson(MATCHES_FILE);
  const today = new Date();

  // Filter matches for today
  const todayMatches = matches
    .filter((match) => {
      const matchDate = new Date(match.date || new Date());
      return (
        matchDate.getFullYear() === today.getFullYear() &&
        matchDate.getMonth() === today.getMonth() &&
        matchDate.getDate() === today.getDate()
      );
    })
    .map((match) => ({
      id: match.id || Math.random(),
      homeTeam: match.heimTeam || "Team A",
      awayTeam: match.gastTeam || "Team B",
      homeScore: match.result?.heim || 0,
      awayScore: match.result?.gast || 0,
      status: match.status || "SCHEDULED",
      currentMinute: match.minute || 0,
      date: match.date || new Date().toISOString(),
      competition: match.competition || "Tournament",
      displayScore:
        match.result?.heim !== undefined && match.result?.gast !== undefined
          ? `${match.result.heim}:${match.result.gast}`
          : "0:0",
      penaltiesEnabled: match.penaltiesEnabled || false,
      homePenaltyScore: match.homePenaltyScore || 0,
      awayPenaltyScore: match.awayPenaltyScore || 0,
    }));

  res.json(todayMatches);
});

/**
 * @swagger
 * /api/live/games/{id}/score:
 *   put:
 *     summary: Update game score
 *     description: Updates the score of a specific game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - homeScore
 *               - awayScore
 *             properties:
 *               homeScore:
 *                 type: integer
 *               awayScore:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Score updated
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (requires trainer/admin)
 */
app.put(
  "/api/live/games/:id/score",
  requireRole(["admin", "trainer"]),
  (req, res) => {
    const { id } = req.params;
    const { homeScore, awayScore } = req.body || {};

    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ message: "homeScore und awayScore erforderlich." });
    }

    const matches = readJson(MATCHES_FILE);
    const match = matches.find((m) => m.id === parseInt(id));

    if (!match) {
      return res.status(404).json({ message: "Spiel nicht gefunden." });
    }

    if (!match.result) {
      match.result = {};
    }

    match.result.heim = homeScore;
    match.result.gast = awayScore;

    writeJson(MATCHES_FILE, matches);

    logSecurityEvent("GAME_SCORE_UPDATED", req.user.username, {
      gameId: id,
      homeScore,
      awayScore,
    });

    return res.json({
      message: "Spielstand aktualisiert.",
      match: {
        id: match.id,
        homeScore,
        awayScore,
        displayScore: `${homeScore}:${awayScore}`,
      },
    });
  }
);

/**
 * @swagger
 * /api/live/games/{id}/status:
 *   put:
 *     summary: Update game status
 *     description: Updates the status of a game (LIVE, HALFTIME, FINISHED, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, LIVE, HALFTIME, EXTRA_TIME, PENALTY_SHOOTOUT, FINISHED]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Not authorized
 */
app.put(
  "/api/live/games/:id/status",
  requireRole(["admin", "trainer"]),
  (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};

    const validStatuses = [
      "SCHEDULED",
      "LIVE",
      "HALFTIME",
      "EXTRA_TIME",
      "PENALTY_SHOOTOUT",
      "FINISHED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Ungültiger Spielstatus." });
    }

    const matches = readJson(MATCHES_FILE);
    const match = matches.find((m) => m.id === parseInt(id));

    if (!match) {
      return res.status(404).json({ message: "Spiel nicht gefunden." });
    }

    match.status = status;
    writeJson(MATCHES_FILE, matches);

    logSecurityEvent("GAME_STATUS_UPDATED", req.user.username, {
      gameId: id,
      status,
    });

    return res.json({
      message: "Spielstatus aktualisiert.",
      match: {
        id: match.id,
        status,
      },
    });
  }
);

/**
 * @swagger
 * /api/live/games/{id}/penalties:
 *   put:
 *     summary: Record penalty shootout result
 *     description: Records a penalty attempt in a penalty shootout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isHome
 *               - isGoal
 *             properties:
 *               isHome:
 *                 type: boolean
 *                 description: true for home team, false for away team
 *               isGoal:
 *                 type: boolean
 *                 description: true for goal, false for miss
 *     responses:
 *       200:
 *         description: Penalty recorded
 *       400:
 *         description: Penalties not enabled
 *       403:
 *         description: Not authorized
 */
app.put(
  "/api/live/games/:id/penalties",
  requireRole(["admin", "trainer"]),
  (req, res) => {
    const { id } = req.params;
    const { isHome, isGoal } = req.body || {};

    if (isHome === undefined || isGoal === undefined) {
      return res.status(400).json({ message: "isHome und isGoal erforderlich." });
    }

    const matches = readJson(MATCHES_FILE);
    const match = matches.find((m) => m.id === parseInt(id));

    if (!match) {
      return res.status(404).json({ message: "Spiel nicht gefunden." });
    }

    if (!match.penaltiesEnabled) {
      return res
        .status(400)
        .json({ message: "Elfmeterschießen für dieses Spiel nicht aktiviert." });
    }

    if (!match.penaltySequence) {
      match.penaltySequence = [];
    }

    match.penaltySequence.push({
      team: isHome ? "home" : "away",
      goal: isGoal,
      timestamp: new Date().toISOString(),
    });

    if (isGoal) {
      if (isHome) {
        match.homePenaltyScore = (match.homePenaltyScore || 0) + 1;
      } else {
        match.awayPenaltyScore = (match.awayPenaltyScore || 0) + 1;
      }
    }

    writeJson(MATCHES_FILE, matches);

    logSecurityEvent("PENALTY_RECORDED", req.user.username, {
      gameId: id,
      team: isHome ? "home" : "away",
      isGoal,
      homePenaltyScore: match.homePenaltyScore || 0,
      awayPenaltyScore: match.awayPenaltyScore || 0,
    });

    return res.json({
      message: "Elfmeter registriert.",
      match: {
        id: match.id,
        penaltiesEnabled: true,
        homePenaltyScore: match.homePenaltyScore || 0,
        awayPenaltyScore: match.awayPenaltyScore || 0,
      },
    });
  }
);

app.use((_req, res) => {
  res.status(404).json({ message: "Route nicht gefunden." });
});

app.listen(PORT, () => {
  console.log(`Backend aktiv auf http://localhost:${PORT}`);
});
