(()=>{
'use strict';
let M,list,baseRenderQuotes,decorateQueued=false;
let pdfLibPromise=null,logoPromise=null;

const PDF_CDN='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
const PHONE='+356 7753 2068';
const EMAIL='dbplumbingservicesmalta@gmail.com';
const WEBSITE='bendinellidennis.github.io/bendinelli-dennis/';

function wait(){
  M=window.DBM;
  list=document.getElementById('dbmQuoteList');
  if(!M?.mAll||!M?.mOne||!M?.mPut||!M?.clients||!M?.renderQuotes||!list)return setTimeout(wait,100);
  init();
}

function init(){
  if(M.__interactiveQuotesV84Ready)return;
  M.__interactiveQuotesV84Ready=true;
  M.__quotePdfV117Ready=true;
  addStyles();
  baseRenderQuotes=M.renderQuotes.bind(M);
  M.renderQuotes=async()=>{await baseRenderQuotes();await decorate()};
  list.addEventListener('click',onAction,true);
  new MutationObserver(scheduleDecorate).observe(list,{childList:true,subtree:true});
  pdfLibPromise=ensurePdfLib();
  logoPromise=loadLogoData();
  decorate();
}

function addStyles(){
  if(document.getElementById('dbmQuotePdfV117Style'))return;
  const s=document.createElement('style');
  s.id='dbmQuotePdfV117Style';
  s.textContent=`
    .dbm-qpdf-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center;width:100%}
    .dbm-qpdf-actions .primary,.dbm-qpdf-actions .secondary{min-height:34px}
    .dbm-qpdf-note{width:100%;font-size:9.5px;color:#64748b;line-height:1.35;margin-top:1px}
    .dbm-qpdf-note strong{color:#102a43}
    .dbm-qpdf-toast{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:99999;background:#102a43;color:#fff;border-radius:999px;padding:10px 14px;font-size:11px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,.22);max-width:calc(100vw - 28px);text-align:center}
  `;
  document.head.appendChild(s);
}

function scheduleDecorate(){
  if(decorateQueued)return;
  decorateQueued=true;
  setTimeout(async()=>{decorateQueued=false;await decorate()},0);
}

async function decorate(){
  const rows=[...list.querySelectorAll('[data-quote]')];
  if(!rows.length)return;
  rows.forEach(row=>{
    row.querySelectorAll('.dbm-iq-actions').forEach(x=>x.remove());
    const actions=row.querySelector('.dbm-flow-row-actions');
    if(!actions||actions.querySelector('.dbm-qpdf-actions'))return;
    const box=document.createElement('div');
    box.className='dbm-qpdf-actions';
    box.innerHTML=`
      <button type="button" class="secondary small" data-qpdf-open>PDF / Stampa</button>
      <button type="button" class="primary small" data-qpdf-share>Condividi PDF</button>
      <div class="dbm-qpdf-note"><strong>Invio professionale:</strong> nessun link cliente e nessun pulsante Accetta/Rifiuta. Il preventivo viene condiviso come PDF.</div>
    `;
    actions.appendChild(box);
  });
}

async function onAction(e){
  const b=e.target.closest?.('[data-qpdf-open],[data-qpdf-share]');
  if(!b)return;
  const row=b.closest('[data-quote]');
  if(!row)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  const q=await M.mOne('jobs',row.dataset.quote);
  if(!q)return;
  b.disabled=true;
  try{
    if(b.hasAttribute('data-qpdf-open'))await openPdf(q);
    else await sharePdf(q);
  }catch(err){
    console.error('Quotation PDF',err);
    alert('Non riesco a creare il PDF in questo momento. Riprova tra qualche secondo.');
  }finally{b.disabled=false}
}

function ensurePdfLib(){
  if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  if(pdfLibPromise)return pdfLibPromise;
  pdfLibPromise=new Promise((resolve,reject)=>{
    const found=[...document.scripts].find(x=>x.src===PDF_CDN);
    if(found){
      if(window.jspdf?.jsPDF)return resolve(window.jspdf.jsPDF);
      found.addEventListener('load',()=>resolve(window.jspdf.jsPDF),{once:true});
      found.addEventListener('error',reject,{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=PDF_CDN;
    s.async=true;
    s.onload=()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(new Error('jsPDF unavailable'));
    s.onerror=()=>reject(new Error('Unable to load PDF engine'));
    document.head.appendChild(s);
  });
  return pdfLibPromise;
}

function loadLogoData(){
  if(logoPromise)return logoPromise;
  logoPromise=new Promise(async resolve=>{
    try{
      const r=await fetch(new URL('db-brand-mark.svg',location.href),{cache:'no-store'});
      if(!r.ok)throw new Error('logo');
      const svg=await r.text();
      const blob=new Blob([svg],{type:'image/svg+xml'});
      const url=URL.createObjectURL(blob);
      const img=new Image();
      img.onload=()=>{
        try{
          const canvas=document.createElement('canvas');
          canvas.width=600;canvas.height=260;
          const ctx=canvas.getContext('2d');
          ctx.clearRect(0,0,canvas.width,canvas.height);
          const scale=Math.min(canvas.width/img.width,canvas.height/img.height);
          const w=img.width*scale,h=img.height*scale;
          ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
          resolve(canvas.toDataURL('image/png'));
        }catch{resolve('')}
        URL.revokeObjectURL(url);
      };
      img.onerror=()=>{URL.revokeObjectURL(url);resolve('')};
      img.src=url;
    }catch{resolve('')}
  });
  return logoPromise;
}

function n(v){return Number(v||0)}
function total(lines=[]){return lines.reduce((s,l)=>s+n(l.qty)*n(l.sell),0)}
function money(v){return `€${n(v).toFixed(2)}`}
function cleanText(v){return String(v??'').replace(/\s+\*\s+/g,'\n').trim()}
function safeName(v){return String(v||'Client').replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,48)||'Client'}
function dateLabel(v){
  if(!v)return'';
  try{return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T12:00:00`))}catch{return String(v)}
}
function refFor(q){
  const year=String(q?.date||M.today()).slice(0,4)||String(new Date().getFullYear());
  const tail=String(q?.id||'').replace(/[^a-z0-9]/gi,'').slice(-5).toUpperCase()||'QUOTE';
  return `DB-${year}-${tail}`;
}
async function clientFor(q){
  const clients=await M.clients();
  return clients.find(c=>c.id===q.clientId)||{};
}
async function businessName(){return await M.setting('tradeName','DB Plumbing Services')||'DB Plumbing Services'}

function split(doc,text,width){return doc.splitTextToSize(String(text||''),width)}
function addPageHeader(doc,brand,ref){
  doc.setFillColor(15,38,56);doc.rect(0,0,210,9,'F');
  doc.setDrawColor(11,135,201);doc.setLineWidth(1.2);doc.line(18,26,192,26);
  doc.setTextColor(16,42,67);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(brand,18,18);
  doc.setTextColor(100,116,139);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(`Quotation ${ref}`,192,18,{align:'right'});
}
function addFooter(doc,page,totalPages){
  doc.setDrawColor(216,226,232);doc.setLineWidth(.35);doc.line(18,280,192,280);
  doc.setFont('helvetica','normal');doc.setFontSize(7.8);doc.setTextColor(71,85,105);
  doc.text(`Dennis Bendinelli · DB Plumbing Services · ${PHONE} · ${EMAIL}`,18,286);
  doc.text(`Page ${page} of ${totalPages}`,192,286,{align:'right'});
}

async function buildPdf(q){
  const JS=await ensurePdfLib();
  const [c,brand,logo]=await Promise.all([clientFor(q),businessName(),loadLogoData()]);
  const doc=new JS({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const ref=refFor(q),sum=total(q.lines||[]);
  const margin=18,right=192,width=174;
  let y=18;

  doc.setFillColor(15,38,56);doc.rect(0,0,210,10,'F');
  if(logo){try{doc.addImage(logo,'PNG',18,17,31,14,undefined,'FAST')}catch{}}
  doc.setTextColor(16,42,67);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(brand,55,20.5);
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(100,116,139);doc.text('Professional Plumbing & Property Maintenance · Malta',55,26);
  doc.setFontSize(8);doc.text(`${PHONE}  ·  ${EMAIL}`,55,31.5);
  doc.setDrawColor(11,135,201);doc.setLineWidth(1.1);doc.line(margin,38,right,38);

  doc.setTextColor(16,42,67);doc.setFont('helvetica','bold');doc.setFontSize(24);doc.text('QUOTATION',margin,52);
  doc.setFontSize(8);doc.setTextColor(100,116,139);doc.setFont('helvetica','bold');doc.text('REFERENCE',right,47,{align:'right'});
  doc.setFont('helvetica','normal');doc.setTextColor(16,42,67);doc.setFontSize(10);doc.text(ref,right,52,{align:'right'});
  doc.setFontSize(8);doc.setTextColor(100,116,139);doc.text(dateLabel(q.date||M.today()),right,57,{align:'right'});

  y=66;
  doc.setFillColor(247,250,252);doc.roundedRect(margin,y,width,28,3,3,'F');
  doc.setFont('helvetica','bold');doc.setTextColor(11,109,156);doc.setFontSize(7.8);doc.text('PREPARED FOR',margin+5,y+7);
  doc.setTextColor(16,42,67);doc.setFontSize(11.5);doc.text(String(c.name||'Client'),margin+5,y+14);
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(71,85,105);
  const clientSub=[q.location||c.location||'',c.phone||'',c.email||''].filter(Boolean).join(' · ');
  if(clientSub)doc.text(split(doc,clientSub,width-10),margin+5,y+20,{maxWidth:width-10});

  y+=38;
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(11,109,156);doc.text('SCOPE OF WORK',margin,y);
  doc.setFontSize(14);doc.setTextColor(16,42,67);doc.text(split(doc,q.title||'Quotation',width),margin,y+7);
  y+=18;

  const rows=(q.lines||[]).filter(l=>cleanText(l.description)||n(l.sell));
  const descX=margin,qtyX=148,unitX=166,amountX=right;
  const drawTableHeader=()=>{
    doc.setFillColor(15,38,56);doc.roundedRect(margin,y,width,9,2,2,'F');
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7.6);
    doc.text('DESCRIPTION',descX+3,y+5.8);doc.text('QTY',qtyX,y+5.8,{align:'center'});doc.text('UNIT',unitX,y+5.8,{align:'right'});doc.text('TOTAL',amountX-3,y+5.8,{align:'right'});
    y+=11;
  };
  const newPage=()=>{doc.addPage();y=32;addPageHeader(doc,brand,ref);drawTableHeader()};
  drawTableHeader();

  for(const l of rows){
    const desc=cleanText(l.description||'Item');
    const lines=split(doc,desc,105);
    const h=Math.max(12,lines.length*4.2+6);
    if(y+h>255)newPage();
    doc.setDrawColor(231,237,241);doc.setLineWidth(.25);doc.line(margin,y+h,right,y+h);
    doc.setTextColor(16,42,67);doc.setFont('helvetica','normal');doc.setFontSize(9.2);doc.text(lines,descX+2,y+5);
    doc.setFontSize(8.6);doc.setTextColor(71,85,105);doc.text(String(n(l.qty)||1),qtyX,y+5,{align:'center'});
    doc.text(money(l.sell),unitX,y+5,{align:'right'});
    doc.setFont('helvetica','bold');doc.setTextColor(16,42,67);doc.text(money(n(l.qty)*n(l.sell)),amountX-3,y+5,{align:'right'});
    y+=h;
  }

  if(y+36>258){doc.addPage();y=32;addPageHeader(doc,brand,ref)}
  y+=8;
  doc.setDrawColor(16,42,67);doc.setLineWidth(.7);doc.line(120,y,right,y);
  y+=8;
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(71,85,105);doc.text('Quotation total',120,y);
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(16,42,67);doc.text(money(sum),right,y,{align:'right'});

  if(q.notes){
    y+=14;
    const notes=split(doc,cleanText(q.notes),width);
    const h=notes.length*4.2+10;
    if(y+h>263){doc.addPage();y=32;addPageHeader(doc,brand,ref)}
    doc.setFillColor(247,250,252);doc.roundedRect(margin,y,width,h,2.5,2.5,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7.8);doc.setTextColor(11,109,156);doc.text('NOTES',margin+4,y+6);
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(71,85,105);doc.text(notes,margin+4,y+12);
    y+=h;
  }

  if(y+34>264){doc.addPage();y=32;addPageHeader(doc,brand,ref)}
  y+=12;
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(16,42,67);doc.text('Quotation terms',margin,y);
  doc.setFont('helvetica','normal');doc.setFontSize(7.8);doc.setTextColor(71,85,105);
  const terms='This quotation covers the work and materials described above. Any additional work or materials will be discussed and agreed before proceeding.';
  doc.text(split(doc,terms,width),margin,y+5);
  doc.text(`DB Plumbing Services · ${PHONE} · ${EMAIL} · ${WEBSITE}`,margin,y+15);

  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);addFooter(doc,i,pages)}
  return {doc,ref,client:c,filename:`DB_Plumbing_Quotation_${ref}_${safeName(c.name)}.pdf`};
}

async function openPdf(q){
  const popup=window.open('about:blank','_blank');
  if(!popup){alert('Safari ha bloccato la finestra. Consenti il popup e riprova.');return}
  try{
    popup.document.write('<title>Preparing PDF…</title><p style="font-family:-apple-system;padding:24px">Preparing quotation PDF…</p>');
    const out=await buildPdf(q);
    const url=URL.createObjectURL(out.doc.output('blob'));
    popup.location.href=url;
    setTimeout(()=>URL.revokeObjectURL(url),120000);
  }catch(e){try{popup.close()}catch{};throw e}
}

async function sharePdf(q){
  const out=await buildPdf(q);
  const blob=out.doc.output('blob');
  const file=new File([blob],out.filename,{type:'application/pdf'});
  const text=`DB Plumbing Services — ${q.title||'Quotation'} — ${money(total(q.lines||[]))}`;
  if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
    try{
      await navigator.share({title:`DB Plumbing Services — Quotation ${out.ref}`,text,files:[file]});
      await markSent(q);
      toast('PDF condiviso. Preventivo segnato come Inviato.');
      return;
    }catch(e){
      if(e?.name==='AbortError')return;
      console.warn('Native PDF share failed',e);
    }
  }
  out.doc.save(out.filename);
  toast('PDF creato. Aprilo da Download e condividilo come allegato.');
}

async function markSent(q){
  if(q.status!=='quote')return;
  q.status='quote_sent';
  q.quoteSentAt=new Date().toISOString();
  await M.mPut('jobs',q);
  await baseRenderQuotes();
  await decorate();
}

function toast(msg){
  document.querySelector('.dbm-qpdf-toast')?.remove();
  const d=document.createElement('div');d.className='dbm-qpdf-toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),3200);
}

wait();
})();
