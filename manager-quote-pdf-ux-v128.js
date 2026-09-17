(()=>{
'use strict';
if(window.__DBMQuotePdfUXV128)return;
window.__DBMQuotePdfUXV128=true;

let list=null,preview=null,iframe=null,zoom=.78,currentQuoteId='';

function installStyles(){
  if(document.getElementById('dbmQuotePdfUXV128Style'))return;
  const s=document.createElement('style');
  s.id='dbmQuotePdfUXV128Style';
  s.textContent=`
    #dbmQuotePdfPreview .dbm-qpdf-previewbar{flex-wrap:wrap;gap:8px}
    #dbmQuotePdfPreview .dbm-qpdf-zoomout,#dbmQuotePdfPreview .dbm-qpdf-zoomin,#dbmQuotePdfPreview .dbm-qpdf-fit{background:#2a2a2a;color:#fff;min-width:44px;padding:0 12px}
    #dbmQuotePdfPreview .dbm-qpdf-share{background:#1684c5;color:#fff}
    #dbmQuotePdfPreview .dbm-qpdf-share:disabled{opacity:.5}
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

function setShareReady(ready){
  const b=shareButton();
  if(!b)return;
  b.disabled=!ready;
  b.textContent=ready?'Condividi PDF':'Preparo PDF…';
}

async function prepareBytes(){
  if(!preview||!iframe)return;
  preview._shareBytesV128=null;
  preview._shareFilenameV128='';
  preview._shareQuoteIdV128='';
  setShareReady(false);

  const src=(iframe.src||'').split('#')[0];
  if(!src.startsWith('blob:'))return;

  try{
    const r=await fetch(src,{cache:'no-store'});
    if(!r.ok)throw new Error('Unable to read PDF blob');
    const ab=await r.arrayBuffer();
    const bytes=new Uint8Array(ab);
    if(bytes.length<1000)throw new Error('PDF payload too small');
    if(String.fromCharCode(bytes[0],bytes[1],bytes[2],bytes[3],bytes[4])!=='%PDF-')throw new Error('Invalid PDF signature');

    const stored=new Uint8Array(bytes.length);
    stored.set(bytes);
    preview._shareBytesV128=stored;
    preview._shareFilenameV128=String(preview._downloadAnchor?.download||'DB_Plumbing_Quotation.pdf').replace(/[^A-Za-z0-9._-]/g,'_');
    preview._shareQuoteIdV128=currentQuoteId;
    setShareReady(true);
  }catch(err){
    console.error('Quotation PDF byte preparation',err);
    preview._shareBytesV128=null;
    preview._shareFilenameV128='';
    preview._shareQuoteIdV128='';
    setShareReady(false);
  }
}

function shareFreshPdf(){
  if(!preview)return;
  const stored=preview._shareBytesV128;
  if(!(stored instanceof Uint8Array)||!stored.length){
    alert('Il PDF non è ancora pronto. Attendi un istante e riprova.');
    return;
  }
  if(typeof navigator.share!=='function'){
    alert('La condivisione file non è disponibile in questo browser.');
    return;
  }

  try{
    // Important on iOS: create a completely fresh in-memory backing store
    // during the user tap, rather than reusing the Blob/File used by preview.
    const freshBytes=new Uint8Array(stored.length);
    freshBytes.set(stored);
    const filename=preview._shareFilenameV128||'DB_Plumbing_Quotation.pdf';
    const file=new File([freshBytes.buffer],filename,{type:'application/pdf'});
    const data={files:[file]};

    if(typeof navigator.canShare==='function'&&!navigator.canShare(data)){
      alert('iPhone non consente la condivisione diretta di questo PDF da questa schermata.');
      return;
    }

    const result=navigator.share(data);
    if(result&&typeof result.catch==='function'){
      result.catch(err=>{
        if(err?.name==='AbortError')return;
        console.error('Quotation PDF direct share',err);
        alert('La condivisione del PDF non è riuscita. Riprova.');
      });
    }
  }catch(err){
    console.error('Quotation PDF direct share',err);
    alert('La condivisione del PDF non è riuscita. Riprova.');
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
  share.onclick=shareFreshPdf;

  if(!iframe.dataset.dbmPdfUXV128){
    iframe.dataset.dbmPdfUXV128='1';
    iframe.addEventListener('load',()=>{
      fitPdf();
      const src=(iframe.src||'').split('#')[0];
      if(src.startsWith('blob:'))prepareBytes();
      else{
        preview._shareBytesV128=null;
        preview._shareFilenameV128='';
        preview._shareQuoteIdV128='';
        setShareReady(false);
      }
    });
  }

  fitPdf();
  const src=(iframe.src||'').split('#')[0];
  if(src.startsWith('blob:'))prepareBytes();
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
    box.querySelector('[data-qpdf-share-v126]')?.remove();
    box.querySelector('[data-qpdf-share-v127]')?.remove();
    if(!box.querySelector('[data-qpdf-share-v128]')){
      const b=document.createElement('button');
      b.type='button';b.className='primary small';b.dataset.qpdfShareV128='1';b.textContent='Condividi PDF';
      const save=box.querySelector('[data-qpdf-save]');
      save?.insertAdjacentElement('afterend',b);
    }
    const note=box.querySelector('.dbm-qpdf-note');
    if(note)note.innerHTML='<strong>Preventivo PDF:</strong> apri, salva o condividi direttamente il file PDF. Nessun link viene inviato al cliente.';
  });
}

function handleListClick(e){
  const share=e.target.closest?.('[data-qpdf-share-v128]');
  if(!share)return;
  const row=share.closest('[data-quote]');
  if(!row)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  currentQuoteId=row.dataset.quote||'';

  const p=document.getElementById('dbmQuotePdfPreview');
  if(p&&!p.hidden&&p._shareQuoteIdV128===currentQuoteId&&p._shareBytesV128){
    shareFreshPdf();
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
  if(list.dataset.dbmPdfUXV128!=='1'){
    list.dataset.dbmPdfUXV128='1';
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
