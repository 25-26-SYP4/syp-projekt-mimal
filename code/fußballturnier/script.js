const spiele = [];
let isAdmin = false;

// Beim ersten Laden Standard-User nur einmal anlegen
if (!localStorage.getItem("users")) {
  const defaultUsers = [
    { username: "admin", password: "123", role: "admin" },
    { username: "gast", password: "456", role: "viewer" }
  ];
  localStorage.setItem("users", JSON.stringify(defaultUsers));
}

// Beim Laden prüfen ob eingeloggt
window.onload = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.role === "admin") {
  isAdmin = true;
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("adminStatus").style.display = "block";
  document.getElementById("adminTools").style.display = "block";
}

};

function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;
  const users = JSON.parse(localStorage.getItem("users")) || [];

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
  document.getElementById("adminTools").style.display = "block";
}

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

function register() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const role = "viewer"; // Erzwingen

  if (!username || !password) {
    document.getElementById("registerMessage").style.color = "red";
    document.getElementById("registerMessage").textContent = "Bitte alles ausfüllen!";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.find(u => u.username === username)) {
    document.getElementById("registerMessage").style.color = "red";
    document.getElementById("registerMessage").textContent = "Benutzer existiert bereits!";
    return;
  }

  users.push({ username, password, role });
  localStorage.setItem("users", JSON.stringify(users));

  document.getElementById("registerMessage").style.color = "green";
  document.getElementById("registerMessage").textContent = `Benutzer "${username}" wurde als viewer registriert.`;
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

  spiele.forEach((spiel, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${spiel.datum} ${spiel.uhrzeit} | Platz: ${spiel.platz} | SR: ${spiel.schiri}
      ${isAdmin ? `<button onclick="editSpiel(${index})">Bearbeiten</button>
                   <button onclick="deleteSpiel(${index})">Löschen</button>` : ""}
    `;
    liste.appendChild(li);
  });
}

function createAdmin() {
  const name = document.getElementById("adminName").value;
  const pass = document.getElementById("adminPass").value;

  if (!name || !pass) {
    document.getElementById("adminMsg").textContent = "Bitte alles ausfüllen!";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.find(u => u.username === name)) {
    document.getElementById("adminMsg").textContent = "Benutzer existiert bereits!";
    return;
  }

  users.push({ username: name, password: pass, role: "admin" });
  localStorage.setItem("users", JSON.stringify(users));
  document.getElementById("adminMsg").textContent = `Admin "${name}" wurde erstellt.`;
}


function resetForm() {
  document.getElementById("spielDatum").value = "";
  document.getElementById("spielUhrzeit").value = "";
  document.getElementById("spielPlatz").value = "";
  document.getElementById("spielSchiri").value = "";
}

function deleteSpiel(index) {
  if (!isAdmin) {
    alert("Nur Admins dürfen Spiele löschen!");
    return;
  }
  spiele.splice(index, 1);
  renderSpiele();
}

function editSpiel(index) {
  if (!isAdmin) {
    alert("Nur Admins dürfen Spiele bearbeiten!");
    return;
  }
  const spiel = spiele[index];
  document.getElementById("spielDatum").value = spiel.datum;
  document.getElementById("spielUhrzeit").value = spiel.uhrzeit;
  document.getElementById("spielPlatz").value = spiel.platz;
  document.getElementById("spielSchiri").value = spiel.schiri;
  spiele.splice(index, 1);
  renderSpiele();
}

function exportSpiele() {
  const json = JSON.stringify(spiele, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "spiele.json";
  a.click();
}

function suchen(suchtext) {
  const gefiltert = spiele.filter(spiel => 
    spiel.datum.includes(suchtext) || 
    spiel.platz.includes(suchtext) ||
    spiel.schiri.includes(suchtext)
  );
  return gefiltert;
}

function displaySearchResults(suchtext) {
  const ergebnisse = spiele
    .map((spiel, index) => ({ spiel, index }))
    .filter(({ spiel }) =>
      spiel.datum.includes(suchtext) ||
      spiel.platz.includes(suchtext) ||
      spiel.schiri.includes(suchtext)
    );
  const liste = document.getElementById("spiele");
  liste.innerHTML = "";

  if (ergebnisse.length === 0) {
    liste.innerHTML = "<li>Keine Ergebnisse gefunden</li>";
    return;
  }

  ergebnisse.forEach(({ spiel, index }) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${spiel.datum} ${spiel.uhrzeit} | Platz: ${spiel.platz} | SR: ${spiel.schiri}
      ${isAdmin ? `<button onclick="editSpiel(${index})">Bearbeiten</button>
                   <button onclick="deleteSpiel(${index})">Löschen</button>` : ""}
    setTimeout(() => {
      li.style.opacity = "0";
      li.style.transform = "translateX(20px)";
      li.style.transition = "all 0.3s ease";
    }, 50);
    `;
    liste.appendChild(li);
  });


}
