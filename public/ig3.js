/* AUR Instagram look v3: sign-in page with AUR logo, "More" menu, profile page, explore grid. Loaded after ig2.js */
var EXP = [], lmode = 'login';
Object.assign(P, { grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>', moon: '<path d="M20 14A8 8 0 0110 4a8 8 0 1010 10z"/>' });
document.head.insertAdjacentHTML('beforeend', `<style>
#login{flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;overflow:auto!important}#card{transform:none!important}
.lw{flex:1;display:flex;min-height:0}.ll{flex:1.4;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 20px 0}
.ll h1{font-size:clamp(28px,3.4vw,44px);font-weight:400;text-align:center;line-height:1.35;max-width:520px}.grad{background:linear-gradient(90deg,#feda75,#fa7e1e,#d62976,#962fbf);-webkit-background-clip:text;background-clip:text;color:transparent}
.ill{position:relative;width:min(440px,90%);height:380px;margin-top:20px}.ph3{position:absolute;border-radius:26px;box-shadow:0 16px 40px #0008}
.ph3.a{left:2%;top:70px;width:34%;height:62%;transform:rotate(-9deg);background:linear-gradient(150deg,#7e68d9,#d6559f)}
.ph3.c{right:2%;top:60px;width:34%;height:62%;transform:rotate(9deg);background:linear-gradient(150deg,#feda75,#d62976)}
.ph3.b{left:50%;top:8px;width:42%;height:86%;transform:translateX(-50%);background:#0b0b14;border:2px solid #fff2;display:grid;place-items:center;z-index:2;animation:float 6s ease-in-out infinite alternate}
.ph3.b img{width:78%;border-radius:20px;filter:drop-shadow(0 0 18px #d62976aa)}
.bub{position:absolute;z-index:3;background:#fff;color:#000;border-radius:18px;padding:6px 12px;font-size:20px;box-shadow:0 6px 18px #0006}.bub.e{left:10%;top:10px}.bub.h{right:8%;bottom:60px;background:linear-gradient(135deg,#ff3040,#d62976);color:#fff}
.lr{flex:1;background:var(--panel);display:flex;align-items:center;justify-content:center;border-left:1px solid var(--line);min-width:360px}
.lcard{width:min(420px,88%);display:flex;flex-direction:column;gap:12px;animation:rise .6s both}.lcard h3{font-weight:600;margin-bottom:6px}
.fld{position:relative}.fld input{width:100%;padding:16px 14px;border-radius:14px;background:transparent;border:1px solid var(--line);color:var(--text)}.fld input:focus{border-color:var(--sub)}
.fld .sp2{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--sub);font-size:13px;font-weight:600}
.lb{padding:13px;border-radius:24px;background:var(--accent);color:#fff;font-weight:600;transition:opacity .2s}.lb:disabled{opacity:.55;cursor:default}
.lb2{padding:13px;border-radius:24px;border:1px solid var(--accent);color:var(--accent);font-weight:600}.lf2{text-align:center;color:var(--sub);font-size:13px;padding:16px}.lcard .lg{align-self:center;width:42px;border-radius:12px;margin-top:6px}
.lk{text-align:center;font-weight:600;font-size:14px;cursor:pointer}
@media(max-width:800px){.ll{display:none}.lr{border:0;background:var(--bg);min-width:0}}
#rail .logo{background:none;display:block;cursor:pointer;margin:2px 0 10px}#rail .logo img{width:36px;height:36px;border-radius:10px;display:block}
#mm{position:fixed;left:74px;bottom:64px;width:260px;background:var(--panel);border-radius:16px;padding:8px 0;box-shadow:0 8px 30px #000a;z-index:30;animation:fade .15s}
#mm button{display:flex;gap:14px;align-items:center;width:100%;padding:13px 18px;text-align:left}#mm button:hover{background:var(--field)}#mm hr{border:0;border-top:1px solid var(--line);margin:6px 0}
@media(max-width:700px){#mm{left:8px;bottom:64px}}
.av.xxl{width:150px;height:150px;font-size:60px}.pfx{display:flex;gap:70px;align-items:center;padding:24px 20px 14px}.pn2{display:flex;gap:12px;align-items:center;margin-bottom:12px}.pn2 button{color:var(--text)}
.bio{margin:10px 0;line-height:1.5;font-size:14px}.pbt{display:flex;gap:10px;margin-top:10px}.pbt button{flex:1;padding:8px 16px;border-radius:10px;background:var(--field);font-weight:600}.pbt .pri{background:var(--accent);color:#fff}
.ptabs{display:flex;justify-content:center;gap:60px;border-top:1px solid var(--line);margin-top:10px}.ptabs button{padding:14px 10px;color:var(--sub);border-top:2px solid transparent;margin-top:-1px}.ptabs button.on{color:var(--text);border-color:var(--text)}
.pg img,.ex img{aspect-ratio:3/4}.exw{width:min(1100px,100%);padding:14px 10px 90px}.ex{grid-template-columns:repeat(5,1fr)}
.sq2{display:block;width:min(740px,100%);margin:6px auto 18px;padding:12px 20px 12px 44px;border-radius:24px;background:var(--panel) url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round'><circle cx='11' cy='11' r='6'/><path d='M16 16l4 4'/></svg>")}") 16px center no-repeat}
@media(max-width:900px){.ex{grid-template-columns:repeat(3,1fr)}.pfx{gap:24px}.av.xxl{width:88px;height:88px;font-size:36px}}
</style>`);

/* ---- sign-in page ---- */
$('login').innerHTML = `<div class="lw"><div class="ll"><h1>Share every moment with your <span class="grad">close friends</span>.</h1>
<div class="ill"><div class="ph3 a"></div><div class="ph3 c"></div><div class="ph3 b"><img src="/logo.png" alt="AUR"></div><span class="bub e">💬 ✨</span><span class="bub h">♥</span></div></div>
<div class="lr"><div class="lcard" id="card"><img class="lg" src="/logo.png" alt="AUR"><h3 id="lt">Log into AUR</h3>
<div class="fld"><input id="u" placeholder="Username" autocapitalize="off" autocomplete="username"></div>
<div class="fld"><input id="p" type="password" placeholder="Password" autocomplete="current-password"><span class="sp2" id="shw" onclick="togPw()" hidden>Show</span></div>
<div id="err" style="color:#f15c6d;min-height:18px;font-size:13px"></div>
<button class="lb" id="lgo" onclick="auth(lmode)" disabled>Log in</button>
<div class="lk" id="fgt" onclick="$('err').textContent='Password reset is not available yet.'">Forgot password?</div>
<button class="lb2" id="lsw" onclick="setLmode(lmode==='login'?'register':'login')">Create new account</button></div></div></div>
<div class="lf2">AUR · © 2026</div>`;
function togPw() { const p = $('p'); p.type = p.type === 'password' ? 'text' : 'password'; $('shw').textContent = p.type === 'password' ? 'Show' : 'Hide'; }
function setLmode(m) {
  lmode = m; $('err').textContent = '';
  $('lt').textContent = m === 'login' ? 'Log into AUR' : 'Create your AUR account'; $('lgo').textContent = m === 'login' ? 'Log in' : 'Sign up';
  $('lsw').textContent = m === 'login' ? 'Create new account' : 'I already have an account'; $('fgt').hidden = m !== 'login';
  $('u').placeholder = m === 'login' ? 'Username' : 'Choose a unique username'; $('p').autocomplete = m === 'login' ? 'current-password' : 'new-password';
}
const chk = () => { $('lgo').disabled = !($('u').value.trim() && $('p').value); $('shw').hidden = !$('p').value; };
['u', 'p'].forEach(id => $(id).addEventListener('input', chk));
$('p').addEventListener('keydown', e => { if (e.key === 'Enter' && !$('lgo').disabled) auth(lmode); });
$('u').addEventListener('keydown', e => { if (e.key === 'Enter') $('p').focus(); });

/* ---- logo in rail + More menu ---- */
$('rail').querySelector('.logo').innerHTML = '<img src="/logo.png" alt="AUR">';
$('rail').querySelector('.logo').setAttribute('onclick', "go('feed')");
$('rail').querySelector('button[title=Settings]').setAttribute('onclick', 'moreMenu(event)');
document.body.insertAdjacentHTML('beforeend', '<div id="mm" hidden></div>');
function moreMenu(e) {
  e.stopPropagation(); const m = $('mm'); if (!m.hidden) { m.hidden = true; return; }
  const it = (i, l, f) => `<button onclick="$('mm').hidden=true;${f}">${ic(i, 22)}<span>${l}</span></button>`;
  m.innerHTML = it('gear', 'Settings', 'tog(1)') + it('status', 'Your activity', "go('notifs')") + it('mark', 'Saved', "go('saved')")
    + it('moon', 'Switch appearance', "set('theme',S.theme==='light'?'amoled':'light')") + '<hr>' + it('user', 'Switch accounts', 'logout()') + '<hr>' + it('out', 'Log out', 'logout()');
  m.hidden = false;
}
document.addEventListener('click', () => { $('mm').hidden = true; });

/* ---- profile page ---- */
profileHTML = function () {
  if (!PD) return '<p class="t">Loading…</p>';
  if (PD.missing) return '<p class="t">User not found.</p>';
  const c = PD.card; if (c.username !== view.u) return '<p class="t">Loading…</p>';
  PIC[c.username] = c.pic; const mine = c.username === me;
  return `<div class="pfx">${avp(c, 'xxl')}<div style="flex:1"><div class="pn2"><h2>${c.username}</h2>${mine ? `<button onclick="tog(2)">${ic('gear', 20)}</button>` : ''}</div>
    <div class="cnt"><span><b>${PD.posts.length}</b> posts</span><span><b>${c.followers}</b> followers</span><span><b>${c.following}</b> following</span></div>
    <p class="bio">${esc(c.about || '').replace(/\n/g, '<br>')}</p>
    <div class="pbt">${mine ? '<button onclick="tog(2)">Edit profile</button><button onclick="invite()">Share profile</button>'
      : `<button class="${c.iFollow ? '' : 'pri'}" onclick="pfol('${c.username}',${c.iFollow})">${c.iFollow ? 'Following' : 'Follow'}</button><button onclick="msgTo('${c.username}')">Message</button>`}</div></div></div>
    <div class="ptabs"><button class="on" title="Posts">${ic('grid', 22)}</button>${mine ? `<button title="Saved" onclick="go('saved')">${ic('mark', 22)}</button>` : ''}</div>
    <div class="grid pg">${PD.posts.map(p => `<img src="${mUrl(p.mediaId)}" onclick="openPost('${p.id}')">`).join('') || '<p class="t" style="grid-column:1/4;text-align:center;padding:40px">No posts yet</p>'}</div>`;
};

/* ---- explore ---- */
function exSearch(v) {
  clearTimeout(igt); const g = $('exg'), r = $('igr');
  if (!v.trim()) { r.innerHTML = ''; g.hidden = false; return; }
  g.hidden = true; igt = setTimeout(() => sock.emit('search', v.trim()), 250);
}
function renderExplore() {
  const h = $('home'), keep = $('exq') ? $('exq').value : '';
  h.innerHTML = `<div class="exw"><input id="exq" class="sq2" placeholder="Search" value="${esc(keep)}" oninput="exSearch(this.value)"><div id="igr"></div>
    <div class="grid ex" id="exg">${EXP.map(p => `<img src="${mUrl(p.mediaId)}" onclick="openPost('${p.id}')">`).join('') || '<p class="t" style="grid-column:1/6;text-align:center;padding:40px">Nothing to explore yet. Share the first photo!</p>'}</div></div>`;
  if (pmId) openPost(pmId, true);
}
const _r3 = render; render = function () { if (view.n === 'search') return renderExplore(); _r3(); };
const _go3 = go; go = function (n, u) { _go3(n, u); if (n === 'search') sock.emit('getExplore'); };

function sx5() {
  sock.on('explore', p => { EXP = p; p.forEach(x => (SEEN[x.id] = x)); if (view.n === 'search') { PD = { posts: EXP, card: { username: '_ex' } }; renderExplore(); } });
}
const _s6 = start; start = d => { _s6(d); sx5(); };
if (typeof sock !== 'undefined' && sock) sx5();
setLmode('login'); chk();
