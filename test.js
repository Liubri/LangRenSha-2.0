// Import necessary classes
import { Player } from './Player.js'; // Assuming Player.js is in the same folder
import { Villager } from './roles/Villager.js'; // Assuming Villager.js is in the same folder
import { Game} from './Game.js';

const playerName = 'John Doe'; // Example player name

// Instantiate Player with Villager role
const playerRole = new Villager();
const player = new Player(playerName, playerRole);

const game = new Game();
game.addPlayer(player);

let array = game.getCurrentPlayers();

console.log(array[0]);

// Output player name and role
console.log(player.getName()); // This will print "John Doe"
console.log(player.getRoleName()); // This will print "Villager"
