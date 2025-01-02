export class Player {
  static nextId = 1;
  constructor(name, role) {
    this.id = Player.nextId++;
    this.name = name;
    this.role = role;
    this.isAlive = true;
    this.state = {
      isFlipped: false,
      hasFlipped: false, 
      isAsleep: false,
      isLinked: false,
      linkedPlayer: null, // Reference to the linked player
      parentId: null, // For the Child role to track its parent
    };
  }

  getName() {
    return this.name;
  }

  assignRole(role) {
    this.role = role;
  }

  getRoleName() {
    return this.role.getName();
  }

  getRoleAlignment() {
    return this.role.alignment;
  }
  
  canPerformAction() {
    return this.isAlive && !this.state.isAsleep;
  }

  kill() {
    if (this.canPerformAction()) {
      this.isAlive = false;
      if (
        this.state.isLinked &&
        this.state.linkedPlayer &&
        this.state.linkedPlayer.isAlive
      ) {
        console.log(
          `${this.name} is linked with ${this.state.linkedPlayer.name}. They will also die.`
        );
        this.state.linkedPlayer.kill();
      }
    }
  }

  linkWith(player) {
    this.state.isLinked = true;
    this.state.linkedPlayer = player;
    player.state.isLinked = true;
    player.state.linkedPlayer = this;
  }

  // Method to set a parent for the Child role
  setParent(parentId) {
    this.state.parentId = parentId;
  }
}
