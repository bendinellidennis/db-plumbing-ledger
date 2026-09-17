(()=>{
'use strict';
if(window.__DBMQuotePdfUXV126)return;
window.__DBMQuotePdfUXV126=true;

let list=null,preview=null,iframe=null,zoom=.78,currentQuoteId='';

function installStyles(){
  if(document.getElementById('dbmQuotePdfUXV126Style'))return;
  const s=document.createElement('style');
  s.id='dbmQuotePdfUXV126Style';
  s.textContent=`
    #dbmQuotePdfPreview .dbm-qpdf-previewbar{flex-wrap:wrap;gap:8px}
    #dbmQuotePdfPreview .dbm-qpdf-zoomout,#dbmQuotePdfPreview .dbm-qpdf-zoomin,#dbmQuotePdfPreview .dbm-qpdf-fit{background:#2a2a2a;color:#fff;min-width:44px;padding:0 12px}
    #dbmQuotePdfPreview .dbm-qpdf-share{background:#1684c5;color:#fff}
    #dbmQuotePdfPreview .dbm-qpdf-share:disabled{opacity:.55}
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

function fitPdf(){applyZoom(.78)}

function shareButton(){return preview?.querySelector('.dbm-qpdf-share')||null}

function setShareState(state){
  const b=shareButton();
  if(!b)return;
  if(state==='ready'){
    b.disabled=false;
    b.textContent='Condividi PDF';
  }else if(state==='error'){
    b.disabled=false;
    b.textContent='Condividi PDF';
  }else{
    b.disabled=true;
    b.textContent='Preparo PDF…';
  }
}

async function prepareShareFile(){
  if(!preview||!iframe)return;
  preview._shareFileV126=null;
  preview._shareQuoteIdV126='';
  setShareState('preparing');

  const src=(iframe.src||'').split('#')[0];
  if(!src.startsWith('blob:')){
    setShareState('error');
    return;
  }

  try{
    const r=await fetch(src,{cache:'no-store'});
    if(!r.ok)throw new Error('PDF fetch failed');
    const ab=await r.arrayBuffer();
    const bytes=new Uint8Array(ab);
    if(bytes.length<1000)throw new Error('PDF too small');
    const sig=String.fromCharCode(...bytes.slice(0,5));
    if(sig!=='%PDF-')throw new Error('Invalid PDF signature');
    const filename=preview._downloadAnchor?.download||'DB_Plumbing_Quotation.pdf';
    const file=new File([bytes],filename,{type:'application/pdf',lastModified:Date.now()});
    preview._shareFileV126=file;
    preview._shareQuoteIdV126=currentQuoteId;
    setShareState('ready');
  }catch(e){
    console.error('Prepare quotation PDF file',e);
    preview._shareFileV126=null;
    preview._shareQuoteIdV126='';
    setShareState('error');
  }
}

function fallbackSave(message){
  preview?._downloadAnchor?.click();
  setTimeout(()=>alert(message||'Il PDF è stato salvato. Aprilo da Download e condividilo come documento.'),80);
}

function sharePreparedPdf(){
  if(!preview)return;
  const file=preview._shareFileV126;
  if(!file){
    fallbackSave('Il file PDF non era pronto per la condivisione. L’ho salvato nei Download.');
    return;
  }

  if(typeof navigator.share!=='function'){
    fallbackSave('La condivisione diretta non è disponibile qui. Il PDF è stato salvato nei Download.');
    return;
  }

  try{
    if(typeof navigator.canShare==='function'&&!navigator.canShare({files:[file]})){
      fallbackSave('iPhone non consente la condivisione diretta di questo file da questa schermata. Il PDF è stato salvato nei Download.');
      return;
    }

    const result=navigator.share({files:[file]});
    if(result&&typeof result.catch==='function'){
      result.catch(err=>{
        if(err?.name==='AbortError')return;
        console.error('Share quotation PDF file',err);
        fallbackSave('La condivisione diretta non è riuscita. Il PDF è stato salvato nei Download.');
      });
    }
  }catch(err){
    console.error('Share quotation PDF file',err);
    fallbackSave('La condivisione diretta non è riuscita. Il PDF è stato salvato nei Download.');
  }
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

  let share=bar.querySelector('.dbm-qpdf-share');
  if(!share){
    share=document.createElement('button');
    share.type='button';share.className='dbm-qpdf-share';share.textContent='Preparo PDF…';share.disabled=true;
    const save=bar.querySelector('.dbm-qpdf-save');
    save?.insertAdjacentElement('beforebegin',share);
  }
  share.onclick=sharePreparedPdf;

  if(!iframe.dataset.dbmPdfUXV126){
    iframe.dataset.dbmPdfUXV126='1';
    iframe.addEventListener('load',()=>{
      fitPdf();
      const src=(iframe.src||'').split('#')[0];
      if(src.startsWith('blob:'))prepareShareFile();
      else{
        preview._shareFileV126=null;
        preview._shareQuoteIdV126='';
        setShareState('error');
      }
    });
  }

  fitPdf();
  const src=(iframe.src||'').split('#')[0];
  if(src.startsWith('blob:'))prepareShareFile();
  return true;
}

function addShareActions(){
  if(!list)return;
  list.querySelectorAll('[data-quote]').forEach(row=>{
    const box=row.querySelector('.dbm-qpdf-actions');
    if(!box)return;
    box.querySelector('[data-qpdf-share-v123]')?.remove();
    box.querySelector('[data-qpdf-share-v124]')?.remove();
    box.querySelector('[data-qpdf-share-v125]')?.remove();
    if(!box.querySelector('[data-qpdf-share-v126]')){
      const b=document.createElement('button');
      b.type='button';b.className='primary small';b.dataset.qpdfShareV126='1';b.textContent='Condividi PDF';
      const save=box.querySelector('[data-qpdf-save]');
      save?.insertAdjacentElement('afterend',b);
    }
    const note=box.querySelector('.dbm-qpdf-note');
    if(note)note.innerHTML='<strong>Preventivo PDF:</strong> apri, salva o condividi direttamente il file PDF. Nessun link viene inviato al cliente.';
  });
}

function handleListClick(e){
  const share=e.target.closest?.('[data-qpdf-share-v126]');
  if(!share)return;
  const row=share.closest('[data-quote]');
  if(!row)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  currentQuoteId=row.dataset.quote||'';
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

  if(list.dataset.dbmPdfUXV126!=='1'){
    list.dataset.dbmPdfUXV126='1';
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
