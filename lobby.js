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
// players = playersHardCoded;
// renderPlayersGrid();
socket.on("updatePlayers", (updatedPlayers) => {
  players = updatedPlayers; // Update the players array
  //console.log("Updated Players:", players);
  renderPlayersGrid(); // Render the updated player grid
  if (gameStarted) {
    checkIfAlive();
  }
  //checkStartGame();
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
  //console.log("Role assigned to current player:", currentPlayer);
  renderButtons();
});

socket.on("startGame", () => {
  socket.emit("startGame");
  gameStarted = true;
});

function checkIfAlive() {
  const currentPlayerInList = players.find(
    (player) => player.id === currentPlayer.id
  );
  if (currentPlayerInList) {
    if (!currentPlayerInList.isAlive) {
      currentPlayer.isAlive = false; // Update currentPlayer status
      console.log(`${currentPlayer.name} is now dead.`);
    }
  }
}

function isAlive() {
  return currentPlayer.isAlive;
}

// function checkStartGame() {
//   if (players.length == 3 && !gameStarted) {
//     gameStarted = true;
//     socket.emit("startGame");
//   }
// }

socket.on("updateCurrentTurn", (newTurn) => {
  currentTurn = newTurn;
  console.log("CurrentTurn:", currentTurn);
  //console.log("CurrentPlayer:", currentPlayer);
  const currentTurnText = document.getElementById("currentTurnText");
  currentTurnText.textContent = currentTurn;
  renderButtons();
    // Check if the current player is alive
  //console.log("Role: ", currentPlayer.role.name);
  //console.log("Alive: ", isAlive());
  //console.log("CurrentTurn: ", currentTurn);
  if(gameStarted) {
    if (!isAlive() && currentTurn !== "vote" && currentPlayer.role.name.toLowerCase() === currentTurn) {
      // Check if there are any alive players before emitting nextTurn
      const alivePlayersWithRole = players.filter(player => player.isAlive && player.role.name === currentPlayer.role.name);
      if (alivePlayersWithRole.length > 0) {
        return;
      } else {
        socket.emit("nextTurn");
      }
    }
    if(currentTurn === "vote") {
      console.log("CurrentTurn is voting");
      socket.emit("updateGameState");
    }
  }
});

function isActionAllowed(role, currentTurn) {
  return role === currentTurn;
}

function checkPlayerAlive() {
  if (currentPlayer.isAlive == false) {
    return false;
  } else {
    return true;
  }
}

let witchHasMedicine = true;
let witchHasPoison = true;

socket.on("witchUsedItem", (item) => {
  if(item == "poison") {
    witchHasPoison = false;
  } else {
    witchHasMedicine = false;
  }
});

function renderButtons() {
  const actionsDiv = document.getElementById("action-buttons");
  actionsDiv.innerHTML = "";

  // Check if the current player is alive
  const isPlayerAlive = currentPlayer && currentPlayer.isAlive;

  const createButton = (text, className, action, isEnabled) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `action-button ${className}`;
    button.disabled = !isEnabled; // Disable or enable the button
    button.addEventListener("click", () => openModal(action));
    return button;
  };
  
  const createPassTurn = (isEnabled) => {
    const button = document.createElement("button");
    button.textContent = "Pass Turn";
    button.className = `action-button passTurn`;
    button.disabled = !isEnabled;
    button.addEventListener("click", () => passPlayerTurn());
    return button;
  }

  const isVotingPhase = currentTurn === "vote";

  // Only render buttons if the player is alive
  if (isPlayerAlive) {
    if (currentPlayer.role.name === "Werewolf") {
      actionsDiv.appendChild(
        createButton("Kill", "kill", "kill", currentTurn === "werewolf")
      );
      actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
    }
    if (currentPlayer.role.name === "Witch") {
      actionsDiv.appendChild(
        createButton("Save", "save", "save", currentTurn === "witch" && witchHasMedicine)
      );
      actionsDiv.appendChild(
        createButton("Poison", "poison", "poison", currentTurn === "witch" && witchHasPoison)
      );
      actionsDiv.appendChild(createPassTurn(currentTurn === "witch"));
      actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
    }
    if (currentPlayer.role.name === "Seer") {
      actionsDiv.appendChild(
        createButton("Check", "check", "check", currentTurn === "seer")
      );
      actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
    }
    if (currentPlayer.role.name === "Villager") {
      actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
    }
    if (currentPlayer.role.name === "Jester") {
      actionsDiv.appendChild(createButton("Vote", "vote", "vote", isVotingPhase));
    }
  } else {
    // If the player is dead, disable all action buttons
    const deadMessage = document.createElement("p");
    deadMessage.textContent = "You are dead and cannot perform any actions.";
    actionsDiv.appendChild(deadMessage);
  }
}
// Utility function to toggle buttons
function toggleButtonsGlobally(isEnabled) {
  const buttons = document.querySelectorAll(".action-button");
  buttons.forEach((button) => {
    button.disabled = !isEnabled;
  });
}

