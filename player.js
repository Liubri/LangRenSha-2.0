export class Player {
  static nextId = 1;
  constructor(name, role) {
    this.id = Player.nextId++;
    this.name = name;
    this.role = role;
    this.isAlive = true;
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

  kill() {
    this.isAlive = false;
  }
}
