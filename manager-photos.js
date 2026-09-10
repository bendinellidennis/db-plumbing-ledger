(()=>{
'use strict';
const wait=()=>{const M=window.DBM;if(!M?.db||!M.renderMaterials||!M.openMaterial)return setTimeout(wait,100);init(M)};
function init(M){
 if(M.__materialPhotosReady)return;M.__materialPhotosReady=true;
 const style=document.createElement('style');style.textContent=`
 .dbm-material.has-photo{grid-template-columns:68px minmax(0,1fr) auto;align-items:center}
 .dbm-photo-thumb{width:58px;height:58px;object-fit:contain;border-radius:11px;background:#fff;border:1px solid #dce6ee;padding:3px}
 .dbm-photo-card{margin:10px 0 2px;border:1px solid #dce6ee;background:#f8fbfd;border-radius:14px;padding:10px;text-align:center}
 .dbm-photo-card img{display:block;width:100%;max-height:220px;object-fit:contain;background:#fff;border-radius:10px}
 .dbm-photo-card span{display:block;margin-top:7px;color:#64748b;font-size:10.5px}
 @media(max-width:360px){.dbm-material.has-photo{grid-template-columns:56px minmax(0,1fr) auto}.dbm-photo-thumb{width:48px;height:48px}}
 `;
 document.head.appendChild(style);
 const baseRender=M.renderMaterials.bind(M);
 M.renderMaterials=async()=>{
   await baseRender();
   const mats=await M.mAll('materials'),map=new Map(mats.map(x=>[x.id,x]));
   document.querySelectorAll('#dbmMatList [data-m]').forEach(row=>{
     const m=map.get(row.dataset.m);if(!m?.imageDataUrl)return;
     row.classList.add('has-photo');
     if(!row.querySelector('.dbm-photo-thumb')){
       const img=document.createElement('img');img.className='dbm-photo-thumb';img.src=m.imageDataUrl;img.alt=m.name||'Materiale';row.prepend(img)
     }
   })
 };
 const baseOpen=M.openMaterial.bind(M);
 M.openMaterial=async id=>{
   await baseOpen(id);
   document.querySelector('#dbmMaterialDialog .dbm-photo-card')?.remove();
   if(!id)return;
   const m=await M.mOne('materials',id);if(!m?.imageDataUrl)return;
   const history=document.getElementById('dbmMaterialHistory');if(!history)return;
   const card=document.createElement('div');card.className='dbm-photo-card';
   const img=document.createElement('img');img.src=m.imageDataUrl;img.alt=m.name||'Materiale';
   const label=document.createElement('span');label.textContent='Foto reale di riferimento dal listino';
   card.append(img,label);history.insertAdjacentElement('beforebegin',card)
 };
 M.renderMaterials()
}
wait();
})();
