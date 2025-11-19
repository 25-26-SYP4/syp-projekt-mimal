const spiele = [];
let isAdmin = false;

// Beispiel-Userliste
const users = [
  { username: "admin", password: "123", role: "admin" },
  { username: "gast", password: "456", role: "viewer" }
];

// Beim Laden prüfen ob eingeloggt
window.onload = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.role === "admin") {
    isAdmin = true;
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("adminStatus").style.display = "block";
  }
};

function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;
  const user = users.find(uObj => uObj.username === u && uObj.password === p);

  if (!user) {
    document.getElementById("loginMessage").textContent = "Login fehlgeschlagen!";
    return;
  }

  if (user.role !== "admin") {
    document.getElementById("loginMessage").textContent = "Nur Admins erlaubt!";
    return;
  }

  isAdmin = true;
  localStorage.setItem("user", JSON.stringify(user));
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("adminStatus").style.display = "block";
}

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

function spielSpeichern() {
  if (!isAdmin) {
    alert("Nur Admins dürfen Spiele anlegen!");
    return;
  }

  const datum = document.getElementById("spielDatum").value;
  const uhrzeit = document.getElementById("spielUhrzeit").value;
  const platz = document.getElementById("spielPlatz").value;
  const schiri = document.getElementById("spielSchiri").value;

  if (!datum || !uhrzeit || !platz || !schiri) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }

  const neuesSpiel = {
    datum,
    uhrzeit,
    platz,
    schiri
  };

  spiele.push(neuesSpiel);
  renderSpiele();
  resetForm();
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
