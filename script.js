const users = [
  { username: "admin", password: "123", role: "admin" },
  { username: "teamlead", password: "456", role: "teamleader" },
  { username: "gast", password: "789", role: "viewer" }
];

let currentUser = null;
let spiele = JSON.parse(localStorage.getItem("spiele")) || [];

document.addEventListener("DOMContentLoaded", () => {
  const savedUser = JSON.parse(localStorage.getItem("currentUser"));
  if (savedUser) {
    currentUser = savedUser;
    setupUI();
  }
  renderSpiele();

  document.getElementById("password").addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });
});

function login() {
  const u = username.value;
  const p = password.value;

  const user = users.find(x => x.username === u && x.password === p);
  if (!user) {
    loginMessage.textContent = "Login fehlgeschlagen";
    return;
  }

  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(user));
  setupUI();
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  location.reload();
}

function setupUI() {
  login.classList.add("hidden");
  logoutBtn.classList.remove("hidden");

  if (currentUser.role === "admin") {
    spielForm.classList.remove("hidden");
  }

  if (currentUser.role === "teamleader") {
    ergebnisForm.classList.remove("hidden");
  }
}

function spielSpeichern() {
  if (currentUser.role !== "admin") return;

  if (!spielDatum.value || !spielUhrzeit.value || !spielPlatz.value || !spielSchiri.value) {
    fehlermeldung.textContent = "Alle Felder ausfüllen!";
    return;
  }

  spiele.push({
    datum: spielDatum.value,
    uhrzeit: spielUhrzeit.value,
    platz: spielPlatz.value,
    schiri: spielSchiri.value,
    ergebnis: "-"
  });

  localStorage.setItem("spiele", JSON.stringify(spiele));
  renderSpiele();
}

function ergebnisSpeichern() {
  if (currentUser.role !== "teamleader") return;
  if (spiele.length === 0) return;

  spiele[spiele.length - 1].ergebnis = ergebnisText.value;
  localStorage.setItem("spiele", JSON.stringify(spiele));
  renderSpiele();
}

function renderSpiele() {
  spieleUl = document.getElementById("spiele");
  spieleUl.innerHTML = "";

  spiele.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.datum} ${s.uhrzeit} | ${s.platz} | ${s.schiri} | Ergebnis: ${s.ergebnis}`;
    spieleUl.appendChild(li);
  });
}
