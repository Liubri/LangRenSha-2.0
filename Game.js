export class Game {
  constructor() {
    this.players = [];
    this.roles = [];
    this.nightActions = [];
    this.seerCheckedPlayers = [];
    this.playerVotes = [];
    this.logs = [];
    this.currentPhase = "lobby"; // 'lobby', 'night', 'day'
    this.turnSequence = ["werewolf", "witch", "seer", "vote"];
    this.werewolvesChoice = [];
    this.currentTurnIndex = 0;
  }

  getCurrentTurn() {
    return this.turnSequence[this.currentTurnIndex];
  }

  nextTurn() {
    this.currentTurnIndex += 1;
    if (this.currentTurnIndex > this.turnSequence.length - 1) {
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

  assignRoles() {
    // Shuffle roles and assign them to players
    const shuffledRoles = this.roles.sort(() => Math.random() - 0.5);
    this.players.forEach((player, index) => {
      player.assignRole(shuffledRoles[index]);
    });
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
    if (aliveWerewolves.length === 0) {
      console.log("Good wins");
      return true;
    } else if (aliveGood.length <= aliveWerewolves.length) {
      console.log("Evil wins");
      return true;
    }
    return false;
  }

  getCurrentPlayers() {
    return this.players;
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
  
  getPlayerVotes() {
    return this.playerVotes;
  }
}
