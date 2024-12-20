const socket = io(); // Connect to the server

lucide.createIcons();

function handleJoinRoom() {
  const playerName = document.getElementById("playerName").value;
  // const lobbyId = document.querySelector(
  //   'input[placeholder="Enter Lobby ID"]'
  // ).value;

  const playerInputs = document.querySelector(".player-inputs");
  if (playerInputs) {
    playerInputs.style.display = "none";
  }

  // Create a player object
  //const player = { id: 1, name: playerName, role: "Villager", isAlive: true };

  // Emit the player data to the server
  socket.emit("joinGame", playerName);
}

document.getElementById("lobbyType").addEventListener("change", function () {
  const lobbyType = this.value;
  if (lobbyType === "preconfigured") {
    document.getElementById("preconfiguredLobbies").style.display = "block";
    document.getElementById("customLobby").style.display = "none";
  } else {
    document.getElementById("preconfiguredLobbies").style.display = "none";
    document.getElementById("customLobby").style.display = "block";
  }
});

function createLobby() {
  const lobbyType = document.getElementById("lobbyType").value;
  let config;

  if (lobbyType === "preconfigured") {
    const preconfiguredLobby =
      document.getElementById("preconfiguredLobby").value;
    createPreConfig();
  } else {
    config = {
      type: "custom",
      roles: {
        werewolves: parseInt(document.getElementById("werewolvesCount").value),
        villagers: parseInt(document.getElementById("villagersCount").value),
        seer: document.getElementById("seer").checked,
        witch: document.getElementById("witch").checked,
        wolfBeauty: document.getElementById("wolfBeauty").checked,
        // Add other custom roles here
      },
    };
  }
}

function createPreConfig() {
  const selectedLobby = document.getElementById("preconfiguredLobby").value;
  const config = preconfiguredLobbies[selectedLobby];
  socket.emit("sendPreConfigedLobby", config);
}

const preconfiguredLobbies = {
  basic: {
    werewolves: 4,
    villagers: 4,
    seer: 1,
    witch: 1,
  },
  advanced: {
    werewolves: 1,
    seer: 1,
    witch: 1,
  },
  // Add more configurations as needed
};
