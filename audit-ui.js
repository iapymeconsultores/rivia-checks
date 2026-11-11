// Pestañas Auditoría y Repaso uno a uno. Datos en audit.js (window.AUDIT).
(function(){
const A = window.AUDIT;
const OBJ_F = 15000, OBJ_B = 6000, TOPE = 7500;
const SC = {holded:'Holded tal cual', auditado:'Auditado', peor:'Peor caso IVA'};
const SCD = {
  holded:'Documentos de Holded sin anulados y con las devoluciones de compra bien restadas.',
  auditado:'Holded corregido: las líneas de servicios al 10 % pasan al 21 % y se quitan los duplicados claros.',
  peor:'Prueba de estrés: todo lo que está al 10 % (también comida) pasa al 21 %, más los duplicados.'
};
const FL = {
  error10:{t:'10 % en un servicio', c:'r', v:'Un servicio va al 21 %. Se recalcula al 21 % manteniendo lo cobrado.'},
  ok10:{t:'10 % en comida o bebida', c:'r', v:'Hostelería y alimentación van al 10 %. Correcto si es comida servida; se muestra cómo quedaría al 21 %.'},
  sin_iva:{t:'Sin IVA', c:'a', v:''},
  '21_comida':{t:'21 % en proyecto de comida', c:'a', v:'Correcto si no es comida (una TV, juguetes, una entrada). Si es comida iría al 10 %.'},
};
const SUBV = {extranjero:'Cliente o servicio fuera de España: puede ser no sujeto. ⚠ Confirmar con la gestoría.', revisar:'Venta en España sin IVA. Salvo exención, llevaría IVA. ⚠ Confirmar con la gestoría.'};

const n2 = v => { const s = Math.abs(v).toFixed(2).split('.'); return (v < 0 ? '-' : '') + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1]; };
const e = v => { v = Math.abs(v) < 0.005 ? 0 : v; return `<span class="num ${v < 0 ? 'neg' : ''}">${n2(v)} €</span>`; };
const g0 = v => (v < 0 ? '-' : '') + String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const e0 = v => `<span class="num">${g0(v)} €</span>`;
const sg = v => { v = Math.abs(v) < 0.005 ? 0 : v; return `<span class="num ${v < 0 ? 'neg' : v > 0 ? 'pos' : ''}">${v > 0 ? '+' : ''}${n2(v)} €</span>`; };
const fd = s => s ? `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}` : '';
const es = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pc = v => `${(v*100).toLocaleString('es-ES',{maximumFractionDigits:1})} %`;
const lk = (t, id, n) => (id && HOLDED[t]) ? `<a class="doclink" href="${HOLDED[t](id)}" target="_blank" rel="noopener" title="Abrir en Holded">${es(n)}</a>` : es(n);
const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(_) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(_) {} };
const comp = s => ({f: Math.min(s.mf, TOPE) + s.pf, b: s.mb + s.pb});
const PEOPLE = Object.keys(A.persons).filter(n => n !== 'Fuera del equipo').sort((a,b) => a.localeCompare(b,'es'));
const ESTADO = {'cuadra':['ok','Cuadra con el Excel'], 'no cuadra':['no','No cuadra'], 'sin excel':['na','Sin Excel']};
const est = s => { const x = ESTADO[s] || ['na', s || 'Sin Excel']; return `<span class="est ${x[0]}">${x[1]}</span>`; };

