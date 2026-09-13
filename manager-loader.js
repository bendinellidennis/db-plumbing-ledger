(()=>{
'use strict';
let started=false;
const files=['manager-jobs.js','manager-job-client-add.js','manager-properties.js','manager-materials.js','manager-import.js','manager-photos.js','manager-search.js','manager-purchase-search.js','manager-purchase-mobile-fix.js','manager-office.js','manager-pricelists.js','manager-smart.js','manager-workflow.js?v=85','manager-quotes-nav.js?v=85','manager-agenda.js','manager-agenda-pro.js?v=78','manager-agenda-client-add.js?v=79','manager-agenda-day-polish.js?v=80','manager-agenda-notebook.js?v=81','manager-agenda-notifications-v82.js?v=82','manager-agenda-webpush-v83.js?v=83','manager-maintenance.js','manager-statistics.js','manager-job-costs.js','manager-reconcile.js','manager-job-purchases.js','manager-leads.js','manager-lead-greeting-fix.js','manager-lead-mobile-fix.js','manager-lead-email-source.js','manager-payments.js','manager-price-intelligence.js','manager-job-dossier.js','manager-warranty-returns.js','manager-material-priority.js','manager-client-commercial.js','manager-property-commercial-refresh-v88.js?v=88','manager-partners-v87.js?v=87','manager-marketing.js','manager-job-marketing-engine-v103.js?v=103','manager-reviews.js?v=61','manager-assets.js?v=62','manager-assets-gallery-fix.js?v=63','manager-asset-qr-v90.js?v=90','manager-vision-v105.js?v=105','manager-field-voice.js?v=64','manager-ceo-actions.js?v=65','manager-quote-cleanup.js?v=66','manager-interactive-quotes-v84.js?v=85','manager-service-reports.js?v=67','manager-service-report-save-confirm.js?v=71','manager-service-report-gmail.js?v=75','manager-service-report-attachments-v76.js?v=76','manager-service-report-pdf-nav.js?v=77','manager-job-marketing-list-v104.js?v=104'];
const load=async list=>{for(const src of list)await new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s)})};
const wait=()=>{
  if(started)return;
  if(!(window.DBM?.db&&document.getElementById('jobsV2'))){setTimeout(wait,50);return}
  started=true;
  window.__DBM_MAIN_LOADER_READY__=false;
  window.__DBM_MAIN_LOADER_PROMISE__=(async()=>{
    await load(files);
    window.__DBM_MAIN_LOADER_READY__=true;
    window.dispatchEvent(new Event('dbm-main-loader-ready'));
  })().catch(err=>{console.error('DB Manager main loader',err);throw err});
};
wait();
})();
