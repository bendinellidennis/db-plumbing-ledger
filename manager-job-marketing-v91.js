(()=>{
'use strict';

const PACK_KEY='jobMarketingPacksV1';
let M,baseOpenJob,currentJobId='',urls=[];

const $=id=>document.getElementById(id);
const wait=()=>{
  M=window.DBM;
  if(!M?.openJob||!M?.mOne||!M?.mAll||!M?.lOne||!M?.setting||!M?.lPut||!M?.clients||!$('dbmJobForm')||!$('dbmJobDialog')) return setTimeout(wait,100);
  init();
};
const esc=s=>M.esc?M.esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const cleanSpaces=s=>String(s||'').replace(/\s+/g,' ').trim();

function init(){
  if(M.__jobMarketingV91Ready)return;
  M.__jobMarketingV91Ready=true;
  styles();
  inject();
  dialogs();
  wrapOpenJob();
  bind();
  M.openJobMarketing=openMarketing;
}

function styles(){
  if($('dbmJobMarketingStylesV91'))return;
  const s=document.createElement('style');
  s.id='dbmJobMarketingStylesV91';
  s.textContent=`
#dbmJobMarketingBox{margin-top:12px;padding:12px;border:1px solid #dce6ee;border-radius:14px;background:#f8fbfd}
.dbm-jm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.dbm-jm-head b{font-size:13px}.dbm-jm-head span{display:block;font-size:9.5px;color:#64748b;line-height:1.4;margin-top:3px}
.dbm-jm-ready{font-size:8px;font-weight:900;padding:5px 7px;border-radius:999px;background:#eefaf3;color:#17653b;border:1px solid #b7dcc8;white-space:nowrap}
.dbm-jm-disabled{font-size:9.5px;color:#64748b;line-height:1.4;margin-top:8px}
.dbm-jm-dialog{width:min(calc(100vw - 18px),720px);max-width:720px}
.dbm-jm-privacy{padding:10px;border:1px solid #b7dcc8;border-radius:12px;background:#eefaf3;color:#17653b;font-size:10px;line-height:1.45;margin-bottom:12px}
.dbm-jm-photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 14px}
.dbm-jm-photo{border:1px solid #dce6ee;border-radius:13px;background:#f8fbfd;padding:8px;min-height:100px}
.dbm-jm-photo b{display:block;font-size:9px;text-transform:uppercase;color:#64748b;margin-bottom:6px}
.dbm-jm-photo img{display:block;width:100%;height:150px;object-fit:cover;border-radius:9px;background:#fff}
.dbm-jm-photo-empty{height:150px;display:grid;place-items:center;color:#64748b;font-size:10px;text-align:center;padding:10px}
.dbm-jm-lang{border:1px solid #dce6ee;border-radius:13px;padding:10px;background:#fff;margin-top:10px}
.dbm-jm-lang-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}
.dbm-jm-lang-head b{font-size:12px}.dbm-jm-lang textarea{min-height:145px}
.dbm-jm-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.dbm-jm-actions button{min-height:44px}
.dbm-jm-note{font-size:9.5px;color:#64748b;line-height:1.45;margin-top:10px}
.dbm-jm-toast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:99999;background:#102a43;color:#fff;border-radius:999px;padding:10px 14px;font-size:11px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,.22);max-width:calc(100vw - 28px);text-align:center}
@media(max-width:520px){.dbm-jm-dialog textarea{font-size:17px!important}.dbm-jm-photo-grid{grid-template-columns:1fr 1fr}.dbm-jm-photo img,.dbm-jm-photo-empty{height:120px}.dbm-jm-actions{grid-template-columns:1fr}}
`;
  document.head.appendChild(s);
}

function inject(){
  if($('dbmJobMarketingBox'))return;
  const dossier=$('dbmJobDossier');
  const notes=$('dbmJobNotes')?.closest('label');
  if(!notes)return;
  const box=document.createElement('section');
  box.id='dbmJobMarketingBox';
  box.innerHTML=`<div class="dbm-jm-head"><div><b>Job → Marketing</b><span>Trasforma il lavoro concluso in contenuto portfolio/social usando le foto reali del dossier.</span></div><em class="dbm-jm-ready">PRIVACY SAFE</em></div><div id="dbmJobMarketingState" class="dbm-jm-disabled">Disponibile quando il lavoro è completato.</div><button type="button" id="dbmJobMarketingOpen" class="secondary full" style="margin-top:9px" disabled>Crea contenuto marketing</button>`;
  if(dossier)dossier.insertAdjacentElement('afterend',box);
  else notes.insertAdjacentElement('beforebegin',box);
}

function dialogs(){
  if($('dbmJobMarketingDialog'))return;
  document.body.insertAdjacentHTML('beforeend',`
<dialog id="dbmJobMarketingDialog" class="dbm-jm-dialog">
  <form method="dialog">
    <div class="dialog-head"><h2>Job → Marketing</h2><button type="button" class="icon" data-close-job-marketing>×</button></div>
    <div class="dbm-jm-privacy"><b>Privacy automatica.</b> Il contenuto generato non usa nome cliente, telefono, email, importi o indirizzo/località del lavoro. Prima della pubblicazione resta comunque sotto il tuo controllo.</div>
    <div id="dbmJobMarketingPhotos" class="dbm-jm-photo-grid"></div>
    <div class="dbm-jm-lang">
      <div class="dbm-jm-lang-head"><b>English</b><span class="hint">Social / portfolio</span></div>
      <textarea id="dbmJobMarketingEN" rows="7"></textarea>
      <div class="dbm-jm-actions"><button type="button" class="secondary" data-copy-marketing="en">Copia testo EN</button><button type="button" class="primary" data-share-marketing="en">Condividi EN + foto</button></div>
    </div>
    <div class="dbm-jm-lang">
      <div class="dbm-jm-lang-head"><b>Italiano</b><span class="hint">Social / portfolio</span></div>
      <textarea id="dbmJobMarketingIT" rows="7"></textarea>
      <div class="dbm-jm-actions"><button type="button" class="secondary" data-copy-marketing="it">Copia testo IT</button><button type="button" class="primary" data-share-marketing="it">Condividi IT + foto</button></div>
    </div>
    <div id="dbmJobMarketingHint" class="dbm-jm-note"></div>
  </form>
</dialog>`);
  $('[data-close-job-marketing]').onclick=()=>$('dbmJobMarketingDialog').close();
}

function bind(){
  $('dbmJobMarketingOpen').onclick=()=>openMarketing(currentJobId||$('dbmJobId')?.value||'');
  $('dbmJobStatus')?.addEventListener('change',refreshLauncher);
  $('dbmJobMarketingDialog').addEventListener('click',async e=>{
    const c=e.target.closest('[data-copy-marketing]');
    if(c){await copyText(c.dataset.copyMarketing);return}
    const s=e.target.closest('[data-share-marketing]');
    if(s){await sharePack(s.dataset.shareMarketing);return}
  });
  $('dbmJobMarketingDialog').addEventListener('close',()=>{void persistEdited();clearUrls()});
}

function wrapOpenJob(){
  baseOpenJob=M.openJob.bind(M);
  M.openJob=async id=>{
    currentJobId=id||'';
    const r=await baseOpenJob(id);
    currentJobId=$('dbmJobId')?.value||id||'';
    await refreshLauncher();
    return r;
  };
}

async function refreshLauncher(){
  const btn=$('dbmJobMarketingOpen'),state=$('dbmJobMarketingState');
  if(!btn||!state)return;
  const id=$('dbmJobId')?.value||currentJobId||'';
  const status=$('dbmJobStatus')?.value||'';
  const job=id?await M.mOne('jobs',id):null;
  const completed=(job?.status||status)==='completed';
  btn.disabled=!id||!completed;
  if(!id){state.textContent='Salva prima il lavoro.';return}
  if(!completed){state.textContent='Disponibile quando il lavoro è completato.';return}
  const d=job?.dossier||{};
  const count=[d.beforeFileId,d.afterFileId].filter(Boolean).length;
  state.textContent=count?`Pronto · ${count} foto reale${count===1?'':'i'} dal dossier.`:'Pronto per il testo. Per condividere immagini aggiungi Foto prima/dopo nel Dossier lavoro.';
}

async function loadPacks(){
  const raw=await M.setting(PACK_KEY,'');
  try{const x=raw?JSON.parse(raw):{};return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return{}}
}
async function savePack(jobId,data){
  const packs=await loadPacks();
  packs[jobId]={...(packs[jobId]||{}),...data,updatedAt:new Date().toISOString()};
  await M.lPut('settings',{key:PACK_KEY,value:JSON.stringify(packs)});
}

function redact(s,values=[]){
  let out=String(s||'');
  for(const v of values){
    const x=cleanSpaces(v);
    if(!x)continue;
    out=out.replace(new RegExp(escapeRegExp(x),'gi'),' ');
  }
  out=out
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,' ')
    .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g,' ')
    .replace(/\s+([,.;:])/g,'$1')
    .replace(/\s{2,}/g,' ')
    .trim();
  return out;
}
function escapeRegExp(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

function cleanService(s,redactions){
  return redact(s,redactions)
    .replace(/\s*[-–—]\s*$/,'')
    .replace(/^[,;:\s-]+|[,;:\s-]+$/g,'')
    .trim();
}

async function generateTexts(job){
  const clients=await M.clients();
  const c=clients.find(x=>x.id===job.clientId)||{};
  const nameTokens=String(c.name||'').split(/\s+/).filter(x=>x.length>=3);
  const redactions=[c.name,...nameTokens,c.phone,c.email,job.location];
  const title=cleanService(job.title,redactions)||'Professional plumbing and maintenance work';
  const services=(job.lines||[])
    .map(l=>cleanService(l.description,redactions))
    .filter(Boolean)
    .filter((x,i,a)=>a.findIndex(y=>y.toLowerCase()===x.toLowerCase())===i)
    .slice(0,4);
  const serviceEN=services.length?services.join(' · '):title;
  const serviceIT=services.length?services.join(' · '):title;
  const en=`Another professional job completed in Malta.

${title}

Work carried out: ${serviceEN}.

Professional workmanship, reliable solutions and attention to detail — with the goal of solving the problem properly and avoiding unnecessary return visits.

DB Plumbing Services
#DBPlumbingServices #PlumbingMalta #PropertyMaintenance #Malta`;
  const it=`Un altro intervento professionale completato a Malta.

${title}

Lavoro eseguito: ${serviceIT}.

Lavoro accurato, soluzioni affidabili e attenzione ai dettagli, con l'obiettivo di risolvere il problema correttamente ed evitare interventi ripetuti inutili.

DB Plumbing Services
#DBPlumbingServices #IdraulicaMalta #ManutenzioneImmobili #Malta`;
  return {en,it};
}

async function dossierFile(fileId){
  if(!fileId)return null;
  const rec=await M.lOne('files',fileId);
  if(!rec?.blob||!String(rec.type||rec.blob.type||'').startsWith('image/'))return null;
  return rec;
}

function clearUrls(){urls.forEach(u=>URL.revokeObjectURL(u));urls=[]}

async function renderPhotos(job){
  clearUrls();
  const box=$('dbmJobMarketingPhotos');
  if(!box)return [];
  const d=job?.dossier||{};
  const before=await dossierFile(d.beforeFileId);
  const after=await dossierFile(d.afterFileId);
  const items=[['Prima',before],['Dopo',after]];
  box.innerHTML='';
  for(const [label,rec] of items){
    const card=document.createElement('div');
    card.className='dbm-jm-photo';
    const b=document.createElement('b');b.textContent=label;card.appendChild(b);
    if(rec){
      const u=URL.createObjectURL(rec.blob);urls.push(u);
      const img=document.createElement('img');img.src=u;img.alt=`Foto ${label.toLowerCase()}`;card.appendChild(img);
    }else{
      const e=document.createElement('div');e.className='dbm-jm-photo-empty';e.textContent=`Nessuna foto ${label.toLowerCase()} nel Dossier lavoro.`;card.appendChild(e);
    }
    box.appendChild(card);
  }
  return [before,after].filter(Boolean);
}

async function openMarketing(jobId){
  const job=jobId?await M.mOne('jobs',jobId):null;
  if(!job){alert('Lavoro non trovato.');return}
  if(job.status!=='completed'){alert('Job → Marketing è disponibile solo per lavori completati.');return}
  const texts=await generateTexts(job);
  const packs=await loadPacks(),saved=packs[job.id]||{};
  $('dbmJobMarketingEN').value=saved.en||texts.en;
  $('dbmJobMarketingIT').value=saved.it||texts.it;
  const photos=await renderPhotos(job);
  $('dbmJobMarketingHint').textContent=photos.length
    ?`Le ${photos.length} foto provengono dal Dossier lavoro. Condividi apre il foglio di condivisione iPhone: scegli WhatsApp, Instagram, Facebook o Salva immagine.`
    :'Nessuna foto reale nel Dossier lavoro. Puoi copiare/condividere il testo; per il pack fotografico aggiungi prima Foto prima/dopo al lavoro.';
  currentJobId=job.id;
  await savePack(job.id,{en:$('dbmJobMarketingEN').value,it:$('dbmJobMarketingIT').value,generatedAt:new Date().toISOString()});
  $('dbmJobMarketingDialog').showModal();
}

async function persistEdited(){
  if(!currentJobId)return;
  await savePack(currentJobId,{en:$('dbmJobMarketingEN').value.trim(),it:$('dbmJobMarketingIT').value.trim()});
}

async function copyText(lang){
  const el=lang==='it'?$('dbmJobMarketingIT'):$('dbmJobMarketingEN');
  const text=el?.value.trim()||'';
  if(!text)return;
  await persistEdited();
  try{await navigator.clipboard.writeText(text);toast(`Testo ${lang.toUpperCase()} copiato.`)}
  catch{prompt('Copia il testo:',text)}
}

function toFile(rec,index){
  const blob=rec.blob;
  const type=rec.type||blob.type||'image/jpeg';
  const ext=type.includes('png')?'png':type.includes('webp')?'webp':'jpg';
  const base=String(rec.name||`db-plumbing-${index+1}.${ext}`).replace(/[^\w.\-]+/g,'-');
  return new File([blob],base,{type});
}

async function sharePack(lang){
  const job=currentJobId?await M.mOne('jobs',currentJobId):null;
  if(!job)return;
  const text=(lang==='it'?$('dbmJobMarketingIT'):$('dbmJobMarketingEN'))?.value.trim()||'';
  await persistEdited();
  const d=job.dossier||{};
  const recs=(await Promise.all([dossierFile(d.beforeFileId),dossierFile(d.afterFileId)])).filter(Boolean);
  const files=recs.map(toFile);
  const data={title:'DB Plumbing Services',text};
  if(files.length&&navigator.canShare?.({files}))data.files=files;
  try{
    if(navigator.share){
      await navigator.share(data);
      await savePack(job.id,{lastSharedAt:new Date().toISOString(),lastSharedLanguage:lang,sharedWithPhotos:!!data.files?.length});
      toast(data.files?.length?'Condivisione aperta con foto + testo.':'Condivisione aperta con testo.');
      return;
    }
  }catch(e){
    if(e?.name==='AbortError')return;
    console.error('Job marketing share',e);
  }
  try{
    await navigator.clipboard.writeText(text);
    toast(files.length?'Testo copiato. Condivisione foto non supportata qui.':'Testo copiato.');
  }catch{prompt('Copia il testo:',text)}
}

function toast(msg){
  document.querySelector('.dbm-jm-toast')?.remove();
  const d=document.createElement('div');d.className='dbm-jm-toast';d.textContent=msg;document.body.appendChild(d);
  setTimeout(()=>d.remove(),3200);
}

wait();
})();
