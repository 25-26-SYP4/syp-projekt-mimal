const express = require("express");
const cors = require("cors");

// Initialisierung der App
const app = express();

// Middleware
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

  const user = findUser(username, password);
  if (!user) {
    return res.status(401).json({ message: "Login fehlgeschlagen. Ungültige Anmeldedaten." });
  }

  res.json({ username: user.username, role: user.role });
};

/**
 * Behandelt die Registrierung eines neuen Benutzers
 */
const handleRegister = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Benutzername und Passwort sind erforderlich." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen lang sein." });
  }

  if (userExists(username)) {
    return res.status(400).json({ message: "Benutzername bereits vergeben." });
  }

  users.push({ username, password, role: "viewer" });
  res.status(201).json({ message: "Registrierung erfolgreich." });
};

/**
 * Gibt alle Spiele zurück
 */
const getSpiele = (req, res) => {
  res.json(spiele);
};

/**
 * Speichert ein neues Spiel
 */
const saveSpiel = (req, res) => {
  const { datum, uhrzeit, heimTeam, gastTeam, platz, schiri } = req.body;

  if (!datum || !uhrzeit || !heimTeam || !gastTeam || !platz || !schiri) {
    return res.status(400).json({ message: "Alle Felder sind erforderlich." });
  }

  const newSpiel = {
    id: Date.now().toString(), // Einfache ID-Generierung
    datum,
    uhrzeit,
    heimTeam,
    gastTeam,
    platz,
    schiri
  };

  spiele.push(newSpiel);
  res.status(201).json({ message: "Spiel erfolgreich gespeichert.", spiel: newSpiel });
};

// Routen
app.post("/login", handleLogin);
app.post("/register", handleRegister);
app.get("/spiele", getSpiele);
app.post("/spiele", saveSpiel);

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});