let players = []; // Initialize an empty players array;
let seerCheckedPlayers = [];
let gameStarted = false;
let currentPlayer = null;
let currentTurn = "";
const mainPlayerGrid = document.getElementById("mainPlayerGrid");

// Example players array for demonstration
const playersHardCoded = [
  { id: 1, name: "Unknown", role: "Werewolf", isAlive: true },
  { id: 2, name: "Player 2", role: "Villager", isAlive: true },
  // Add more players as needed
];

socket.on("updatePlayers", (updatedPlayers) => {
  players = updatedPlayers; // Update the players array
  console.log("Updated Players:", players);
  renderPlayersGrid(); // Render the updated player grid
  checkStartGame();
});

socket.on("updateGrid", () => {
  renderPlayersGrid();
});

socket.on("updateSeerChecked", (checkedPlayers) => {
  seerCheckedPlayers = checkedPlayers;
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

socket.on("updateCurrentTurn", (newTurn) => {
  currentTurn = newTurn;
  console.log("CurrentTurn:", currentTurn);
  console.log("CurrentPlayer:", currentPlayer);
  renderButtons();
});

function isActionAllowed(role, currentTurn) {
  return role === currentTurn;
}

function renderButtons() {
  const actionsDiv = document.getElementById("action-buttons");
  actionsDiv.innerHTML = "";

  const createButton = (text, className, action, isEnabled) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `action-button ${className}`;
    button.disabled = !isEnabled; // Enable or disable the button
    button.addEventListener("click", () => openModal(action));
    return button;
  };

  const isVotingPhase = currentTurn === "vote";

  if (currentPlayer.role.name === "Werewolf") {
    actionsDiv.appendChild(createButton("Kill", "kill", "kill", currentTurn === "werewolf"));
    actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
  }
  if (currentPlayer.role.name === "Witch") {
    actionsDiv.appendChild(createButton("Save", "save", "save", currentTurn === "witch"));
    actionsDiv.appendChild(createButton("Poison", "poison", "poison", currentTurn === "witch"));
    actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
  }
  if (currentPlayer.role.name === "Seer") {
    actionsDiv.appendChild(createButton("Check", "check", "check", currentTurn === "seer"));
    actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
  }
  if (currentPlayer.role.name === "Villager") {
    actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
  }
}



function renderPlayersGrid() {
  // Render players in the main game screen
  //console.log(players); // Check if players array is populated
  mainPlayerGrid.innerHTML = "";
  players.forEach((player) => {
    const playerCard = document.createElement("div");

    // Add player status (alive or dead)
    if (player.isAlive) {
      playerCard.className = "player-card";
    } else {
      playerCard.className = "player-card dead";
    }

    // Determine player role visibility
    let playerRole;
    if (gameStarted) {
      if (currentPlayer.role.name === "Seer") {
        console.log("SeerChecked", seerCheckedPlayers);
        if (seerCheckedPlayers.includes(player.id)) {
          if (player.role.alignment === "good") {
            playerRole = "Good";
          } else {
            playerRole = "Bad";
          }
        } else if (currentPlayer.id === player.id) {
          playerRole = player.role.name; // Show the current player's role
        } else {
          playerRole = ""; // Hide roles for others
        }
      } else if (currentPlayer.id === player.id) {
        playerRole = player.role.name; // Show the current player's role if not Seer
      } else {
        playerRole = ""; // Hide roles for others when the game is started
      }
    } else {
      playerRole = "Role hidden"; // Before the game starts, show "Role hidden"
    }

    // Set the innerHTML for the player card
    playerCard.innerHTML = `
          <i data-lucide="user"></i>
          <div class="player-name">${player.name}</div>
          <div class="player-role">${playerRole}</div>
     `;
    if (gameStarted) {
      if (
        currentPlayer.role.name === "Witch" &&
        wolfVictimId.includes(player.id) &&
        currentTurn === "witch"
      ) {
        console.log("Main WitchCSS called");
        playerCard.classList.add("pulse-animation");
        this.wolfVictimId = [];
      } else {
        console.log("WitchCurrentTurn:", currentTurn);
        console.log("Remove animationMain called");
        playerCard.classList.remove("pulse-animation");
      }
    }
    // Append the player card to the grid
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
    case "save":
      modalTitle.textContent = "Choose a Player to Save";
      actionButton.textContent = "Use Save Potion";
      break;
    case "check":
      modalTitle.textContent = "Choose a Player to Check";
      actionButton.textContent = "Check ID";
      break;
  }
  adjustButtonSizes();
  renderPlayersSmallGrid();
  actionModal.classList.add("show");
}

function adjustButtonSizes() {
  const buttons = document.querySelectorAll(".modal .action-button");

  //console.log("Buttons found:", buttons); // Log the buttons to see if they are selected

  buttons.forEach((button) => {
    const wordCount = button.textContent.trim().split(/\s+/).length;
    //console.log(
    //  `Button text: "${button.textContent.trim()}", Word count: ${wordCount}`
    //);
    if (wordCount === 1) {
      button.classList.add("large");
      //console.log("Added 'large' class to button:", button);
    } else {
      button.classList.remove("large");
      //console.log("Removed 'large' class from button:", button);
    }
  });
}

function closeModal() {
  actionModal.classList.remove("show");
}

let werewolfSelections = {};
socket.on("updateWerewolfTarget", (selections) => {
  werewolfSelections = selections;
  renderPlayersSmallGrid();
});

const werewolfColors = ["#a855f7", "#3b82f6", "#84cc16", "#e11d48", "#a855f7"]; // Orange, Blue, Green, Red, Purple

function getWerewolfColor(werewolfId) {
  return werewolfColors[werewolfId]; // Cycle through colors
}

let wolfVictimId = [];
socket.on("notifyKilled", (wolfChoice) => {
  console.log("NotifyCalled");
  wolfVictimId = wolfChoice;
  console.log("Wolf Victim", wolfVictimId);
  renderPlayersSmallGrid();
});

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
    if (currentPlayer.role.name === "Werewolf" && currentAction === "kill") {
      Object.entries(werewolfSelections).forEach(([werewolfId, targetId]) => {
        if (player.id === targetId) {
          const color = getWerewolfColor(werewolfId);
          playerElement.style.border = `3px solid ${color}`; // Dynamic color
        }
      });
    }
    if (wolfVictimId.includes(player.id) && currentAction === "save") {
      console.log("Witch CSS called");
      playerElement.classList.add("pulse-animation");
      this.wolfVictimId = [];
    } else {
      console.log("Remove animation called");
      playerElement.classList.remove("pulse-animation");
    }
    playerElement.addEventListener("click", () => {
      selectPlayer(player.id);
    });
    playersGrid.appendChild(playerElement);
  });
  lucide.createIcons();
}

function selectPlayer(playerId) {
  selectedPlayer = playerId;
  const { id } = players.find((player) => player.id === selectedPlayer);
  const werewolfId = currentPlayer.id;
  renderPlayersSmallGrid();
  actionButton.disabled = false;
  if (currentPlayer.role.name === "Werewolf") {
    socket.emit("werewolfTarget", { werewolfId: werewolfId, targetId: id });
  }
}

actionButton.addEventListener("click", () => {
  if (selectedPlayer) {
    const { id } = players.find((player) => player.id === selectedPlayer);
    switch (currentAction) {
      case "vote":
        socket.emit("votePlayerOut", id);
        break;
      case "kill":
        socket.emit("werewolfKill", id);
        break;
      case "poison":
        socket.emit("witchAction", { actionType: "poison", targetId: id });
        break;
      case "save":
        socket.emit("witchAction", { actionType: "save", targetId: id });
        break;
      case "check":
        socket.emit("seerAction", id);
        break;
    }
    this.currentAction = null;
    closeModal();
  }
});
