const STORAGE_KEYS = {
  USERS: "ft_users",
  SESSION: "ft_session",
  MATCHES: "ft_matches",
  BRACKET: "ft_bracket",
  GROUPS: "ft_groups",
  PLAYERS: "ft_players",
  NOTIFICATIONS: "ft_notifications",
  ARCHIVES: "ft_archives",
  AWARDS: "ft_awards",
  MEDIA: "ft_media",
  THEME: "ft_theme"
};

const ROLE_LABELS = {
  admin: "Admin",
  trainer: "Trainer",
  referee: "Schiri",
  viewer: "Zuschauer"
};

const state = {
  users: [],
  matches: [],
  bracket: null,
  groups: [],
  players: {},
  notifications: [],
  archives: [],
  awards: {
    mvp: "",
    topScorer: "",
    fairPlayTeam: ""
  },
  media: [],
  currentUser: null,
  editingMatchId: null,
  searchTerm: "",
  activeView: "dashboard",
  theme: "light"
};

const el = {
  authSection: document.getElementById("authSection"),
  appNav: document.getElementById("appNav"),
  navButtons: document.querySelectorAll(".nav-btn"),
  dashboardSection: document.getElementById("dashboardSection"),
  liveSection: document.getElementById("liveSection"),
  adminTools: document.getElementById("adminTools"),
  adminCreator: document.getElementById("adminCreator"),
  organizationSection: document.getElementById("organizationSection"),
  matchesSection: document.getElementById("matchesSection"),
  bracketSection: document.getElementById("bracketSection"),
  publicSection: document.getElementById("publicSection"),
  liveBoard: document.getElementById("liveBoard"),
  liveMessage: document.getElementById("liveMessage"),
  refreshLiveBtn: document.getElementById("refreshLiveBtn"),
  publicBoard: document.getElementById("publicBoard"),
  publicMessage: document.getElementById("publicMessage"),
  copyPublicLinkBtn: document.getElementById("copyPublicLinkBtn"),
  printPublicBtn: document.getElementById("printPublicBtn"),
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
  themeToggleBtn: document.getElementById("themeToggleBtn"),
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
  groupSizeInput: document.getElementById("groupSizeInput"),
  groupTeamsInput: document.getElementById("groupTeamsInput"),
  loadGroupTeamsBtn: document.getElementById("loadGroupTeamsBtn"),
  generateGroupsBtn: document.getElementById("generateGroupsBtn"),
  transferToKoBtn: document.getElementById("transferToKoBtn"),
  groupMessage: document.getElementById("groupMessage"),
  groupBoard: document.getElementById("groupBoard"),
  playerTeamSelect: document.getElementById("playerTeamSelect"),
  playerNameInput: document.getElementById("playerNameInput"),
  addPlayerBtn: document.getElementById("addPlayerBtn"),
  playerMessage: document.getElementById("playerMessage"),
  playerList: document.getElementById("playerList"),
  markNotificationsReadBtn: document.getElementById("markNotificationsReadBtn"),
  notificationList: document.getElementById("notificationList"),
  archiveTournamentBtn: document.getElementById("archiveTournamentBtn"),
  archiveMessage: document.getElementById("archiveMessage"),
  archiveList: document.getElementById("archiveList"),
  awardMvpInput: document.getElementById("awardMvpInput"),
  awardTopScorerInput: document.getElementById("awardTopScorerInput"),
  awardFairPlayInput: document.getElementById("awardFairPlayInput"),
  saveAwardsBtn: document.getElementById("saveAwardsBtn"),
  awardsMessage: document.getElementById("awardsMessage"),
  awardsList: document.getElementById("awardsList"),
  mediaTitleInput: document.getElementById("mediaTitleInput"),
  mediaFileInput: document.getElementById("mediaFileInput"),
  addMediaBtn: document.getElementById("addMediaBtn"),
  mediaMessage: document.getElementById("mediaMessage"),
  mediaGallery: document.getElementById("mediaGallery"),
  fields: {
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    registerUsername: document.getElementById("registerUsername"),
    registerPassword: document.getElementById("registerPassword"),
    registerRole: document.getElementById("registerRole"),
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
  applyTheme(state.theme);
  bindEvents();
  handleHashRouting();
  refreshUI();
}

function initializeStorage() {
  const users = parseJSON(localStorage.getItem(STORAGE_KEYS.USERS), []);
  if (!users.length) {
    const seedUsers = [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "gast", password: "gast123", role: "viewer" },
      { username: "trainer", password: "trainer123", role: "trainer" },
      { username: "schiri", password: "schiri123", role: "referee" }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
  }

  ensureStorageValue(STORAGE_KEYS.MATCHES, []);
  ensureStorageValue(STORAGE_KEYS.BRACKET, null);
  ensureStorageValue(STORAGE_KEYS.GROUPS, []);
  ensureStorageValue(STORAGE_KEYS.PLAYERS, {});
  ensureStorageValue(STORAGE_KEYS.NOTIFICATIONS, []);
  ensureStorageValue(STORAGE_KEYS.ARCHIVES, []);
  ensureStorageValue(STORAGE_KEYS.AWARDS, {
    mvp: "",
    topScorer: "",
    fairPlayTeam: ""
  });
  ensureStorageValue(STORAGE_KEYS.MEDIA, []);
  ensureStorageValue(STORAGE_KEYS.THEME, "light");

  state.users = parseJSON(localStorage.getItem(STORAGE_KEYS.USERS), []);
  state.matches = parseJSON(localStorage.getItem(STORAGE_KEYS.MATCHES), []);
  state.bracket = parseJSON(localStorage.getItem(STORAGE_KEYS.BRACKET), null);
  state.groups = parseJSON(localStorage.getItem(STORAGE_KEYS.GROUPS), []);
  state.players = parseJSON(localStorage.getItem(STORAGE_KEYS.PLAYERS), {});
  state.notifications = parseJSON(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []);
  state.archives = parseJSON(localStorage.getItem(STORAGE_KEYS.ARCHIVES), []);
  state.awards = parseJSON(localStorage.getItem(STORAGE_KEYS.AWARDS), {
    mvp: "",
    topScorer: "",
    fairPlayTeam: ""
  });
  state.media = parseJSON(localStorage.getItem(STORAGE_KEYS.MEDIA), []);
  state.theme = parseJSON(localStorage.getItem(STORAGE_KEYS.THEME), "light") || "light";

  if (state.bracket) {
    recalculateBracket();
  }
}

function ensureStorageValue(key, value) {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, JSON.stringify(value));
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
  el.themeToggleBtn.addEventListener("click", toggleTheme);
  el.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim().toLowerCase();
    renderMatches();
  });
  el.exportBtn.addEventListener("click", exportMatches);
  el.cancelEditBtn.addEventListener("click", cancelEditMode);
  el.loadTeamsBtn.addEventListener("click", loadTeamsFromMatches);
  el.generateBracketBtn.addEventListener("click", handleGenerateBracket);
  el.bracketBoard.addEventListener("click", handleBracketBoardClick);
  el.refreshLiveBtn.addEventListener("click", renderLiveCenter);

  el.loadGroupTeamsBtn.addEventListener("click", loadGroupTeamsFromMatches);
  el.generateGroupsBtn.addEventListener("click", handleGenerateGroups);
  el.transferToKoBtn.addEventListener("click", transferGroupsToKo);
  el.groupBoard.addEventListener("input", handleGroupBoardInput);

  el.playerTeamSelect.addEventListener("change", renderPlayers);
  el.addPlayerBtn.addEventListener("click", handleAddPlayer);
  el.playerList.addEventListener("click", handlePlayerListClick);

  el.markNotificationsReadBtn.addEventListener("click", markAllNotificationsRead);
  el.archiveTournamentBtn.addEventListener("click", archiveCurrentTournament);
  el.saveAwardsBtn.addEventListener("click", saveAwards);
  el.addMediaBtn.addEventListener("click", addMediaItem);
  el.mediaGallery.addEventListener("click", handleMediaGalleryClick);
  el.copyPublicLinkBtn.addEventListener("click", copyPublicLink);
  el.printPublicBtn.addEventListener("click", () => window.print());

  window.addEventListener("hashchange", handleHashRouting);

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
  pushNotification(`Willkommen ${user.username}.`, "success");
  refreshUI();
  setMessage(el.loginMessage, "Login erfolgreich.", "success");
}

