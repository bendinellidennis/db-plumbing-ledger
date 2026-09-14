(()=>{
'use strict';
const KEY='serviceReportsV1';
let M;
const wait=()=>{M=window.DBM;const form=document.getElementById('dbmServiceReportForm');if(!M?.setting||!form)return setTimeout(wait,120);init(form)};
function addStyle(){if(document.getElementById('dbmSrSaveStatusStyle'))return;const s=document.createElement('style');s.id='dbmSrSaveStatusStyle';s.textContent='#dbmSrSaveStatus{display:none;margin:10px 0 0;padding:10px 12px;border:1px solid #b7dcc8;background:#eefaf3;color:#17653b;border-radius:10px;font-size:12px;font-weight:800;text-align:center}#dbmSrSaveStatus.show{display:block}#dbmServiceReportEdit button{touch-action:manipulation;-webkit-tap-highlight-color:rgba(8,123,193,.12)}';document.head.appendChild(s)}
function ensureStatus(form){let el=document.getElementById('dbmSrSaveStatus');if(el)return el;el=document.createElement('div');el.id='dbmSrSaveStatus';el.setAttribute('role','status');const save=form.querySelector('button[value="save"]');if(save)save.insertAdjacentElement('afterend',el);else form.appendChild(el);return el}
async function confirmSaved(form){const el=ensureStatus(form);el.classList.remove('show');el.textContent='';for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,100));const id=document.getElementById('dbmSrId')?.value||'';if(!id)continue;try{const raw=await M.setting(KEY,'');const list=raw?JSON.parse(raw):[];const report=Array.isArray(list)?list.find(x=>x.id===id):null;if(report){el.textContent=`✓ Rapporto ${report.number} salvato`;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),3500);return}}catch{}}
el.textContent='Rapporto salvato';el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),3500)}
function installTouchBridge(){const dlg=document.getElementById('dbmServiceReportEdit');if(!dlg||dlg.dataset.touchBridgeV118==='1')return;dlg.dataset.touchBridgeV118='1';let gesture=null;
 const clear=()=>{gesture=null};
 dlg.addEventListener('touchstart',e=>{const t=e.changedTouches?.[0],btn=e.target.closest?.('button');gesture=t&&btn?{btn,x:t.clientX,y:t.clientY,moved:false}:null},{capture:true,passive:true});
 dlg.addEventListener('touchmove',e=>{if(!gesture)return;const t=e.changedTouches?.[0];if(!t)return;if(Math.hypot(t.clientX-gesture.x,t.clientY-gesture.y)>12)gesture.moved=true},{capture:true,passive:true});
 dlg.addEventListener('touchcancel',clear,{capture:true,passive:true});
 dlg.addEventListener('touchend',e=>{if(!gesture)return;const g=gesture;clear();const btn=e.target.closest?.('button');if(!btn||btn!==g.btn||g.moved||btn.disabled)return;e.preventDefault();e.stopPropagation();
   if(btn.id==='dbmSrSharePdf'){
     if(dlg.open)dlg.close();
     try{document.activeElement?.blur?.()}catch{}
     if(typeof btn.onclick==='function')btn.onclick.call(btn,e);
     return;
   }
   if(btn.type==='submit'&&btn.form){btn.form.requestSubmit(btn);return}
   btn.click();
 },{capture:true,passive:false});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')clear()},true);
 window.addEventListener('pageshow',clear,true);
}
function init(form){if(M.__serviceReportSaveConfirmReadyV4)return;M.__serviceReportSaveConfirmReadyV4=true;addStyle();ensureStatus(form);installTouchBridge();form.addEventListener('submit',()=>confirmSaved(form))}
wait();
})();