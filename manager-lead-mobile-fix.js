(()=>{
'use strict';
function applyViewportGuard(){
  const vp=document.querySelector('meta[name="viewport"]');
  if(!vp)return;
  vp.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
}
function enforce(){
  const d=document.getElementById('dbmLeadEditDialog');
  const f=document.getElementById('dbmLeadForm');
  if(!d||!f)return;
  d.style.setProperty('max-width','100vw','important');
  d.style.setProperty('overflow-x','hidden','important');
  f.style.setProperty('max-width','100%','important');
  f.style.setProperty('overflow-x','hidden','important');
  f.querySelectorAll('input,select,textarea').forEach(el=>{
    el.style.setProperty('font-size','17px','important');
    el.style.setProperty('width','100%','important');
    el.style.setProperty('max-width','100%','important');
    el.style.setProperty('min-width','0','important');
    el.style.setProperty('box-sizing','border-box','important');
    el.style.setProperty('transform','none','important');
  });
  const last=document.getElementById('dbmLeadLastContact');
  const value=document.getElementById('dbmLeadValue');
  const row=last?.closest('.two-cols');
  if(row&&value&&row.contains(value)){
    row.style.setProperty('grid-template-columns','minmax(0,1fr)','important');
    row.style.setProperty('gap','0','important');
    row.style.setProperty('min-width','0','important');
    row.querySelectorAll(':scope > label').forEach(l=>{
      l.style.setProperty('width','100%','important');
      l.style.setProperty('max-width','100%','important');
      l.style.setProperty('min-width','0','important');
    });
  }
}
function injectStyles(){
  if(document.getElementById('dbmLeadMobileFixStyle'))return;
  const s=document.createElement('style');
  s.id='dbmLeadMobileFixStyle';
  s.textContent=`
#dbmLeadEditDialog,#dbmLeadEditDialog>form{max-width:100vw!important;overflow-x:hidden!important}
#dbmLeadForm input,#dbmLeadForm select,#dbmLeadForm textarea{font-size:17px!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;transform:none!important;-webkit-text-size-adjust:100%;touch-action:manipulation}
#dbmLeadLastContact,#dbmLeadValue{min-width:0!important;max-width:100%!important}
@media(max-width:560px){#dbmLeadForm .two-cols:has(#dbmLeadLastContact){grid-template-columns:minmax(0,1fr)!important;gap:0!important;min-width:0!important}#dbmLeadForm .two-cols:has(#dbmLeadLastContact)>label{width:100%!important;max-width:100%!important;min-width:0!important}}
`;
  document.head.appendChild(s);
}
function run(){applyViewportGuard();injectStyles();enforce()}
function init(){
  run();
  new MutationObserver(()=>enforce()).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','class','style']});
  window.addEventListener('resize',enforce,{passive:true});
  document.addEventListener('focusin',e=>{
    if(e.target?.closest?.('#dbmLeadForm')){
      applyViewportGuard();
      enforce();
      requestAnimationFrame(enforce);
      setTimeout(enforce,60);
    }
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
