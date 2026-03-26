const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";

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
        url: `http://localhost:${PORT}`,
        description: "Development server",
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

app.use(cors());
app.use(express.json({ limit: "8mb" }));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

initFiles();
seedDefaults();

const editableKeys = new Set([
  "matches",
  "bracket",
  "groups",
  "players",
  "notifications",
  "archives",
  "awards",
  "media"
]);

const rolePermissions = {
  matches: ["admin", "trainer"],
  bracket: ["admin", "trainer"],
  groups: ["admin", "trainer"],
  players: ["admin", "trainer"],
  notifications: ["admin", "trainer", "referee", "viewer"],
  archives: ["admin"],
  awards: ["admin"],
  media: ["admin", "trainer"]
};

function initFiles() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(MATCHES_FILE)) {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      bracket: null,
      groups: [],
      players: {},
      notifications: [],
      archives: [],
      awards: { mvp: "", topScorer: "", fairPlayTeam: "" },
      media: []
    }));
  }
}

function seedDefaults() {
  const users = readJson(USERS_FILE);
  if (users.length > 0) return;

  const now = new Date().toISOString();
  const defaults = [
    { id: 1, username: "admin", password_hash: bcrypt.hashSync("admin123", 10), role: "admin", created_at: now },
    { id: 2, username: "gast", password_hash: bcrypt.hashSync("gast123", 10), role: "viewer", created_at: now },
    { id: 3, username: "trainer", password_hash: bcrypt.hashSync("trainer123", 10), role: "trainer", created_at: now },
    { id: 4, username: "schiri", password_hash: bcrypt.hashSync("schiri123", 10), role: "referee", created_at: now }
  ];

  writeJson(USERS_FILE, defaults);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
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
    const user = users.find(u => u.id === payload.sub);
    req.user = user ? { id: user.id, username: user.username, role: user.role } : null;
  } catch (_error) {
    req.user = null;
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Nicht eingeloggt." });
  }
  return next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Nicht eingeloggt." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Keine Berechtigung." });
    }
    return next();
  };
}

function safeUsers() {
  return readJson(USERS_FILE).map(user => ({ username: user.username, role: user.role })).sort((a, b) => a.username.localeCompare(b.username));
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
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
    media: state.media
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
    state: getWholeState()
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
  if (!username || !password) {
    return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
  }

  const users = readJson(USERS_FILE);
  const user = users.find(u => u.username === String(username).trim());

  if (!user) {
    return res.status(401).json({ message: "Login fehlgeschlagen." });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: "Login fehlgeschlagen." });
  }

  const token = jwt.sign({ sub: user.id, role: user.role, username: user.username }, JWT_SECRET, {
    expiresIn: "12h"
  });

  return res.json({
    token,
    user: {
      username: user.username,
      role: user.role
    }
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
app.post("/api/auth/logout", requireAuth, (_req, res) => {
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

  if (!username || !password) {
    return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen haben." });
  }

  const allowedRoles = ["viewer", "trainer", "referee"];
  const finalRole = allowedRoles.includes(role) ? role : "viewer";
  const cleanUsername = String(username).trim();

  const users = readJson(USERS_FILE);
  const exists = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

  if (exists) {
    return res.status(400).json({ message: "Benutzername bereits vergeben." });
  }

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(String(password), 10);
  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

  const newUser = {
    id: newId,
    username: cleanUsername,
    password_hash: hash,
    role: finalRole,
    created_at: now
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  return res.status(201).json({
    message: "Registrierung erfolgreich.",
    user: {
      username: cleanUsername,
      role: finalRole
    }
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

  if (!username || !password) {
    return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen haben." });
  }

  const cleanUsername = String(username).trim();
  const users = readJson(USERS_FILE);
  const exists = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

  if (exists) {
    return res.status(400).json({ message: "Benutzername bereits vergeben." });
  }

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(String(password), 10);
  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

  const newUser = {
    id: newId,
    username: cleanUsername,
    password_hash: hash,
    role: "admin",
    created_at: now
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  return res.status(201).json({
    message: "Admin erstellt.",
    user: {
      username: cleanUsername,
      role: "admin"
    }
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

  matches.forEach(match => {
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

app.use((_req, res) => {
  res.status(404).json({ message: "Route nicht gefunden." });
});

app.listen(PORT, () => {
  console.log(`Backend aktiv auf http://localhost:${PORT}`);
});