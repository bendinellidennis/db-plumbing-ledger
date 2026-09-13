(()=>{
'use strict';
let tries=0;
const load=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const boot=async()=>{
  const y=document.getElementById('yearFilter');
  if(!y||!y.options.length){if(tries++<200)return setTimeout(boot,50);return console.error('DB Manager: ledger not ready')}
  try{
    await load('manager-core.js?v=85');
    await load('manager-loader.js?v=101');
    for(let i=0;i<200&&!window.__DBM_MAIN_LOADER_READY__;i++){
      if(window.__DBM_MAIN_LOADER_PROMISE__){await window.__DBM_MAIN_LOADER_PROMISE__;break}
      await sleep(50);
    }
    if(!window.__DBM_MAIN_LOADER_READY__)throw new Error('DB Manager main loader did not reach READY state');
    await load('manager-fiscal-balance.js?v=54');
  }catch(e){console.error('DB Manager loader',e)}
};
boot();
})();
