/* AUR UI skin: icon rail, new header, filters, settings pages, doodle wallpaper. Loaded after extras.js */
const P = { chat: '<path d="M4 5h16v11H10l-5 4v-4H4z"/>', status: '<circle cx="12" cy="12" r="8" stroke-dasharray="3.2 2.6"/><circle cx="12" cy="12" r="2.6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>', dots: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', clip: '<path d="M20 11l-8 8a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 2.5 7 2.5 8 0M9 9.5h.01M15 9.5h.01"/>', send: '<path d="M3 11l18-8-8 18-2-7z"/>', back: '<path d="M15 5l-7 7 7 7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>', bell: '<path d="M6 17V11a6 6 0 0112 0v6l2 2H4z"/><path d="M10 21h4"/>',
  kb: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 115 0c0 2-2.5 2-2.5 4M12 17h.01"/>',
  out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>' };
const ic = (n, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const DOODLE = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' fill='none' stroke='gray' stroke-opacity='.2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='26' cy='28' r='9'/><path d='M82 14l7 14 15 2-11 10 3 15-14-8-14 8 3-15-11-10 15-2z'/><path d='M126 30q8-14 18 0t-18 20q-26-6-18-20t18 0z'/><rect x='20' y='96' width='30' height='22' rx='5'/><path d='M84 110h40M84 122h26M96 142q10-10 20 0'/><circle cx='138' cy='120' r='5'/></svg>`);
var setPage = null, DD = [], chatQ = '';

document.head.insertAdjacentHTML('beforeend', `<style>
:root[data-theme=dark]{--bg:#161717;--panel:#242626;--chatbg:#161717;--in:#242626;--out:#144d37;--line:#2a2c2c;--field:#2e2f2f;--sub:#8d9494}
#msgs[data-wall=doodle]{background-image:url("data:image/svg+xml,${DOODLE}");background-size:160px}
#rail{width:64px;background:var(--bg);border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:6px}
#rail button{width:44px;height:44px;border-radius:50%;color:var(--sub);display:grid;place-items:center;position:relative;transition:background .2s,color .2s}
#rail button:hover{background:var(--panel)}#rail button.on{background:var(--panel);color:var(--text)}#rail .sp{flex:1}
#rail .av{width:34px;height:34px;font-size:14px}#rb{position:absolute;top:-2px;right:-2px;background:var(--accent);color:#fff;border-radius:9px;font-size:11px;min-width:18px;height:18px;display:grid;place-items:center;font-weight:600}
#top{background:var(--bg);height:64px;padding:0 14px 0 18px}.ttl{font-size:24px;font-weight:700;color:var(--text)}
.hic{display:flex;gap:4px;align-items:center}.hic button{color:var(--sub);width:40px;height:40px;border-radius:50%;display:grid;place-items:center}.hic button:hover{background:var(--panel)}
.hic .nc{background:var(--accent);color:#fff;border-radius:14px}.hic .nc:hover{background:var(--accent);filter:brightness(1.1)}
#q{background:var(--panel) url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round'><circle cx='11' cy='11' r='6'/><path d='M16 16l4 4'/></svg>")}") 14px center no-repeat;padding:11px 14px 11px 42px;border-radius:24px;margin:4px 14px}
#chips{padding:8px 14px}.chips button{border:1px solid var(--line)}.chips button.on{background:#0e3b2e;color:var(--accent);border-color:transparent}
.av{width:54px;height:54px}.row{height:78px}#head{background:var(--bg);height:64px}#head .hic{margin-left:auto}
#form{margin:8px 14px 14px;border-radius:30px;background:var(--field);padding:6px 10px;gap:6px}#t{background:none;padding:10px 8px}
#form button{color:var(--sub);display:grid;place-items:center;width:40px;height:40px}#form button.send{background:var(--accent);color:#fff}
#cs{padding:8px 16px;background:var(--bg)}#csq{width:100%;padding:9px 14px;border-radius:20px;background:var(--panel)}
.enc{align-self:center;background:var(--panel);color:var(--sub);font-size:12.5px;padding:8px 14px;border-radius:10px;text-align:center;max-width:80%;margin:8px 0}
#dd{position:fixed;background:var(--panel);border-radius:12px;padding:6px;min-width:180px;box-shadow:0 10px 30px #000a;z-index:30;animation:fade .15s}
#dd button{display:block;width:100%;text-align:left;padding:10px 14px;border-radius:8px}#dd button:hover{background:var(--field)}
.si{display:flex;gap:18px;align-items:center;padding:14px 18px;cursor:pointer;border-radius:12px;transition:background .2s}.si:hover{background:var(--panel)}
.si b{display:block;font-weight:400;font-size:16px}.si small{color:var(--sub);font-size:13px}.si.red{color:#f15c6d}.si svg{color:var(--sub);flex:none}.si.red svg{color:#f15c6d}
.sm{display:flex;flex-direction:column;align-items:center;padding:10px 0 18px;gap:6px}.sm h3{font-weight:500}.sm small{color:var(--sub)}
.sc p.t{color:var(--sub);font-size:14px;line-height:1.6;margin:6px 0}.sc table{width:100%;border-collapse:collapse}.sc td{padding:10px 4px;border-bottom:1px solid var(--line);font-size:14px}.sc td:first-child{color:var(--accent);font-weight:600;width:110px}
#welcome{background:var(--panel);border-radius:28px;padding:10px 44px 28px;max-width:440px}
.wact{display:flex;gap:14px;justify-content:center;margin-top:26px;flex-wrap:wrap}.wact button{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text);font-size:12.5px;width:84px}
.wact button svg{background:var(--field);border-radius:50%;padding:14px;width:52px;height:52px;box-sizing:border-box;transition:transform .2s}.wact button:hover svg{transform:translateY(-3px) scale(1.06)}
#tabs{display:none}
@media(max-width:700px){#rail{display:none}#tabs{display:flex}}
</style>`);

/* ---- structure ---- */
$('app').insertAdjacentHTML('afterbegin', `<div id="rail"><button id="rc" class="on" title="Chats" onclick="tab('chats')">${ic('chat')}<span id="rb" hidden></span></button>
<button id="rs" title="Status" onclick="tab('status')">${ic('status')}</button><span class="sp"></span><button title="Settings" onclick="tog(1)">${ic('gear')}</button><button title="Profile" onclick="tog(2)"><span id="rav"></span></button></div>`);
$('top').innerHTML = `<span class="ttl">AUR</span><span class="hic"><button class="nc" title="New chat" onclick="newChat()">${ic('plus')}</button><button onclick="sideMenu(event)">${ic('dots')}</button></span><span id="me" hidden></span><span id="mav" hidden></span>`;
$('chips').insertAdjacentHTML('beforeend', '<button id="ff" onclick="setF(\'fav\')">Favourites</button>');
$('set').innerHTML = `<div class="sh2"><button id="sback">${ic('back')}</button><span id="sbt">Settings</span></div><div class="sc" id="sb"></div><span id="spic" hidden></span>`;
$('head').insertAdjacentHTML('beforeend', `<span class="hic"><button onclick="$('cs').hidden=!$('cs').hidden;if(!$('cs').hidden)$('csq').focus()">${ic('search')}</button><button onclick="chatMenu(event)">${ic('dots')}</button></span>`);
$('head').insertAdjacentHTML('afterend', '<div id="cs" hidden><input id="csq" placeholder="Search in this chat" oninput="chatQ=this.value.toLowerCase();applyCF()"></div>');
document.body.insertAdjacentHTML('beforeend', '<div id="dd" hidden></div>');
const fb = [...$('form').querySelectorAll('button')]; fb[0].innerHTML = ic('clip'); fb[1].innerHTML = ic('smile'); fb[2].innerHTML = ic('send', 20);
$('welcome').querySelector('h2').textContent = 'AUR for everyone';
$('welcome').querySelector('p').textContent = 'Send messages, photos and files to anyone on AUR. Pick a chat on the left to begin.';
$('welcome').insertAdjacentHTML('beforeend', `<div class="wact"><button onclick="newChat()">${ic('user', 24)}<span>Find people</span></button><button onclick="tab('status');newStatus()">${ic('status', 24)}<span>New status</span></button><button onclick="invite()">${ic('send', 24)}<span>Invite a friend</span></button><button onclick="tog(1)">${ic('gear', 24)}<span>Settings</span></button></div>`);

/* ---- menus & actions ---- */
function showMenu(e, items) {
  e.stopPropagation(); DD = items; const m = $('dd'), r = e.currentTarget.getBoundingClientRect();
  m.innerHTML = items.map((it, i) => `<button onclick="ddRun(${i})">${it[0]}</button>`).join('');
  m.style.top = r.bottom + 4 + 'px'; m.style.left = Math.max(8, Math.min(r.left - 120, innerWidth - 200)) + 'px'; m.hidden = false;
}
function ddRun(i) { $('dd').hidden = true; DD[i][1](); }
document.addEventListener('click', () => $('dd').hidden = true);
const isFav = u => (S.fav || []).includes(u);
function toggleFav(u) { S.fav = isFav(u) ? S.fav.filter(x => x !== u) : [...(S.fav || []), u]; save(); }
function sideMenu(e) { showMenu(e, [['New status', () => { tab('status'); newStatus(); }], ['Settings', () => tog(1)], ['Log out', logout]]); }
function chatMenu(e) { showMenu(e, [['Contact info', openInfo], [isFav(peer) ? 'Remove from favourites' : 'Add to favourites', () => toggleFav(peer)], ['Close chat', () => { $('box').hidden = true; $('welcome').hidden = false; closeChat(); }]]); }
function newChat() { tab('chats'); setF('all'); $('q').focus(); }
function invite() { const u = location.origin; (navigator.clipboard ? navigator.clipboard.writeText(u).then(() => alert('AUR link copied! Share it with friends.')) : Promise.reject()).catch(() => prompt('Share this link:', u)); }
function railAct(t) { $('rc').className = t === 'status' ? '' : 'on'; $('rs').className = t === 'status' ? 'on' : ''; }
const _tab = tab; tab = function (t) { _tab(t); tog(0); railAct(t); };
const _oc = openChat; openChat = function (u) { chatQ = ''; $('csq').value = ''; $('cs').hidden = true; _oc(u); };

/* ---- list with favourites + unread counts ---- */
setF = function (f) { filter = f; $('fa').className = f === 'all' ? 'on' : ''; $('fu').className = f === 'unread' ? 'on' : ''; $('ff').className = f === 'fav' ? 'on' : ''; renderList(); };
renderList = function () {
  const q = $('q').value.toLowerCase(); let total = 0;
  const rows = Object.keys(users).filter(u => u !== me && u.includes(q)).map(u => {
    const t = thread(u), n = t.filter(m => m.from === u && m.status !== 'read').length; total += n; return { u, l: t[t.length - 1], n };
  }).filter(r => filter === 'all' || (filter === 'unread' && r.n) || (filter === 'fav' && isFav(r.u)))
    .sort((a, b) => ((b.l && b.l.time) || 0) - ((a.l && a.l.time) || 0));
  $('list').innerHTML = rows.map(r => `<div class="row ${r.u === peer ? 'on' : ''}" onclick="openChat('${r.u}')">${av(r.u, users[r.u].online)}
    <div class="in"><div class="line"><b>${r.u}${isFav(r.u) ? ' ★' : ''}</b><small class="${r.n ? 'un' : ''}">${r.l ? listTime(r.l.time) : ''}</small></div>
    <div class="line"><span>${r.l && r.l.from === me ? tick(r.l) : ''}${r.l ? esc(r.l.text) : esc(users[r.u].about || 'Say hi 👋')}</span>${r.n ? `<em>${r.n}</em>` : ''}</div></div></div>`).join('')
    || `<p class="empty">${filter === 'unread' ? 'No unread chats' : filter === 'fav' ? 'No favourites yet. Open a chat, tap ⋮ and add one.' : 'No other users yet. Ask a friend to join AUR!'}</p>`;
  document.title = total ? `(${total}) AUR` : 'AUR';
  $('fu').textContent = 'Unread' + (total ? ' ' + total : ''); $('rb').hidden = !total; $('rb').textContent = total;
};

/* ---- chat search + banner ---- */
function applyCF() { document.querySelectorAll('#msgs .m').forEach(m => m.hidden = !!chatQ && !m.textContent.toLowerCase().includes(chatQ)); }
const _rm = renderMsgs;
renderMsgs = function () { _rm(); if (!peer) return; $('msgs').insertAdjacentHTML('afterbegin', `<div class="enc">Messages in this chat are stored on the AUR server. They are not end-to-end encrypted.</div>`); applyCF(); $('msgs').scrollTop = 1e9; };

/* ---- settings pages ---- */
const sc = (on, fn, l, st) => `<button class="${on ? 'on' : ''}" style="${st || ''}" onclick="${fn}">${l}</button>`;
const onoff = (k, l, def) => { const v = S[k] === undefined ? def : S[k]; return sc(v, `set('${k}',${v ? 0 : 1})`, l + ': ' + (v ? 'ON' : 'OFF')); };
const PAGES = {
  profile: { t: 'Profile', r: () => `<div class="sm"><label class="pp"><span id="ppic">${av(me, false, 'xl')}</span><input type="file" accept="image/*" hidden onchange="pic(this)">Tap to change photo</label><h3>${me}</h3></div>
    <h4>About</h4><input id="about" value="${esc(S.about || '')}" placeholder="Hey there! I am using AUR" maxlength="100" onchange="S.about=this.value;save();sendProfile()">` },
  account: { t: 'Account', r: () => `<p class="t">Username: <b>${me}</b></p><h4>Actions</h4><div class="chips">${sc(0, 'resetAll()', 'Reset all settings')}${sc(0, 'logout()', 'Log out')}</div>` },
  privacy: { t: 'Privacy', r: () => '<p class="t">Your messages, photos and files are stored on the AUR server so you can read them on any device. They are <b>not</b> end-to-end encrypted, so avoid sharing passwords or sensitive information.</p><p class="t">Statuses disappear after 24 hours and can be seen by everyone on AUR.</p>' },
  chats: { t: 'Chats', r: () => `<h4>Theme</h4><div class="chips">${['dark', 'light', 'amoled', 'neon'].map(t => sc(S.theme === t, `set('theme','${t}')`, t)).join('')}</div>
    <h4>Accent colour</h4><div class="chips" id="ac">${ACC.map(a => sc(S.accent === a, `set('accent','${a}')`, '', `background:${a}`)).join('')}</div>
    <h4>Chat wallpaper</h4><div class="chips">${['doodle', 'dots', 'gradient', 'plain'].map(w => sc(S.wall === w, `set('wall','${w}')`, w)).join('')}</div>
    <h4>Message text size</h4><input type="range" min="12" max="20" value="${S.fs}" oninput="S.fs=+this.value;save()">
    <h4>Bubbles &amp; density</h4><div class="chips">${sc(S.bubble !== 'sharp', "set('bubble','round')", 'Round')}${sc(S.bubble === 'sharp', "set('bubble','sharp')", 'Sharp')}${onoff('dense', 'Compact', 0)}</div>
    <h4>Effects</h4><div class="chips">${onoff('anim', 'Animations', 1)}${onoff('fx3d', '3D effects', 1)}</div>` },
  notif: { t: 'Notifications', r: () => `<h4>Alerts</h4><div class="chips">${onoff('sound', 'Message sound', 1)}${sc(S.notif, 'togN()', 'Desktop alerts: ' + (S.notif ? 'ON' : 'OFF'))}${onoff('preview', 'Message previews', 1)}</div>` },
  keys: { t: 'Keyboard shortcuts', r: () => '<table><tr><td>Ctrl + K</td><td>Search or start a new chat</td></tr><tr><td>Esc</td><td>Close popup, settings or chat</td></tr><tr><td>Enter</td><td>Send message</td></tr></table>' },
  help: { t: 'Help and feedback', r: () => '<p class="t"><b>AUR</b> is a real-time chat app: text, photos, files and 24-hour statuses.</p><p class="t">Tips: tap ⋮ in a chat to add a favourite, use the search icon to find messages, and open Settings to change theme, accent and wallpaper.</p>' }
};
const MENU = [['profile', 'user', 'Profile', 'Name, profile picture, about'], ['account', 'key', 'Account', 'Username, reset settings'], ['privacy', 'lock', 'Privacy', 'How your data is stored'],
  ['chats', 'chat', 'Chats', 'Theme, wallpaper, chat settings'], ['notif', 'bell', 'Notifications', 'Sound, alerts, previews'], ['keys', 'kb', 'Keyboard shortcuts', 'Quick actions'], ['help', 'help', 'Help and feedback', 'About AUR']];
function openSet(p) { setPage = p; renderSettings(); }
renderSettings = function () {
  $('sbt').textContent = setPage ? PAGES[setPage].t : 'Settings';
  $('sback').onclick = () => setPage ? openSet(null) : tog(0);
  $('sb').innerHTML = setPage ? PAGES[setPage].r()
    : `<div class="sm" onclick="openSet('profile')" style="cursor:pointer">${av(me, false, 'xl')}<h3>${me}</h3><small>${esc(S.about || 'Hey there! I am using AUR')}</small></div>`
    + MENU.map(m => `<div class="si" onclick="openSet('${m[0]}')">${ic(m[1])}<div><b>${m[2]}</b><small>${m[3]}</small></div></div>`).join('')
    + `<div class="si red" onclick="logout()">${ic('out')}<div><b>Log out</b></div></div>`;
};
tog = function (o) { $('set').classList.toggle('show', !!o); if (o) { setPage = o === 2 ? 'profile' : null; renderSettings(); } };
const _ap2 = apply;
apply = function () { _ap2(); if (typeof me !== 'undefined' && me) { $('rav').innerHTML = av(me, false, 's'); if ($('ppic')) $('ppic').innerHTML = av(me, false, 'xl'); } };

/* ---- keyboard ---- */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!$('sv').hidden) return closeSt();
    if (!$('ns').hidden) return void ($('ns').hidden = true);
    if (!$('modal').hidden) return void ($('modal').hidden = true);
    if ($('set').classList.contains('show')) return tog(0);
    if (peer && !$('box').hidden) { $('box').hidden = true; $('welcome').hidden = false; closeChat(); }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); tab('chats'); $('q').focus(); }
});
if (!S.v2) { S.v2 = 1; S.wall = 'doodle'; save(); } else apply();
if (typeof me !== 'undefined' && me) { renderList(); renderSettings(); }
