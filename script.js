let users = JSON.parse(localStorage.getItem("users")) || [
  { username: "admin", password: "123", role: "admin" }
];

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let tournaments = JSON.parse(localStorage.getItem("tournaments")) || [];
let teams = JSON.parse(localStorage.getItem("teams")) || [];
let games = JSON.parse(localStorage.getItem("games")) || [];

document.addEventListener("DOMContentLoaded", () => {
  // Überprüfen, ob ein Benutzer eingeloggt ist, und dann die App laden
  if (currentUser) {
    showApp();  // Wenn eingeloggt, zeige die App
  } else {
    loginSection.classList.remove("hidden");  // Zeige den Login-Bereich, wenn niemand eingeloggt ist
  }
  renderAll();
  fillTeamSelect();
});

function fillTeamSelect() {
  // Optional: Nur wenn es im HTML ein Team-Select gibt (z.B. bei Registrierung)
  const regTeamEl = document.getElementById("regTeam");
  if (!regTeamEl) return;

  regTeamEl.innerHTML =
    `<option value="">Team auswählen</option>` +
    teams.map(t => `<option value="${t.name}">${t.name}</option>`).join("");
}

function saveAll() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  localStorage.setItem("tournaments", JSON.stringify(tournaments));
  localStorage.setItem("teams", JSON.stringify(teams));
  localStorage.setItem("games", JSON.stringify(games));
}

/* ================= LOGIN / REGISTER ================= */

function login() {
  const u = username.value.trim();
  const p = password.value.trim();

  const user = users.find(x => x.username === u && x.password === p);
  if (!user) {
    loginMsg.textContent = "❌ Login fehlgeschlagen";
    return;
  }

  currentUser = user;
  saveAll();
  showApp();
}

function register() {
  const u = regUser.value.trim();
  const p = regPass.value.trim();
  const regTeamEl = document.getElementById("regTeam");
  if (!regTeamEl) {
    alert("Team-Auswahl fehlt (Select mit id=regTeam)");
    return;
  }
  const team = regTeamEl.value;

  if (!u || !p || !team) {
    alert("Bitte alles ausfüllen");
    return;
  }

  if (users.find(x => x.username === u)) {
    alert("Benutzer existiert bereits");
    return;
  }

  users.push({
    username: u,
    password: p,
    role: "teamleader",
    team: team
  });

  saveAll();
  regUser.value = "";
  regPass.value = "";
  regTeamEl.value = "";

  alert("✅ Teamleiter angelegt – bitte einloggen");
}

/* ================= TURNIER / TEAMS ================= */

// Turnier auswählen und Details anzeigen
function showTournamentDetails() {
  const tournamentId = turnierSelect.value;
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return;

  renderTeamsAndGames(tournament);
}

// Teams und Spiele für das ausgewählte Turnier anzeigen
function renderTeamsAndGames(tournament) {
  teamList.innerHTML = tournament.teams.map(team => `<li>${team.name}</li>`).join("");
  gameList.innerHTML = tournament.games.map((game, i) => {
    return `
      <li>
        ${game.a} vs ${game.b} - ${game.ga ? `${game.ga} : ${game.gb}` : 'kein Ergebnis'}
      </li>
    `;
  }).join("");
}

// Turnier erstellen
function createTournament() {
  const tournament = {
    id: Date.now(),
    name: turnierName.value,
    modus: turnierModus.value,
    teams: [],
    games: []
  };

  tournaments.push(tournament);
  saveAll();
  renderAll();
}

// Team hinzufügen
function addTeam() {
  const teamName = teamName.value.trim();
  
  if (!teamName || isDuplicateName(teamName)) {
    alert("❌ Teamname ungültig oder schon vorhanden!");
    return;
  }

  const newTeam = { name: teamName };
  teams.push(newTeam);
  teamName.value = "";
  saveAll();
  renderAll();
  fillTeamSelect();
}

// Team bearbeiten
function editTeam(index) {
  const team = teams[index];
  const newName = prompt("Neuer Teamname:", team.name);
  
  if (newName && !isDuplicateName(newName)) {
    team.name = newName;
    saveAll();
    renderAll();
  } else {
    alert("❌ Teamname ist bereits vergeben oder ungültig");
  }
}

// Team löschen
function deleteTeam(index) {
  if (confirm("Möchtest du dieses Team wirklich löschen?")) {
    teams.splice(index, 1);
    saveAll();
    renderAll();
  }
}

// Validierung für doppelte Teamnamen
function isDuplicateName(name) {
  return teams.some(team => team.name.toLowerCase() === name.toLowerCase());
}

