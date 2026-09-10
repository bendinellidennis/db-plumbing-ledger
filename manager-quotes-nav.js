(()=>{
'use strict';
const wait=()=>{const M=window.DBM,nav=document.querySelector('.bottom-nav'),jobs=nav?.querySelector('[data-dbm-view="jobsV2"]');if(!M?.show||!nav||!jobs||!document.getElementById('quotesV2'))return setTimeout(wait,80);init(M,nav,jobs)};
function init(M,nav,jobs){
 if(M.__quotesNavReady)return;M.__quotesNavReady=true;
 let q=nav.querySelector('[data-dbm-view="quotesV2"]');
 if(!q){q=document.createElement('button');q.className='nav';q.dataset.dbmView='quotesV2';q.innerHTML='<span class="dbm-ico">▧</span><span>Preventivi</span>';jobs.insertAdjacentElement('beforebegin',q)}
 const baseShow=M.show.bind(M);
 M.show=v=>{baseShow(v);if(v==='quotesV2'){nav.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===q))}else q.classList.remove('active')};
 q.onclick=()=>M.show('quotesV2');
 const style=document.createElement('style');style.textContent='.bottom-nav{grid-template-columns:repeat(7,1fr)!important}.bottom-nav .nav{font-size:8.7px!important;padding-left:0!important;padding-right:0!important}.bottom-nav .dbm-ico{font-size:18px}@media(max-width:380px){.bottom-nav .nav{font-size:8.1px!important}.bottom-nav{padding-left:2px;padding-right:2px}}';document.head.appendChild(style);
}
wait();
})();
