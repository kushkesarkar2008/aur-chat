const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Database Structure
let data = {
    users: {},     // { username: { password, salt, pic, about, online, lastSeen } }
    tokens: {},    // { token: username }
    msgs: [],      // [ { id, from, to, text, time, status, media } ]
    statuses: []   // [ { id, user, time, kind, text, bg, mediaId } ]
};

let dbClient = null;
let db = null;
let mediaCollection = null;

async function connectDB() {
    if (MONGODB_URI) {
        try {
            dbClient = new MongoClient(MONGODB_URI);
            await dbClient.connect();
            db = dbClient.db('aur');
            mediaCollection = db.collection('media');
            console.log('Connected to MongoDB Atlas');

            const stateCol = db.collection('state');
            const savedState = await stateCol.findOne({ _id: 'main' });
            if (savedState) {
                data.users = savedState.users || {};
                data.tokens = savedState.tokens || {};
                data.msgs = savedState.msgs || [];
                data.statuses = savedState.statuses || [];
            } else {
                await saveStateToDB();
            }
        } catch (err) {
            console.error('MongoDB connection error:', err);
        }
    } else {
        console.log('Running in local memory mode (No MongoDB URI)');
    }
}

async function saveStateToDB() {
    if (db) {
        try {
            await db.collection('state').updateOne(
                { _id: 'main' },
                { $set: { users: data.users, tokens: data.tokens, msgs: data.msgs, statuses: data.statuses } },
                { upsert: true }
            );
        } catch (err) {
            console.error('Failed to save state to MongoDB:', err);
        }
    }
}

// Password Hashing Helper
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
}

// --- Auth API (Aligned with index.html) ---
app.post('/api/auth', async (req, res) => {
    const { username, password, mode } = req.body || {};
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '');

    if (!u || !p) return res.json({ error: 'Username and password are required' });

    if (mode === 'register') {
        if (data.users[u]) return res.json({ error: 'Username already taken' });
        const { hash, salt } = hashPassword(p);
        data.users[u] = { password: hash, salt, pic: '', about: '', online: false, lastSeen: Date.now() };
    } else {
        const user = data.users[u];
        if (!user) return res.json({ error: 'Invalid username or password' });
        const { hash } = hashPassword(p, user.salt);
        if (hash !== user.password) return res.json({ error: 'Invalid username or password' });
    }

    const token = crypto.randomUUID();
    data.tokens[token] = u;
    await saveStateToDB();

    res.json({ username: u, token });
});

// Socket Helpers & Online Tracker
const online = {}; // { username: Set(socketIds) }

function emitTo(user, event, val) {
    if (online[user]) {
        online[user].forEach(sid => io.to(sid).emit(event, val));
    }
}

// Socket.IO Middleware & Handlers
io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    const user = data.tokens[token];
    if (!user || !data.users[user]) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
});

io.on('connection', socket => {
    const me = socket.user;
    online[me] = online[me] || new Set();
    online[me].add(socket.id);

    data.users[me].online = true;
    data.users[me].lastSeen = Date.now();

    // Broadcast presence update
    io.emit('presence', { username: me, online: true, lastSeen: data.users[me].lastSeen, pic: data.users[me].pic, about: data.users[me].about });

    // Send init state
    const userList = {};
    Object.keys(data.users).forEach(u => {
        userList[u] = {
            online: online[u] && online[u].size > 0,
            lastSeen: data.users[u].lastSeen,
            pic: data.users[u].pic,
            about: data.users[u].about
        };
    });

    const myMsgs = data.msgs.filter(m => m.from === me || m.to === me);
    socket.emit('init', { users: userList, msgs: myMsgs });

    // Mark sent messages delivered
    data.msgs.forEach(m => {
        if (m.to === me && m.status === 'sent') {
            m.status = 'delivered';
            emitTo(m.from, 'status', { with: me, status: 'delivered' });
        }
    });

    socket.on('send', ({ to, text }) => {
        if (!to || !data.users[to]) return;
        const msg = {
            id: crypto.randomUUID(),
            from: me,
            to,
            text: String(text || '').slice(0, 2000),
            time: Date.now(),
            status: online[to] && online[to].size > 0 ? 'delivered' : 'sent'
        };
        data.msgs.push(msg);
        saveStateToDB();

        emitTo(to, 'msg', msg);
        emitTo(me, 'msg', msg);
    });

    socket.on('read', peer => {
        data.msgs.forEach(m => {
            if (m.from === peer && m.to === me) m.status = 'read';
        });
        saveStateToDB();
        emitTo(peer, 'status', { with: me, status: 'read' });
    });

    socket.on('typing', peer => emitTo(peer, 'typing', { from: me }));

    socket.on('profile', ({ pic, about }) => {
        if (data.users[me]) {
            if (typeof pic === 'string') data.users[me].pic = pic;
            if (typeof about === 'string') data.users[me].about = about.slice(0, 100);
            saveStateToDB();
            io.emit('presence', { username: me, online: true, lastSeen: data.users[me].lastSeen, pic: data.users[me].pic, about: data.users[me].about });
        }
    });

    socket.on('disconnect', () => {
        if (online[me]) {
            online[me].delete(socket.id);
            if (online[me].size === 0) {
                delete online[me];
                data.users[me].online = false;
                data.users[me].lastSeen = Date.now();
                saveStateToDB();
                io.emit('presence', { username: me, online: false, lastSeen: data.users[me].lastSeen, pic: data.users[me].pic, about: data.users[me].about });
            }
        }
    });
});

// Load Extras Server Module Safely
try {
    const extrasServer = require('./extras_server');
    extrasServer({
        app,
        io,
        db: () => data,
        save: saveStateToDB,
        online,
        emitTo,
        media: () => mediaCollection
    });
    console.log('Extras server module loaded successfully');
} catch (e) {
    console.error('Failed to load extras_server:', e);
}

// Start Server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`AUR server active on port ${PORT}`);
    });
});
