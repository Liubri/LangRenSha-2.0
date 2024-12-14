export class Game {
  constructor() {
    this.players = [];
    this.roles = [];
    this.nightActions = [];
    this.logs = [];
    this.currentPhase = 'lobby'; // 'lobby', 'night', 'day'
  }

  addPlayer(player) {
    this.players.push(player);
  }

  assignRoles() {
    // Shuffle roles and assign them to players
    const shuffledRoles = this.roles.sort(() => Math.random() - 0.5);
    this.players.forEach((player, index) => {
      player.assignRole(shuffledRoles[index]);
    });
  }

  startGame() {
    this.currentPhase = 'night';
    this.logs.push("Game started");
  }

  performNightActions() {
    this.nightActions.forEach((action) => action());
    this.nightActions = [];
    this.logs.push("Night actions performed");
  }

  checkGameOver() {
    const aliveWerewolves = this.players.filter(p => p.isAlive && p.role.name === 'Werewolf');
    const aliveGood = this.players.filter(p => p.isAlive && p.role.alignment === 'good');
    if (aliveWerewolves.length === 0) {
      return 'Good wins';
    } else if (aliveGood.length <= aliveWerewolves.length) {
      return 'Evil wins';
    }
    return null;
  }

  getCurrentPlayers() {
    return this.players;
  }

  logAction(action) {
    this.logs.push(action);
  }
}