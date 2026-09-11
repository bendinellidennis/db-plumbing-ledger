(()=>{
'use strict';
function applyViewportGuard(){
  const vp=document.querySelector('meta[name="viewport"]');
  if(!vp)return;
  const parts=vp.content.split(',').map(x=>x.trim()).filter(Boolean).filter(x=>!/^maximum-scale=/i.test(x));
  parts.push('maximum-scale=1');
  vp.setAttribute('content',parts.join(', '));
}
function markRows(){
  const last=document.getElementById('dbmLeadLastContact');
  const value=document.getElementById('dbmLeadValue');
  const row=last?.closest('.two-cols');
  if(row&&value&&row.contains(value))row.classList.add('dbm-lead-contact-row');
}
function injectStyles(){
  if(document.getElementById('dbmLeadMobileFixStyle'))return;
  const s=document.createElement('style');
  s.id='dbmLeadMobileFixStyle';
  s.textContent=`
.dbm-leads-dialog,.dbm-leads-dialog>form,#dbmLeadForm{max-width:100%;overflow-x:hidden}
.dbm-leads-dialog .two-cols{min-width:0}
.dbm-leads-dialog .two-cols>label{min-width:0}
.dbm-leads-dialog input,.dbm-leads-dialog select,.dbm-leads-dialog textarea{width:100%;max-width:100%;min-width:0;font-size:16px!important;transform:none!important;touch-action:manipulation}
#dbmLeadLastContact,#dbmLeadValue{min-width:0!important}
@media(max-width:430px){
  #dbmLeadForm .dbm-lead-contact-row{grid-template-columns:minmax(0,1fr)!important;gap:0!important}
  #dbmLeadForm .dbm-lead-contact-row>label{width:100%;max-width:100%}
}
`;
  document.head.appendChild(s);
}
function init(){applyViewportGuard();injectStyles();markRows();new MutationObserver(markRows).observe(document.body,{subtree:true,childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
