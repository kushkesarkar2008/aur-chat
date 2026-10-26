/* AUR Instagram layer: home feed + stories, posts (like/comment), profile grid, search, create post. Loaded after manage.js */
var FEED = [], PD = null, view = { n: 'feed' }, PIC = {}, npBlob = null, igt = 0, pmId = null;
P.home = '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>';
ACC.push('#0095f6');
document.head.insertAdjacentHTML('beforeend', `<style>
#home{flex:1;overflow:auto;background:var(--bg);display:flex;justify-content:center}
.col{width:min(470px,100%);padding:18px 0 90px}.col .t{color:var(--sub);padding:16px;line-height:1.5}
.logo{font-weight:800;font-size:15px;letter-spacing:1px;background:linear-gradient(45deg,#feda75,#d62976,#4f5bd5);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:10px}
.stories{display:flex;gap:14px;overflow-x:auto;padding:6px 8px 10px}.st{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;cursor:pointer;width:68px;flex:none;color:var(--sub)}
.ring2{padding:3px;border-radius:50%;background:linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)}.ring2.no{background:var(--line)}.ring2 .av{width:58px;height:58px;border:3px solid var(--bg)}
.post{border-bottom:1px solid var(--line);margin-bottom:14px;padding-bottom:12px}.ph{display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer}.ph .tm{color:var(--sub);font-size:13px}.ph .dots{margin-left:auto;color:var(--sub)}
.pi{width:100%;display:block;max-height:640px;object-fit:cover;border-radius:6px;background:var(--panel)}
.pa{display:flex;gap:14px;padding:8px 8px 2px}.pa button{font-size:26px;line-height:1;transition:transform .15s}.pa button:active{transform:scale(1.4)}.pa .liked{color:#ff3040;animation:pop .35s}
.pl,.pc,.pv{padding:2px 8px;font-size:14px;line-height:1.4}.pv{color:var(--sub);cursor:pointer}.cx{color:var(--sub);cursor:pointer;font-style:normal;margin-left:6px;font-size:12px}
.cm{display:flex;padding:6px 8px;gap:8px}.cm input{flex:1;background:none;padding:6px 0}.cm button{color:var(--accent);font-weight:600}
.pf{display:flex;gap:36px;align-items:center;padding:20px 12px}.pn{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.pn button{padding:7px 16px;border-radius:8px;background:var(--field)}.pn .pri{background:var(--accent);color:#fff}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}.grid img{width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer;background:var(--panel)}
.sq{width:calc(100% - 24px);margin:0 12px 8px;padding:11px 16px;border-radius:10px;background:var(--panel)}
#np,#pm{position:fixed;inset:0;background:#000c;display:grid;place-items:center;z-index:18;animation:fade .2s}
.npc{background:var(--bg);border-radius:16px;padding:18px;width:min(420px,94%);display:flex;flex-direction:column;gap:12px}
.npc textarea{height:70px;border-radius:10px;background:var(--panel);padding:10px;resize:none}.npc .pp{border:2px dashed var(--line);border-radius:12px;padding:24px;text-align:center;cursor:pointer;color:var(--sub)}
.npc .row2{display:flex;gap:8px}.npc .row2 button{flex:1;padding:10px;border-radius:10px;background:var(--panel)}.npc .row2 .go2{background:var(--accent);color:#fff}
.pmc{background:var(--bg);border-radius:12px;width:min(520px,96vw);max-height:92vh;overflow:auto;padding:8px}
@media(max-width:700px){#rail{display:flex;position:fixed;bottom:0;left:0;right:0;width:100%;height:56px;flex-direction:row;justify-content:space-around;align-items:center;z-index:8;border-top:1px solid var(--line);border-right:0;padding:0}
#rail .sp,#rail .logo{display:none}#app{padding-bottom:56px}.open #rail{display:none}.open #app{padding-bottom:0}.pf{gap:18px}}
</style>`);

/* ---- structure ---- */
$('rail').innerHTML = `<div class="logo">AUR</div><button id="rh" class="on" title="Home" onclick="go('feed')">${ic('home')}</button><button id="rse" title="Search" onclick="go('search')">${ic('search')}</button>
<button id="rc" title="Messages" onclick="openMsgs()">${ic('chat')}<span id="rb" hidden></span></button><button id="rcr" title="Create post" onclick="newPost()">${ic('plus')}</button>
<button id="rs" hidden></button><span class="sp"></span><button title="Settings" onclick="tog(1)">${ic('gear')}</button><button id="rp" title="Profile" onclick="go('profile',me)"><span id="rav"></span></button>`;
$('app').insertAdjacentHTML('beforeend', '<div id="home" hidden></div>');
document.body.insertAdjacentHTML('beforeend', `<div id="np" hidden><div class="npc"><label class="pp" id="npp">Tap to choose a photo<input type="file" accept="image/*" hidden onchange="npPick(this)"></label>
<textarea id="npc" placeholder="Write a caption…"></textarea><div class="row2"><button onclick="$('np').hidden=true">Cancel</button><button class="go2" onclick="npShare()">Share</button></div></div></div>
<div id="pm" hidden onclick="if(event.target===this)closePm()"><div class="pmc" id="pmc"></div></div>`);

