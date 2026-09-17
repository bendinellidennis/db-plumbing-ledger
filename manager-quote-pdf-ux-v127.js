(()=>{
'use strict';
if(window.__DBMQuotePdfUXV127)return;
window.__DBMQuotePdfUXV127=true;

let list=null,preview=null,iframe=null,zoom=.78,currentQuoteId='';
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);

function installStyles(){
  if(document.getElementById('dbmQuotePdfUXV127Style'))return;
  const s=document.createElement('style');
  s.id='dbmQuotePdfUXV127Style';
  s.textContent=`
    #dbmQuotePdfPreview .dbm-qpdf-previewbar{flex-wrap:wrap;gap:8px}
    #dbmQuotePdfPreview .dbm-qpdf-zoomout,#dbmQuotePdfPreview .dbm-qpdf-zoomin,#dbmQuotePdfPreview .dbm-qpdf-fit{background:#2a2a2a;color:#fff;min-width:44px;padding:0 12px}
    #dbmQuotePdfPreview .dbm-qpdf-share{background:#1684c5;color:#fff}
    #dbmQuotePdfPreview .dbm-qpdf-zoomwrap{flex:1;min-height:0;overflow:auto;background:#e9edf1;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y pinch-zoom;text-align:left}
    #dbmQuotePdfPreview .dbm-qpdf-zoomwrap iframe{display:block;flex:none!important;border:0;background:#fff;transform-origin:top left}
    .dbm-qpdf-send-help{position:fixed;inset:0;z-index:100500;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:18px}
    .dbm-qpdf-send-help[hidden]{display:none!important}
    .dbm-qpdf-send-card{width:min(520px,100%);background:#fff;border-radius:22px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.3);color:#102a43}
    .dbm-qpdf-send-card h3{margin:0 0 8px;font-size:20px}
    .dbm-qpdf-send-card p{margin:7px 0;line-height:1.45;color:#52677d}
    .dbm-qpdf-send-card .file{font-weight:800;color:#102a43;word-break:break-word}
    .dbm-qpdf-send-actions{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
    .dbm-qpdf-send-actions button{flex:1;min-width:130px;min-height:48px;border:0;border-radius:13px;font-weight:800;font-size:16px}
    .dbm-qpdf-open-wa{background:#1684c5;color:#fff}
    .dbm-qpdf-close-help{background:#edf2f6;color:#102a43}
  `;
  document.head.appendChild(s);
}

function applyZoom(next){
  if(!iframe)return;
  zoom=Math.max(.55,Math.min(1.35,next));
  iframe.style.transform=`scale(${zoom})`;
  iframe.style.width=`${100/zoom}%`;
  iframe.style.height=`${100/zoom}%`;
}
function fitPdf(){applyZoom(.78)}

function ensureHelp(){
  let h=document.getElementById('dbmQuotePdfSendHelp');
  if(h)return h;
  h=document.createElement('div');
  h.id='dbmQuotePdfSendHelp';
  h.className='dbm-qpdf-send-help';
  h.hidden=true;
  h.innerHTML=`<div class="dbm-qpdf-send-card" role="dialog" aria-modal="true">
    <h3>PDF salvato</h3>
    <p>Su iPhone WhatsApp sta rifiutando i PDF passati direttamente dal browser. Per evitare altri errori il documento è stato salvato davvero sul telefono.</p>
    <p>In WhatsApp usa <strong>+ → Documento → Download</strong> e scegli:</p>
    <p class="file"></p>
    <div class="dbm-qpdf-send-actions"><button type="button" class="dbm-qpdf-open-wa">Apri WhatsApp</button><button type="button" class="dbm-qpdf-close-help">Chiudi</button></div>
  </div>`;
  document.body.appendChild(h);
  h.querySelector('.dbm-qpdf-close-help').onclick=()=>{h.hidden=true};
  h.querySelector('.dbm-qpdf-open-wa').onclick=()=>{window.location.href='whatsapp://send'};
  h.addEventListener('click',e=>{if(e.target===h)h.hidden=true});
  return h;
}

function saveFromPreview(){
  const a=preview?._downloadAnchor;
  if(!a)return false;
  try{
    const clone=a.cloneNode(true);
    clone.style.display='none';
    document.body.appendChild(clone);
    clone.click();
    setTimeout(()=>clone.remove(),300);
    return true;
  }catch(e){console.error('Quotation PDF save',e);return false}
}

function showIOSHandoff(){
  const a=preview?._downloadAnchor;
  if(!a){alert('Il PDF non è ancora pronto. Riprova tra un istante.');return}
  if(!saveFromPreview()){alert('Non riesco a salvare il PDF. Usa il pulsante Salva PDF.');return}
  const h=ensureHelp();
  h.querySelector('.file').textContent=a.download||'DB_Plumbing_Quotation.pdf';
  h.hidden=false;
}

async function shareDirectOtherPlatforms(){
  const src=(iframe?.src||'').split('#')[0];
  if(!src.startsWith('blob:')){saveFromPreview();return}
  try{
    const r=await fetch(src,{cache:'no-store'});
    const bytes=new Uint8Array(await r.arrayBuffer());
    const filename=preview?._downloadAnchor?.download||'DB_Plumbing_Quotation.pdf';
    const file=new File([bytes],filename,{type:'application/pdf',lastModified:Date.now()});
    if(typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      await navigator.share({files:[file]});
      return;
    }
  }catch(e){if(e?.name==='AbortError')return;console.warn('Quotation share',e)}
  saveFromPreview();
}

function shareCurrentPdf(){
  if(isIOS())showIOSHandoff();
  else shareDirectOtherPlatforms();
}

function installPreviewUX(){
  preview=document.getElementById('dbmQuotePdfPreview');
  if(!preview)return false;
  iframe=preview.querySelector('iframe');
  const bar=preview.querySelector('.dbm-qpdf-previewbar');
  if(!iframe||!bar)return false;

  if(!iframe.parentElement.classList.contains('dbm-qpdf-zoomwrap')){
    const wrap=document.createElement('div');
    wrap.className='dbm-qpdf-zoomwrap';
    iframe.parentNode.insertBefore(wrap,iframe);
    wrap.appendChild(iframe);
  }

  if(!bar.querySelector('.dbm-qpdf-zoomout')){
    const minus=document.createElement('button');minus.type='button';minus.className='dbm-qpdf-zoomout';minus.textContent='−';minus.onclick=()=>applyZoom(zoom-.1);
    const plus=document.createElement('button');plus.type='button';plus.className='dbm-qpdf-zoomin';plus.textContent='+';plus.onclick=()=>applyZoom(zoom+.1);
    const fit=document.createElement('button');fit.type='button';fit.className='dbm-qpdf-fit';fit.textContent='Adatta';fit.onclick=fitPdf;
    const close=bar.querySelector('.dbm-qpdf-close');
    close?.insertAdjacentElement('afterend',minus);minus.insertAdjacentElement('afterend',plus);plus.insertAdjacentElement('afterend',fit);
  }

  let share=bar.querySelector('.dbm-qpdf-share');
  if(!share){
    share=document.createElement('button');share.type='button';share.className='dbm-qpdf-share';share.textContent='Condividi PDF';
    bar.querySelector('.dbm-qpdf-save')?.insertAdjacentElement('beforebegin',share);
  }
  share.onclick=shareCurrentPdf;

  if(!iframe.dataset.dbmPdfUXV127){
    iframe.dataset.dbmPdfUXV127='1';
    iframe.addEventListener('load',fitPdf);
  }
  fitPdf();
  return true;
}

function addShareActions(){
  if(!list)return;
  list.querySelectorAll('[data-quote]').forEach(row=>{
    const box=row.querySelector('.dbm-qpdf-actions');if(!box)return;
    box.querySelectorAll('[data-qpdf-share-v123],[data-qpdf-share-v124],[data-qpdf-share-v125],[data-qpdf-share-v126]').forEach(x=>x.remove());
    if(!box.querySelector('[data-qpdf-share-v127]')){
      const b=document.createElement('button');b.type='button';b.className='primary small';b.dataset.qpdfShareV127='1';b.textContent='Condividi PDF';
      box.querySelector('[data-qpdf-save]')?.insertAdjacentElement('afterend',b);
    }
    const note=box.querySelector('.dbm-qpdf-note');
    if(note)note.innerHTML=isIOS()?'<strong>Preventivo PDF:</strong> su iPhone Condividi PDF salva il documento e ti porta a WhatsApp per allegarlo come Documento. Nessun link cliente.':'<strong>Preventivo PDF:</strong> apri, salva o condividi il documento. Nessun link cliente.';
  });
}

function handleListClick(e){
  const share=e.target.closest?.('[data-qpdf-share-v127]');if(!share)return;
  const row=share.closest('[data-quote]');if(!row)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  currentQuoteId=row.dataset.quote||'';
  row.querySelector('[data-qpdf-open]')?.click();
}

function wait(){
  if(!window.DBM?.__quotePdfV121Ready)return setTimeout(wait,80);
  list=document.getElementById('dbmQuoteList');if(!list)return setTimeout(wait,80);
  installStyles();installPreviewUX();addShareActions();ensureHelp();
  if(list.dataset.dbmPdfUXV127!=='1'){
    list.dataset.dbmPdfUXV127='1';
    list.addEventListener('click',handleListClick,true);
    new MutationObserver(()=>{addShareActions();installPreviewUX()}).observe(list,{childList:true});
  }
  document.addEventListener('click',e=>{const open=e.target.closest?.('[data-qpdf-open]');if(open){const row=open.closest('[data-quote]');if(row)currentQuoteId=row.dataset.quote||''}},true);
}
wait();
})();
