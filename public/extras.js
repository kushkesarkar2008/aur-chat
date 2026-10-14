/* AUR extras (client): photo + file sending, status updates, more settings. Loaded after index.html's main script. */
var STAT = [], sv = { list: [], i: 0, t: 0 }, nsBg = '#075e54';
const BG = ['#075e54', '#6a1b9a', '#1565c0', '#c62828', '#ef6c00', '#37474f'];
const tok = () => { try { return JSON.parse(localStorage.aur).token; } catch (e) { return ''; } };
const mUrl = id => `/media/${id}?t=${tok()}`;
const fmt = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

document.head.insertAdjacentHTML('beforeend', `<style>
#tabs{display:flex;background:var(--bg);border-bottom:1px solid var(--line)}
#tabs button{flex:1;padding:12px;color:var(--sub);font-weight:600;border-bottom:3px solid transparent;transition:all .25s}
#tabs button.on{color:var(--accent);border-color:var(--accent)}
#stat{flex:1;overflow:auto}.stl{padding:12px 16px;color:var(--sub);font-size:13px}
.ring{border-radius:50%;padding:3px;border:2.5px solid transparent}.ring.on{border-color:var(--accent)}.plus{color:var(--accent);font-size:22px}
#box{position:relative}
#am{position:absolute;left:14px;bottom:70px;background:var(--panel);border-radius:12px;padding:6px;display:flex;flex-direction:column;box-shadow:0 8px 24px #0006;animation:fade .2s;z-index:3}
#am button{padding:10px 16px;text-align:left;border-radius:8px}#am button:hover{background:var(--field)}
.mi{display:block;max-width:260px;max-height:300px;border-radius:6px;cursor:pointer;margin-bottom:4px}
.mf{display:flex;gap:10px;align-items:center;color:inherit;text-decoration:none;background:#0003;padding:8px 10px;border-radius:8px;min-width:200px}
.mf b{display:block;font-weight:500;word-break:break-all}.mf small{float:none;margin:0;display:block}
#sv{position:fixed;inset:0;background:#000;z-index:20;display:flex;flex-direction:column;animation:fade .2s}
.bars{display:flex;gap:4px;padding:10px 12px 0}.bars i{flex:1;height:3px;background:#fff4;border-radius:2px;overflow:hidden;position:relative}.bars i.done{background:#fff}
.bars i.run::after{content:'';position:absolute;inset:0;background:#fff;transform-origin:left;animation:bar 5s linear}@keyframes bar{from{transform:scaleX(0)}}
#sv .sh{display:flex;gap:10px;align-items:center;padding:10px 14px;color:#fff;justify-content:space-between}#sv .sh>div{flex:1}#sv small{display:block;color:#ccc;font-size:12px}
#sv button,#sv .dl{color:#fff;font-size:20px;padding:6px 10px;text-decoration:none}
.sbody{flex:1;display:grid;place-items:center;position:relative;overflow:hidden}.sbody img{max-width:100%;max-height:100%}
.sbody p{color:#fff;font-size:28px;text-align:center;padding:30px;white-space:pre-wrap}.sbody p.cap{position:absolute;bottom:0;font-size:16px;background:#0008;width:100%}
#ns{position:fixed;inset:0;background:#000b;z-index:15;display:grid;place-items:center}
.nsc{background:var(--bg);padding:16px;border-radius:16px;width:min(380px,92%);animation:flip .4s}
#nst{width:100%;height:150px;border-radius:12px;padding:14px;color:#fff;font-size:20px;resize:none;text-align:center}
#nsb{display:flex;gap:8px;margin:12px 0}#nsb button{width:30px;height:30px;border-radius:50%;border:3px solid transparent}#nsb button.on{border-color:#fff}
.nsa{display:flex;gap:8px}.nsa button{flex:1;padding:10px;border-radius:10px;background:var(--panel)}.nsa button:first-child{background:var(--accent);color:#fff}
.sharp .m{border-radius:3px!important}.dense .m{padding:3px 7px}.dense .row{height:60px}.nopv .row .line:nth-child(2) span{display:none}
#xs .ab{margin:20px 0;color:var(--sub);font-size:12px;text-align:center}
</style>`);

$('top').insertAdjacentHTML('afterend', `<div id="tabs"><button class="on" onclick="tab('chats')">Chats</button><button onclick="tab('status')">Status</button></div>`);
$('list').insertAdjacentHTML('afterend', '<div id="stat" hidden></div>');
$('form').insertAdjacentHTML('afterbegin', `<button type="button" onclick="$('am').hidden=!$('am').hidden">📎</button>`);
$('box').insertAdjacentHTML('beforeend', `<div id="am" hidden><button onclick="$('pi').click()">🖼 Photo</button><button onclick="$('di').click()">📄 Document</button></div>
<input type="file" id="pi" accept="image/*" hidden onchange="sendFile(this,'image')"><input type="file" id="di" hidden onchange="sendFile(this,'file')">`);
document.body.insertAdjacentHTML('beforeend', `<div id="sv" hidden></div><div id="ns" hidden><div class="nsc"><textarea id="nst" placeholder="Type a status"></textarea><div id="nsb"></div>
<div class="nsa"><button onclick="postText()">Post</button><button onclick="$('sp').click()">📷 Photo</button><button onclick="$('ns').hidden=true">Cancel</button></div>
<input type="file" id="sp" accept="image/*" hidden onchange="postPhoto(this)"></div></div>`);