/* ================= SPIELE ================= */

// Generiere Spielplan
function generateGames() {
  games = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      games.push({ a: teams[i].name, b: teams[j].name, ga: null, gb: null });
    }
  }
  saveAll();
  renderAll();
}

// Ergebnisse speichern und anzeigen
function handleScoreChange(i) {
  const g = games[i];

  const gaRaw = document.getElementById("ga" + i).value;
  const gbRaw = document.getElementById("gb" + i).value;
  const ga = gaRaw === "" ? null : Number(gaRaw);
  const gb = gbRaw === "" ? null : Number(gbRaw);

  // Nur speichern, wenn beide Werte vorhanden und gültig sind.
  if (ga === null || gb === null) return;
  if (Number.isNaN(ga) || Number.isNaN(gb)) return;

  g.ga = ga;
  g.gb = gb;
  saveAll();
  renderAll();
}

/* ================= RENDER ================= */

function renderAll() {
  // Turnier-Liste
  tournamentList.innerHTML = tournaments.map(t => `
    <li>
      <a href="#" onclick="showTournamentDetails(${t.id})">${t.name}</a>
    </li>
  `).join("");

  teamList.innerHTML = teams.map((team, i) => `
    <li>
      ${team.name}
      <button onclick="editTeam(${i})">Bearbeiten</button>
      <button onclick="deleteTeam(${i})">Löschen</button>
    </li>
  `).join("");

  gameList.innerHTML = games.map((game, i) => {
    const hasResult = game.ga !== null && game.gb !== null;
    const mainLabel = hasResult
      ? `${game.a} ${game.ga}:${game.gb} ${game.b}`
      : `${game.a} _:_ ${game.b}`;

    return `
      <li class="game-row">
        <div class="score-entry">
          <div class="score-label">
            <span class="score-label-main">${mainLabel}</span>
            <span class="score-label-sub">Links: Tore für ${game.a} · Rechts: Tore für ${game.b}</span>
          </div>

          <div class="score-inputs">
            <label class="sr-only" for="ga${i}">Tore für ${game.a}</label>
            <input id="ga${i}" class="score-input" type="number" min="0" inputmode="numeric" value="${game.ga ?? ""}" onchange="handleScoreChange(${i})" placeholder="0">

            <span class="score-sep">:</span>

            <label class="sr-only" for="gb${i}">Tore für ${game.b}</label>
            <input id="gb${i}" class="score-input" type="number" min="0" inputmode="numeric" value="${game.gb ?? ""}" onchange="handleScoreChange(${i})" placeholder="0">
          </div>

          <div class="score-result">${hasResult ? `${game.ga} : ${game.gb}` : "kein Ergebnis"}</div>
        </div>
      </li>
    `;
  }).join("");
}

function renderRanking() {
  const stats = {};
  teams.forEach(t => stats[t.name] = { p: 0, t: 0, gt: 0 });

  games.filter(g => g.ga !== null).forEach(g => {
    stats[g.a].t += g.ga;
    stats[g.a].gt += g.gb;
    stats[g.b].t += g.gb;
    stats[g.b].gt += g.ga;

    if (g.ga > g.gb) stats[g.a].p += 3;
    else if (g.ga < g.gb) stats[g.b].p += 3;
    else { stats[g.a].p++; stats[g.b].p++; }
  });

  rankingBody.innerHTML =
    Object.entries(stats)
      .sort((a, b) => b[1].p - a[1].p || (b[1].t - b[1].gt) - (a[1].t - a[1].gt))
      .map(([n, s]) => `
        <tr>
          <td>${n}</td>
          <td>${s.t}</td>
          <td>${s.gt}</td>
          <td>${s.t - s.gt}</td>
          <td>${s.p}</td>
        </tr>
      `).join("");
}

function showApp() {
  loginSection.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  rankingSection.classList.remove("hidden");

  if (currentUser.role === "admin") {
    tournamentSection.classList.remove("hidden");
    teamSection.classList.remove("hidden");
    gameSection.classList.remove("hidden");
    return;
  }

  if (currentUser.role === "teamleader") {
    if (!currentUser.team) {
      teamAssign.classList.remove("hidden");
      fillAssignTeamSelect();
      return;
    }
    gameSection.classList.remove("hidden");
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  loginSection.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
  location.reload();
}

function fillAssignTeamSelect() {
  assignTeam.innerHTML =
    `<option value="">Team auswählen</option>` +
    teams.map(t => `<option value="${t.name}">${t.name}</option>`).join("");
}
