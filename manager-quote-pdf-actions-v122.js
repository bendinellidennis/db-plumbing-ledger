(()=>{
'use strict';
let list=null;
function addActions(){
  if(!list)return;
  list.querySelectorAll('[data-quote]').forEach(row=>{
    const actions=row.querySelector('.dbm-flow-row-actions');
    if(!actions||actions.querySelector('.dbm-qpdf-actions'))return;
    const box=document.createElement('div');
    box.className='dbm-qpdf-actions';
    box.innerHTML='<button type="button" class="secondary small" data-qpdf-open>Apri PDF</button><button type="button" class="primary small" data-qpdf-save>Salva PDF</button><div class="dbm-qpdf-note"><strong>Preventivo PDF:</strong> nessun link cliente e nessun pulsante Accetta/Rifiuta. Salva il PDF e invialo come documento.</div>';
    actions.appendChild(box);
  });
}
function wait(){
  if(!window.DBM?.__quotePdfV121Ready)return setTimeout(wait,80);
  list=document.getElementById('dbmQuoteList');
  if(!list)return setTimeout(wait,80);
  if(list.dataset.dbmPdfActionsV122==='1'){addActions();return}
  list.dataset.dbmPdfActionsV122='1';
  addActions();
  new MutationObserver(()=>addActions()).observe(list,{childList:true});
}
wait();
})();
