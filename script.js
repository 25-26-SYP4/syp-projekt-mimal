const users = [
  { username: "admin", password: "123", role: "admin" },
  { username: "teamlead", password: "456", role: "teamleader" }
];

let currentUser = null;
const spiele = [];

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("loginStatus");

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    status.textContent = "Erfolgreich eingeloggt als " + user.username;
    if (user.role === "admin") {
      document.getElementById("spielForm").classList.remove("hidden");
    }
  } else {
    status.textContent = "Login fehlgeschlagen.";
  }
}

function spielSpeichern() {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Nur Admins dürfen Spiele anlegen!");
    return;
  }

  const datum = document.getElementById("spielDatum").value;
  const uhrzeit = document.getElementById("spielUhrzeit").value;
  const platz = document.getElementById("spielPlatz").value;
  const schiri = document.getElementById("spielSchiri").value;
  const fehlermeldung = document.getElementById("fehlermeldung");

  if (!datum || !uhrzeit || !platz || !schiri) {        
    fehlermeldung.textContent = "Eines der Felder (Datum, Uhrzeit, Platz, Schiedsrichter) wurde nicht ausgefüllt";
    return;
  }

  fehlermeldung.textContent = "";

  const neuesSpiel = { datum, uhrzeit, platz, schiri };
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
