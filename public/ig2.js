/* AUR Instagram look v2: suggestions sidebar, notifications, saved posts, Primary/General/Requests inbox, messages pill. Loaded after insta.js */
var NOTIFS = [], SUG = [], SEEN = {}, SAVED = JSON.parse(localStorage.aurSaved || '[]'), dmTab = 'primary';
Object.assign(P, { heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>', comment: '<path d="M4 12a8 8 0 1114 5l2 3-5-1.3A8 8 0 014 12z"/>',
  mark: '<path d="M6 4h12v16l-6-4-6 4z"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>' });
const icf = (n, s, f) => ic(n, s).replace('fill="none"', `fill="${f}"`);
document.head.insertAdjacentHTML('beforeend', `<style>
.fh{display:flex;flex-direction:column;align-items:center;width:100%}.stl2{width:min(470px,100%)}.hwrap{display:flex;gap:70px;justify-content:center;width:100%}
.sug{width:320px;padding:6px 0 20px;display:none}@media(min-width:1100px){.sug{display:block}}.sh3{padding:4px 0 10px;color:var(--sub)}
.sg{display:flex;justify-content:space-between;align-items:center;padding:6px 0}.sgl{display:flex;gap:12px;align-items:center;cursor:pointer}.sgl small{display:block;color:var(--sub);font-size:12px}.sg button{color:var(--accent);font-weight:600;font-size:13px}
.pa button{display:flex;align-items:center;gap:6px;font-size:14px}.pa .sv{margin-left:auto}.pa .liked{color:#ff3040}
.cap{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}.cap.open{display:block}
#rail button svg{stroke-width:2}#rnd{position:absolute;top:9px;right:9px;width:9px;height:9px;border-radius:50%;background:#ff3040}
#chips{display:none!important}#dmtabs{display:flex;border-bottom:1px solid var(--line)}#dmtabs button{flex:1;padding:12px;color:var(--sub);font-weight:600;border-bottom:2px solid transparent}
#dmtabs button.on{color:var(--text);border-color:var(--text)}#rqn{color:var(--accent);font-style:normal}
.ttl{font-size:20px!important}.hic .nc{background:none!important;color:var(--text)!important}
.line em{font-size:0;min-width:10px;width:10px;height:10px;padding:0;background:#4f5bd5;border-radius:50%}
#welcome{background:none!important;padding:0!important;max-width:none!important;color:var(--sub)}#welcome h2{font-size:22px;font-weight:400;color:var(--text);margin-bottom:6px}
.wi{width:96px;height:96px;border:2px solid var(--text);border-radius:50%;display:grid;place-items:center;margin:0 auto 16px;color:var(--text)}
.wbn{background:var(--accent);color:#fff;padding:9px 18px;border-radius:10px;font-weight:600;margin-top:14px}
#mpill{position:fixed;right:22px;bottom:18px;background:var(--panel);border-radius:30px;padding:10px 16px;display:flex;gap:10px;align-items:center;cursor:pointer;z-index:7;box-shadow:0 6px 20px #0008;font-weight:600}
#mpill .av{width:24px;height:24px;font-size:11px;margin-left:-8px;border:2px solid var(--panel)}#mpill b{background:#ff3040;color:#fff;border-radius:10px;font-size:11px;padding:1px 6px}
@media(max-width:700px){#mpill{display:none}}
</style>`);

/* ---- structure ---- */
$('rail').innerHTML = `<div class="logo">AUR</div><button id="rh" title="Home" onclick="go('feed')">${ic('home')}</button>
<button id="rc" title="Messages" onclick="openMsgs()">${ic('send')}<span id="rb" hidden></span></button><button id="rse" title="Search" onclick="go('search')">${ic('search')}</button>
<button id="rn" title="Notifications" onclick="go('notifs')">${ic('heart')}<i id="rnd" hidden></i></button><button id="rcr" title="Create post" onclick="newPost()">${ic('plus')}</button>
<button id="rs" hidden></button><button id="rp" title="Profile" onclick="go('profile',me)"><span id="rav"></span></button><span class="sp"></span><button title="Settings" onclick="tog(1)">${ic('menu')}</button>`;
$('q').insertAdjacentHTML('beforebegin', `<div id="dmtabs"><button class="on" onclick="setDm('primary')">Primary</button><button onclick="setDm('general')">General</button><button onclick="setDm('requests')">Requests<i id="rqn"></i></button></div>`);
$('welcome').innerHTML = `<div class="wi">${ic('send', 46)}</div><h2>Your messages</h2><p>Send a message to start a chat.</p><button class="wbn" onclick="newChat()">Send message</button>`;
document.body.insertAdjacentHTML('beforeend', '<div id="mpill" onclick="openMsgs()"></div>');

