// AUR extras (server): media upload/download, image+file messages, 24h statuses
const crypto = require('crypto'), fs = require('fs'), path = require('path'), express = require('express');
const DIR = 'uploads'; // used only when MongoDB is not configured (local testing)

module.exports = ({ app, io, db, save, online, emitTo, pub, contactsOf, canChat, media }) => {
  const userOf = req => db().tokens[req.headers['x-token'] || req.query.t];
  const live = () => { const d = db(); d.statuses = (d.statuses || []).filter(x => Date.now() - x.time < 864e5); return d.statuses; };

  const dropMedia = async id => {
    try { if (media()) await media().deleteOne({ _id: id }); else { fs.unlinkSync(path.join(DIR, id)); fs.unlinkSync(path.join(DIR, id + '.mime')); } } catch (e) {}
  };
  const purge = d => { d.msgs = d.msgs.filter(x => !(x.hide && x.hide.includes(x.from) && x.hide.includes(x.to))); };
  const statusesFor = u => { const c = new Set(contactsOf(u)); return live().filter(x => c.has(x.user)); };
  const sendStatuses = u => emitTo(u, 'statuses', statusesFor(u));
  const sendAll = () => Object.keys(online).forEach(sendStatuses);
  const fw = u => { const d = db(); return { following: d.users[u].following || [], followers: Object.keys(d.users).filter(x => (d.users[x].following || []).includes(u)) }; };
  const card = (u, me) => { const x = db().users[u], f = fw(u);
    return { username: u, pic: x.pic || '', about: x.about || '', followers: f.followers.length, following: f.following.length, iFollow: f.followers.includes(me), followsMe: f.following.includes(me) }; };

  // ---- notifications + suggestions ----
  const notify = (to, n) => { const u = db().users[to]; if (!u || to === n.from) return;
    u.notifs = [...(u.notifs || []), { id: crypto.randomUUID(), time: Date.now(), ...n }].slice(-60); emitTo(to, 'notifs', u.notifs); };
  const suggestFor = me => { const d = db(), mine = d.users[me].following || [];
    return Object.keys(d.users).filter(u => u !== me && !mine.includes(u)).map(u => { const f = fw(u).followers; return { u, mutual: mine.filter(x => f.includes(x)).length }; })
      .sort((a, b) => b.mutual - a.mutual || Math.random() - .5).slice(0, 8).map(x => ({ ...card(x.u, me), mutual: x.mutual })); };

  // ---- posts (Instagram-style) ----
  const pview = (p, me) => ({ id: p.id, user: p.user, mediaId: p.mediaId, caption: p.caption, time: p.time, likes: p.likes.length, liked: p.likes.includes(me), comments: p.comments.slice(-80) });
  const postsOf = (u, me) => (db().posts || []).filter(p => p.user === u).sort((a, b) => b.time - a.time).slice(0, 60).map(p => pview(p, me));
  const feedFor = me => { const d = db(), f = new Set([me, ...(d.users[me].following || [])]);
    return (d.posts || []).filter(p => f.has(p.user)).sort((a, b) => b.time - a.time).slice(0, 50).map(p => pview(p, me)); };
  const dirty = (owner, actor) => new Set([...contactsOf(owner), actor]).forEach(u => emitTo(u, 'feedDirty', { owner }));
  const postById = id => (db().posts || []).find(x => x.id === id);

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
    s.emit('statuses', statusesFor(me));
    s.emit('follows', fw(me));
    s.emit('notifs', db().users[me].notifs || []);

    s.on('sendMedia', ({ to, text, media: m }) => {
      if (!m || !db().users[to] || !canChat(me, to)) return;
      const msg = { id: crypto.randomUUID(), from: me, to, text: String(text || '').slice(0, 500), time: Date.now(),
        media: { id: String(m.id).replace(/[^a-f0-9-]/g, '').slice(0, 40), name: String(m.name || 'file').slice(0, 120),
          mime: String(m.mime || '').slice(0, 100), size: +m.size || 0, kind: m.kind === 'image' ? 'image' : 'file' },
        status: online[to] && online[to].size ? 'delivered' : 'sent' };
      db().msgs.push(msg); save();
      emitTo(to, 'msg', msg); emitTo(me, 'msg', msg);
    });

    s.on('delMsg', ({ id, all }) => {
      const d = db(), m = d.msgs.find(x => x.id === id);
      if (!m || (m.from !== me && m.to !== me)) return;
      if (all) {
        if (m.from !== me) return;
        const mid = m.media && m.media.id;
        m.deleted = true; m.text = ''; delete m.media; save();
        if (mid) dropMedia(mid);
        emitTo(m.from, 'msgDeleted', { id }); emitTo(m.to, 'msgDeleted', { id });
      } else {
        m.hide = [...new Set([...(m.hide || []), me])]; purge(d); save();
        emitTo(me, 'msgGone', { ids: [id] });
      }
    });

    s.on('clearChat', peer => {
      const d = db(), ids = [];
      d.msgs.forEach(m => {
        if (((m.from === me && m.to === peer) || (m.from === peer && m.to === me)) && !(m.hide || []).includes(me)) { m.hide = [...(m.hide || []), me]; ids.push(m.id); }
      });
      purge(d); save(); emitTo(me, 'msgGone', { ids });
    });

    s.on('delAccount', () => {
      const d = db(), c = contactsOf(me), sockets = [...(online[me] || [])];
      d.msgs.filter(m => m.from === me && m.media).forEach(m => dropMedia(m.media.id));
      delete d.users[me];
      Object.keys(d.tokens).forEach(t => { if (d.tokens[t] === me) delete d.tokens[t]; });
      d.msgs = d.msgs.filter(m => m.from !== me && m.to !== me);
      (d.posts || []).filter(p => p.user === me).forEach(p => dropMedia(p.mediaId));
      d.posts = (d.posts || []).filter(p => p.user !== me);
      d.posts.forEach(p => { p.likes = p.likes.filter(x => x !== me); p.comments = p.comments.filter(c => c.user !== me); });
      d.statuses = (d.statuses || []).filter(x => x.user !== me);
      (d.posts || []).filter(p => p.user === me).forEach(p => dropMedia(p.mediaId));
      d.posts = (d.posts || []).filter(p => p.user !== me);
      d.posts.forEach(p => { p.likes = p.likes.filter(x => x !== me); p.comments = p.comments.filter(c => c.user !== me); });
      Object.keys(d.users).forEach(u => { if (d.users[u].following) d.users[u].following = d.users[u].following.filter(x => x !== me); });
      save();
      c.forEach(u => { if (u !== me) { emitTo(u, 'userGone', { username: me }); sendStatuses(u); } });
      sockets.forEach(x => { x.emit('accountDeleted', {}); x.disconnect(true); });
    });

    const posts = () => { const d = db(); return d.posts = d.posts || []; };
    const find = id => posts().find(x => x.id === id);
    s.on('getPosts', ({ scope, user }) => {
      const f = db().users[me].following || [];
      let list = posts();
      if (scope === 'feed') list = list.filter(p => p.user === me || f.includes(p.user));
      else if (scope === 'user') list = list.filter(p => p.user === String(user));
      s.emit('posts', { scope, user: scope === 'user' ? String(user) : '', list: list.slice().sort((a, b) => b.time - a.time).slice(0, 60) });
    });
    s.on('getProfile', u => { if (db().users[u]) s.emit('profileData', { ...card(u, me), posts: posts().filter(p => p.user === u).length }); });
    s.on('newPost', ({ mediaId, caption }) => {
      mediaId = String(mediaId || '').replace(/[^a-f0-9-]/g, '').slice(0, 40); if (!mediaId) return;
      posts().push({ id: crypto.randomUUID(), user: me, mediaId, caption: String(caption || '').slice(0, 500), time: Date.now(), likes: [], comments: [] });
      save(); io.emit('postsChanged');
    });
    s.on('likePost', id => { const p = find(id); if (!p) return; const i = p.likes.indexOf(me); if (i < 0) { p.likes.push(me); notify(p.user, { type: 'like', from: me, postId: p.id }); } else p.likes.splice(i, 1); save(); io.emit('postUpdate', p); });
    s.on('commentPost', ({ id, text }) => {
      const p = find(id); text = String(text || '').trim().slice(0, 300); if (!p || !text) return;
      p.comments.push({ id: crypto.randomUUID(), user: me, text, time: Date.now() }); notify(p.user, { type: 'comment', from: me, postId: p.id, text: text.slice(0, 80) }); save(); io.emit('postUpdate', p);
    });
    s.on('delComment', ({ id, cid }) => {
      const p = find(id), c = p && p.comments.find(x => x.id === cid);
      if (!c || (c.user !== me && p.user !== me)) return;
      p.comments = p.comments.filter(x => x.id !== cid); save(); io.emit('postUpdate', p);
    });
    s.on('delPost', id => {
      const p = find(id); if (!p || p.user !== me) return;
      db().posts = posts().filter(x => x.id !== id); dropMedia(p.mediaId); save(); io.emit('postDeleted', { id });
    });

    s.on('getExplore', () => s.emit('explore', (db().posts || []).slice().sort((a, b) => b.time - a.time).slice(0, 60).map(p => pview(p, me))));
    s.on('getSuggest', () => s.emit('suggest', suggestFor(me)));
    s.on('getFeed', () => s.emit('feed', feedFor(me)));
    s.on('getProfile', u => {
      if (!db().users[u]) return s.emit('profileData', { missing: u });
      s.emit('profileData', { card: card(u, me), posts: postsOf(u, me) });
    });
    s.on('newPost', ({ mediaId, caption }) => {
      const d = db(), mid = String(mediaId || '').replace(/[^a-f0-9-]/g, '').slice(0, 40); if (!mid) return;
      d.posts = d.posts || [];
      d.posts.push({ id: crypto.randomUUID(), user: me, mediaId: mid, caption: String(caption || '').slice(0, 500), time: Date.now(), likes: [], comments: [] });
      save(); dirty(me, me);
    });
    s.on('likePost', id => {
      const p = postById(id); if (!p) return;
      const i = p.likes.indexOf(me); if (i < 0) p.likes.push(me); else p.likes.splice(i, 1);
      save(); dirty(p.user, me);
    });
    s.on('commentPost', ({ id, text }) => {
      const p = postById(id); text = String(text || '').trim().slice(0, 300); if (!p || !text) return;
      p.comments.push({ id: crypto.randomUUID(), user: me, text, time: Date.now() }); save(); dirty(p.user, me);
    });
    s.on('delComment', ({ id, cid }) => {
      const p = postById(id); const c = p && p.comments.find(x => x.id === cid);
      if (!c || (c.user !== me && p.user !== me)) return;
      p.comments = p.comments.filter(x => x.id !== cid); save(); dirty(p.user, me);
    });
    s.on('delPost', id => {
      const d = db(), p = postById(id); if (!p || p.user !== me) return;
      d.posts = d.posts.filter(x => x !== p); dropMedia(p.mediaId); save(); dirty(me, me);
    });

    s.on('search', q => {
      q = String(q || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
      if (!q) return s.emit('searchResult', []);
      s.emit('searchResult', Object.keys(db().users).filter(u => u !== me && u.includes(q))
        .sort((a, b) => (b.startsWith(q) - a.startsWith(q)) || a.length - b.length).slice(0, 20).map(u => card(u, me)));
    });
    s.on('whois', u => { if (db().users[u]) s.emit('whoisResult', card(u, me)); });
    const follow = (u, on, quiet) => {
      const d = db(); if (u === me || !d.users[u]) return;
      const l = d.users[me].following = d.users[me].following || [], i = l.indexOf(u);
      if (on && i < 0) { l.push(u); notify(u, { type: 'follow', from: me }); }
      if (!on && i >= 0) l.splice(i, 1);
      save();
      emitTo(me, 'follows', fw(me)); emitTo(u, 'follows', fw(u));
      emitTo(me, 'presence', pub(u)); emitTo(u, 'presence', pub(me));
      sendStatuses(me); sendStatuses(u);
      if (quiet) s.emit('profileDirty', u); else s.emit('whoisResult', card(u, me));
    };
    s.on('follow', u => follow(String(u), true));
    s.on('unfollow', u => follow(String(u), false));
    s.on('pfollow', u => follow(String(u), true, true));
    s.on('punfollow', u => follow(String(u), false, true));

    s.on('postStatus', st => {
      if (!st) return;
      const x = { id: crypto.randomUUID(), user: me, time: Date.now(), kind: st.kind === 'image' ? 'image' : 'text',
        text: String(st.text || '').slice(0, 300), bg: /^#[0-9a-f]{6}$/i.test(st.bg) ? st.bg : '#075e54',
        mediaId: String(st.mediaId || '').replace(/[^a-f0-9-]/g, '').slice(0, 40) };
      live().push(x); save(); sendAll();
    });

    s.on('delStatus', id => {
      const d = db(); d.statuses = live().filter(x => !(x.id === id && x.user === me));
      save(); sendAll();
    });
  });
};
