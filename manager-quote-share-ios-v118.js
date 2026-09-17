(()=>{
'use strict';
if(window.__DBMQuoteIOSBridgeV119)return;
window.__DBMQuoteIOSBridgeV119=true;
let openTimer=null,shareTimer=null;

function fakePopup(){
  const proxy={document:{write(){},open(){},close(){}},close(){},focus(){}};
  const loc={};
  Object.defineProperty(loc,'href',{
    configurable:true,
    get(){return window.location.href},
    set(v){if(v)window.location.assign(v)}
  });
  proxy.location=loc;
  return proxy;
}

function patchWindowOpen(){
  const current=window.open;
  if(typeof current!=='function'||current.__dbmQuoteIOSV119)return;
  const original=current;
  const patched=function(url,target,features){
    const u=String(url||'');
    if((target==='_blank'||!target)&&(u===''||u==='about:blank'||u.startsWith('about:blank#'))){
      return fakePopup();
    }
    return original.call(window,url,target,features);
  };
  patched.__dbmQuoteIOSV119=true;
  try{window.open=patched}catch{return}
  clearTimeout(openTimer);
  openTimer=setTimeout(()=>{try{if(window.open===patched)window.open=original}catch{}},120000);
}

function patchNativeShare(){
  if(typeof navigator.share!=='function'||navigator.share.__dbmQuoteIOSV119)return;
  const hadOwn=Object.prototype.hasOwnProperty.call(navigator,'share');
  const ownDesc=Object.getOwnPropertyDescriptor(navigator,'share');
  const current=navigator.share;
  const original=current.bind(navigator);
  const wrapped=function(data){
    const files=Array.isArray(data?.files)?data.files.filter(Boolean):[];
    if(files.length){
      // WhatsApp / WhatsApp Business on iOS can accept the Web Share handoff
      // but then fail to send the temporary browser attachment. Deliberately
      // reject here so the quotation module uses its download/save fallback,
      // producing a real PDF file that can be attached as a Document.
      const err=new Error('DBM_PDF_SAVE_REQUIRED');
      err.name='NotSupportedError';
      return Promise.reject(err);
    }
    return original(data);
  };
  wrapped.__dbmQuoteIOSV119=true;
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
  },120000);
}

function relabel(){
  document.querySelectorAll('[data-qpdf-share]').forEach(b=>{
    b.textContent='Salva PDF';
    b.setAttribute('aria-label','Salva il preventivo come PDF');
  });
  document.querySelectorAll('.dbm-qpdf-note').forEach(n=>{
    n.innerHTML='<strong>Invio PDF:</strong> salva il file e allegalo in WhatsApp o WhatsApp Business come Documento. Nessun link viene inviato al cliente.';
  });
}

const observer=new MutationObserver(relabel);
if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
relabel();

document.addEventListener('click',e=>{
  const t=e.target;
  if(!t?.closest)return;
  if(t.closest('[data-qpdf-open]'))patchWindowOpen();
  if(t.closest('[data-qpdf-share]')){
    relabel();
    patchNativeShare();
  }
},true);
})();
