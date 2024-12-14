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

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinGame", (playerName) => {
    console.log("Method called joinGame");
    const player = new Player(playerName);
    game.addPlayer(player);
    io.emit("updatePlayers", game.getCurrentPlayers()); // Broadcast updated players to all clients
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
