(()=>{
'use strict';
function ensureEmailSource(){
  const select=document.getElementById('dbmLeadSource');
  if(!select)return;
  if([...select.options].some(o=>o.value==='Email'||o.textContent==='Email'))return;
  const option=document.createElement('option');
  option.value='Email';
  option.textContent='Email';
  const altro=[...select.options].find(o=>o.value==='Altro'||o.textContent==='Altro');
  if(altro)select.insertBefore(option,altro);else select.appendChild(option);
}
function init(){
  ensureEmailSource();
  new MutationObserver(ensureEmailSource).observe(document.body,{subtree:true,childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
