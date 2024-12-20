let players = []; // Initialize an empty players array;
let seerCheckedPlayers = [];
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

socket.on("updateCurrentTurn", (currentTurn) => {
  const killButton = document.querySelector(".action-button.kill");
  console.log(currentTurn);
  if(currentTurn !== "werewolf") {
    killButton.disabled = true;  
  } else {
    killButton.disabled = false;
  }
});

function renderButtons() {
  const actionsDiv = document.getElementById("action-buttons");
  actionsDiv.innerHTML = "";

  if (currentPlayer.role.name === "Werewolf") {
    actionsDiv.innerHTML = `
          <button class="action-button kill">Kill</button>
          <button class="action-button" id="openVoteModal">Vote</button>
        `;
  }
  if (currentPlayer.role.name === "Witch") {
    actionsDiv.innerHTML = `
          <button class="action-button save">Save</button>
          <button class="action-button poison">Poison</button>
          <button class="action-button" id="openVoteModal">Vote</button>
        `;
  }
  if (currentPlayer.role.name === "Seer") {
    actionsDiv.innerHTML = `
    <button class="action-button check">Check</button>
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

  const poisonButton = document.querySelector(".action-button.poison");
  if (poisonButton) {
    poisonButton.addEventListener("click", () => openModal("poison"));
  }

  const saveButton = document.querySelector(".action-button.save");
  if (saveButton) {
    saveButton.addEventListener("click", () => openModal("save"));
  }
  const checkButton = document.querySelector(".action-button.check");
  if (checkButton) {
    checkButton.addEventListener("click", () => openModal("check"));
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

    // if(gameStarted && currentPlayer.role.name == "Seer") {
    //   console.log("SeerChecked",seerCheckedPlayers);
    //   if(seerCheckedPlayers.includes(player.id)) {
    //     playerRole = player.role.name;
    //   } else if(currentPlayer.id === player.id) {
    //     playerRole = player.role.name;
    //   } else {
    //     playerRole = "";
    //   }
    // }
    // if (gameStarted && currentPlayer.id === player.id) {
    //   playerRole = player.role.name;
    // } else {
    //   playerRole = "";
    // }

    // if(!gameStarted) {
    //   playerRole = "Role Hidden";
    // }

    if (gameStarted) {
      if (currentPlayer.role.name === "Seer") {
        console.log("SeerChecked", seerCheckedPlayers);
        if (seerCheckedPlayers.includes(player.id)) {
          playerRole = player.role.name; // Show the role of the checked player
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
    if(currentPlayer.role.name === "Werewolf") {
      Object.entries(werewolfSelections).forEach(([werewolfId, targetId]) => {
        if (player.id === targetId) {
          const color = getWerewolfColor(werewolfId);
          playerElement.style.border = `3px solid ${color}`; // Dynamic color
        }
      });
    }
      //playerElement.classList.add("targeted"); // Add the 'targeted' class
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
  if(currentPlayer.role.name === "Werewolf") {
    socket.emit("werewolfTarget", {werewolfId: werewolfId, targetId: id});
  }
}

actionButton.addEventListener("click", () => {
  if (selectedPlayer) {
    const { name } = players.find((player) => player.id === selectedPlayer);
    const { id } = players.find((player) => player.id === selectedPlayer);
    switch (currentAction) {
      case "vote":
        socket.emit("votePlayerOut", id);
        break;
      case "kill":
        socket.emit("werewolfKill", id);
        break;
      case "poison":
        socket.emit("witchAction", {actionType: "poison", targetId: id});
        break;
      case "save":
        socket.emit("witchAction", {actionType: "save", targetId: id});
        break;
      case "check":
        socket.emit("seerAction", name);
        break;
    }
    closeModal();
  }
});
