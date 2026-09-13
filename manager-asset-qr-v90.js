(()=>{
'use strict';

const SUPABASE_URL='https://gscrhubeifhlbxxrdlwo.supabase.co';
const SUPABASE_KEY='sb_publishable_FXBhsGpZ2R73HV1G--uByw_D041l7pz';
const RPC=`${SUPABASE_URL}/rest/v1/rpc/`;
const MAP_KEY='assetQrTokensV2';
const MAINT_KEY='maintenancePlansV1';

let M;
const $=id=>document.getElementById(id);
const esc=s=>M?.esc?M.esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=s=>{if(!s)return'—';const p=String(s).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(s)};
const statusLabel=s=>({quote:'Bozza',quote_sent:'Inviato',quote_accepted:'Accettato',scheduled:'Da programmare',active:'In corso',waiting:'In attesa',completed:'Completato'}[s]||s||'—');

function wait(){
  M=window.DBM;
  if(!M?.assetById||!M?.assetsForProperty||!M?.propertyById||!M?.setting||!M?.lPut||!M?.mAll||!$('dbmAssetDialog')||!$('dbmAssetForm')) return setTimeout(wait,100);
  init();
}

async function rpc(name,body){
  const r=await fetch(RPC+name,{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
    body:JSON.stringify(body),
    cache:'no-store'
  });
  let data=null;
  try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data?.message||data?.error||`HTTP ${r.status}`);
  return data;
}

function token(){
  const b=new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

const shortCode=id=>`DB-${String(id||'').replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase()||'ASSET'}`;

function baseUrl(){
  const u=new URL(location.href);
  u.search='';
  u.hash='';
  return u;
}

function assetUrl(publicToken){
  const u=baseUrl();
  u.searchParams.set('assetqr',publicToken);
  return u.href;
}

function qrUrl(url){
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(url)}`;
}

async function loadMap(){
  const raw=await M.setting(MAP_KEY,'');
  try{
    const x=raw?JSON.parse(raw):{};
    return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  }catch{return{}}
}

async function saveMap(map){
  await M.lPut('settings',{key:MAP_KEY,value:JSON.stringify(map)});
}

async function loadMaintenance(){
  const raw=await M.setting(MAINT_KEY,'');
  try{
    const x=raw?JSON.parse(raw):[];
    return Array.isArray(x)?x:[];
  }catch{return[]}
}

async function publicPhoto(src){
  if(!src)return'';
  if(src.length<=280000)return src;
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src});
    const max=640,scale=Math.min(1,max/Math.max(img.width,img.height));
    const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
    const c=document.createElement('canvas');
    c.width=w;c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    const out=c.toDataURL('image/jpeg',0.62);
    return out.length<=500000?out:'';
  }catch{return''}
}

async function buildPayload(a){
  const [plans,jobs,imageDataUrl]=await Promise.all([loadMaintenance(),M.mAll('jobs'),publicPhoto(a.imageDataUrl||'')]);
  const plan=plans.find(p=>p.id===`asset-maint-${a.id}`)||null;
  const history=jobs.filter(j=>j.assetId===a.id).sort((x,y)=>(y.date||'').localeCompare(x.date||'')).slice(0,20);
  return {
    v:1,
    code:shortCode(a.id),
    name:a.name||'Impianto',
    type:a.type||'',
    brand:a.brand||'',
    model:a.model||'',
    serial:a.serial||'',
    installedDate:a.installedDate||'',
    warrantyUntil:a.warrantyUntil||'',
    notes:a.notes||'',
    imageDataUrl,
    maintenance:plan?{months:Number(plan.months||0),nextDate:plan.nextDate||''}:null,
    history:history.map(j=>({title:j.title||'Intervento',date:j.date||'',status:j.status||''})),
    updatedAt:a.updatedAt||new Date().toISOString()
  };
}

const publishing=new Map();

async function ensurePublished(a){
  if(!a?.id)throw new Error('asset missing');
  if(publishing.has(a.id))return publishing.get(a.id);
  const p=(async()=>{
    const map=await loadMap();
    const rec=map[a.id]||{publicToken:token(),ownerToken:token()};
    const payload=await buildPayload(a);
    const res=await rpc('asset_qr_publish',{
      p_public_token:rec.publicToken,
      p_owner_token:rec.ownerToken,
      p_asset_key:a.id,
      p_payload:payload
    });
    rec.updatedAt=res?.updatedAt||new Date().toISOString();
    map[a.id]=rec;
    await saveMap(map);
    return rec;
  })().finally(()=>publishing.delete(a.id));
  publishing.set(a.id,p);
  return p;
}

function styles(){
  if($('dbmAssetQrStylesV90'))return;
  const s=document.createElement('style');
  s.id='dbmAssetQrStylesV90';
  s.textContent=`
.dbm-asset-qr{margin:12px 0;padding:13px;border:1px solid #dce6ee;border-radius:14px;background:#f8fbfd}
.dbm-asset-qr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.dbm-asset-qr-head b{font-size:13px}
.dbm-asset-qr-head span{display:block;font-size:9.5px;color:#64748b;margin-top:3px;line-height:1.4}
.dbm-asset-code{font-size:10px;font-weight:900;color:#087bc1;white-space:nowrap}
.dbm-asset-qr-body{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;align-items:center;margin-top:12px}
.dbm-asset-qr-img{width:150px;height:150px;border-radius:12px;border:1px solid #dce6ee;background:#fff;padding:6px}
.dbm-asset-qr-actions{display:grid;gap:7px}
.dbm-asset-qr-actions button{min-height:42px}
.dbm-asset-qr-note,.dbm-asset-qr-empty{font-size:9px;color:#64748b;line-height:1.4;margin-top:8px}
.dbm-asset-qr-error{font-size:10px;color:#9b2c22;line-height:1.45;margin-top:8px}
.dbm-asset-public{width:min(calc(100vw - 18px),620px);max-width:620px}
.dbm-asset-public-card{display:grid;gap:12px}
.dbm-asset-public-brand{font-size:10px;font-weight:900;color:#087bc1;text-transform:uppercase;letter-spacing:.08em}
.dbm-asset-public-photo{width:100%;max-height:260px;object-fit:contain;border:1px solid #dce6ee;border-radius:14px;background:#f8fbfd}
.dbm-asset-public-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dbm-asset-public-field{padding:10px;border:1px solid #dce6ee;border-radius:12px;background:#f8fbfd}
.dbm-asset-public-field b{display:block;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
.dbm-asset-public-field span{display:block;font-size:12px;font-weight:800;margin-top:3px;overflow-wrap:anywhere}
.dbm-asset-public-history{display:grid;gap:7px}
.dbm-asset-public-history div{padding:9px;border:1px solid #dce6ee;border-radius:11px;background:#fff}
.dbm-asset-public-history b{display:block;font-size:11px}.dbm-asset-public-history span{display:block;font-size:9px;color:#64748b;margin-top:2px}
@media(max-width:560px){
  .dbm-asset-qr-body{grid-template-columns:1fr}
  .dbm-asset-qr-img{width:180px;height:180px;margin:auto}
  .dbm-asset-qr-actions{grid-template-columns:1fr 1fr}
  .dbm-asset-qr-actions .full-row{grid-column:1/-1}
  .dbm-asset-public-grid{grid-template-columns:1fr}
}`;
  document.head.appendChild(s);
}

function inject(){
  const form=$('dbmAssetForm');
  if(!form)return;
  $('dbmAssetQr')?.remove();
  const save=form.querySelector('button[value="save"]');
  if(!save)return;
  const sec=document.createElement('section');
  sec.id='dbmAssetQr';
  sec.className='dbm-asset-qr';
  save.insertAdjacentElement('beforebegin',sec);
}

async function render(){
  const sec=$('dbmAssetQr');
  if(!sec)return;
  const id=$('dbmAssetId')?.value||'';
  if(!id){
    sec.innerHTML='<div class="dbm-asset-qr-head"><div><b>QR impianto</b><span>Salva prima l’impianto per creare il suo QR univoco.</span></div></div>';
    return;
  }
  const a=await M.assetById(id);
  if(!a){
    sec.innerHTML='<div class="dbm-asset-qr-empty">Impianto non trovato.</div>';
    return;
  }
  sec.innerHTML='<div class="dbm-asset-qr-head"><div><b>QR impianto</b><span>Preparazione QR condiviso…</span></div><div class="dbm-asset-code">'+esc(shortCode(id))+'</div></div>';
  try{
    const rec=await ensurePublished(a);
    const url=assetUrl(rec.publicToken),code=shortCode(id),img=qrUrl(url);
    sec.innerHTML=`<div class="dbm-asset-qr-head"><div><b>QR impianto</b><span>Scansiona per aprire questa scheda tecnica anche fuori dalla PWA.</span></div><div class="dbm-asset-code">${esc(code)}</div></div><div class="dbm-asset-qr-body"><img class="dbm-asset-qr-img" src="${esc(img)}" alt="QR ${esc(a.name||'impianto')}"><div class="dbm-asset-qr-actions"><button type="button" class="secondary" id="dbmAssetQrCopy">Copia link</button><button type="button" class="secondary" id="dbmAssetQrShare">Condividi</button><button type="button" class="primary full-row" id="dbmAssetQrPrint">Stampa etichetta QR</button></div></div><div class="dbm-asset-qr-note">Il QR contiene solo un token tecnico casuale. La scheda condivisa non include nome cliente o indirizzo.</div>`;
    $('dbmAssetQrCopy').onclick=()=>copyLink(url);
    $('dbmAssetQrShare').onclick=()=>shareLink(a,url);
    $('dbmAssetQrPrint').onclick=()=>printLabel(a,code,img);
  }catch(e){
    console.error('DB asset QR publish',e);
    sec.innerHTML=`<div class="dbm-asset-qr-head"><div><b>QR impianto</b><span>Registro QR condiviso non raggiungibile.</span></div><div class="dbm-asset-code">${esc(shortCode(id))}</div></div><div class="dbm-asset-qr-error">Nessun dato dell’impianto è stato perso. Riprova quando c’è connessione.</div><button type="button" class="secondary full" id="dbmAssetQrRetry" style="margin-top:9px">Riprova QR</button>`;
    $('dbmAssetQrRetry').onclick=render;
  }
}

async function copyLink(url){
  try{await navigator.clipboard.writeText(url);alert('Link QR copiato.')}
  catch{prompt('Copia questo link:',url)}
}

async function shareLink(a,url){
  const data={title:`DB Plumbing · ${a.name||'Impianto'}`,text:`Scheda impianto ${a.name||''}`.trim(),url};
  if(navigator.share){
    try{await navigator.share(data)}catch(e){if(e?.name!=='AbortError')console.error(e)}
    return;
  }
  copyLink(url);
}

function printLabel(a,code,img){
  const w=window.open('','_blank');
  if(!w){alert('Consenti l’apertura della finestra per stampare il QR.');return}
  w.document.write(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(code)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;text-align:center;padding:24px;color:#0b1f35}img{width:260px;height:260px}.brand{font-weight:900;font-size:22px}.name{font-weight:800;font-size:18px;margin-top:10px}.code{font-size:14px;margin-top:5px}.hint{font-size:11px;color:#64748b;margin-top:7px}@media print{body{padding:0}}</style></head><body><div class="brand">DB Plumbing Services</div><img src="${img}" alt="QR"><div class="name">${esc(a.name||'Impianto')}</div><div class="code">${esc(code)}</div><div class="hint">Scan to open equipment record</div><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
  w.document.close();
}

function hookDialog(){
  const d=$('dbmAssetDialog');
  new MutationObserver(()=>{if(d.hasAttribute('open'))setTimeout(render,40)}).observe(d,{attributes:true,attributeFilter:['open']});
  d.addEventListener('toggle',()=>{if(d.open)setTimeout(render,40)});
  $('dbmAssetForm').addEventListener('submit',syncAfterSave);
  $('dbmDeleteAsset')?.addEventListener('click',syncAfterDelete);
}

function syncAfterSave(){
  const beforeId=$('dbmAssetId')?.value||'';
  const propertyId=$('dbmPropertyId')?.value||'';
  const name=$('dbmAssetName')?.value.trim()||'';
  const started=Date.now();
  setTimeout(async()=>{
    try{
      let a=beforeId?await M.assetById(beforeId):null;
      if(!a&&propertyId){
        const list=await M.assetsForProperty(propertyId);
        a=list.filter(x=>x.name===name&&Date.now()-new Date(x.updatedAt||0).getTime()<12000)
          .sort((x,y)=>new Date(y.updatedAt||0)-new Date(x.updatedAt||0))[0]||null;
      }
      if(a&&Date.now()-started<15000)await ensurePublished(a);
    }catch(e){console.warn('DB asset QR post-save sync',e)}
  },500);
}

async function syncAfterDelete(){
  const id=$('dbmAssetId')?.value||'';
  if(!id)return;
  const map=await loadMap();
  const rec=map[id];
  if(!rec)return;
  setTimeout(async()=>{
    try{
      const still=await M.assetById(id);
      if(still)return;
      await rpc('asset_qr_revoke',{p_owner_token:rec.ownerToken});
      const next=await loadMap();
      delete next[id];
      await saveMap(next);
    }catch(e){console.warn('DB asset QR revoke',e)}
  },900);
}

function ensurePublicDialog(){
  if($('dbmAssetPublicDialog'))return;
  document.body.insertAdjacentHTML('beforeend',`<dialog id="dbmAssetPublicDialog" class="dbm-asset-public"><div class="dialog-head"><div><div class="dbm-asset-public-brand">DB Plumbing Services</div><h2 style="margin-top:4px">Scheda tecnica impianto</h2></div><button type="button" class="icon" id="dbmAssetPublicClose">×</button></div><div id="dbmAssetPublicBody" class="dbm-asset-public-card"></div></dialog>`);
  $('dbmAssetPublicClose').onclick=()=>$('dbmAssetPublicDialog').close();
}

function field(label,value){
  if(!value)return'';
  return `<div class="dbm-asset-public-field"><b>${esc(label)}</b><span>${esc(value)}</span></div>`;
}

function renderPublicAsset(a){
  ensurePublicDialog();
  const maintenance=a.maintenance?.months?`Ogni ${a.maintenance.months} mesi${a.maintenance.nextDate?` · prossima ${fmt(a.maintenance.nextDate)}`:''}`:'Nessuna manutenzione programmata';
  const hist=(a.history||[]).length
    ?`<div><b style="font-size:12px">Storico interventi</b><div class="dbm-asset-public-history" style="margin-top:7px">${a.history.map(x=>`<div><b>${esc(x.title||'Intervento')}</b><span>${esc(fmt(x.date))} · ${esc(statusLabel(x.status))}</span></div>`).join('')}</div></div>`
    :'<div class="dbm-asset-qr-empty">Nessun intervento collegato a questo impianto.</div>';
  $('dbmAssetPublicBody').innerHTML=`
    ${a.imageDataUrl?`<img class="dbm-asset-public-photo" src="${a.imageDataUrl}" alt="${esc(a.name||'Impianto')}">`:''}
    <div><h3 style="margin:0">${esc(a.name||'Impianto')}</h3><div class="hint">${esc(a.code||'')}</div></div>
    <div class="dbm-asset-public-grid">
      ${field('Tipo',a.type)}
      ${field('Marca',a.brand)}
      ${field('Modello',a.model)}
      ${field('Numero seriale',a.serial)}
      ${field('Data installazione',fmt(a.installedDate))}
      ${field('Garanzia fino al',fmt(a.warrantyUntil))}
      ${field('Manutenzione',maintenance)}
    </div>
    ${a.notes?`<div class="dbm-asset-public-field"><b>Note tecniche</b><span style="white-space:pre-wrap">${esc(a.notes)}</span></div>`:''}
    ${hist}
    <div class="dbm-asset-qr-note">Scheda tecnica read-only. Nessun nome cliente o indirizzo è incluso nel registro QR.</div>`;
  $('dbmAssetPublicDialog').showModal();
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function findByData(attr,id,timeout=3500){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    const el=[...document.querySelectorAll(`[${attr}]`)].find(x=>x.getAttribute(attr)===id);
    if(el)return el;
    await sleep(80);
  }
  return null;
}

async function openLocalAsset(id){
  const a=await M.assetById(id);
  if(!a)return false;
  const p=await M.propertyById(a.propertyId);
  if(!p||typeof window.openClient!=='function')return false;
  await window.openClient(p.clientId);
  const pc=await findByData('data-prop',p.id);
  if(pc)pc.click();
  const ac=await findByData('data-asset',a.id);
  if(ac)ac.click();
  return !!ac;
}

async function openFromQr(){
  const params=new URLSearchParams(location.search);
  const publicToken=params.get('assetqr')||'';
  const legacyId=params.get('asset')||'';
  if(!publicToken&&!legacyId)return;

  try{
    if(publicToken){
      const map=await loadMap();
      const localId=Object.keys(map).find(id=>map[id]?.publicToken===publicToken)||'';
      if(localId&&await openLocalAsset(localId))return;

      const res=await rpc('asset_qr_public_get',{p_token:publicToken});
      if(res?.ok&&res.asset){
        renderPublicAsset(res.asset);
        return;
      }
      alert('Scheda QR non disponibile o revocata.');
      return;
    }

    if(legacyId&&await openLocalAsset(legacyId))return;
    alert('Questo è un QR precedente. Apri la scheda impianto in DB Plumbing e usa il nuovo QR condiviso.');
  }catch(e){
    console.error('DB asset QR open',e);
    alert('Impossibile aprire la scheda QR in questo momento. Riprova con connessione attiva.');
  }
}

function init(){
  if(M.__assetQrReadyV90)return;
  M.__assetQrReadyV90=true;
  styles();
  inject();
  hookDialog();
  setTimeout(openFromQr,250);
}

wait();
})();
