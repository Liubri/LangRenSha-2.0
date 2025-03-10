let players = []; // Initialize an empty players array;
let seerCheckedPlayers = [];
let gameStarted = false;
let currentPlayer = null;
let currentTurn = "";
const mainPlayerGrid = document.getElementById("mainPlayerGrid");

socket.on("updateSwapped", ({ originalIds, swappedIds }) => {
  const player1 = players.find(player => player.id === originalIds[0]);
  const player2 = players.find(player => player.id === originalIds[1]);

  if (player1 && player2) {
    player1.state.isSwapped = true;
    player2.state.isSwapped = true;
    player1.state.swappedRole = player2.role.alignment;
    player2.state.swappedRole = player1.role.alignment;
  }
  // console.log("updateSwapped: ", players);
});
socket.on("updatePlayers", (updatedPlayers) => {
  players = updatedPlayers; // Update the players array
  if (currentPlayer) {
    const updatedCurrentPlayer = players.find((p) => p.id === currentPlayer.id);
    if (updatedCurrentPlayer) {
      currentPlayer = updatedCurrentPlayer; // Sync currentPlayer with the updated data
    }
  }
  //console.log("Updated Players:", players);
  renderPlayersGrid(); // Render the updated player grid
});

socket.on("syncPlayers", (updatedPlayers) => {
  players = updatedPlayers;
  if (currentPlayer) {
    const updatedCurrentPlayer = players.find((p) => p.uuid === currentPlayer.uuid);
    if (updatedCurrentPlayer) {
      currentPlayer = updatedCurrentPlayer; // Sync currentPlayer with the updated data
      // console.log("Synced CurrentPlayer", currentPlayer);
    }
  }
  // console.log("Synced Players: ", players);
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
  // console.log(currentPlayer.role.name);
  // console.log(typeof currentPlayer.role.name);
  setTimeout(createRoleCard, 1000);
});

function createRoleCard() {
  createCard(currentPlayer.role.name);
  createButterflies();
}

function isAlive() {
  return currentPlayer.isAlive;
}

socket.on("updateCurrentTurn", (newTurn) => {
  currentTurn = newTurn;
  console.log("CurrentTurn:", currentTurn);
  //console.log("CurrentPlayer:", currentPlayer);
  const currentTurnText = document.getElementById("currentTurnText");
  currentTurnText.textContent = `${currentTurn}`;
  renderButtons();
  // Check if the current player is alive
  //console.log("Role: ", currentPlayer.role.name);
  //console.log("Alive: ", isAlive());
  //console.log("CurrentTurn: ", currentTurn);
  if (gameStarted) {
    if (
      !isAlive() &&
      currentTurn !== "vote" &&
      currentPlayer.role.name.toLowerCase() === currentTurn
    ) {
      // Check if there are any alive players before emitting nextTurn
      const alivePlayersWithRole = players.filter(
        (player) =>
          player.isAlive && player.role.name === currentPlayer.role.name
      );
      if (alivePlayersWithRole.length > 0) {
        return;
      } else {
        socket.emit("nextTurn");
      }
    }
    if (currentTurn === "vote") {
      socket.emit("serverDay");
      if (currentPlayer.id == 1) {
        socket.emit("updateGameState");
      }
    }
  }
});

socket.on("roleActionsDuringVote", () => {
  console.log("CurrentStatus2: ", currentPlayer.isAlive);
  if (currentPlayer.role.name == "Hunter" && currentPlayer.isAlive == false) {
    console.log("HunterFunctionCalled");
    openModal("shoot");
  }
});

