const syncUrl = "sync.php";
let cards = [];
let matrixCards = {
  must: [],
  should: [],
  could: [],
  wont:[],
};

// Karten abrufen
async function loadCards() {
  const response = await fetch(syncUrl);
  cards = await response.json();
  updateCardPile();
}

// Karten speichern
async function saveCards() {
  await fetch(syncUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cards),
  });
}

// Kartenstapel aktualisieren
function updateCardPile() {
  const pile = document.getElementById("pile");
  pile.innerHTML = ""; // Bestehende Karten entfernen

  cards.forEach((text, index) => {
    const card = document.createElement("li");
    card.textContent = text;
    card.id = `card-${index}`;
    card.classList.add("card");
    card.draggable = true;
    card.addEventListener("dragstart", dragCard);

    // Klick-Handler für "selektieren"
    card.addEventListener("click", () => {
      document.querySelectorAll("#pile .selected").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });

    pile.appendChild(card);
  });
}

// Karten hinzufügen
function addCard() {
  const newCardText = document.getElementById("new-card-text").value.trim();
  if (newCardText) {
    cards.push(newCardText); // Neue Karte hinzufügen
    updateCardPile();        // Kartenstapel aktualisieren
    saveCards();             // Änderungen speichern
    document.getElementById("new-card-text").value = ""; // Eingabefeld leeren
  }
}

// Karten entfernen
function removeSelectedCard() {
  const selectedCard = document.querySelector("#pile .selected");
  if (selectedCard) {
    const cardIndex = parseInt(selectedCard.id.split("-")[1], 10); // Kartenindex extrahieren
    cards.splice(cardIndex, 1); // Karte aus dem Array entfernen
    updateCardPile();           // Kartenstapel aktualisieren
    saveCards();                // Änderungen speichern
  } else {
    alert("Bitte wählen Sie eine Karte aus, die entfernt werden soll.");
  }
}

// Drag-and-Drop
function dragCard(event) {
  const cardId = event.target.id; // ID der Karte
  const cardText = event.target.textContent; // Text der Karte
  event.dataTransfer.setData("cardId", cardId);
  event.dataTransfer.setData("cardText", cardText);
}

function allowDrop(event) {
  event.preventDefault();
}

function dropCard(event) {
  event.preventDefault();

  const cardId = event.dataTransfer.getData("cardId");
  const cardText = event.dataTransfer.getData("cardText");
  const target = event.target;

  // Falls die Karte aus einer Matrix-Zelle zurück in den Stapel gezogen wird
  if (target.id === "pile") {
    for (const prio in matrixCards) {
      const index = matrixCards[prio].indexOf(cardText);
      if (index > -1) {
        matrixCards[prio].splice(index, 1); // Karte aus Matrix entfernen
        cards.push(cardText); // Karte zurück in den Stapel
        updateCardPile(); // Kartenstapel aktualisieren
        updateMatrix(); // Matrix aktualisieren
        return;
      }
    }
  }

  // Falls die Karte in eine Matrix-Zelle gezogen wird
  else if (target.classList.contains("cell")) {
    const prio = target.getAttribute("data-prio"); // Ziel-Priorität
    if (!matrixCards[prio].includes(cardText)) {
      // Entferne die Karte aus dem Stapel, falls sie noch vorhanden ist
      cards = cards.filter((card) => card !== cardText);
      
      // Füge die Karte in die Matrix ein
      matrixCards[prio].push(cardText);
      updateCardPile(); // Kartenstapel aktualisieren
      updateMatrix(); // Matrix aktualisieren
    }
  }
}
function updateMatrix() {
  for (const prio in matrixCards) {
    const cell = document.querySelector(`.cell[data-prio="${prio}"]`);
    
    // Nur die Karten entfernen, die innerhalb der Matrix-Zelle liegen
    const cardsInCell = cell.querySelectorAll(".card");
    cardsInCell.forEach(card => card.remove());

    // Karten hinzufügen
    matrixCards[prio].forEach((cardText, index) => {
      const card = document.createElement("li");
      card.textContent = cardText;
      card.id = `matrix-card-${prio}-${index}`;
      card.classList.add("card");
      card.draggable = true;
      card.addEventListener("dragstart", dragCard);

      cell.appendChild(card); // Karte zur Matrix hinzufügen
    });
  }
}

function resetGame() {
  cards = [];  // Kartenliste leeren
  matrixCards = { must: [], should: [], could: [], wont: [] }; // Priorisierungsmatrix zurücksetzen
  updateCardPile();  // UI aktualisieren

  saveCards();       // Änderungen auf dem Server speichern
}
if (!sessionStorage.getItem('initialized')) {
  resetGame();
  sessionStorage.setItem('initialized', 'true');
}
// Spiel initialisieren
updateCardPile();
document.getElementById("download-matrix").addEventListener("click", function() {
  const canvas = document.getElementById("matrixCanvas");
  const ctx = canvas.getContext("2d");

  // Hole die Matrix
  const matrix = document.getElementById("matrix");
  const cells = matrix.querySelectorAll(".cell");

  // Setze die Canvas-Größe (angepasst an Anzahl der Zellen)
  const cellWidth = 250; 
  const cellHeight = 150;
  const cols = 2; // Anzahl der Spalten
  const rows = Math.ceil(cells.length / cols);
  canvas.width = cols * cellWidth;
  canvas.height = rows * cellHeight;

  // Hintergrundfarbe
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Zeichne die Priorisierungsmatrix auf das Canvas
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = "#000";

  cells.forEach((cell, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Zeichne den Rahmen
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // Schreibe die Priorität
      ctx.fillText(cell.getAttribute("data-prio").toUpperCase(), x + 10, y + 30);

      // Hole die Karten innerhalb der Prioritätszelle
      const cards = cell.querySelectorAll(".card");
      let yOffset = 50;
      cards.forEach(card => {
          ctx.fillText("- " + card.textContent, x + 10, y + yOffset);
          yOffset += 20;
      });
  });

  // Erstelle ein Bild und lade es herunter
  const image = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = image;
  link.download = "priorisierungsmatrix.png";
  link.click();
});
