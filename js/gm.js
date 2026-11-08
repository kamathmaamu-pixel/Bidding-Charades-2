// Game master panel for Bidding Charades. State lives in localStorage; no server needed.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'bc2-state-v1';
const TEAM_DEF = [['🪔', 'Diyas'], ['🚀', 'Rockets'], ['🍬', 'Laddoos'], ['✨', 'Sparklers']];

function fresh() {
  return {
    tab: 'teams', nTeams: 2,
    teams: TEAM_DEF.map(t => ({ emoji: t[0], name: t[1], score: 0, ai: 0 })),
    players: [], used: [], history: [], phase: 'idle', round: null, roundNo: 0,
    set: { langs: { hi: 1, ta: 1, en: 1, kn: 1 }, diff: { 1: 1, 2: 1, 3: 1 }, max: 120, step: 5, skipPen: 5 },
  };
}
let S = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.teams) return Object.assign(fresh(), s); } catch (e) {} return fresh(); })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const teams = () => S.teams.slice(0, S.nTeams);
const tname = i => { const t = S.teams[i]; return t.emoji + ' ' + t.name; };
const members = i => S.players.filter(p => p.team === i);

// ---------- audio / vibration ----------
let actx;
function beep(f = 880, d = 0.12) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = f; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.25, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + d);
    o.start(); o.stop(actx.currentTime + d);
  } catch (e) {}
}
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
let wl; async function keepAwake() { try { wl = await navigator.wakeLock.request('screen'); } catch (e) {} }
function release() { try { wl && wl.release(); wl = null; } catch (e) {} }

// ---------- game logic ----------
function drawMovie() {
  const ok = m => S.set.langs[m.l] && S.set.diff[m.d];
  let pool = MOVIES.filter(m => ok(m) && !S.used.includes(m.id));
  if (!pool.length) { S.used = S.used.filter(id => !ok(MOVIES.find(m => m.id === id) || {})); pool = MOVIES.filter(ok); }
  if (!pool.length) return null;
  const m = pool[Math.floor(Math.random() * pool.length)];
  S.used.push(m.id);
  return m;
}
function lowest() {
  const r = S.round; let best = null;
  r.bids.forEach((b, i) => { if (b && (!best || b.v < best.v || (b.v === best.v && b.t < best.t))) best = { team: i, v: b.v, t: b.t }; });
  return best;
}
function autoSplit() {
  const n = S.nTeams;
  const ps = S.players.slice().sort((a, b) => (b.sc + Math.random() * 1.5) - (a.sc + Math.random() * 1.5));
  ps.forEach((p, i) => { const r = i % (2 * n); p.team = r < n ? r : 2 * n - 1 - r; });
  save();
}
function actorFor(team) {
  const m = members(team);
  return m.length ? m[S.teams[team].ai % m.length].name : 'Someone from the team';
}
function finish(ok) {
  const r = S.round; r.ok = ok;
  const p = pts(r.bid);
  r.delta = ok ? p : -Math.round(p / 2);
  S.teams[r.winner].score += r.delta;
  S.teams[r.winner].ai++;
  S.history.unshift({ n: S.roundNo, t: r.movie.t, team: r.winner, bid: r.bid, ok, d: r.delta });
  S.phase = 'result'; release(); save();
  if (ok) { buzz([80, 40, 80]); burst(); }
  render();
}
function burst() {
  const em = ['🪔', '✨', '🎆', '🎇', '🧨', '🪙'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('span'); s.className = 'burst'; s.textContent = em[i % em.length];
    s.style.left = Math.random() * 95 + 'vw'; s.style.animationDelay = Math.random() * 1.2 + 's';
    document.body.appendChild(s); setTimeout(() => s.remove(), 4500);
  }
}

// ---------- timer ----------
let tick;
function startTimer() {
  const r = S.round; r.endAt = Date.now() + r.bid * 1000; r.paused = false; r.last = null;
  S.phase = 'timer'; save(); keepAwake(); beep(660, .2); render(); runTick();
}
function runTick() {
  clearInterval(tick);
  tick = setInterval(() => {
    const r = S.round; if (S.phase !== 'timer' || !r || r.paused) return;
    const left = Math.max(0, Math.ceil((r.endAt - Date.now()) / 1000));
    const el = $('#tm'); if (el) { el.textContent = fmt(left); el.classList.toggle('low', left <= 10); }
    const bar = $('#bar'); if (bar) bar.style.width = (left / r.bid * 100) + '%';
    if (left !== r.last) {
      r.last = left;
      if (left <= 10 && left > 0) { beep(left <= 3 ? 1100 : 800, .08); buzz(40); }
      if (left === 0) { clearInterval(tick); beep(300, .8); buzz([300, 100, 300]); S.phase = 'timesup'; save(); render(); }
    }
  }, 200);
}
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

