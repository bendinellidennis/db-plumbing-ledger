(()=>{
'use strict';
let M,dialog,btn,state,status,idField;
const $=id=>document.getElementById(id);
const wait=()=>{
  M=window.DBM;
  dialog=$('dbmJobDialog');
  btn=$('dbmJobMarketingOpen');
  state=$('dbmJobMarketingState');
  status=$('dbmJobStatus');
  idField=$('dbmJobId');
  if(!M?.mOne||!M?.openJobMarketing||!dialog||!btn||!state||!status||!idField)return setTimeout(wait,100);
  init();
};
async function refresh(){
  const id=String(idField.value||'').trim();
  const selectedStatus=String(status.value||'').trim();
  const completed=selectedStatus==='completed';
  btn.disabled=!id||!completed;
  if(!id){state.textContent='Salva prima il lavoro.';return}
  if(!completed){state.textContent='Disponibile quando il lavoro è completato.';return}
  state.textContent='Pronto per il contenuto marketing.';
  try{
    const job=await M.mOne('jobs',id);
    const d=job?.dossier||{};
    const count=[d.beforeFileId,d.afterFileId].filter(Boolean).length;
    state.textContent=count?`Pronto · ${count} foto reale${count===1?'':'i'} dal dossier.`:'Pronto per il testo. Per condividere immagini aggiungi Foto prima/dopo nel Dossier lavoro.';
  }catch(e){console.warn('Job Marketing dossier check',e)}
}
function init(){
  if(M.__jobMarketingFixV93Ready)return;
  M.__jobMarketingFixV93Ready=true;
  const run=()=>setTimeout(()=>refresh().catch(e=>console.error('Job Marketing refresh',e)),0);
  new MutationObserver(mutations=>{
    if(dialog.open&&mutations.some(m=>m.type==='attributes'&&m.attributeName==='open'))run();
  }).observe(dialog,{attributes:true,attributeFilter:['open']});
  dialog.addEventListener('toggle',run);
  status.addEventListener('change',run);
  btn.onclick=async e=>{
    e.preventDefault();
    const id=String(idField.value||'').trim();
    const selectedStatus=String(status.value||'').trim();
    if(!id){alert('Lavoro non identificato. Nessun dato è stato modificato.');return}
    if(selectedStatus!=='completed'){alert('Job → Marketing è disponibile solo quando lo stato visualizzato è Completato.');return}
    try{
      const job=await M.mOne('jobs',id);
      if(!job){alert('Lavoro non trovato. Nessun dato è stato modificato.');return}
      if(job.status!=='completed'){
        alert(`Lo stato salvato del lavoro è ancora "${job.status||'non definito'}". Salva il lavoro come Completato e riprova.`);
        return;
      }
      await M.openJobMarketing(id);
    }catch(err){
      console.error('Job → Marketing open',err);
      alert('Job → Marketing non riesce ad aprirsi. Nessun dato del lavoro è stato modificato.');
    }
  };
  run();
}
wait();
})();
