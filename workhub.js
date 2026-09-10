(()=>{
'use strict';
const KEY='dbWorkHubDataV1';
const CATS=['Idraulica','WC / Sanitari','HVAC / A/C','Riscaldamento','Elettrico / LED','Consumabili','Altro'];
const $=id=>document.getElementById(id);
const cash=n=>new Intl.NumberFormat('en-MT',{style:'currency',currency:'EUR'}).format(Number(n||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;
const today=()=>new Date().toISOString().slice(0,10);
const state=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{jobs:[],materials:[]}}catch{return{jobs:[],materials:[]}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
let filter='all';

async function clients(){
 return new Promise(ok=>{const r=indexedDB.open('dbPlumbingLedgerDB');r.onerror=()=>ok([]);r.onsuccess=()=>{const d=r.result;if(!d.objectStoreNames.contains('clients')){d.close();ok([]);return}const q=d.transaction('clients').objectStore('clients').getAll();q.onsuccess=()=>{d.close();ok(q.result||[])};q.onerror=()=>{d.close();ok([])}}});
}

function init(){
 if($('hubPanel'))return;
 const dash=$('dashboard'), main=document.querySelector('main');
 const panel=document.createElement('div');panel.id='hubPanel';panel.className='panel hub-panel';
 panel.innerHTML=`<div class="panel-title-row"><h2>DB Work Hub</h2><span class="badge">nuovo</span></div><div class="hub-grid">
 <button type="button" data-hub="jobs"><b>🧰</b><span>Lavori</span><small>interventi & margini</small></button>
 <button type="button" data-quote><b>🧾</b><span>Preventivo</span><small>totale automatico</small></button>
 <button type="button" data-hub="materials"><b>🔩</b><span>Materiali</span><small>prezzi & storico</small></button>
 <button type="button" data-hub="admin"><b>🏛️</b><span>Burocrazia</span><small>scadenze & bonus</small></button></div>`;
 dash.insertBefore(panel,dash.querySelector('.panel:last-of-type'));

 main.insertAdjacentHTML('beforeend',`
 <section id="jobs" class="view"><div class="hub-head"><button class="ghost small" type="button" data-home>‹ Home</button><div><h1>Lavori & Preventivi</h1><p>Ogni intervento diviso per voci, senza calcolatrice.</p></div></div>
 <div class="hub-actions"><button id="hubNewJob" class="primary">+ Lavoro</button><button id="hubNewQuote" class="secondary">+ Preventivo</button></div>
 <div class="segmented"><button class="seg active" data-filter="all">Tutti</button><button class="seg" data-filter="quote">Preventivi</button><button class="seg" data-filter="open">Aperti</button><button class="seg" data-filter="done">Chiusi</button></div><div id="hubJobs" class="list"></div></section>

 <section id="materials" class="view"><div class="hub-head"><button class="ghost small" type="button" data-home>‹ Home</button><div><h1>Materiali & Prezzi</h1><p>Ultimo costo, fornitore e storico prezzi.</p></div></div>
 <div class="hub-actions"><button id="hubNewMat" class="primary">+ Materiale</button></div>
 <div class="hub-search"><input id="hubMatSearch" placeholder="Cerca materiale..."><select id="hubMatCat"><option value="">Tutti i settori</option>${CATS.map(c=>`<option>${c}</option>`).join('')}</select></div><div id="hubMats" class="list"></div></section>

 <section id="admin" class="view"><div class="hub-head"><button class="ghost small" type="button" data-home>‹ Home</button><div><h1>Burocrazia Malta</h1><p>Fonti ufficiali, scadenze e incentivi.</p></div></div>
 <div class="hub-alert"><strong>🔔 Monitoraggio ufficiale attivo</strong><span>Riceverai una notifica quando cambia qualcosa di rilevante per la tua attività.</span></div>
 <div class="hub-admin">
 <a target="_blank" rel="noopener" href="https://mtca.gov.mt/personal-tax/self-employed/registration"><b>VAT · Article 10 / 11</b><span>Registrazione e regime VAT self-employed.</span><em>MTCA ↗</em></a>
 <a target="_blank" rel="noopener" href="https://mtca.gov.mt/home/2026/05/15/personal-income-tax-return---year-of-assessment-2026-%28basis-year-2025%29"><b>Income Tax · YA 2026</b><span>Dichiarazione personale Basis Year 2025.</span><em>MTCA ↗</em></a>
 <a target="_blank" rel="noopener" href="https://socialsecurity.gov.mt/en/information-and-applications-for-benefits-and-services/social-security-contributions/social-security-contributions-class-2-2026/"><b>Social Security · Class 2</b><span>Regole e aliquote 2026 per self-occupied.</span><em>Social Security ↗</em></a>
 <a target="_blank" rel="noopener" href="https://jobsplus.gov.mt/knowledge-base-employer/self-employed-persons-and-partnerships"><b>Jobsplus · Self-Employment</b><span>Registrazione ed engagement form.</span><em>Jobsplus ↗</em></a>
 <a target="_blank" rel="noopener" href="https://www.maltaenterprise.com/support"><b>💶 Incentivi impresa</b><span>Micro Invest 2026–2030 e altre misure.</span><em>Malta Enterprise ↗</em></a></div></section>`);

 document.body.insertAdjacentHTML('beforeend',`
 <dialog id="hubJobDialog"><form id="hubJobForm">
 <div class="dialog-head"><h2 id="hubJobTitle">Nuovo lavoro</h2><button type="button" class="icon" data-closehub="hubJobDialog">×</button></div><input id="hubJobId" type="hidden">
 <div class="two-cols"><label>Tipo<select id="hubJobStatus"><option value="quote">Preventivo</option><option value="open">Lavoro aperto</option><option value="done">Lavoro chiuso</option></select></label><label>Data<input id="hubJobDate" type="date" required></label></div>
 <label>Cliente<select id="hubJobClient"></select></label><label>Intervento<input id="hubJobName" required placeholder="Es. Tank + batteria WC"></label><label>Località<input id="hubJobLoc"></label>
 <div class="panel-title-row" style="margin-top:14px"><h2 style="font-size:15px;margin:0">Voci</h2><button type="button" id="hubSimilar" class="ghost small">⚡ Lavoro simile</button></div>
 <div id="hubLines"></div><div class="hub-add"><button type="button" data-line="labor">+ Manodopera</button><button type="button" data-line="material">+ Materiale</button><button type="button" data-line="other">+ Altro</button></div>
 <div class="hub-totals"><div><span>Totale cliente</span><strong id="hubSell">€0.00</strong></div><div><span>Costi</span><strong id="hubCost">€0.00</strong></div><div class="margin"><span>Margine</span><strong id="hubMargin">€0.00</strong></div></div>
 <label>Note<textarea id="hubJobNotes" rows="2"></textarea></label><button type="submit" class="primary full">Salva</button></form></dialog>

 <dialog id="hubMatDialog"><form id="hubMatForm"><div class="dialog-head"><h2>Materiale</h2><button type="button" class="icon" data-closehub="hubMatDialog">×</button></div><input id="hubMatId" type="hidden">
 <label>Nome<input id="hubMatName" required></label><div class="two-cols"><label>Settore<select id="hubMatCategory">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Unità<input id="hubMatUnit" value="pz"></label></div>
 <label>Fornitore<input id="hubMatSupplier"></label><div class="two-cols"><label>Prezzo pagato €<input id="hubMatPrice" type="number" min="0" step="0.01" required></label><label>Data<input id="hubMatDate" type="date" required></label></div><div id="hubHistory" class="hub-history"></div><button type="submit" class="primary full">Salva prezzo</button></form></dialog><datalist id="hubMatNames"></datalist>`);

 document.querySelectorAll('[data-hub]').forEach(b=>b.onclick=()=>openView(b.dataset.hub));
 document.querySelector('[data-quote]').onclick=()=>openJob('', 'quote');
 document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>showView('dashboard'));
 document.querySelectorAll('[data-closehub]').forEach(b=>b.onclick=()=>$(b.dataset.closehub).close());
 $('hubNewJob').onclick=()=>openJob('', 'open');$('hubNewQuote').onclick=()=>openJob('', 'quote');$('hubNewMat').onclick=()=>openMat();
 document.querySelectorAll('[data-line]').forEach(b=>b.onclick=()=>addLine({kind:b.dataset.line}));
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;b.parentElement.querySelectorAll('.seg').forEach(x=>x.classList.toggle('active',x===b));renderJobs()});
 $('hubMatSearch').oninput=renderMats;$('hubMatCat').onchange=renderMats;$('hubJobForm').onsubmit=storeJob;$('hubMatForm').onsubmit=storeMat;$('hubSimilar').onclick=similar;
 refresh();
}
function openView(v){showView(v);if(v==='jobs')renderJobs();if(v==='materials')renderMats()}

async function openJob(jobId='',preset='open'){
 const s=state(), cs=await clients();$('hubJobForm').reset();$('hubJobId').value='';$('hubJobDate').value=today();$('hubJobStatus').value=preset;$('hubLines').innerHTML='';
 $('hubJobClient').innerHTML='<option value="">— Nessun cliente —</option>'+cs.sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
 if(jobId){const j=s.jobs.find(x=>x.id===jobId);if(!j)return;$('hubJobTitle').textContent='Modifica '+(j.status==='quote'?'preventivo':'lavoro');$('hubJobId').value=j.id;$('hubJobStatus').value=j.status;$('hubJobDate').value=j.date;$('hubJobClient').value=j.clientId||'';$('hubJobName').value=j.name;$('hubJobLoc').value=j.location||'';$('hubJobNotes').value=j.notes||'';(j.lines||[]).forEach(addLine)}else{$('hubJobTitle').textContent=preset==='quote'?'Nuovo preventivo':'Nuovo lavoro';addLine({kind:'labor',desc:'Manodopera',qty:1})}
 calc();$('hubJobDialog').showModal();
}
function addLine(x={}){
 const r=document.createElement('div');r.className='hub-line';r.dataset.kind=x.kind||'labor';const lab=r.dataset.kind==='material'?'Materiale':r.dataset.kind==='other'?'Altra voce':'Manodopera / intervento';
 r.innerHTML=`<div class="hub-line-top"><b>${lab}</b><button type="button" class="hub-remove">×</button></div><input class="d" ${r.dataset.kind==='material'?'list="hubMatNames"':''} placeholder="Descrizione" value="${esc(x.desc||'')}"><div class="hub-line-grid"><label>Qtà<input class="q" type="number" min="0" step="0.01" value="${Number(x.qty??1)}"></label><label>Costo unit. €<input class="c" type="number" min="0" step="0.01" value="${Number(x.cost||0)}"></label><label>Prezzo cliente €<input class="p" type="number" min="0" step="0.01" value="${Number(x.sell||0)}"></label></div>`;
 r.querySelector('.hub-remove').onclick=()=>{r.remove();calc()};r.querySelectorAll('input').forEach(i=>i.oninput=calc);
 if(r.dataset.kind==='material')r.querySelector('.d').onchange=()=>{const m=state().materials.find(m=>m.name.toLowerCase()===r.querySelector('.d').value.trim().toLowerCase());if(m){r.querySelector('.c').value=m.price;calc()}};
 $('hubLines').appendChild(r);
}
const lines=()=>[...document.querySelectorAll('#hubLines .hub-line')].map(r=>({kind:r.dataset.kind,desc:r.querySelector('.d').value.trim(),qty:Number(r.querySelector('.q').value||0),cost:Number(r.querySelector('.c').value||0),sell:Number(r.querySelector('.p').value||0)})).filter(x=>x.desc||x.cost||x.sell);
function calc(){const a=lines(),sell=a.reduce((s,x)=>s+x.qty*x.sell,0),cost=a.reduce((s,x)=>s+x.qty*x.cost,0);$('hubSell').textContent=cash(sell);$('hubCost').textContent=cash(cost);$('hubMargin').textContent=cash(sell-cost)}
function storeJob(e){e.preventDefault();const s=state(),a=lines(),jid=$('hubJobId').value||id(),j={id:jid,status:$('hubJobStatus').value,date:$('hubJobDate').value,clientId:$('hubJobClient').value,name:$('hubJobName').value.trim(),location:$('hubJobLoc').value.trim(),notes:$('hubJobNotes').value.trim(),lines:a,totalSell:a.reduce((n,x)=>n+x.qty*x.sell,0),totalCost:a.reduce((n,x)=>n+x.qty*x.cost,0)};const i=s.jobs.findIndex(x=>x.id===jid);if(i>=0)s.jobs[i]=j;else s.jobs.push(j);a.filter(x=>x.kind==='material'&&x.desc).forEach(x=>upsertMaterial(s,x.desc,x.cost,'Altro','',j.date));save(s);$('hubJobDialog').close();refresh()}
function upsertMaterial(s,name,price,category,supplier,date){let m=s.materials.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!m){m={id:id(),name,category:category||'Altro',unit:'pz',supplier:supplier||'',price:Number(price||0),date:date||today(),history:[]};s.materials.push(m)}m.price=Number(price||m.price||0);m.date=date||today();if(supplier)m.supplier=supplier;m.history=m.history||[];if(!m.history.length||Number(m.history[m.history.length-1].price)!==Number(m.price))m.history.push({date:m.date,price:m.price,supplier:m.supplier||''})}

