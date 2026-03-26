const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";

const DATA_DIR = path.join(__dirname, "database");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MATCHES_FILE = path.join(DATA_DIR, "matches.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");

app.use(cors());
app.use(express.json({ limit: "8mb" }));

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

app.use(authOptional);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/bootstrap", (req, res) => {
  res.json({
    currentUser: req.user ? { username: req.user.username, role: req.user.role } : null,
    users: safeUsers(),
    state: getWholeState()
  });
});

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

app.post("/api/auth/logout", requireAuth, (_req, res) => {
  return res.json({ message: "Logout erfolgreich." });
});

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

app.get("/api/users", requireRole(["admin"]), (_req, res) => {
  return res.json({ users: safeUsers() });
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route nicht gefunden." });
});

app.listen(PORT, () => {
  console.log(`Backend aktiv auf http://localhost:${PORT}`);
});



