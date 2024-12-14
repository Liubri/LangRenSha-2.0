import { Role } from './Role.js';

export class Werewolf extends Role {
  constructor() {
    super("Werewolf", "evil");
  }

  performAction(game, player, target) {
    if (target.isAlive) {
      target.isAlive = false;
      game.logAction(`${player.name} (Werewolf) attacked ${target.name}`);
    }
  }
}