function handleRegister(event) {
  event.preventDefault();
  clearMessages();

  const username = el.fields.registerUsername.value.trim();
  const password = el.fields.registerPassword.value;
  const role = el.fields.registerRole.value;

  if (!username || !password) {
    setMessage(el.registerMessage, "Bitte alle Felder ausfuellen.", "error");
    return;
  }

  if (password.length < 6) {
    setMessage(el.registerMessage, "Passwort muss mindestens 6 Zeichen haben.", "error");
    return;
  }

  if (!Object.keys(ROLE_LABELS).includes(role) || role === "admin") {
    setMessage(el.registerMessage, "Ungueltige Rolle.", "error");
    return;
  }

  if (state.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    setMessage(el.registerMessage, "Benutzername ist bereits vergeben.", "error");
    return;
  }

  state.users.push({ username, password, role });
  persistUsers();
  el.registerForm.reset();
  setMessage(el.registerMessage, `Registrierung erfolgreich als ${ROLE_LABELS[role]}.`, "success");
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
  pushNotification(`Neuer Admin ${username} erstellt.`, "info");
  setMessage(el.adminMsg, `Admin ${username} wurde erstellt.`, "success");
}

function handleSaveMatch(event) {
  event.preventDefault();
  clearMessages();

  if (!canManageMatches()) {
    setMessage(el.matchMessage, "Nur Admins oder Trainer duerfen Spiele speichern.", "error");
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
  refreshGroupInputFromMatches(false);
  refreshPlayerTeams();
  pushNotification(`Spiel geplant: ${payload.heimTeam} vs ${payload.gastTeam} am ${payload.datum} ${payload.uhrzeit}.`, "info", `match-plan-${payload.id}`);
  checkUpcomingMatchNotifications();
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
  if (!canManageMatches()) {
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
  if (!canManageMatches()) {
    return;
  }

  const removed = state.matches.find((m) => m.id === id);
  state.matches = state.matches.filter((m) => m.id !== id);
  persistMatches();
  if (state.editingMatchId === id) {
    cancelEditMode();
  }

  renderMatches();
  refreshSeedInputFromMatches(false);
  refreshGroupInputFromMatches(false);
  refreshPlayerTeams();
  renderBracket();
  updateStats();

  if (removed) {
    pushNotification(`Spiel geloescht: ${removed.heimTeam} vs ${removed.gastTeam}.`, "info");
  }
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

    if (canManageMatches()) {
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
    const haystack = [match.datum, match.uhrzeit, match.heimTeam, match.gastTeam, match.platz, match.schiri]
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
  if (!canGenerateStructure()) {
    setMessage(el.bracketInfo, "Nur Admins oder Trainer duerfen den K.-o.-Baum generieren.", "error");
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
  pushNotification(`K.-o.-Baum erstellt mit ${orderedTeams.length} Teams.`, "info");
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
  if (!canEnterResults()) {
    setMessage(el.bracketInfo, "Nur Admins oder Schiris duerfen Ergebnisse eintragen.", "error");
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
  pushNotification(`Ergebnis aktualisiert in Runde ${roundIndex + 1}, Match ${matchIndex + 1}.`, "success");
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

      const homeScore = createScoreInput(`score-home-${roundIndex}-${matchIndex}`, matchup.homeScore);
      const awayScore = createScoreInput(`score-away-${roundIndex}-${matchIndex}`, matchup.awayScore);
      const scoreSep = document.createElement("span");
      scoreSep.textContent = ":";

      scoreRow.appendChild(homeScore);
      scoreRow.appendChild(scoreSep);
      scoreRow.appendChild(awayScore);

      const penaltyRow = document.createElement("div");
      penaltyRow.className = "score-row penalty-row";

      const homePenalty = createScoreInput(`pen-home-${roundIndex}-${matchIndex}`, matchup.homePenalties);
      homePenalty.placeholder = "E";
      const awayPenalty = createScoreInput(`pen-away-${roundIndex}-${matchIndex}`, matchup.awayPenalties);
      awayPenalty.placeholder = "E";
      const penaltySep = document.createElement("span");
      penaltySep.textContent = ":";

      penaltyRow.appendChild(homePenalty);
      penaltyRow.appendChild(penaltySep);
      penaltyRow.appendChild(awayPenalty);

      const scoreLocked = !canEnterResults() || !isPlayableMatch(matchup);
      homeScore.disabled = scoreLocked;
      awayScore.disabled = scoreLocked;
      homePenalty.disabled = scoreLocked;
      awayPenalty.disabled = scoreLocked;

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "save-result-btn mini";
      saveBtn.dataset.round = String(roundIndex);
      saveBtn.dataset.match = String(matchIndex);
      saveBtn.textContent = "Ergebnis speichern";
      saveBtn.disabled = scoreLocked;

      const penaltyHint = document.createElement("p");
      penaltyHint.className = "penalty-hint";
      penaltyHint.textContent = "Bei Remis Tore: Elfmeterschiessen eintragen.";

      const winnerText = document.createElement("p");
      winnerText.className = "winner-text";
      winnerText.textContent = matchup.winner ? `Sieger: ${displayTeamName(matchup.winner)}` : "Sieger: offen";

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

function createScoreInput(id, value) {
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.id = id;
  input.className = "score-input";
  input.value = value ?? "";
  return input;
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

  return { mode, teams, rounds };
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
  if (totalRounds === 1 || roundIndex === totalRounds - 1) {
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

function loadGroupTeamsFromMatches() {
  const teams = getUniqueTeams();
  if (!teams.length) {
    setMessage(el.groupMessage, "Keine Teams aus Spielen verfuegbar.", "error");
    return;
  }
  el.groupTeamsInput.value = teams.join("\n");
  setMessage(el.groupMessage, `${teams.length} Teams geladen.`, "success");
}

function refreshGroupInputFromMatches(onlyIfEmpty) {
  if (onlyIfEmpty && el.groupTeamsInput.value.trim()) {
    return;
  }

  const teams = getUniqueTeams();
  if (teams.length) {
    el.groupTeamsInput.value = teams.join("\n");
  }
}

function handleGenerateGroups() {
  if (!canGenerateStructure()) {
    setMessage(el.groupMessage, "Nur Admins oder Trainer duerfen Gruppen erstellen.", "error");
    return;
  }

  const teams = parseTeamsFromInput(el.groupTeamsInput.value);
  const groupSize = Number(el.groupSizeInput.value);

  if (teams.length < 4) {
    setMessage(el.groupMessage, "Mindestens 4 Teams fuer Gruppenphase benoetigt.", "error");
    return;
  }

  if (!Number.isInteger(groupSize) || groupSize < 2) {
    setMessage(el.groupMessage, "Ungueltige Gruppengroesse.", "error");
    return;
  }

  const teamPool = [...teams];
  const groupCount = Math.ceil(teamPool.length / groupSize);
  const groups = Array.from({ length: groupCount }, (_, index) => ({
    name: `Gruppe ${String.fromCharCode(65 + index)}`,
    teams: []
  }));

  teamPool.forEach((team, index) => {
    const target = groups[index % groupCount];
    target.teams.push({
      name: team,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0
    });
  });

  state.groups = groups;
  persistGroups();
  renderGroups();
  refreshPlayerTeams();
  setMessage(el.groupMessage, `${groups.length} Gruppen erstellt.`, "success");
  pushNotification("Gruppenphase wurde neu erstellt.", "info");
}

function renderGroups() {
  el.groupBoard.innerHTML = "";

  if (!state.groups.length) {
    const p = document.createElement("p");
    p.className = "message";
    p.textContent = "Noch keine Gruppen vorhanden.";
    el.groupBoard.appendChild(p);
    return;
  }

  state.groups.forEach((group, groupIndex) => {
    const card = document.createElement("article");
    card.className = "group-card";

    const title = document.createElement("h4");
    title.textContent = group.name;
    card.appendChild(title);

    const table = document.createElement("table");
    table.className = "group-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Team</th>
          <th>P</th>
          <th>GF</th>
          <th>GA</th>
        </tr>
      </thead>
    `;

    const body = document.createElement("tbody");
    group.teams.forEach((team, teamIndex) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${team.name}</td>
        <td><input type="number" min="0" data-group="${groupIndex}" data-team="${teamIndex}" data-field="points" value="${team.points}" /></td>
        <td><input type="number" min="0" data-group="${groupIndex}" data-team="${teamIndex}" data-field="goalsFor" value="${team.goalsFor}" /></td>
        <td><input type="number" min="0" data-group="${groupIndex}" data-team="${teamIndex}" data-field="goalsAgainst" value="${team.goalsAgainst}" /></td>
      `;
      body.appendChild(row);
    });

    table.appendChild(body);
    card.appendChild(table);
    el.groupBoard.appendChild(card);
  });
}

function handleGroupBoardInput(event) {
  const input = event.target;
  const groupIndex = Number(input.dataset.group);
  const teamIndex = Number(input.dataset.team);
  const field = input.dataset.field;

  if (!Number.isInteger(groupIndex) || !Number.isInteger(teamIndex) || !field) {
    return;
  }

  const value = Number(input.value);
  if (!Number.isInteger(value) || value < 0) {
    return;
  }

  const group = state.groups[groupIndex];
  if (!group || !group.teams[teamIndex]) {
    return;
  }

  group.teams[teamIndex][field] = value;
  persistGroups();
}

function transferGroupsToKo() {
  if (!canGenerateStructure()) {
    setMessage(el.groupMessage, "Nur Admins oder Trainer duerfen Teams in den K.-o.-Baum uebernehmen.", "error");
    return;
  }

  if (!state.groups.length) {
    setMessage(el.groupMessage, "Bitte zuerst Gruppen erstellen.", "error");
    return;
  }

  const qualifiers = [];
  state.groups.forEach((group) => {
    const sorted = [...group.teams].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      const aDiff = a.goalsFor - a.goalsAgainst;
      const bDiff = b.goalsFor - b.goalsAgainst;
      if (bDiff !== aDiff) {
        return bDiff - aDiff;
      }
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      return a.name.localeCompare(b.name);
    });

    qualifiers.push(...sorted.slice(0, Math.min(2, sorted.length)).map((entry) => entry.name));
  });

  if (qualifiers.length < 2) {
    setMessage(el.groupMessage, "Zu wenig Qualifikanten fuer K.-o.-Baum.", "error");
    return;
  }

  el.teamSeedInput.value = qualifiers.join("\n");
  state.activeView = "bracket";
  setActiveView("bracket");
  setMessage(el.groupMessage, `${qualifiers.length} Teams in K.-o.-Setzliste uebernommen.`, "success");
  pushNotification("Top-Teams aus Gruppen in K.-o.-Setzliste uebernommen.", "info");
}

function handleAddPlayer() {
  if (!canManagePlayers()) {
    setMessage(el.playerMessage, "Nur Admins oder Trainer duerfen Spieler verwalten.", "error");
    return;
  }

  const team = el.playerTeamSelect.value;
  const playerName = el.playerNameInput.value.trim();

  if (!team) {
    setMessage(el.playerMessage, "Bitte zuerst ein Team waehlen.", "error");
    return;
  }

  if (!playerName) {
    setMessage(el.playerMessage, "Bitte einen Spielernamen eingeben.", "error");
    return;
  }

  if (!state.players[team]) {
    state.players[team] = [];
  }

  if (state.players[team].some((entry) => entry.toLowerCase() === playerName.toLowerCase())) {
    setMessage(el.playerMessage, "Spieler existiert bereits in diesem Team.", "error");
    return;
  }

  state.players[team].push(playerName);
  state.players[team].sort((a, b) => a.localeCompare(b));
  persistPlayers();
  el.playerNameInput.value = "";
  renderPlayers();
  setMessage(el.playerMessage, `${playerName} wurde zu ${team} hinzugefuegt.`, "success");
}

function handlePlayerListClick(event) {
  const button = event.target.closest(".delete-player-btn");
  if (!button) {
    return;
  }

  if (!canManagePlayers()) {
    setMessage(el.playerMessage, "Keine Berechtigung zum Loeschen von Spielern.", "error");
    return;
  }

  const team = button.dataset.team;
  const player = button.dataset.player;

  if (!team || !player || !state.players[team]) {
    return;
  }

  state.players[team] = state.players[team].filter((entry) => entry !== player);
  persistPlayers();
  renderPlayers();
  setMessage(el.playerMessage, `${player} wurde entfernt.`, "success");
}

function refreshPlayerTeams() {
  const teams = [...new Set([...getUniqueTeams(), ...getGroupTeams()])].sort((a, b) => a.localeCompare(b));
  const previous = el.playerTeamSelect.value;
  el.playerTeamSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = teams.length ? "Bitte Team waehlen" : "Keine Teams vorhanden";
  el.playerTeamSelect.appendChild(emptyOption);

  teams.forEach((team) => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    el.playerTeamSelect.appendChild(option);
  });

  if (teams.includes(previous)) {
    el.playerTeamSelect.value = previous;
  }

  renderPlayers();
}

function renderPlayers() {
  el.playerList.innerHTML = "";

  const team = el.playerTeamSelect.value;
  if (!team) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "Kein Team ausgewaehlt.";
    el.playerList.appendChild(li);
    return;
  }

  const roster = state.players[team] || [];
  if (!roster.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "Noch keine Spieler fuer dieses Team.";
    el.playerList.appendChild(li);
    return;
  }

  roster.forEach((player) => {
    const li = document.createElement("li");
    li.className = "list-item-row";

    const span = document.createElement("span");
    span.textContent = player;

    li.appendChild(span);

    if (canManagePlayers()) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "danger mini delete-player-btn";
      delBtn.dataset.team = team;
      delBtn.dataset.player = player;
      delBtn.textContent = "Entfernen";
      li.appendChild(delBtn);
    }

    el.playerList.appendChild(li);
  });
}

function pushNotification(text, type = "info", key = null) {
  if (key && state.notifications.some((entry) => entry.key === key)) {
    return;
  }

  const notification = {
    id: crypto.randomUUID(),
    text,
    type,
    createdAt: new Date().toISOString(),
    read: false,
    key
  };

  state.notifications.unshift(notification);
  state.notifications = state.notifications.slice(0, 50);
  persistNotifications();
  renderNotifications();
}

function markAllNotificationsRead() {
  state.notifications = state.notifications.map((entry) => ({ ...entry, read: true }));
  persistNotifications();
  renderNotifications();
}

function renderNotifications() {
  el.notificationList.innerHTML = "";

  if (!state.notifications.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "Keine Benachrichtigungen.";
    el.notificationList.appendChild(li);
  } else {
    state.notifications.forEach((entry) => {
      const li = document.createElement("li");
      li.className = `list-item-row notification-item ${entry.read ? "is-read" : "is-unread"}`;
      li.innerHTML = `
        <span>${entry.text}</span>
        <small>${formatDate(entry.createdAt)}</small>
      `;
      el.notificationList.appendChild(li);
    });
  }

  const unread = state.notifications.filter((entry) => !entry.read).length;
  if (!state.currentUser) {
    return;
  }

  const roleText = ROLE_LABELS[state.currentUser.role] || state.currentUser.role;
  if (unread > 0) {
    el.sessionUser.textContent = `${state.currentUser.username} (${roleText}) • ${unread} neu`;
  } else {
    el.sessionUser.textContent = `${state.currentUser.username} (${roleText})`;
  }
}

function checkUpcomingMatchNotifications() {
  const now = new Date();
  state.matches.forEach((match) => {
    const date = new Date(`${match.datum}T${match.uhrzeit}`);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60000);
    if (diffMinutes >= 0 && diffMinutes <= 120) {
      pushNotification(
        `Erinnerung: ${match.heimTeam} vs ${match.gastTeam} startet in ca. ${diffMinutes} Minuten.`,
        "info",
        `upcoming-${match.id}`
      );
    }
  });
}

