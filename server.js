
const express = require('express'), http = require('http'), crypto = require('crypto'), fs = require('fs');
const { Server } = require('socket.io');
const app = express(), srv = http.createServer(app), io = new Server(srv);

const FILE = 'data.json';
let db = { users: {}, tokens: {}, msgs: [] }, col = null, mediaCol = null, timer;
// With MONGODB_URI set (Render) data lives in MongoDB; without it (local) data lives in data.json
const save = () => {
  if (!col) return fs.writeFileSync(FILE, JSON.stringify(db));
  clearTimeout(timer);
  timer = setTimeout(() => col.replaceOne({ _id: 'main' }, { _id: 'main', data: db }, { upsert: true })
    .catch(e => console.error('Mongo save failed:', e.message)), 300);
};
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');
const online = {}; // username -> Set of sockets
const emitTo = (u, ev, d) => (online[u] || []).forEach(s => s.emit(ev, d));
const pub = u => ({ username: u, online: !!(online[u] && online[u].size), lastSeen: db.users[u].lastSeen, pic: db.users[u].pic || '', about: db.users[u].about || '' });

app.use(express.json());
app.use(express.static('public'));

// ---- file / image uploads (bytes in MongoDB "media" collection, or uploads/ folder locally) ----
let mcol = null;
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
const SAFE = /^(image\/(png|jpe?g|gif|webp)|video\/(mp4|webm)|audio\/(mpeg|ogg|wav|webm|mp4|aac))$/;
app.post('/api/upload', express.raw({ type: '*/*', limit: '8mb' }), async (req, res) => {
  if (!db.tokens[req.query.t] || !Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Upload failed (max 8 MB)' });
  const id = crypto.randomUUID();
  const meta = { name: String(req.query.name || 'file').slice(0, 100), type: String(req.query.type || '').slice(0, 100), size: req.body.length };
  try { if (mcol) await mcol.insertOne({ _id: id, data: req.body }); else fs.writeFileSync('uploads/' + id, req.body); }
  catch (e) { return res.status(500).json({ error: 'Could not save file' }); }
  (db.media = db.media || {})[id] = meta; save();
  res.json({ id, ...meta });
});
app.get('/media/:id', async (req, res) => {
  const meta = (db.media || {})[req.params.id];
  if (!meta || !db.tokens[req.query.t]) return res.sendStatus(404);
  let buf;
  try {
    if (mcol) { const d = await mcol.findOne({ _id: req.params.id }); buf = d.data.buffer.subarray(0, d.data.length()); }
    else buf = fs.readFileSync('uploads/' + req.params.id);
  } catch (e) { return res.sendStatus(404); }
  const safe = SAFE.test(meta.type);
  res.set({ 'Content-Type': safe ? meta.type : 'application/octet-stream', 'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': (safe ? 'inline' : 'attachment') + '; filename="' + encodeURIComponent(meta.name) + '"' });
  res.send(Buffer.from(buf));
});

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

require('./extras-server')({ app, io, db: () => db, save, online, emitTo, media: () => mediaCol });

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
  s.emit('init', { users, msgs: db.msgs.filter(m => m.from === me || m.to === me),
    stories: (db.stories || []).filter(x => Date.now() - x.time < 864e5) });
  io.emit('presence', pub(me));

  s.on('send', ({ to, text, media }) => {
    text = String(text || '').trim().slice(0, 2000);
    const f = media && db.media && db.media[media];
    if ((!text && !f) || !db.users[to]) return;
    const m = { id: crypto.randomUUID(), from: me, to, text, time: Date.now(),
      status: online[to] && online[to].size ? 'delivered' : 'sent' };
    if (f) m.media = { id: media, ...f };
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

  s.on('profile', ({ pic, about }) => {
    if (typeof pic === 'string' && pic.length < 60000 && (pic === '' || pic.startsWith('data:image/'))) db.users[me].pic = pic;
    if (typeof about === 'string') db.users[me].about = about.slice(0, 100);
    save();
    io.emit('presence', pub(me));
  });

  s.on('story:add', ({ kind, text, bg, media }) => {
    text = String(text || '').slice(0, 300);
    const img = kind === 'image';
    if (img ? !(db.media && db.media[media] && db.media[media].type.startsWith('image/')) : !text.trim()) return;
    const now = Date.now();
    db.stories = (db.stories || []).filter(x => now - x.time < 864e5);
    const st = { id: crypto.randomUUID(), user: me, kind: img ? 'image' : 'text', text, media: img ? media : '', time: now,
      bg: /^#[0-9a-f]{6}$/i.test(bg) ? bg : '#128c7e' };
    db.stories.push(st); save();
    io.emit('story:new', st);
  });

  s.on('typing', to => emitTo(to, 'typing', { from: me }));

  s.on('disconnect', () => {
    online[me].delete(s);
    if (!online[me].size) { db.users[me].lastSeen = Date.now(); save(); io.emit('presence', pub(me)); }
  });
});

(async () => {
  if (process.env.MONGODB_URI) {
    const { MongoClient } = require('mongodb');
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    col = client.db('aur').collection('state');
    mediaCol = client.db('aur').collection('media');
    mcol = client.db('aur').collection('media');
    const d = await col.findOne({ _id: 'main' });
    if (d) db = d.data;
    console.log('Using MongoDB');
  } else if (fs.existsSync(FILE)) {
    db = JSON.parse(fs.readFileSync(FILE));
    console.log('Using data.json');
  }
  srv.listen(process.env.PORT || 3000, () => console.log('AUR running on port ' + (process.env.PORT || 3000)));
})();
