import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { Game } from "./Game.js"; // Use .js extension for local modules
import { Player } from "./Player.js";
import { Werewolf } from "./roles/Werewolf.js";
import { Villager } from "./roles/Villager.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const game = new Game();

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname equivalent in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "login.html"));
});



let gameInProgress = false;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinGame", (playerName) => {
    const playerRole = new Villager();
    const player = new Player(playerName, playerRole);
    game.addPlayer(player);
    io.emit("updatePlayers", game.getCurrentPlayers()); // Broadcast updated players to all clients
  });
    
  socket.on('startGame', () => {
    if (!gameInProgress) {  // Prevent re-triggering game start
        gameInProgress = true; // Set flag to indicate game has started
        game.roles = [new Werewolf(), new Villager(), new Villager()]; // Example roles
        game.assignRoles();
        io.emit("updatePlayers", game.getCurrentPlayers());
        game.startGame();
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