// ---------- views ----------
function render() {
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  $('#view').innerHTML = ({ teams: vTeams, play: vPlay, scores: vScores, settings: vSettings })[S.tab]();
  bindHold();
}

function scoreboard(big) {
  const max = Math.max(...teams().map(t => t.score));
  return teams().map((t, i) => `<div class="team ${big && t.score === max && max > 0 ? 'lead' : ''}"><span class="nm">${esc(t.emoji + ' ' + t.name)}<br><span class="mut">${members(i).map(p => esc(p.name)).join(', ') || 'no players'}</span></span>
  ${big ? `<button class="btn sm sec" data-act="adj" data-i="${i}" data-v="-10">−10</button><button class="btn sm sec" data-act="adj" data-i="${i}" data-v="10">+10</button>` : ''}
  <span class="sc">${t.score}</span></div>`).join('');
}

function vTeams() {
  const link = location.href.replace(/gm\.html.*$/, 'play.html');
  const opts = i => `<option value="-1">— none —</option>` + teams().map((t, k) => `<option value="${k}" ${i === k ? 'selected' : ''}>${esc(tname(k))}</option>`).join('');
  return `<h1>👥 Teams</h1>
  <div class="card"><h2>1. Get players to take the quiz</h2>
    <p class="mut">Share this link. When they finish they send you a code — paste it below.</p>
    <code class="cd">${esc(link)}</code>
    <div class="row"><button class="btn sec sm" data-act="copylink">📋 Copy link</button><button class="btn sec sm" data-act="sharelink">📤 Share</button></div></div>
  <div class="card"><h2>2. Add players</h2>
    <textarea id="codes" placeholder="Paste quiz codes here (one or many, any text around them is fine)"></textarea>
    <button class="btn" data-act="addcodes">Add from codes</button>
    <div class="row"><input id="pname" type="text" placeholder="Or add by name" maxlength="20">
    <select id="plvl"><option value="4">Newbie</option><option value="8" selected>Average</option><option value="12">Movie pro</option></select></div>
    <button class="btn sec" data-act="addplayer">+ Add player</button></div>
  <div class="card"><h2>3. Teams</h2>
    <div class="row">${[2, 3, 4].map(n => `<button class="chip ${S.nTeams === n ? 'on' : ''}" data-act="nteams" data-i="${n}">${n} teams</button>`).join('')}</div>
    ${teams().map((t, i) => `<div class="row" style="margin:8px 0"><input type="text" style="flex:0 0 3.4em;text-align:center" data-f="emoji" data-i="${i}" value="${esc(t.emoji)}"><input type="text" style="flex:1 1 auto" data-f="name" data-i="${i}" value="${esc(t.name)}" maxlength="18"></div>`).join('')}
    <button class="btn" data-act="split" ${S.players.length < 2 ? 'disabled' : ''}>🎲 Auto-split into balanced teams</button>
    <p class="mut">Balanced using quiz answers: languages known, movie memory and acting confidence. Hit again to reshuffle.</p></div>
  <div class="card"><h2>Players (${S.players.length})</h2>
    ${S.players.length ? S.players.map(p => `<div class="row" style="margin:6px 0"><span style="flex:1 1 40%">${esc(p.name)}${p.sw ? ` <span class="mut">· ${esc(p.sw)}</span>` : ''}</span>
    <select data-pt="${p.id}" style="flex:1 1 40%">${opts(p.team)}</select><button class="btn sm sec" style="flex:0 0 auto" data-act="delp" data-i="${p.id}">✕</button></div>`).join('') : '<p class="mut">Nobody yet.</p>'}
  </div>`;
}

function movieInfo(m) {
  const L = LANGS[m.l];
  return `<span class="tag">${L.emoji} ${L.name}</span><span class="tag">${'⭐'.repeat(m.d)} ${['', 'Easy', 'Medium', 'Hard'][m.d]}</span><span class="tag">${m.t.split(/\s+/).length} word${m.t.split(/\s+/).length > 1 ? 's' : ''}</span>`;
}

