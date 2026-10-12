const express = require('express'), http = require('http'), crypto = require('crypto'), fs = require('fs');
const { Server } = require('socket.io');
const app = express(), srv = http.createServer(app), io = new Server(srv);

const FILE = 'data.json';
const db = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : { users: {}, tokens: {}, msgs: [] };
const save = () => fs.writeFileSync(FILE, JSON.stringify(db));
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');
const online = {}; // username -> Set of sockets
const emitTo = (u, ev, d) => (online[u] || []).forEach(s => s.emit(ev, d));
const pub = u => ({ username: u, online: !!(online[u] && online[u].size), lastSeen: db.users[u].lastSeen });

app.use(express.json());
app.use(express.static('public'));

app.post('/api/auth', (req, res) => {
  const { password, mode } = req.body;
  const u = String(req.body.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(u) || !password || password.length < 4)
    return res.status(400).json({ error: 'Username: 3-20 letters/numbers. Password: 4+ characters.' });
  if (mode === 'register') {
    if (db.users[u]) return res.status(400).json({ error: 'Username already taken' });
    const salt = crypto.randomBytes(8).toString('hex');
    db.users[u] = { salt, hash: hash(password, salt), lastSeen: Date.now() };
    io.emit('presence', pub(u));
  } else {
    const x = db.users[u];
    if (!x || x.hash !== hash(password, x.salt)) return res.status(401).json({ error: 'Wrong username or password' });
  }
  const token = crypto.randomBytes(16).toString('hex');
  db.tokens[token] = u;
  save();
  res.json({ token, username: u });
});

io.use((s, next) => {
  const u = db.tokens[s.handshake.auth.token];
  if (!u) return next(new Error('auth'));
  s.user = u;
  next();
});

io.on('connection', s => {
  const me = s.user;
  (online[me] = online[me] || new Set()).add(s);

  // anything sent to me while offline is now "delivered"
  const senders = new Set();
  db.msgs.forEach(m => { if (m.to === me && m.status === 'sent') { m.status = 'delivered'; senders.add(m.from); } });
  senders.forEach(f => emitTo(f, 'status', { with: me, status: 'delivered' }));
  save();

  const users = {};
  Object.keys(db.users).forEach(u => (users[u] = pub(u)));
  s.emit('init', { users, msgs: db.msgs.filter(m => m.from === me || m.to === me) });
  io.emit('presence', pub(me));

  s.on('send', ({ to, text }) => {
    text = String(text || '').trim().slice(0, 2000);
    if (!text || !db.users[to]) return;
    const m = { id: crypto.randomUUID(), from: me, to, text, time: Date.now(),
      status: online[to] && online[to].size ? 'delivered' : 'sent' };
    db.msgs.push(m);
    save();
    emitTo(to, 'msg', m);
    emitTo(me, 'msg', m);
  });

  s.on('read', peer => {
    let changed = false;
    db.msgs.forEach(m => { if (m.from === peer && m.to === me && m.status !== 'read') { m.status = 'read'; changed = true; } });
    if (changed) { save(); emitTo(peer, 'status', { with: me, status: 'read' }); }
  });

  s.on('typing', to => emitTo(to, 'typing', { from: me }));

  s.on('disconnect', () => {
    online[me].delete(s);
    if (!online[me].size) { db.users[me].lastSeen = Date.now(); save(); io.emit('presence', pub(me)); }
  });
});

srv.listen(process.env.PORT || 3000, () => console.log('AUR running on http://localhost:' + (process.env.PORT || 3000)));
