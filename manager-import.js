(()=>{
'use strict';
const M=window.DBM;if(!M)return;
const wait=()=>{const top=document.querySelector('#materialsV2 .dbm-top');if(!top)return setTimeout(wait,100);init(top)};
function init(top){
 if(document.getElementById('dbmImportMaterials'))return;
 const btn=document.createElement('button');btn.id='dbmImportMaterials';btn.type='button';btn.className='secondary small';btn.textContent='Importa listino';
 const add=document.getElementById('dbmAddMaterial');if(add)add.insertAdjacentElement('beforebegin',btn);else top.appendChild(btn);
 const input=document.createElement('input');input.id='dbmImportMaterialsFile';input.type='file';input.accept='.json,application/json';input.hidden=true;document.body.appendChild(input);
 btn.onclick=()=>{input.value='';input.click()};input.onchange=()=>importFile(input.files?.[0])
}
async function importFile(file){
 if(!file)return;let data;
 try{data=JSON.parse(await file.text())}catch{alert('File listino non valido.');return}
 const rows=Array.isArray(data)?data:Array.isArray(data?.materials)?data.materials:null;
 if(!rows){alert('Il file non contiene una lista materiali valida.');return}
 const images=data?.images&&typeof data.images==='object'?data.images:{};
 const existing=await M.mAll('materials');
 const key=x=>`${String(x.category||'').trim().toLowerCase()}|${String(x.name||'').trim().toLowerCase()}`;
 const byKey=new Map(existing.map(x=>[key(x),x]));
 let added=0,photosAdded=0,skipped=0,rejected=0;
 for(const r of rows){
   const name=String(r?.name||'').trim();if(!name){rejected++;continue}
   const category=M.categories.includes(r.category)?r.category:'Altro',k=key({name,category});
   const photo=String(r.imageDataUrl||images[r.imageKey]||'').trim();
   const old=byKey.get(k);
   if(old){
     if(photo&&!old.imageDataUrl){const updated={...old,imageDataUrl:photo};await M.mPut('materials',updated);byKey.set(k,updated);photosAdded++}
     skipped++;continue
   }
   const price=Math.max(0,M.n(r.lastPrice??r.price)),supplier=String(r.supplier||'').trim(),lastDate=String(r.lastDate||r.date||'').trim(),notes=String(r.notes||'').trim(),id=M.uid();
   const material={id,name,category,supplier,lastPrice:price,lastDate,notes};
   if(photo)material.imageDataUrl=photo;
   await M.mPut('materials',material);
   if(price>0&&lastDate)await M.mPut('history',{id:M.uid(),materialId:id,date:lastDate,price,supplier,source:'catalog-import'});
   byKey.set(k,material);added++
 }
 await M.renderMaterials();
 const parts=[`${added} materiali importati.`];
 if(photosAdded)parts.push(`${photosAdded} foto aggiunte a materiali già presenti.`);
 if(skipped)parts.push(`${skipped} voci già presenti: prezzi e dati esistenti non modificati.`);
 if(rejected)parts.push(`${rejected} righe non valide ignorate.`);
 alert(parts.join(' '))
}
wait();
})();
