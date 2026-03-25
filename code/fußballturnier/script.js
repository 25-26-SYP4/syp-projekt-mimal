const STORAGE_KEYS = {
  USERS: "ft_users",
  SESSION: "ft_session",
  MATCHES: "ft_matches"
};

const state = {
  users: [],
  matches: [],
  currentUser: null,
  editingMatchId: null,
  searchTerm: ""
};

const el = {
  authSection: document.getElementById("authSection"),
  dashboardSection: document.getElementById("dashboardSection"),
  adminTools: document.getElementById("adminTools"),
  adminCreator: document.getElementById("adminCreator"),
  matchesSection: document.getElementById("matchesSection"),
  sessionUser: document.getElementById("sessionUser"),
  sessionBox: document.getElementById("sessionBox"),
  logoutBtn: document.getElementById("logoutBtn"),
  roleLabel: document.getElementById("roleLabel"),
  totalMatches: document.getElementById("totalMatches"),
  upcomingMatches: document.getElementById("upcomingMatches"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  adminForm: document.getElementById("adminForm"),
  matchForm: document.getElementById("matchForm"),
  loginMessage: document.getElementById("loginMessage"),
  registerMessage: document.getElementById("registerMessage"),
  adminMsg: document.getElementById("adminMsg"),
  matchMessage: document.getElementById("matchMessage"),
  searchInput: document.getElementById("searchInput"),
  matchesList: document.getElementById("spiele"),
  saveMatchBtn: document.getElementById("saveMatchBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  exportBtn: document.getElementById("exportBtn"),
  fields: {
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    registerUsername: document.getElementById("registerUsername"),
    registerPassword: document.getElementById("registerPassword"),
    adminName: document.getElementById("adminName"),
    adminPass: document.getElementById("adminPass"),
    spielDatum: document.getElementById("spielDatum"),
    spielUhrzeit: document.getElementById("spielUhrzeit"),
    heimTeam: document.getElementById("heimTeam"),
    gastTeam: document.getElementById("gastTeam"),
    spielPlatz: document.getElementById("spielPlatz"),
    spielSchiri: document.getElementById("spielSchiri")
  }
};

init();

function init() {
  initializeStorage();
  restoreSession();
  bindEvents();
  refreshUI();
}

function initializeStorage() {
  const users = parseJSON(localStorage.getItem(STORAGE_KEYS.USERS), []);
  if (!users.length) {
    const seedUsers = [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "gast", password: "gast123", role: "viewer" }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
  }

  const matches = parseJSON(localStorage.getItem(STORAGE_KEYS.MATCHES), null);
  if (matches === null) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify([]));
  }

  state.users = parseJSON(localStorage.getItem(STORAGE_KEYS.USERS), []);
  state.matches = parseJSON(localStorage.getItem(STORAGE_KEYS.MATCHES), []);
}

function restoreSession() {
  const saved = parseJSON(localStorage.getItem(STORAGE_KEYS.SESSION), null);
  if (!saved) {
    state.currentUser = null;
    return;
  }

  const userExists = state.users.find((u) => u.username === saved.username && u.role === saved.role);
  state.currentUser = userExists || null;
}

function bindEvents() {
  el.loginForm.addEventListener("submit", handleLogin);
  el.registerForm.addEventListener("submit", handleRegister);
  el.adminForm.addEventListener("submit", handleCreateAdmin);
  el.matchForm.addEventListener("submit", handleSaveMatch);
  el.logoutBtn.addEventListener("click", handleLogout);
  el.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim().toLowerCase();
    renderMatches();
  });
  el.exportBtn.addEventListener("click", exportMatches);
  el.cancelEditBtn.addEventListener("click", cancelEditMode);
}

function handleLogin(event) {
  event.preventDefault();
  clearMessages();

  const username = el.fields.loginUsername.value.trim();
  const password = el.fields.loginPassword.value;

  if (!username || !password) {
    setMessage(el.loginMessage, "Bitte Benutzername und Passwort ausfuellen.", "error");
    return;
  }

  const user = state.users.find((entry) => entry.username === username && entry.password === password);
  if (!user) {
    setMessage(el.loginMessage, "Login fehlgeschlagen. Zugangsdaten pruefen.", "error");
    return;
  }

  state.currentUser = { username: user.username, role: user.role };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(state.currentUser));
  el.loginForm.reset();
  refreshUI();
  setMessage(el.loginMessage, "Login erfolgreich.", "success");
}

