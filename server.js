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
let availableRoles = [new Witch(), new Seer(), new Werewolf()];

function assignRole() {
  if (availableRoles.length === 0) {
    return undefined; // No roles left to assign
  }
  if (preConfigRoles.length > 0) {
    availableRoles = preConfigRoles;
  }
  const randomIndex = Math.floor(Math.random() * availableRoles.length); // Pick a random index
  const role = availableRoles[randomIndex]; // Get the role
  availableRoles.splice(randomIndex, 1); // Remove the assigned role from the array
  console.log("Available roles after assignment:", availableRoles);
  return role; // Return the selected role
}

let config;
let preConfigRoles = [];
function createPreConfig() {
  for (let i = 0; i < config.werewolves; i++) {
    preConfigRoles.push(new Werewolf());
  }
  for (let i = 0; i < config.witch; i++) {
    preConfigRoles.push(new Witch());
  }
  for (let i = 0; i < config.seer; i++) {
    preConfigRoles.push(new Seer());
  }
  for (let i = 0; i < config.villagers; i++) {
    preConfigRoles.push(new Villager());
  }
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinGame", (playerName) => {
    const playerRole = assignRole();
    const player = new Player(playerName, playerRole);
    game.addPlayer(player);
    io.emit("updatePlayers", game.getCurrentPlayers()); // Broadcast updated players to all clients
    socket.emit("playerJoined", player);
    if (availableRoles.length == 0) {
      io.emit("startGame");
      console.log("StarGame Called");
    }
  });

  socket.on("sendPreConfigedLobby", (configFile) => {
    config = configFile;
    //console.log("Config: ", config);
    createPreConfig();
    //console.log("Preconfig:", preConfigRoles);
  });

  socket.on("startGame", () => {
    if (!gameInProgress) {
      // Prevent re-triggering game start
      console.log("Game Started!");
      gameInProgress = true; // Set flag to indicate game has started
      io.emit("updatePlayers", game.getCurrentPlayers());
      game.startGame();
      io.emit("updateCurrentTurn", game.getCurrentTurn());
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
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
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
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
    io.emit("updateGrid");
    //io.emit("updatePlayers", game.getCurrentPlayers());
  });

  let werewolfSelections = {};
  socket.on("werewolfTarget", ({ werewolfId, targetId }) => {
    werewolfSelections[werewolfId] = targetId;
    socket.broadcast.emit("updateWerewolfTarget", werewolfSelections);
  });

  socket.on("werewolfKill", (targetId) => {
    game.addWerewolfChoice(targetId);
    const target = game
      .getCurrentPlayers()
      .find(
        (player) => player.id === game.tallyWerewolfChoice() && player.isAlive
      );
    if (game.getWolfChoice().length === game.getWerewolves().length) {
      io.emit("notifyKilled", game.getWolfChoice());
      target.isAlive = false;
      game.clearWolfChoice();
      game.nextTurn();
      io.emit("updateCurrentTurn", game.getCurrentTurn());
      io.emit("updateGrid");
      //io.emit("updatePlayers", game.getCurrentPlayers());
    }
  });

  socket.on("votePlayerOut", ({ voteType, targetId }) => {
    if (voteType == "skip") {
      game.addSkipVote(targetId);
    } else if (voteType == "vote") {
      game.addPlayerVote(targetId);
    }
    console.log("VoteMap: ", game.getVoteMap());
    console.log("AlivePlayers: ", game.getAlivePlayers());
    if (
      game.getPlayerVotes().length + game.getPlayerSkips().length ===
      game.getAlivePlayers().length
    ) {
      if (game.countVotes() > 0) {
        console.log("Emitting voteMap:", game.getVoteMap());
        io.emit("sendVoteMap", Object.fromEntries(groupVotesMap()));
        io.emit("renderVoteResults");
        const target = game
          .getCurrentPlayers()
          .find((player) => player.id === game.countVotes() && player.isAlive);
        console.log("PlayerVotes: ", game.getPlayerVotes());
        console.log("PlayerSkips: ", game.getPlayerSkips());
        target.kill();
        game.clearVotes();
        console.log("PlayerVotes AfterClear: ", game.getPlayerVotes());
        console.log("PlayerSkips AfterClear: ", game.getPlayerSkips());
        game.nextTurn();
        io.emit("updatePlayers", game.getCurrentPlayers());
        io.emit("updateCurrentTurn", game.getCurrentTurn());
      } else {
        io.emit("sendVoteMap", Object.fromEntries(groupVotesMap()));
        io.emit("renderVoteResults");
        game.clearVotes();
        game.nextTurn();
        io.emit("updatePlayers", game.getCurrentPlayers());
        io.emit("updateCurrentTurn", game.getCurrentTurn());
      }
    } 
  });
  
  socket.on("voterData", ({voterId, targetId}) => {
    const voter = game
    .getCurrentPlayers()
    .find(
      (player) => player.id === voterId && player.isAlive
    );
    let target;
    if (targetId === 0) {
      // Create a new player object
      target = {
        id: 0,               // New player's ID (assuming 0 is a placeholder)
        name: "New Player",   // Default name for new player (you can change this)
        isAlive: true         // Assuming the new player is alive
      };
    } else {
      // Otherwise, find the target player who is alive
      target = game
        .getCurrentPlayers()
        .find((player) => player.id === targetId && player.isAlive);
    }
    game.setVoteMap(voter.name, target);
  });
  
  let groupedVotesMap = new Map();
  function groupVotesMap() {
    let voteMap = game.getVoteMap();
    groupedVotesMap = new Map();
    // Group votes
    for (const [voter, target] of voteMap) {
      if (target) {
        const targetId = target.id; // Use unique identifier
        if (!groupedVotesMap.has(targetId)) {
          groupedVotesMap.set(targetId, { target, voters: [] });
        }
        //Push person who voted for target in voter array
        groupedVotesMap.get(targetId).voters.push(voter);
      }
    }
    return groupedVotesMap;
  }
  
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
