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
import { log } from "console";

// __dirname equivalent in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "login.html"));
});

let gameInProgress = false;
let availableRoles = [new Werewolf(), new Seer(), new Werewolf()];

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

  // socket.on("werewolfKill", (victimName) => {
  //   console.log(`Werewolf has chosen to kill: ${victimName}`);
  //   const victim = game
  //     .getCurrentPlayers()
  //     .find((player) => player.name === victimName && player.isAlive);
  //   if (victim && game.getCurrentTurn() == "werewolf") {
  //     victim.isAlive = false;
  //     io.emit(
  //       "message",
  //       `${victimName.name} has been killed by the werewolves.`
  //     );
  //     //const gameOver = game.checkGameOver();
  //     //if (!gameOver) {
  //     //  game.nextTurn();
  //     //  io.emit("updateCurrentTurn", game.getCurrentTurn());
  //     //  console.log(game.getCurrentTurn());
  //     //}
  //     game.nextTurn();
  //     io.emit("updateCurrentTurn", game.getCurrentTurn());
  //     console.log(game.getCurrentTurn());
  //     io.emit("updatePlayers", game.getCurrentPlayers());
  //   }
  // });

  socket.on("witchAction", ({ actionType, targetId }) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.id === targetId);
    console.log("WitchAction called on: ", target);
    if (target) {
      if (actionType === "save") {
        target.isAlive = true;
      } else if (actionType === "poison") {
        target.kill();
      }
    }
    io.emit("updatePlayers", game.getCurrentPlayers());
  });

  socket.on("seerAction", (targetId) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.id === targetId && player.isAlive);
    if (target) {
      game.addSeerCheckedPlayer(target.id);
    }
    console.log(game.getSeerChecked());
    io.emit("updateSeerChecked", game.getSeerChecked());
    io.emit("updatePlayers", game.getCurrentPlayers());
  });

  let werewolfSelections = {};
  socket.on("werewolfTarget", ({ werewolfId, targetId }) => {
    werewolfSelections[werewolfId] = targetId;
    socket.broadcast.emit("updateWerewolfTarget", werewolfSelections);
  });

  socket.on("werewolfKill", (targetId) => {
    game.addWerewolfChoice(targetId);
    console.log("wolfChoice: ", game.getWolfChoice());
    const target = game
      .getCurrentPlayers()
      .find(
        (player) => player.id === game.tallyWerewolfChoice() && player.isAlive
      );
    console.log("Target: ", target);
    if (game.getWolfChoice().length === game.getWerewolves().length) {
      target.kill();
      io.emit("updatePlayers", game.getCurrentPlayers());
    }
  });

  socket.on("votePlayerOut", (targetId) => {
    game.addPlayerVote(targetId);
    if (game.getPlayerVotes().length === game.getCurrentPlayers().length) {
      if (game.countVotes() > 0) {
        const target = game
          .getCurrentPlayers()
          .find((player) => player.id === game.countVotes() && player.isAlive);
        target.kill();
        io.emit("updatePlayers", game.getCurrentPlayers());
      }
    }
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