function handleRegister(event) {
  event.preventDefault();
  clearMessages();

  const username = el.fields.registerUsername.value.trim();
  const password = el.fields.registerPassword.value;

  if (!username || !password) {
    setMessage(el.registerMessage, "Bitte alle Felder ausfuellen.", "error");
    return;
  }

  if (password.length < 6) {
    setMessage(el.registerMessage, "Passwort muss mindestens 6 Zeichen haben.", "error");
    return;
  }

  if (state.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    setMessage(el.registerMessage, "Benutzername ist bereits vergeben.", "error");
    return;
  }

  state.users.push({ username, password, role: "viewer" });
  persistUsers();
  el.registerForm.reset();
  setMessage(el.registerMessage, "Registrierung erfolgreich. Du kannst dich jetzt einloggen.", "success");
}

function handleCreateAdmin(event) {
  event.preventDefault();
  clearMessages();

  if (!isAdmin()) {
    setMessage(el.adminMsg, "Nur Admins duerfen neue Admins erstellen.", "error");
    return;
  }

  const username = el.fields.adminName.value.trim();
  const password = el.fields.adminPass.value;

  if (!username || !password) {
    setMessage(el.adminMsg, "Bitte alle Felder ausfuellen.", "error");
    return;
  }

  if (password.length < 6) {
    setMessage(el.adminMsg, "Admin-Passwort muss mindestens 6 Zeichen haben.", "error");
    return;
  }

  if (state.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    setMessage(el.adminMsg, "Benutzername ist bereits vergeben.", "error");
    return;
  }

  state.users.push({ username, password, role: "admin" });
  persistUsers();
  el.adminForm.reset();
  setMessage(el.adminMsg, `Admin ${username} wurde erstellt.`, "success");
}

function handleSaveMatch(event) {
  event.preventDefault();
  clearMessages();

  if (!isAdmin()) {
    setMessage(el.matchMessage, "Nur Admins duerfen Spiele speichern.", "error");
    return;
  }

  const payload = {
    id: state.editingMatchId || crypto.randomUUID(),
    datum: el.fields.spielDatum.value,
    uhrzeit: el.fields.spielUhrzeit.value,
    heimTeam: el.fields.heimTeam.value.trim(),
    gastTeam: el.fields.gastTeam.value.trim(),
    platz: el.fields.spielPlatz.value.trim(),
    schiri: el.fields.spielSchiri.value.trim()
  };

  if (!payload.datum || !payload.uhrzeit || !payload.heimTeam || !payload.gastTeam || !payload.platz || !payload.schiri) {
    setMessage(el.matchMessage, "Bitte alle Match-Felder ausfuellen.", "error");
    return;
  }

  if (state.editingMatchId) {
    state.matches = state.matches.map((m) => (m.id === state.editingMatchId ? payload : m));
    setMessage(el.matchMessage, "Spiel wurde aktualisiert.", "success");
  } else {
    state.matches.push(payload);
    setMessage(el.matchMessage, "Spiel wurde angelegt.", "success");
  }

  persistMatches();
  cancelEditMode();
  renderMatches();
  updateStats();
}

function handleLogout() {
  state.currentUser = null;
  state.editingMatchId = null;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  clearMatchForm();
  clearMessages();
  refreshUI();
}

function startEditMatch(id) {
  if (!isAdmin()) {
    return;
  }

  const match = state.matches.find((m) => m.id === id);
  if (!match) {
    return;
  }

  state.editingMatchId = id;
  el.fields.spielDatum.value = match.datum;
  el.fields.spielUhrzeit.value = match.uhrzeit;
  el.fields.heimTeam.value = match.heimTeam;
  el.fields.gastTeam.value = match.gastTeam;
  el.fields.spielPlatz.value = match.platz;
  el.fields.spielSchiri.value = match.schiri;

  el.saveMatchBtn.textContent = "Aenderungen speichern";
  el.cancelEditBtn.classList.remove("hidden");
}

function cancelEditMode() {
  state.editingMatchId = null;
  clearMatchForm();
  el.saveMatchBtn.textContent = "Spiel speichern";
  el.cancelEditBtn.classList.add("hidden");
}

