(()=>{
'use strict';
const SUPABASE_URL='https://gscrhubeifhlbxxrdlwo.supabase.co';
const SUPABASE_KEY='sb_publishable_FXBhsGpZ2R73HV1G--uByw_D041l7pz';
const RPC=`${SUPABASE_URL}/rest/v1/rpc/`;
let M,baseRenderQuotes,baseOpenQuote,syncing=false;

const wait=()=>{
  M=window.DBM;
  if(!M?.renderQuotes||!M?.openQuote||!M?.mAll||!document.getElementById('quotesV2')) return setTimeout(wait,100);
  init();
};

function init(){
  if(M.__interactiveQuotesV84Ready)return;
  M.__interactiveQuotesV84Ready=true;
  addStyles();
  baseRenderQuotes=M.renderQuotes.bind(M);
  baseOpenQuote=M.openQuote.bind(M);

  M.openQuote=async id=>{
    if(id) await syncOneById(id,false);
    const result=await baseOpenQuote(id);
    if(id){
      const q=await M.mOne('jobs',id);
      if(q?.status==='quote_change_requested'){
        const s=document.getElementById('dbmJobStatus');
        if(s&&!s.querySelector('option[value="quote_change_requested"]')){
          const o=document.createElement('option');
          o.value='quote_change_requested';
          o.textContent='Modifica richiesta';
          s.appendChild(o);
        }
        if(s)s.value='quote_change_requested';
      }
    }
    return result;
  };

  M.renderQuotes=async()=>{
    await syncAll(false);
    await baseRenderQuotes();
    await decorate();
  };

  const quotes=document.getElementById('quotesV2');
  quotes.addEventListener('click',onQuoteAction);
  setInterval(backgroundSync,30000);
  M.renderQuotes();
}

function addStyles(){
  if(document.getElementById('dbmInteractiveQuoteV84Style'))return;
  const s=document.createElement('style');
  s.id='dbmInteractiveQuoteV84Style';
  s.textContent=`
    .dbm-iq-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
    .dbm-iq-note{width:100%;font-size:9.5px;color:#64748b;line-height:1.35;margin-top:1px}
    .dbm-iq-note strong{color:#0f172a}
    .dbm-status.quote_change_requested{background:#fff7e6;color:#8a5a00;border-color:#f3ddb0}
    .dbm-iq-live{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:900;color:#0d7a55}
    .dbm-iq-live:before{content:'●';font-size:7px}
    .dbm-iq-toast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:99999;background:#102a43;color:white;border-radius:999px;padding:10px 14px;font-size:11px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,.22);max-width:calc(100vw - 28px);text-align:center}
  `;
  document.head.appendChild(s);
}

async function rpc(name,body){
  const r=await fetch(RPC+name,{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
    body:JSON.stringify(body)
  });
  let data=null;
  try{data=await r.json()}catch{}
  if(!r.ok) throw new Error(data?.message||data?.error||`HTTP ${r.status}`);
  return data;
}

function token(){
  const b=new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function quoteLink(q){
  if(!q?.interactivePublicToken)return'';
  const u=new URL('quote.html',location.href);
  u.searchParams.set('t',q.interactivePublicToken);
  return u.toString();
}

function quoteTotal(lines=[]){
  return lines.reduce((s,l)=>s+M.n(l.qty)*M.n(l.sell),0);
}

async function publicPayload(q){
  const clients=await M.clients();
  const c=clients.find(x=>x.id===q.clientId)||{};
  return {
    business:{
      name:await M.setting('tradeName','DB Plumbing Services'),
      legalName:await M.setting('legalName','Dennis Bendinelli'),
      phone:'+356 7753 2068',
      email:'dbplumbingservicesmalta@gmail.com'
    },
    client:{name:c.name||'Client'},
    quote:{
      key:q.id,
      title:q.title||'Quotation',
      date:q.date||M.today(),
      location:q.location||'',
      lines:(q.lines||[]).map(l=>({
        description:String(l.description||''),
        qty:M.n(l.qty),
        sell:M.n(l.sell)
      })).filter(l=>l.description||l.sell),
      total:quoteTotal(q.lines||[])
    }
  };
}

async function publish(q,{resetResponse=false,shareAfter=false}={}){
  if(!q)return;
  if(!q.interactivePublicToken)q.interactivePublicToken=token();
  if(!q.interactiveOwnerToken)q.interactiveOwnerToken=token();

  const payload=await publicPayload(q);
  const res=await rpc('interactive_quote_publish',{
    p_public_token:q.interactivePublicToken,
    p_owner_token:q.interactiveOwnerToken,
    p_quote_key:q.id,
    p_payload:payload,
    p_reset_response:!!resetResponse
  });

  q.interactiveVersion=Number(res?.version||q.interactiveVersion||1);
  q.interactiveDecision=res?.decision||'';
  q.interactiveMessage=res?.message||'';
  q.interactiveRespondedAt=res?.respondedAt||'';
  q.interactivePublishedAt=res?.publishedAt||q.interactivePublishedAt||new Date().toISOString();

  if(resetResponse){
    q.interactiveDecision='';
    q.interactiveMessage='';
    q.interactiveRespondedAt='';
    q.status='quote_sent';
  }else if(q.status==='quote'){
    q.status='quote_sent';
  }
  await M.mPut('jobs',q);
  await baseRenderQuotes();
  await decorate();
  toast(resetResponse?'Preventivo aggiornato e pronto da reinviare.':'Link cliente creato. Preventivo segnato come Inviato.');

  if(shareAfter)await share(q);
}

async function share(q){
  const url=quoteLink(q);
  if(!url)return;
  const text=`DB Plumbing Services — ${q.title||'Quotation'}`;
  try{
    if(navigator.share){
      await navigator.share({title:'DB Plumbing Services — Quotation',text,url});
      return;
    }
  }catch(e){
    if(e?.name==='AbortError')return;
  }
  try{
    await navigator.clipboard.writeText(url);
    toast('Link del preventivo copiato.');
  }catch{
    prompt('Copia questo link:',url);
  }
}

function decisionStatus(d){
  if(d==='accepted')return'quote_accepted';
  if(d==='rejected')return'quote_rejected';
  if(d==='change_requested')return'quote_change_requested';
  return'';
}
function decisionLabel(d){
  if(d==='accepted')return'Accettato dal cliente';
  if(d==='rejected')return'Rifiutato dal cliente';
  if(d==='change_requested')return'Modifica richiesta';
  return'';
}

async function syncOne(q,notify=false){
  if(!q?.interactiveOwnerToken)return false;
  let res;
  try{
    res=await rpc('interactive_quote_owner_get',{p_owner_token:q.interactiveOwnerToken});
  }catch{return false}
  if(!res?.ok)return false;

  const nextDecision=res.decision||'';
  const nextStatus=decisionStatus(nextDecision);
  let changed=false;

  if(nextDecision!==String(q.interactiveDecision||'')){q.interactiveDecision=nextDecision;changed=true}
  if((res.message||'')!==String(q.interactiveMessage||'')){q.interactiveMessage=res.message||'';changed=true}
  if((res.respondedAt||'')!==String(q.interactiveRespondedAt||'')){q.interactiveRespondedAt=res.respondedAt||'';changed=true}
  if(Number(res.version||0)!==Number(q.interactiveVersion||0)){q.interactiveVersion=Number(res.version||0);changed=true}
  if(nextStatus&&q.status!==nextStatus){q.status=nextStatus;changed=true}

  if(changed){
    await M.mPut('jobs',q);
    if(notify&&nextDecision)toast(`Preventivo: ${decisionLabel(nextDecision)}.`);
  }
  return changed;
}

async function syncOneById(id,notify=false){
  const q=await M.mOne('jobs',id);
  return syncOne(q,notify);
}

async function syncAll(notify=false){
  if(syncing)return false;
  syncing=true;
  try{
    const all=(await M.mAll('jobs')).filter(q=>q?.interactiveOwnerToken && (String(q.status||'')==='quote'||String(q.status||'').startsWith('quote_')));
    let changed=false;
    for(const q of all) if(await syncOne(q,notify))changed=true;
    return changed;
  }finally{syncing=false}
}

async function backgroundSync(){
  if(document.visibilityState!=='visible')return;
  const changed=await syncAll(true);
  if(changed&&document.getElementById('quotesV2')?.classList.contains('active')){
    await baseRenderQuotes();
    await decorate();
  }
}

async function decorate(){
  const el=document.getElementById('dbmQuoteList');
  if(!el)return;
  const quotes=Object.fromEntries((await M.mAll('jobs')).map(q=>[q.id,q]));

  el.querySelectorAll('[data-quote]').forEach(row=>{
    const q=quotes[row.dataset.quote];
    if(!q)return;
    const status=row.querySelector('.dbm-status');
    if(q.status==='quote_change_requested'&&status){
      status.textContent='Modifica richiesta';
      status.classList.add('quote_change_requested');
    }
    const actions=row.querySelector('.dbm-flow-row-actions');
    if(!actions||actions.querySelector('.dbm-iq-actions'))return;

    const box=document.createElement('div');
    box.className='dbm-iq-actions';
    if(!q.interactivePublicToken){
      box.innerHTML='<button type="button" class="secondary small" data-iq-create>Crea link cliente</button>';
    }else{
      const decision=q.interactiveDecision||'';
      const updateLabel=decision==='change_requested'?'Invia preventivo aggiornato':'Aggiorna link';
      box.innerHTML=`
        <button type="button" class="secondary small" data-iq-share>Condividi link</button>
        <button type="button" class="secondary small" data-iq-update>${updateLabel}</button>
        <span class="dbm-iq-live">Interactive Quote</span>
        <div class="dbm-iq-note">${decision?`<strong>${escapeHtml(decisionLabel(decision))}</strong>${q.interactiveMessage?' · '+escapeHtml(q.interactiveMessage):''}`:'In attesa della risposta del cliente.'}</div>
      `;
    }
    actions.appendChild(box);
  });
}

async function onQuoteAction(e){
  const b=e.target.closest('[data-iq-create],[data-iq-share],[data-iq-update]');
  if(!b)return;
  e.preventDefault();
  e.stopPropagation();
  const row=b.closest('[data-quote]');
  if(!row)return;
  const q=await M.mOne('jobs',row.dataset.quote);
  if(!q)return;

  b.disabled=true;
  try{
    if(b.hasAttribute('data-iq-create')) await publish(q,{shareAfter:true});
    else if(b.hasAttribute('data-iq-share')) await share(q);
    else if(b.hasAttribute('data-iq-update')){
      const reset=q.interactiveDecision==='change_requested'||q.interactiveDecision==='rejected';
      await publish(q,{resetResponse:reset,shareAfter:reset});
    }
  }catch(err){
    console.error('Interactive Quote',err);
    alert('Interactive Quote non disponibile in questo momento. Nessun dato del preventivo è stato perso.');
  }finally{b.disabled=false}
}

function escapeHtml(s){
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function toast(msg){
  document.querySelector('.dbm-iq-toast')?.remove();
  const d=document.createElement('div');
  d.className='dbm-iq-toast';
  d.textContent=msg;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),3200);
}

wait();
})();
