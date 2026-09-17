(()=>{
'use strict';
const SUPABASE_URL='https://gscrhubeifhlbxxrdlwo.supabase.co';
const SUPABASE_KEY='sb_publishable_FXBhsGpZ2R73HV1G--uByw_D041l7pz';
const RPC=`${SUPABASE_URL}/rest/v1/rpc/`;
const card=document.getElementById('quoteCard');
const token=new URL(location.href).searchParams.get('t')||'';

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function money(v){return new Intl.NumberFormat('en-MT',{style:'currency',currency:'EUR'}).format(Number(v||0))}
function fmtDate(v){if(!v)return'';try{return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T12:00:00`))}catch{return v}}
function clean(v){return String(v??'').replace(/\s+\*\s+/g,'\n').trim()}
async function rpc(name,body){
  const r=await fetch(RPC+name,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify(body)});
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.error||`HTTP ${r.status}`);
  return data;
}
async function load(){
  if(token.length<32)return renderError('Quotation unavailable','Please contact DB Plumbing Services for a PDF copy of your quotation.');
  try{
    const state=await rpc('interactive_quote_public_get',{p_token:token});
    if(!state?.ok)return renderError('Quotation unavailable','Please contact DB Plumbing Services for a PDF copy of your quotation.');
    render(state);
  }catch(e){
    console.error(e);
    renderError('Unable to load quotation','Please contact DB Plumbing Services for a PDF copy of your quotation.');
  }
}
function render(state){
  const p=state.quote||{},q=p.quote||{},b=p.business||{},c=p.client||{};
  const lines=Array.isArray(q.lines)?q.lines:[];
  card.innerHTML=`
    <div class="doc-head">
      <div class="doc-title"><span>QUOTATION</span><h2>${esc(q.title||'Quotation')}</h2></div>
      <div class="doc-total"><small>Total</small><strong>${money(q.total)}</strong></div>
    </div>
    <div class="doc-meta"><div><small>Date</small><b>${esc(fmtDate(q.date))}</b></div><div><small>Prepared for</small><b>${esc(c.name||'Client')}</b></div>${q.location?`<div><small>Location</small><b>${esc(q.location)}</b></div>`:''}</div>
    <div class="lines">${lines.map(l=>`<div class="line"><div><div class="desc">${esc(clean(l.description||'Item')).replace(/\n/g,'<br>')}</div><span class="qty">Qty ${Number(l.qty||0)}</span></div><div class="price">${money(Number(l.qty||0)*Number(l.sell||0))}</div></div>`).join('')}</div>
    <div class="summary"><span>Quotation total</span><b>${money(q.total)}</b></div>
    <div class="static-note">This quotation is provided for reference only. For acceptance, changes or questions, please contact DB Plumbing Services directly.</div>
    <div class="contact"><strong>${esc(b.name||'DB Plumbing Services')}</strong><br>${b.phone?`<a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>`:''}${b.email?` · <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`:''}</div>
  `;
}
function renderError(title,text){card.innerHTML=`<div class="error"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`}
load();
})();
