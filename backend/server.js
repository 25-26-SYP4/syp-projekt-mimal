const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";

const DATA_DIR = path.join(__dirname, "database");
const DB_FILE = path.join(DATA_DIR, "app.db");

app.use(cors());
app.use(express.json({ limit: "8mb" }));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");

initSchema();
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

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      datum TEXT NOT NULL,
      uhrzeit TEXT NOT NULL,
      heimTeam TEXT NOT NULL,
      gastTeam TEXT NOT NULL,
      platz TEXT NOT NULL,
      schiri TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      bracket_json TEXT NOT NULL,
      groups_json TEXT NOT NULL,
      players_json TEXT NOT NULL,
      notifications_json TEXT NOT NULL,
      archives_json TEXT NOT NULL,
      awards_json TEXT NOT NULL,
      media_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const exists = db.prepare("SELECT id FROM app_state WHERE id = 1").get();
  if (!exists) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO app_state (
        id, bracket_json, groups_json, players_json, notifications_json, archives_json, awards_json, media_json, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      JSON.stringify(null),
      JSON.stringify([]),
      JSON.stringify({}),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify({ mvp: "", topScorer: "", fairPlayTeam: "" }),
      JSON.stringify([]),
      now
    );
  }
}

function seedDefaults() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const insert = db.prepare(
    "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)"
  );

  const defaults = [
    ["admin", "admin123", "admin"],
    ["gast", "gast123", "viewer"],
    ["trainer", "trainer123", "trainer"],
    ["schiri", "schiri123", "referee"]
  ];

  const tx = db.transaction((rows) => {
    rows.forEach(([username, plainPassword, role]) => {
      const passwordHash = bcrypt.hashSync(plainPassword, 10);
      insert.run(username, passwordHash, role, now);
    });
  });

  tx(defaults);
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
    const user = db
      .prepare("SELECT id, username, role FROM users WHERE id = ?")
      .get(payload.sub);
    req.user = user || null;
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
  return db
    .prepare("SELECT username, role FROM users ORDER BY username ASC")
    .all();
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function getWholeState() {
  const matches = db
    .prepare("SELECT id, datum, uhrzeit, heimTeam, gastTeam, platz, schiri FROM matches ORDER BY datum, uhrzeit")
    .all();

  const row = db
    .prepare(
      "SELECT bracket_json, groups_json, players_json, notifications_json, archives_json, awards_json, media_json FROM app_state WHERE id = 1"
    )
    .get();

  return {
    matches,
    bracket: parseJson(row.bracket_json, null),
    groups: parseJson(row.groups_json, []),
    players: parseJson(row.players_json, {}),
    notifications: parseJson(row.notifications_json, []),
    archives: parseJson(row.archives_json, []),
    awards: parseJson(row.awards_json, { mvp: "", topScorer: "", fairPlayTeam: "" }),
    media: parseJson(row.media_json, [])
  };
}

function updateStateKey(key, value) {
  if (key === "matches") {
    const items = Array.isArray(value) ? value : [];

    const clear = db.prepare("DELETE FROM matches");
    const insert = db.prepare(
      "INSERT INTO matches (id, datum, uhrzeit, heimTeam, gastTeam, platz, schiri) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    const tx = db.transaction(() => {
      clear.run();
      items.forEach((item) => {
        if (!item || typeof item !== "object") {
          return;
        }

        const id = String(item.id || "").trim();
        if (!id) {
          return;
        }

        insert.run(
          id,
          String(item.datum || ""),
          String(item.uhrzeit || ""),
          String(item.heimTeam || ""),
          String(item.gastTeam || ""),
          String(item.platz || ""),
          String(item.schiri || "")
        );
      });
    });

    tx();
    return;
  }

  const columnMap = {
    bracket: "bracket_json",
    groups: "groups_json",
    players: "players_json",
    notifications: "notifications_json",
    archives: "archives_json",
    awards: "awards_json",
    media: "media_json"
  };

  const column = columnMap[key];
  if (!column) {
    return;
  }

  const now = new Date().toISOString();
  const sql = `UPDATE app_state SET ${column} = ?, updated_at = ? WHERE id = 1`;
  db.prepare(sql).run(JSON.stringify(value), now);
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

  const user = db
    .prepare("SELECT id, username, role, password_hash FROM users WHERE username = ?")
    .get(String(username).trim());

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

  const exists = db
    .prepare("SELECT id FROM users WHERE lower(username) = lower(?)")
    .get(cleanUsername);

  if (exists) {
    return res.status(400).json({ message: "Benutzername bereits vergeben." });
  }

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(String(password), 10);

  db.prepare("INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)")
    .run(cleanUsername, hash, finalRole, now);

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
  const exists = db
    .prepare("SELECT id FROM users WHERE lower(username) = lower(?)")
    .get(cleanUsername);

  if (exists) {
    return res.status(400).json({ message: "Benutzername bereits vergeben." });
  }

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(String(password), 10);

  db.prepare("INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)")
    .run(cleanUsername, hash, "admin", now);

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
