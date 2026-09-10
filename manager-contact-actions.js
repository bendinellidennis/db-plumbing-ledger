(()=>{
'use strict';
let M;
const wait=()=>{M=window.DBM;if(!M?.clients||!M?.mOne)return setTimeout(wait,100);init()};
const digits=v=>String(v||'').replace(/\D/g,'');
function waNumber(v){let d=digits(v);if(d.startsWith('00'))d=d.slice(2);if(d.length===8)d='356'+d;return d}
function actions(phone,context=''){if(!digits(phone))return'';const tel=String(phone).trim();const wa=waNumber(phone);const msg=context?`Hi, this is Dennis from DB Plumbing Services regarding ${context}.`:'Hi, this is Dennis from DB Plumbing Services.';return `<div class="dbm-contact-actions"><a class="secondary dbm-contact-call" href="tel:${encodeURIComponent(tel)}">☎ Chiama</a><a class="primary dbm-contact-wa" href="https://wa.me/${wa}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">WhatsApp</a></div>`}
function styles(){const s=document.createElement('style');s.textContent=`.dbm-contact-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.dbm-contact-actions a{display:flex;align-items:center;justify-content:center;min-height:44px;text-decoration:none;border-radius:12px;font-weight:800;font-size:13px}.dbm-contact-call{color:#0b6d9c}.dbm-contact-wa{color:#fff!important}`;document.head.appendChild(s)}
function ensureBox(form,id,before){let box=document.getElementById(id);if(!box){box=document.createElement('div');box.id=id;const anchor=form.querySelector(before);anchor?anchor.before(box):form.appendChild(box)}return box}
async function refreshClient(){const form=document.getElementById('clientForm');if(!form)return;const box=ensureBox(form,'dbmClientContactActions','button.primary','button.primary');const phone=document.getElementById('clientPhone')?.value||'';box.innerHTML=actions(phone,'');}
async function refreshJob(){const form=document.getElementById('dbmJobForm');if(!form)return;const box=ensureBox(form,'dbmJobContactActions','label:has(#dbmJobName)','label:has(#dbmJobName)');const id=document.getElementById('dbmJobClient')?.value||'';const c=(await M.clients()).find(x=>x.id===id);const title=document.getElementById('dbmJobName')?.value.trim()||'your job';box.innerHTML=c?actions(c.phone,title):'';}
function refreshLead(){const form=document.getElementById('dbmLeadForm');if(!form)return;const box=ensureBox(form,'dbmLeadContactQuick','label:has(#dbmLeadEmail)','label:has(#dbmLeadEmail)');const phone=document.getElementById('dbmLeadPhone')?.value||'';const name=document.getElementById('dbmLeadName')?.value.trim()||'your enquiry';box.innerHTML=actions(phone,name);}
function init(){if(M.__contactActionsReady)return;M.__contactActionsReady=true;styles();
 const oldClient=window.openClient;if(typeof oldClient==='function'){window.openClient=async function(...a){const r=await oldClient.apply(this,a);setTimeout(refreshClient,0);return r}}
 const cForm=document.getElementById('clientForm');cForm?.addEventListener('input',e=>{if(e.target.id==='clientPhone')refreshClient()});
 const oldJob=M.openJob;if(typeof oldJob==='function'){M.openJob=async function(...a){const r=await oldJob.apply(this,a);setTimeout(refreshJob,0);return r}}
 document.getElementById('dbmJobClient')?.addEventListener('change',refreshJob);document.getElementById('dbmJobName')?.addEventListener('input',refreshJob);
 const leadObs=new MutationObserver(()=>{const d=document.getElementById('dbmLeadEditDialog');if(d?.open)refreshLead()});leadObs.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('input',e=>{if(e.target?.id==='dbmLeadPhone'||e.target?.id==='dbmLeadName')refreshLead()});
}
wait();
})();