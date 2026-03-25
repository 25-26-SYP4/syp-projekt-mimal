const STORAGE_KEYS = {
  USERS: "ft_users",
  SESSION: "ft_session",
  MATCHES: "ft_matches",
  BRACKET: "ft_bracket"
};

const state = {
  users: [],
  matches: [],
  bracket: null,
  currentUser: null,
  editingMatchId: null,
  searchTerm: "",
  activeView: "dashboard"
};

const el = {
  authSection: document.getElementById("authSection"),
  appNav: document.getElementById("appNav"),
  navButtons: document.querySelectorAll(".nav-btn"),
  dashboardSection: document.getElementById("dashboardSection"),
  adminTools: document.getElementById("adminTools"),
  adminCreator: document.getElementById("adminCreator"),
  matchesSection: document.getElementById("matchesSection"),
  bracketSection: document.getElementById("bracketSection"),
  bracketBoard: document.getElementById("bracketBoard"),
  bracketInfo: document.getElementById("bracketInfo"),
  championBadge: document.getElementById("championBadge"),
  drawMode: document.getElementById("drawMode"),
  teamSeedInput: document.getElementById("teamSeedInput"),
  loadTeamsBtn: document.getElementById("loadTeamsBtn"),
  generateBracketBtn: document.getElementById("generateBracketBtn"),
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

  const bracket = parseJSON(localStorage.getItem(STORAGE_KEYS.BRACKET), null);
  if (bracket === null) {
    localStorage.setItem(STORAGE_KEYS.BRACKET, JSON.stringify(null));
  }

  state.users = parseJSON(localStorage.getItem(STORAGE_KEYS.USERS), []);
  state.matches = parseJSON(localStorage.getItem(STORAGE_KEYS.MATCHES), []);
  state.bracket = parseJSON(localStorage.getItem(STORAGE_KEYS.BRACKET), null);
  if (state.bracket) {
    recalculateBracket();
  }
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
  el.loadTeamsBtn.addEventListener("click", loadTeamsFromMatches);
  el.generateBracketBtn.addEventListener("click", handleGenerateBracket);
  el.bracketBoard.addEventListener("click", handleBracketBoardClick);
  el.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });
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
  refreshSeedInputFromMatches(false);
  renderBracket();
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
  refreshSeedInputFromMatches(false);
  renderBracket();
  updateStats();
}

function loadTeamsFromMatches() {
  const teams = getUniqueTeams();
  if (!teams.length) {
    setMessage(el.bracketInfo, "Noch keine Teams in den Spielen vorhanden.", "error");
    return;
  }

  el.teamSeedInput.value = teams.join("\n");
  setMessage(el.bracketInfo, `${teams.length} Teams aus Spielen geladen.`, "success");
}

function refreshSeedInputFromMatches(onlyIfEmpty) {
  if (onlyIfEmpty && el.teamSeedInput.value.trim()) {
    return;
  }

  const teams = getUniqueTeams();
  if (!teams.length) {
    return;
  }
  el.teamSeedInput.value = teams.join("\n");
}

function handleGenerateBracket() {
  if (!isAdmin()) {
    setMessage(el.bracketInfo, "Nur Admins duerfen den K.-o.-Baum neu generieren.", "error");
    return;
  }

  const mode = el.drawMode.value;
  const teams = parseTeamsFromInput(el.teamSeedInput.value);

  if (teams.length < 2) {
    setMessage(el.bracketInfo, "Mindestens 2 Teams fuer einen Turnierbaum eintragen.", "error");
    return;
  }

  const orderedTeams = mode === "random" ? shuffle([...teams]) : teams;
  state.bracket = createBracket(orderedTeams, mode);
  recalculateBracket();
  persistBracket();
  renderBracket();

  const modeText = mode === "random" ? "Zufallsauslosung" : "Setzliste";
  setMessage(el.bracketInfo, `Neuer K.-o.-Baum erstellt (${modeText}, ${orderedTeams.length} Teams).`, "success");
}

function handleBracketBoardClick(event) {
  const button = event.target.closest(".save-result-btn");
  if (!button) {
    return;
  }

  const roundIndex = Number(button.dataset.round);
  const matchIndex = Number(button.dataset.match);
  saveBracketResult(roundIndex, matchIndex);
}

