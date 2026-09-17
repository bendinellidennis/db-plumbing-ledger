(()=>{
'use strict';
if(window.__DBMQuoteIOSBridgeV120)return;
window.__DBMQuoteIOSBridgeV120=true;
let shareTimer=null;

function patchNativeShare(){
  if(typeof navigator.share!=='function'||navigator.share.__dbmQuoteIOSV120)return;
  const hadOwn=Object.prototype.hasOwnProperty.call(navigator,'share');
  const ownDesc=Object.getOwnPropertyDescriptor(navigator,'share');
  const current=navigator.share;
  const original=current.bind(navigator);
  const wrapped=function(data){
    const files=Array.isArray(data?.files)?data.files.filter(Boolean):[];
    if(files.length){
      const err=new Error('DBM_PDF_SAVE_REQUIRED');
      err.name='NotSupportedError';
      return Promise.reject(err);
    }
    return original(data);
  };
  wrapped.__dbmQuoteIOSV120=true;
  let installed=false;
  try{
    Object.defineProperty(navigator,'share',{configurable:true,writable:true,value:wrapped});
    installed=navigator.share===wrapped;
  }catch{}
  if(!installed){
    try{navigator.share=wrapped;installed=navigator.share===wrapped}catch{}
  }
  if(!installed)return;
  clearTimeout(shareTimer);
  shareTimer=setTimeout(()=>{
    try{
      if(navigator.share!==wrapped)return;
      if(hadOwn&&ownDesc)Object.defineProperty(navigator,'share',ownDesc);
      else delete navigator.share;
    }catch{try{navigator.share=current}catch{}}
  },30000);
}

function relabel(root=document){
  root.querySelectorAll?.('[data-qpdf-share]').forEach(b=>{
    if(b.textContent!=='Salva PDF')b.textContent='Salva PDF';
    if(b.getAttribute('aria-label')!=='Salva il preventivo come PDF')b.setAttribute('aria-label','Salva il preventivo come PDF');
  });
  root.querySelectorAll?.('.dbm-qpdf-note').forEach(n=>{
    const text='Invio PDF: salva il file e allegalo in WhatsApp o WhatsApp Business come Documento. Nessun link viene inviato al cliente.';
    if(n.dataset.dbmPdfNote==='1')return;
    n.innerHTML='<strong>Invio PDF:</strong> salva il file e allegalo in WhatsApp o WhatsApp Business come Documento. Nessun link viene inviato al cliente.';
    n.dataset.dbmPdfNote='1';
  });
}

function installRelabelObserver(){
  const list=document.getElementById('dbmQuoteList');
  if(!list||list.dataset.dbmPdfObserver==='1')return;
  list.dataset.dbmPdfObserver='1';
  relabel(list);
  new MutationObserver(mutations=>{
    for(const m of mutations){
      for(const node of m.addedNodes){
        if(node.nodeType===1)relabel(node);
      }
    }
  }).observe(list,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRelabelObserver,{once:true});
else installRelabelObserver();

document.addEventListener('click',e=>{
  const t=e.target;
  if(!t?.closest)return;
  if(t.closest('[data-qpdf-share]'))patchNativeShare();
},true);
})();
