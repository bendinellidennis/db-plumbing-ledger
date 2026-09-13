(()=>{
'use strict';
let M,dialog,btn,state,status,idField,baseOpenJob,baseOpenMarketing,baseMOne;
const $=id=>document.getElementById(id);
const isCompletedStatus=s=>{
  s=String(s||'').trim().toLowerCase();
  return s==='completed'||(!!s&&s!=='active'&&!s.startsWith('quote'));
};
const wait=()=>{
  M=window.DBM;
  dialog=$('dbmJobDialog');
  btn=$('dbmJobMarketingOpen');
  state=$('dbmJobMarketingState');
  status=$('dbmJobStatus');
  idField=$('dbmJobId');
  if(!M?.openJob||!M?.openJobMarketing||!M?.mOne||!dialog||!btn||!state||!status||!idField)return setTimeout(wait,100);
  init();
};
async function current(){
  const id=String(idField.value||'').trim();
  const job=id?await baseMOne('jobs',id):null;
  const raw=String(job?.status||status.value||'').trim();
  return {id,job,raw,completed:isCompletedStatus(raw)};
}
async function paint(){
  const x=await current();
  btn.disabled=!x.id||!x.completed;
  if(!x.id){state.textContent='Salva prima il lavoro.';return}
  if(!x.completed){state.textContent='Disponibile quando il lavoro è completato.';return}
  const d=x.job?.dossier||{};
  const count=[d.beforeFileId,d.afterFileId].filter(Boolean).length;
  state.textContent=count?`Pronto · ${count} foto reale${count===1?'':'i'} dal dossier.`:'Pronto per il testo. Per condividere immagini aggiungi Foto prima/dopo nel Dossier lavoro.';
}
async function launch(e){
  e?.preventDefault?.();
  const x=await current();
  if(!x.id||!x.job){alert('Lavoro non trovato. Nessun dato è stato modificato.');return}
  if(!x.completed){alert('Job → Marketing è disponibile solo per lavori completati.');return}
  const previous=M.mOne;
  M.mOne=async(store,key)=>{
    const rec=await previous.call(M,store,key);
    if(store==='jobs'&&String(key)===x.id&&rec&&isCompletedStatus(rec.status)&&rec.status!=='completed')return {...rec,status:'completed'};
    return rec;
  };
  try{await baseOpenMarketing(x.id)}
  catch(err){console.error('Job → Marketing v94',err);alert('Job → Marketing non riesce ad aprirsi. Nessun dato del lavoro è stato modificato.')}
  finally{M.mOne=previous}
}
function init(){
  if(M.__jobMarketingV94Ready)return;
  M.__jobMarketingV94Ready=true;
  baseMOne=M.mOne.bind(M);
  baseOpenMarketing=M.openJobMarketing.bind(M);
  baseOpenJob=M.openJob.bind(M);
  M.openJob=async id=>{const r=await baseOpenJob(id);await paint();return r};
  btn.onclick=launch;
  status.addEventListener('change',()=>setTimeout(()=>paint().catch(console.error),0));
  dialog.addEventListener('toggle',()=>{if(dialog.open)setTimeout(()=>paint().catch(console.error),0)});
  paint().catch(console.error);
}
wait();
})();