function saveBracketResult(roundIndex, matchIndex) {
  if (!isAdmin()) {
    setMessage(el.bracketInfo, "Nur Admins duerfen Ergebnisse eintragen.", "error");
    return;
  }

  if (!state.bracket?.rounds?.[roundIndex]?.[matchIndex]) {
    setMessage(el.bracketInfo, "Match nicht gefunden.", "error");
    return;
  }

  const homeInput = document.querySelector(`#score-home-${roundIndex}-${matchIndex}`);
  const awayInput = document.querySelector(`#score-away-${roundIndex}-${matchIndex}`);
  const homePenaltyInput = document.querySelector(`#pen-home-${roundIndex}-${matchIndex}`);
  const awayPenaltyInput = document.querySelector(`#pen-away-${roundIndex}-${matchIndex}`);
  const homeScore = parseScore(homeInput?.value);
  const awayScore = parseScore(awayInput?.value);
  const homePenalty = parseOptionalScore(homePenaltyInput?.value);
  const awayPenalty = parseOptionalScore(awayPenaltyInput?.value);

  if (homeScore === null || awayScore === null) {
    setMessage(el.bracketInfo, "Bitte gueltige Torzahlen eintragen.", "error");
    return;
  }

  if (homeScore === awayScore) {
    if (homePenalty === null || awayPenalty === null) {
      setMessage(el.bracketInfo, "Bei Unentschieden bitte Elfmeterschiessen eintragen.", "error");
      return;
    }

    if (homePenalty === awayPenalty) {
      setMessage(el.bracketInfo, "Elfmeterschiessen darf nicht unentschieden sein.", "error");
      return;
    }
  }

  const match = state.bracket.rounds[roundIndex][matchIndex];
  match.homeScore = homeScore;
  match.awayScore = awayScore;
  match.homePenalties = homePenalty;
  match.awayPenalties = awayPenalty;

  recalculateBracket();
  persistBracket();
  renderBracket();
  setMessage(el.bracketInfo, "Ergebnis gespeichert. Sieger wurde weitergesetzt.", "success");
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
  toggleElement(el.appNav, loggedIn);
  el.logoutBtn.classList.toggle("hidden", !loggedIn);

  if (!loggedIn) {
    el.sessionUser.textContent = "Bitte anmelden oder registrieren";
    el.sessionBox.querySelector(".session-label").textContent = "Nicht eingeloggt";
    el.roleLabel.textContent = "Gast";
    updateChampionBadge(null);
    state.activeView = "dashboard";
  } else {
    el.sessionUser.textContent = `${state.currentUser.username} (${state.currentUser.role})`;
    el.sessionBox.querySelector(".session-label").textContent = "Eingeloggt";
    el.roleLabel.textContent = admin ? "Admin" : "Viewer";
  }

  applyViewVisibility();
  updateNavState();
  refreshSeedInputFromMatches(true);
  renderMatches();
  renderBracket();
  updateStats();
}

function setActiveView(view) {
  if (!["dashboard", "matches", "bracket"].includes(view)) {
    return;
  }

  state.activeView = view;
  applyViewVisibility();
  updateNavState();
  if (view === "bracket") {
    renderBracket();
  }
}

function applyViewVisibility() {
  const loggedIn = Boolean(state.currentUser);
  const admin = isAdmin();

  const onDashboard = loggedIn && state.activeView === "dashboard";
  const onMatches = loggedIn && state.activeView === "matches";
  const onBracket = loggedIn && state.activeView === "bracket";

  toggleElement(el.dashboardSection, onDashboard);
  toggleElement(el.adminTools, onDashboard && admin);
  toggleElement(el.adminCreator, onDashboard && admin);
  toggleElement(el.matchesSection, onMatches);
  toggleElement(el.bracketSection, onBracket);
}

function updateNavState() {
  el.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.activeView);
  });
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