// socket.on("revealRole", (playerId) => {
//   console.log("LobbyRevealRole Called");
//   const playerCards = mainPlayerGrid.children;
//   const player = players.find((p) => p.id === playerId);
//   Array.from(playerCards).forEach(playerCard => {
//     const playerIdElement = playerCard.querySelector('.player-id');
//     if (playerIdElement && playerIdElement.textContent == playerId) {
//     //   playerCard.innerHTML = `
//     //   <i data-lucide="user"></i>
//     //   <div class="player-name">${player.name}</div>
//     //   <div class="player-role">${player.role.name}</div>
//     //   <div class="player-id" style="display: none;">${player.id}</div>
//     // `;
//     playerCard.classList.add("fullFlip");
//     }
//   });
// });

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
  if (item == "poison") {
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

  // Function to create a button with an icon
  const createButton = (text, className, action, isEnabled, iconName) => {
    const button = document.createElement("button");
    button.className = `action-button ${className}`;
    button.disabled = !isEnabled; // Disable or enable the button

    // Create the icon element
    const icon = document.createElement("i");
    icon.dataset.lucide = iconName;
    icon.className = "icon";

    // Add the icon and text to the button
    button.appendChild(icon);
    const buttonText = document.createTextNode(` ${text}`);
    button.appendChild(buttonText);

    // Add the click event listener
    button.addEventListener("click", () => {
      openModal(action);
      button.disabled = true;
    });
    return button;
  };

  const createPassTurn = (isEnabled) => {
    const button = document.createElement("button");
    button.textContent = "Pass Turn";
    button.className = `action-button passTurn`;
    button.disabled = !isEnabled;
    button.addEventListener("click", () => passPlayerTurn());
    return button;
  };

  const isVotingPhase = currentTurn === "vote";
  const currPlayerTurn = currentPlayer.role.name.toLowerCase();
  // Only render buttons if the player is alive
  if (isPlayerAlive) {
    if (currentPlayer.state.abilities.includes("poison")) {
      actionsDiv.appendChild(
        createButton(
          "Poison",
          "poison",
          "Mpoison",
          currentTurn === currPlayerTurn,
          "skull"
        )
      );
    }
    if (currentPlayer.state.abilities.includes("seer")) {
      actionsDiv.appendChild(
        createButton(
          "Check",
          "check",
          "Mcheck",
          currentTurn === currPlayerTurn,
          "eye"
        )
      );
    }
    if (currentPlayer.state.abilities.includes("guard")) {
      actionsDiv.appendChild(
        createButton(
          "Guard",
          "guard",
          "Mguard",
          currentTurn === currPlayerTurn,
          "shield"
        )
      );
    }
    if (currentPlayer.role.name === "Werewolf") {
      actionsDiv.appendChild(
        createButton(
          "Kill",
          "kill",
          "kill",
          currentTurn === "werewolf",
          "skull"
        )
      );
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Witch") {
      actionsDiv.appendChild(
        createButton(
          "Save",
          "save",
          "save",
          currentTurn === "witch" && witchHasMedicine,
          "beaker"
        )
      );
      actionsDiv.appendChild(
        createButton(
          "Poison",
          "poison",
          "poison",
          currentTurn === "witch" && witchHasPoison,
          "zap"
        )
      );
      actionsDiv.appendChild(createPassTurn(currentTurn === "witch"));
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Seer") {
      actionsDiv.appendChild(
        createButton("Check", "check", "check", currentTurn === "seer", "eye")
      );
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Villager") {
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Jester") {
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Hunter") {
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "DreamKeeper") {
      actionsDiv.appendChild(
        createButton(
          "Sleep",
          "sleep",
          "sleep",
          currentTurn === "dreamkeeper",
          "bed"
        )
      );
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Knight") {
      actionsDiv.appendChild(
        createButton("Duel", "duel", "duel", currentTurn != "vote", "shield")
      );
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Merchant") {
      actionsDiv.appendChild(
        createButton("Poison", "poison", "givePoison", currentTurn == "merchant", "skull")
      );
      actionsDiv.appendChild(
        createButton("Check", "check", "giveCheck", currentTurn == "merchant", "eye")
      );
      actionsDiv.appendChild(
        createButton("Guard", "guard", "giveGuard", currentTurn == "merchant", "shield")
      );
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "WolfBeauty") {
      actionsDiv.appendChild(
        createButton("Charm", "charm", "charm", currentTurn == "wolfbeauty", "heart")
      );
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Magician") {
      actionsDiv.appendChild(
        createButton("Switch", "switch", "switch", currentTurn == "magician", "rabbit")
      );
      actionsDiv.appendChild(createPassTurn(currentTurn === "magician"));
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
    if (currentPlayer.role.name === "Fool") {
      // console.log("isFlipped: ", currentPlayer.state.isFlipped);
      if (currentPlayer.state.hasFlipped == true) {
        const deadMessage = document.createElement("p");
        deadMessage.textContent = "You cannot perform any actions.";
        actionsDiv.appendChild(deadMessage);
        return;
      }
      actionsDiv.appendChild(
        createButton("Vote", "vote", "vote", isVotingPhase, "check-square")
      );
    }
  } else {
    // If the player is dead, disable all action buttons
    const deadMessage = document.createElement("p");
    deadMessage.textContent = "You are dead and cannot perform any actions.";
    actionsDiv.appendChild(deadMessage);
  }

  // Reinitialize Lucide icons to render
  lucide.createIcons();
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
    // console.log("hasFlipped: ${player.name}", player.state.hasFlipped);
    if (
      player.state.hasFlipped == true &&
      playerCard.classList.contains("fullFlip")
    ) {
      playerCard.classList.remove("fullFlip");
    }
    // Add player status (alive or dead)
    if (player.isAlive) {
      playerCard.className = "player-card";
    } else {
      playerCard.className = "player-card dead";
    }
    // Determine player role visibility
    let playerRole;
    if (!gameStarted) {
      playerRole = "Role hidden"; // Before the game starts
    } else if (currentPlayer.id === player.id) {
      // Always show the current player's role
      playerRole = player.role.name;
    } else if (currentPlayer.role.name === "Seer") {
      playerRole = getSeerPlayerRole(player, seerCheckedPlayers);
    } else {
      playerRole = getNonSeerPlayerRole(player);
    }

    // Set the innerHTML for the player card
    playerCard.innerHTML = `
          <i data-lucide="user"></i>
          <div class="player-name">${player.name}</div>
          <div class="player-role">${playerRole}</div>
          <div class="player-id" style="display: none;">${player.id}</div>
     `;
    if (player.state.isFlipped == true && player.state.hasFlipped == false) {
      playerCard.classList.add("fullFlip");
      player.state.hasFlipped = true; // Mark as flipped
      socket.emit("updatePlayerFlipped", player.id);
    }
    if (gameStarted) {
      if (
        currentPlayer.role.name === "Witch" &&
        wolfVictimId == player.uuid &&
        currentTurn === "witch"
      ) {
        //console.log("Main WitchCSS called");
        playerCard.classList.add("pulse-animation");
        this.wolfVictimId = null;
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

function getSeerPlayerRole(player, seerCheckedPlayers) {
  if (seerCheckedPlayers.includes(player.id)) {
    if (player.state.isSwapped && !player.state.hasSwapped && !player.state.seerChecked) {
      // First swap check
      player.state.hasSwapped = true;
      socket.emit("updatePlayerSwapped", player.id);
      return player.state.swappedRole === "good" ? "Good" : "Bad";
    } else if (player.state.hasSwapped && !player.state.seerChecked) {
      // After first swap
      return player.state.swappedRole === "good" ? "Good" : "Bad";
    } else {
      return player.role.alignment === "good" ? "Good" : "Bad";
    }
  }
  return ""; // Hide roles for others
}

function getNonSeerPlayerRole(player) {
  if (player.state.isFlipped) {
    return player.role.name;
  } else if (player.state.seerChecked) {
    return player.role.alignment === "good" ? "Good" : "Bad";
  } else if (player.state.isCharmed && !player.isAlive) {
    return "Charmed";
  }
  return ""; // Hide roles for others when the game is started
}

//This is for the modal
const actionModal = document.getElementById("actionModal");
const modalTitle = document.getElementById("modalTitle");
const playersGrid = document.getElementById("playersGrid");
const actionButton = document.getElementById("actionButton");
const skipVoteButton = document.getElementById("skipVote");
const cancelSkill = document.getElementById("cancelSkill");

let currentAction = null;
let selectedPlayers = [];

function openModal(action) {
  currentAction = action;
  selectedPlayers = [];
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
    case "shoot":
      modalTitle.textContent = "Choose a Player to Eliminate";
      actionButton.textContent = "Shoot";
      break;
    case "sleep":
      modalTitle.textContent = "Choose a Player to put to Sleep";
      actionButton.textContent = "Put to Sleep";
      break;
    case "duel":
      modalTitle.textContent = "Choose a Player to Duel";
      actionButton.textContent = "Duel";
      break;
    case "Mpoison":
      modalTitle.textContent = "Choose a Player to Poison";
      actionButton.textContent = "Use Poison Potion";
      break;
    case "Mcheck":
      modalTitle.textContent = "Choose a Player to Check";
      actionButton.textContent = "Check ID";
      break;
    case "Mguard":
      modalTitle.textContent = "Choose a Player to Guard";
      actionButton.textContent = "Guard";
      break;
    case "givePoison":
      modalTitle.textContent = "Choose a Player to Give Poison Potion";
      actionButton.textContent = "Give Potion";
      break;
    case "giveCheck":
      modalTitle.textContent = "Choose a Player to Give Seer Check";
      actionButton.textContent = "Give Check";
      break;
    case "giveGuard":
      modalTitle.textContent = "Choose a Player to Give Guard Protection";
      actionButton.textContent = "Give Guard";
      break;
    case "charm":
      modalTitle.textContent = "Choose a Player to Charm";
      actionButton.textContent = "Charm";
      break;
    case "switch":
      modalTitle.textContent = "Choose two Players to Switch IDs";
      actionButton.textContent = "Switch";
      cancelSkill.classList.remove("hidden");
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

let wolfVictimId = null;
socket.on("notifyKilled", (wolfChoice) => {
  //console.log("NotifyCalled");
  wolfVictimId = wolfChoice;
  //console.log("Wolf Victim", wolfVictimId);
  renderPlayersSmallGrid();
});

function renderPlayersSmallGrid() {
  playersGrid.innerHTML = "";
  const alivePlayers = currentPlayer.role.name === "Magician"
    ? players.filter((player) => player.isAlive && player.state.isSwapped === false)
    : players.filter((player) => player.isAlive);
  alivePlayers.forEach((player) => {
    const isSelected = selectedPlayers.includes(player.id);
    const playerElement = document.createElement("div");
    playerElement.className = `player ${player.isAlive ? "" : "dead"} ${
      isSelected ? "selected" : ""
    }`;
    playerElement.innerHTML = `
      <i data-lucide="user" class="${
        player.isAlive ? "text-green-600" : "text-red-600"
      }"></i>
      <span class="player-name">${player.name}</span>
      ${
        isSelected
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
    if (player.uuid == wolfVictimId && currentAction === "save") {
      //console.log("Witch CSS called");
      playerElement.classList.add("pulse-animation");
      this.wolfVictimId = null;
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
  let selectionLimit = null;
  if(currentTurn != "vote") {
    selectionLimit = getSelectionLimitByRole(currentPlayer.role.name);
  } else {
    selectionLimit = 1;
  }
  if (selectedPlayers.includes(playerId)) {
    // If the player is already selected, deselect them
    selectedPlayers = selectedPlayers.filter((id) => id !== playerId);
  } else {
    if (selectionLimit === 1) {
      // For roles that allow only one selection, clear previous selections
      selectedPlayers = [playerId];
    } else {
      // For roles with multiple selections, add the new selection if within the limit
      if (selectedPlayers.length < selectionLimit) {
        selectedPlayers.push(playerId);
      } else {
        // Replace the oldest selection with the new one if limit is reached
        selectedPlayers.shift(); // Remove the first selected player
        selectedPlayers.push(playerId);
      }
    }
  }
  renderPlayersSmallGrid();
  actionButton.disabled = selectedPlayers.length < selectionLimit;

  if(selectedPlayers.length == 1) {
    const { id } = players.find((player) => player.id === selectedPlayers[0]);
    const werewolfId = currentPlayer.id;
    renderPlayersSmallGrid();
    if (currentPlayer.role.name === "Werewolf") {
      socket.emit("werewolfTarget", { werewolfId: werewolfId, targetId: id });
    }
  }
}

function getSelectionLimitByRole(roleName) {
  const roleLimits = {
    Werewolf: 1,
    Seer: 1,
    AwakenedSeer: 2,
    Witch: 1,
    Magician: 2,
    // Add more roles and limits here
  };
  return roleLimits[roleName] || 1; // Default to 1 if the role isn't listed
}


actionButton.addEventListener("click", () => {
  if (selectedPlayers.length > 0) {
    // const playerId = selectedPlayers.map((playerId) => {
    //   const { id } = players.find((player) => player.id === playerId);
    //   return id;
    // });
    const selectedPlayer = players.find((player) => player.id === selectedPlayers[0]);
    const {id, uuid} = selectedPlayer;
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
        socket.emit("witchSave", uuid);
        break;
      case "check":
        socket.emit("seerAction", id);
        break;
      case "shoot":
        socket.emit("hunterAction", id);
        break;
      case "sleep":
        socket.emit("putToSleep", id);
        break;
      case "duel":
        socket.emit("knightAction", id);
        break;
      case "Mpoison":
        socket.emit("merchantPoison", id);
        break;
      case "Mcheck":
        socket.emit("merchantCheck", id);
        break;
      case "Mguard":
        socket.emit("merchantGuard", id);
        break;
      case "givePoison":
        socket.emit("merchantAction", { actionType: "poison", targetId: id});
        break;
      case "giveCheck":
        socket.emit("merchantAction", { actionType: "check", targetId: id});
        break;
      case "giveGuard":
        socket.emit("merchantAction", { actionType: "guard", targetId: id});
        break;
      case "charm":
        socket.emit("wolfBeautyAction", id);
        break;
      case "switch":
        socket.emit("magicianAction", selectedPlayers);
        break;
    }
    //socket.emit("turnEndedBeforeTimer");
    this.currentAction = null;
    closeModal();
  }
});

skipVoteButton.addEventListener("click", () => {
  socket.emit("voterData", { voterId: currentPlayer.id, targetId: 0 });
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

// Role Card
const cardContainer = document.querySelector(".card-container");
const wrapper = document.querySelector(".wrapper");
const roleData = {
  Seer: {
    title: "预言家",
    description: "好人阵营，神职",
    ability: "每晚可以查看一名玩家的身份",
    image: "../RolePicture/Seer Medium.jpeg",
    background: "linear-gradient(45deg, #4a0e4e, #81379a)", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  Werewolf: {
    title: "狼人",
    description: "狼人阵营，恶人",
    ability: "每晚可以选择一名玩家进行攻击",
    image: "../RolePicture/Werewolf.jpeg",
    background: "linear-gradient(45deg, #ff0000, #990000)", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  // Add other roles here...
  Witch: {
    title: "女巫",
    description: "好人阵营，神职",
    ability: "每晚可以选择一名玩家进行复活或毒死",
    image: "../RolePicture/Witch.jpeg",
    background: "linear-gradient(45deg, #3b0e45, #8a6b99)", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  Hunter: {
    title: "猎人",
    description: "好人阵营，神职",
    ability: "死亡时可以选择开枪射杀一名玩家",
    image: "../RolePicture/Hunter.jpeg",
    background: "linear-gradient(45deg,rgb(132, 139, 55),rgb(181, 201, 34))", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  DreamKeeper: {
    title: "摄梦人",
    description: "好人阵营，神职",
    ability:
      "每晚选择一名玩家成为梦游者，梦游者免疫夜间伤害且不知道自己在梦游。若摄梦人出局，梦游者也会出局；连续两晚成为梦游者则会出局",
    image: "../RolePicture/DreamKeeper.jpeg",
    background: "linear-gradient(45deg,rgb(97, 33, 120),rgb(117, 29, 147))", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  Fool: {
    title: "白痴",
    description: "好人阵营，神职",
    ability:
      "被投票出局时翻牌免疫放逐，仅限一次，不能投票但可发言，需狼人击杀才能死亡。",
    image: "../RolePicture/Fool.jpeg",
    background: "linear-gradient(45deg,rgb(165, 189, 45),rgb(169, 181, 83))", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  Knight: {
    title: "骑士",
    description: "好人阵营，神职",
    ability:
      "骑士可以在白天警长竞选结束后，放逐投票之前，随时翻牌决斗场上除自己以外的任意一位玩家。如果被决斗的玩家是狼人，则该狼人死亡并立即进入黑夜；如果被决斗的玩家是好人，则骑士死亡并继续进行白天原本的发言流程",
    image: "../RolePicture/Knight.jpeg",
    background: "linear-gradient(45deg,rgb(77, 78, 75),rgb(120, 120, 117))", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  Merchant: {
    title: "奇迹商人",
    description: "好人阵营，神职",
    ability:
      "奇迹商人在每夜第一个行动，选择一名其他玩家成为幸运儿，使其获得三个一次性技能中的一个：预言家的查验、女巫的毒药或守卫的守护，每局游戏限一次. 若幸运儿是狼人，则幸运儿不会获得技能，且次日奇迹商人出局",
    image: "../RolePicture/Merchant.jpeg",
    background: "linear-gradient(45deg,rgb(77, 78, 75),rgb(120, 120, 117))", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  WolfBeauty: {
    title: "狼美人",
    description: "狼人阵营，恶人",
    ability:
      "狼美人在夜里可以魅惑一人，天亮后，如果狼美人被放逐出局或者被猎人射杀，被魅惑的玩家跟随狼美人一起出局，且无技能",
    image: "../RolePicture/WolfBeauty.jpeg",
    background: "linear-gradient(45deg,rgb(136, 56, 183),rgb(176, 93, 201))", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  Magician: {
    title: "魔术师",
    description: "好人阵营，神职",
    ability:"每晚在其他所有人之前行动, 交换2个人的号码牌, 当晚有效",
    image: "../RolePicture/Magician.jpeg",
    background: "linear-gradient(45deg,rgb(86, 104, 111),rgb(109, 158, 153))", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
  Villager: {
    title: "平民",
    description: "好人",
    ability: "无特殊技能",
    image: "../RolePicture/Villager.jpeg",
    background: "linear-gradient(45deg, #55b0c6, #9cd9ea)", // Adjust colors as needed
    borderColor: "solid 4px #fcbcb2",
  },
};
function createCard(role) {
  if (!roleData || !roleData[role]) {
    console.log("RoleNotFound: ", role);
    console.error("Role not found!");
    return;
  }

  const roleInfo = roleData[role];

  // If role is not found, return early
  if (!roleInfo) {
    console.log("RoleNotFound: ", roleInfo);
    console.error("Role not found!");
    return;
  }

  // Generate card HTML dynamically
  cardContainer.innerHTML = `
    <div class="card" style="border: ${roleInfo.borderColor}">
      <div class="card-face card-front" style="background: ${roleInfo.background}">
        <div class="abilities">
          <h2>${roleInfo.title}</h2>
          <p><strong>身份：</strong>${roleInfo.description}</p>
          <p><strong>技能：</strong>${roleInfo.ability}</p>
        </div>
        <div class="character-image">
          <img src="${roleInfo.image}" alt="${roleInfo.title}" />
        </div>
      </div>
    </div>
  `;

  // Trigger the animation when card is created
  startAnimation();
}

function startAnimation() {
  cardContainer.classList.remove("hidden");
  cardContainer.style.animation = "slideInFade 1s forwards";
  const abilities = document.querySelector(".card-front .abilities");
  const characterImage = document.querySelector(".card-front .character-image");
  // Add slide-in animations to the text and image
  abilities.classList.add("slide-text");
  characterImage.classList.add("slide-img");

  cardContainer.addEventListener("animationend", (event) => {
    if (event.animationName === "hideCard") {
      // Hide the wrapper once the "hideCard" animation finishes
      wrapper.style.display = "none";
    }
  });

  // Trigger the hideCard animation after 5 seconds
  setTimeout(() => {
    cardContainer.style.animation = "hideCard 1s ease-in-out";
  }, 5000); // After the flip animation
}

function createButterflies() {
  const container = document.querySelector(".card-container");
  // Remove existing butterflies
  const existingButterflies = container.querySelectorAll(".butterfly");
  existingButterflies.forEach((butterfly) => butterfly.remove());
  for (let i = 0; i < 5; i++) {
    const butterfly = document.createElement("div");
    butterfly.classList.add("butterfly");
    butterfly.style.left = `${Math.random() * 100}%`;
    butterfly.style.top = `${Math.random() * 100}%`;
    butterfly.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(butterfly);
  }
}

function onHover() {
  const abilities = document.querySelector(".card-front .abilities");
  const characterImage = document.querySelector(".card-front .character-image");
  if (gameStarted) {
    abilities.classList.remove("slide-text");
    characterImage.classList.remove("slide-img");
  }
  wrapper.style.display = "block";
  cardContainer.style.opacity = "1";
  cardContainer.style.animation = "showCard .5s ease-in-out forwards";
  createButterflies();
}

function hideCard() {
  cardContainer.style.opacity = "0";
  cardContainer.style.animation = "hideCard .5s ease-in-out";
}

function resetGame() {
  gameStarted = false;
  socket.emit("resetGame");
}
