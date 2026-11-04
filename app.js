// Enlaces a Holded por tipo de documento. Si Holded cambia sus rutas, se cambian aquí.
const HOLDED = {
  venta:        id => `https://app.holded.com/sales/revenue#open:invoice-${id}`,
  ticket:       id => `https://app.holded.com/sales/revenue#open:salesreceipt-${id}`,
  venta_rect:   id => `https://app.holded.com/sales/revenue#open:creditnote-${id}`,
  compra:       id => `https://app.holded.com/expenses/list#open:purchase-${id}`,
  devol_compra: id => `https://app.holded.com/expenses/list#open:purchaserefund-${id}`,
};
const TIPO = {venta:'Factura venta', ticket:'Ticket venta', venta_rect:'Rectificativa venta', compra:'Factura compra', devol_compra:'Devolución compra'};
const FUERA = 'Fuera del equipo';
const D = window.RIVIA, P = D.projects;

const nf = v => { const s = Math.abs(v).toFixed(2).split('.'); return (v < 0 ? '-' : '') + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1]; };
const eur = v => { v = Math.abs(v) < 0.005 ? 0 : v; return `<span class="num ${v < 0 ? 'neg' : ''}">${nf(v)} €</span>`; };
const pct = v => `${(v*100).toLocaleString('es-ES',{maximumFractionDigits:1})} %`;
const fdate = s => s ? `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}` : '';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug = s => encodeURIComponent(s);
const app = document.getElementById('app');

function personTotals(name){
  const t = {mf:0,mb:0,pf:0,pb:0,n:0};
  for (const e of D.persons[name] || []) {
    const pr = P[e.p], f = pr.f*e.fs, b = pr.b*e.bs;
    if (pr.type === 'Milky') { t.mf += f; t.mb += b; } else { t.pf += f; t.pb += b; }
    t.n++;
  }
  return t;
}
function teamOrder(){
  return Object.keys(D.persons).filter(n => n !== FUERA)
    .sort((a,b) => { const A=personTotals(a), B=personTotals(b); return (B.pf+B.mf)-(A.pf+A.mf); });
}
function setNav(k){ document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.dataset.k === k)); }

