document.addEventListener("DOMContentLoaded", () => {
  const gespeicherteSpiele = JSON.parse(localStorage.getItem("spiele")) || [];
  renderSpiele(gespeicherteSpiele);
});

function renderSpiele(spiele) {
  const liste = document.getElementById("spiele");
  liste.innerHTML = "";

  spiele.forEach(spiel => {
    const li = document.createElement("li");
    li.textContent = `${spiel.datum} ${spiel.uhrzeit} | Platz: ${spiel.platz} | SR: ${spiel.schiri}`;
    liste.appendChild(li);
  });
}
