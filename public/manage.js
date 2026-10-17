/* AUR manage: delete message (for me / for everyone), clear & delete chat, remove photo, delete account. Loaded after social.js */
document.head.insertAdjacentHTML('beforeend', `<style>
.m .mdd{position:absolute;top:1px;right:3px;opacity:0;color:var(--sub);font-size:14px;padding:0 5px;border-radius:6px;background:inherit;transition:opacity .15s}
.m:hover .mdd{opacity:1}@media(hover:none){.m .mdd{opacity:.6}}.m .dl{color:var(--sub);font-style:italic}
.danger{color:#f15c6d!important}
</style>`);

const _a2 = add;
add = m => { if (m.deleted) m.text = '🚫 This message was deleted'; _a2(m); };

const _rm2 = renderMsgs;
renderMsgs = function () {
  _rm2(); if (!peer) return;
  const ms = thread(peer);
  document.querySelectorAll('#msgs .m').forEach((el, i) => {
    const m = ms[i]; if (!m) return;
    el.dataset.id = m.id;
    if (m.deleted) { const t = el.querySelector('small'); el.innerHTML = '<i class="dl">🚫 This message was deleted</i>' + (t ? t.outerHTML : ''); }
    else el.insertAdjacentHTML('afterbegin', `<button class="mdd" onclick="msgMenu(event,'${m.id}')">▾</button>`);
  });
};

function msgMenu(e, id) {
  const m = msgs.find(x => x.id === id); if (!m) return;
  const it = [];
  if (!m.media && m.text) it.push(['Copy', () => navigator.clipboard && navigator.clipboard.writeText(m.text)]);
  it.push(['Delete for me', () => sock.emit('delMsg', { id, all: false })]);
  if (m.from === me) it.push(['Delete for everyone', () => confirm('Delete this message for everyone?') && sock.emit('delMsg', { id, all: true })]);
  showMenu(e, it);
}
chatMenu = function (e) {
  const u = peer, shut = () => { $('box').hidden = true; $('welcome').hidden = false; closeChat(); };
  showMenu(e, [['Contact info', openInfo], [isFav(u) ? 'Remove from favourites' : 'Add to favourites', () => toggleFav(u)],
    ['Clear chat', () => confirm('Clear all messages in this chat? This removes them only for you.') && sock.emit('clearChat', u)],
    ['Delete chat', () => { if (confirm('Delete this chat? This removes it only for you.')) { sock.emit('clearChat', u); shut(); } }],
    ['Close chat', shut]]);
};

const _pp = PAGES.profile.r;
PAGES.profile.r = () => _pp() + (S.pic ? `<h4>Photo</h4><div class="chips"><button class="danger" onclick="S.pic='';save();sendProfile();renderSettings()">Remove profile photo</button></div>` : '');
const _pa = PAGES.account.r;
PAGES.account.r = () => _pa() + `<h4>Danger zone</h4><div class="chips"><button class="danger" onclick="delAccount()">Delete my account</button></div><p class="t">This permanently deletes your account, your chats, files and statuses. It cannot be undone.</p>`;
function delAccount() {
  const t = prompt('This permanently deletes your account and all your chats.\nType your username (' + me + ') to confirm:');
  if (t && t.trim().toLowerCase() === me) sock.emit('delAccount');
}

function sx2() {
  sock.on('msgDeleted', ({ id }) => {
    const m = msgs.find(x => x.id === id);
    if (m) { m.deleted = true; m.text = '🚫 This message was deleted'; m.media = null; m.cap = ''; }
    renderMsgs(); renderList();
  });
  sock.on('msgGone', ({ ids }) => { const g = new Set(ids); msgs = msgs.filter(m => !g.has(m.id)); renderMsgs(); renderList(); });
  sock.on('userGone', ({ username }) => {
    delete users[username]; msgs = msgs.filter(m => m.from !== username && m.to !== username);
    FW.following = FW.following.filter(x => x !== username); FW.followers = FW.followers.filter(x => x !== username);
    if (peer === username) { $('box').hidden = true; $('welcome').hidden = false; closeChat(); }
    renderList();
  });
  sock.on('accountDeleted', () => logout());
}
const _s3 = start; start = d => { _s3(d); sx2(); };
if (typeof sock !== 'undefined' && sock) sx2();
