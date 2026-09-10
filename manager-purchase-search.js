(()=>{
'use strict';
const wait=()=>{const M=window.DBM,box=document.getElementById('dbmPurchaseLines');if(!M?.mAll||!box)return setTimeout(wait,100);init(M,box)};
function init(M,box){
 if(M.__purchaseMaterialSearchReady)return;M.__purchaseMaterialSearchReady=true;
 const style=document.createElement('style');style.textContent=`
 .dbm-picks{margin:8px 0 2px;display:grid;gap:6px}
 .dbm-pick{width:100%;border:1px solid #d7e3ec;background:#fff;border-radius:12px;padding:10px 12px;text-align:left;color:#12243a;font:inherit}
 .dbm-pick b{display:block;font-size:14px;line-height:1.2}
 .dbm-pick span{display:block;margin-top:3px;font-size:11px;color:#718096}
 `;document.head.appendChild(style);
 const norm=s=>String(s||'').toLowerCase().replace(/[\s_-]+/g,'');
 let materials=[];
 const refresh=async()=>{materials=await M.mAll('materials')};
 const getPickBox=line=>{let p=line.querySelector('.dbm-picks');if(!p){p=document.createElement('div');p.className='dbm-picks';line.querySelector('.dbm-line-top')?.insertAdjacentElement('afterend',p)}return p};
 async function suggest(input){
   await refresh();const line=input.closest('.dbm-line');if(!line)return;const p=getPickBox(line),q=norm(input.value);
   if(!q){p.innerHTML='';return}
   const matches=materials.filter(m=>norm(`${m.name} ${m.category||''} ${m.supplier||''}`).includes(q)).sort((a,b)=>{const as=norm(a.name).startsWith(q)?0:1,bs=norm(b.name).startsWith(q)?0:1;return as-bs||String(a.name).localeCompare(String(b.name))}).slice(0,8);
   p.innerHTML='';for(const m of matches){const b=document.createElement('button');b.type='button';b.className='dbm-pick';b.dataset.mid=m.id;const t=document.createElement('b');t.textContent=m.name;const s=document.createElement('span');s.textContent=`${m.category||'Altro'}${m.supplier?' · '+m.supplier:''}${Number(m.lastPrice)>0?' · €'+Number(m.lastPrice).toFixed(2):''}`;b.append(t,s);p.appendChild(b)}
 }
 box.addEventListener('input',e=>{if(e.target.matches('.dbm-pname'))suggest(e.target)});
 box.addEventListener('focusin',e=>{if(e.target.matches('.dbm-pname')&&e.target.value)suggest(e.target)});
 box.addEventListener('click',async e=>{const b=e.target.closest('.dbm-pick');if(!b)return;await refresh();const m=materials.find(x=>x.id===b.dataset.mid),line=b.closest('.dbm-line');if(!m||!line)return;line.querySelector('.dbm-pname').value=m.name;line.querySelector('.dbm-pcat').value=m.category||'Altro';const price=line.querySelector('.dbm-pprice');if(Number(m.lastPrice)>0)price.value=Number(m.lastPrice);b.parentElement.innerHTML='';price.dispatchEvent(new Event('input',{bubbles:true}))});
 document.addEventListener('click',e=>{if(!e.target.closest('.dbm-line'))document.querySelectorAll('.dbm-picks').forEach(x=>x.innerHTML='')});
}
wait();
})();
