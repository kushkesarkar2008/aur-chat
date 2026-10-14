// AUR extras (server): media upload/download, image+file messages, 24h statuses
const crypto = require('crypto'), fs = require('fs'), path = require('path'), express = require('express');
const DIR = 'uploads'; // used only when MongoDB is not configured (local testing)

module.exports = ({ app, io, db, save, online, emitTo, media }) => {
  const userOf = req => db().tokens[req.headers['x-token'] || req.query.t];
  const live = () => { const d = db(); d.statuses = (d.statuses || []).filter(x => Date.now() - x.time < 864e5); return d.statuses; };

  app.post('/api/upload', express.raw({ type: '*/*', limit: '6mb' }), async (req, res) => {
    if (!userOf(req) || !Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).end();
    const id = crypto.randomUUID(), mime = String(req.headers['x-mime'] || 'application/octet-stream').slice(0, 100);
    try {
      if (media()) await media().insertOne({ _id: id, mime, data: req.body });
      else { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, id), req.body); fs.writeFileSync(path.join(DIR, id + '.mime'), mime); }
      res.json({ id });
    } catch (e) { res.status(500).end(); }
  });

  app.get('/media/:id', async (req, res) => {
    if (!userOf(req)) return res.status(401).end();
    const id = req.params.id.replace(/[^a-f0-9-]/g, '');
    let mime, data;
    try {
      if (media()) { const d = await media().findOne({ _id: id }); if (d) { mime = d.mime; data = d.data.buffer || d.data; } }
      else if (fs.existsSync(path.join(DIR, id))) { data = fs.readFileSync(path.join(DIR, id)); mime = fs.readFileSync(path.join(DIR, id + '.mime'), 'utf8'); }
    } catch (e) {}
    if (!data) return res.status(404).end();
    const safe = /^(image\/(png|jpe?g|gif|webp)|video\/|audio\/|application\/pdf)/.test(mime);
    res.set({ 'Content-Type': safe ? mime : 'application/octet-stream', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox', 'Cache-Control': 'private, max-age=86400' });
    if (!safe) res.set('Content-Disposition', 'attachment');
    res.send(Buffer.from(data));
  });

  io.on('connection', s => {
    const me = s.user;
    s.emit('statuses', live());

    s.on('sendMedia', ({ to, text, media: m }) => {
      if (!m || !db().users[to]) return;
      const msg = { id: crypto.randomUUID(), from: me, to, text: String(text || '').slice(0, 500), time: Date.now(),
        media: { id: String(m.id).replace(/[^a-f0-9-]/g, '').slice(0, 40), name: String(m.name || 'file').slice(0, 120),
          mime: String(m.mime || '').slice(0, 100), size: +m.size || 0, kind: m.kind === 'image' ? 'image' : 'file' },
        status: online[to] && online[to].size ? 'delivered' : 'sent' };
      db().msgs.push(msg); save();
      emitTo(to, 'msg', msg); emitTo(me, 'msg', msg);
    });

    s.on('postStatus', st => {
      if (!st) return;
      const x = { id: crypto.randomUUID(), user: me, time: Date.now(), kind: st.kind === 'image' ? 'image' : 'text',
        text: String(st.text || '').slice(0, 300), bg: /^#[0-9a-f]{6}$/i.test(st.bg) ? st.bg : '#075e54',
        mediaId: String(st.mediaId || '').replace(/[^a-f0-9-]/g, '').slice(0, 40) };
      live().push(x); save(); io.emit('statuses', live());
    });

    s.on('delStatus', id => {
      const d = db(); d.statuses = live().filter(x => !(x.id === id && x.user === me));
      save(); io.emit('statuses', live());
    });
  });
};
