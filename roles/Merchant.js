import { Role } from "./Role.js";

export class Merchant extends Role {
  constructor() {
    super("Merchant", "good");
  }
}