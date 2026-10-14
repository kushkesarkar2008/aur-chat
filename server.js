const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let state = { users: [], msgs: [] };
let db = null;
let stateCollection = null;

async function connectDB() {
    if (MONGODB_URI) {
        try {
            const client = new MongoClient(MONGODB_URI);
            await client.connect();
            db = client.db('aur');
            stateCollection = db.collection('state');
            console.log('Using MongoDB');

            const savedState = await stateCollection.findOne({ _id: 'main' });
            if (savedState) {
                state.users = savedState.users || [];
                state.msgs = savedState.msgs || [];
            } else {
                await saveStateToDB();
            }
        } catch (err) {
            console.error('MongoDB error:', err);
        }
    } else {
        console.log('Running in memory mode');
    }
}

async function saveStateToDB() {
    if (stateCollection) {
        try {
            await stateCollection.updateOne(
                { _id: 'main' },
                { $set: { users: state.users, msgs: state.msgs } },
                { upsert: true }
            );
        } catch (err) {
            console.error('Failed to save state:', err);
        }
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const existingUser = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const newUser = {
        id: Buffer.from(username).toString('hex'),
        username,
        password: hashPassword(password),
        online: false
    };

    state.users.push(newUser);
    await saveStateToDB();
    res.json({ user: { id: newUser.id, username: newUser.username } });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ user: { id: user.id, username: user.username } });
});

app.get('/api/users', (req, res) => {
    res.json(state.users.map(u => ({ id: u.id, username: u.username, online: u.online || false })));
});

app.get('/api/messages/:recipientId', (req, res) => {
    const { recipientId } = req.params;
    const msgs = state.msgs.filter(m => (m.sender === recipientId || m.recipient === recipientId));
    res.json(msgs);
});

const activeSockets = new Map();

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        activeSockets.set(socket.id, userId);
        const user = state.users.find(u => u.id === userId);
        if (user) {
            user.online = true;
            io.emit('users_updated');
        }
    });

    socket.on('private_message', async (msgData) => {
        state.msgs.push(msgData);
        await saveStateToDB();
        for (let [sockId, uId] of activeSockets.entries()) {
            if (uId === msgData.recipient) {
                io.to(sockId).emit('private_message', msgData);
            }
        }
    });

    socket.on('disconnect', () => {
        const userId = activeSockets.get(socket.id);
        if (userId) {
            const user = state.users.find(u => u.id === userId);
            if (user) {
                user.online = false;
                io.emit('users_updated');
            }
            activeSockets.delete(socket.id);
        }
    });
});

// Load extras_server safely if it exists
try {
    require('./extras_server')(app, io, state, saveStateToDB);
} catch (e) {
    console.log('Extras module not loaded or handled inline.');
}

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`AUR running on port ${PORT}`);
    });
});
