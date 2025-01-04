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
import { v4 as uuidv4 } from 'uuid';
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
let originalIds = null;
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("joinGame", (playerName) => {
    const playerRole = game.assignRole();
    const player = new Player(playerName, playerRole);
    player.uuid = uuidv4();
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
      originalIds = game.getCurrentPlayers().map(player => ({
        id: player.id,
        uuid: player.uuid,
        name: player.name,
        role: player.role,
      }));
      // console.log("origianlIds: ", originalIds);
    }
  });
  
  socket.on("serverDay",() => {
    io.emit("setDay");
  });
  
  socket.on("updateGameState", ()=> {
    console.log("UpdateGameState called");
    // console.log("UGS: ", game.getCurrentPlayers());
    const currentDay = game.getDayCount();
    // console.log("OrigianlIds", originalIds);
    game.getCurrentPlayers().forEach(player => {
      const originalPlayer = originalIds.find(
        original => original.uuid === player.uuid
      );
      if(originalPlayer) {
        // console.log("BeforeSwitch: ", player);
        // console.log("originalPlayer: ", originalPlayer);
        player.id = originalPlayer.id;
      }
      if(player.role.name == "DreamKeeper" && !player.isAlive) {
        const target = game.getCurrentPlayers().filter((player) => player.state.isAsleep)[0];
        target.isAlive = false;
        // game.getCurrentPlayers().forEach(player => {
        //   player.state.isAsleep = false;
        // });
      }
      if(player.role.name == "Merchant" && player.state.isMarkedForElim == currentDay) {
        player.isAlive = false;
      }
      if(player.role.name == "Merchant" && !player.isAlive && player.state.isAsleep) {
        player.isAlive = true;
      }
      player.state.abilities = [];
      
      if(player.state.isCharmed) {
        if(player.state.isMarkedForElim == currentDay && player.isAlive) {
          player.isAlive = false;
        }
      }
    });
    // console.log("AfterUpdate: ", game.getCurrentPlayers());
    game.addDayCount();
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
  
  socket.on("witchSave", (targetId) => {
    const target = game
      .getCurrentPlayers()
      .find((player) => player.uuid === targetId);
    if (target) {
        target.isAlive = true;
      }
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
    io.emit("updateGrid");
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
      if(target.state.hasSwapped == true) {
        target.state.seerChecked = true;
      }
    }
    // console.log(game.getSeerChecked());
    io.emit("updateSeerChecked", game.getSeerChecked());
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
    io.emit("updateGrid");
    // io.emit("updatePlayers", game.getCurrentPlayers());
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
    werewolfSelections = {};
  });

  socket.on("werewolfKill", (targetId) => {
    game.addWerewolfChoice(targetId);
    const target = game
      .getCurrentPlayers()
      .find(
        (player) => player.id === game.tallyWerewolfChoice());
    if (game.allWerewolvesChosed().length === game.getWerewolves().length) {
      const victim = game
      .getCurrentPlayers()
      .find(
        (player) => player.id === game.getWolfChoice());
      io.emit("notifyKilled", victim.uuid);
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
    // console.log("SleepTargets: ", game.getCurrentPlayers().filter((player) => player.state.isAsleep));
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn());
  });

  socket.on("knightAction", (targetId) => {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    const knight = game
    .getCurrentPlayers()
    .find((player) => player.role.name === "Knight");
    if(target.role.name == "Werewolf") {
      target.isAlive = false;
      knight.state.isFlipped = true;
      game.setFirstTurnNight();
      io.emit("updateCurrentTurn", game.getCurrentTurn());
      io.emit("setNight");
    } else {
      knight.isAlive = false;
      knight.state.isFlipped = true;
    }
    io.emit("updatePlayers", game.getCurrentPlayers());
    endMessage();
  });
  
  socket.on("merchantPoison", (targetId) => {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    target.kill();
  });

  socket.on("merchantCheck", (targetId) => {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    target.state.seerChecked = true;
    io.emit("updateGrid");
  });

  socket.on("merchantGuard", (targetId) => {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    target.state.isProtected = true;
  });
  
  socket.on("merchantAction", ({ actionType, targetId }) => {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    if(target.role.alignment == "good") {
      if(actionType == "poison") {
        target.state.abilities.push("poison");
      } else if(actionType == "guard") {
        target.state.abilities.push("guard");
      } else {
        target.state.abilities.push("check");
      }
    } else {
      const merchant = game
      .getCurrentPlayers()
      .find((player) => player.role.name === "Merchant");      
      if(!merchant.isMarked) {
        merchant.state.isMarkedForElim = game.getDayCount() + 1;
        merchant.isMarked = true;
      }
    }
    io.emit("syncPlayers", game.getCurrentPlayers());
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn())
    io.emit("renderButtons");
  });
  
  socket.on("wolfBeautyAction", (targetId)=> {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    game.getCurrentPlayers().forEach(player => {
      if(player.state.isCharmed) {
        player.state.isCharmed = false;
        player.state.isMarkedForElim = null;
      }  
    });
    target.state.isCharmed = true;
    target.state.isMarkedForElim = game.getDayCount() + 1;
    game.nextTurn();
    io.emit("updateCurrentTurn", game.getCurrentTurn())
  });
  
  socket.on("magicianAction", (targetIds) => {
    const player1 = game
    .getCurrentPlayers()
    .find((player) => player.id === targetIds[0]);
    const player2 = game
    .getCurrentPlayers()
    .find((player) => player.id === targetIds[1]);
    [player1.id, player2.id] = [player2.id, player1.id];
    // io.emit("syncPlayers", game.getCurrentPlayers());
    // console.log("magicianPlayers: ", game.getCurrentPlayers());
    game.nextTurn();
    io.emit("updateSwapped", { 
      originalIds: [targetIds[0], targetIds[1]], 
      swappedIds: [player2.id, player1.id] 
    });
    player1.state.isSwapped = true;
    player2.state.isSwapped = true;
    player1.state.swappedRole = player2.role.alignment;
    player2.state.swappedRole = player1.role.alignment;
    io.emit("updateCurrentTurn", game.getCurrentTurn())
  });
  
  socket.on("updatePlayerFlipped", (targetId) => {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    if(target) {
      target.state.hasFlipped = true
    }
    // console.log("updatePlayerFlipped: ", game.getCurrentPlayers().filter((player) => player.state.hasFlipped));
  });
  
  socket.on("updatePlayerSwapped", (targetId) => {
    const target = game
    .getCurrentPlayers()
    .find((player) => player.id === targetId);
    if(target) {
      target.state.hasSwapped = true;
    }
    // console.log("updatePlayerFlipped: ", game.getCurrentPlayers().filter((player) => player.state.hasFlipped));
  });
  
  socket.on("votePlayerOut", ({ voteType, targetId }) => {
    if (voteType == "skip") {
      game.addSkipVote(targetId);
    } else if (voteType == "vote") {
      game.addPlayerVote(targetId);
    }
    //console.log("VoteMap: ", game.getVoteMap());
    //console.log("AlivePlayers: ", game.getAlivePlayers());
    // console.log("Fool Vote: ", game.getCurrentPlayers().find(player => player.role.name === "Fool" && player.isAlive));
    if (
      game.getPlayerVotes().length + game.getPlayerSkips().length ===
      game.getAlivePlayers().length - (game.getCurrentPlayers().find(player => player.role.name === "Fool" && player.isAlive && player.state.isFlipped == true) ? 1 : 0)
    ) {
      if (game.countVotes() > 0) {
        //console.log("Emitting voteMap:", game.getVoteMap());
        io.emit("sendVoteMap", Object.fromEntries(groupVotesMap()));
        // console.log("GroupVoteMap: ", groupVotesMap());
        // console.log("MostVoted: ", getMostVotes().voters);
        io.emit("renderVoteResults");
        const target = game
          .getCurrentPlayers()
          .find((player) => player.id === game.countVotes() && player.isAlive);
        //console.log("PlayerVotes: ", game.getPlayerVotes());
        //console.log("PlayerSkips: ", game.getPlayerSkips());
        // console.log("targetType: ", typeof target);
        target.isAlive = false;
        game.clearVotes();
        //console.log("PlayerVotes AfterClear: ", game.getPlayerVotes());
        //console.log("PlayerSkips AfterClear: ", game.getPlayerSkips());
        // console.log("Target: ", target);
        if (target && target.role.name === "Jester") {
          console.log("JesterWins Called");
          io.emit("jesterWins");
        } else if (target && target.role.name === "Fool" && target.state.isFlipped == false) {
          console.log("TargetFool Called");
          target.state.isFlipped = true;
          target.isAlive = true;
          // io.emit("revealRole", target.id);
        } else if (target && target.role.name === "WolfBeauty" && target.state.isFlipped == false) {
          target.state.isFlipped = true;
          let charmedTarget = game.getCurrentPlayers().find((player) => player.state.isCharmed == true);
          charmedTarget.isAlive = false;
        }
          else {
          endMessage();
        }
        game.nextTurn();
        // io.emit("syncPlayers", game.getCurrentPlayers());
        io.emit("updatePlayers", game.getCurrentPlayers());
        io.emit("updateCurrentTurn", game.getCurrentTurn());
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
    game.setVoteMap(voter, target);
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
  
  function getMostVotes() {
    let mostVotedTarget = null;
    let mostVotes = 0;
  
    for (const [targetId, { voters }] of groupedVotesMap) {
      if (voters.length > mostVotes) {
        mostVotedTarget = groupedVotesMap.get(targetId);
        mostVotes = voters.length;
      }
    }
    return mostVotedTarget;
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
