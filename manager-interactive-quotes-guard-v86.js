(()=>{
'use strict';
let M,list,queued=false;
const wait=()=>{M=window.DBM;list=document.getElementById('dbmQuoteList');if(!M?.mAll||!list||!window.DBM?.__interactiveQuotesV84Ready)return setTimeout(wait,100);init()};
function init(){if(M.__interactiveQuoteGuardV86Ready)return;M.__interactiveQuoteGuardV86Ready=true;new MutationObserver(()=>schedule()).observe(list,{childList:true,subtree:true});schedule()}
function schedule(){if(queued)return;queued=true;setTimeout(async()=>{queued=false;await decorate()},0)}
function decisionLabel(d){if(d==='accepted')return'Accettato dal cliente';if(d==='rejected')return'Rifiutato dal cliente';if(d==='change_requested')return'Modifica richiesta';return''}
function responseTime(v){if(!v)return'';try{return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return''}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
async function decorate(){
 const rows=[...list.querySelectorAll('[data-quote]')];if(!rows.length)return;
 const quotes=Object.fromEntries((await M.mAll('jobs')).map(q=>[q.id,q]));
 for(const row of rows){
  const q=quotes[row.dataset.quote];if(!q)continue;
  const status=row.querySelector('.dbm-status');
  if(q.interactiveDecision==='change_requested'&&status){status.textContent='Modifica richiesta';status.classList.add('quote_change_requested')}
  const actions=row.querySelector('.dbm-flow-row-actions');if(!actions||actions.querySelector('.dbm-iq-actions'))continue;
  const box=document.createElement('div');box.className='dbm-iq-actions';
  if(!q.interactivePublicToken){box.innerHTML='<button type="button" class="secondary small" data-iq-create>Crea link cliente</button>'}
  else{const d=q.interactiveDecision||'',label=d==='change_requested'?'Invia preventivo aggiornato':'Aggiorna link';box.innerHTML=`<button type="button" class="secondary small" data-iq-share>Condividi link</button><button type="button" class="secondary small" data-iq-update>${label}</button><span class="dbm-iq-live">Interactive Quote</span><div class="dbm-iq-note">${d?`<strong>${esc(decisionLabel(d))}</strong>${q.interactiveRespondedAt?' · '+esc(responseTime(q.interactiveRespondedAt)):''}${q.interactiveMessage?' · '+esc(q.interactiveMessage):''}`:'In attesa della risposta del cliente.'}</div>`}
  actions.appendChild(box)
 }
}
wait();
})();
