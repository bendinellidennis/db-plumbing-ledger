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
  const id=idField.value||'';
  const selectedStatus=status.value||'';
  const job=id?await M.mOne('jobs',id):null;
  const completed=(job?.status||selectedStatus)==='completed';
  btn.disabled=!id||!completed;
  if(!id){state.textContent='Salva prima il lavoro.';return}
  if(!completed){state.textContent='Disponibile quando il lavoro è completato.';return}
  const d=job?.dossier||{};
  const count=[d.beforeFileId,d.afterFileId].filter(Boolean).length;
  state.textContent=count?`Pronto · ${count} foto reale${count===1?'':'i'} dal dossier.`:'Pronto per il testo. Per condividere immagini aggiungi Foto prima/dopo nel Dossier lavoro.';
}
function init(){
  if(M.__jobMarketingFixV92Ready)return;
  M.__jobMarketingFixV92Ready=true;
  const run=()=>setTimeout(()=>refresh().catch(e=>console.error('Job Marketing refresh',e)),0);
  new MutationObserver(mutations=>{
    if(dialog.open&&mutations.some(m=>m.type==='attributes'&&m.attributeName==='open'))run();
  }).observe(dialog,{attributes:true,attributeFilter:['open']});
  dialog.addEventListener('toggle',run);
  status.addEventListener('change',run);
  btn.onclick=async e=>{
    e.preventDefault();
    await refresh();
    if(btn.disabled)return;
    const id=idField.value||'';
    try{await M.openJobMarketing(id)}
    catch(err){
      console.error('Job → Marketing open',err);
      alert('Job → Marketing non riesce ad aprirsi. Nessun dato del lavoro è stato modificato.');
    }
  };
  run();
}
wait();
})();