function deleteMatch(id) {
  if (!isAdmin()) {
    return;
  }

  state.matches = state.matches.filter((m) => m.id !== id);
  persistMatches();
  if (state.editingMatchId === id) {
    cancelEditMode();
  }
  renderMatches();
  updateStats();
}

function renderMatches() {
  const filtered = getFilteredMatches();
  el.matchesList.innerHTML = "";

  if (!filtered.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "Keine Spiele gefunden.";
    el.matchesList.appendChild(li);
    return;
  }

  filtered.forEach((match) => {
    const li = document.createElement("li");

    const details = document.createElement("div");
    details.className = "match-details";
    details.innerHTML = `
      <p class="match-line"><strong>${match.heimTeam}</strong> vs. <strong>${match.gastTeam}</strong></p>
      <p class="match-meta">${match.datum} | ${match.uhrzeit} | ${match.platz} | SR: ${match.schiri}</p>
    `;

    li.appendChild(details);

    if (isAdmin()) {
      const actions = document.createElement("div");
      actions.className = "item-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "secondary mini";
      editBtn.textContent = "Bearbeiten";
      editBtn.addEventListener("click", () => startEditMatch(match.id));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger mini";
      deleteBtn.textContent = "Loeschen";
      deleteBtn.addEventListener("click", () => deleteMatch(match.id));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      li.appendChild(actions);
    }

    el.matchesList.appendChild(li);
  });
}

function getFilteredMatches() {
  const sorted = [...state.matches].sort((a, b) => `${a.datum} ${a.uhrzeit}`.localeCompare(`${b.datum} ${b.uhrzeit}`));
  if (!state.searchTerm) {
    return sorted;
  }

  return sorted.filter((match) => {
    const haystack = [
      match.datum,
      match.uhrzeit,
      match.heimTeam,
      match.gastTeam,
      match.platz,
      match.schiri
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(state.searchTerm);
  });
}

function exportMatches() {
  if (!state.currentUser) {
    setMessage(el.matchMessage, "Bitte zuerst einloggen, um zu exportieren.", "error");
    return;
  }

  const json = JSON.stringify(state.matches, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "spiele.json";
  link.click();
  URL.revokeObjectURL(url);
}

function refreshUI() {
  const loggedIn = Boolean(state.currentUser);
  const admin = isAdmin();

  toggleElement(el.authSection, !loggedIn);
  toggleElement(el.dashboardSection, loggedIn);
  toggleElement(el.matchesSection, loggedIn);
  toggleElement(el.adminTools, admin);
  toggleElement(el.adminCreator, admin);
  el.logoutBtn.classList.toggle("hidden", !loggedIn);

  if (!loggedIn) {
    el.sessionUser.textContent = "Bitte anmelden oder registrieren";
    el.sessionBox.querySelector(".session-label").textContent = "Nicht eingeloggt";
    el.roleLabel.textContent = "Gast";
  } else {
    el.sessionUser.textContent = `${state.currentUser.username} (${state.currentUser.role})`;
    el.sessionBox.querySelector(".session-label").textContent = "Eingeloggt";
    el.roleLabel.textContent = admin ? "Admin" : "Viewer";
  }

  renderMatches();
  updateStats();
}

function updateStats() {
  const now = new Date();
  const upcoming = state.matches.filter((match) => {
    const date = new Date(`${match.datum}T${match.uhrzeit}`);
    return !Number.isNaN(date.getTime()) && date >= now;
  }).length;

  el.totalMatches.textContent = String(state.matches.length);
  el.upcomingMatches.textContent = String(upcoming);
}

function clearMessages() {
  [el.loginMessage, el.registerMessage, el.adminMsg, el.matchMessage].forEach((node) => {
    node.textContent = "";
    node.className = "message";
  });
}

function setMessage(node, text, type) {
  node.textContent = text;
  node.className = `message ${type}`;
}

function clearMatchForm() {
  el.matchForm.reset();
}

function isAdmin() {
  return state.currentUser?.role === "admin";
}

function persistUsers() {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
}

function persistMatches() {
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(state.matches));
}

function toggleElement(node, visible) {
  node.classList.toggle("hidden", !visible);
}

function parseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}
