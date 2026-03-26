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
app.use(express.json());

// Datenstrukturen (in einem echten Projekt würde man eine Datenbank verwenden)
let spiele = [];
let users = [
  { username: "admin", password: "123", role: "admin" }
];

// Hilfsfunktionen
const findUser = (username, password) => {
  return users.find(user => user.username === username && user.password === password);
};

const userExists = (username) => {
  return users.some(user => user.username === username);
};

// Handler-Funktionen

/**
 * Behandelt den Login-Prozess
 */
const handleLogin = (req, res) => {
  const { username, password } = req.body;

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
