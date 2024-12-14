export class Game {
  constructor(players) {
    this.players = players;
    this.nightPhase = false;
    this.werewolves = players.filter((player) => player.role === "werewolf");
    this.villagers = players.filter((player) => player.role === "villager");
    this.actionSequence = ["werewolves", "witch", "seer"];
    this.currentActionIndex = 0;
  }

  togglePhase() {
    this.nightPhase = !this.nightPhase;
  }

  startGame() {
    this.currentPhase = "night";
    this.logs.push("Game started");
  }

  setActionSequence(sequence) {
    this.actionSequence = sequence;
    this.currentActionIndex = 0;
  }

  getCurrentAction() {
    return this.actionSequence[this.currentActionIndex];
  }

  nextAction() {
    // this.currentActionIndex = this.currentActionIndex + 1;
    // if (this.currentActionIndex >= this.actionSequence.length) {
    //     this.currentActionIndex = 0;
    // }
    this.currentActionIndex =
      (this.currentActionIndex + 1) % this.actionSequence.length;
    this.currentAction = this.actionSequence[this.currentActionIndex];
  }

  checkGameOver() {
    // const aliveWerewolves = this.werewolves.filter(player => player.isAlive);
    // const aliveVillagers = this.villagers.filter(player => player.isAlive);
    // const aliveGoodPlayers = this.players.filter(player => player.role !== 'werewolf' && player.isAlive);

    const aliveWerewolves = this.players.filter(
      (player) => player.role === "werewolf" && player.isAlive
    );
    const aliveVillagers = this.players.filter(
      (player) => player.role === "villager" && player.isAlive
    );
    const aliveGoodPlayers = this.players.filter(
      (player) => player.role !== "werewolf" && player.isAlive
    );

    console.log(`Alive Werewolves: ${aliveWerewolves.length}`);
    console.log(`Alive Villagers: ${aliveVillagers.length}`);
    console.log(`Good Players: ${aliveGoodPlayers.length}`);

    if (aliveWerewolves.length === 0) {
      console.log("Villagers win!");
      return true;
    } else if (aliveWerewolves.length === 2 && aliveVillagers.length === 2) {
      console.log("Game over: 2 Werewolves and 2 Villagers left.");
      return true;
    } else if (
      aliveWerewolves.length === 2 &&
      aliveVillagers.length === 1 &&
      aliveGoodPlayers.length === 2
    ) {
      console.log(
        "Game over: 1 Villager, 2 Werewolves, and 1 other good player left."
      );
      return true;
    } else if (aliveVillagers.length === 0) {
      console.log("Werewolves win!");
      return true;
    }

    return false;
  }

  listAlivePlayers() {
    return this.players
      .filter((player) => player.isAlive)
      .map((player) => player.name);
  }
}
