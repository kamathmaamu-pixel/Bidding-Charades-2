// Player team quiz. Produces a code the game master pastes in to build balanced teams.
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let step = -1, name = '', ans = {}; // step -1 = name entry

function render() {
  if (step === -1) {
    app.innerHTML = `<div class="diya">🪔</div><h1 class="center">Team Quiz</h1>
    <p class="center mut">A few quick questions and the game master will do the team magic.</p>
    <div class="card"><label>Your name</label><input id="nm" type="text" maxlength="20" placeholder="e.g. Priya" value="${esc(name)}" autocomplete="off">
    <button class="btn" id="go">Start</button></div>`;
    document.getElementById('go').onclick = () => {
      name = document.getElementById('nm').value.trim();
      if (!name) return document.getElementById('nm').focus();
      step = 0; render();
    };
    return;
  }
  if (step >= QUIZ.length) return done();
  const q = QUIZ[step];
  const sel = ans[q.id] === undefined ? (q.multi ? [] : null) : ans[q.id];
  app.innerHTML = `<div class="prog"><i style="width:${(step / QUIZ.length) * 100}%"></i></div>
  <p class="mut">Question ${step + 1} of ${QUIZ.length}</p><h2>${esc(q.q)}</h2>
  ${q.opts.map((o, i) => {
    const key = q.multi ? o[0] : i;
    const on = q.multi ? sel.includes(key) : sel === key;
    return `<label class="opt ${on ? 'on' : ''}" data-k="${key}">${esc(q.multi ? o[1] : o[0])}</label>`;
  }).join('')}
  ${q.multi ? '<p class="mut">Pick all that apply (or none).</p>' : ''}
  <div class="row">${step > 0 ? '<button class="btn sec" id="back">Back</button>' : ''}
  <button class="btn" id="next" ${!q.multi && sel === null ? 'disabled' : ''}>${step === QUIZ.length - 1 ? 'Finish' : 'Next'}</button></div>`;
  app.querySelectorAll('.opt').forEach(el => el.onclick = () => {
    const k = q.multi ? el.dataset.k : +el.dataset.k;
    if (q.multi) { const a = ans[q.id] || []; ans[q.id] = a.includes(k) ? a.filter(x => x !== k) : [...a, k]; }
    else ans[q.id] = k;
    render();
  });
  const b = document.getElementById('back'); if (b) b.onclick = () => { step--; render(); };
  document.getElementById('next').onclick = () => { if (q.multi && !ans[q.id]) ans[q.id] = []; step++; render(); };
}

function done() {
  const val = id => { const q = QUIZ.find(x => x.id === id); return q.opts[ans[id]][1]; };
  const fun = ['sweet', 'cracker', 'night'].reduce((s, id) => s + val(id), 0);
  const obj = { n: name, l: ans.langs || [], m: val('mem'), a: val('act'), f: fun,
    s: QUIZ.find(q => q.id === 'sweet').opts[ans.sweet][0] };
  const code = encodeCode(obj);
  const msg = `Bidding Charades quiz – ${name}\n${code}`;
  app.innerHTML = `<div class="diya">🎉</div><h1 class="center">Done, ${esc(name)}!</h1>
  <p class="center">Send this code to the game master – they'll drop you into a team.</p>
  <div class="card"><code class="cd">${code}</code>
  <button class="btn" id="copy">📋 Copy code</button>
  <a class="btn sec" style="text-decoration:none;text-align:center" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">💬 Send on WhatsApp</a></div>
  <button class="btn sec" id="again">Redo quiz</button>`;
  document.getElementById('copy').onclick = e => {
    const done = () => e.target.textContent = '✅ Copied!';
    (navigator.clipboard ? navigator.clipboard.writeText(code).then(done, () => prompt('Copy this code', code)) : (prompt('Copy this code', code)));
  };
  document.getElementById('again').onclick = () => { step = -1; ans = {}; render(); };
}
render();