function archiveCurrentTournament() {
  if (!canArchive()) {
    setMessage(el.archiveMessage, "Nur Admins duerfen ein Turnier archivieren.", "error");
    return;
  }

  const champion = getChampionName();
  const snapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    champion,
    totalMatches: state.matches.length,
    totalTeams: getUniqueTeams().length,
    groupsCount: state.groups.length,
    mode: state.bracket?.mode || "-"
  };

  state.archives.unshift(snapshot);
  state.archives = state.archives.slice(0, 30);
  persistArchives();
  renderArchives();
  setMessage(el.archiveMessage, "Turnier wurde archiviert.", "success");
  pushNotification(`Turnier archiviert. Champion: ${snapshot.champion || "offen"}.`, "success");
}

function renderArchives() {
  el.archiveList.innerHTML = "";

  if (!state.archives.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "Noch kein Archiv vorhanden.";
    el.archiveList.appendChild(li);
    return;
  }

  state.archives.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.innerHTML = `
      <span>${formatDate(entry.createdAt)} | Champion: ${entry.champion || "offen"} | Spiele: ${entry.totalMatches} | Teams: ${entry.totalTeams}</span>
    `;
    el.archiveList.appendChild(li);
  });
}

function handleHashRouting() {
  if (window.location.hash === "#public") {
    state.activeView = "public";
  } else if (state.activeView === "public") {
    state.activeView = "dashboard";
  }

  if (state.currentUser) {
    applyViewVisibility();
    updateNavState();
    if (state.activeView === "public") {
      renderPublicShare();
    }
  } else if (isPublicHashMode()) {
    refreshUI();
  }
}

