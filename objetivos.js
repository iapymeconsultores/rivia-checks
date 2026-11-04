// Objetivos del equipo: 15.000 € de facturación (Milkys cuentan hasta 7.500 €) y 6.000 € de beneficio (Milkys al 100 %).
(function(){
const OBJ_F = 15000, OBJ_B = 6000, TOPE_MILKY = 7500;
const C = {milky:'#5b5fa8', proj:'#2a8a6a', loss:'#a3362b', ink:'#1d1d1b', soft:'#6b6a65', line:'#e3e1db', grid:'#efede8'};
const nf = (v,d=0) => { const s = Math.abs(v).toFixed(d).split('.'); return (v < 0 ? '-' : '') + s[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.') + (d ? ',' + s[1] : ''); };
const eur = (v,d=0) => `${nf(v,d)} €`;
const pc = v => `${Math.round(v*100)} %`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function calc(p){
  const mfc = Math.min(p.mf, TOPE_MILKY), exc = Math.max(0, p.mf - TOPE_MILKY);
  const fc = mfc + p.pf, bc = p.mb + p.pb;
  return {...p, mfc, exc, fc, bc, rf: fc/OBJ_F, rb: bc/OBJ_B, ff: Math.max(0, OBJ_F-fc), fb: Math.max(0, OBJ_B-bc)};
}

let tip;
function showTip(e, html){ tip.innerHTML = html; tip.style.display='block'; moveTip(e); }
function moveTip(e){ const r = tip.getBoundingClientRect(); let x = e.clientX+14, y = e.clientY+14;
  if (x + r.width > innerWidth-8) x = e.clientX - r.width - 14; if (y + r.height > innerHeight-8) y = e.clientY - r.height - 14;
  tip.style.left = x+'px'; tip.style.top = y+'px'; }
function hideTip(){ tip.style.display='none'; }
function bindTips(root){
  root.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('mouseenter', e => showTip(e, el.getAttribute('data-tip')));
    el.addEventListener('mousemove', moveTip); el.addEventListener('mouseleave', hideTip);
  });
}

const DEFS = `<defs>
  <pattern id="hatchG" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#ecebe7"/><line x1="0" y1="0" x2="0" y2="6" stroke="#b9b7b0" stroke-width="2"/></pattern>
  <pattern id="hatchR" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)"><rect width="6" height="6" fill="#f8e9e7"/><line x1="0" y1="0" x2="0" y2="6" stroke="${C.loss}" stroke-width="2"/></pattern>
</defs>`;

// Barra de objetivo (bullet bar)
function bullet(kind, p, max, min){
  const W = 440, H = 50, pad = 2, bh = 22, y = 6;
  const sx = v => pad + (v - min) / (max - min) * (W - 2*pad);
  const obj = kind === 'f' ? OBJ_F : OBJ_B;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="bul" role="img" aria-label="${kind==='f'?'Facturación':'Beneficio'} de ${esc(p.name)}">`;
  s += `<rect x="${sx(min)}" y="${y}" width="${sx(max)-sx(min)}" height="${bh}" rx="4" fill="${C.grid}"/>`;
  if (kind === 'f') {
    s += `<rect x="${sx(0)}" y="${y}" width="${Math.max(0,sx(TOPE_MILKY)-sx(0))}" height="${bh}" fill="none" stroke="${C.milky}" stroke-opacity=".25" stroke-dasharray="3 3" rx="4"/>`;
    const a = sx(0), b = sx(p.mfc), c = sx(p.mfc + p.pf), d = sx(p.mfc + p.pf + p.exc);
    s += seg(a, b, y, bh, C.milky, `<b>Milkys que computan</b><br>${eur(p.mfc,2)}${p.exc ? `<br><span class=m>Tope de Milkys: 7.500 €</span>` : ''}`, true, p.pf <= 0 && !p.exc);
    if (p.pf > 0) s += seg(b+2, c, y, bh, C.proj, `<b>Proyectos</b><br>${eur(p.pf,2)}`, false, !p.exc);
    if (p.exc) s += seg(c+2, d, y, bh, 'url(#hatchG)', `<b>Milkys por encima del tope</b><br>${eur(p.exc,2)} que no computan`, false, true);
    s += `<line x1="${sx(TOPE_MILKY)}" x2="${sx(TOPE_MILKY)}" y1="${y-3}" y2="${y+bh+3}" stroke="${C.milky}" stroke-width="1" stroke-dasharray="2 2"/>`;
  } else {
    const a = sx(0), b = sx(p.mb);
    s += seg(a, b, y, bh, C.milky, `<b>Beneficio Milkys</b><br>${eur(p.mb,2)}`, true, p.pb <= 0);
    if (p.pb > 0) s += seg(b+2, sx(p.mb + p.pb), y, bh, C.proj, `<b>Beneficio proyectos</b><br>${eur(p.pb,2)}`, false, true);
    else if (p.pb < 0) s += `<rect x="${sx(p.mb+p.pb)}" y="${y}" width="${b-sx(p.mb+p.pb)}" height="${bh}" fill="url(#hatchR)" data-tip="<b>Pérdida en proyectos</b><br>${eur(p.pb,2)}"/>`;
    if (min < 0) s += `<line x1="${sx(0)}" x2="${sx(0)}" y1="${y-2}" y2="${y+bh+2}" stroke="${C.soft}" stroke-width="1"/>`;
  }
  const ok = (kind === 'f' ? p.fc : p.bc) >= obj;
  s += `<line x1="${sx(obj)}" x2="${sx(obj)}" y1="${y-5}" y2="${y+bh+5}" stroke="${C.ink}" stroke-width="2.5"/>`;
  s += `<text x="${sx(obj)}" y="${H-4}" text-anchor="middle" class="tick">${kind==='f'?'15.000':'6.000'}</text>`;
  if (kind === 'f') s += `<text x="${sx(TOPE_MILKY)}" y="${H-4}" text-anchor="middle" class="tick m">tope 7.500</text>`;
  s += `</svg>`;
  return s;
}
function seg(x1, x2, y, h, fill, tip, roundL, roundR){
  if (x2 - x1 < 0.5) return '';
  const w = x2 - x1, r = Math.min(4, w/2);
  const tl = roundL ? r : 0, tr = roundR ? r : 0;
  const d = `M${x1+tl},${y} H${x2-tr} ${tr?`Q${x2},${y} ${x2},${y+tr}`:''} V${y+h-tr} ${tr?`Q${x2},${y+h} ${x2-tr},${y+h}`:''} H${x1+tl} ${tl?`Q${x1},${y+h} ${x1},${y+h-tl}`:''} V${y+tl} ${tl?`Q${x1},${y} ${x1+tl},${y}`:''} Z`;
  return `<path d="${d}" fill="${fill}" data-tip="${esc(tip)}"/>`;
}

function ring(r, color, label, sub){
  color = r >= 1 ? '#2a8a6a' : '#3b3a36';
  const R = 34, Cc = 2*Math.PI*R, v = Math.min(r, 1), over = r > 1;
  return `<svg viewBox="0 0 84 84" class="ring"><circle cx="42" cy="42" r="${R}" fill="none" stroke="${C.grid}" stroke-width="9"/>
    <circle cx="42" cy="42" r="${R}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${Cc*v} ${Cc}" transform="rotate(-90 42 42)"/>
    ${over ? `<circle cx="42" cy="42" r="${R-9}" fill="none" stroke="${color}" stroke-opacity=".25" stroke-width="3"/>` : ''}
    <text x="42" y="44" text-anchor="middle" class="rv">${pc(r)}</text><text x="42" y="57" text-anchor="middle" class="rl">${label}</text></svg>`;
}

function scatter(L){
  const W = 1100, H = 470, m = {l:64, r:24, t:20, b:50};
  const xmax = Math.max(1.5, ...L.map(p => p.rf)) * 1.05, ymax = Math.max(1.7, ...L.map(p => p.rb)) * 1.05;
  const xmin = Math.min(0.4, ...L.map(p => p.rf)) * 0.95, ymin = Math.min(0.3, ...L.map(p => p.rb)) * 0.95;
  const sx = v => m.l + (v - xmin) / (xmax - xmin) * (W - m.l - m.r), sy = v => H - m.b - (v - ymin) / (ymax - ymin) * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="sc" role="img" aria-label="Mapa del equipo">`;
  s += `<rect x="${sx(1)}" y="${m.t}" width="${W-m.r-sx(1)}" height="${sy(1)-m.t}" fill="#e6f2ed"/>`;
  s += `<text x="${W-m.r-8}" y="${m.t+18}" text-anchor="end" class="qz">Cumple los dos objetivos</text>`;
  for (let v = Math.ceil(xmin*4)/4; v <= xmax; v += 0.25) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${H-m.b}" stroke="${C.grid}"/><text x="${sx(v)}" y="${H-m.b+16}" text-anchor="middle" class="tick">${pc(v)}</text>`;
  for (let v = Math.ceil(ymin*4)/4; v <= ymax; v += 0.25) s += `<line x1="${m.l}" x2="${W-m.r}" y1="${sy(v)}" y2="${sy(v)}" stroke="${C.grid}"/><text x="${m.l-8}" y="${sy(v)+4}" text-anchor="end" class="tick">${pc(v)}</text>`;
  s += `<line x1="${sx(1)}" x2="${sx(1)}" y1="${m.t}" y2="${H-m.b}" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  s += `<line x1="${m.l}" x2="${W-m.r}" y1="${sy(1)}" y2="${sy(1)}" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  s += `<text x="${(m.l+W-m.r)/2}" y="${H-8}" text-anchor="middle" class="ax">Facturación respecto al objetivo de 15.000 €</text>`;
  s += `<text transform="translate(14 ${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle" class="ax">Beneficio respecto al objetivo de 6.000 €</text>`;
  // etiquetas a la derecha del punto, sin solaparse
  const pts = L.map(p => ({p, x: sx(p.rf), y: sy(p.rb)})).sort((a,b) => a.y - b.y);
  const boxes = [];
  for (const q of pts) {
    const w = q.p.name.length * 7.4 + 4; let right = q.x + 12 + w < W - m.r;
    let lx = right ? q.x + 12 : q.x - 12 - w, ly = q.y + 4;
    for (let k = 0; k < 30; k++) {
      const hit = boxes.find(o => lx < o.x + o.w && lx + w > o.x && Math.abs(o.y - ly) < 14);
      if (!hit) break; ly = hit.y + 14;
    }
    boxes.push({x:lx, y:ly, w});
    const both = q.p.rf >= 1 && q.p.rb >= 1;
    if (Math.abs(ly - (q.y + 4)) > 2) s += `<line x1="${q.x + (right ? 6 : -6)}" y1="${q.y}" x2="${right ? lx - 2 : lx + w + 2}" y2="${ly - 4}" stroke="#c9c7c0" stroke-width="1"/>`;
    s += `<g class="dot" data-name="${esc(q.p.name)}" data-tip="<b>${esc(q.p.name)}</b><br>Facturación: ${eur(q.p.fc)} (${pc(q.p.rf)})<br>Beneficio: ${eur(q.p.bc)} (${pc(q.p.rb)})">
      <circle cx="${q.x}" cy="${q.y}" r="14" fill="transparent"/>
      <circle cx="${q.x}" cy="${q.y}" r="7" fill="${both ? C.proj : '#fff'}" stroke="${both ? '#fff' : C.ink}" stroke-width="2"/></g>`;
    s += `<text x="${lx}" y="${ly}" class="lbl">${esc(q.p.name)}</text>`;
  }
  return s + `</svg>`;
}

function stackBars(L, kind){
  // "Lo que falta": barras horizontales ordenadas
  const key = kind === 'f' ? 'ff' : 'fb', obj = kind === 'f' ? OBJ_F : OBJ_B;
  const rows = [...L].sort((a,b) => b[key] - a[key]);
  const W = 600, rh = 26, H = rows.length*rh + 10, lab = 120;
  const max = Math.max(...rows.map(p => p[key]), 1);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="gap" role="img" aria-label="Lo que falta">`;
  rows.forEach((p,i) => {
    const y = 4 + i*rh, w = p[key] / max * (W - lab - 70);
    s += `<text x="${lab-8}" y="${y+14}" text-anchor="end" class="gl">${esc(p.name)}</text>`;
    if (p[key] <= 0) s += `<text x="${lab}" y="${y+14}" class="okt">✓ Cumplido</text>`;
    else s += `<rect x="${lab}" y="${y+4}" width="${Math.max(2,w)}" height="14" rx="4" fill="#5d6b78" data-tip="<b>${esc(p.name)}</b><br>Le faltan ${eur(p[key])} para ${eur(obj)}"/>
      <text x="${lab+w+6}" y="${y+15}" class="gv">${eur(p[key])}</text>`;
  });
  return s + `</svg>`;
}

function detail(p){
  const pro = p.proj.filter(x => Math.abs(x.f) > 0.5 || Math.abs(x.b) > 0.5);
  const max = Math.max(...pro.map(x => Math.abs(x.b)), ...pro.map(x => Math.abs(x.f)), 1);
  let h = `<table class="dt"><thead><tr><th>Proyecto o Milky</th><th class="r">Facturación</th><th></th><th class="r">Beneficio</th><th></th></tr></thead><tbody>`;
  for (const x of pro) {
    const col = x.t === 'm' ? C.milky : C.proj;
    const bar = (v) => `<div class="mb"><i style="width:${Math.abs(v)/max*100}%;background:${v<0?C.loss:col}"></i></div>`;
    h += `<tr><td><span class="sw" style="background:${col}"></span>${esc(x.p)}</td><td class="r num">${eur(x.f,2)}</td><td class="bc">${bar(x.f)}</td><td class="r num ${x.b<0?'neg':''}">${eur(x.b,2)}</td><td class="bc">${bar(x.b)}</td></tr>`;
  }
  return h + `</tbody></table>`;
}

const DATA_DATE = '2026-11-02';
const DEF_DEADLINE = '2027-06-30';   // fecha objetivo por defecto; se cambia desde la propia página
function getDeadline(){ try { return localStorage.getItem('rivia_deadline') || DEF_DEADLINE; } catch(e) { return DEF_DEADLINE; } }
function setDeadline(v){ try { localStorage.setItem('rivia_deadline', v); } catch(e) {} }
function monthsLeft(dl){ const a = new Date(DATA_DATE), b = new Date(dl); return Math.max(0, (b - a) / (1000*60*60*24*30.44)); }
const fdate = s => `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`;

// Si no viene GOALS precalculado, se calcula desde los datos de la web (misma fuente que la pestaña Personas)
function goalsFromRivia(){
  const D = window.RIVIA, P = D.projects, out = [];
  for (const [n, L] of Object.entries(D.persons)) {
    if (n === 'Fuera del equipo') continue;
    const t = {name:n, mf:0, mb:0, pf:0, pb:0, proj:[]};
    for (const e of L) { const pr = P[e.p], f = pr.f*e.fs, b = pr.b*e.bs, k = pr.type === 'Milky' ? 'm' : 'p';
      t[k+'f'] += f; t[k+'b'] += b; t.proj.push({p:pr.name, t:k, f, b}); }
    t.proj.sort((x,y) => y.b - x.b); out.push(t);
  }
  return out;
}

function path(p, months){
  // De dónde puede salir lo que falta
  const room = Math.max(0, TOPE_MILKY - p.mf);
  const fromMilky = Math.min(room, p.ff), fromProj = p.ff - fromMilky;
  const parts = [];
  if (p.ff > 0) {
    if (room <= 0) parts.push(`<b>Facturación:</b> ya tiene el tope de Milkys. Los <b>${eur(p.ff)}</b> que faltan tienen que salir de proyectos.`);
    else if (fromProj <= 0) parts.push(`<b>Facturación:</b> le faltan <b>${eur(p.ff)}</b> y le caben hasta ${eur(room)} más de Milkys, así que le vale cualquier cosa.`);
    else parts.push(`<b>Facturación:</b> de los <b>${eur(p.ff)}</b> que faltan, hasta ${eur(fromMilky)} pueden venir de Milkys y al menos <b>${eur(fromProj)}</b> de proyectos.`);
  } else parts.push(`<b>Facturación:</b> cumplido${p.exc ? `. Tiene ${eur(p.exc)} de Milkys por encima del tope que no computan` : ''}.`);
  if (p.fb > 0) parts.push(`<b>Beneficio:</b> faltan <b>${eur(p.fb)}</b>; cuentan igual Milkys y proyectos.`);
  else parts.push(`<b>Beneficio:</b> cumplido.`);
  if (months > 0 && (p.ff > 0 || p.fb > 0)) {
    const r = [];
    if (p.ff > 0) r.push(`${eur(p.ff/months)} de facturación`);
    if (p.fb > 0) r.push(`${eur(p.fb/months)} de beneficio`);
    parts.push(`<b>Ritmo:</b> ${r.join(' y ')} al mes hasta la fecha objetivo.`);
  }
  return parts.map(x => `<div>${x}</div>`).join('');
}
function chip(r, fal, label){
  return r >= 1 ? `<span class="chip ok">✓ ${label} ${pc(r)}</span>` : `<span class="chip no">${label} ${pc(r)} · faltan ${eur(fal)}</span>`;
}

function render(root){
  tip = document.getElementById('tip') || Object.assign(document.body.appendChild(document.createElement('div')), {id:'tip'});
  const L = (window.GOALS || goalsFromRivia()).map(calc);
  const nF = L.filter(p => p.rf >= 1).length, nB = L.filter(p => p.rb >= 1).length, n2 = L.filter(p => p.rf >= 1 && p.rb >= 1).length;
  const tf = L.reduce((s,p) => s+p.ff, 0), tb = L.reduce((s,p) => s+p.fb, 0);
  const fmax = Math.max(OBJ_F, ...L.map(p => p.mfc + p.pf + p.exc)) * 1.03;
  const bmax = Math.max(OBJ_B, ...L.map(p => p.mb + Math.max(0,p.pb))) * 1.05, bmin = Math.min(0, ...L.map(p => p.mb + p.pb));
  const projOnly = L.reduce((s,p) => s + Math.max(0, p.ff - Math.max(0, TOPE_MILKY - p.mf)), 0);
  const dl = getDeadline(), months = monthsLeft(dl);
  root.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${DEFS}</svg>
  <div class="dhead"><div><h1>Objetivos del equipo</h1><p class="sub">Cada persona tiene que llegar a <b>15.000 €</b> de facturación y <b>6.000 €</b> de beneficio. De la facturación de Milkys solo cuentan hasta <b>7.500 €</b>; en beneficio, los Milkys cuentan entero.</p></div>
    <div class="dl"><label>Fecha objetivo <input type="date" id="dl" value="${dl}"></label><span>${months > 0 ? `quedan ${nf(months,1)} meses desde el ${fdate(DATA_DATE)}` : 'fecha pasada'}</span></div></div>
  <div class="tiles">
    <div class="tile"><div class="tv">${nF}<small>/${L.length}</small></div><div class="tlab">llegan a 15.000 € de facturación</div>${pips(L,'rf')}</div>
    <div class="tile"><div class="tv">${nB}<small>/${L.length}</small></div><div class="tlab">llegan a 6.000 € de beneficio</div>${pips(L,'rb')}</div>
    <div class="tile"><div class="tv">${n2}<small>/${L.length}</small></div><div class="tlab">cumplen los dos objetivos</div>${pips(L,'both')}</div>
    <div class="tile"><div class="tv sm">${eur(tf)}</div><div class="tlab">de facturación que falta en el equipo. Al menos <b>${eur(projOnly)}</b> tiene que venir de proyectos.</div></div>
    <div class="tile"><div class="tv sm">${eur(tb)}</div><div class="tlab">de beneficio que falta en el equipo${months > 0 ? `: unos <b>${eur(tb/months)}</b> al mes` : ''}</div></div>
  </div>
  <div class="panel"><div class="ph"><h2>Persona a persona</h2>
    <div class="ctrl"><label>Ordenar por <select id="ord"><option value="falta">más lejos del objetivo</option><option value="rf">% facturación</option><option value="rb">% beneficio</option><option value="name">nombre</option></select></label></div></div>
    <div class="legend top"><span><i style="background:${C.milky}"></i>Milkys</span><span><i style="background:${C.proj}"></i>Proyectos</span><span><i class="hg"></i>Milkys por encima del tope (no computan)</span><span><i class="hr"></i>Pérdida en proyectos</span><span><i class="tg"></i>Objetivo</span></div>
    <div id="rows"></div></div>
  <div class="two">
    <div class="panel"><div class="ph"><h2>Lo que falta: facturación</h2></div>${stackBars(L,'f')}</div>
    <div class="panel"><div class="ph"><h2>Lo que falta: beneficio</h2></div>${stackBars(L,'b')}</div>
  </div>
  <div class="panel"><div class="ph"><h2>Mapa del equipo</h2><span class="hint">Cada punto es una persona. Arriba a la derecha de las líneas, objetivos cumplidos. Pincha en un punto para ir a su fila.</span></div><div class="scw">${scatter(L)}</div>
    <div class="legend"><span><i class="dotl"></i>Persona</span><span><i class="dotl ok"></i>Cumple los dos</span><span><i class="dash"></i>Objetivo (100 %)</span></div></div>
  <p class="foot">Facturación que computa = Milkys (hasta 7.500 €) + proyectos. Beneficio que computa = Milkys + proyectos. Cifras conciliadas con Holded a ${fdate(DATA_DATE)}, las mismas de la pestaña Personas. La fecha objetivo se guarda solo en este navegador.</p>`;
  const rowsEl = root.querySelector('#rows');
  const draw = () => {
    const k = root.querySelector('#ord').value;
    const S = [...L].sort((a,b) => k === 'name' ? a.name.localeCompare(b.name) : k === 'falta' ? (b.ff/OBJ_F + b.fb/OBJ_B) - (a.ff/OBJ_F + a.fb/OBJ_B) : b[k] - a[k]);
    rowsEl.innerHTML = S.map(p => `
      <div class="pr" data-n="${esc(p.name)}">
        <div class="who"><div class="pn">${esc(p.name)}</div><div class="chips">${chip(p.rf, p.ff, 'Facturación')}${chip(p.rb, p.fb, 'Beneficio')}</div><button class="more" aria-expanded="false">Ver de dónde sale ▾</button></div>
        <div class="bars">
          <div class="bl"><div class="bt"><span>Facturación que computa</span><b>${eur(p.fc)}</b></div>${bullet('f', p, fmax, 0)}</div>
          <div class="bl"><div class="bt"><span>Beneficio</span><b class="${p.bc<0?'neg':''}">${eur(p.bc)}</b></div>${bullet('b', p, bmax, bmin)}</div>
        </div>
        <div class="path">${path(p, months)}</div>
        <div class="det">${detail(p)}</div>
      </div>`).join('');
    rowsEl.querySelectorAll('.more').forEach(b => b.onclick = () => { const r = b.closest('.pr'); r.classList.toggle('open'); b.setAttribute('aria-expanded', r.classList.contains('open')); b.textContent = r.classList.contains('open') ? 'Ocultar ▴' : 'Ver de dónde sale ▾'; });
    bindTips(rowsEl);
  };
  root.querySelector('#ord').onchange = draw; draw();
  root.querySelector('#dl').onchange = e => { if (e.target.value) { setDeadline(e.target.value); render(root); } };
  bindTips(root.querySelector('.scw')); root.querySelectorAll('.gap').forEach(bindTips);
  root.querySelectorAll('.dot').forEach(d => d.addEventListener('click', () => {
    const el = rowsEl.querySelector(`.pr[data-n="${CSS.escape(d.dataset.name)}"]`); if (el) { el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1400); }
  }));
}
function pips(L, k){
  return `<div class="pips">${L.map(p => { const ok = k === 'both' ? (p.rf >= 1 && p.rb >= 1) : p[k] >= 1; return `<i class="${ok ? 'on' : ''}" title="${esc(p.name)}"></i>`; }).join('')}</div>`;
}
function status(f, what){ return f <= 0 ? `<span class="ok">✓ ${what} cumplido</span>` : `<span class="no">Faltan ${eur(f)} de ${what}</span>`; }
window.renderObjetivos = render;
})();
