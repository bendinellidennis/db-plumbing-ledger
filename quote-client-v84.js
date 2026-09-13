(()=>{
'use strict';
const SUPABASE_URL='https://gscrhubeifhlbxxrdlwo.supabase.co';
const SUPABASE_KEY='sb_publishable_FXBhsGpZ2R73HV1G--uByw_D041l7pz';
const RPC=`${SUPABASE_URL}/rest/v1/rpc/`;
const card=document.getElementById('quoteCard');
const token=new URL(location.href).searchParams.get('t')||'';
let state=null;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function money(v){return new Intl.NumberFormat('en-MT',{style:'currency',currency:'EUR'}).format(Number(v||0))}
function fmtDate(v){if(!v)return'';try{return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T12:00:00`))}catch{return v}}
async function rpc(name,body){
  const r=await fetch(RPC+name,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify(body)});
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.error||`HTTP ${r.status}`);
  return data;
}

async function load(){
  if(token.length<32)return renderError('Invalid quotation link','Please ask DB Plumbing Services for a new link.');
  try{
    state=await rpc('interactive_quote_public_get',{p_token:token});
    if(!state?.ok)return renderError('Quotation not found','This link is invalid or no longer available.');
    render();
  }catch(e){
    console.error(e);
    renderError('Unable to load quotation','Please check your connection and try again.');
  }
}

function render(){
  const p=state.quote||{},q=p.quote||{},b=p.business||{},c=p.client||{};
  const lines=Array.isArray(q.lines)?q.lines:[];
  card.innerHTML=`
    <div class="head">
      <div>
        <h2>${esc(q.title||'Quotation')}</h2>
        <div class="meta">${esc(fmtDate(q.date))}${q.location?` · ${esc(q.location)}`:''}</div>
      </div>
      <div class="total"><span>Quotation total</span><b>${money(q.total)}</b></div>
    </div>
    <div class="client"><b>Prepared for</b>${esc(c.name||'Client')}</div>
    <div class="lines">
      ${lines.map(l=>`<div class="line"><div><div class="desc">${esc(l.description||'Item')}</div><span class="qty">Qty ${Number(l.qty||0)}</span></div><div class="price">${money(Number(l.qty||0)*Number(l.sell||0))}</div></div>`).join('')}
    </div>
    <div class="summary"><span>Total</span><b>${money(q.total)}</b></div>
    <section class="decision">
      <h3>Your response</h3>
      <p>You can accept this quotation, request a change, or decline it. Your response is sent directly to DB Plumbing Services.</p>
      <div id="buttons" class="buttons">
        <button class="accept" data-decision="accepted">Accept</button>
        <button class="change" data-open-change>Request a change</button>
        <button class="reject" data-decision="rejected">Decline</button>
      </div>
      <div id="changeBox" class="change-box">
        <textarea id="changeMessage" maxlength="2000" placeholder="Please tell us what you would like changed…"></textarea>
        <button id="submitChange" class="submit-change">Send change request</button>
      </div>
      <div id="result" class="result"></div>
    </section>
    <div class="contact">
      ${esc(b.name||'DB Plumbing Services')}<br>
      ${b.phone?`<a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>`:''}${b.email?` · <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`:''}
    </div>
  `;
  card.querySelector('[data-open-change]').onclick=()=>card.querySelector('#changeBox').classList.toggle('open');
  card.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>submit(b.dataset.decision,''));
  card.querySelector('#submitChange').onclick=()=>{
    const msg=card.querySelector('#changeMessage').value.trim();
    if(!msg){card.querySelector('#changeMessage').focus();return}
    submit('change_requested',msg);
  };
  if(state.decision)showResult(state.decision,'',state.respondedAt);
}

async function submit(decision,message){
  if(state?.decision)return;
  if(decision==='accepted'&&!confirm('Accept this quotation?'))return;
  if(decision==='rejected'&&!confirm('Decline this quotation?'))return;
  setDisabled(true);
  try{
    const res=await rpc('interactive_quote_respond',{
      p_token:token,
      p_decision:decision,
      p_message:message||null,
      p_version:Number(state.version||0)||null
    });
    if(!res?.ok){
      if(res?.error==='already_responded'){
        state.decision=res.decision;showResult(res.decision,res.message,res.respondedAt);return;
      }
      if(res?.error==='stale_version'){
        renderError('Quotation updated','DB Plumbing Services has updated this quotation. Please reopen the latest link before responding.');
        return;
      }
      throw new Error(res?.error||'response_failed');
    }
    state.decision=res.decision;
    state.respondedAt=res.respondedAt;
    showResult(res.decision,res.message,res.respondedAt);
  }catch(e){
    console.error(e);
    alert('Your response could not be sent. Please try again.');
    setDisabled(false);
  }
}

function setDisabled(v){card.querySelectorAll('button').forEach(b=>b.disabled=v)}

function showResult(decision,message,at){
  setDisabled(true);
  const box=card.querySelector('#result');if(!box)return;
  const labels={
    accepted:'Thank you. You accepted this quotation.',
    change_requested:'Thank you. Your change request has been sent.',
    rejected:'Your response has been recorded. You declined this quotation.'
  };
  box.className=`result show ${decision}`;
  box.innerHTML=`<strong>${esc(labels[decision]||'Response recorded.')}</strong>${message?`<br>${esc(message)}`:''}${at?`<br><small>${esc(new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(at)))}</small>`:''}`;
  card.querySelector('#changeBox')?.classList.remove('open');
}

function renderError(title,text){
  card.innerHTML=`<div class="error"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;
}

load();
})();
