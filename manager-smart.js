(()=>{
'use strict';
const wait=()=>{const M=window.DBM;if(!M?.db||!document.getElementById('dbmJobDialog')||!document.getElementById('officeV2'))return setTimeout(wait,100);init(M)};
function init(M){
 if(document.getElementById('dbmSmartBox'))return;
 const style=document.createElement('style');style.textContent=`
 .dbm-smart{margin:10px 0;border:1px solid #cfe6f3;background:linear-gradient(145deg,#f6fbfe,#eef8fd);border-radius:14px;padding:11px}.dbm-smart-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.dbm-smart-top b{font-size:12px;color:#0b4668}.dbm-smart-result{margin-top:8px}.dbm-smart-match{border-top:1px solid #d9eaf3;padding-top:8px}.dbm-smart-match>div:first-child{font-size:11px;color:#5d7180}.dbm-smart-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.dbm-smart-summary div{background:#fff;border:1px solid #dce9f0;border-radius:10px;padding:7px}.dbm-smart-summary span{display:block;font-size:8.5px;color:#6b7d8d}.dbm-smart-summary strong{display:block;font-size:12px;margin-top:2px}.dbm-smart-line{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:7px 0;border-top:1px solid #dfebf2}.dbm-smart-line b{display:block;font-size:11px}.dbm-smart-line small{display:block;color:#6b7d8d;font-size:9px;margin-top:2px}.dbm-smart-line button{border:1px solid #bcddec;background:#fff;color:#087bc1;border-radius:9px;padding:7px 9px;font-weight:800;font-size:10px}.dbm-smart-all{width:100%;margin-top:8px}.dbm-current{margin-top:10px}.dbm-current h2{margin-bottom:8px}.dbm-current-item{padding:9px 0;border-top:1px solid #e6edf2}.dbm-current-item:first-of-type{border-top:0}.dbm-current-item b{display:block;font-size:12px}.dbm-current-item span{display:block;color:#64748b;font-size:10.5px;line-height:1.4;margin-top:2px}.dbm-current-item a{font-size:10px;font-weight:800;color:#087bc1;text-decoration:none}@media(max-width:430px){.dbm-smart-summary{grid-template-columns:1fr 1fr}.dbm-smart-summary div:last-child{grid-column:1/-1}}`;
 document.head.appendChild(style);
 const head=document.querySelector('#dbmJobDialog .dbm-builder-head');
 head.insertAdjacentHTML('afterend',`<div id="dbmSmartBox" class="dbm-smart"><div class="dbm-smart-top"><b>⚡ Preventivo intelligente</b><button id="dbmSmartFind" type="button" class="ghost small">Trova lavoro simile</button></div><div id="dbmSmartResult" class="dbm-smart-result"><span class="hint">Scrivi il titolo del lavoro: userò i lavori precedenti e gli ultimi prezzi materiali.</span></div></div>`);
 document.getElementById('dbmSmartFind').onclick=()=>analyse(M);
 const office=document.querySelector('#officeV2 .dbm-news');
 if(office&&!document.getElementById('dbmCurrentRules'))office.insertAdjacentHTML('afterend',`<div id="dbmCurrentRules" class="panel dbm-current"><div class="panel-title-row"><h2>Situazione ufficiale</h2><span class="micro">controllo 10/09/2026</span></div>
 <div class="dbm-current-item"><b>VAT · Small enterprise</b><span>La soglia domestica Article 11 è €35.000. Article 10 consente, alle condizioni previste, il recupero dell’input VAT attribuibile all’attività.</span><a target="_blank" rel="noopener" href="https://mtca.gov.mt/personal-tax/self-employed/registration">MTCA ↗</a></div>
 <div class="dbm-current-item"><b>Income Tax · YA 2026</b><span>La dichiarazione personale Basis Year 2025 è disponibile online; la scadenza ordinaria indicata da MTCA era 31/07/2026.</span><a target="_blank" rel="noopener" href="https://mtca.gov.mt/home/2026/06/03/tax-returns-submission-deadline">MTCA ↗</a></div>
 <div class="dbm-current-item"><b>Social Security · Class 2</b><span>Per self-occupied, nel 2026 Class 2 si applica sopra €910 di reddito da attività economica; sotto/entro tale soglia può esistere l’esenzione su richiesta e con i requisiti previsti.</span><a target="_blank" rel="noopener" href="https://socialsecurity.gov.mt/en/information-and-applications-for-benefits-and-services/social-security-contributions/social-security-contributions-class-2-2026/">Social Security ↗</a></div>
 <div class="dbm-current-item"><b>💶 Micro Invest 2026–2030</b><span>Malta Enterprise ha una misura attiva per investimenti e sviluppo delle PMI; vale la pena verificare l’ammissibilità prima di nuovi acquisti importanti.</span><a target="_blank" rel="noopener" href="https://www.maltaenterprise.com/support">Malta Enterprise ↗</a></div></div>`);
}
function tokens(s){return String(s||'').toLowerCase().split(/[^a-zà-ÿ0-9]+/).filter(x=>x.length>2)}
async function analyse(M){
 const name=M.$('dbmJobName').value.trim();const out=document.getElementById('dbmSmartResult');
 if(!name){out.innerHTML='<span class="hint">Scrivi prima il titolo del lavoro.</span>';return}
 const current=M.$('dbmJobId').value, jobs=(await M.mAll('jobs')).filter(j=>j.id!==current), t=tokens(name);
 let best=null,bestScore=0;
 for(const j of jobs){const title=tokens(j.title),desc=tokens((j.lines||[]).map(x=>x.description).join(' '));let score=t.reduce((s,x)=>s+(title.includes(x)?4:desc.includes(x)?1:0),0);if(j.status==='completed')score+=.25;if(score>bestScore){best=j;bestScore=score}}
 if(!best||bestScore<1){out.innerHTML='<span class="hint">Ancora nessun lavoro abbastanza simile. Più usi l’app, più diventa utile.</span>';return}
 const mats=await M.mAll('materials'), markup=M.n(await M.setting('materialMarkup','20'));const rows=[];let sell=0,cost=0;
 for(const l of(best.lines||[])){const r={...l};if(r.type==='material'){let m=mats.find(x=>x.id===r.materialId);if(!m)m=mats.find(x=>x.name.trim().toLowerCase()===String(r.description||'').trim().toLowerCase());if(m){r.materialId=m.id;r.cost=M.n(m.lastPrice);r.sell=Number((M.n(m.lastPrice)*(1+markup/100)).toFixed(2));r.latestDate=m.lastDate||''}}sell+=M.n(r.qty)*M.n(r.sell);cost+=M.n(r.qty)*M.n(r.cost);rows.push(r)}
 out.innerHTML=`<div class="dbm-smart-match"><div>Più simile: <b>${M.esc(best.title)}</b>${best.date?' · '+M.esc(best.date):''}</div><div class="dbm-smart-summary"><div><span>STIMA CLIENTE</span><strong>${M.money(sell)}</strong></div><div><span>COSTI NOTI</span><strong>${M.money(cost)}</strong></div><div><span>MARGINE STIMATO</span><strong>${M.money(sell-cost)}</strong></div></div><div id="dbmSmartLines">${rows.map((r,i)=>`<div class="dbm-smart-line"><div><b>${M.esc(r.description||'Voce')}</b><small>${r.type==='material'?'Materiale · ultimo costo '+M.money(r.cost)+(r.latestDate?' · '+M.esc(r.latestDate):''):r.type==='labor'?'Manodopera abituale · '+M.money(r.sell):'Altra voce · '+M.money(r.sell)}</small></div><button type="button" data-smart-add="${i}">Aggiungi</button></div>`).join('')}</div><button id="dbmSmartAll" type="button" class="primary small dbm-smart-all">Aggiungi tutte le voci</button></div>`;
 out.querySelectorAll('[data-smart-add]').forEach(b=>b.onclick=()=>addRow(M,rows[Number(b.dataset.smartAdd)]));
 document.getElementById('dbmSmartAll').onclick=async()=>{for(const r of rows)await addRow(M,r)};
}
async function addRow(M,r){
 const trigger=r.type==='material'?M.$('dbmMatLine'):r.type==='other'?M.$('dbmOther'):M.$('dbmLabor');trigger.click();await new Promise(res=>setTimeout(res,0));const lines=[...M.$('dbmJobLines').querySelectorAll('.dbm-line')],row=lines[lines.length-1];if(!row)return;
 if(r.type==='material'&&r.materialId){const s=row.querySelector('.dbm-mat-select');if(s){s.value=r.materialId;s.dispatchEvent(new Event('change',{bubbles:true}));return}}
 row.querySelector('.dbm-desc').value=r.description||'';row.querySelector('.dbm-qty').value=r.qty||1;row.querySelector('.dbm-sell').value=r.sell||0;row.querySelector('.dbm-cost').value=r.cost||0;row.querySelector('.dbm-sell').dispatchEvent(new Event('input',{bubbles:true}));
}
wait();
})();