function isPublicHashMode() {
  return window.location.hash === "#public";
}

function renderLiveCenter() {
  el.liveBoard.innerHTML = "";

  if (!state.matches.length) {
    setMessage(el.liveMessage, "Noch keine Spiele geplant.", "error");
    return;
  }

  const now = new Date();
  const buckets = {
    live: [],
    upcoming: [],
    done: []
  };

  state.matches.forEach((match) => {
    const kickoff = new Date(`${match.datum}T${match.uhrzeit}`);
    if (Number.isNaN(kickoff.getTime())) {
      return;
    }
    const diffMinutes = Math.round((kickoff.getTime() - now.getTime()) / 60000);
    if (diffMinutes <= 0 && diffMinutes >= -120) {
      buckets.live.push(match);
    } else if (diffMinutes > 0) {
      buckets.upcoming.push(match);
    } else {
      buckets.done.push(match);
    }
  });

  renderLiveBucket("Live jetzt", buckets.live);
  renderLiveBucket("Als naechstes", buckets.upcoming.slice(0, 6));
  renderLiveBucket("Bereits gespielt", buckets.done.slice(0, 6));

  setMessage(
    el.liveMessage,
    `Live: ${buckets.live.length} | Demnaechst: ${buckets.upcoming.length} | Gespielt: ${buckets.done.length}`,
    "success"
  );
}

