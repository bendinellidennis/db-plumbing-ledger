(()=>{
'use strict';
const BUSINESS_TYPES=new Set(['Property manager','Landlord / Owner','B&B / Guesthouse','Azienda']);
function contactName(name,type){
  const s=String(name||'').trim();
  if(!s)return'';
  const parts=s.split(/\s*[\/|]\s*/).filter(Boolean);
  if(parts.length>1){
    const c=parts[parts.length-1].trim();
    if(c && c.length<=40)return c.split(/\s+/)[0];
  }
  if(BUSINESS_TYPES.has(type))return'';
  return s.split(/\s+/)[0];
}
function correctMessage(text,name,type){
  const t=String(text||'');
  if(!t)return t;
  const c=contactName(name,type);
  const hello=c?`Hi ${c},`:'Hi,';
  return t.replace(/^Hi(?:\s+[^,]+)?,/,hello);
}
function correctWhatsAppLink(a,name,type){
  if(!a?.href||!a.href.includes('wa.me/'))return;
  try{
    const u=new URL(a.href);
    const text=u.searchParams.get('text');
    if(!text)return;
    const fixed=correctMessage(text,name,type);
    if(fixed!==text){u.searchParams.set('text',fixed);a.href=u.toString()}
  }catch{}
}
function typeFromSmall(small){
  const t=String(small?.textContent||'').trim();
  return t.split('·')[0]?.trim()||'';
}
function fixFollowCards(){
  document.querySelectorAll('.dbm-follow-card').forEach(card=>{
    const name=card.querySelector('.dbm-follow-top b')?.textContent?.trim()||'';
    const type=typeFromSmall(card.querySelector('.dbm-follow-top small'));
    const msg=card.querySelector('.dbm-follow-message');
    if(msg)msg.textContent=correctMessage(msg.textContent,name,type);
    card.querySelectorAll('a[href*="wa.me/"]').forEach(a=>correctWhatsAppLink(a,name,type));
  });
  document.querySelectorAll('.dbm-lead-row').forEach(card=>{
    const name=card.querySelector('.dbm-lead-row-top b')?.textContent?.trim()||'';
    const type=typeFromSmall(card.querySelector('.dbm-lead-row-top small'));
    card.querySelectorAll('a[href*="wa.me/"]').forEach(a=>correctWhatsAppLink(a,name,type));
  });
}
function fixEditor(){
  const d=document.getElementById('dbmLeadEditDialog');
  if(!d?.open)return;
  const name=document.getElementById('dbmLeadName')?.value?.trim()||'';
  const type=document.getElementById('dbmLeadType')?.value||'';
  const preview=document.getElementById('dbmLeadWaPreview');
  if(preview)preview.value=correctMessage(preview.value,name,type);
  d.querySelectorAll('a[href*="wa.me/"]').forEach(a=>correctWhatsAppLink(a,name,type));
}
let scheduled=false;
function run(){scheduled=false;fixFollowCards();fixEditor()}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(run,0)}
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['open','href','value']});
document.addEventListener('input',e=>{if(['dbmLeadName','dbmLeadType'].includes(e.target?.id))schedule()});
document.addEventListener('change',e=>{if(['dbmLeadName','dbmLeadType'].includes(e.target?.id))schedule()});
schedule();
})();
