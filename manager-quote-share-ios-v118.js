(()=>{
'use strict';
if(window.__DBMQuoteIOSBridgeV118)return;
window.__DBMQuoteIOSBridgeV118=true;
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
  if(typeof current!=='function'||current.__dbmQuoteIOSV118)return;
  const original=current;
  const patched=function(url,target,features){
    const u=String(url||'');
    if((target==='_blank'||!target)&&(u===''||u==='about:blank'||u.startsWith('about:blank#'))){
      return fakePopup();
    }
    return original.call(window,url,target,features);
  };
  patched.__dbmQuoteIOSV118=true;
  try{window.open=patched}catch{return}
  clearTimeout(openTimer);
  openTimer=setTimeout(()=>{try{if(window.open===patched)window.open=original}catch{}},120000);
}

function patchNativeShare(){
  if(typeof navigator.share!=='function'||navigator.share.__dbmQuoteIOSV118)return;
  const hadOwn=Object.prototype.hasOwnProperty.call(navigator,'share');
  const ownDesc=Object.getOwnPropertyDescriptor(navigator,'share');
  const current=navigator.share;
  const original=current.bind(navigator);
  const wrapped=function(data){
    const files=Array.isArray(data?.files)?data.files.filter(Boolean):[];
    if(files.length){
      // iOS/WebKit can hand WhatsApp an invalid payload when a file is
      // shared together with text/title. For quotations we deliberately
      // share the PDF file only.
      return original({files});
    }
    return original(data);
  };
  wrapped.__dbmQuoteIOSV118=true;
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

document.addEventListener('click',e=>{
  const t=e.target;
  if(!t?.closest)return;
  if(t.closest('[data-qpdf-open]'))patchWindowOpen();
  if(t.closest('[data-qpdf-share]'))patchNativeShare();
},true);
})();
