const socket = io(); // Connect to the server

lucide.createIcons();

function handleJoinRoom() {
  const playerName = document.getElementById("playerName").value;
  const lobbyId = document.querySelector('input[placeholder="Enter Lobby ID"]').value;

  // Create a player object
  const player = { id: 1, name: playerName, role: "Villager", isAlive: true };

  // Emit the player data to the server
  socket.emit('joinGame', player);
}