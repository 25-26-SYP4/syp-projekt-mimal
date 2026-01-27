let users = JSON.parse(localStorage.getItem("users")) || [
  { username: "admin", password: "123", role: "admin" }
];

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let tournaments = JSON.parse(localStorage.getItem("tournaments")) || [];
let teams = JSON.parse(localStorage.getItem("teams")) || [];
let games = JSON.parse(localStorage.getItem("games")) || [];

document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) showApp();
  renderAll();
  fillTeamSelect();
});

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
  const team = regTeam.value;

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
  regTeam.value = "";

  alert("✅ Teamleiter angelegt – bitte einloggen");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  location.reload();
}


function saveResult(i) {
  const g = games[i];

  if (currentUser.role === "teamleader") {
    if (currentUser.team !== g.a && currentUser.team !== g.b) {
      alert("❌ Nur Spiele deines Teams!");
      return;
    }
  }

  g.ga = Number(document.getElementById("ga"+i).value);
  g.gb = Number(document.getElementById("gb"+i).value);
  saveAll();
  renderAll();
}


function assignTeam() {
  const team = assignTeam.value;
  if (!team) return alert("Bitte Team auswählen");

  currentUser.team = team;
  saveAll();

  teamAssign.classList.add("hidden");
  gameSection.classList.remove("hidden");
}


function fillAssignTeamSelect() {
  assignTeam.innerHTML =
    `<option value="">Team auswählen</option>` +
    teams.map(t => `<option value="${t.name}">${t.name}</option>`).join("");
}


/* ================= UI ================= */

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


/* ================= TURNIER / TEAMS ================= */

function createTournament() {
  tournaments.push({ name: turnierName.value, modus: turnierModus.value });
  turnierName.value = "";
  saveAll();
  renderAll();
}

function addTeam() {
  teams.push({ name: teamName.value });
  teamName.value = "";
  saveAll();
  renderAll();
  fillTeamSelect();
}

function fillTeamSelect() {
  if (!regTeam) return;
  regTeam.innerHTML =
    `<option value="">Team auswählen</option>` +
    teams.map(t => `<option value="${t.name}">${t.name}</option>`).join("");
}

/* ================= SPIELE ================= */

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

function saveResult(i) {
  const g = games[i];

  if (currentUser.role === "teamleader") {
    if (currentUser.team !== g.a && currentUser.team !== g.b) {
      alert("❌ Du darfst nur Spiele deines Teams eintragen");
      return;
    }
  }

  const ga = Number(document.getElementById("ga" + i).value);
  const gb = Number(document.getElementById("gb" + i).value);

  if (isNaN(ga) || isNaN(gb)) return;

  g.ga = ga;
  g.gb = gb;
  saveAll();
  renderAll();
}

/* ================= RENDER ================= */

function renderAll() {
  tournamentList.innerHTML =
    tournaments.map(t => `<li>${t.name} (${t.modus})</li>`).join("");

  teamList.innerHTML =
    teams.map(t => `<li>${t.name}</li>`).join("");

  gameList.innerHTML =
    games.map((g, i) => {
      const canEdit =
        currentUser &&
        (currentUser.role === "admin" ||
         (currentUser.role === "teamleader" &&
          (currentUser.team === g.a || currentUser.team === g.b)));

      return `
        <li>
          <strong>${g.a}</strong> vs <strong>${g.b}</strong>
          ${
            canEdit
              ? `
                <input id="ga${i}" type="number" value="${g.ga ?? ""}">
                <input id="gb${i}" type="number" value="${g.gb ?? ""}">
                <button onclick="saveResult(${i})">Speichern</button>
              `
              : g.ga !== null
                ? `<span>${g.ga} : ${g.gb}</span>`
                : `<em>kein Ergebnis</em>`
          }
        </li>
      `;
    }).join("");

  renderRanking();
}

function renderRanking() {
  const stats = {};
  teams.forEach(t => stats[t.name] = { p:0,t:0,gt:0 });

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
      .sort((a,b)=>b[1].p-a[1].p || (b[1].t-b[1].gt)-(a[1].t-a[1].gt))
      .map(([n,s]) => `
        <tr>
          <td>${n}</td>
          <td>${s.t}</td>
          <td>${s.gt}</td>
          <td>${s.t - s.gt}</td>
          <td>${s.p}</td>
        </tr>
      `).join("");
}
