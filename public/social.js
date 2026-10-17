/* AUR social layer: find people by username, follow / unfollow, profile cards. Loaded after ui.js */
var FW = { following: [], followers: [] }, SR = [], WH = null, sqt = 0;
document.head.insertAdjacentHTML('beforeend', `<style>
.cnt{display:flex;gap:18px;color:var(--sub)}.cnt b{color:var(--text)}.wbtn{display:flex;gap:10px;margin-top:10px}
.wbtn button{padding:10px 22px;border-radius:20px;background:var(--field)}.wbtn .pri{background:var(--accent);color:#fff}
</style>`);
$('q').placeholder = 'Search chats or find people by username';
$('u').placeholder = 'Choose a unique username';

const avp = (r, s) => `<div class="av ${s || ''}" style="background:${r.pic ? `url('${r.pic}') center/cover` : col(r.username)}">${r.pic ? '' : r.username[0].toUpperCase()}</div>`;
const canChat = u => FW.following.includes(u) || FW.followers.includes(u) || thread(u).length > 0;
function whois(u) { $('modal').hidden = true; sock.emit('whois', u); }
function fol(u) { sock.emit('follow', u); }
function unf(u) { sock.emit('unfollow', u); }
function showWho() {
  const r = WH; if (!r) return;
  $('mc').innerHTML = `${avp(r, 'xl')}<h3>@${r.username}</h3><p>${esc(r.about || 'Hey there! I am using AUR')}</p>
    <div class="cnt"><span><b>${r.followers}</b> followers</span><span><b>${r.following}</b> following</span></div>${r.followsMe ? '<small>Follows you</small>' : ''}
    <div class="wbtn"><button class="${r.iFollow ? '' : 'pri'}" onclick="event.stopPropagation();${r.iFollow ? 'unf' : 'fol'}('${r.username}')">${r.iFollow ? 'Following ✓' : 'Follow'}</button>
    <button onclick="event.stopPropagation();msgTo('${r.username}')">Message</button></div>`;
  $('modal').hidden = false;
}
function msgTo(u) {
  if (!canChat(u)) return alert('Follow @' + u + ' first to start chatting.');
  if (!users[u]) users[u] = { username: u, online: false, lastSeen: Date.now(), pic: WH && WH.username === u ? WH.pic : '', about: WH && WH.username === u ? WH.about : '' };
  $('modal').hidden = true; $('q').value = ''; SR = []; tab('chats'); openChat(u);
}
openInfo = function () { whois(peer); };

const _rl2 = renderList;
renderList = function () {
  _rl2();
  const q = $('q').value.trim().replace(/^@/, '');
  if (!q) return;
  const res = SR.filter(r => !users[r.username]);
  $('list').insertAdjacentHTML('afterbegin', res.length ? `<p class="stl">Find people on AUR</p>` + res.map(r => `<div class="row" onclick="whois('${r.username}')">${avp(r)}
    <div class="in"><div class="line"><b>@${r.username}</b>${r.iFollow ? '<small class="un">Following</small>' : ''}</div>
    <div class="line"><span>${esc(r.about || 'On AUR')} · ${r.followers} followers</span></div></div></div>`).join('') : '');
};
$('q').addEventListener('input', () => {
  clearTimeout(sqt); const q = $('q').value.trim();
  if (!q) { SR = []; return; }
  sqt = setTimeout(() => sock && sock.emit('search', q), 250);
});

MENU.splice(1, 0, ['people', 'user', 'Followers & following', 'People you follow and who follow you']);
PAGES.people = { t: 'Followers & following', r: () => {
  const list = a => a.map(u => `<div class="si" onclick="tog(0);whois('${u}')">${avp({ username: u, pic: (users[u] || {}).pic }, 's')}<div><b>@${u}</b></div></div>`).join('');
  return `<h4>Following (${FW.following.length})</h4>${list(FW.following) || '<p class="t">You are not following anyone yet. Search a username to find people.</p>'}
    <h4>Followers (${FW.followers.length})</h4>${list(FW.followers) || '<p class="t">No followers yet.</p>'}`; } };
const _pr = PAGES.profile.r;
PAGES.profile.r = () => `<p class="t" style="text-align:center"><b>${FW.followers.length}</b> followers · <b>${FW.following.length}</b> following</p>` + _pr();

function sx() {
  sock.on('follows', d => {
    FW = d;
    const keep = new Set([me, ...d.following, ...d.followers, ...msgs.map(m => m.from === me ? m.to : m.from)]);
    Object.keys(users).forEach(u => { if (!keep.has(u)) delete users[u]; });
    renderList(); if (setPage === 'people' || setPage === 'profile') renderSettings();
  });
  sock.on('searchResult', r => { SR = r; renderList(); });
  sock.on('whoisResult', r => { WH = r; SR = SR.map(x => x.username === r.username ? r : x); showWho(); renderList(); });
}
const _s2 = start; start = d => { _s2(d); sx(); };
if (typeof sock !== 'undefined' && sock) sx();
