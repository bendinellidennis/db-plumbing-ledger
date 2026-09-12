(()=>{
'use strict';
const KEY='serviceReportsV1';
let M;
const wait=()=>{M=window.DBM;const form=document.getElementById('dbmServiceReportForm');if(!M?.setting||!form)return setTimeout(wait,120);init(form)};
function addStyle(){if(document.getElementById('dbmSrSaveStatusStyle'))return;const s=document.createElement('style');s.id='dbmSrSaveStatusStyle';s.textContent='#dbmSrSaveStatus{display:none;margin:10px 0 0;padding:10px 12px;border:1px solid #b7dcc8;background:#eefaf3;color:#17653b;border-radius:10px;font-size:12px;font-weight:800;text-align:center}#dbmSrSaveStatus.show{display:block}';document.head.appendChild(s)}
function ensureStatus(form){let el=document.getElementById('dbmSrSaveStatus');if(el)return el;el=document.createElement('div');el.id='dbmSrSaveStatus';el.setAttribute('role','status');const save=form.querySelector('button[value="save"]');if(save)save.insertAdjacentElement('afterend',el);else form.appendChild(el);return el}
async function confirmSaved(form){const el=ensureStatus(form);el.classList.remove('show');el.textContent='';for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,100));const id=document.getElementById('dbmSrId')?.value||'';if(!id)continue;try{const raw=await M.setting(KEY,'');const list=raw?JSON.parse(raw):[];const report=Array.isArray(list)?list.find(x=>x.id===id):null;if(report){el.textContent=`✓ Rapporto ${report.number} salvato`;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),3500);return}}catch{}}
el.textContent='Rapporto salvato';el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),3500)}
function init(form){if(M.__serviceReportSaveConfirmReadyV2)return;M.__serviceReportSaveConfirmReadyV2=true;addStyle();ensureStatus(form);form.addEventListener('submit',()=>confirmSaved(form))}
wait();
})();