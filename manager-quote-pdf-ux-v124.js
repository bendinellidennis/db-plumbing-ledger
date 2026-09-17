(()=>{
'use strict';
if(window.__DBMQuotePdfUXV124)return;
window.__DBMQuotePdfUXV124=true;

let list=null,preview=null,iframe=null,zoom=.78,currentQuoteId='',previewQuoteId='';
let pendingNativeWindow=null,pendingNativeQuoteId='';

const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);

function installStyles(){
  if(document.getElementById('dbmQuotePdfUXV124Style'))return;
  const s=document.createElement('style');
  s.id='dbmQuotePdfUXV124Style';
  s.textContent=`
    #dbmQuotePdfPreview .dbm-qpdf-previewbar{flex-wrap:wrap;gap:8px}
    #dbmQuotePdfPreview .dbm-qpdf-zoomout,#dbmQuotePdfPreview .dbm-qpdf-zoomin,#dbmQuotePdfPreview .dbm-qpdf-fit{background:#2a2a2a;color:#fff;min-width:44px;padding:0 12px}
    #dbmQuotePdfPreview .dbm-qpdf-share{background:#1684c5;color:#fff}
    #dbmQuotePdfPreview .dbm-qpdf-zoomwrap{flex:1;min-height:0;overflow:auto;background:#e9edf1;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y pinch-zoom;text-align:left}
    #dbmQuotePdfPreview .dbm-qpdf-zoomwrap iframe{display:block;flex:none!important;border:0;background:#fff;transform-origin:top left}
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

function fitPdf(){
  zoom=.78;
  applyZoom(zoom);
}

function closePendingWindow(){
  if(!pendingNativeWindow)return;
  try{if(!pendingNativeWindow.closed)pendingNativeWindow.close()}catch{}
  pendingNativeWindow=null;
  pendingNativeQuoteId='';
}

function preopenNativeWindow(){
  let w=null;
  try{w=window.open('about:blank','_blank')}catch{}
  if(!w)return null;
  try{
    w.document.open();
    w.document.write('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div style="font:600 17px -apple-system;padding:28px;color:#102a43">Preparing PDF…</div>');
    w.document.close();
  }catch{}
  return w;
}

async function openNativeViewer(targetWindow=null){
  const target=targetWindow||preopenNativeWindow();
  if(!target){
    alert('Safari ha bloccato la nuova finestra. Usa Salva PDF e apri il file dai Download.');
    return false;
  }
  try{
    if(!iframe)throw new Error('PDF preview unavailable');
    const src=(iframe.src||'').split('#')[0];
    if(!src.startsWith('blob:'))throw new Error('PDF not ready');
    const r=await fetch(src,{cache:'no-store'});
    if(!r.ok)throw new Error('Unable to read quotation PDF');
    const bytes=await r.arrayBuffer();
    const BlobCtor=target.Blob||Blob;
    const URLApi=target.URL||URL;
    const url=URLApi.createObjectURL(new BlobCtor([bytes],{type:'application/pdf'}));
    try{target.location.replace(url)}catch{target.location.href=url}
    return true;
  }catch(e){
    console.error('Open native quotation PDF',e);
    try{target.close()}catch{}
    preview?._downloadAnchor?.click();
    alert('Il PDF è stato salvato. Aprilo dai Download e usa il tasto Condividi di iPhone.');
    return false;
  }
}

async function shareCurrentPdf(){
  if(!preview||!iframe)return;

  if(isIOS()){
    const w=preopenNativeWindow();
    if(!w){
      preview._downloadAnchor?.click();
      alert('Il PDF è stato salvato. Aprilo dai Download e usa il tasto Condividi di iPhone.');
      return;
    }
    await openNativeViewer(w);
    return;
  }

  const src=(iframe.src||'').split('#')[0];
  if(src.startsWith('blob:')&&typeof navigator.share==='function'){
    try{
      const r=await fetch(src,{cache:'no-store'});
      const bytes=new Uint8Array(await r.arrayBuffer());
      const filename=preview._downloadAnchor?.download||'DB_Plumbing_Quotation.pdf';
      const file=new File([bytes],filename,{type:'application/pdf',lastModified:Date.now()});
      if(!navigator.canShare||navigator.canShare({files:[file]})){
        await navigator.share({files:[file]});
        return;
      }
    }catch(e){
      if(e?.name==='AbortError')return;
      console.warn('Quotation native share failed',e);
    }
  }
  preview._downloadAnchor?.click();
  alert('Il PDF è stato salvato. Ora puoi allegarlo come documento.');
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
    const minus=document.createElement('button');
    minus.type='button';minus.className='dbm-qpdf-zoomout';minus.textContent='−';minus.setAttribute('aria-label','Riduci PDF');
    minus.onclick=()=>applyZoom(zoom-.1);

    const plus=document.createElement('button');
    plus.type='button';plus.className='dbm-qpdf-zoomin';plus.textContent='+';plus.setAttribute('aria-label','Ingrandisci PDF');
    plus.onclick=()=>applyZoom(zoom+.1);

    const fit=document.createElement('button');
    fit.type='button';fit.className='dbm-qpdf-fit';fit.textContent='Adatta';fit.setAttribute('aria-label','Adatta PDF allo schermo');
    fit.onclick=fitPdf;

    const close=bar.querySelector('.dbm-qpdf-close');
    close?.insertAdjacentElement('afterend',minus);
    minus.insertAdjacentElement('afterend',plus);
    plus.insertAdjacentElement('afterend',fit);
  }

  if(!bar.querySelector('.dbm-qpdf-share')){
    const share=document.createElement('button');
    share.type='button';share.className='dbm-qpdf-share';share.textContent='Condividi PDF';
    share.onclick=shareCurrentPdf;
    const save=bar.querySelector('.dbm-qpdf-save');
    save?.insertAdjacentElement('beforebegin',share);
  }

  if(!iframe.dataset.dbmPdfUXV124){
    iframe.dataset.dbmPdfUXV124='1';
    iframe.addEventListener('load',()=>{
      fitPdf();
      previewQuoteId=currentQuoteId;
      const id=previewQuoteId;
      if(pendingNativeWindow&&pendingNativeQuoteId&&pendingNativeQuoteId===id){
        const w=pendingNativeWindow;
        pendingNativeWindow=null;
        pendingNativeQuoteId='';
        setTimeout(()=>openNativeViewer(w),0);
      }
    });
  }

  fitPdf();
  return true;
}

function addShareActions(){
  if(!list)return;
  list.querySelectorAll('[data-quote]').forEach(row=>{
    const box=row.querySelector('.dbm-qpdf-actions');
    if(!box)return;
    if(!box.querySelector('[data-qpdf-share-v124]')){
      box.querySelector('[data-qpdf-share-v123]')?.remove();
      const b=document.createElement('button');
      b.type='button';b.className='primary small';b.dataset.qpdfShareV124='1';b.textContent='Condividi PDF';
      const save=box.querySelector('[data-qpdf-save]');
      save?.insertAdjacentElement('afterend',b);
    }
    const note=box.querySelector('.dbm-qpdf-note');
    if(note)note.innerHTML='<strong>Preventivo PDF:</strong> apri, salva o condividi il documento. Nessun link viene inviato al cliente.';
  });
}

function handleListClick(e){
  const share=e.target.closest?.('[data-qpdf-share-v124]');
  if(!share)return;
  const row=share.closest('[data-quote]');
  if(!row)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  currentQuoteId=row.dataset.quote||'';

  if(isIOS()){
    closePendingWindow();
    pendingNativeWindow=preopenNativeWindow();
    pendingNativeQuoteId=currentQuoteId;
    if(!pendingNativeWindow){
      pendingNativeQuoteId='';
      const open=row.querySelector('[data-qpdf-open]');
      if(open)open.click();
      return;
    }
  }

  const p=document.getElementById('dbmQuotePdfPreview');
  if(p&&!p.hidden&&iframe&&previewQuoteId===currentQuoteId){
    if(isIOS()){
      const w=pendingNativeWindow;
      pendingNativeWindow=null;pendingNativeQuoteId='';
      openNativeViewer(w);
    }else shareCurrentPdf();
    return;
  }

  const open=row.querySelector('[data-qpdf-open]');
  if(open)open.click();
}

function wait(){
  if(!window.DBM?.__quotePdfV121Ready)return setTimeout(wait,80);
  list=document.getElementById('dbmQuoteList');
  if(!list)return setTimeout(wait,80);

  installStyles();
  installPreviewUX();
  addShareActions();

  if(list.dataset.dbmPdfUXV124!=='1'){
    list.dataset.dbmPdfUXV124='1';
    list.addEventListener('click',handleListClick,true);
    new MutationObserver(()=>{addShareActions();installPreviewUX()}).observe(list,{childList:true});
  }

  document.addEventListener('click',e=>{
    const open=e.target.closest?.('[data-qpdf-open]');
    if(open){
      const row=open.closest('[data-quote]');
      if(row)currentQuoteId=row.dataset.quote||'';
    }
  },true);
}

wait();
})();
