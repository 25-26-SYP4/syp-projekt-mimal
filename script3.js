const teams = JSON.parse(localStorage.getItem("teams")) || [];

function teamSpeichern() {
  const name = document.getElementById("teamName").value.trim();
  if (!name) {
    alert("Bitte Teamnamen eingeben!");
    return;
  }

  const neuesTeam = { name };
  teams.push(neuesTeam);
  localStorage.setItem("teams", JSON.stringify(teams));
  renderTeams();
  document.getElementById("teamName").value = "";
}

function renderTeams() {
  const liste = document.getElementById("teamListe");
  liste.innerHTML = "";

  teams.forEach((team, index) => {
    const li = document.createElement("li");
    li.textContent = team.name;
    liste.appendChild(li);
  });
}

renderTeams(); // beim Start laden