function renderLiveBucket(title, matches) {
  const block = document.createElement("article");
  block.className = "live-bucket";

  const heading = document.createElement("h3");
  heading.textContent = title;
  block.appendChild(heading);

  if (!matches.length) {
    const p = document.createElement("p");
    p.className = "message";
    p.textContent = "Keine Spiele in diesem Bereich.";
    block.appendChild(p);
    el.liveBoard.appendChild(block);
    return;
  }

  const list = document.createElement("ul");
  list.className = "simple-list";
  matches
    .sort((a, b) => `${a.datum} ${a.uhrzeit}`.localeCompare(`${b.datum} ${b.uhrzeit}`))
    .forEach((match) => {
      const li = document.createElement("li");
      li.className = "list-item-row";
      li.innerHTML = `<span><strong>${match.heimTeam}</strong> vs <strong>${match.gastTeam}</strong> | ${match.datum} ${match.uhrzeit} | ${match.platz}</span>`;
      list.appendChild(li);
    });

  block.appendChild(list);
  el.liveBoard.appendChild(block);
}

function saveAwards() {
  if (!isAdmin()) {
    setMessage(el.awardsMessage, "Nur Admins duerfen Awards setzen.", "error");
    return;
  }

  state.awards = {
    mvp: el.awardMvpInput.value.trim(),
    topScorer: el.awardTopScorerInput.value.trim(),
    fairPlayTeam: el.awardFairPlayInput.value.trim()
  };

  persistAwards();
  renderAwards();
  setMessage(el.awardsMessage, "Awards gespeichert.", "success");
}

