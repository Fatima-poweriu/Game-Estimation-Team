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

  // Karte in den Kartenstapel zurückschieben
  if (target.id === "pile") {
    // Entferne die Karte aus der Matrix, falls sie dort liegt
    for (const prio in matrixCards) {
      const index = matrixCards[prio].indexOf(cardText);
      if (index > -1) {
        matrixCards[prio].splice(index, 1); // Karte aus Matrix entfernen
        cards.push(cardText); // Karte in den Stapel zurückschieben
        updateCardPile(); // Stapel aktualisieren
        updateMatrix(); // Matrix aktualisieren
        return;
      }
    }
  }

  // Karte in eine Matrix-Zelle verschieben
  else if (target.classList.contains("cell")) {
    const prio = target.getAttribute("data-prio"); // Ziel-Priorität
    if (!matrixCards[prio].includes(cardText)) {
      // Entferne die Karte aus dem Stapel
      cards = cards.filter((card) => card !== cardText);
      // Füge die Karte in die Matrix-Zelle ein
      matrixCards[prio].push(cardText);
      updateCardPile(); // Stapel aktualisieren
      updateMatrix(); // Matrix aktualisieren
    }
  }
}
function updateMatrix() {
  for (const prio in matrixCards) {
    const cell = document.querySelector(`.cell[data-prio="${prio}"]`);
    const description = getPrioDescription(prio); // Get the description for the cell
    cell.innerHTML = `<strong>${description}</strong><br>`; // Keep the description

    matrixCards[prio].forEach((cardText, index) => {
      const card = document.createElement("li");
      card.textContent = cardText;
      card.id = `matrix-card-${prio}-${index}`;
      card.classList.add("card");
      card.draggable = true; // Enable drag-and-drop
      card.addEventListener("dragstart", dragCard);

      cell.appendChild(card); // Add the card to the cell
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

document.addEventListener("DOMContentLoaded", loadCards);