/* ---- navigation ---- */
const railSet = id => ['rh', 'rse', 'rc', 'rcr', 'rp'].forEach(x => $(x) && ($(x).className = x === id ? 'on' : ''));
function show(w) { $('home').hidden = w !== 'home'; $('side').hidden = w === 'home'; $('chat').hidden = w === 'home'; }
function go(n, u) {
  view = { n, u }; document.body.classList.remove('open'); show('home'); closePm();
  railSet(n === 'feed' ? 'rh' : n === 'search' ? 'rse' : u === me ? 'rp' : '');
  if (n === 'feed') sock.emit('getFeed'); if (n === 'profile') { PD = null; sock.emit('getProfile', u); }
  render();
}
function openMsgs() { show('chats'); tab('chats'); railSet('rc'); }
const _tab3 = tab; tab = function (t) { show('chats'); _tab3(t); };
const _oc3 = openChat; openChat = function (u) { show('chats'); railSet('rc'); _oc3(u); };
const _tg3 = tog; tog = function (o) { if (o) show('chats'); _tg3(o); };

/* ---- rendering ---- */
const timeAgo = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; };
const picOf = u => (users[u] || {}).pic || PIC[u] || '';
const findPost = id => FEED.find(p => p.id === id) || (PD && PD.posts && PD.posts.find(p => p.id === id));
function postHTML(p, full) {
  const cs = full ? p.comments : p.comments.slice(-2);
  return `<div class="post"><div class="ph" onclick="go('profile','${p.user}')">${avp({ username: p.user, pic: picOf(p.user) }, 's')}<b>${p.user}</b><span class="tm">· ${timeAgo(p.time)}</span>${p.user === me ? `<button class="dots" onclick="event.stopPropagation();delPost('${p.id}')">🗑</button>` : ''}</div>
  <img class="pi" src="${mUrl(p.mediaId)}" ondblclick="likeP('${p.id}')">
  <div class="pa"><button class="${p.liked ? 'liked' : ''}" onclick="likeP('${p.id}')">${p.liked ? '♥' : '♡'}</button><button onclick="openPost('${p.id}')">💬</button></div>
  <div class="pl"><b>${p.likes} like${p.likes === 1 ? '' : 's'}</b></div>${p.caption ? `<div class="pc"><b>${p.user}</b> ${esc(p.caption)}</div>` : ''}
  ${!full && p.comments.length > 2 ? `<div class="pv" onclick="openPost('${p.id}')">View all ${p.comments.length} comments</div>` : ''}
  ${cs.map(c => `<div class="pc"><b>${c.user}</b> ${esc(c.text)}${c.user === me || p.user === me ? `<i class="cx" onclick="delCmt('${p.id}','${c.id}')">✕</i>` : ''}</div>`).join('')}
  <div class="cm"><input placeholder="Add a comment…" onkeydown="if(event.key==='Enter')cmtP('${p.id}',this)"><button onclick="cmtP('${p.id}',this.previousElementSibling)">Post</button></div></div>`;
}
function storiesHTML() {
  const by = {}; STAT.forEach(s => (by[s.user] = by[s.user] || []).push(s));
  const mine = by[me] || [];
  return `<div class="stories"><div class="st" onclick="${mine.length ? `viewStatus('${me}')` : 'newStatus()'}"><div class="ring2 ${mine.length ? '' : 'no'}">${av(me, false)}</div><span>${mine.length ? 'Your story' : 'Add story'}</span></div>
  ${Object.keys(by).filter(u => u !== me).map(u => `<div class="st" onclick="viewStatus('${u}')"><div class="ring2">${av(u, false)}</div><span>${u.slice(0, 10)}</span></div>`).join('')}</div>`;
}
function profileHTML() {
  if (!PD) return '<p class="t">Loading…</p>';
  if (PD.missing) return '<p class="t">User not found.</p>';
  const c = PD.card; if (c.username !== view.u) return '<p class="t">Loading…</p>';
  PIC[c.username] = c.pic;
  return `<div class="pf">${avp(c, 'xl')}<div><div class="pn"><h2>${c.username}</h2>${c.username === me ? '<button onclick="tog(2)">Edit profile</button>'
    : `<button class="${c.iFollow ? '' : 'pri'}" onclick="pfol('${c.username}',${c.iFollow})">${c.iFollow ? 'Following' : 'Follow'}</button><button onclick="msgTo('${c.username}')">Message</button>`}</div>
    <div class="cnt"><span><b>${PD.posts.length}</b> posts</span><span><b>${c.followers}</b> followers</span><span><b>${c.following}</b> following</span></div><p style="margin-top:8px">${esc(c.about || '')}</p></div></div>
    <div class="grid">${PD.posts.map(p => `<img src="${mUrl(p.mediaId)}" onclick="openPost('${p.id}')">`).join('') || '<p class="t" style="grid-column:1/4;text-align:center;padding:40px">No posts yet</p>'}</div>`;
}
function render() {
  const h = $('home'), y = h.scrollTop;
  if (view.n === 'feed') h.innerHTML = `<div class="col">${storiesHTML()}${FEED.map(p => postHTML(p)).join('') || '<p class="t">Your feed is empty. Use Search to find people and follow them, or tap ＋ to share your first photo.</p>'}</div>`;
  else if (view.n === 'search') h.innerHTML = '<div class="col"><input class="sq" placeholder="Search by username" oninput="igSearch(this.value)"><div id="igr"><p class="t">Type a username to find people.</p></div></div>';
  else h.innerHTML = `<div class="col" style="width:min(780px,100%)">${profileHTML()}</div>`;
  h.scrollTop = y;
  if (pmId) openPost(pmId, true);
}
function igSearch(v) { clearTimeout(igt); if (!v.trim()) { $('igr').innerHTML = ''; return; } igt = setTimeout(() => sock.emit('search', v.trim()), 250); }
function renderSearch(r) {
  const el = $('igr'); if (!el) return;
  el.innerHTML = r.map(x => `<div class="row" onclick="go('profile','${x.username}')">${avp(x)}<div class="in"><div class="line"><b>${x.username}</b></div><div class="line"><span>${esc(x.about || '')} · ${x.followers} followers</span></div></div></div>`).join('') || '<p class="t">No users found.</p>';
}

