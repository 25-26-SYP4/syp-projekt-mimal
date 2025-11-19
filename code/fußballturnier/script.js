const spiele = [];
let isAdmin = false;

document.getElementById("adminToggle").addEventListener("change", function () {
  isAdmin = this.checked;
});

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
