(()=>{
'use strict';
const KEY='propertiesV1';
let M,properties=[],currentId='',currentClientId='';
const wait=()=>{M=window.DBM;const form=document.getElementById('clientForm');if(!M?.ledger||!M?.setting||!M?.lPut||!form||typeof window.openClient!=='function')return setTimeout(wait,100);init(form)};
const esc=s=>M.esc?M.esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const money=v=>M.money?M.money(v):`€${Number(v||0).toFixed(2)}`;
const total=j=>(j.lines||[]).reduce((s,l)=>s+Number(l.qty||0)*Number(l.sell||0),0);
const statusLabel=s=>({quote:'Bozza',quote_sent:'Inviato',quote_accepted:'Accettato',quote_rejected:'Rifiutato',quote_expired:'Scaduto',scheduled:'Da programmare',active:'In corso',waiting:'In attesa',completed:'Completato'}[s]||s||'—');
async function load(){const raw=await M.setting(KEY,'');if(!raw){properties=[];return}try{const x=JSON.parse(raw);properties=Array.isArray(x)?x:[]}catch{properties=[]}}
const persist=()=>M.lPut('settings',{key:KEY,value:JSON.stringify(properties)});
function init(form){
 if(M.__propertiesReady)return;M.__propertiesReady=true;
 injectStyles();injectClientPanel(form);injectPropertyDialog();
 M.propertiesForClient=async clientId=>{await load();return properties.filter(p=>p.clientId===clientId).sort((a,b)=>(a.name||'').localeCompare(b.name||''))};
 M.propertyById=async id=>{await load();return properties.find(p=>p.id===id)||null};
 M.fillPropertyOptions=async(sel,clientId,selected='')=>{const a=clientId?await M.propertiesForClient(clientId):[];sel.innerHTML='<option value="">— Nessuna proprietà —</option>'+a.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}${p.address?' · '+esc(p.address):''}</option>`).join('');if(selected)sel.value=selected};
 const baseOpen=window.openClient;
 window.openClient=async id=>{const r=await baseOpen(id);await showClientProperties(document.getElementById('clientId')?.value||'');return r};
 const clientList=document.getElementById('clientList');if(clientList)new MutationObserver(()=>decorateClientList()).observe(clientList,{childList:true,subtree:true});
 document.getElementById('clientDialog').addEventListener('close',()=>{currentClientId=''});
 load().then(()=>decorateClientList());
}
function injectStyles(){const s=document.createElement('style');s.textContent=`
#dbmClientProperties{margin-top:16px;padding-top:14px;border-top:1px solid #e3ebf1}.dbm-prop-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.dbm-prop-head h3{margin:0;font-size:17px}.dbm-prop-list{display:grid;gap:8px;margin-top:9px}.dbm-prop-card{width:100%;border:1px solid #dce6ee;background:#f8fbfd;border-radius:13px;padding:11px;text-align:left;color:#0b1f35}.dbm-prop-card b{display:block;font-size:13px}.dbm-prop-card span{display:block;font-size:10.5px;color:#64748b;margin-top:3px}.dbm-prop-empty{font-size:11px;color:#64748b;padding:8px 0}.dbm-prop-count{display:inline-block;margin-left:6px;color:#087bc1;font-weight:750}.dbm-property-dialog{width:min(calc(100vw - 18px),620px);max-width:620px}.dbm-property-history{margin-top:14px;padding-top:12px;border-top:1px solid #e3ebf1}.dbm-property-history h3{margin:0 0 8px}.dbm-property-history-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:8px 0;border-bottom:1px solid #edf2f5}.dbm-property-history-row b{font-size:11.5px}.dbm-property-history-row span{display:block;color:#64748b;font-size:9.5px;margin-top:2px}.dbm-property-history-row strong{font-size:11px;white-space:nowrap}@media(max-width:767px){.dbm-property-dialog input,.dbm-property-dialog textarea{font-size:17px!important}}
`;document.head.appendChild(s)}
function injectClientPanel(form){
 const save=form.querySelector('button[value="save"]');if(!save||document.getElementById('dbmClientProperties'))return;
 const p=document.createElement('section');p.id='dbmClientProperties';p.innerHTML=`<div class="dbm-prop-head"><div><h3>Proprietà</h3><div class="hint">Appartamenti, B&B e immobili collegati a questo cliente.</div></div><button type="button" id="dbmAddProperty" class="secondary small">+ Proprietà</button></div><div id="dbmClientPropertyList" class="dbm-prop-list"></div>`;save.insertAdjacentElement('beforebegin',p);
 document.getElementById('dbmAddProperty').onclick=()=>openProperty();
}
function injectPropertyDialog(){if(document.getElementById('dbmPropertyDialog'))return;document.body.insertAdjacentHTML('beforeend',`<dialog id="dbmPropertyDialog" class="dbm-property-dialog"><form id="dbmPropertyForm" method="dialog"><div class="dialog-head"><h2 id="dbmPropertyTitle">Proprietà</h2><button type="button" class="icon" data-close-property>×</button></div><input id="dbmPropertyId" type="hidden"><label>Nome proprietà / riferimento<input id="dbmPropertyName" required placeholder="Es. Apartment 4"></label><label>Indirizzo / località<input id="dbmPropertyAddress" placeholder="Es. Triq ... · Sliema"></label><label>Contatto sul posto<input id="dbmPropertyContact" placeholder="Nome contatto"></label><label>Telefono contatto<input id="dbmPropertyPhone" type="tel" placeholder="+356"></label><label>Note accesso<textarea id="dbmPropertyAccess" rows="2" placeholder="Indicazioni utili per entrare o trovare l'immobile"></textarea></label><label>Note tecniche<textarea id="dbmPropertyTechnical" rows="3" placeholder="Impianti, A/C, WC, geyser, problemi ricorrenti..."></textarea></label><div id="dbmPropertyHistory" class="dbm-property-history"></div><button class="primary full" value="save">Salva proprietà</button><button id="dbmDeleteProperty" type="button" class="danger full hidden">Elimina proprietà</button></form></dialog>`);
 document.querySelector('[data-close-property]').onclick=()=>document.getElementById('dbmPropertyDialog').close();document.getElementById('dbmPropertyForm').addEventListener('submit',saveProperty);document.getElementById('dbmDeleteProperty').onclick=deleteProperty;
}
async function showClientProperties(clientId){
 currentClientId=clientId;await load();const list=document.getElementById('dbmClientPropertyList'),add=document.getElementById('dbmAddProperty');if(!list||!add)return;
 if(!clientId){add.disabled=true;list.innerHTML='<div class="dbm-prop-empty">Salva prima il cliente, poi potrai aggiungere le sue proprietà.</div>';return}add.disabled=false;
 const a=properties.filter(p=>p.clientId===clientId).sort((x,y)=>(x.name||'').localeCompare(y.name||''));if(!a.length){list.innerHTML='<div class="dbm-prop-empty">Nessuna proprietà collegata.</div>';return}
 const jobs=await M.mAll('jobs');list.innerHTML=a.map(p=>{const h=historyFor(p,jobs);return `<button type="button" class="dbm-prop-card" data-prop="${esc(p.id)}"><b>${esc(p.name)}</b><span>${esc(p.address||'Indirizzo non inserito')} · ${h.length} ${h.length===1?'intervento/preventivo':'interventi/preventivi'}</span></button>`}).join('');list.querySelectorAll('[data-prop]').forEach(b=>b.onclick=()=>openProperty(b.dataset.prop));
}
function historyFor(p,jobs=[]){const addr=norm(p.address);return jobs.filter(j=>j.clientId===p.clientId&&(j.propertyId===p.id||(!j.propertyId&&addr&&norm(j.location)===addr))).sort((a,b)=>(b.date||'').localeCompare(a.date||''))}
async function openProperty(id=''){
 if(!currentClientId)return;await load();const p=id?properties.find(x=>x.id===id):null;currentId=p?.id||'';const f=document.getElementById('dbmPropertyForm');f.reset();document.getElementById('dbmPropertyId').value=currentId;document.getElementById('dbmPropertyTitle').textContent=p?'Modifica proprietà':'Nuova proprietà';document.getElementById('dbmPropertyName').value=p?.name||'';document.getElementById('dbmPropertyAddress').value=p?.address||'';document.getElementById('dbmPropertyContact').value=p?.contact||'';document.getElementById('dbmPropertyPhone').value=p?.phone||'';document.getElementById('dbmPropertyAccess').value=p?.accessNotes||'';document.getElementById('dbmPropertyTechnical').value=p?.technicalNotes||'';document.getElementById('dbmDeleteProperty').classList.toggle('hidden',!p);await renderHistory(p);document.getElementById('dbmPropertyDialog').showModal();
}
async function renderHistory(p){const el=document.getElementById('dbmPropertyHistory');if(!p){el.innerHTML='<h3>Storico</h3><div class="dbm-prop-empty">Lo storico apparirà dopo il primo lavoro o preventivo collegato.</div>';return}const jobs=await M.mAll('jobs'),a=historyFor(p,jobs);if(!a.length){el.innerHTML='<h3>Storico</h3><div class="dbm-prop-empty">Ancora nessun lavoro o preventivo collegato a questa proprietà.</div>';return}el.innerHTML='<h3>Storico</h3>'+a.slice(0,12).map(j=>`<div class="dbm-property-history-row"><div><b>${esc(j.title||'Intervento')}</b><span>${esc(j.date||'')} · ${esc(statusLabel(j.status))}</span></div><strong>${money(total(j))}</strong></div>`).join('')}
async function saveProperty(e){
 e.preventDefault();const name=document.getElementById('dbmPropertyName').value.trim();if(!name){alert('Inserisci il nome della proprietà.');return}await load();const now=new Date().toISOString(),id=currentId||M.uid(),old=properties.find(p=>p.id===id);const p={id,clientId:currentClientId,name,address:document.getElementById('dbmPropertyAddress').value.trim(),contact:document.getElementById('dbmPropertyContact').value.trim(),phone:document.getElementById('dbmPropertyPhone').value.trim(),accessNotes:document.getElementById('dbmPropertyAccess').value.trim(),technicalNotes:document.getElementById('dbmPropertyTechnical').value.trim(),createdAt:old?.createdAt||now,updatedAt:now};const i=properties.findIndex(x=>x.id===id);if(i>=0)properties[i]=p;else properties.push(p);await persist();document.getElementById('dbmPropertyDialog').close();await showClientProperties(currentClientId);await decorateClientList(true);
}
async function deleteProperty(){if(!currentId||!confirm('Eliminare questa proprietà? I lavori e i preventivi resteranno registrati.'))return;await load();properties=properties.filter(p=>p.id!==currentId);await persist();document.getElementById('dbmPropertyDialog').close();await showClientProperties(currentClientId);await decorateClientList(true)}
async function decorateClientList(force=false){
 await load();const counts=properties.reduce((m,p)=>(m[p.clientId]=(m[p.clientId]||0)+1,m),{});document.querySelectorAll('#clientList [data-client]').forEach(row=>{if(force)row.dataset.dbmPropsDecorated='';if(row.dataset.dbmPropsDecorated)return;row.dataset.dbmPropsDecorated='1';const n=counts[row.dataset.client]||0;if(!n)return;const sub=row.querySelector('.row-sub');if(sub)sub.insertAdjacentHTML('beforeend',` <span class="dbm-prop-count">· ${n} proprietà</span>`)});
}
wait();
})();
