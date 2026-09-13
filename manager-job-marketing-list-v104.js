(()=>{
'use strict';
let M,baseRenderJobs,decorateQueued=false;
const $=id=>document.getElementById(id);

const wait=()=>{
  M=window.DBM;
  if(!M?.renderJobs||!M?.openJobMarketing||!$('dbmJobList')) return setTimeout(wait,100);
  init();
};

function init(){
  if(M.__jobMarketingListV104Ready)return;
  M.__jobMarketingListV104Ready=true;
  styles();
  removeLegacy();
  watchLegacy();
  watchList();
  baseRenderJobs=M.renderJobs.bind(M);
  M.renderJobs=async(...args)=>{
    const r=await baseRenderJobs(...args);
    scheduleDecorate();
    removeLegacy();
    return r;
  };
  $('dbmJobList').addEventListener('click',async e=>{
    const btn=e.target.closest('[data-job-marketing]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    const id=String(btn.dataset.jobMarketing||'').trim();
    if(!id)return;
    btn.disabled=true;
    try{await M.openJobMarketing(id)}
    catch(err){console.error('Job Marketing list',err);alert('Impossibile aprire il contenuto marketing.')}
    finally{btn.disabled=false}
  });
  scheduleDecorate();
}

function styles(){
  if($('dbmJobMarketingListV104Styles'))return;
  const s=document.createElement('style');
  s.id='dbmJobMarketingListV104Styles';
  s.textContent=`
#dbmJobMarketingBox{display:none!important}
.dbm-job-marketing-list{display:flex;justify-content:flex-end;margin:-4px 4px 12px}
.dbm-job-marketing-list button{min-height:42px;padding:0 14px;font-weight:800}
@media(max-width:520px){.dbm-job-marketing-list{margin:-4px 0 12px}.dbm-job-marketing-list button{width:100%}}
`;
  document.head.appendChild(s);
}

function removeLegacy(){
  document.getElementById('dbmJobMarketingBox')?.remove();
}

function watchLegacy(){
  if(M.__jobMarketingLegacyObserverV104)return;
  const dialog=$('dbmJobDialog');
  if(!dialog)return;
  M.__jobMarketingLegacyObserverV104=new MutationObserver(()=>removeLegacy());
  M.__jobMarketingLegacyObserverV104.observe(dialog,{childList:true,subtree:true});
}

function watchList(){
  if(M.__jobMarketingListObserverV104)return;
  const list=$('dbmJobList');
  if(!list)return;
  M.__jobMarketingListObserverV104=new MutationObserver(()=>scheduleDecorate());
  M.__jobMarketingListObserverV104.observe(list,{childList:true});
}

function scheduleDecorate(){
  if(decorateQueued)return;
  decorateQueued=true;
  requestAnimationFrame(()=>{
    decorateQueued=false;
    decorate();
  });
}

function decorate(){
  const list=$('dbmJobList');
  if(!list)return;

  const wanted=new Set();
  list.querySelectorAll('.dbm-job[data-work], .dbm-job[data-job]').forEach(row=>{
    if(!row.querySelector('.dbm-status.completed'))return;
    const id=String(row.dataset.work||row.dataset.job||'').trim();
    if(!id)return;
    wanted.add(id);

    const next=row.nextElementSibling;
    if(next?.classList.contains('dbm-job-marketing-list') && next.dataset.forWork===id)return;

    const wrap=document.createElement('div');
    wrap.className='dbm-job-marketing-list';
    wrap.dataset.forWork=id;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='secondary small';
    btn.dataset.jobMarketing=id;
    btn.textContent='Crea contenuto marketing';
    wrap.appendChild(btn);
    row.insertAdjacentElement('afterend',wrap);
  });

  list.querySelectorAll('.dbm-job-marketing-list').forEach(wrap=>{
    if(!wanted.has(String(wrap.dataset.forWork||'')))wrap.remove();
  });
}

wait();
})();
