(()=>{
'use strict';
let M,list;
function wait(){
  M=window.DBM;
  list=document.getElementById('dbmQuoteList');
  if(!M?.mAll||!list||!M.__interactiveQuotesV84Ready)return setTimeout(wait,120);
  init();
}
function init(){
  if(M.__interactiveQuoteGuardV86Ready)return;
  M.__interactiveQuoteGuardV86Ready=true;
  const clean=()=>list.querySelectorAll('.dbm-iq-actions').forEach(x=>x.remove());
  clean();
  new MutationObserver(clean).observe(list,{childList:true,subtree:true});
}
wait();
})();