function vPlay() {
  const r = S.round, ph = S.phase;
  if (teams().length < 2) return '<p>Need at least 2 teams.</p>';
  if (ph === 'idle') return `<div class="diya">🪔</div><h1 class="center">Round ${S.roundNo + 1}</h1>
    <div class="card">${scoreboard(false)}</div>
    <button class="btn" data-act="draw">🎬 Draw a movie</button>
    <p class="center mut">${S.players.length ? '' : 'Tip: add players in the Teams tab first.'}</p>`;
  if (ph === 'bidding') {
    const low = lowest(), cur = low ? low.v : null, next = cur === null ? S.set.max : cur - S.set.step;
    return `<h2>Round ${S.roundNo} · Place your bids!</h2>
    <div class="card center">${movieInfo(r.movie)}
      <p class="mut">Teams bid <b>how few seconds</b> they need to get their teammate to guess it. Lowest bid wins — and must do it in that time!</p>
      <div class="mut">${cur === null ? 'No bids yet. Opening at ' + S.set.max + 's' : 'Lowest bid'}</div>
      <div class="big" style="font-size:5rem">${cur === null ? '—' : cur + 's'}</div>
      ${low ? `<div>${esc(tname(low.team))} leads · worth <b>+${pts(low.v)}</b> pts (miss: −${Math.round(pts(low.v) / 2)})</div>` : ''}</div>
    ${teams().map((t, i) => { const b = r.bids[i]; return `<div class="card team"><span class="nm">${esc(tname(i))}<br><span class="mut">${b ? 'bid ' + b.v + 's' : 'no bid'}</span></span>
      <button class="btn sm" data-act="bid" data-i="${i}" ${next < 10 ? 'disabled' : ''}>⬇ ${next}s</button>
      <button class="btn sm sec" data-act="custom" data-i="${i}">✏️</button></div>`; }).join('')}
    <button class="btn ok" data-act="win" ${low ? '' : 'disabled'}>✅ Lock it in${low ? ' – ' + esc(tname(low.team)) + ' · ' + low.v + 's' : ''}</button>
    <div class="row"><button class="btn sec sm" data-act="clearbids">Reset bids</button><button class="btn sec sm" data-act="reroll">🔀 Different movie</button></div>`;
  }
  if (ph === 'handoff') return `<h2>📱 Hand the phone to ${esc(actorFor(r.winner))}</h2>
    <p class="mut">${esc(tname(r.winner))} bid <b>${r.bid}s</b>. Only the actor looks!
    <button class="btn sec sm" data-act="swapactor">change actor</button></p>
    <div class="card"><div class="center">${movieInfo(r.movie)}</div>
    <div class="movie hide" id="mv">${esc(r.movie.t)}</div>
    <button class="btn sec" id="holdbtn">👆 HOLD to reveal movie</button></div>
    <button class="btn ok" data-act="start">▶ Start ${r.bid}s timer</button>
    <button class="btn bad" data-act="skip">⏭ Don't know it – skip (−${S.set.skipPen})</button>`;
  if (ph === 'timer' || ph === 'timesup') {
    const left = ph === 'timesup' ? 0 : r.paused ? Math.ceil(r.left / 1000) : Math.max(0, Math.ceil((r.endAt - Date.now()) / 1000));
    return `<h2 class="center">${esc(tname(r.winner))} · ${esc(actorFor(r.winner))} acting</h2>
    <div class="big ${left <= 10 ? 'low' : ''}" id="tm">${fmt(left)}</div>
    <div class="prog"><i id="bar" style="width:${left / r.bid * 100}%"></i></div>
    <div class="card"><div class="center">${movieInfo(r.movie)}</div>
    <div class="movie ${ph === 'timesup' ? '' : 'hide'}" id="mv">${esc(r.movie.t)}</div>
    ${ph === 'timesup' ? '<h2 class="center">⏰ TIME\'S UP!</h2>' : '<button class="btn sec" id="holdbtn">👆 HOLD to peek (actor)</button>'}</div>
    ${ph === 'timesup' ? '' : `<div class="row"><button class="btn sec" data-act="pause">${r.paused ? '▶ Resume' : '⏸ Pause'}</button><button class="btn bad" data-act="skiprun">⏭ Skip (−${S.set.skipPen})</button></div>`}
    <button class="btn ok" data-act="got">✅ Guessed it!</button>
    <button class="btn bad" data-act="miss">❌ ${ph === 'timesup' ? 'Missed it' : 'Give up'}</button>`;
  }
  if (ph === 'result') return `<div class="diya">${r.ok ? '🎆' : '💥'}</div>
    <h1 class="center">${r.ok ? 'Guessed it!' : 'Missed!'}</h1>
    <div class="card center"><div class="movie" style="padding:6px">${esc(r.movie.t)}</div>
    <p>${esc(tname(r.winner))}: <b style="color:var(--${r.ok ? 'ok' : 'bad'})">${r.delta > 0 ? '+' : ''}${r.delta}</b> pts (bid ${r.bid}s)</p></div>
    <div class="card">${scoreboard(false)}</div>
    <button class="btn" data-act="next">Next round ➜</button>`;
  return '';
}

