#!/usr/bin/env node
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const SCORES_PATH = path.resolve('Score.json');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let rooms = {}
const socketToRoom = new Map()

io.on('connection', (socket) => {

    const userAgent = socket.handshake.headers['user-agent'];
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
    socket.userFromMobile = isMobile;
    console.log(`User ${socket.id} connected from ${isMobile ? 'mobile' : 'desktop'}`);

    socket.on('enterGame', () => {
        if (socket.userFromMobile) {
            socket.emit('deviceTypeMobile');
            // console.log('emitted');
        }
    })

    socket.on('createRoom', (roomID) => {
        const previousRoomID = socketToRoom.get(socket.id);
        if (previousRoomID && rooms[previousRoomID]) {
            delete rooms[previousRoomID];
            socketToRoom.delete(socket.id);
            console.log(`Deleted old room: ${previousRoomID}`);
        }
    
        if (rooms[roomID]) {
            socket.emit('roomCreated', { success: false, message: 'Room already exists.' });
            return;
        }
    
        rooms[roomID] = {
            master: socket,
            createdAt: Date.now(),
            lastSpecialKeyPressTime: 0,
            masterAfk: false,
            slaveAfk: false,
        };
    
        socketToRoom.set(socket.id, roomID);
    
        socket.emit('roomCreated', { success: true, roomID });
        console.log(`Room created: ${roomID}, master is: ${socket.id}`);
    });
    

    socket.on('joinRoom', (roomID) => {
        if (roomID in rooms) {
            let room = rooms[roomID]
            if (room.master.id === socket.id) {
                socket.emit('joinRoomResponse', 0);
                console.log(`player: ${socket.id} is the master of room ${roomID}, cannot join as a player.`);
                return;
            }

            room.slave = socket
            room.slave.emit('joinRoomResponse', 1)
            room.master.emit('slaveJoinRoom')

            console.log(`player: ${room.slave.id} joined: ${roomID}, master is: ${room.master.id}`)

            room.slave.join(roomID)
            room.master.join(roomID)
            room.slave.currentRoom = roomID
            room.master.currentRoom = roomID
        } else{
            socket.emit('joinRoomResponse', 0)
            console.log(`player: ${socket.id} failed to join the room ${roomID}`)
        }
        // console.log(rooms, roomID)
    })

    socket.on('initRoom', (initState) => {   
        let room = rooms[socket.currentRoom]
        if (room.slaveReady) {
            io.to(socket.currentRoom).emit('startRoom', initState)
            delete room.initState
            delete room.slaveReady
        } else {
            room.initState = initState
        }
    })
    
    socket.on('slaveReady', () => {
        let room = rooms[socket.currentRoom]
        room.slaveReady = true

        if (room.initState){
            io.to(socket.currentRoom).emit('startRoom', room.initState)
            delete room.initState
            delete room.slaveReady
        }
    })

    socket.on('btnPressed', (action) => {
        const room = rooms[socket.currentRoom];
    
        if (!room) return;
    
        if (!room.readyPlayers) {
            room.readyPlayers = new Set();
        }
    
        room.readyPlayers.add(socket.id);
    
        if (room.readyPlayers.size === 2) {
            // console.log(`Both ready bothReady${action}`);
            io.to(socket.currentRoom).emit(`bothReady${action}`);
            room.readyPlayers.clear();
        }
    });

    // Moving
    socket.on('playerMove', (data) => {
        socket.to(socket.currentRoom).emit('playerMove', data);
    });

    // // Spawning
    socket.on('playerPlace', (data) => {
        socket.to(socket.currentRoom).emit('pipePlaceSent', data);
        // console.log('sending ', data)
    });

    
    socket.on('specialKeyPress', (data) => {
        const room = rooms[socket.currentRoom];
        if (!room) return;
    
        room.lastSpecialKeyPressTime = Date.now();

        // console.log(`Special key pressed: ${data.key}`);
        socket.to(socket.currentRoom).emit('specialKeyPress', data);
        
    });

    socket.on('startEnemyScene', () => {
        const room = rooms[socket.currentRoom];
        if (!room) return;
    
        // Default to ancient time if never set
        const lastToolUse = room.lastSpecialKeyPressTime || 0;
        const now = Date.now();
        const timeSinceToolUse = now - lastToolUse;
    
        // console.log('Enemy attempt:', { now, lastToolUse, timeSinceToolUse });
    
        // Reject if any tool was used in the last 200ms
        if (timeSinceToolUse < 1000) {
            console.log('Enemy scene blocked due to recent tool use');
            return;
        }
    
        console.log('Emitting enemy');
        io.to(socket.currentRoom).emit('enemySceneStarted');
    });
      
    //Temperature changed
    socket.on('changeTemperature', (data) => {
        // console.log(`${data} changed temperature`);
        socket.to(socket.currentRoom).emit('changeTemperature', data);
    });

    //Buy Seller Item
    socket.on('buyItem', (data) => {
        // console.log(`${data.tool, data.index} bought`);
        socket.to(socket.currentRoom).emit('buyItem', data);
    });

    // // throw pipe at enemy
    const throwWindow = 150;
    let lastThrowTimes = {
        player1: null,
        player2: null,
    };

    socket.on('playerThrow', (data) => {
        const player = data.player;
        const now = Date.now();
    
        lastThrowTimes[player] = now;

        const otherPlayer = player === 'player1' ? 'player2' : 'player1';
        const otherThrowTime = lastThrowTimes[otherPlayer];
    
        const isSimultaneous =
            otherThrowTime !== null && Math.abs(now - otherThrowTime) <= throwWindow;
    
        let validThrow = player;
    
        if (isSimultaneous) {
            if (player === 'player2') {
                validThrow = 'player1';
            }
        }
    
        io.to(socket.currentRoom).emit('playerThrow', { player: validThrow });
    });

    socket.on('sendOpenShield', () => {
        // console.log('Received open shield command from master');
        socket.to(socket.currentRoom).emit('openShield');
    })

    socket.on('launchRocket', (data) => {
        // console.log('Received launch command from master')
        socket.to(socket.currentRoom).emit('fireInTheHole', data)
    })

    // Close enemy scene (just in case of bad time sync)
    socket.on('closeEnemy', () => {
        // console.log('Closing enemy scene');
        socket.to(socket.currentRoom).emit('closeEnemyScene');
    });

    // timer upd
    socket.on("syncTimer", (data) => {
        socket.to(socket.currentRoom).emit("syncTimer", data);
    });

    socket.on('playerClick', (data) => {
        socket.to(socket.currentRoom).emit('playerClick', data);
    });
    
    
    // Exit to menu from one of the players
    socket.on('disconnectMenu', () => {
        console.log('User went to Menu: ' + socket.id);
        // socket.to(socket.currentRoom).emit('userDisconnected');
        const roomID = socket.currentRoom;
    
        if (roomID) {
            io.to(roomID).emit('userDisconnected', { id: socket.id });
    
            delete rooms[roomID];
            console.log('Deleted room:', roomID);
        }
    });

    const sceneStates = {}
    //sync scenes change:
    socket.onAny((eventName, data) => {
        const match = eventName.match(/^(master|slave)LaunchScene(.+)$/);
        if (!match) return;

        const role = match[1]; // 'master' or 'slave'
        const sceneName = match[2];
        const roomID = socketToRoom.get(socket.id);
        if (!roomID) return;

        if (!sceneStates[roomID]) sceneStates[roomID] = { master: null, slave: null };
        sceneStates[roomID][role] = sceneName;

        // console.log(`${role} launched scene: ${sceneName} in room ${roomID}`);

        const otherRole = role === 'master' ? 'slave' : 'master';
        const otherSocket = rooms[roomID] && rooms[roomID][otherRole];


        if (!otherSocket) return;

        if (sceneStates[roomID][otherRole] !== sceneName) {
            // console.log(`Asking ${otherRole} to launch scene ${sceneName}`);
            otherSocket.emit('forceLaunchScene', sceneName);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected: ' + socket.id);
    
        const roomID = socket.currentRoom;
    
        if (roomID) {
            io.to(roomID).emit('userDisconnected', { id: socket.id });
    
            delete rooms[roomID];
            console.log('Deleted room:', roomID);
            delete sceneStates[roomID]
        }
    });

    socket.on('saveScore', async (data) => {
        const roomID = socket.currentRoom;
    
        try {
            if (!data.nickname || typeof data.nickname !== 'string') {
                console.error('Invalid nickname');
                return;
            }
    
            const newScore = {
                id: Date.now().toString(),
                nickname: data.nickname,
                score: data.score,
                createdAt: new Date().toISOString()
            };
    
            const scores = await readScores();
    
            scores.push(newScore);
            scores.sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));
    
            await writeScores(scores);
    
            const topScores = scores.slice(0, 5);
            const playerRank = scores.findIndex(s => s.id === newScore.id) + 1;
    
            const payload = { topScores, newScore, playerRank };
    
            if (roomID) {
                io.to(roomID).emit('saveScoreResponse', { success: true });
                io.to(roomID).emit('showScores', payload);
            } else {
                socket.emit('saveScoreResponse', { success: true });
                socket.emit('showScores', payload);
            }
    
        } catch (err) {
            console.error(err);
            io.to(roomID).emit('saveScoreResponse', { success: false, error: err.message });
        }
    });

    socket.on('tabVisibilityChange', ({ hidden, role, timestamp }) => {
        const room = rooms[socket.currentRoom]

        if (!room){return}

        // console.log(`[Server] ${role} is now ${hidden ? 'hidden' : 'visible'} at ${new Date(timestamp).toLocaleTimeString()}`);
        // console.log(room.master?.id)
        // console.log(room.slave?.id)
        // console.log(socket?.id)

        const roleAfk = role + 'Afk'
        room[roleAfk] = hidden;
        const masterHidden = room.masterAfk;
        const slaveHidden = room.slaveAfk;
        const hiddenStatus = masterHidden || slaveHidden;

        // console.log(hiddenStatus)

        io.to(socket.currentRoom).emit('pauseEnemy', {status: hiddenStatus, role: role})
    });

});

async function readScores() {
    try {
        const data = await readFile(SCORES_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading scores file:', err);
        return [];
    }
}

async function writeScores(scores) {
    try {
        await writeFile(SCORES_PATH, JSON.stringify(scores, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing scores file:', err);
    }
}

app.post('/scores', async (req, res) => {
    const { nickname, score } = req.body;

    if (!nickname || typeof score !== 'number') {
        return res.status(400).json({ message: 'Invalid data' });
    }

    const newScore = {
        id: Date.now().toString(),
        nickname,
        score,
        createdAt: new Date().toISOString()
    };

    const scores = await readScores();
    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));

    await writeScores(scores);

    res.status(201).json({ message: 'Score saved' });
});

app.get('/scores', async (req, res) => {
    try {
        const scores = await readScores();
        const topScores = scores.slice(0, 5);
        res.json(topScores);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

server.listen(3000, () => {
    console.log('Server is running on ip:3000');
});
