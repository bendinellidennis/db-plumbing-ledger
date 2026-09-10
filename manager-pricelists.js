(()=>{
'use strict';
const KEY='priceListsV1';
const DEFAULT_NOTES='Guide prices only. Materials are excluded unless stated. Final price may vary depending on access, condition on site, scope of work, urgency and parts required. Preferential rates can be agreed for regular maintenance or multiple properties.';
const DEFAULT_LISTS=[{
  id:'property-maintenance-2026',
  name:'Property Maintenance Price Guide 2026',
  company:'General / Property Managers',
  updatedAt:'2026-09-10',
  notes:DEFAULT_NOTES,
  items:[
    {service:'Standard call-out / assessment',price:'from €25'},
    {service:'General plumbing & maintenance labour',price:'€25–30 / hour'},
    {service:'Small accessible leak / minor plumbing repair',price:'from €35'},
    {service:'Tap / mixer replacement – labour only',price:'€35–55'},
    {service:'Toilet flush / cistern mechanism repair or replacement – labour only',price:'€45–65'},
    {service:'Trap / flexible hose / small valve / connection replacement – labour only',price:'€30–45'},
    {service:'Basic sink / shower drain unblock',price:'€40–60'},
    {service:'Washing machine / dishwasher connection',price:'€30–45'},
    {service:'Water heater / geyser replacement – labour only',price:'€80–120'},
    {service:'Silicone / sealing / small bathroom finishing',price:'€25–40'},
    {service:'Smoke detector / small fitting installation',price:'from €10 each · minimum visit charge applies'},
    {service:'A/C standard service – 1 split unit',price:'€35–45'},
    {service:'A/C additional unit – same property / visit',price:'€25–35 each'},
    {service:'A/C fault diagnosis',price:'€40–60'},
    {service:'A/C installation / relocation / major repair',price:'quote after inspection'}
  ]
}];
let M,lists=[],currentId='';
const wait=()=>{M=window.DBM;const office=document.getElementById('officeV2');if(!M?.ledger||!M?.setting||!office||!document.getElementById('dbmBackup'))return setTimeout(wait,100);init(office)};
function uid(){return M.uid?M.uid():`${Date.now()}-${Math.random()}`}
function esc(s){return M.esc?M.esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function clone(v){return JSON.parse(JSON.stringify(v))}
async function init(office){
 if(document.getElementById('dbmPriceLists'))return;
 const style=document.createElement('style');style.textContent=`
 .dbm-price-list-card{border:1px solid #e2e8f0;border-radius:14px;padding:11px;margin-top:9px;background:#fff}.dbm-price-list-card b{display:block;font-size:12px}.dbm-price-list-card span{display:block;font-size:10px;color:#64748b;margin-top:3px}.dbm-price-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.dbm-price-actions button{font-size:10px}.dbm-price-empty{padding:12px 0;color:#64748b;font-size:11px}.dbm-price-dialog{width:min(calc(100vw - 18px),620px);max-width:620px}.dbm-price-dialog textarea{min-height:250px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}.dbm-price-help{font-size:9.5px;color:#64748b;line-height:1.4;margin:-2px 0 8px}.dbm-price-dialog .dbm-price-footer{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}@media(max-width:767px){.dbm-price-dialog input,.dbm-price-dialog textarea{font-size:17px!important}.dbm-price-dialog textarea{min-height:220px}.dbm-price-dialog .dbm-price-footer{grid-template-columns:1fr}}
 `;document.head.appendChild(style);
 const panel=document.createElement('div');panel.id='dbmPriceLists';panel.className='panel';panel.innerHTML=`<div class="panel-title-row"><div><h2>Listini prezzi</h2><span class="micro">aziende · property manager · clienti</span></div><button id="dbmNewPriceList" class="primary small">+ Nuovo</button></div><p class="hint">Crea listini diversi per ogni azienda, duplicali e condividili direttamente da iPhone.</p><div id="dbmPriceListCards"></div>`;
 document.getElementById('dbmBackup').closest('.panel').insertAdjacentElement('beforebegin',panel);
 document.body.insertAdjacentHTML('beforeend',`<dialog id="dbmPriceListDialog" class="dbm-price-dialog"><form id="dbmPriceListForm" method="dialog"><div class="dialog-head"><h2 id="dbmPriceListTitle">Listino prezzi</h2><button type="button" class="icon" data-close-price>×</button></div><input id="dbmPriceListId" type="hidden"><label>Nome listino<input id="dbmPriceListName" required placeholder="Es. Property Maintenance Price Guide 2026"></label><label>Azienda / destinatario<input id="dbmPriceListCompany" placeholder="Es. ABC Property Management"></label><label>Servizi e prezzi<textarea id="dbmPriceListLines" spellcheck="false" placeholder="Servizio | prezzo"></textarea></label><div class="dbm-price-help">Una riga per servizio. Formato: <b>Servizio | prezzo</b>. Esempio: A/C standard service | €35–45</div><label>Condizioni / note<textarea id="dbmPriceListNotes" rows="5"></textarea></label><button class="primary full" value="save">Salva listino</button><div class="dbm-price-footer"><button id="dbmPriceDuplicate" type="button" class="secondary hidden">Duplica per altra azienda</button><button id="dbmPriceDelete" type="button" class="danger hidden">Elimina listino</button></div></form></dialog>`);
 document.getElementById('dbmNewPriceList').onclick=()=>openEditor();
 document.querySelector('[data-close-price]').onclick=()=>document.getElementById('dbmPriceListDialog').close();
 document.getElementById('dbmPriceListForm').addEventListener('submit',saveEditor);
 document.getElementById('dbmPriceDuplicate').onclick=duplicateCurrent;
 document.getElementById('dbmPriceDelete').onclick=deleteCurrent;
 await load();render();
}
async function load(){
 const raw=await M.setting(KEY,'');
 if(raw){try{const parsed=JSON.parse(raw);if(Array.isArray(parsed)){lists=parsed;return}}catch(e){console.warn('DB price lists: invalid stored data',e)}}
 lists=clone(DEFAULT_LISTS);await persist();
}
function persist(){return M.lPut('settings',{key:KEY,value:JSON.stringify(lists)})}
function render(){
 const el=document.getElementById('dbmPriceListCards');if(!el)return;
 if(!lists.length){el.innerHTML='<div class="dbm-price-empty">Nessun listino salvato.</div>';return}
 el.innerHTML=lists.slice().sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')).map(x=>`<div class="dbm-price-list-card" data-price-id="${esc(x.id)}"><b>${esc(x.name)}</b><span>${esc(x.company||'Nessun destinatario specifico')} · ${(x.items||[]).length} voci · aggiornato ${esc(x.updatedAt||'—')}</span><div class="dbm-price-actions"><button type="button" class="secondary small" data-price-open>Apri</button><button type="button" class="secondary small" data-price-share>Condividi</button><button type="button" class="secondary small" data-price-print>Stampa / PDF</button></div></div>`).join('');
 el.querySelectorAll('[data-price-open]').forEach(b=>b.onclick=()=>openEditor(b.closest('[data-price-id]').dataset.priceId));
 el.querySelectorAll('[data-price-share]').forEach(b=>b.onclick=()=>shareList(b.closest('[data-price-id]').dataset.priceId));
 el.querySelectorAll('[data-price-print]').forEach(b=>b.onclick=()=>printList(b.closest('[data-price-id]').dataset.priceId));
}
function linesText(items=[]){return items.map(x=>`${x.service||''} | ${x.price||''}`).join('\n')}
function parseLines(text){return String(text||'').split(/\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const i=line.indexOf('|');return i<0?{service:line,price:''}:{service:line.slice(0,i).trim(),price:line.slice(i+1).trim()}}).filter(x=>x.service)}
function openEditor(id=''){
 const dlg=document.getElementById('dbmPriceListDialog'),x=id?lists.find(y=>y.id===id):null;currentId=x?.id||'';
 document.getElementById('dbmPriceListForm').reset();
 document.getElementById('dbmPriceListId').value=currentId;
 document.getElementById('dbmPriceListTitle').textContent=x?'Modifica listino':'Nuovo listino';
 document.getElementById('dbmPriceListName').value=x?.name||'';
 document.getElementById('dbmPriceListCompany').value=x?.company||'';
 document.getElementById('dbmPriceListLines').value=linesText(x?.items||[]);
 document.getElementById('dbmPriceListNotes').value=x?.notes||DEFAULT_NOTES;
 document.getElementById('dbmPriceDuplicate').classList.toggle('hidden',!x);
 document.getElementById('dbmPriceDelete').classList.toggle('hidden',!x);
 dlg.showModal();
}
async function saveEditor(e){
 e.preventDefault();const id=currentId||uid(),name=document.getElementById('dbmPriceListName').value.trim(),items=parseLines(document.getElementById('dbmPriceListLines').value);
 if(!name){alert('Inserisci il nome del listino.');return}if(!items.length){alert('Inserisci almeno un servizio.');return}
 const x={id,name,company:document.getElementById('dbmPriceListCompany').value.trim(),updatedAt:M.today(),notes:document.getElementById('dbmPriceListNotes').value.trim(),items};
 const i=lists.findIndex(y=>y.id===id);if(i>=0)lists[i]=x;else lists.push(x);await persist();document.getElementById('dbmPriceListDialog').close();render();
}
async function duplicateCurrent(){
 const x=lists.find(y=>y.id===currentId);if(!x)return;const c=clone(x);c.id=uid();c.company='';c.updatedAt=M.today();c.name=x.name;lists.push(c);await persist();document.getElementById('dbmPriceListDialog').close();render();openEditor(c.id);
}
async function deleteCurrent(){
 const x=lists.find(y=>y.id===currentId);if(!x||!confirm(`Eliminare il listino “${x.name}”?`))return;lists=lists.filter(y=>y.id!==currentId);await persist();document.getElementById('dbmPriceListDialog').close();render();
}
function shareText(x){
 const rows=(x.items||[]).map(i=>`• ${i.service}${i.price?' — '+i.price:''}`).join('\n');return `DB Plumbing Services\n${x.name}${x.company?'\nFor: '+x.company:''}\n\n${rows}\n\n${x.notes||''}\n\nDennis Bendinelli\nDB Plumbing Services\nWhatsApp / Tel: +356 7753 2068`;
}
async function shareList(id){
 const x=lists.find(y=>y.id===id);if(!x)return;const text=shareText(x);
 if(navigator.share){try{await navigator.share({title:x.name,text});return}catch(e){if(e?.name==='AbortError')return}}
 try{await navigator.clipboard.writeText(text);alert('Listino copiato. Puoi incollarlo in WhatsApp o email.')}catch(e){alert('Condivisione non disponibile su questo dispositivo.')}
}
function printList(id){
 const x=lists.find(y=>y.id===id);if(!x)return;const w=window.open('','_blank');if(!w){alert('Impossibile aprire la stampa.');return}w.opener=null;
 const rows=(x.items||[]).map(i=>`<tr><td>${esc(i.service)}</td><td>${esc(i.price||'')}</td></tr>`).join('');
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(x.name)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:36px;color:#0f172a}h1{font-size:24px;margin:0 0 4px}.sub{color:#64748b;margin-bottom:24px}table{width:100%;border-collapse:collapse;margin:18px 0}td{padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:13px}td:last-child{text-align:right;font-weight:700;white-space:nowrap}.notes{font-size:11px;line-height:1.5;color:#475569;margin-top:18px}.contact{margin-top:28px;font-size:12px;font-weight:700}@media print{body{margin:20mm}}</style></head><body><h1>DB Plumbing Services</h1><div class="sub">${esc(x.name)}${x.company?'<br>For: '+esc(x.company):''}</div><table>${rows}</table><div class="notes">${esc(x.notes||'')}</div><div class="contact">Dennis Bendinelli · DB Plumbing Services<br>WhatsApp / Tel: +356 7753 2068</div><script>setTimeout(()=>window.print(),250)<\/script></body></html>`);w.document.close();
}
wait();
})();