function vScores() {
  const max = Math.max(...teams().map(t => t.score));
  return `<h1>🏆 Scores</h1><div class="card">${scoreboard(true)}</div>
  <button class="btn" data-act="endgame">🎉 End game & crown the winner</button>
  <div class="card"><h2>Round history</h2>${S.history.length ? S.history.slice(0, 15).map(h => `<div class="team"><span class="nm">#${h.n} ${esc(h.t)}<br><span class="mut">${esc(tname(h.team))} · ${h.bid}s</span></span><span style="color:var(--${h.ok ? 'ok' : 'bad'});font-weight:800">${h.d > 0 ? '+' : ''}${h.d}</span></div>`).join('') : '<p class="mut">No rounds yet.</p>'}</div>
  <button class="btn sec" data-act="reset">🔄 New game (keep players, reset scores)</button>
  <button class="btn sec" data-act="wipe">🗑️ Wipe everything</button>`;
}

function vSettings() {
  const s = S.set, avail = l => MOVIES.filter(m => m.l === l && s.diff[m.d]).length;
  return `<h1>⚙️ Settings</h1>
  <div class="card"><h2>Movie languages</h2>${Object.keys(LANGS).map(l => `<button class="chip ${s.langs[l] ? 'on' : ''}" data-act="lang" data-i="${l}">${LANGS[l].emoji} ${LANGS[l].name} (${avail(l)})</button>`).join('')}
    <h2 style="margin-top:14px">Difficulty</h2>${[1, 2, 3].map(d => `<button class="chip ${s.diff[d] ? 'on' : ''}" data-act="diff" data-i="${d}">${'⭐'.repeat(d)} ${['', 'Easy', 'Medium', 'Hard'][d]}</button>`).join('')}
    <p class="mut">${MOVIES.filter(m => s.langs[m.l] && s.diff[m.d]).length} movies in play · ${S.used.length} used so far</p>
    <button class="btn sec sm" data-act="resetused">Reset used movies</button></div>
  <div class="card"><h2>Bidding</h2>
    <label class="mut">Opening bid (seconds)</label><input type="number" id="smax" value="${s.max}" min="30" max="300" step="10">
    <label class="mut">Each bid goes lower by (seconds)</label><select id="sstep">${[5, 10].map(v => `<option ${s.step === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <label class="mut">Skip penalty (points)</label><input type="number" id="spen" value="${s.skipPen}" min="0" max="50">
    <p class="mut">Points for a correct guess: <b>130 − bid</b> (min 10). So a 30s bid = 100 pts, 120s = 10 pts. A miss costs half of that.</p></div>`;
}

// ---------- hold to reveal ----------
function bindHold() {
  const b = $('#holdbtn'), m = $('#mv'); if (!b || !m) return;
  const on = e => { e.preventDefault(); m.classList.remove('hide'); }, off = () => m.classList.add('hide');
  b.addEventListener('pointerdown', on);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, off));
  b.addEventListener('contextmenu', e => e.preventDefault());
}