function renderBracket() {
  el.bracketBoard.innerHTML = "";

  if (!state.currentUser) {
    updateChampionBadge(null);
    setMessage(el.bracketInfo, "Bitte zuerst einloggen, um den Turnierbaum zu sehen.", "error");
    return;
  }

  if (!state.bracket?.rounds?.length) {
    updateChampionBadge(null);
    setMessage(el.bracketInfo, "Noch kein Baum vorhanden. Teams laden und K.-o.-Baum generieren.", "error");
    return;
  }

  const rounds = state.bracket.rounds;
  const totalRounds = rounds.length;
  const champion = rounds[totalRounds - 1][0]?.winner || null;
  updateChampionBadge(champion);

  rounds.forEach((round, roundIndex) => {
    const roundColumn = document.createElement("div");
    roundColumn.className = "bracket-round";

    const roundTitle = document.createElement("h3");
    roundTitle.className = "round-title";
    roundTitle.textContent = getRoundLabel(roundIndex, totalRounds);
    roundColumn.appendChild(roundTitle);

    const roundMatches = document.createElement("div");
    roundMatches.className = "round-matches";

    round.forEach((matchup, matchIndex) => {
      const card = document.createElement("article");
      card.className = "bracket-match";
      if (matchup.winner) {
        card.classList.add("resolved");
      }

      const matchTitle = document.createElement("p");
      matchTitle.className = "match-id";
      matchTitle.textContent = `Match ${roundIndex + 1}.${matchIndex + 1}`;

      const home = document.createElement("p");
      home.className = "team-name";
      home.textContent = displayTeamName(matchup.home);

      const away = document.createElement("p");
      away.className = "team-name";
      away.textContent = displayTeamName(matchup.away);

      const scoreRow = document.createElement("div");
      scoreRow.className = "score-row";

      const homeScore = document.createElement("input");
      homeScore.type = "number";
      homeScore.min = "0";
      homeScore.step = "1";
      homeScore.id = `score-home-${roundIndex}-${matchIndex}`;
      homeScore.className = "score-input";
      homeScore.value = matchup.homeScore ?? "";

      const scoreSep = document.createElement("span");
      scoreSep.textContent = ":";

      const awayScore = document.createElement("input");
      awayScore.type = "number";
      awayScore.min = "0";
      awayScore.step = "1";
      awayScore.id = `score-away-${roundIndex}-${matchIndex}`;
      awayScore.className = "score-input";
      awayScore.value = matchup.awayScore ?? "";

      const penaltyRow = document.createElement("div");
      penaltyRow.className = "score-row penalty-row";

      const homePenalty = document.createElement("input");
      homePenalty.type = "number";
      homePenalty.min = "0";
      homePenalty.step = "1";
      homePenalty.id = `pen-home-${roundIndex}-${matchIndex}`;
      homePenalty.className = "score-input";
      homePenalty.placeholder = "E";
      homePenalty.value = matchup.homePenalties ?? "";

      const penaltySep = document.createElement("span");
      penaltySep.textContent = ":";

      const awayPenalty = document.createElement("input");
      awayPenalty.type = "number";
      awayPenalty.min = "0";
      awayPenalty.step = "1";
      awayPenalty.id = `pen-away-${roundIndex}-${matchIndex}`;
      awayPenalty.className = "score-input";
      awayPenalty.placeholder = "E";
      awayPenalty.value = matchup.awayPenalties ?? "";

      const scoreLocked = !isAdmin() || !isPlayableMatch(matchup);
      homeScore.disabled = scoreLocked;
      awayScore.disabled = scoreLocked;
      homePenalty.disabled = scoreLocked;
      awayPenalty.disabled = scoreLocked;

      scoreRow.appendChild(homeScore);
      scoreRow.appendChild(scoreSep);
      scoreRow.appendChild(awayScore);

      penaltyRow.appendChild(homePenalty);
      penaltyRow.appendChild(penaltySep);
      penaltyRow.appendChild(awayPenalty);

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "save-result-btn mini";
      saveBtn.dataset.round = String(roundIndex);
      saveBtn.dataset.match = String(matchIndex);
      saveBtn.textContent = "Ergebnis speichern";
      saveBtn.disabled = scoreLocked;

      const winnerText = document.createElement("p");
      winnerText.className = "winner-text";
      winnerText.textContent = matchup.winner ? `Sieger: ${displayTeamName(matchup.winner)}` : "Sieger: offen";

      const penaltyHint = document.createElement("p");
      penaltyHint.className = "penalty-hint";
      penaltyHint.textContent = "Bei Remis Tore: Elfmeterschiessen eintragen.";

      card.appendChild(matchTitle);
      card.appendChild(home);
      card.appendChild(away);
      card.appendChild(scoreRow);
      card.appendChild(penaltyRow);
      card.appendChild(penaltyHint);
      card.appendChild(saveBtn);
      card.appendChild(winnerText);
      roundMatches.appendChild(card);
    });

    roundColumn.appendChild(roundMatches);
    el.bracketBoard.appendChild(roundColumn);
  });

  setMessage(el.bracketInfo, `Turniermodus: ${state.bracket.mode === "random" ? "Zufall" : "Setzliste"}. Champion: ${displayTeamName(champion)}.`, "success");
}