/* ---- sending photos / files ---- */
function shrink(f, max = 1280) {
  return new Promise(r => { const im = new Image(); im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    c.toBlob(r, 'image/jpeg', .78); }; im.src = URL.createObjectURL(f); });
}
async function up(blob, mime) {
  const r = await fetch('/api/upload', { method: 'POST', headers: { 'x-token': tok(), 'x-mime': mime, 'Content-Type': 'application/octet-stream' }, body: blob });
  if (!r.ok) { alert('Upload failed'); throw 0; }
  return (await r.json()).id;
}
async function sendFile(inp, kind) {
  const f = inp.files[0]; inp.value = ''; $('am').hidden = true;
  if (!f || !peer) return;
  if (kind === 'file' && f.size > 5 * 1048576) return alert('File too large (max 5 MB)');
  let blob = f, mime = f.type || 'application/octet-stream';
  if (kind === 'image') { blob = await shrink(f); mime = 'image/jpeg'; }
  const id = await up(blob, mime);
  sock.emit('sendMedia', { to: peer, text: $('t').value.trim(), media: { id, name: f.name, mime, size: blob.size, kind } });
  $('t').value = '';
}
const _add = add;
add = m => { if (m.media && m.cap === undefined) { m.cap = m.text; m.text = (m.media.kind === 'image' ? '📷 ' : '📄 ') + (m.cap || m.media.name); } _add(m); };
const mbody = m => !m.media ? esc(m.text)
  : (m.media.kind === 'image'
    ? `<img class="mi" src="${mUrl(m.media.id)}" onload="this.closest('#msgs').scrollTop=1e9" onclick="lightbox('${m.media.id}')">`
    : `<a class="mf" href="${mUrl(m.media.id)}" download="${esc(m.media.name)}">📄<span><b>${esc(m.media.name)}</b><small>${fmt(m.media.size)}</small></span></a>`)
    + (m.cap ? `<div>${esc(m.cap)}</div>` : '');
renderMsgs = function () {
  if (!peer) return;
  let h = '', prevDay = null, prevFrom = '';
  thread(peer).forEach(m => {
    if (prevDay === null || !sameDay(prevDay, m.time)) { h += `<div class="day"><span>${dayLabel(m.time)}</span></div>`; prevFrom = ''; }
    prevDay = m.time;
    const first = m.from !== prevFrom; prevFrom = m.from;
    h += `<div class="m ${m.from === me ? 'out' : 'in'} ${first ? 'first' : ''} ${fresh.has(m.id) ? 'new' : ''}">${mbody(m)}<small>${T(m.time)}${m.from === me ? tick(m) : ''}</small></div>`;
  });
  fresh.clear();
  const el = $('msgs'); el.innerHTML = h; el.scrollTop = el.scrollHeight;
};
function lightbox(id) {
  const e = $('sv'); e.hidden = false;
  e.innerHTML = `<div class="sh"><span></span><span><a class="dl" href="${mUrl(id)}" download>⬇</a><button onclick="closeSt()">✕</button></span></div><div class="sbody" onclick="closeSt()"><img src="${mUrl(id)}"></div>`;
}

