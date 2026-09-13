(()=>{
'use strict';
const wait=()=>{const M=window.DBM,nav=document.querySelector('.bottom-nav'),jobs=nav?.querySelector('[data-dbm-view="jobsV2"]');if(!M?.show||!nav||!jobs||!document.getElementById('quotesV2'))return setTimeout(wait,80);init(M,nav,jobs)};
function ensureInteractive(){
 const ensure=(src,attr)=>{if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.src=src;s.setAttribute(attr,'1');s.async=false;s.onerror=()=>{s.remove();setTimeout(()=>ensure(src,attr),1200)};document.body.appendChild(s)};
 if(!window.DBM?.__interactiveQuotesV84Ready)ensure('manager-interactive-quotes-v84.js?v=86','data-dbm-iq-v84');
 ensure('manager-interactive-quotes-guard-v86.js?v=86','data-dbm-iq-guard-v86');
}
function init(M,nav,jobs){
 if(M.__quotesNavReady){ensureInteractive();return}M.__quotesNavReady=true;
 let q=nav.querySelector('[data-dbm-view="quotesV2"]');
 if(!q){q=document.createElement('button');q.className='nav';q.dataset.dbmView='quotesV2';q.innerHTML='<span class="dbm-ico">▧</span><span>Preventivi</span>';jobs.insertAdjacentElement('beforebegin',q)}
 const baseShow=M.show.bind(M);
 M.show=v=>{baseShow(v);if(v==='quotesV2'){nav.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===q));setTimeout(ensureInteractive,0)}else q.classList.remove('active')};
 q.onclick=()=>M.show('quotesV2');
 const style=document.createElement('style');style.textContent='.bottom-nav{grid-template-columns:repeat(7,1fr)!important}.bottom-nav .nav{font-size:8.7px!important;padding-left:0!important;padding-right:0!important}.bottom-nav .dbm-ico{font-size:18px}@media(max-width:380px){.bottom-nav .nav{font-size:8.1px!important}.bottom-nav{padding-left:2px;padding-right:2px}}';document.head.appendChild(style);
 ensureInteractive();
}
wait();
})();