// ---------- events ----------
const A = {
  copylink() { navigator.clipboard && navigator.clipboard.writeText(location.href.replace(/gm\.html.*$/, 'play.html')); },
  sharelink() { const u = location.href.replace(/gm\.html.*$/, 'play.html'); navigator.share ? navigator.share({ title: 'Bidding Charades quiz', url: u }).catch(() => {}) : A.copylink(); },
  addcodes() {
    const txt = $('#codes').value, found = txt.match(/BC1-[A-Za-z0-9_-]+/g) || [];
    let n = 0;
    found.forEach(c => { const o = decodeCode(c); if (o && !S.players.some(p => p.name.toLowerCase() === o.n.toLowerCase())) { S.players.push({ id: Date.now() + Math.random(), name: o.n, team: -1, sc: playerScore(o), sw: o.s }); n++; } });
    if (!found.length) alert('No quiz codes found. They start with BC1-');
    else if (!n) alert('Those players are already added.');
    $('#codes').value = ''; if (n) autoSplit();
  },
  addplayer() { const n = $('#pname').value.trim(); if (!n) return; S.players.push({ id: Date.now() + Math.random(), name: n, team: -1, sc: +$('#plvl').value }); autoSplit(); },
  delp(i) { S.players = S.players.filter(p => p.id !== +i); },
  nteams(i) { S.nTeams = +i; S.players.forEach(p => { if (p.team >= S.nTeams) p.team = -1; }); if (S.players.length > 1) autoSplit(); },
  split() { autoSplit(); },
  draw() { S.round = { movie: drawMovie(), bids: S.teams.map(() => null) }; if (!S.round.movie) { alert('No movies match your settings!'); return; } S.roundNo++; S.phase = 'bidding'; },
  reroll() { S.round.movie = drawMovie() || S.round.movie; },
  bid(i) { const low = lowest(), v = low ? low.v - S.set.step : S.set.max; if (v >= 10) S.round.bids[+i] = { v, t: Date.now() }; },
  custom(i) { const v = parseInt(prompt('Bid in seconds for ' + tname(+i) + ' (lower than current lowest):'), 10); const low = lowest(); if (v >= 5 && v <= S.set.max && (!low || v < low.v)) S.round.bids[+i] = { v, t: Date.now() }; else if (!isNaN(v)) alert('Must be between 5 and ' + S.set.max + ' and lower than the current lowest bid.'); },
  clearbids() { S.round.bids = S.teams.map(() => null); },
  win() { const l = lowest(); if (!l) return; S.round.winner = l.team; S.round.bid = l.v; S.phase = 'handoff'; },
  swapactor() { S.teams[S.round.winner].ai++; },
  start() { startTimer(); },
  skip() { S.teams[S.round.winner].score -= S.set.skipPen; S.round.movie = drawMovie() || S.round.movie; },
  skiprun() { S.teams[S.round.winner].score -= S.set.skipPen; S.round.movie = drawMovie() || S.round.movie; },
  pause() { const r = S.round; if (r.paused) { r.endAt = Date.now() + r.left; r.paused = false; } else { r.left = Math.max(0, r.endAt - Date.now()); r.paused = true; } },
  got() { clearInterval(tick); finish(true); },
  miss() { clearInterval(tick); finish(false); },
  next() { S.phase = 'idle'; S.round = null; },
  adj(i, v) { S.teams[+i].score += +v; },
  lang(l) { S.set.langs[l] = S.set.langs[l] ? 0 : 1; },
  diff(d) { S.set.diff[d] = S.set.diff[d] ? 0 : 1; },
  resetused() { S.used = []; },
  endgame() {
    const ts = teams().map((t, i) => ({ i, s: t.score })).sort((a, b) => b.s - a.s);
    const tie = ts.length > 1 && ts[0].s === ts[1].s;
    burst(); setTimeout(burst, 1200);
    alert(tie ? '🤝 It\'s a tie at the top! Time for a tie-breaker round.' : '🏆 ' + tname(ts[0].i) + ' wins with ' + ts[0].s + ' points!');
  },
  reset() { if (!confirm('Reset all scores and history?')) return; S.teams.forEach(t => { t.score = 0; t.ai = 0; }); S.history = []; S.used = []; S.phase = 'idle'; S.round = null; S.roundNo = 0; },
  wipe() { if (!confirm('Delete players, teams and scores?')) return; const tab = S.tab; S = fresh(); S.tab = tab; },
};

document.addEventListener('click', e => {
  const nav = e.target.closest('#nav button');
  if (nav) { S.tab = nav.dataset.tab; save(); render(); return; }
  const t = e.target.closest('[data-act]'); if (!t) return;
  const f = A[t.dataset.act]; if (!f) return;
  f(t.dataset.i, t.dataset.v);
  save();
  if (t.dataset.act === 'copylink') { t.textContent = '✅ Copied'; return; }
  if (['sharelink', 'endgame', 'start', 'got', 'miss'].includes(t.dataset.act)) return; // these render themselves / need no re-render
  render();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.pt) { const p = S.players.find(p => p.id === +t.dataset.pt); if (p) p.team = +t.value; save(); render(); }
  else if (t.dataset.f) { S.teams[+t.dataset.i][t.dataset.f] = t.value.trim() || S.teams[+t.dataset.i][t.dataset.f]; save(); }
  else if (t.id === 'smax') { S.set.max = Math.min(300, Math.max(30, +t.value || 120)); save(); }
  else if (t.id === 'sstep') { S.set.step = +t.value; save(); }
  else if (t.id === 'spen') { S.set.skipPen = Math.max(0, +t.value || 0); save(); }
});

render();
if (S.phase === 'timer') runTick();
