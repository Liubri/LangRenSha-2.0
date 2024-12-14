const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let players = [];

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinGame', (player) => {
        console.log('Method called joinGame');
        players.push(player);
        io.emit('updatePlayers', players); // Broadcast updated players to all clients
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        // Handle player disconnection if needed
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});