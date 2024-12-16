let players = []; // Initialize an empty players array;
let gameStarted = false;
let currentPlayer = null;
const mainPlayerGrid = document.getElementById("mainPlayerGrid");

// Example players array for demonstration
const playersHardCoded = [
  { id: 1, name: "Unknown", role: "Werewolf", isAlive: true },
  { id: 2, name: "Player 2", role: "Villager", isAlive: true },
  // Add more players as needed
];

socket.on("updatePlayers", (updatedPlayers) => {
  console.log("Updated Players:", players);
  players = updatedPlayers; // Update the players array
  renderPlayersGrid(); // Render the updated player grid
  checkStartGame();
});

socket.on("playerJoined", (player) => {
  currentPlayer = player;
});

socket.on("renderButtons", () => {
  console.log("Role assigned to current player:", currentPlayer);
  renderButtons();
});

function checkStartGame() {
  if (players.length == 3 && !gameStarted) {
    gameStarted = true;
    socket.emit("startGame");
  }
}

function renderButtons() {
  const actionsDiv = document.getElementById("action-buttons");
  actionsDiv.innerHTML = ""; 
  
  if (currentPlayer.role.name === "Werewolf") {
    actionsDiv.innerHTML = `
          <button class="action-button kill">Kill</button>
          <button class="action-button" id="openVoteModal">Vote</button>
        `;
  }
  if (currentPlayer.role.name === "Villager") {
    actionsDiv.innerHTML += `
          <button class="action-button" id="openVoteModal">Vote</button>
        `;
  }

  // Add event listeners for buttons
  const voteButton = document.getElementById("openVoteModal");
  if (voteButton) {
    voteButton.addEventListener("click", () => openModal("vote"));
  }

  const killButton = document.querySelector(".action-button.kill");
  if (killButton) {
    killButton.addEventListener("click", () => openModal("kill"));
  }
}


function renderPlayersGrid() {
  // Render players in the main game screen
  console.log(players); // Check if players array is populated
  mainPlayerGrid.innerHTML = "";
  players.forEach((player) => {
    const playerCard = document.createElement("div");
    playerCard.className = `player-card ${player.isAlive ? "" : "dead"}`;
    playerCard.innerHTML = `
          <i data-lucide="user"></i>
          <div class="player-name">${player.name}</div>
            <div class="player-role">${
              gameStarted ? player.role.name : "Role hidden"
            }</div>
     `;
    mainPlayerGrid.appendChild(playerCard);
  });
  lucide.createIcons();
}


//This is for the modal
const actionModal = document.getElementById("actionModal");
const modalTitle = document.getElementById("modalTitle");
const playersGrid = document.getElementById("playersGrid");
const actionButton = document.getElementById("actionButton");

let currentAction = null;
let selectedPlayer = null;

function openModal(action) {
  console.log("Opened Modal");
  currentAction = action;
  selectedPlayer = null;
  actionButton.disabled = true;

  switch (action) {
    case "vote":
      modalTitle.textContent = "Vote for a Player";
      actionButton.textContent = "Cast Vote";
      break;
    case "kill":
      modalTitle.textContent = "Choose a Player to Eliminate";
      actionButton.textContent = "Kill";
      break;
    case "poison":
      modalTitle.textContent = "Choose a Player to Poison";
      actionButton.textContent = "Use Poison Potion";
      break;
  }
  adjustButtonSizes();
  renderPlayersSmallGrid();
  actionModal.classList.add("show");
}

function adjustButtonSizes() {
  const buttons = document.querySelectorAll(".modal .action-button");

  console.log("Buttons found:", buttons); // Log the buttons to see if they are selected
  
  buttons.forEach((button) => {
    const wordCount = button.textContent.trim().split(/\s+/).length;
    console.log(`Button text: "${button.textContent.trim()}", Word count: ${wordCount}`);
    if (wordCount === 1) {
      button.classList.add("large");
      console.log("Added 'large' class to button:", button);
    } else {
      button.classList.remove("large");
      console.log("Removed 'large' class from button:", button);
    }
  });
}


function closeModal() {
  actionModal.classList.remove("show");
}

function renderPlayersSmallGrid() {
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
    playerElement.addEventListener("click", () => {
      selectPlayer(player.id);
    });
    playersGrid.appendChild(playerElement);
  });
  lucide.createIcons();
}

function selectPlayer(playerId) {
  selectedPlayer = playerId;
  renderPlayersSmallGrid();
  actionButton.disabled = false;
}

actionButton.addEventListener("click", () => {
  if (selectedPlayer) {
    const selectedPlayerName = players.find((player) => player.id === selectedPlayer);
    switch (currentAction) {
      case "vote":
        alert(`You voted for ${selectedPlayerName.name}`);
        break;
      case "kill":
        socket.emit('werewolfKill', selectedPlayerName.name);
        break;
      case "poison":
        alert(`You used the poison potion on ${selectedPlayerName}`);
        break;
    }
    closeModal();
  }
});
