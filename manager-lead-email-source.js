(()=>{
'use strict';
const SUPABASE_URL='https://gscrhubeifhlbxxrdlwo.supabase.co';
const SUPABASE_KEY='sb_publishable_FXBhsGpZ2R73HV1G--uByw_D041l7pz';
const TOKEN_KEY='dbpRequestInboxOwnerTokenV1';
const SEEN_KEY='dbpRequestInboxSeenV1';
const LEADS_KEY='leadsV1';
let M=null,syncing=false,lastSync=0;

function addSource(value){
  const select=document.getElementById('dbmLeadSource');
  if(!select||[...select.options].some(o=>o.value===value||o.textContent===value))return;
  const option=document.createElement('option');option.value=value;option.textContent=value;
  const altro=[...select.options].find(o=>o.value==='Altro'||o.textContent==='Altro');
  if(altro)select.insertBefore(option,altro);else select.appendChild(option);
}
function ensureSources(){addSource('Email');addSource('Sito web')}
function token(){return localStorage.getItem(TOKEN_KEY)||''}
function seen(){try{const a=JSON.parse(localStorage.getItem(SEEN_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
function saveSeen(a){localStorage.setItem(SEEN_KEY,JSON.stringify([...new Set(a)].slice(-500)))}
async function leads(){try{const raw=await M.setting(LEADS_KEY,'[]');const a=typeof raw==='string'?JSON.parse(raw):raw;return Array.isArray(a)?a:[]}catch{return[]}}
async function saveLeads(a){await M.lPut('settings',{key:LEADS_KEY,value:JSON.stringify(a)})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function text(v){return String(v??'').trim()}
function remoteKey(r){return text(r.id)||[r.created_at,r.phone,r.problem].map(text).join('|')}
function requestNotes(r){
  const lines=['Richiesta arrivata dal sito DB Plumbing Services'];
  if(r.area)lines.push(`Zona: ${text(r.area)}`);
  if(r.service)lines.push(`Servizio: ${text(r.service)}`);
  if(r.urgency)lines.push(`Urgenza: ${text(r.urgency)}`);
  if(r.problem)lines.push(`Problema: ${text(r.problem)}`);
  if(r.language)lines.push(`Lingua: ${text(r.language).toUpperCase()}`);
  if(r.campaign||r.utm_campaign)lines.push(`Campagna: ${text(r.campaign||r.utm_campaign)}`);
  if(r.utm_source||r.utm_medium)lines.push(`Attribution: ${text(r.utm_source)||'—'} / ${text(r.utm_medium)||'—'}`);
  if(r.id)lines.push(`Request ID: ${text(r.id)}`);
  return lines.join('\n');
}
async function rpc(name,body){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
    const raw=await response.text();let data=raw;try{data=raw?JSON.parse(raw):null}catch{}
    if(!response.ok)throw new Error(`${response.status} ${typeof data==='string'?data:(data?.message||raw||'Request failed')}`);
    return data;
  }finally{clearTimeout(timer)}
}
function status(message,kind=''){const el=document.getElementById('dbmInboxStatus');if(!el)return;el.textContent=message;el.dataset.kind=kind}
function count(n){const el=document.getElementById('dbmInboxCount');if(el)el.textContent=String(n||0)}
function ensureStyles(){if(document.getElementById('dbmInboxStyle'))return;const s=document.createElement('style');s.id='dbmInboxStyle';s.textContent=`
.dbm-inbox-bar{margin:10px 0 4px;border:1px solid #cde6f3;background:#f5fbff;border-radius:14px;padding:10px}.dbm-inbox-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.dbm-inbox-title{font-size:11px;font-weight:900;color:#0b1f35}.dbm-inbox-title span{display:inline-flex;min-width:22px;height:22px;align-items:center;justify-content:center;border-radius:999px;background:#0d88c7;color:#fff;margin-left:5px;font-size:9px}.dbm-inbox-status{font-size:9.5px;color:#64748b;margin-top:3px}.dbm-inbox-status[data-kind="ok"]{color:#087a55}.dbm-inbox-status[data-kind="err"]{color:#b42318}.dbm-inbox-actions{display:flex;gap:7px}.dbm-inbox-actions button{min-height:36px;border-radius:10px;font-size:9.5px;font-weight:850;padding:0 10px}
`;document.head.appendChild(s)}
function ensureInboxPanel(){
  const dialog=document.getElementById('dbmLeadsDialog'),anchor=document.getElementById('dbmLeadNew');if(!dialog||!anchor||document.getElementById('dbmInboxBar'))return;
  const box=document.createElement('div');box.id='dbmInboxBar';box.className='dbm-inbox-bar';box.innerHTML=`<div class="dbm-inbox-top"><div><div class="dbm-inbox-title">Richieste dal sito <span id="dbmInboxCount">0</span></div><div id="dbmInboxStatus" class="dbm-inbox-status">${token()?'Collegato · sincronizzazione automatica':'Da collegare una sola volta'}</div></div><div class="dbm-inbox-actions"><button type="button" class="secondary" id="dbmInboxConnect">${token()?'Ricollega':'Collega'}</button><button type="button" class="primary" id="dbmInboxSync" ${token()?'':'disabled'}>Sincronizza</button></div></div>`;
  anchor.insertAdjacentElement('afterend',box);
  document.getElementById('dbmInboxConnect').onclick=connect;
  document.getElementById('dbmInboxSync').onclick=()=>syncInbox(true);
}
function updatePrivacy(){
  const ps=[...document.querySelectorAll('#settings p.hint')];const p=ps.find(x=>/non invia dati a server esterni/i.test(x.textContent||''));
  if(p)p.textContent='I dati operativi restano nel browser del tuo iPhone. Fai un backup JSON regolare. Solo Request Inbox sincronizza le richieste inviate dal sito tramite il backend privato DB Plumbing Services.';
}
async function connect(){
  const current=token();const value=prompt('Incolla il codice di accesso Request Inbox.',current?'••••••••••••':'');if(value===null)return;
  const v=value.trim();if(!v||v.includes('•'))return;
  localStorage.setItem(TOKEN_KEY,v);const b=document.getElementById('dbmInboxSync');if(b)b.disabled=false;const c=document.getElementById('dbmInboxConnect');if(c)c.textContent='Ricollega';status('Verifica collegamento…');await syncInbox(true);
}
async function syncInbox(manual=false){
  if(syncing||!M)return;const t=token();if(!t){if(manual)status('Prima premi Collega','err');return}
  syncing=true;status('Sincronizzazione…');
  try{
    let rows=await rpc('manager_request_inbox',{p_token:t});if(!Array.isArray(rows))rows=[];
    count(rows.length);
    const a=await leads(),known=new Set(seen()),ack=[];let added=0;
    for(const r of rows){
      const k=remoteKey(r);if(!k)continue;
      if(known.has(k)||a.some(x=>x.requestInboxId===k)){if(r.id)ack.push(String(r.id));continue}
      a.unshift({id:M.uid(),name:text(r.name)||'Richiesta sito',phone:text(r.phone),email:'',source:'Sito web',type:'Homeowner',status:'new',nextDate:M.today(),lastContactDate:'',value:0,notes:requestNotes(r),requestInboxId:k,createdAt:text(r.created_at)||new Date().toISOString(),updatedAt:new Date().toISOString(),clientId:''});
      known.add(k);if(r.id)ack.push(String(r.id));added++;
    }
    if(added)await saveLeads(a);
    saveSeen([...known]);
    if(ack.length){try{await rpc('manager_request_ack',{p_token:t,p_ids:[...new Set(ack)]})}catch(e){console.warn('Request Inbox ack',e)}}
    count(0);lastSync=Date.now();status(added?`${added} nuova richiesta importata nel CRM`:'Aggiornato · nessuna nuova richiesta','ok');
    if(typeof M.renderLeads==='function')await M.renderLeads();
    if(typeof M.refreshHome==='function')await M.refreshHome();
  }catch(e){console.error('Request Inbox sync',e);status(/401|403|unauthorized/i.test(String(e))?'Codice non valido · premi Ricollega':`Errore sincronizzazione: ${String(e.message||e)}`,'err')}
  finally{syncing=false}
}
function autoSync(){if(!token()||document.visibilityState==='hidden')return;if(Date.now()-lastSync<60000)return;syncInbox(false)}
function init(){
  M=window.DBM;if(!M?.setting||!M?.lPut)return setTimeout(init,100);
  ensureSources();ensureStyles();ensureInboxPanel();updatePrivacy();
  new MutationObserver(()=>{ensureSources();ensureInboxPanel();updatePrivacy()}).observe(document.body,{subtree:true,childList:true});
  if(token())setTimeout(()=>syncInbox(false),700);
  document.addEventListener('visibilitychange',autoSync);window.addEventListener('focus',autoSync);setInterval(autoSync,240000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
