export class Role {
  constructor(name, alignment) {
    this.name = name; // e.g., 'Werewolf', 'Seer'
    this.alignment = alignment; // 'good' or 'evil'
  }
  
  getName() {
    return this.name;
  }
}