function createBracket(teams, mode) {
  const size = nextPowerOfTwo(teams.length);
  const seeded = [...teams, ...Array(size - teams.length).fill("BYE")];
  const rounds = [];

  const firstRound = [];
  for (let index = 0; index < size; index += 2) {
    firstRound.push(newMatch(seeded[index], seeded[index + 1]));
  }
  rounds.push(firstRound);

  let matchesInRound = firstRound.length;
  while (matchesInRound > 1) {
    matchesInRound /= 2;
    const nextRound = [];
    for (let index = 0; index < matchesInRound; index += 1) {
      nextRound.push(newMatch(null, null));
    }
    rounds.push(nextRound);
  }

  return {
    mode,
    teams,
    rounds
  };
}

function recalculateBracket() {
  if (!state.bracket?.rounds?.length) {
    return;
  }

  const rounds = state.bracket.rounds;

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
    const round = rounds[roundIndex];

    for (let matchIndex = 0; matchIndex < round.length; matchIndex += 1) {
      const match = round[matchIndex];

      if (roundIndex > 0) {
        const prevRound = rounds[roundIndex - 1];
        const prevA = prevRound[matchIndex * 2];
        const prevB = prevRound[matchIndex * 2 + 1];
        const nextHome = prevA?.winner || null;
        const nextAway = prevB?.winner || null;

        if (match.home !== nextHome || match.away !== nextAway) {
          match.home = nextHome;
          match.away = nextAway;
          match.homeScore = null;
          match.awayScore = null;
          match.homePenalties = null;
          match.awayPenalties = null;
          match.winner = null;
        }
      }

      if (!match.home && !match.away) {
        match.winner = null;
        continue;
      }

      if (match.home && !match.away) {
        match.winner = match.home;
        continue;
      }

      if (!match.home && match.away) {
        match.winner = match.away;
        continue;
      }

      if (match.home === "BYE" && match.away !== "BYE") {
        match.winner = match.away;
        continue;
      }

      if (match.away === "BYE" && match.home !== "BYE") {
        match.winner = match.home;
        continue;
      }

      if (isValidScore(match.homeScore) && isValidScore(match.awayScore) && match.homeScore !== match.awayScore) {
        match.winner = match.homeScore > match.awayScore ? match.home : match.away;
        continue;
      }

      if (
        isValidScore(match.homeScore) &&
        isValidScore(match.awayScore) &&
        match.homeScore === match.awayScore &&
        isValidScore(match.homePenalties) &&
        isValidScore(match.awayPenalties) &&
        match.homePenalties !== match.awayPenalties
      ) {
        match.winner = match.homePenalties > match.awayPenalties ? match.home : match.away;
        continue;
      }

      match.winner = null;
    }
  }
}

function getRoundLabel(roundIndex, totalRounds) {
  if (totalRounds === 1) {
    return "Finale";
  }

  if (roundIndex === totalRounds - 1) {
    return "Finale";
  }

  if (roundIndex === totalRounds - 2) {
    return "Halbfinale";
  }

  if (roundIndex === totalRounds - 3) {
    return "Viertelfinale";
  }

  return `Runde ${roundIndex + 1}`;
}

function newMatch(home, away) {
  return {
    home,
    away,
    homeScore: null,
    awayScore: null,
    homePenalties: null,
    awayPenalties: null,
    winner: null
  };
}

function parseTeamsFromInput(input) {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const seen = new Set();
  const unique = [];
  lines.forEach((team) => {
    const key = team.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(team);
    }
  });

  return unique;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function getUniqueTeams() {
  const allTeams = state.matches.flatMap((match) => [match.heimTeam, match.gastTeam]);
  return [...new Set(allTeams.map((name) => name.trim()).filter(Boolean))];
}

function nextPowerOfTwo(value) {
  let result = 1;
  while (result < value) {
    result *= 2;
  }
  return result;
}

function parseScore(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function parseOptionalScore(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return parseScore(value);
}

function isValidScore(value) {
  return Number.isInteger(value) && value >= 0;
}

function displayTeamName(value) {
  if (!value) {
    return "TBD";
  }
  if (value === "BYE") {
    return "Freilos";
  }
  return value;
}

function updateChampionBadge(champion) {
  if (!champion || champion === "BYE") {
    el.championBadge.classList.add("hidden");
    el.championBadge.textContent = "Champion: -";
    return;
  }

  el.championBadge.classList.remove("hidden");
  el.championBadge.textContent = `Champion: ${champion}`;
}

function isPlayableMatch(match) {
  return Boolean(match.home && match.away && match.home !== "BYE" && match.away !== "BYE");
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

function persistBracket() {
  localStorage.setItem(STORAGE_KEYS.BRACKET, JSON.stringify(state.bracket));
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
