// ===== Simuliertes Active Directory =====
const activeDirectory = [
  { email: "admin@schule.at", role: "admin" },
  { email: "teamlead@schule.at", role: "teamleader" }
];

let currentUser = null;
let spiele = [];

// ===== Initialisierung =====
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

  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("keydown", e => {
      if (e.key === "Enter") login();
    });
  }

  const schiriInput = document.getElementById("spielSchiri");
  if (schiriInput) {
    schiriInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && currentUser?.role === "admin") {
        spielSpeichern();
      }
    });
  }
});

// ===== Login über Schul-Mail =====
function login() {
  const email = document.getElementById("email").value;
  const status = document.getElementById("loginStatus");

  if (!email.endsWith("@schule.at")) {
    status.textContent = "Bitte Schul-E-Mail-Adresse verwenden!";
    return;
  }

  const adUser = activeDirectory.find(u => u.email === email);
  if (!adUser) {
    status.textContent = "Benutzer nicht im Active Directory gefunden.";
    return;
  }

  currentUser = adUser;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  status.textContent = "Angemeldet über Schul-Account";
  handleLoginSuccess();
}

// ===== Login-Erfolg =====
function handleLoginSuccess() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");

  if (currentUser.role === "admin") {
    document.getElementById("spielForm").classList.remove("hidden");
  }

  if (currentUser.role === "teamleader") {
    document.getElementById("ergebnisForm")?.classList.remove("hidden");
    ladeSpieleInSelect();
  }
}

// ===== Logout =====
function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");

  document.getElementById("login").classList.remove("hidden");
  document.getElementById("spielForm").classList.add("hidden");
  document.getElementById("ergebnisForm")?.classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
  document.getElementById("loginStatus").textContent = "";
}

// ===== Spiel anlegen (Admin) =====
function spielSpeichern() {
  if (currentUser?.role !== "admin") {
    alert("Nur Admins dürfen Spiele anlegen!");
    return;
  }

  const datum = spielDatum.value;
  const uhrzeit = spielUhrzeit.value;
  const platz = spielPlatz.value;
  const schiri = spielSchiri.value;
  const fehlermeldung = document.getElementById("fehlermeldung");

  if (!datum || !uhrzeit || !platz || !schiri) {
    fehlermeldung.textContent = "Bitte alle Felder ausfüllen!";
    return;
  }

  fehlermeldung.textContent = "";

  spiele.unshift({ datum, uhrzeit, platz, schiri });
  localStorage.setItem("spiele", JSON.stringify(spiele));

  renderSpiele();
  resetForm();
  ladeSpieleInSelect();
}

// ===== Spiele anzeigen =====
function renderSpiele() {
  const liste = document.getElementById("spiele");
  liste.innerHTML = "";

  spiele.forEach(spiel => {
    const li = document.createElement("li");
    li.textContent = `${spiel.datum} ${spiel.uhrzeit} | Platz: ${spiel.platz} | SR: ${spiel.schiri}`;
    liste.appendChild(li);
  });
}

// ===== Formular reset =====
function resetForm() {
  spielDatum.value = "";
  spielUhrzeit.value = "";
  spielPlatz.value = "";
  spielSchiri.value = "";
}

// ===== Spiele für Ergebnis-Auswahl =====
function ladeSpieleInSelect() {
  const select = document.getElementById("spielAuswahl");
  if (!select) return;

  select.innerHTML = "";
  spiele.forEach((spiel, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${spiel.datum} ${spiel.uhrzeit} | ${spiel.platz}`;
    select.appendChild(opt);
  });
}

// ===== Ergebnis eintragen (Teamleader) =====
function ergebnisEintragen() {
  const index = spielAuswahl.value;
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
