(()=>{
'use strict';
let M;
const $=id=>document.getElementById(id);
const wait=()=>{M=window.DBM;if(!M?.setting||!$('clientDialog')||!$('dbmPropertyDialog'))return setTimeout(wait,100);init()};
function init(){if(M.__propertyCommercialRefreshV88)return;M.__propertyCommercialRefreshV88=true;const prop=$('dbmPropertyDialog'),form=$('dbmPropertyForm'),del=$('dbmDeleteProperty');prop.addEventListener('close',()=>setTimeout(refresh,40));form?.addEventListener('submit',()=>setTimeout(refresh,80));del?.addEventListener('click',()=>setTimeout(refresh,80));}
async function refresh(){const dlg=$('clientDialog');if(!dlg?.open)return;const clientId=$('clientId')?.value||'';if(!clientId)return;let count=0;try{const raw=await M.setting('propertiesV1','');const a=raw?JSON.parse(raw):[];count=Array.isArray(a)?a.filter(p=>p.clientId===clientId).length:0}catch{}const box=$('dbmClientCommercialKpis');if(box){const card=[...box.querySelectorAll('.dbm-client-kpi')].find(x=>String(x.querySelector('span')?.textContent||'').trim().toLowerCase()==='proprietà');const b=card?.querySelector('b');if(b)b.textContent=String(count)}window.dispatchEvent(new CustomEvent('dbm:properties-refreshed',{detail:{clientId,count}}));}
wait();
})();
