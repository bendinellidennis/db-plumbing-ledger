(()=>{
'use strict';
if(window.__DBMQuotePdfUXV123)return;
window.__DBMQuotePdfUXV123=true;
let list=null,preview=null,iframe=null,zoom=.82,currentQuoteId='';

function installStyles(){
  if(document.getElementById('dbmQuotePdfUXV123Style'))return;
  const s=document.createElement('style');
  s.id='dbmQuotePdfUXV123Style';
  s.textContent=`
    #dbmQuotePdfPreview .dbm-qpdf-previewbar{flex-wrap:wrap}
    #dbmQuotePdfPreview .dbm-qpdf-zoomout,#dbmQuotePdfPreview .dbm-qpdf-zoomin{background:#2a2a2a;color:#fff;min-width:46px;padding:0 12px}
    #dbmQuotePdfPreview .dbm-qpdf-share{background:#1684c5;color:#fff}
    #dbmQuotePdfPreview .dbm-qpdf-zoomwrap{flex:1;min-height:0;overflow:auto;background:#f3f4f6;-webkit-overflow-scrolling:touch}
    #dbmQuotePdfPreview .dbm-qpdf-zoomwrap iframe{display:block;flex:none!important;border:0;background:#fff;transform-origin:top left}
  `;
  document.head.appendChild(s);
}

function applyZoom(next){
  if(!iframe)return;
  zoom=Math.max(.62,Math.min(1.25,next));
  iframe.style.transform=`scale(${zoom})`;
  iframe.style.width=`${100/zoom}%`;
  iframe.style.height=`${100/zoom}%`;
}

async function prepareShareFile(){
  if(!preview||!iframe)return;
  const src=iframe.src||'';
  if(!src.startsWith('blob:'))return;
  try{
    const r=await fetch(src);
    const blob=await r.blob();
    const filename=preview._downloadAnchor?.download||'DB_Plumbing_Quotation.pdf';
    preview._shareFileV123=new File([blob],filename,{type:'application/pdf',lastModified:Date.now()});
    preview._shareQuoteIdV123=currentQuoteId;
  }catch(e){console.warn('Prepare quotation share file',e)}
}

async function shareCurrentPdf(){
  if(!preview)return;
  const file=preview._shareFileV123;
  if(!file){
    await prepareShareFile();
  }
  const ready=preview._shareFileV123;
  if(!ready){
    preview._downloadAnchor?.click();
    alert('Il PDF è stato salvato. Ora puoi allegarlo in WhatsApp o WhatsApp Business come documento.');
    return;
  }
  if(typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare({files:[ready]}))){
    try{
      await navigator.share({files:[ready]});
      return;
    }catch(e){
      if(e?.name==='AbortError')return;
      console.warn('Quotation native share failed',e);
    }
  }
  preview._downloadAnchor?.click();
  alert('Il PDF è stato salvato. Ora puoi allegarlo in WhatsApp o WhatsApp Business come documento.');
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
    const close=bar.querySelector('.dbm-qpdf-close');
    close?.insertAdjacentElement('afterend',minus);
    minus.insertAdjacentElement('afterend',plus);
  }

  if(!bar.querySelector('.dbm-qpdf-share')){
    const share=document.createElement('button');
    share.type='button';share.className='dbm-qpdf-share';share.textContent='Condividi PDF';
    share.onclick=shareCurrentPdf;
    const save=bar.querySelector('.dbm-qpdf-save');
    save?.insertAdjacentElement('beforebegin',share);
  }

  if(!iframe.dataset.dbmSharePrepV123){
    iframe.dataset.dbmSharePrepV123='1';
    iframe.addEventListener('load',()=>{
      zoom=.82;
      applyZoom(zoom);
      preview._shareFileV123=null;
      setTimeout(prepareShareFile,0);
    });
  }
  applyZoom(zoom);
  return true;
}

function addShareActions(){
  if(!list)return;
  list.querySelectorAll('[data-quote]').forEach(row=>{
    const box=row.querySelector('.dbm-qpdf-actions');
    if(!box)return;
    if(!box.querySelector('[data-qpdf-share-v123]')){
      const b=document.createElement('button');
      b.type='button';b.className='primary small';b.dataset.qpdfShareV123='1';b.textContent='Condividi PDF';
      const save=box.querySelector('[data-qpdf-save]');
      save?.insertAdjacentElement('afterend',b);
    }
    const note=box.querySelector('.dbm-qpdf-note');
    if(note)note.innerHTML='<strong>Preventivo PDF:</strong> apri, salva o condividi direttamente il documento. Nessun link cliente e nessun pulsante Accetta/Rifiuta.';
  });
}

function handleListClick(e){
  const share=e.target.closest?.('[data-qpdf-share-v123]');
  if(!share)return;
  const row=share.closest('[data-quote]');
  if(!row)return;
  e.preventDefault();e.stopPropagation();
  currentQuoteId=row.dataset.quote||'';
  const p=document.getElementById('dbmQuotePdfPreview');
  if(p&&!p.hidden&&p._shareFileV123&&p._shareQuoteIdV123===currentQuoteId){shareCurrentPdf();return}
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
  if(list.dataset.dbmPdfUXV123!=='1'){
    list.dataset.dbmPdfUXV123='1';
    list.addEventListener('click',handleListClick,true);
    new MutationObserver(()=>{addShareActions();installPreviewUX()}).observe(list,{childList:true});
  }
  document.addEventListener('click',e=>{
    const open=e.target.closest?.('[data-qpdf-open]');
    if(open){const row=open.closest('[data-quote]');if(row)currentQuoteId=row.dataset.quote||''}
  },true);
}
wait();
})();