function renderAwards() {
  el.awardsList.innerHTML = "";
  el.awardMvpInput.value = state.awards.mvp || "";
  el.awardTopScorerInput.value = state.awards.topScorer || "";
  el.awardFairPlayInput.value = state.awards.fairPlayTeam || "";

  const rows = [
    `Champion: ${getChampionName() || "offen"}`,
    `MVP: ${state.awards.mvp || "offen"}`,
    `Top-Scorer: ${state.awards.topScorer || "offen"}`,
    `Fair-Play-Team: ${state.awards.fairPlayTeam || "offen"}`
  ];

  rows.forEach((rowText) => {
    const li = document.createElement("li");
    li.className = "list-item-row";
    li.textContent = rowText;
    el.awardsList.appendChild(li);
  });
}

async function addMediaItem() {
  if (!canManagePlayers()) {
    setMessage(el.mediaMessage, "Nur Admins oder Trainer duerfen Medien hinzufuegen.", "error");
    return;
  }

  const title = el.mediaTitleInput.value.trim() || "Ohne Titel";
  const file = el.mediaFileInput.files?.[0];
  if (!file) {
    setMessage(el.mediaMessage, "Bitte zuerst ein Bild waehlen.", "error");
    return;
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    state.media.unshift({
      id: crypto.randomUUID(),
      title,
      src: dataUrl,
      createdAt: new Date().toISOString()
    });
    state.media = state.media.slice(0, 40);
    persistMedia();
    renderMediaGallery();

    el.mediaTitleInput.value = "";
    el.mediaFileInput.value = "";
    setMessage(el.mediaMessage, "Bild zur Mediathek hinzugefuegt.", "success");
  } catch (_error) {
    setMessage(el.mediaMessage, "Bild konnte nicht geladen werden.", "error");
  }
}