/* ---- navigation ---- */
const _go2 = go;
go = function (n, u) { _go2(n, u); $('rn').className = n === 'notifs' ? 'on' : ''; if (n === 'feed') sock.emit('getSuggest'); };
const _show = show;
show = function (w) { _show(w); $('mpill').hidden = w !== 'home'; };
const _render = render;
render = function () {
  if (view.n === 'feed') return renderFeed();
  if (view.n === 'notifs') return renderNotifs();
  if (view.n === 'saved') return renderSaved();
  _render();
};

/* ---- feed ---- */
const sugHTML = () => '<p class="sh3"><b>Suggested for you</b></p>' + (SUG.map(x => `<div class="sg"><div class="sgl" onclick="go('profile','${x.username}')">${avp(x, 's')}<div><b>${x.username}</b><small>${x.mutual ? x.mutual + ' mutual' : 'New on AUR'}</small></div></div><button onclick="sugFol('${x.username}')">Follow</button></div>`).join('') || '<p class="t">No suggestions right now.</p>');
function sugFol(u) { sock.emit('pfollow', u); SUG = SUG.filter(x => x.username !== u); render(); setTimeout(() => sock.emit('getSuggest'), 500); }
function renderFeed() {
  const h = $('home'), y = h.scrollTop;
  h.innerHTML = `<div class="fh"><div class="stl2">${storiesHTML()}</div><div class="hwrap"><div class="col">${FEED.map(p => postHTML(p)).join('') || '<p class="t">Your feed is empty. Follow people from the suggestions or Search, or tap ＋ to share your first photo.</p>'}</div><aside class="sug">${sugHTML()}</aside></div></div>`;
  h.scrollTop = y; if (pmId) openPost(pmId, true);
}
postHTML = function (p, full) {
  const saved = SAVED.includes(p.id), cs = full ? p.comments : [];
  return `<div class="post"><div class="ph" onclick="go('profile','${p.user}')">${avp({ username: p.user, pic: picOf(p.user) }, 's')}<b>${p.user}</b><span class="tm">• ${timeAgo(p.time)}</span><button class="dots" onclick="event.stopPropagation();postMenu(event,'${p.id}')">${ic('dots')}</button></div>
  <img class="pi" src="${mUrl(p.mediaId)}" ondblclick="likeP('${p.id}')">
  <div class="pa"><button class="${p.liked ? 'liked' : ''}" onclick="likeP('${p.id}')">${icf('heart', 24, p.liked ? '#ff3040' : 'none')}<span>${p.likes || ''}</span></button>
  <button onclick="openPost('${p.id}')">${ic('comment', 24)}<span>${p.comments.length || ''}</span></button><button onclick="invite()">${ic('send', 24)}</button>
  <button class="sv" onclick="savePost('${p.id}')">${icf('mark', 24, saved ? 'currentColor' : 'none')}</button></div>
  ${p.caption ? `<div class="pc cap" onclick="this.classList.toggle('open')"><b>${p.user}</b> ${esc(p.caption)}</div>` : ''}
  ${!full && p.comments.length ? `<div class="pv" onclick="openPost('${p.id}')">View all ${p.comments.length} comments</div>` : ''}
  ${cs.map(c => `<div class="pc"><b>${c.user}</b> ${esc(c.text)}${c.user === me || p.user === me ? `<i class="cx" onclick="delCmt('${p.id}','${c.id}')">✕</i>` : ''}</div>`).join('')}
  <div class="cm"><input placeholder="Add a comment…" onkeydown="if(event.key==='Enter')cmtP('${p.id}',this)"><button onclick="cmtP('${p.id}',this.previousElementSibling)">Post</button></div></div>`;
};
function postMenu(e, id) {
  const p = findPost(id); if (!p) return; const it = [];
  if (p.user === me) it.push(['Delete post', () => delPost(id)]);
  else it.push([FW.following.includes(p.user) ? 'Unfollow @' + p.user : 'Follow @' + p.user, () => pfol(p.user, FW.following.includes(p.user))]);
  it.push(['Go to profile', () => go('profile', p.user)], ['Copy AUR link', invite]); showMenu(e, it);
}
function savePost(id) {
  SAVED = SAVED.includes(id) ? SAVED.filter(x => x !== id) : [...SAVED, id]; localStorage.aurSaved = JSON.stringify(SAVED); render();
}
function renderSaved() {
  const ps = SAVED.map(id => SEEN[id]).filter(Boolean); PD = { posts: ps, card: { username: '_saved' } };
  $('home').innerHTML = `<div class="col" style="width:min(780px,100%)"><h3 style="padding:10px 14px">Saved</h3><div class="grid">${ps.map(p => `<img src="${mUrl(p.mediaId)}" onclick="openPost('${p.id}')">`).join('') || '<p class="t" style="grid-column:1/4">Nothing saved yet. Tap the bookmark on a post.</p>'}</div></div>`;
  if (pmId) openPost(pmId, true);
}
const _ph = profileHTML;
profileHTML = function () {
  let h = _ph();
  if (PD && PD.card && PD.card.username === me && view.u === me) h = h.replace('<div class="grid">', `<div class="pn" style="padding:0 12px 12px"><button onclick="go('saved')">Saved (${SAVED.length})</button></div><div class="grid">`);
  return h;
};

