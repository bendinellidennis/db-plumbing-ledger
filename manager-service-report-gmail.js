(()=>{
'use strict';
const KEY='serviceReportsV1';
const DB_GMAIL='dbplumbingservicesmalta@gmail.com';
let M;
const wait=()=>{M=window.DBM;if(!M?.setting||!document.getElementById('dbmServiceReportEdit'))return setTimeout(wait,120);init()};
const fmt=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v||'—')};
async function findReport(id){try{const raw=await M.setting(KEY,'');const list=raw?JSON.parse(raw):[];return Array.isArray(list)?list.find(x=>x.id===id):null}catch{return null}}
function body(r){return `Hi ${r.clientName||''},\n\nPlease find below the service report for the intervention at ${r.address||'the property'}.\n\nSERVICE REPORT ${r.number}\nDate: ${fmt(r.date)}\nClient: ${r.clientName||'—'}\nAddress / Property: ${r.address||'—'}\nIntervention: ${r.workTitle||'—'}\n\nProblem / initial situation:\n${r.problem||'—'}\n\nTechnical findings / diagnosis:\n${r.diagnosis||'—'}\n\nWork carried out:\n${r.workDone||'—'}\n\nMaterials / parts:\n${r.materials||'—'}\n\nRecommendations / next steps:\n${r.recommendations||'None'}\n\nKind regards,\nDennis Bendinelli\nDB Plumbing Services\n+356 7753 2068\n${DB_GMAIL}`}
function gmailUrl(r){const to=String(r.email||'').trim();if(!to)return'';const subject=`DB Plumbing Services - Service Report ${r.number}`;return `https://mail.google.com/mail/?authuser=${encodeURIComponent(DB_GMAIL)}&view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body(r))}`}
async function openGmail(id,w){const r=await findReport(id);if(!r){try{w?.close()}catch{};alert('Rapporto non trovato.');return}if(!String(r.email||'').trim()){try{w?.close()}catch{};alert('Questo cliente non ha un indirizzo email registrato.');return}const url=gmailUrl(r);if(w)w.location.href=url;else window.location.href=url}
function launch(id){if(!id){alert('Salva prima il rapporto.');return}const w=window.open('about:blank','_blank');openGmail(id,w)}
function bindEditor(){const b=document.getElementById('dbmSrEmail');if(!b)return;b.textContent='Gmail';b.onclick=()=>launch(document.getElementById('dbmSrId')?.value||'')}
function bindList(){document.querySelectorAll('#dbmServiceReportList [data-sr-mail]').forEach(b=>{b.textContent='Gmail';b.onclick=()=>launch(b.dataset.srMail||'')})}
function init(){if(M.__serviceReportGmailReady)return;M.__serviceReportGmailReady=true;bindEditor();bindList();const list=document.getElementById('dbmServiceReportList');if(list)new MutationObserver(bindList).observe(list,{childList:true,subtree:true})}
wait();
})();