window.onload = () => {
    const spiele = JSON.parse(localStorage.getItem("spiele")) || [];
    const select = document.getElementById("spielAuswahl");

    spiele.forEach((spiel, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${spiel.datum} ${spiel.uhrzeit} - Platz ${spiel.platz}`;
        select.appendChild(option);
    });
};

function ergebnisSpeichern() {
    const index = document.getElementById("spielAuswahl").value;
    const toreA = parseInt(document.getElementById("toreA").value);
    const toreB = parseInt(document.getElementById("toreB").value);

    if (isNaN(toreA) || isNaN(toreB)) {
        document.getElementById("saveMsg").textContent = "Bitte beide Tore eintragen.";
        document.getElementById("saveMsg").style.color = "red";
        return;
    }

    const spiele = JSON.parse(localStorage.getItem("spiele")) || [];
    if (!spiele[index]) return;

    spiele[index].toreA = toreA;
    spiele[index].toreB = toreB;

    localStorage.setItem("spiele", JSON.stringify(spiele));
    document.getElementById("saveMsg").textContent = "Ergebnis gespeichert.";
    document.getElementById("saveMsg").style.color = "green";
}