/* ---- status ---- */
function tab(t) {
  document.querySelectorAll('#tabs button').forEach((b, i) => b.className = i === (t === 'status' ? 1 : 0) ? 'on' : '');
  ['q', 'chips', 'list'].forEach(id => $(id).hidden = t === 'status');
  $('stat').hidden = t !== 'status'; if (t === 'status') renderStatusList();
}
const ringAv = (u, on) => `<div class="ring ${on ? 'on' : ''}">${av(u, false)}</div>`;
function renderStatusList() {
  const by = {}; STAT.forEach(s => (by[s.user] = by[s.user] || []).push(s));
  const mine = by[me] || [];
  let h = `<div class="row" onclick="${mine.length ? `viewStatus('${me}')` : 'newStatus()'}">${ringAv(me, mine.length)}<div class="in"><div class="line"><b>My status</b></div>
    <div class="line"><span>${mine.length ? mine.length + ' update(s) · tap to view' : 'Tap to add a status update'}</span><button class="plus" onclick="event.stopPropagation();newStatus()">＋</button></div></div></div><p class="stl">Recent updates</p>`;
  const others = Object.keys(by).filter(u => u !== me).sort((a, b) => by[b][by[b].length - 1].time - by[a][by[a].length - 1].time);
  h += others.map(u => `<div class="row" onclick="viewStatus('${u}')">${ringAv(u, 1)}<div class="in"><div class="line"><b>${u}</b></div><div class="line"><span>${listTime(by[u][by[u].length - 1].time)}</span></div></div></div>`).join('')
    || '<p class="empty">No updates from others yet</p>';
  $('stat').innerHTML = h;
}
function newStatus() { $('ns').hidden = false; $('nst').value = ''; renderNs(); }
function renderNs() {
  $('nsb').innerHTML = BG.map(c => `<button style="background:${c}" class="${c === nsBg ? 'on' : ''}" onclick="nsBg='${c}';renderNs()"></button>`).join('');
  $('nst').style.background = nsBg;
}
function postText() { const t = $('nst').value.trim(); if (!t) return; sock.emit('postStatus', { kind: 'text', text: t, bg: nsBg }); $('ns').hidden = true; }
async function postPhoto(inp) {
  const f = inp.files[0]; inp.value = ''; if (!f) return;
  const id = await up(await shrink(f), 'image/jpeg');
  sock.emit('postStatus', { kind: 'image', mediaId: id, text: $('nst').value.trim() }); $('ns').hidden = true;
}
function viewStatus(u) { sv.list = STAT.filter(s => s.user === u).sort((a, b) => a.time - b.time); sv.i = 0; if (sv.list.length) showSt(); }
function showSt() {
  clearTimeout(sv.t); const s = sv.list[sv.i], e = $('sv'); e.hidden = false;
  e.innerHTML = `<div class="bars">${sv.list.map((_, k) => `<i class="${k < sv.i ? 'done' : k === sv.i ? 'run' : ''}"></i>`).join('')}</div>
  <div class="sh">${av(s.user, false, 's')}<div><b>${s.user}</b><small>${listTime(s.time)}</small></div><span>${s.user === me ? `<button onclick="delSt('${s.id}')">🗑</button>` : ''}<button onclick="closeSt()">✕</button></span></div>
  <div class="sbody" style="background:${s.kind === 'text' ? s.bg : '#000'}" onclick="stTap(event)">${s.kind === 'text' ? `<p>${esc(s.text)}</p>` : `<img src="${mUrl(s.mediaId)}">${s.text ? `<p class="cap">${esc(s.text)}</p>` : ''}`}</div>`;
  sv.t = setTimeout(() => stNext(1), 5000);
}
function stNext(d) { sv.i += d; if (sv.i < 0) sv.i = 0; if (sv.i >= sv.list.length) return closeSt(); showSt(); }
function stTap(e) { stNext(e.clientX < innerWidth / 3 ? -1 : 1); }
function closeSt() { clearTimeout(sv.t); $('sv').hidden = true; $('sv').innerHTML = ''; }
function delSt(id) { sock.emit('delStatus', id); closeSt(); }

/* ---- more settings ---- */
const _rs = renderSettings;
renderSettings = function () {
  _rs();
  let x = $('xs'); if (!x) { document.querySelector('#set .sc').insertAdjacentHTML('beforeend', '<div id="xs"></div>'); x = $('xs'); }
  const c = (on, fn, l) => `<button class="${on ? 'on' : ''}" onclick="${fn}">${l}</button>`, pv = S.preview !== 0;
  x.innerHTML = `<h4>Chats</h4><div class="chips">${c(S.bubble !== 'sharp', "set('bubble','round')", 'Round bubbles')}${c(S.bubble === 'sharp', "set('bubble','sharp')", 'Sharp bubbles')}
    ${c(S.dense, `set('dense',${S.dense ? 0 : 1})`, 'Compact: ' + (S.dense ? 'ON' : 'OFF'))}${c(pv, `set('preview',${pv ? 0 : 1})`, 'Message previews: ' + (pv ? 'ON' : 'OFF'))}</div>
    <h4>Notifications</h4><div class="chips">${c(S.notif, 'togN()', 'Desktop alerts: ' + (S.notif ? 'ON' : 'OFF'))}</div>
    <h4>Account</h4><div class="chips">${c(0, 'resetAll()', 'Reset all settings')}${c(0, 'logout()', 'Log out')}</div><p class="ab">AUR · Node.js, Socket.IO &amp; MongoDB</p>`;
};
const _ap = apply;
apply = function () { _ap(); const b = document.body.classList; b.toggle('sharp', S.bubble === 'sharp'); b.toggle('dense', !!S.dense); b.toggle('nopv', S.preview === 0); };
function togN() { if (!S.notif && window.Notification) Notification.requestPermission(); set('notif', S.notif ? 0 : 1); }
function resetAll() { S = { ...DEF }; save(); renderSettings(); }
apply();

/* ---- hook into the socket ---- */
function ex() {
  sock.on('statuses', s => { STAT = s; if (!$('stat').hidden) renderStatusList(); });
  sock.on('msg', m => { if (m.from !== me && document.hidden && S.notif && window.Notification && Notification.permission === 'granted') new Notification('AUR · ' + m.from, { body: m.text }); });
}
const _st = start;
start = d => { _st(d); ex(); };
if (typeof sock !== 'undefined' && sock) ex();