/* ---------- Auditoría ---------- */
function ivaRow(x){
  const f = FL[x.fl], is10 = x.r === 10;
  const alt = is10 ? x.b21 : x.bexp, dif = is10 ? x.d21 : x.dexp, rate = is10 ? 21 : x.exp;
  const ver = x.fl === 'sin_iva' ? SUBV[x.sub] || '' : f.v;
  return `<tr class="${is10 ? 'r10' : 'odd'}" data-fl="${x.fl}" data-q="${es((x.n+' '+x.p+' '+x.l+' '+x.c).toLowerCase())}">
    <td class="num keep">${fd(x.d)}</td>
    <td class="keep">${lk(x.t, x.id, x.n)}${x.an ? ' <span class="mini">anulada</span>' : ''}</td>
    <td><b>${es(x.p)}</b><div class="desc">${es(x.l)}${x.c ? ' · ' + es(x.c) : ''}</div></td>
    <td class="r">${e(x.base)}</td>
    <td class="c"><span class="rate ${is10 ? 'r10' : 'rx'}">${x.r === null || x.r === undefined ? 'sin' : x.r + ' %'}</span></td>
    <td class="r">${e(alt)}<div class="desc">al ${rate} %</div></td>
    <td class="r">${sg(dif)}</td>
    <td class="why"><span class="tagf ${f.c}">${f.t}</span><div class="desc">${es(ver)}</div></td></tr>`;
}
function renderAuditoria(app){
  const I = A.iva, P = A.projects;
  const IS = I.slice().sort((a,b) => a.d21 - b.d21 || a.dexp - b.dexp);
  const cnt = k => I.filter(x => x.fl === k), sum = (L, k) => L.reduce((a,x) => a + x[k], 0);
  const e10 = cnt('error10'), o10 = cnt('ok10'), sin = cnt('sin_iva'), c21 = cnt('21_comida');
  const all10 = I.filter(x => x.r === 10);
  const st = {cuadra:0,'no cuadra':0,'sin excel':0}; for (const p of Object.values(P)) st[p.estado || 'sin excel'] = (st[p.estado || 'sin excel'] || 0) + 1;
  const dupA = A.dups.filter(d => d.nivel === 'alto');
  // impacto por proyecto de las líneas al 10 %
  const byP = {}; for (const x of all10) { const q = byP[x.p] ||= {err:0, ok:0}; if (x.fl === 'error10') q.err += x.d21; else q.ok += x.d21; }
  const bp = Object.entries(byP).sort((a,b) => (a[1].err+a[1].ok) - (b[1].err+b[1].ok)).slice(0, 14);
  const mx = Math.max(...bp.map(([,v]) => -(v.err+v.ok)), 1);
  const tot = A.tot;
  app.innerHTML = `
  <div class="au">
  <h1>Auditoría: Holded frente a los Excels del equipo</h1>
  <p class="sub">Documentos de Holded a ${fd(A.date)}, comparados con los checkpoints individuales, el PANEL DE CONTROL, TOTAL 2 y DIAMANTE. Prioridad: el dinero que entra con factura en Holded al proyecto. Las líneas al 10 % van <span class="red">en rojo</span>. Todo lo marcado con ⚠ hay que confirmarlo con la gestoría.</p>

  <div class="scs">${['holded','auditado','peor'].map(k => `<div class="scc ${k}">
     <div class="sch">${SC[k]}</div><div class="scv"><div><small>Facturación</small>${e0(tot[k].f)}</div><div><small>Beneficio</small>${e0(tot[k].b)}</div></div>
     <div class="scd">${SCD[k]}</div>${k !== 'holded' ? `<div class="scx">Frente a Holded: ${sg(tot[k].f - tot.holded.f)} facturación · ${sg(tot[k].b - tot.holded.b)} beneficio</div>` : ''}</div>`).join('')}</div>

  <div class="kgrid">
    <a class="kq red" href="#iva" data-go="error10"><b>${e10.length}</b><span>líneas de servicios al 10 %</span><em>${sg(sum(e10,'d21'))} si van al 21 %</em></a>
    <a class="kq red2" href="#iva" data-go="ok10"><b>${o10.length}</b><span>líneas de comida al 10 %</span><em>${sg(sum(o10,'d21'))} en el peor caso</em></a>
    <a class="kq amb" href="#iva" data-go="sin_iva"><b>${sin.length}</b><span>líneas sin IVA</span><em>${e(sum(sin,'base'))} de base ⚠</em></a>
    <a class="kq amb" href="#iva" data-go="21_comida"><b>${c21.length}</b><span>al 21 % en proyectos de comida</span><em>revisar si era comida</em></a>
    <a class="kq" href="#dups"><b>${A.dups.length}</b><span>posibles duplicados</span><em>${dupA.length} muy probables, ${A.dups.length - dupA.length} a confirmar</em></a>
    <a class="kq" href="#proy"><b>${st['no cuadra']}</b><span>proyectos no cuadran con el Excel</span><em>${st.cuadra} cuadran · ${st['sin excel']} sin Excel</em></a>
  </div>

  <section class="panel" id="iva">
    <div class="ph"><h2>IVA línea a línea</h2><span class="hint">Se mantiene lo cobrado: base al 21 % = base × 1,10 / 1,21</span></div>
    <div class="impact"><div class="ih">Dónde pesa el 10 %: facturación que se pierde si esas líneas van al 21 %</div>
      ${bp.map(([p,v]) => `<div class="ib"><span class="il">${es(p)}</span><span class="it"><i class="e" style="width:${-v.err/mx*100}%"></i><i class="o" style="width:${-v.ok/mx*100}%"></i></span><span class="iv">${sg(v.err+v.ok)}</span></div>`).join('')}
      <div class="legend"><i class="sw e"></i>servicios al 10 % (error) <i class="sw o"></i>comida al 10 % (peor caso)</div></div>
    <div class="fbar">
      <div class="chips" id="ivaf">
        <button data-f="10" class="on">Todo al 10 % (${all10.length})</button><button data-f="error10">Servicios al 10 % (${e10.length})</button>
        <button data-f="ok10">Comida al 10 % (${o10.length})</button><button data-f="sin_iva">Sin IVA (${sin.length})</button>
        <button data-f="21_comida">21 % en comida (${c21.length})</button><button data-f="all">Todo (${I.length})</button></div>
      <input id="ivaq" type="search" placeholder="Buscar documento, proyecto, concepto…">
    </div>
    <div class="tscroll"><table class="docs ivat"><thead><tr><th>Fecha</th><th>Documento</th><th>Proyecto y concepto</th><th class="r">Base en Holded</th><th class="c">IVA</th><th class="r">Base recalculada</th><th class="r">Diferencia</th><th>Lectura</th></tr></thead>
      <tbody id="ivab">${IS.map(ivaRow).join('')}</tbody></table></div>
    <div class="foot" id="ivas"></div>
  </section>

  <section class="panel" id="dups">
    <div class="ph"><h2>Posibles duplicados</h2><span class="hint">Mismo importe, mismo proveedor o cliente y fechas iguales o muy cercanas</span></div>
    <div class="dgrid">${A.dups.map(d => `<div class="dc ${d.nivel}">
      <div class="dt1"><span class="lvl">${d.nivel === 'alto' ? 'Muy probable' : 'A confirmar ⚠'}</span><b>${e(d.total)}</b></div>
      <div class="dp">${es(d.p)} · ${es(d.contacto)}</div>
      <div class="dd"><div>${lk(d.at, d.a, d.an || 'borrador')}<small>${fd(d.ad)} · ${es(d.adesc || '')}</small></div><span class="eq">=</span><div>${lk(d.bt, d.b, d.bn || 'borrador')}<small>${fd(d.bd)} · ${es(d.bdesc || '')}</small></div></div>
      <div class="desc">${d.g === 'sale' ? 'Venta' : 'Compra'} · base ${e(d.base)}${d.nivel === 'alto' ? ' · se resta en el escenario auditado' : ' · no se toca hasta confirmarlo'}</div></div>`).join('')}</div>
  </section>

  <section class="panel" id="proy">
    <div class="ph"><h2>Proyecto a proyecto</h2>
      <div class="chips" id="pf"><button data-f="no cuadra" class="on">No cuadran (${st['no cuadra']})</button><button data-f="cuadra">Cuadran (${st.cuadra})</button><button data-f="sin excel">Sin Excel (${st['sin excel']})</button><button data-f="all">Todos</button></div></div>
    <div class="tscroll"><table class="docs pt"><thead><tr><th>Proyecto</th><th>Estado</th><th class="r">Excel checkpoint</th><th class="r">Holded</th><th class="r">Diferencia</th><th class="r">Auditado</th><th class="r">Peor caso</th><th class="r">PANEL</th></tr></thead>
    <tbody id="ptb">${Object.entries(P).sort((a,b) => Math.abs(b[1].dif ? b[1].dif[0] : 0) + Math.abs(b[1].dif ? b[1].dif[1] : 0) - Math.abs(a[1].dif ? a[1].dif[0] : 0) - Math.abs(a[1].dif ? a[1].dif[1] : 0)).map(([g,p]) => {
      const two = (o, k='f') => o ? `<div>${e(o.f)}</div><div class="bb">${e(o.b)}</div>` : '<span class="muted">·</span>';
      return `<tr class="pr2" data-e="${p.estado || 'sin excel'}"><td><a href="#/proyecto/${encodeURIComponent(g)}">${es(g)}</a>${p.type === 'Milky' ? ' <span class="pill m">Milky</span>' : ''}${p.iva < -0.005 ? ` <span class="rate r10" title="Líneas de servicio al 10 %">10 %</span>` : ''}
        <div class="desc">${p.first ? fd(p.first) + ' a ' + fd(p.last) + ' · ' + p.nd + ' docs' : 'sin documentos'}${p.ck ? ' · Excel: ' + es(p.ck.csv) : ''}</div>
        ${p.exp && p.exp.length ? `<ul class="exp">${p.exp.map(x => `<li>${es(x)}</li>`).join('')}</ul>` : ''}</td>
        <td>${est(p.estado)}</td><td class="r">${two(p.ck)}</td><td class="r">${two(p.s.holded)}</td>
        <td class="r">${p.dif ? `<div>${sg(p.dif[0])}</div><div class="bb">${sg(p.dif[1])}</div>` : ''}</td>
        <td class="r">${two(p.s.auditado)}</td><td class="r">${two(p.s.peor)}</td><td class="r">${two(p.panel)}</td></tr>`; }).join('')}</tbody></table></div>
    <div class="foot">En cada celda: arriba facturación, abajo beneficio. Diferencia = Holded menos Excel. Las explicaciones solo dicen lo que se puede comprobar con documentos de Holded.</div>
  </section>
  </div>`;

  const body = app.querySelector('#ivab'), q = app.querySelector('#ivaq'), sm = app.querySelector('#ivas');
  let f = '10';
  const apply = () => {
    const s = q.value.trim().toLowerCase(); let n = 0, d = 0, b = 0;
    body.querySelectorAll('tr').forEach((tr, i) => {
      const x = IS[i];
      const okf = f === 'all' || (f === '10' ? tr.classList.contains('r10') : tr.dataset.fl === f);
      const show = okf && (!s || tr.dataset.q.includes(s));
      tr.style.display = show ? '' : 'none';
      if (show) { n++; b += x.base; d += x.r === 10 ? x.d21 : x.dexp; }
    });
    sm.innerHTML = `${n} líneas · base ${e(b)} · diferencia si se recalculan ${sg(d)}`;
  };
  app.querySelectorAll('#ivaf button').forEach(bt => bt.onclick = () => { app.querySelectorAll('#ivaf button').forEach(x => x.classList.toggle('on', x === bt)); f = bt.dataset.f; apply(); });
  app.querySelectorAll('.kq[data-go]').forEach(a => a.onclick = ev => { ev.preventDefault(); const bt = app.querySelector(`#ivaf button[data-f="${a.dataset.go}"]`); bt.click(); document.getElementById('iva').scrollIntoView({behavior:'smooth'}); });
  app.querySelectorAll('.kq:not([data-go])').forEach(a => a.onclick = ev => { ev.preventDefault(); document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'}); });
  q.oninput = apply; apply();
  const pb = app.querySelectorAll('#ptb tr');
  const pfil = v => pb.forEach(tr => tr.style.display = (v === 'all' || tr.dataset.e === v) ? '' : 'none');
  app.querySelectorAll('#pf button').forEach(bt => bt.onclick = () => { app.querySelectorAll('#pf button').forEach(x => x.classList.toggle('on', x === bt)); pfil(bt.dataset.f); });
  pfil('no cuadra');
}

/* ---------- Repaso uno a uno ---------- */
function lanes(rows, goal, cap){
  const mx = Math.max(goal * 1.15, ...rows.map(r => r.m + r.p)) ;
  return `<div class="lanes">${rows.map(r => {
    const tot = r.m + r.p, ok = tot >= goal - 0.005;
    return `<div class="lane ${r.k}"><span class="ln">${r.l}</span>
      <span class="lt"><i class="m" style="width:${Math.max(r.m,0)/mx*100}%"></i><i class="p ${r.p < 0 ? 'neg' : ''}" style="width:${Math.max(r.p,0)/mx*100}%"></i><b class="goal" style="left:${goal/mx*100}%"></b></span>
      <span class="lv ${ok ? 'ok' : ''}">${e0(tot)}<small>${ok ? 'cumple' : 'faltan ' + g0(goal - tot) + ' €'}</small></span></div>`; }).join('')}
    <div class="lscale"><span style="left:${goal/mx*100}%">objetivo ${g0(goal)} €</span></div></div>`;
}
function renderRepaso(app, who){
  const done = get('rivia_repaso', {});
  let i = Math.max(0, PEOPLE.indexOf(who)); const n = PEOPLE[i], p = A.persons[n];
  const H = comp(p.s.holded), AU = comp(p.s.auditado), PE = comp(p.s.peor), t2 = p.t2;
  const mcap = s => Math.min(s.mf, TOPE);
  const rowsF = [
    t2 && {k:'xl', l:'Excel equipo', m:t2.mck, p:t2.proj},
    {k:'h', l:'Holded', m:mcap(p.s.holded), p:p.s.holded.pf},
    {k:'a', l:'Auditado', m:mcap(p.s.auditado), p:p.s.auditado.pf},
    {k:'w', l:'Peor caso', m:mcap(p.s.peor), p:p.s.peor.pf}].filter(Boolean);
  const rowsB = [
    t2 && {k:'xl', l:'Excel equipo', m:0, p:t2.b},
    {k:'h', l:'Holded', m:p.s.holded.mb, p:p.s.holded.pb},
    {k:'a', l:'Auditado', m:p.s.auditado.mb, p:p.s.auditado.pb},
    {k:'w', l:'Peor caso', m:p.s.peor.mb, p:p.s.peor.pb}].filter(Boolean);
  const verdict = (x, g) => x >= g - 0.005 ? 'ok' : 'no';
  const br = p.br.filter(b => b.type !== 'Milky'), mk = p.br.filter(b => b.type === 'Milky');
  // puntos para la reunión, solo hechos
  const pts = [];
  if (t2) {
    const d = H.f - t2.fck;
    if (Math.abs(d) >= 50) pts.push(`Holded le da ${sg(d)} de facturación computable frente al Excel del equipo (TOTAL 2).`);
    const db = H.b - t2.b; if (Math.abs(db) >= 50) pts.push(`En beneficio la diferencia con TOTAL 2 es ${sg(db)}.`);
  }
  const big = p.br.filter(b => b.ckf || b.ckb).map(b => ({...b, df: b.h.holded.f - b.ckf, db: b.h.holded.b - b.ckb})).filter(b => Math.abs(b.df) >= 50 || Math.abs(b.db) >= 50).sort((a,b) => Math.abs(b.df)+Math.abs(b.db) - Math.abs(a.df) - Math.abs(a.db)).slice(0,4);
  for (const b of big) pts.push(`<b>${es(b.g)}</b>: frente a su checkpoint, Holded da ${[Math.abs(b.df) >= 0.5 ? sg(b.df) + ' de facturación' : '', Math.abs(b.db) >= 0.5 ? sg(b.db) + ' de beneficio' : ''].filter(Boolean).join(' y ')}.`);
  const noXl = p.br.filter(b => !b.ckf && !b.ckb && Math.abs(b.h.holded.f) + Math.abs(b.h.holded.b) >= 20);
  if (noXl.length) pts.push(`Proyectos con dinero en Holded que no están en su checkpoint: ${noXl.map(b => `<b>${es(b.g)}</b> (${e(b.h.holded.f)})`).join(', ')}.`);
  const ivaE = p.br.reduce((s,b) => s + b.iva, 0), ivaA = p.br.reduce((s,b) => s + b.ivaall, 0);
  if (ivaE < -1) pts.push(`<span class="red">Servicios facturados al 10 %</span> en sus proyectos: pasar al 21 % le resta ${sg(ivaE)} de facturación.`);
  if (ivaA - ivaE < -1) pts.push(`Comida al 10 %: en el peor caso perdería ${sg(ivaA - ivaE)} más.`);
  if (H.f >= OBJ_F && PE.f < OBJ_F) pts.push(`Cumple facturación con Holded, pero no en el peor caso de IVA. ⚠ Depende de lo que diga la gestoría.`);
  if (t2 && t2.mreal > t2.mck + 0.5) pts.push(`Milkys: tiene ${e(t2.mreal)}, pero solo computan ${e(TOPE)} para facturación.`);

  const projRow = b => {
    const df = b.h.holded.f - b.ckf, db = b.h.holded.b - b.ckb, hasX = b.ckf || b.ckb, P = A.projects[b.g];
    const ivl = A.iva.filter(x => x.r === 10 && (P.ids || []).includes(x.pid)).sort((a,b) => a.d21 - b.d21);
    return `<details class="rp ${b.estado === 'no cuadra' ? 'warn' : ''}">
      <summary><span class="rn">${es(b.g)}${b.type === 'Milky' ? ' <span class="pill m">Milky</span>' : ''}${b.iva < -0.005 ? ' <span class="rate r10">10 %</span>' : ''}<small>${pc(b.fs)} facturación · ${pc(b.bs)} beneficio</small></span>
        <span class="rc"><small>Excel</small>${hasX ? e(b.ckf) : '<span class="muted">no está</span>'}<i>${hasX ? e(b.ckb) : ''}</i></span>
        <span class="rc"><small>Holded</small>${e(b.h.holded.f)}<i>${e(b.h.holded.b)}</i></span>
        <span class="rc"><small>Diferencia</small>${hasX ? sg(df) : ''}<i>${hasX ? sg(db) : ''}</i></span>
        <span class="rc"><small>Auditado</small>${e(b.h.auditado.f)}<i>${e(b.h.auditado.b)}</i></span>
        <span class="rc"><small>Estado</small>${est(b.estado)}</span></summary>
      <div class="rb">
        ${P.exp && P.exp.length ? `<ul class="exp">${P.exp.map(x => `<li>${es(x)}</li>`).join('')}</ul>` : '<p class="muted">Sin diferencias que explicar.</p>'}
        ${ivl.length ? `<div class="mini10"><b>Líneas al 10 % del proyecto</b> (importe del proyecto completo):<ul>${ivl.slice(0,12).map(x => `<li><span class="rate r10">10 %</span> ${lk(x.t, x.id, x.n)} · ${fd(x.d)} · ${es(x.l)} · base ${e(x.base)} → ${e(x.b21)} al 21 % (${sg(x.d21)})${x.fl === 'error10' ? ' · servicio' : ' · comida'}</li>`).join('')}${ivl.length > 12 ? `<li class="muted">y ${ivl.length - 12} líneas más en la pestaña Auditoría</li>` : ''}</ul></div>` : ''}
        <a href="#/proyecto/${encodeURIComponent(b.g)}">Ver todos los documentos del proyecto</a></div></details>`;
  };
  app.innerHTML = `<div class="rv">
    <div class="steps">${PEOPLE.map((x, j) => `<a href="#/repaso/${encodeURIComponent(x)}" class="${j === i ? 'cur' : ''} ${done[x] ? 'done' : ''}" title="${es(x)}"><span class="dot">${done[x] ? '✓' : (x.split(' ').map(w => w[0]).join('').slice(0,2))}</span><span class="sn">${es(PEOPLE.filter(y => y.split(' ')[0] === x.split(' ')[0]).length > 1 ? x : x.split(' ')[0])}</span></a>`).join('')}
      <div class="sline"><i style="width:${PEOPLE.filter(x => done[x]).length / PEOPLE.length * 100}%"></i></div></div>
    <div class="rhead">
      <div><div class="rk">Persona ${i+1} de ${PEOPLE.length}</div><h1>${es(n)}</h1>
        <div class="vv"><span class="v ${verdict(H.f, OBJ_F)}">Facturación ${verdict(H.f, OBJ_F) === 'ok' ? 'cumplida' : 'pendiente'}</span><span class="v ${verdict(H.b, OBJ_B)}">Beneficio ${verdict(H.b, OBJ_B) === 'ok' ? 'cumplido' : 'pendiente'}</span><span class="vs">según Holded</span></div></div>
      <div class="nv"><a class="nb" href="#/repaso/${encodeURIComponent(PEOPLE[(i - 1 + PEOPLE.length) % PEOPLE.length])}" title="Anterior (←)">←</a>
        <button class="mk ${done[n] ? 'on' : ''}" id="mk">${done[n] ? '✓ Revisado' : 'Marcar revisado'}</button>
        <a class="nb" href="#/repaso/${encodeURIComponent(PEOPLE[(i + 1) % PEOPLE.length])}" title="Siguiente (→)">→</a></div>
    </div>
    <div class="two2">
      <section class="panel"><div class="ph"><h2>Facturación computable</h2><span class="hint">Milkys hasta ${g0(TOPE)} € + proyectos</span></div>${lanes(rowsF, OBJ_F)}
        <div class="legend"><i class="sw m"></i>Milkys <i class="sw p"></i>Proyectos <i class="sw g"></i>Objetivo</div></section>
      <section class="panel"><div class="ph"><h2>Beneficio</h2><span class="hint">Milkys al 100 % + proyectos</span></div>${lanes(rowsB, OBJ_B)}
        <div class="legend"><i class="sw m"></i>Milkys <i class="sw p"></i>Proyectos${t2 ? ' <span class="muted">· TOTAL 2 no separa Milkys en beneficio</span>' : ''}</div></section>
    </div>
    <section class="panel talk"><div class="ph"><h2>Para hablar en la reunión</h2><span class="hint">Solo hechos comprobables con documentos</span></div>
      ${pts.length ? `<ol>${pts.map(x => `<li>${x}</li>`).join('')}</ol>` : '<p class="muted">Holded y el Excel coinciden. Nada que discutir.</p>'}
      <div class="refs">${t2 ? `TOTAL 2: facturación para checks ${e(t2.fck)} (real ${e(t2.freal)}), beneficio ${e(t2.b)}.` : ''} ${p.dia ? `DIAMANTE: facturación ${e(p.dia.f)}, margen bruto ${e(p.dia.b)}. ⚠ DIAMANTE no coincide con TOTAL 2 y no dice qué incluye.` : ''}</div></section>
    <section class="panel"><div class="ph"><h2>Proyectos</h2><span class="hint">Arriba facturación, abajo beneficio, ya con su porcentaje en cada proyecto</span></div>
      ${br.map(projRow).join('')}
      ${mk.length ? `<h3 class="mh">Milkys</h3>${mk.map(projRow).join('')}` : ''}</section>
  </div>`;
  app.querySelector('#mk').onclick = () => { const d = get('rivia_repaso', {}); d[n] = !d[n]; put('rivia_repaso', d); renderRepaso(app, n); };
}
document.addEventListener('keydown', ev => {
  if (!location.hash.startsWith('#/repaso') || /input|textarea|select/i.test(ev.target.tagName)) return;
  const cur = decodeURIComponent(location.hash.split('/')[2] || PEOPLE[0]), i = Math.max(0, PEOPLE.indexOf(cur));
  if (ev.key === 'ArrowRight') location.hash = '#/repaso/' + encodeURIComponent(PEOPLE[(i + 1) % PEOPLE.length]);
  if (ev.key === 'ArrowLeft') location.hash = '#/repaso/' + encodeURIComponent(PEOPLE[(i - 1 + PEOPLE.length) % PEOPLE.length]);
});
window.renderAuditoria = renderAuditoria;
window.renderRepaso = renderRepaso;
})();