/* ---- notifications ---- */
const updateDot = () => { $('rnd').hidden = !NOTIFS.some(n => n.time > (+localStorage.aurNs || 0)); };
function renderNotifs() {
  localStorage.aurNs = Date.now(); $('rnd').hidden = true;
  const txt = n => n.type === 'like' ? 'liked your post.' : n.type === 'comment' ? 'commented: ' + esc(n.text || '') : 'started following you.';
  $('home').innerHTML = `<div class="col" style="width:min(560px,100%)"><h3 style="padding:8px 14px">Notifications</h3>${[...NOTIFS].reverse().map(n => `<div class="row" onclick="${n.type === 'follow' ? `go('profile','${n.from}')` : `openPost('${n.postId}')`}">${avp({ username: n.from, pic: picOf(n.from) })}
    <div class="in"><div class="line"><span style="white-space:normal;color:var(--text)"><b>${n.from}</b> ${txt(n)} <small>${timeAgo(n.time)}</small></span></div></div></div>`).join('') || '<p class="t">No notifications yet.</p>'}</div>`;
}

/* ---- inbox tabs + pill ---- */
const tabOf = u => {
  if (FW.following.includes(u)) return 'primary';
  const t = thread(u); return t.some(m => m.from === u) && !t.some(m => m.from === me) ? 'requests' : 'general';
};
function setDm(t) { dmTab = t; document.querySelectorAll('#dmtabs button').forEach((b, i) => b.className = ['primary', 'general', 'requests'][i] === t ? 'on' : ''); renderList(); }
function applyTab() {
  const q = $('q').value.trim(); let vis = 0;
  $('list').querySelectorAll('.row').forEach(r => {
    const m = /openChat\('([^']+)'\)/.exec(r.getAttribute('onclick') || ''); if (!m) return;
    r.hidden = !q && tabOf(m[1]) !== dmTab; if (!r.hidden) vis++;
  });
  $('list').querySelectorAll('.emp2').forEach(e => e.remove());
  if (!vis && !q) $('list').insertAdjacentHTML('beforeend', `<p class="empty emp2">${dmTab === 'requests' ? 'No message requests.' : dmTab === 'general' ? 'Nothing here yet.' : 'No chats yet. Search for people and follow them to start chatting.'}</p>`);
  const rq = Object.keys(users).filter(u => u !== me && tabOf(u) === 'requests').length; $('rqn').textContent = rq ? ' ' + rq : '';
  const un = msgs.filter(m => m.to === me && m.status !== 'read' && !m.deleted).length;
  const rec = [...new Set(msgs.slice(-20).reverse().map(m => m.from === me ? m.to : m.from))].filter(u => users[u]).slice(0, 3);
  $('mpill').innerHTML = `${ic('send', 20)}<span>Messages</span>${un ? `<b>${un}</b>` : ''}${rec.map(u => av(u, false, 's')).join('')}`;
}
const _rl3 = renderList; renderList = function () { _rl3(); applyTab(); };

/* ---- socket ---- */
function sx4() {
  sock.on('notifs', n => { NOTIFS = n; updateDot(); if (view.n === 'notifs') renderNotifs(); });
  sock.on('suggest', s => { SUG = s; if (view.n === 'feed') render(); });
  sock.on('feed', f => f.forEach(p => (SEEN[p.id] = p)));
  sock.on('profileData', d => (d.posts || []).forEach(p => (SEEN[p.id] = p)));
  document.querySelector('#top .ttl').textContent = me; $('mpill').hidden = $('home').hidden;
}
const _s5 = start; start = d => { _s5(d); sx4(); };
if (typeof sock !== 'undefined' && sock) { sx4(); apply(); sock.emit('getSuggest'); render(); renderList(); }
