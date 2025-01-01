import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { Game } from "./Game.js"; // Use .js extension for local modules
import { Player } from "./player.js";


const app = express();
const server = http.createServer(app);
const io = new Server(server);
const game = new Game();


import { fileURLToPath } from "url";
import { dirname } from "path";
import { log } from "console";
import { clearInterval } from "timers";

// __dirname equivalent in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "login.html"));
});

// let availableRoles = [];

// function assignRole() {
//   if (availableRoles.length === 0) {
//     return undefined; // No roles left to assign
//   }
//   if (preConfigRoles.length > 0) {
//     availableRoles = preConfigRoles;
//   }
//   const randomIndex = Math.floor(Math.random() * availableRoles.length); // Pick a random index
//   const role = availableRoles[randomIndex]; // Get the role
//   availableRoles.splice(randomIndex, 1); // Remove the assigned role from the array
//   console.log("Available roles after assignment:", availableRoles);
//   return role; // Return the selected role
// }

let countDown = [];
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
    const playerRole = game.assignRole();
    const player = new Player(playerName, playerRole);
    game.addPlayer(player);
    io.emit("updatePlayers", game.getCurrentPlayers()); // Broadcast updated players to all clients
    socket.emit("playerJoined", player);
    if (game.getAvailableRoles() == 0) {
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
    if (!game.gamePlaying()) {
      // Prevent re-triggering game start
      console.log("Game Started!");
      // startGameTimer(io, 15);
      game.gameInProgress = true; // Set flag to indicate game has started
      io.emit("updatePlayers", game.getCurrentPlayers());
      game.startGame();
      io.emit("updateCurrentTurn", game.getCurrentTurn());
      io.emit("renderButtons");
      io.emit("setNight");
    }
  });
  
  socket.on("serverDay",() => {
    io.emit("setDay");
  });
  
  socket.on("updateGameState", ()=> {
    console.log("UpdateGameState called");
    // console.log("UGS: ", game.getCurrentPlayers());
    game.getCurrentPlayers().forEach(player => {
      if(player.role.name == "DreamKeeper" && !player.isAlive) {
        const target = game.getCurrentPlayers().filter((player) => player.state.isAsleep)[0];
        target.isAlive = false;
        game.getCurrentPlayers().forEach(player => {
          player.state.isAsleep = false;
        });
      }
    });
    io.emit("updatePlayers", game.getCurrentPlayers());
    // console.log("UGS Sleep: ", game.getCurrentPlayers().filter((player) => player.state.isAsleep));
    io.emit("renderButtons");
    io.emit("roleActionsDuringVote");
    endMessage();
  });

  socket.on("nextTurn", () => {
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
    socket.emit("updateGrid");
  });

  function startGameTimer(io, duration) {
    if (countDown.length > 0) {
      clearAllIntervals();
    }
    let timeLeft = duration;
    io.emit("resetTimerUI");
    io.emit("startTime", timeLeft); // Emit timer start event
    let timerInterval = setInterval(() => {
      timeLeft--;
      io.emit("updateTimer", timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        game.nextTurn();
        io.emit("updateCurrentTurn", game.getCurrentTurn());
      }
    }, 1000);
    countDown.push(timerInterval);
    //console.log("counDown: ", countDown);
  }

  function clearAllIntervals() {
    //console.log(`[SERVER] Clearing all intervals. Current intervals:`, countDown);
    countDown.forEach(clearInterval);
    countDown = [];
    //console.log(`[SERVER] All intervals cleared. Updated intervals:`, countDown);
  }

  socket.on("clearAllTime", () => {
    clearAllIntervals();
  });

  socket.on("turnEndedBeforeTimer", () => {
    console.log("TimerEndedByTurn");
    startGameTimer(io, 15);
  });

  socket.on("witchAction", ({ actionType, targetId }) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.id === targetId);
    //console.log("WitchAction called on: ", target);
    if (target) {
      if (actionType === "save") {
        target.isAlive = true;
        socket.emit("witchUsedItem", "medicine");
      } else if (actionType === "poison") {
        target.kill();
        socket.emit("witchUsedItem", "poison");
      }
    }
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
    io.emit("updateGrid");
    // if (game.checkGameOver() == "Good wins") {
    //   io.emit("winMessage");
    // }
  });

  let buttonsEnabled = false;
  socket.on("toggleAllButtons", () => {
    buttonsEnabled = !buttonsEnabled;
    io.emit("toggleButtons", buttonsEnabled);
  });

  socket.on("seerAction", (targetId) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.id === targetId);
    if (target) {
      game.addSeerCheckedPlayer(target.id);
    }
    // console.log(game.getSeerChecked());
    io.emit("updateSeerChecked", game.getSeerChecked());
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
    io.emit("updateGrid");
    //io.emit("updatePlayers", game.getCurrentPlayers());
  });
  
  socket.on("hunterAction", (targetId) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.id === targetId && player.isAlive);
    if(target) {
      target.isAlive = false;
    }
    io.emit("updatePlayers", game.getCurrentPlayers()); 
    io.emit("renderButtons");
    endMessage();
  })

  //Remember to clear this when the game is reset
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
      target.kill();
      game.clearWolfChoice();
      game.nextTurn();
      io.emit("updateCurrentTurn", game.getCurrentTurn());
      io.emit("updateGrid");
      //io.emit("updatePlayers", game.getCurrentPlayers());
    }
  });
  
  socket.on("putToSleep", (targetId) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.id === targetId && player.isAlive);
    game.getCurrentPlayers().forEach(player => {
      if(player.id === targetId) {
        if(player.state.isAsleep) {
          target.isAlive = false;
        } else {
          player.state.isAsleep = true;
        }
      } else {
        player.state.isAsleep = false;
      }
    });
    // if(target.state.isAsleep) {
    //   target.isAlive = false;
    // } else {
    //   target.state.isAsleep = true;
    // }
    console.log("SleepTargets: ", game.getCurrentPlayers().filter((player) => player.state.isAsleep));
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
  });
  
  socket.on("votePlayerOut", ({ voteType, targetId }) => {
    if (voteType == "skip") {
      game.addSkipVote(targetId);
    } else if (voteType == "vote") {
      game.addPlayerVote(targetId);
    }
    //console.log("VoteMap: ", game.getVoteMap());
    //console.log("AlivePlayers: ", game.getAlivePlayers());
    if (
      game.getPlayerVotes().length + game.getPlayerSkips().length ===
      game.getAlivePlayers().length
    ) {
      if (game.countVotes() > 0) {
        //console.log("Emitting voteMap:", game.getVoteMap());
        io.emit("sendVoteMap", Object.fromEntries(groupVotesMap()));
        io.emit("renderVoteResults");
        const target = game
          .getCurrentPlayers()
          .find((player) => player.id === game.countVotes() && player.isAlive);
        //console.log("PlayerVotes: ", game.getPlayerVotes());
        //console.log("PlayerSkips: ", game.getPlayerSkips());
        console.log("targetType: ", typeof target);
        target.kill();
        game.clearVotes();
        //console.log("PlayerVotes AfterClear: ", game.getPlayerVotes());
        //console.log("PlayerSkips AfterClear: ", game.getPlayerSkips());
        game.nextTurn();
        io.emit("updatePlayers", game.getCurrentPlayers());
        io.emit("updateCurrentTurn", game.getCurrentTurn());
        console.log("Target: ", target);
        if (target && target.role.name === "Jester") {
          console.log("JesterWins Called");
          io.emit("jesterWins");
        } else {
          endMessage();
        }
        io.emit("setNight");
      } else {
        io.emit("sendVoteMap", Object.fromEntries(groupVotesMap()));
        io.emit("renderVoteResults");
        game.clearVotes();
        endMessage();
        game.nextTurn();
        io.emit("updatePlayers", game.getCurrentPlayers());
        io.emit("updateCurrentTurn", game.getCurrentTurn());
        io.emit("setNight");
      }
    }
  });
  
  function endMessage() {
    switch(game.checkGameOver()) {
      case "Good wins":
        io.emit("winMessage");
        break;
      case "Evil wins":
        io.emit("evilMessage");
        break;
      default:
        return;
    }
  }
  socket.on("voterData", ({ voterId, targetId }) => {
    const voter = game
      .getCurrentPlayers()
      .find((player) => player.id === voterId && player.isAlive);
    let target;
    if (targetId === 0) {
      // Create a new player object
      target = {
        id: 0, // New player's ID (assuming 0 is a placeholder)
        name: "New Player", // Default name for new player (you can change this)
        isAlive: true, // Assuming the new player is alive
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

  function linkPlayers(targetId1, targetId2) {
    const player1 = game.getCurrentPlayers().find((p) => p.id === targetId1);
    const player2 = game.getCurrentPlayers().find((p) => p.id === targetId2);

    if (player1 && player2) {
      player1.linkWith(player2);
      console.log(`${player1.name} and ${player2.name} are now linked.`);
    } else {
      console.error("One or both players not found.");
    }
  }

  function canPerformAction(player) {
    return player.isAlive && !player.state.isAsleep;
  }
  
  socket.on("resetGame", () => {
    game.gameInProgress = false; 
    console.log("ResetGame called");
    game.resetGame();
    game.reassignRoles();
    console.log("ResetGame Players: ", game.getCurrentPlayers());
    io.emit("removeEndGameMessage");
    io.emit("setNight");
    io.emit("startGame")
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
