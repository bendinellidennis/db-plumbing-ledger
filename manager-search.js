(()=>{
'use strict';
const wait=()=>{const M=window.DBM,input=document.getElementById('dbmMatSearch');if(!M?.renderMaterials||!input)return setTimeout(wait,100);init(M,input)};
function init(M,input){
 if(M.__materialSearchReady)return;M.__materialSearchReady=true;
 const baseRender=M.renderMaterials.bind(M);
 const normalize=s=>String(s||'').replace(/([A-Za-z])\s*[-_]?\s+(?=\d)/g,'$1').replace(/([A-Za-z])-+(?=\d)/g,'$1');
 M.renderMaterials=async()=>{
   const original=input.value,normalized=normalize(original);
   if(normalized!==original)input.value=normalized;
   try{await baseRender()}finally{if(normalized!==original)input.value=original}
 };
 input.oninput=()=>M.renderMaterials();
 const cat=document.getElementById('dbmMatCatFilter');if(cat)cat.onchange=()=>M.renderMaterials();
 M.renderMaterials();
}
wait();
})();