/* ---- post actions ---- */
function openPost(id, quiet) { const p = findPost(id); if (!p) { closePm(); return; } pmId = id; $('pmc').innerHTML = postHTML(p, true); $('pm').hidden = false; }
function closePm() { pmId = null; $('pm').hidden = true; }
const likeP = id => sock.emit('likePost', id);
function cmtP(id, inp) { const t = inp.value.trim(); if (!t) return; sock.emit('commentPost', { id, text: t }); inp.value = ''; }
const delCmt = (id, cid) => sock.emit('delComment', { id, cid });
function delPost(id) { if (confirm('Delete this post?')) { closePm(); sock.emit('delPost', id); } }
const pfol = (u, on) => sock.emit(on ? 'punfollow' : 'pfollow', u);
function newPost() { npBlob = null; $('np').hidden = false; $('npc').value = ''; $('npp').firstChild.textContent = 'Tap to choose a photo'; }
async function npPick(inp) {
  const f = inp.files[0]; inp.value = ''; if (!f) return;
  npBlob = await shrink(f, 1080);
  $('npp').innerHTML = `<img src="${URL.createObjectURL(npBlob)}" style="max-width:100%;max-height:300px;border-radius:8px"><input type="file" accept="image/*" hidden onchange="npPick(this)">`;
}
async function npShare() {
  if (!npBlob) return alert('Choose a photo first');
  const id = await up(npBlob, 'image/jpeg');
  sock.emit('newPost', { mediaId: id, caption: $('npc').value.trim() }); $('np').hidden = true; go('feed');
}

/* ---- socket ---- */
function sx3() {
  sock.on('feed', f => { FEED = f; if (view.n === 'feed' || pmId) render(); });
  sock.on('profileData', d => { PD = d; if (view.n === 'profile' || pmId) render(); });
  sock.on('feedDirty', () => { sock.emit('getFeed'); if (view.n === 'profile') sock.emit('getProfile', view.u); });
  sock.on('profileDirty', u => { if (view.n === 'profile' && view.u === u) sock.emit('getProfile', u); sock.emit('getFeed'); });
  sock.on('searchResult', r => { r.forEach(x => (PIC[x.username] = x.pic)); if (view.n === 'search') renderSearch(r); });
  sock.on('statuses', () => { if (view.n === 'feed') render(); });
  sock.on('accountDeleted', () => logout());
  go('feed');
}
const _s4 = start; start = d => { _s4(d); sx3(); };
if (!S.v3) { S.v3 = 1; S.theme = 'amoled'; S.accent = '#0095f6'; save(); }
apply();
if (typeof sock !== 'undefined' && sock) sx3();
