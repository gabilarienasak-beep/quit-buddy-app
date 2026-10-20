const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let waitingQueue = [];

io.on('connection', (socket) => {
    socket.on('find_buddy', () => {
        if (waitingQueue.length > 0) {
            let buddySocket = waitingQueue.pop();
            let roomId = `room_${socket.id}_${buddySocket.id}`;
            
            socket.join(roomId);
            buddySocket.join(roomId);

            io.to(roomId).emit('matched', { roomId });

            setTimeout(() => {
                io.to(roomId).emit('session_ended');
            }, 300000); // 5-minute auto-destruct
        } else {
            waitingQueue.push(socket);
            socket.emit('waiting');
        }
    });

    socket.on('send_message', (data) => {
        socket.to(data.roomId).emit('receive_message', data.message);
    });

    socket.on('disconnect', () => {
        waitingQueue = waitingQueue.filter(s => s.id !== socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`QuitBuddy running on http://localhost:${PORT}`));