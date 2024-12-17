import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { Game } from "./Game.js"; // Use .js extension for local modules
import { Player } from "./Player.js";
import { Werewolf } from "./roles/Werewolf.js";
import { Villager } from "./roles/Villager.js";
import { Witch } from "./roles/Witch.js";
import { Seer } from "./roles/Seer.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const game = new Game();

import { fileURLToPath } from "url";
import { dirname } from "path";

// __dirname equivalent in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "login.html"));
});

let gameInProgress = false;
let availableRoles = [new Werewolf(), new Witch(), new Seer()];

function assignRole() {
  if (availableRoles.length === 0) {
    return undefined; // No roles left to assign
  }
  const randomIndex = Math.floor(Math.random() * availableRoles.length); // Pick a random index
  const role = availableRoles[randomIndex]; // Get the role
  availableRoles.splice(randomIndex, 1); // Remove the assigned role from the array
  console.log("Available roles after assignment:", availableRoles);
  return role; // Return the selected role
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinGame", (playerName) => {
    const playerRole = assignRole();
    const player = new Player(playerName, playerRole);
    game.addPlayer(player);
    io.emit("updatePlayers", game.getCurrentPlayers()); // Broadcast updated players to all clients
    socket.emit("playerJoined", player);
  });

  socket.on("startGame", () => {
    if (!gameInProgress) {
      // Prevent re-triggering game start
      console.log("Game Started!");
      gameInProgress = true; // Set flag to indicate game has started
      io.emit("updatePlayers", game.getCurrentPlayers());
      game.startGame();
      io.emit("renderButtons");
    }
  });

  socket.on("werewolfKill", (victimName) => {
    console.log(`Werewolf has chosen to kill: ${victimName}`);
    const victim = game
      .getCurrentPlayers()
      .find((player) => player.name === victimName && player.isAlive);
    if (victim) {
      victim.isAlive = false;
      io.emit(
        "message",
        `${victimName.name} has been killed by the werewolves.`
      );
      const gameOver = game.checkGameOver();
      if (!gameOver) {
        game.nextAction();
      }
      io.emit("updatePlayers", game.getCurrentPlayers());
    }
  });

  socket.on("witchSave", (targetName) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.name === targetName);
    if (target) {
      target.isAlive = true;
    }
    io.emit("updatePlayers", game.getCurrentPlayers());
  });

  socket.on("witchPoison", (targetName) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.name === targetName && player.isAlive);
    if (target) {
      target.isAlive = false;
    }
    io.emit("updatePlayers", game.getCurrentPlayers());
  });

  socket.on("seerAction", (targetName) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.name === targetName && player.isAlive);
    if (target) {
      game.addSeerCheckedPlayer(target.id);
    }
    console.log(game.getSeerChecked());
    io.emit("updateSeerChecked", game.getSeerChecked());
    io.emit("updatePlayers", game.getCurrentPlayers());
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    // Handle player disconnection if needed
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
