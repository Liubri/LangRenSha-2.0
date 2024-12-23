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
  // nextTurn() {
  //   let attempts = 0; // Track the number of attempts
  //   const maxAttempts = this.turnSequence.length; // Limit to one full loop through the sequence
  
  //   do {
  //     this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnSequence.length;
  //     const currentRole = this.getCurrentTurn();
  //     const alivePlayersWithRole = this.players.filter(
  //       (p) => p.isAlive && p.role.name === currentRole
  //     );
  
  //     if (alivePlayersWithRole.length > 0) {
  //       break; // Stop if there are alive players with the current role
  //     }
  
  //     attempts += 1; // Increment the attempts counter
  //   } while (attempts < maxAttempts);
  
  //   if (attempts === maxAttempts) {
  //     console.log("No valid turns left. Skipping to the next phase or action.");
  //     // Handle the case where no players with valid roles are alive
  //     this.currentTurnIndex = 0; // Optionally reset to the start of the sequence
  //   }
  // }
  

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
