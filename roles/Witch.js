import { Role } from './Role.js';

export class Witch extends Role {
  constructor() {
    super("Witch", "good");
    this.hasMedicine = true;
    this.hasPoison = true;
  }
}