async function renderJobs(){const s=state(),cs=await clients(),names=Object.fromEntries(cs.map(c=>[c.id,c.name]));let a=[...s.jobs].sort((x,y)=>(y.date||'').localeCompare(x.date||''));if(filter!=='all')a=a.filter(x=>x.status===filter);$('hubJobs').innerHTML=a.length?a.map(j=>`<button class="row hub-row" type="button" data-j="${j.id}"><div><div class="row-title">${esc(j.name)}</div><div class="row-sub">${esc(names[j.clientId]||'Senza cliente')} · ${esc(j.date||'')}${j.location?' · '+esc(j.location):''}</div><span class="hub-chip ${j.status}">${j.status==='quote'?'Preventivo':j.status==='done'?'Chiuso':'Aperto'}</span></div><div class="hub-money"><strong>${cash(j.totalSell)}</strong><small>margine ${cash(j.totalSell-j.totalCost)}</small></div></button>`).join(''):'<div class="empty"><strong>Nessun lavoro.</strong><span>Da qui l’app inizierà a ricordare prezzi e materiali.</span></div>';document.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>openJob(b.dataset.j))}
function similar(){const s=state(),name=$('hubJobName').value.trim().toLowerCase();if(!name){alert('Scrivi prima il tipo di intervento.');return}const toks=name.split(/[^a-zà-ÿ0-9]+/).filter(x=>x.length>2);let best=null,n=0;s.jobs.filter(j=>j.id!==$('hubJobId').value).forEach(j=>{const h=(j.name+' '+j.lines.map(x=>x.desc).join(' ')).toLowerCase(),v=toks.reduce((z,t)=>z+(h.includes(t)?1:0),0);if(v>n){n=v;best=j}});if(!best){alert('Non ho ancora un lavoro simile.');return}$('hubLines').innerHTML='';best.lines.forEach(x=>{const c={...x};if(c.kind==='material'){const m=s.materials.find(m=>m.name.toLowerCase()===c.desc.toLowerCase());if(m)c.cost=m.price}addLine(c)});calc();alert('Modello caricato da: '+best.name)}

