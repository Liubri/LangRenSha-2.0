let players = []; // Initialize an empty players array;
const mainPlayerGrid = document.getElementById("mainPlayerGrid");

// Example players array for demonstration
const playersHardCoded = [
  { id: 1, name: "Unknown", role: "Werewolf", isAlive: true },
  { id: 2, name: "Player 2", role: "Villager", isAlive: true },
  // Add more players as needed
];

socket.on('updatePlayers', (updatedPlayers) => {
  console.log('updatePlayers called')
  players = updatedPlayers; // Update the players array
  renderPlayersGrid(); // Render the updated player grid
});

function renderPlayersGrid() {
  // Render players in the main game screen
  mainPlayerGrid.innerHTML = "";
  players.forEach((player) => {
    const playerCard = document.createElement("div");
    playerCard.className = `player-card ${player.isAlive ? "" : "dead"}`;
    playerCard.innerHTML = `
          <i data-lucide="user"></i>
          <div class="player-name">${player.name}</div>
          <div class="player-role">${player.role}</div>
      `;
    mainPlayerGrid.appendChild(playerCard);
  });
  lucide.createIcons();
}


function renderPlayersSmallGrid() {
  // Render players in the voting modal
  playersGrid.innerHTML = "";
  players.forEach((player) => {
    const playerElement = document.createElement("div");
    playerElement.className = `player ${player.isAlive ? "" : "dead"} ${
      selectedPlayer === player.id ? "selected" : ""
    }`;
    playerElement.innerHTML = `
          <i data-lucide="user" class="${
            player.isAlive ? "text-green-600" : "text-red-600"
          }"></i>
          <span class="player-name">${player.name}</span>
          ${
            selectedPlayer === player.id
              ? '<i data-lucide="check" class="check-icon"></i>'
              : ""
          }`;
    playerElement.addEventListener("click", () => selectPlayer(player.id));
    playersGrid.appendChild(playerElement);
  });
  lucide.createIcons();
}

// Call the render function