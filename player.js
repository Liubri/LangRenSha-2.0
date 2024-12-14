export class Player {
  constructor(name, role) {
    this.name = name;
    this.role = role;
    this.isAlive = true;
  }

  assignRole(role) {
    this.role = role;
  }

  kill() {
    this.isAlive = false;
  }
}