function handleMediaGalleryClick(event) {
  const button = event.target.closest(".delete-media-btn");
  if (!button) {
    return;
  }

  if (!canManagePlayers()) {
    return;
  }

  const mediaId = button.dataset.mediaId;
  state.media = state.media.filter((item) => item.id !== mediaId);
  persistMedia();
  renderMediaGallery();
}

function renderMediaGallery() {
  el.mediaGallery.innerHTML = "";
  if (!state.media.length) {
    const p = document.createElement("p");
    p.className = "message";
    p.textContent = "Noch keine Bilder hochgeladen.";
    el.mediaGallery.appendChild(p);
    return;
  }

  state.media.forEach((item) => {
    const card = document.createElement("article");
    card.className = "media-card";

    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.title;

    const caption = document.createElement("p");
    caption.textContent = `${item.title} (${formatDate(item.createdAt)})`;

    card.appendChild(img);
    card.appendChild(caption);

    if (canManagePlayers()) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "danger mini delete-media-btn";
      delBtn.dataset.mediaId = item.id;
      delBtn.textContent = "Entfernen";
      card.appendChild(delBtn);
    }

    el.mediaGallery.appendChild(card);
  });
}

function renderPublicShare() {
  el.publicBoard.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "public-summary";
  summary.innerHTML = `
    <p><strong>Champion:</strong> ${getChampionName() || "offen"}</p>
    <p><strong>Spiele:</strong> ${state.matches.length}</p>
    <p><strong>Teams:</strong> ${getUniqueTeams().length}</p>
    <p><strong>MVP:</strong> ${state.awards.mvp || "offen"}</p>
  `;
  el.publicBoard.appendChild(summary);

  if (state.matches.length) {
    const list = document.createElement("ul");
    list.className = "simple-list";
    [...state.matches]
      .sort((a, b) => `${a.datum} ${a.uhrzeit}`.localeCompare(`${b.datum} ${b.uhrzeit}`))
      .slice(0, 10)
      .forEach((match) => {
        const li = document.createElement("li");
        li.className = "list-item-row";
        li.textContent = `${match.datum} ${match.uhrzeit} | ${match.heimTeam} vs ${match.gastTeam} | ${match.platz}`;
        list.appendChild(li);
      });
    el.publicBoard.appendChild(list);
  }

  setMessage(el.publicMessage, "Read-only Ansicht fuer Fans und Eltern.", "success");
}

async function copyPublicLink() {
  const url = `${window.location.origin}${window.location.pathname}#public`;
  try {
    await navigator.clipboard.writeText(url);
    setMessage(el.publicMessage, "Public-Link kopiert.", "success");
  } catch (_error) {
    setMessage(el.publicMessage, `Link: ${url}`, "success");
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-error"));
    reader.readAsDataURL(file);
  });
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applyTheme(state.theme);
  localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(state.theme));
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  el.themeToggleBtn.textContent = `Theme: ${theme === "light" ? "Hell" : "Dunkel"}`;
}

