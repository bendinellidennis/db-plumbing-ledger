(()=>{
'use strict';
const M={DB_NAME:'dbPlumbingManagerDB',DB_VERSION:1,db:null,ledger:null,categories:['Idraulica','WC / Sanitari','HVAC / Aria condizionata','Riscaldamento','Elettrico / LED','Consumabili','Attrezzi','Altro']};
const $=id=>document.getElementById(id), n=v=>Number(v||0), uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;
const money=v=>new Intl.NumberFormat('en-MT',{style:'currency',currency:'EUR'}).format(n(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
function open(name,version,upgrade){return new Promise((res,rej)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=e=>upgrade?.(e.target.result);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function tx(db,s,mode='readonly'){return db.transaction(s,mode).objectStore(s)}
function all(db,s){return new Promise((res,rej)=>{const r=tx(db,s).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function one(db,s,k){return new Promise((res,rej)=>{const r=tx(db,s).get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function put(db,s,v){return new Promise((res,rej)=>{const r=tx(db,s,'readwrite').put(v);r.onsuccess=()=>res(v);r.onerror=()=>rej(r.error)})}
function del(db,s,k){return new Promise((res,rej)=>{const r=tx(db,s,'readwrite').delete(k);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
async function setting(k,d=''){const x=await one(M.ledger,'settings',k);return x?x.value:d}
async function initDB(){M.db=await open(M.DB_NAME,M.DB_VERSION,d=>{['jobs','materials','history','compliance'].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'id'})})});M.ledger=await open('dbPlumbingLedgerDB',1);}
function injectShell(){
 const nav=document.querySelector('.bottom-nav');
 nav.innerHTML=`<button data-dbm-view="dashboard" class="nav active"><span class="dbm-ico">⌂</span><span>Home</span></button><button data-dbm-view="jobsV2" class="nav"><span class="dbm-ico">▤</span><span>Lavori</span></button><button id="dbmQuick" class="quick">＋</button><button data-dbm-view="materialsV2" class="nav"><span class="dbm-ico">◫</span><span>Materiali</span></button><button data-dbm-view="clients" class="nav"><span class="dbm-ico">●</span><span>Clienti</span></button><button data-dbm-view="officeV2" class="nav"><span class="dbm-ico">⚙</span><span>Ufficio</span></button>`;
 document.querySelector('main').insertAdjacentHTML('beforeend',`<section id="jobsV2" class="view"></section><section id="materialsV2" class="view"></section><section id="officeV2" class="view"></section>`);
 document.body.insertAdjacentHTML('beforeend',`<dialog id="dbmQuickDialog" class="dbm-sheet"><form method="dialog"><div class="dialog-head"><h2>Cosa vuoi fare?</h2><button type="button" class="icon" data-dbm-close>×</button></div><div class="dbm-actions"><button type="button" data-dbm-action="job"><b>Nuovo lavoro / preventivo</b><span>Interventi, materiali, totale e margine</span></button><button type="button" data-dbm-action="purchase"><b>Registra acquisto</b><span>Materiali, prezzi e fornitore</span></button><button type="button" data-dbm-action="client"><b>Nuovo cliente</b><span>Contatto e località</span></button><button type="button" data-dbm-action="material"><b>Nuovo materiale</b><span>Aggiungi o aggiorna un prezzo</span></button><button type="button" data-dbm-action="entry"><b>Movimento manuale</b><span>Entrata o spesa non collegata</span></button></div></form></dialog>`);
 nav.querySelectorAll('[data-dbm-view]').forEach(b=>b.onclick=()=>M.show(b.dataset.dbmView));
 $('dbmQuick').onclick=()=>$('dbmQuickDialog').showModal();
 $('dbmQuickDialog').querySelector('[data-dbm-close]').onclick=()=>$('dbmQuickDialog').close();
 $('dbmQuickDialog').querySelectorAll('[data-dbm-action]').forEach(b=>b.onclick=()=>{ $('dbmQuickDialog').close(); const a=b.dataset.dbmAction;if(a==='job')M.openJob();if(a==='purchase')M.openPurchase();if(a==='material')M.openMaterial();if(a==='client'&&window.openClient)window.openClient();if(a==='entry'&&window.openEntry)window.openEntry();});
 const cards=document.querySelector('#dashboard .cards');if(cards&&!document.querySelector('.dbm-home-actions'))cards.insertAdjacentHTML('afterend',`<div class="dbm-home-actions"><button data-home-action="job">＋<span>Nuovo lavoro</span></button><button data-home-action="purchase">▣<span>Acquisto</span></button><button data-home-action="materials">⌕<span>Prezzi</span></button></div>`);
 document.querySelectorAll('[data-home-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.homeAction;if(a==='job')M.openJob();if(a==='purchase')M.openPurchase();if(a==='materials')M.show('materialsV2')});
}
M.show=v=>{document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));document.querySelectorAll('.bottom-nav .nav').forEach(x=>x.classList.toggle('active',x.dataset.dbmView===v));if(v==='jobsV2')M.renderJobs();if(v==='materialsV2')M.renderMaterials();if(v==='officeV2')M.renderOffice();if(v==='clients'&&window.renderClients)window.renderClients();if(v==='dashboard'&&window.renderDashboard)window.renderDashboard();window.scrollTo({top:0,behavior:'smooth'})};
M.refreshLedger=async()=>{if(window.refreshAll)await window.refreshAll()};
M.clients=()=>all(M.ledger,'clients');M.entries=()=>all(M.ledger,'entries');M.lPut=(s,v)=>put(M.ledger,s,v);M.lOne=(s,k)=>one(M.ledger,s,k);M.mAll=s=>all(M.db,s);M.mOne=(s,k)=>one(M.db,s,k);M.mPut=(s,v)=>put(M.db,s,v);M.mDel=(s,k)=>del(M.db,s,k);M.setting=setting;M.uid=uid;M.money=money;M.esc=esc;M.n=n;M.today=today;M.$=$;
M.fillClientOptions=async sel=>{const a=(await M.clients()).sort((x,y)=>x.name.localeCompare(y.name));sel.innerHTML='<option value="">— Nessun cliente —</option>'+a.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')};
M.refreshHome=async()=>{await M.refreshLedger();const list=$('recentList');if(list){list.querySelectorAll('.row-title').forEach(x=>x.title=x.textContent)}};
async function init(){await initDB();injectShell();await M.ensureCompliance?.();await M.renderJobs?.();await M.renderMaterials?.();window.DBM=M;}
window.DBM=M;init().catch(e=>{console.error('DB Manager',e)});
})();