function openMat(mid=''){const s=state();$('hubMatForm').reset();$('hubMatId').value='';$('hubMatDate').value=today();$('hubMatUnit').value='pz';$('hubHistory').innerHTML='';if(mid){const m=s.materials.find(x=>x.id===mid);if(!m)return;$('hubMatId').value=m.id;$('hubMatName').value=m.name;$('hubMatCategory').value=m.category;$('hubMatUnit').value=m.unit||'pz';$('hubMatSupplier').value=m.supplier||'';$('hubMatPrice').value=m.price;$('hubMatDate').value=m.date||today();$('hubHistory').innerHTML=(m.history||[]).slice().reverse().slice(0,8).map(h=>`<div><span>${esc(h.date)} ${h.supplier?'· '+esc(h.supplier):''}</span><strong>${cash(h.price)}</strong></div>`).join('')}$('hubMatDialog').showModal()}
function storeMat(e){e.preventDefault();const s=state(),mid=$('hubMatId').value||id(),old=s.materials.find(x=>x.id===mid),h=old?.history||[],m={id:mid,name:$('hubMatName').value.trim(),category:$('hubMatCategory').value,unit:$('hubMatUnit').value.trim()||'pz',supplier:$('hubMatSupplier').value.trim(),price:Number($('hubMatPrice').value||0),date:$('hubMatDate').value,history:h};m.history.push({date:m.date,price:m.price,supplier:m.supplier});const i=s.materials.findIndex(x=>x.id===mid);if(i>=0)s.materials[i]=m;else s.materials.push(m);save(s);$('hubMatDialog').close();refresh()}
function renderMats(){const s=state(),q=($('hubMatSearch')?.value||'').toLowerCase(),cat=$('hubMatCat')?.value||'';let a=[...s.materials].sort((x,y)=>x.name.localeCompare(y.name));if(q)a=a.filter(m=>(m.name+' '+m.supplier+' '+m.category).toLowerCase().includes(q));if(cat)a=a.filter(m=>m.category===cat);$('hubMats').innerHTML=a.length?a.map(m=>`<button class="row hub-row" type="button" data-m="${m.id}"><div><div class="row-title">${esc(m.name)}</div><div class="row-sub">${esc(m.category)}${m.supplier?' · '+esc(m.supplier):''}${m.date?' · '+esc(m.date):''}</div></div><div class="hub-money"><strong>${cash(m.price)}</strong><small>/${esc(m.unit||'pz')}</small></div></button>`).join(''):'<div class="empty"><strong>Nessun materiale.</strong><span>Aggiungilo una volta e resterà disponibile per i prossimi lavori.</span></div>';document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>openMat(b.dataset.m));$('hubMatNames').innerHTML=s.materials.map(m=>`<option value="${esc(m.name)}"></option>`).join('')}
function refresh(){renderJobs();renderMats()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
