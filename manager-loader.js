(()=>{
'use strict';
let started=false;
const files=['manager-jobs.js','manager-job-client-add.js','manager-properties.js','manager-materials.js','manager-purchase-vat-safety-v109.js?v=109','manager-import.js','manager-photos.js','manager-search.js','manager-purchase-search.js','manager-purchase-mobile-fix.js','manager-office.js','manager-pricelists.js','manager-smart.js','manager-workflow.js?v=85','manager-quotes-nav.js?v=85','manager-agenda.js','manager-agenda-pro.js?v=78','manager-agenda-client-add.js?v=79','manager-agenda-day-polish.js?v=80','manager-agenda-notebook.js?v=81','manager-agenda-notifications-v82.js?v=82','manager-agenda-webpush-v83.js?v=83','manager-maintenance.js','manager-statistics.js','manager-job-costs.js','manager-reconcile.js','manager-job-purchases.js','manager-leads.js','manager-lead-greeting-fix.js','manager-lead-mobile-fix.js','manager-lead-email-source.js','manager-payments.js','manager-price-intelligence.js','manager-job-dossier.js','manager-warranty-returns.js','manager-material-priority.js','manager-client-commercial.js','manager-property-commercial-refresh-v88.js?v=88','manager-partners-v87.js?v=87','manager-marketing.js','manager-job-marketing-engine-v103.js?v=103','manager-reviews.js?v=61','manager-assets.js?v=62','manager-assets-gallery-fix.js?v=63','manager-asset-qr-v90.js?v=90','manager-vision-v105.js?v=105','manager-vision-receipts-v113.js?v=113','manager-field-voice.js?v=64','manager-ceo-actions.js?v=65','manager-quote-cleanup.js?v=66','manager-interactive-quotes-v84.js?v=85','manager-service-reports.js?v=67','manager-service-report-pricing-v116.js?v=116','manager-service-report-save-confirm.js?v=71','manager-service-report-gmail.js?v=75','manager-service-report-attachments-v76.js?v=76','manager-service-report-pdf-nav.js?v=77','manager-job-marketing-list-v104.js?v=104'];
const load=async list=>{for(const src of list)await new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s)})};
function installPaymentIntegrity(){
  const M=window.DBM;
  if(!M?.mPut||!M?.mOne||!M?.lOne||!M?.lPut||!M?.db||M.__paymentIntegrityV119)return;
  M.__paymentIntegrityV119=true;
  const wrappedPut=M.mPut.bind(M);
  const num=v=>Number(v||0);
  const totalOf=j=>(j?.lines||[]).reduce((s,l)=>s+num(l.qty)*num(l.sell),0);
  const received=a=>(Array.isArray(a)?a:[]).reduce((s,p)=>s+num(p.amount),0);
  const directJobPut=v=>new Promise((res,rej)=>{try{const r=M.db.transaction('jobs','readwrite').objectStore('jobs').put(v);r.onsuccess=()=>res(v);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});
  M.mPut=async(store,val)=>{
    if(store!=='jobs'||!val?.id)return wrappedPut(store,val);
    const requestedPaid=val.paid==='paid';
    const requestedTotal=totalOf(val);
    const isQuote=String(val.status||'').startsWith('quote');
    const out=await wrappedPut(store,val);
    if(isQuote||!requestedPaid||requestedTotal<=0)return out;
    const saved=await M.mOne('jobs',val.id);
    if(!saved)return out;
    const payments=Array.isArray(saved.payments)?saved.payments.map(p=>({...p})):[];
    const got=received(payments);
    if(got<requestedTotal-0.005){
      payments.push({id:M.uid(),kind:'balance',amount:Number((requestedTotal-got).toFixed(2)),date:'',method:'',note:'Saldo registrato da stato Pagato',createdAt:new Date().toISOString(),system:true});
    }
    const fixed={...saved,payments,paid:'paid'};
    val.payments=payments.map(p=>({...p}));
    val.paid='paid';
    await directJobPut(fixed);
    const eid=fixed.entryId||fixed.legacySourceEntryId;
    if(eid){
      const entry=await M.lOne('entries',eid);
      if(entry)await M.lPut('entries',{...entry,payments:payments.map(p=>({...p})),paidAmount:Number(requestedTotal.toFixed(2)),paid:'paid'});
    }
    return out;
  };
}
const wait=()=>{
  if(started)return;
  if(!(window.DBM?.db&&document.getElementById('jobsV2'))){setTimeout(wait,50);return}
  started=true;
  window.__DBM_MAIN_LOADER_READY__=false;
  window.__DBM_MAIN_LOADER_PROMISE__=(async()=>{
    await load(files);
    installPaymentIntegrity();
    window.__DBM_MAIN_LOADER_READY__=true;
    window.dispatchEvent(new Event('dbm-main-loader-ready'));
  })().catch(err=>{console.error('DB Manager main loader',err);throw err});
};
wait();
})();