(()=>{
'use strict';
const wait=()=>{const M=window.DBM,sel=document.getElementById('dbmJobClient'),dlg=document.getElementById('clientDialog');if(!M?.fillClientOptions||!sel||!dlg||typeof window.openClient!=='function')return setTimeout(wait,100);init(M,sel,dlg)};
function init(M,sel,clientDlg){
 if(M.__jobClientAddReady)return;M.__jobClientAddReady=true;
 const baseFill=M.fillClientOptions.bind(M);
 M.fillClientOptions=async target=>{
   await baseFill(target);
   if(target?.id==='dbmJobClient'&&!target.querySelector('option[value="__new__"]')){
     const o=document.createElement('option');o.value='__new__';o.textContent='＋ Nuovo cliente…';target.appendChild(o);
   }
 };
 let adding=false,before=new Set(),previous='';
 sel.addEventListener('change',async()=>{
   if(sel.value!=='__new__')return;
   previous='';
   before=new Set((await M.clients()).map(c=>c.id));
   adding=true;sel.value='';
   window.openClient();
 });
 clientDlg.addEventListener('close',async()=>{
   if(!adding)return;adding=false;
   const after=await M.clients(),created=after.filter(c=>!before.has(c.id));
   await M.fillClientOptions(sel);
   if(created.length===1)sel.value=created[0].id;else sel.value=previous;
 });
}
wait();
})();
