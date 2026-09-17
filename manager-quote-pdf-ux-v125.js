(()=>{
'use strict';
if(window.__DBMQuotePdfUXV125)return;
window.__DBMQuotePdfUXV125=true;

let list=null,preview=null,iframe=null,zoom=.78,currentQuoteId='';

function installStyles(){
  if(document.getElementById('dbmQuotePdfUXV125Style'))return;
  const s=document.createElement('style');
  s.id='dbmQuotePdfUXV125Style';
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

function fitPdf(){applyZoom(.78)}

function openReadyPdf(){
  if(!iframe)return;
  const src=(iframe.src||'').split('#')[0];
  if(!src.startsWith('blob:')){
    alert('Il PDF non è ancora pronto. Attendi un istante e riprova.');
    return;
  }
  let w=null;
  try{w=window.open(src,'_blank')}catch{}
  if(!w){
    preview?._downloadAnchor?.click();
    alert('Safari ha bloccato l’apertura. Il PDF è stato salvato: aprilo dai Download e usa Condividi.');
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
    share.type='button';share.className='dbm-qpdf-share';share.textContent='Condividi PDF';
    const save=bar.querySelector('.dbm-qpdf-save');
    save?.insertAdjacentElement('beforebegin',share);
  }
  share.onclick=openReadyPdf;

  if(!iframe.dataset.dbmPdfUXV125){
    iframe.dataset.dbmPdfUXV125='1';
    iframe.addEventListener('load',()=>fitPdf());
  }
  fitPdf();
  return true;
}

function addShareActions(){
  if(!list)return;
  list.querySelectorAll('[data-quote]').forEach(row=>{
    const box=row.querySelector('.dbm-qpdf-actions');
    if(!box)return;
    box.querySelector('[data-qpdf-share-v123]')?.remove();
    box.querySelector('[data-qpdf-share-v124]')?.remove();
    if(!box.querySelector('[data-qpdf-share-v125]')){
      const b=document.createElement('button');
      b.type='button';b.className='primary small';b.dataset.qpdfShareV125='1';b.textContent='Condividi PDF';
      const save=box.querySelector('[data-qpdf-save]');
      save?.insertAdjacentElement('afterend',b);
    }
    const note=box.querySelector('.dbm-qpdf-note');
    if(note)note.innerHTML='<strong>Preventivo PDF:</strong> apri, salva o condividi il documento. Nessun link viene inviato al cliente.';
  });
}

function handleListClick(e){
  const share=e.target.closest?.('[data-qpdf-share-v125]');
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

  if(list.dataset.dbmPdfUXV125!=='1'){
    list.dataset.dbmPdfUXV125='1';
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