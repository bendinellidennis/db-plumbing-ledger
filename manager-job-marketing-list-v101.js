(()=>{
'use strict';
let M,baseRenderJobs;
const $=id=>document.getElementById(id);

const wait=()=>{
  M=window.DBM;
  if(!M?.renderJobs||!M?.openJobMarketing||!$('dbmJobList')) return setTimeout(wait,100);
  init();
};

function init(){
  if(M.__jobMarketingListV101Ready)return;
  M.__jobMarketingListV101Ready=true;
  styles();
  removeLegacy();
  baseRenderJobs=M.renderJobs.bind(M);
  M.renderJobs=async(...args)=>{
    const r=await baseRenderJobs(...args);
    decorate();
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
  decorate();
}

function styles(){
  if($('dbmJobMarketingListV101Styles'))return;
  const s=document.createElement('style');
  s.id='dbmJobMarketingListV101Styles';
  s.textContent=`
.dbm-job-marketing-list{display:flex;justify-content:flex-end;margin:-4px 4px 12px}
.dbm-job-marketing-list button{min-height:42px;padding:0 14px;font-weight:800}
@media(max-width:520px){.dbm-job-marketing-list{margin:-4px 0 12px}.dbm-job-marketing-list button{width:100%}}
`;
  document.head.appendChild(s);
}

function removeLegacy(){
  $('dbmJobMarketingBox')?.remove();
}

function decorate(){
  const list=$('dbmJobList');
  if(!list)return;
  list.querySelectorAll('.dbm-job-marketing-list').forEach(x=>x.remove());
  list.querySelectorAll('.dbm-job[data-job]').forEach(row=>{
    if(!row.querySelector('.dbm-status.completed'))return;
    const id=String(row.dataset.job||'').trim();
    if(!id)return;
    const wrap=document.createElement('div');
    wrap.className='dbm-job-marketing-list';
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='secondary small';
    btn.dataset.jobMarketing=id;
    btn.textContent='Crea contenuto marketing';
    wrap.appendChild(btn);
    row.insertAdjacentElement('afterend',wrap);
  });
}

wait();
})();