function docLink(d){
  if (!d.id || !HOLDED[d.t]) return esc(d.n);
  return `<a class="doclink" href="${HOLDED[d.t](d.id)}" target="_blank" rel="noopener" title="Abrir en Holded">${esc(d.n)}</a>`;
}
function docRows(pr, fs, bs, q){
  let rows = '', sf = 0, sb = 0;
  const showPerson = fs !== null;
  for (const d of pr.docs) {
    if (q && !(`${d.n} ${d.c} ${d.x}`.toLowerCase().includes(q))) continue;
    const pf = showPerson ? d.f*fs : d.f, pb = showPerson ? d.b*bs : d.b;
    sf += pf; sb += pb;
    const tags = `<span class="tag t-${d.t}">${TIPO[d.t]}</span>` + (d.an ? ' <span class="tag t-an">Anulado sin cobro</span>' : '') + (d.dr ? ' <span class="tag t-dr">Borrador</span>' : '');
    rows += `<tr class="${d.an ? 'an' : ''}">
      <td class="num keep">${fdate(d.d)}</td>
      <td class="keep">${tags}<br>${docLink(d)}</td>
      <td>${esc(d.c) || '<span class="muted">Sin contacto</span>'}<div class="desc">${esc(d.x)}${d.proj ? ` · proyecto Holded: ${esc(d.proj)}` : ''}</div></td>
      <td class="r">${d.t === 'compra' ? eur(-d.full) : eur(d.full)}</td>
      ${showPerson ? `<td class="r">${eur(pf)}</td><td class="r">${eur(pb)}</td>` : `<td class="r">${eur(d.f)}</td><td class="r">${eur(d.b)}</td>`}
    </tr>`;
  }
  if (!q) for (const a of pr.adj) {
    const pf = showPerson ? a.f*fs : a.f, pb = showPerson ? a.b*bs : a.b;
    sf += pf; sb += pb;
    rows += `<tr class="adj"><td></td><td><span class="tag t-adj">${a.k === 'sinapi' ? 'Gasto sin factura' : 'Redondeo'}</span></td><td>${esc(a.lbl)}</td><td class="r">${eur(a.b)}</td>
      <td class="r">${eur(pf)}</td><td class="r">${eur(pb)}</td></tr>`;
  }
  rows += `<tr class="sum"><td></td><td colspan="3">${q ? 'Suma de los documentos filtrados' : 'Total del proyecto'}${showPerson ? ' para esta persona' : ''}</td><td class="r">${eur(sf)}</td><td class="r">${eur(sb)}</td></tr>`;
  return `<div class="tscroll"><table class="docs"><thead><tr><th>Fecha</th><th>Documento</th><th>Cliente / proveedor y concepto</th><th class="r">Importe en el proyecto</th>
    <th class="r">${showPerson ? 'Facturación persona' : 'Facturación'}</th><th class="r">${showPerson ? 'Beneficio persona' : 'Beneficio'}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function node(pr, fs, bs, opts = {}){
  const f = fs !== null ? pr.f*fs : pr.f, b = bs !== null ? pr.b*bs : pr.b;
  const cls = `node ${pr.type === 'Milky' ? 'milky' : ''} ${b < -0.004 ? 'isneg' : ''} ${opts.open ? 'open' : ''}`;
  const period = pr.first ? `${fdate(pr.first)} a ${fdate(pr.last)} · ${pr.docs.length} documentos` : 'Sin documentos en Holded';
  const share = fs !== null ? `<div class="share">Parte de esta persona: ${pct(fs)} de la facturación y ${pct(bs)} del beneficio del proyecto. Proyecto completo: facturación ${eur(pr.f)}, beneficio ${eur(pr.b)}.${pr.note ? ' ' + esc(pr.note) : ''}</div>` : '';
  return `<div class="${cls}" data-p="${esc(pr.name)}">
    <div class="nh" onclick="this.parentNode.classList.toggle('open')">
      <div><span class="chev">▶</span> <span class="pn">${esc(pr.name)}</span> ${pr.type === 'Milky' ? '<span class="pill m">Milky</span>' : ''}<div class="pd">${period}</div></div>
      <div class="col hide"><small>Facturación</small>${eur(f)}</div>
      <div class="col"><small>Beneficio</small>${eur(b)}</div>
      <div class="col hide"><small>Enlace</small><a href="#/proyecto/${slug(pr.name)}" onclick="event.stopPropagation()">ver proyecto</a></div>
    </div>
    <div class="nb">${share}${docRows(pr, fs, bs, opts.q)}</div></div>`;
}

function viewPersonas(){
  setNav('personas');
  const names = teamOrder();
  let tf = 0, tb = 0;
  for (const n of Object.keys(D.persons)) { const t = personTotals(n); tf += t.mf+t.pf; tb += t.mb+t.pb; }
  const sa = Object.values(P).filter(p => !Object.keys(p.part).length);
  const saf = sa.reduce((s,p) => s+p.f, 0), sab = sa.reduce((s,p) => s+p.b, 0);
  const maxv = Math.max(...names.map(n => { const t = personTotals(n); return t.mf+t.pf; }));
  let cards = '';
  for (const n of [...names, FUERA]) {
    const t = personTotals(n), F = t.mf+t.pf, B = t.mb+t.pb;
    cards += `<a class="card" href="#/persona/${slug(n)}">
      <div class="nm">${esc(n)}</div>
      <div class="row"><span class="muted">Facturación</span>${eur(F)}</div>
      <div class="row"><span class="muted">Beneficio</span>${eur(B)}</div>
      <div class="row"><span class="muted">Proyectos y Milkys</span><span>${t.n}</span></div>
      <div class="bar" title="Milkys / proyectos"><i class="m" style="width:${Math.max(0,t.mf)/maxv*100}%"></i><i class="p" style="width:${Math.max(0,t.pf)/maxv*100}%"></i></div>
    </a>`;
  }
  app.innerHTML = `<h1>Checks por persona</h1>
    <p class="sub">Cada importe sale de un documento de Holded. Pincha en una persona para ver su línea temporal con el enlace a cada factura, ticket o compra.</p>
    <div class="kpis">
      <div class="kpi"><div class="l">Facturación total</div><div class="v">${eur(tf+saf)}</div><div class="h">Repartida: ${eur(tf)}</div></div>
      <div class="kpi"><div class="l">Beneficio total</div><div class="v">${eur(tb+sab)}</div><div class="h">Repartido: ${eur(tb)}</div></div>
      <div class="kpi"><div class="l">Sin asignar a nadie</div><div class="v">${eur(sab)}</div><div class="h">${sa.length} proyectos · <a href="#/proyectos">ver</a></div></div>
      <div class="kpi"><div class="l">Personas</div><div class="v">${names.length}</div><div class="h">más "${FUERA}"</div></div>
    </div>
    <div class="legend">Barra de facturación: <b style="background:var(--milky)"></b>Milkys (base cerrada) <b style="background:var(--acc)"></b>Proyectos</div>
    <h2>Equipo</h2><div class="grid">${cards}</div>`;
}

function viewPersona(name){
  setNav('personas');
  const t = personTotals(name), list = D.persons[name] || [];
  const milk = list.filter(e => P[e.p].type === 'Milky').sort((a,b) => (P[a.p].first||'').localeCompare(P[b.p].first||''));
  const pro = list.filter(e => P[e.p].type !== 'Milky').sort((a,b) => (P[a.p].first||'').localeCompare(P[b.p].first||''));
  const extra = name === FUERA ? '<div class="note w">Mario y Aketza ya no están en el equipo. Su parte se queda aquí y no se reparte entre el resto.</div>' : '';
  app.innerHTML = `<a class="back" href="#/personas">← Todas las personas</a>
    <h1>${esc(name)}</h1><p class="sub">Línea temporal de todo lo que suma o resta a sus checks, documento a documento.</p>${extra}
    <div class="split">
      <div><div class="t">Base: Milkys (cerrados)</div><div class="a"><span>Facturación</span>${eur(t.mf)}</div><div class="a"><span>Beneficio</span>${eur(t.mb)}</div></div>
      <div><div class="t">Proyectos</div><div class="a"><span>Facturación</span>${eur(t.pf)}</div><div class="a"><span>Beneficio</span>${eur(t.pb)}</div></div>
      <div><div class="t">Total</div><div class="a"><span>Facturación</span>${eur(t.mf+t.pf)}</div><div class="a"><span>Beneficio</span>${eur(t.mb+t.pb)}</div></div>
    </div>
    <div class="tools"><input id="q" placeholder="Buscar nº de documento, cliente o concepto"><button class="btn" id="all">Desplegar todo</button><button class="btn" id="none">Plegar todo</button></div>
    <h2>Punto de partida: Milkys</h2><p class="sub">Los Milkys están cerrados en su mayoría. Son la base sobre la que se suman los proyectos.</p>
    <div class="tl" id="tlm">${milk.map(e => node(P[e.p], e.fs, e.bs)).join('') || '<p class="muted">Sin Milkys.</p>'}</div>
    <h2>Proyectos</h2><div class="tl" id="tlp">${pro.map(e => node(P[e.p], e.fs, e.bs)).join('') || '<p class="muted">Sin proyectos.</p>'}</div>`;
  const q = document.getElementById('q');
  q.oninput = () => {
    const v = q.value.trim().toLowerCase();
    const has = e => !v || P[e.p].docs.some(d => `${d.n} ${d.c} ${d.x}`.toLowerCase().includes(v));
    document.getElementById('tlp').innerHTML = pro.filter(has).map(e => node(P[e.p], e.fs, e.bs, {q:v, open:!!v})).join('') || '<p class="muted">Nada coincide.</p>';
    document.getElementById('tlm').innerHTML = milk.filter(has).map(e => node(P[e.p], e.fs, e.bs, {q:v, open:!!v})).join('') || '<p class="muted">Nada coincide.</p>';
  };
  document.getElementById('all').onclick = () => document.querySelectorAll('.node').forEach(n => n.classList.add('open'));
  document.getElementById('none').onclick = () => document.querySelectorAll('.node').forEach(n => n.classList.remove('open'));
}

function viewProyectos(){
  setNav('proyectos');
  const rows = Object.values(P).sort((a,b) => (a.type === b.type ? (a.first||'9').localeCompare(b.first||'9') : (a.type==='Proyecto'?-1:a.type==='Milky'?(b.type==='Proyecto'?1:-1):1)));
  let tb = '';
  for (const p of rows) {
    const ppl = Object.keys(p.part);
    const pill = p.type === 'Milky' ? '<span class="pill m">Milky</span>' : p.type === 'Proyecto' ? '<span class="pill p">Proyecto</span>' : '<span class="pill s">Sin personas</span>';
    tb += `<tr><td><a href="#/proyecto/${slug(p.name)}">${esc(p.name)}</a></td><td>${pill}</td><td class="num">${fdate(p.first)}</td><td class="num">${fdate(p.last)}</td><td class="r">${p.docs.length}</td>
      <td class="r">${eur(p.f)}</td><td class="r">${eur(p.b)}</td><td>${ppl.length ? ppl.map(esc).join(', ') : '<span class="muted">Sin asignar</span>'}</td></tr>`;
  }
  app.innerHTML = `<h1>Proyectos</h1><p class="sub">Todos los proyectos de Holded con sus cifras conciliadas y las personas que participan.</p>
    <div class="tscroll"><table class="list"><thead><tr><th>Proyecto</th><th>Tipo</th><th>Primera factura</th><th>Última factura</th><th class="r">Docs</th><th class="r">Facturación</th><th class="r">Beneficio</th><th>Personas</th></tr></thead><tbody>${tb}</tbody></table></div>`;
}

function viewProyecto(name){
  setNav('proyectos');
  const p = P[name];
  if (!p) { app.innerHTML = '<p>Proyecto no encontrado.</p>'; return; }
  let reparto = '';
  for (const [n, s] of Object.entries(p.part).sort((a,b) => b[1].fs - a[1].fs))
    reparto += `<tr><td><a href="#/persona/${slug(n)}">${esc(n)}</a></td><td class="r">${pct(s.fs)}</td><td class="r">${eur(p.f*s.fs)}</td><td class="r">${pct(s.bs)}</td><td class="r">${eur(p.b*s.bs)}</td></tr>`;
  const corr = [];
  if (p.anul) corr.push(`Se quitan ventas anuladas en Holded y sin cobrar: ${esc(p.anul_docs.join(', '))}.`);
  if (p.devol) corr.push(`El resumen de Holded suma como gasto las devoluciones de compra. Aquí se restan: corrección de ${eur(p.devol)}.`);
  if (Math.abs(p.sinapi) > 0.5) corr.push(`${eur(p.sinapi)} de gasto que Holded imputa al proyecto sin factura de compra en Holded.`);
  app.innerHTML = `<a class="back" href="#/proyectos">← Todos los proyectos</a><h1>${esc(p.name)}</h1>
    <p class="sub">${p.first ? `${fdate(p.first)} a ${fdate(p.last)} · ${p.docs.length} documentos` : 'Sin documentos en Holded'}</p>
    <div class="kpis">
      <div class="kpi"><div class="l">Facturación</div><div class="v">${eur(p.f)}</div><div class="h">Holded: ${eur(p.hv)}</div></div>
      <div class="kpi"><div class="l">Beneficio</div><div class="v">${eur(p.b)}</div><div class="h">Holded: ${eur(p.hb)}</div></div>
      <div class="kpi"><div class="l">Cobrado</div><div class="v">${eur(p.cob)}</div><div class="h">Con IVA</div></div>
      <div class="kpi"><div class="l">Pendiente de cobro</div><div class="v">${eur(p.pend)}</div><div class="h">Con IVA</div></div>
    </div>
    ${corr.length ? `<div class="note w"><b>Correcciones sobre el resumen de Holded</b><ul>${corr.map(c => `<li>${c}</li>`).join('')}</ul></div>` : ''}
    ${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}
    <h2>Reparto</h2>${reparto ? `<div class="tscroll"><table class="list"><thead><tr><th>Persona</th><th class="r">% facturación</th><th class="r">Facturación</th><th class="r">% beneficio</th><th class="r">Beneficio</th></tr></thead><tbody>${reparto}</tbody></table></div>` : '<p class="muted">Sin personas asignadas.</p>'}
    <h2>Documentos</h2><div class="tl">${node(p, null, null, {open:true})}</div>`;
}

function viewMetodo(){
  setNav('metodo');
  app.innerHTML = `<h1>Cómo se calcula</h1><p class="sub">Qué se ha hecho con los datos de Holded y cómo comprobar cada número.</p>
  <div class="prose">
  <h2>De dónde sale cada número</h2><ul>
   <li>Todos los documentos de Holded con proyecto en alguna línea, de diciembre de 2023 a octubre de 2026: facturas de venta, tickets, rectificativas, facturas de compra y devoluciones de compra.</li>
   <li>El importe que cuenta es la base sin IVA de las líneas de ese proyecto.</li>
   <li><b>Facturación</b> del proyecto: ventas, tickets y rectificativas, sin las ventas anuladas y sin cobrar.</li>
   <li><b>Beneficio</b> del proyecto: facturación menos facturas de compra, más devoluciones de compra, menos los gastos que Holded imputa al proyecto sin factura de compra.</li>
  </ul>
  <h2>Correcciones sobre el resumen de Holded</h2><ul>
   <li><b>Devoluciones de compra.</b> El resumen de rentabilidad de cada proyecto en Holded suma las devoluciones como gasto. Aquí se restan. En ASCEND, Gomitas PIN y Gomitas Zubiarte la diferencia del resumen es exactamente el doble de sus devoluciones.</li>
   <li><b>Ventas anuladas.</b> Documentos en estado anulado y con 0 € cobrados que el resumen sigue sumando. Aparecen tachados en la lista de documentos y no cuentan.</li>
   <li><b>Gastos sin factura.</b> Holded imputa algunos gastos a proyectos sin factura de compra (hojas de gasto u otros). Se cuentan tal cual y aparecen como una línea amarilla, sin enlace.</li>
  </ul>
  <h2>Reparto entre personas</h2><ul>
   <li>Holded no guarda quién participa en cada proyecto. Las personas y el % de cada una en cada proyecto vienen del reparto del equipo.</li>
   <li>Cada persona recibe su % de la facturación y su % del beneficio de cada documento.</li>
   <li>RECRUITMENT se asigna a Elisa por el concepto de sus facturas ("ELISA CANO").</li>
   <li>Mario y Aketza ya no están en el equipo. Su parte se agrupa en "${FUERA}" y no se reparte entre el resto.</li>
   <li>Los proyectos sin personas aparecen en la pestaña Proyectos como "Sin asignar".</li>
  </ul>
  <h2>Cómo verificar</h2><ul>
   <li>Cada número de documento es un enlace que abre ese documento en Holded (hay que tener sesión iniciada en Holded).</li>
   <li>En cada proyecto, la suma de las líneas da el total del proyecto. En cada persona, la suma de sus proyectos y Milkys da su total.</li>
   <li>Datos de Holded a ${fdate('2026-11-02')}.</li>
  </ul></div>`;
}

function route(){
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [k, ...rest] = h.split('/'); const arg = rest.join('/');
  window.scrollTo({top:0,left:0});
  if (k === 'persona' && arg) viewPersona(arg);
  else if (k === 'proyectos') viewProyectos();
  else if (k === 'proyecto' && arg) viewProyecto(arg);
  else if (k === 'metodo') viewMetodo();
  else viewPersonas();
}
window.addEventListener('hashchange', route);
route();