// Listen for toggleButtons event
socket.on("toggleButtons", (isEnabled) => {
  toggleButtonsGlobally(isEnabled);
});

function tButtons() { 
  socket.emit("toggleAllButtons"); 
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
        //console.log("SeerChecked", seerCheckedPlayers);
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
        //console.log("Main WitchCSS called");
        playerCard.classList.add("pulse-animation");
        this.wolfVictimId = [];
      } else {
        //console.log("WitchCurrentTurn:", currentTurn);
        //console.log("Remove animationMain called");
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
const skipVoteButton = document.getElementById("skipVote");
const cancelSkill = document.getElementById("cancelSkill");

let currentAction = null;
let selectedPlayer = null;

function openModal(action) {
  currentAction = action;
  selectedPlayer = null;
  actionButton.disabled = true;
  skipVoteButton.classList.add("hidden");
  cancelSkill.classList.add("hidden");
  switch (action) {
    case "vote":
      modalTitle.textContent = "Vote for a Player";
      actionButton.textContent = "Cast Vote";
      skipVoteButton.classList.remove("hidden");
      skipVoteButton.textContent = "Skip Vote";
      break;
    case "kill":
      modalTitle.textContent = "Choose a Player to Eliminate";
      actionButton.textContent = "Kill";
      break;
    case "poison":
      modalTitle.textContent = "Choose a Player to Poison";
      actionButton.textContent = "Use Poison Potion";
      cancelSkill.classList.remove("hidden");
      break;
    case "save":
      modalTitle.textContent = "Choose a Player to Save";
      actionButton.textContent = "Use Save Potion";
      cancelSkill.classList.remove("hidden");
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
  //console.log("NotifyCalled");
  wolfVictimId = wolfChoice;
  //console.log("Wolf Victim", wolfVictimId);
  renderPlayersSmallGrid();
});

function renderPlayersSmallGrid() {
  playersGrid.innerHTML = "";
  const alivePlayers = players.filter(player => player.isAlive);
  alivePlayers.forEach((player) => {
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
      //console.log("Witch CSS called");
      playerElement.classList.add("pulse-animation");
      this.wolfVictimId = [];
    } else {
      //console.log("Remove animation called");
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
        socket.emit("voterData", { voterId: currentPlayer.id, targetId: id });
        socket.emit("votePlayerOut", { voteType: "vote", targetId: id });
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
    //socket.emit("turnEndedBeforeTimer");
    this.currentAction = null;
    closeModal();
  }
});

skipVoteButton.addEventListener("click", () => {
  socket.emit("voterData", { voterId: currentPlayer.id, targetId: 0});
  socket.emit("votePlayerOut", { voteType: "skip", targetId: 0 });
  closeModal();
});

cancelSkill.addEventListener("click", () => {
  selectedPlayer = null;
  closeModal();
});

function passPlayerTurn() {
  selectedPlayer = null;
  socket.emit("nextTurn");
  closeModal();
}