function refreshUI() {
  const loggedIn = Boolean(state.currentUser);
  const publicMode = isPublicHashMode();

  if (!loggedIn && publicMode) {
    toggleElement(el.authSection, true);
    toggleElement(el.appNav, false);
    toggleElement(el.liveSection, false);
    toggleElement(el.dashboardSection, false);
    toggleElement(el.adminTools, false);
    toggleElement(el.adminCreator, false);
    toggleElement(el.organizationSection, false);
    toggleElement(el.matchesSection, false);
    toggleElement(el.bracketSection, false);
    toggleElement(el.publicSection, true);
    el.logoutBtn.classList.add("hidden");
    el.sessionUser.textContent = "Oeffentlicher Modus";
    el.sessionBox.querySelector(".session-label").textContent = "Public";
    el.roleLabel.textContent = "Gast";
    updateChampionBadge(getChampionName());
    renderPublicShare();
    renderMediaGallery();
    return;
  }

  toggleElement(el.authSection, !loggedIn);
  toggleElement(el.appNav, loggedIn);
  el.logoutBtn.classList.toggle("hidden", !loggedIn);
  el.themeToggleBtn.classList.remove("hidden");

  if (!loggedIn) {
    el.sessionUser.textContent = "Bitte anmelden oder registrieren";
    el.sessionBox.querySelector(".session-label").textContent = "Nicht eingeloggt";
    el.roleLabel.textContent = "Gast";
    updateChampionBadge(null);
    state.activeView = "dashboard";
  } else {
    el.sessionBox.querySelector(".session-label").textContent = "Eingeloggt";
    el.roleLabel.textContent = ROLE_LABELS[state.currentUser.role] || state.currentUser.role;
  }

  applyViewVisibility();
  updateNavState();
  refreshSeedInputFromMatches(true);
  refreshGroupInputFromMatches(true);
  refreshPlayerTeams();
  renderMatches();
  renderLiveCenter();
  renderGroups();
  renderBracket();
  renderNotifications();
  renderArchives();
  renderAwards();
  renderMediaGallery();
  renderPublicShare();
  updateStats();
  checkUpcomingMatchNotifications();
}

function setActiveView(view) {
  if (!["dashboard", "live", "organization", "matches", "bracket", "public"].includes(view)) {
    return;
  }

  state.activeView = view;
  if (view === "public") {
    window.location.hash = "public";
  } else if (isPublicHashMode()) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  applyViewVisibility();
  updateNavState();

  if (view === "bracket") {
    renderBracket();
  }
  if (view === "live") {
    renderLiveCenter();
  }
  if (view === "organization") {
    renderGroups();
    renderPlayers();
    renderNotifications();
    renderArchives();
    renderAwards();
    renderMediaGallery();
  }
  if (view === "public") {
    renderPublicShare();
  }
}

function applyViewVisibility() {
  const loggedIn = Boolean(state.currentUser);
  const canMatchEdit = canManageMatches();

  const onDashboard = loggedIn && state.activeView === "dashboard";
  const onLive = loggedIn && state.activeView === "live";
  const onOrganization = loggedIn && state.activeView === "organization";
  const onMatches = loggedIn && state.activeView === "matches";
  const onBracket = loggedIn && state.activeView === "bracket";
  const onPublic = loggedIn && state.activeView === "public";

  toggleElement(el.dashboardSection, onDashboard);
  toggleElement(el.liveSection, onLive);
  toggleElement(el.adminTools, onDashboard && canMatchEdit);
  toggleElement(el.adminCreator, onDashboard && isAdmin());
  toggleElement(el.organizationSection, onOrganization);
  toggleElement(el.matchesSection, onMatches);
  toggleElement(el.bracketSection, onBracket);
  toggleElement(el.publicSection, onPublic);
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
  [
    el.loginMessage,
    el.registerMessage,
    el.adminMsg,
    el.matchMessage,
    el.bracketInfo,
    el.groupMessage,
    el.playerMessage,
    el.archiveMessage,
    el.liveMessage,
    el.publicMessage,
    el.awardsMessage,
    el.mediaMessage
  ].forEach((node) => {
    if (!node) {
      return;
    }
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

function getUniqueTeams() {
  const allTeams = state.matches.flatMap((match) => [match.heimTeam, match.gastTeam]);
  return [...new Set(allTeams.map((name) => name.trim()).filter(Boolean))];
}

function getGroupTeams() {
  return state.groups.flatMap((group) => group.teams.map((team) => team.name));
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

function getChampionName() {
  if (!state.bracket?.rounds?.length) {
    return null;
  }
  const lastRound = state.bracket.rounds[state.bracket.rounds.length - 1];
  return lastRound[0]?.winner || null;
}

function isPlayableMatch(match) {
  return Boolean(match.home && match.away && match.home !== "BYE" && match.away !== "BYE");
}

function currentRole() {
  return state.currentUser?.role || "viewer";
}

function isAdmin() {
  return currentRole() === "admin";
}

function isTrainer() {
  return currentRole() === "trainer";
}

function isReferee() {
  return currentRole() === "referee";
}

function canManageMatches() {
  return isAdmin() || isTrainer();
}

function canGenerateStructure() {
  return isAdmin() || isTrainer();
}

function canEnterResults() {
  return isAdmin() || isReferee();
}

function canManagePlayers() {
  return isAdmin() || isTrainer();
}

function canArchive() {
  return isAdmin();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
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

function persistGroups() {
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(state.groups));
}

function persistPlayers() {
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(state.players));
}

function persistNotifications() {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(state.notifications));
}

function persistArchives() {
  localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(state.archives));
}

function persistAwards() {
  localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(state.awards));
}

function persistMedia() {
  localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(state.media));
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
