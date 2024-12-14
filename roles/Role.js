export class Role {
  constructor(name, alignment) {
    this.name = name; // e.g., 'Werewolf', 'Seer'
    this.alignment = alignment; // 'good' or 'evil'
  }
  
  getName() {
    return this.name;
  }

  performAction(game, player, target) {
    throw new Error("performAction must be implemented by subclasses");
  }
}
