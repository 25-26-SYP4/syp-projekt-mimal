const users = [
  { username: "admin", password: "123", role: "admin" },
  { username: "teamlead", password: "456", role: "teamleader" }
];

let currentUser = null;
let spiele = [];

document.addEventListener("DOMContentLoaded", () => {
  const gespeicherteSpiele = localStorage.getItem("spiele");
  if (gespeicherteSpiele) {
    spiele = JSON.parse(gespeicherteSpiele);
    renderSpiele();
  }

  const gespeicherterUser = localStorage.getItem("currentUser");
  if (gespeicherterUser) {
    currentUser = JSON.parse(gespeicherterUser);
    handleLoginSuccess();
  }

  document.getElementById("password").addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });
  document.getElementById("spielSchiri").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      if (currentUser?.role === "admin") spielSpeichern();
      else if (currentUser?.role === "teamleader") ergebnisEintragen();
    }
  });
});

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("loginStatus");

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    handleLoginSuccess();
    status.textContent = "Eingeloggt als " + user.username;
  } else {
    status.textContent = "Login fehlgeschlagen.";
  }
}

function handleLoginSuccess() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");

  if (currentUser.role === "admin") {
    document.getElementById("spielForm").classList.remove("hidden");
  } else if (currentUser.role === "teamleader") {
    document.getElementById("ergebnisForm").classList.remove("hidden");
    ladeSpieleInSelect();
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("spielForm").classList.add("hidden");
  document.getElementById("ergebnisForm").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
  document.getElementById("loginStatus").textContent = "";
}

function spielSpeichern() {
  const datum = document.getElementById("spielDatum").value;
  const uhrzeit = document.getElementById("spielUhrzeit").value;
  const platz = document.getElementById("spielPlatz").value;
  const schiri = document.getElementById("spielSchiri").value;
  const fehlermeldung = document.getElementById("fehlermeldung");

  if (!datum || !uhrzeit || !platz || !schiri) {
    fehlermeldung.textContent = "Bitte alle Felder ausfüllen!";
    return;
  }

  fehlermeldung.textContent = "";

  const neuesSpiel = { datum, uhrzeit, platz, schiri };
  spiele.unshift(neuesSpiel);
  localStorage.setItem("spiele", JSON.stringify(spiele));
  renderSpiele();
  resetForm();
  ladeSpieleInSelect(); // auch Teamleader-Dropdown aktualisieren
}

function renderSpiele() {
  const liste = document.getElementById("spiele");
  liste.innerHTML = "";

  spiele.forEach(spiel => {
    const li = document.createElement("li");
    li.textContent = `${spiel.datum} ${spiel.uhrzeit} | Platz: ${spiel.platz} | SR: ${spiel.schiri}`;
    liste.appendChild(li);
  });
}

function resetForm() {
  document.getElementById("spielDatum").value = "";
  document.getElementById("spielUhrzeit").value = "";
  document.getElementById("spielPlatz").value = "";
  document.getElementById("spielSchiri").value = "";
}

function ladeSpieleInSelect() {
  const select = document.getElementById("spielAuswahl");
  select.innerHTML = "";
  spiele.forEach((spiel, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${spiel.datum} ${spiel.uhrzeit} | ${spiel.platz}`;
    select.appendChild(opt);
  });
}

function ergebnisEintragen() {
  const index = document.getElementById("spielAuswahl").value;
  const toreA = parseInt(document.getElementById("toreA").value);
  const toreB = parseInt(document.getElementById("toreB").value);
  const msg = document.getElementById("ergebnisMsg");

  if (isNaN(toreA) || isNaN(toreB)) {
    msg.textContent = "Beide Tore müssen eingetragen werden!";
    msg.style.color = "red";
    return;
  }

  spiele[index].toreA = toreA;
  spiele[index].toreB = toreB;
  localStorage.setItem("spiele", JSON.stringify(spiele));

  msg.textContent = "Ergebnis gespeichert!";
  msg.style.color = "green";
}
