(()=>{
'use strict';
const KEY='serviceReportsV1';
let M;
const wait=()=>{M=window.DBM;const form=document.getElementById('dbmServiceReportForm');if(!M?.setting||!form)return setTimeout(wait,120);init(form)};
function addStyle(){if(document.getElementById('dbmSrSaveToastStyle'))return;const s=document.createElement('style');s.id='dbmSrSaveToastStyle';s.textContent='#dbmSrSaveToast{position:fixed;left:50%;bottom:92px;transform:translate(-50%,16px);z-index:99999;background:#0b1f35;color:#fff;border-radius:999px;padding:11px 18px;font-size:13px;font-weight:800;box-shadow:0 10px 28px #0003;opacity:0;pointer-events:none;transition:.2s;white-space:nowrap}#dbmSrSaveToast.show{opacity:1;transform:translate(-50%,0)}';document.head.appendChild(s)}
function toast(text){let el=document.getElementById('dbmSrSaveToast');if(!el){el=document.createElement('div');el.id='dbmSrSaveToast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=text;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),2300)}
async function confirmSaved(){for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,100));const id=document.getElementById('dbmSrId')?.value||'';if(!id)continue;try{const raw=await M.setting(KEY,'');const list=raw?JSON.parse(raw):[];const report=Array.isArray(list)?list.find(x=>x.id===id):null;if(report){toast(`Rapporto ${report.number} salvato ✓`);return}}catch{}}}
function init(form){if(M.__serviceReportSaveConfirmReady)return;M.__serviceReportSaveConfirmReady=true;addStyle();form.addEventListener('submit',()=>{confirmSaved()})}
wait();
})();