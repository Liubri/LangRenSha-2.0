import { Werewolf } from "./roles/Werewolf.js";
import { Villager } from "./roles/Villager.js";
import { Witch } from "./roles/Witch.js";
import { Seer } from "./roles/Seer.js";
import { Hunter } from "./roles/Hunter.js";
import { Jester } from "./roles/Jester.js";
export class Game {
  constructor() {
    this.players = [];
    this.nightActions = [];
    this.seerCheckedPlayers = [];
    this.playerVotes = [];
    this.skipVotes = [];
    this.logs = [];
    this.currentPhase = "lobby"; // 'lobby', 'night', 'day'
    this.turnSequence = ["werewolf", "witch", "seer", "vote"];
    this.werewolvesChoice = [];
    this.currentTurnIndex = 0;
    this.voteMap = new Map();
    this.gameInProgress = false;
    this.availableRoles = [new Witch(), new Werewolf(), new Seer(), new Villager(), new Hunter()];
  }
  
  assignRole() {
    const randomIndex = Math.floor(Math.random() * this.availableRoles.length); // Pick a random index
    const role = this.availableRoles[randomIndex]; // Get the role
    this.availableRoles.splice(randomIndex, 1); // Remove the assigned role from the array
    console.log("Available roles after assignment:", this.availableRoles);
    return role; // Return the selected role
  }
  
  getAvailableRoles() {
    return this.availableRoles.length;
  }
  
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  reassignRoles() {
    // Shuffle the roles array
    this.shuffleArray(this.availableRoles);
    console.log("GameRoles: ", this.availableRoles);
  
    // Assign each player a role
    this.players.forEach((player, index) => {
      console.log(`Assigned role ${player.role ? player.role.getName() : "undefined"} to ${player.name}`);
      player.role = this.availableRoles[index];
    });
  }
  
  resetGame() {
    // Reset all game state properties to their initial values
    this.availableRoles = [new Witch(), new Werewolf(), new Seer(), new Villager()];
    this.nightActions = [];
    this.seerCheckedPlayers = [];
    this.playerVotes = [];
    this.skipVotes = [];
    this.logs = [];
    this.currentPhase = "lobby"; // Reset to the lobby phase
    this.werewolvesChoice = [];
    this.currentTurnIndex = 0;
    this.voteMap = new Map();
    this.gameInProgress = false;
    this.players.forEach((player) => {
      player.isAlive = true;
    });
  }
  
  gamePlaying() {
    return this.gameInProgress;
  }
  
  getCurrentPhase() {
    return this.currentPhase;
  }
  
  setDayPhase() {
    this.currentPhase = "day";
  }
  
  setNightPhase() {
    this.currentPhase = "night"
  }

  getCurrentTurn() {
    return this.turnSequence[this.currentTurnIndex];
  }

  nextTurn() {
    this.currentTurnIndex += 1;
    if (this.currentTurnIndex >= this.turnSequence.length) {
      this.currentTurnIndex = 0;
    }
  }

  addPlayer(player) {
    this.players.push(player);
  }

  addSeerCheckedPlayer(playerName) {
    if (!this.seerCheckedPlayers.includes(playerName)) {
      this.seerCheckedPlayers.push(playerName);
    }
  }

  getSeerChecked() {
    return this.seerCheckedPlayers;
  }

  startGame() {
    this.currentPhase = "night";
    this.logs.push("Game started");
  }

  performNightActions() {
    this.nightActions.forEach((action) => action());
    this.nightActions = [];
    this.logs.push("Night actions performed");
  }

  getWerewolves() {
    return this.players.filter((p) => p.isAlive && p.role.name === "Werewolf");
  }

  checkGameOver() {
    const aliveWerewolves = this.players.filter(
      (p) => p.isAlive && p.role.name === "Werewolf"
    );
    const aliveGood = this.players.filter(
      (p) => p.isAlive && p.role.alignment === "good"
    );
    const villagers = this.players.filter(
      (p) => p.isAlive && p.role.name === "Villager"
    );
    console.log("AliveWerewolves: ", aliveWerewolves);
    if (aliveWerewolves.length === 0) {
      //console.log("Good wins");
      return "Good wins";
    } else if (
      aliveGood.length <= aliveWerewolves.length ||
      villagers.length == 0
    ) {
      //console.log("Evil wins");
      return "Evil wins";
    }
    return "Game continues";
  }

  getCurrentPlayers() {
    return this.players;
  }

  getAlivePlayers() {
    return this.players.filter((p) => p.isAlive);
  }

  logAction(action) {
    this.logs.push(action);
  }

  getWolfChoice() {
    return this.werewolvesChoice;
  }

  tallyWerewolfChoice() {
    const frequencyMap = {};

    // Count occurrences of each number
    this.werewolvesChoice.forEach((num) => {
      frequencyMap[num] = (frequencyMap[num] || 0) + 1;
    });

    // Find the maximum frequency
    let maxCount = 0;
    for (const count of Object.values(frequencyMap)) {
      if (count > maxCount) {
        maxCount = count;
      }
    }

    // Collect all elements with the maximum frequency
    const candidates = Object.entries(frequencyMap)
      .filter(([_, count]) => count === maxCount)
      .map(([key]) => Number(key)); // Convert keys back to numbers

    // Randomly choose one of the candidates if there's a tie
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  addWerewolfChoice(int) {
    this.werewolvesChoice.push(int);
  }

  clearWolfChoice() {
    this.werewolvesChoice = [];
  }

  countVotes() {
    //If the majority wants to skip the votes
    if (this.playerVotes.length <= this.skipVotes.length) {
      return 0;
    }
    const frequencyMap = {};

    // Count occurrences of each number
    this.playerVotes.forEach((num) => {
      frequencyMap[num] = (frequencyMap[num] || 0) + 1;
    });

    // Find the maximum frequency
    let maxCount = 0;
    for (const count of Object.values(frequencyMap)) {
      if (count > maxCount) {
        maxCount = count;
      }
    }

    // Collect all elements with the maximum frequency
    const candidates = Object.entries(frequencyMap)
      .filter(([_, count]) => count === maxCount)
      .map(([key]) => Number(key)); // Convert keys back to numbers

    // If there is no single most frequent number, return 0
    if (candidates.length > 1) {
      return 0;
    }

    // Return the most frequent number
    return candidates[0];
  }

  addPlayerVote(targetId) {
    this.playerVotes.push(targetId);
  }

  addSkipVote(targetId) {
    this.skipVotes.push(targetId);
  }

  getPlayerVotes() {
    return this.playerVotes;
  }

  getPlayerSkips() {
    return this.skipVotes;
  }

  setVoteMap(voter, targetId) {
    this.voteMap.set(voter, targetId);
  }

  getVoteMap() {
    return this.voteMap;
  }

  clearVotes() {
    this.playerVotes = [];
    this.skipVotes = [];
    this.voteMap.clear();
  }
}
