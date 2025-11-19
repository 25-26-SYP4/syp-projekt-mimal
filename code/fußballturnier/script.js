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
}

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

function register() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

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
  document.getElementById("registerMessage").textContent = `Benutzer "${username}" wurde angelegt.`;
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
