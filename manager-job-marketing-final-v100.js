(()=>{
'use strict';
let M,baseOpenJob,currentId='';
const $=id=>document.getElementById(id);

const wait=()=>{
  M=window.DBM;
  if(!M?.openJob||!M?.openJobMarketing||!$('dbmJobMarketingOpen')||!$('dbmJobMarketingState')) return setTimeout(wait,100);
  if(M.__jobMarketingFinalV100Ready)return;
  M.__jobMarketingFinalV100Ready=true;
  baseOpenJob=M.openJob.bind(M);
  M.openJob=async id=>{
    const r=await baseOpenJob(id);
    const realId=String($('dbmJobId')?.value||id||'').trim();
    sync(realId);
    requestAnimationFrame(()=>sync(realId));
    setTimeout(()=>sync(realId),80);
    setTimeout(()=>sync(realId),250);
    return r;
  };
  if($('dbmJobDialog')?.open){
    const realId=String($('dbmJobId')?.value||'').trim();
    sync(realId);
    setTimeout(()=>sync(realId),100);
  }
};

function sync(id){
  const btn=$('dbmJobMarketingOpen'),state=$('dbmJobMarketingState');
  if(!btn||!state)return;
  currentId=String(id||$('dbmJobId')?.value||'').trim();
  if(!currentId){
    btn.disabled=true;
    btn.dataset.jobId='';
    state.textContent='Apri un lavoro salvato.';
    return;
  }
  btn.disabled=false;
  btn.dataset.jobId=currentId;
  state.textContent='Pronto per creare il contenuto marketing.';
  btn.onclick=()=>M.openJobMarketing(currentId);
}

wait();
})();
