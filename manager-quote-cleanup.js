(()=>{
'use strict';
let M,baseOpenJob,baseOpenQuote;
const wait=()=>{M=window.DBM;const dlg=document.getElementById('dbmJobDialog');if(!M?.openJob||!M?.openQuote||!dlg)return setTimeout(wait,120);init(dlg)};
function styles(){if(document.getElementById('dbmQuoteCleanupStyle'))return;const s=document.createElement('style');s.id='dbmQuoteCleanupStyle';s.textContent=`
#dbmJobDialog.dbm-quote-mode #dbmScheduleFields,
#dbmJobDialog.dbm-quote-mode #dbmPaymentsSection,
#dbmJobDialog.dbm-quote-mode #dbmLinkedPurchases,
#dbmJobDialog.dbm-quote-mode #dbmJobDossier,
#dbmJobDialog.dbm-quote-mode #dbmWarrantyReturns,
#dbmJobDialog.dbm-quote-mode #dbmRealCostFields,
#dbmJobDialog.dbm-quote-mode #dbmJobReview{display:none!important}
`;document.head.appendChild(s)}
function setMode(dlg,quote){dlg.classList.toggle('dbm-quote-mode',!!quote)}
function init(dlg){if(M.__quoteCleanupReady)return;M.__quoteCleanupReady=true;styles();baseOpenJob=M.openJob.bind(M);baseOpenQuote=M.openQuote.bind(M);M.openJob=async(...args)=>{const r=await baseOpenJob(...args);setMode(dlg,false);return r};M.openQuote=async(...args)=>{const r=await baseOpenQuote(...args);setMode(dlg,true);return r};dlg.addEventListener('close',()=>setMode(dlg,false))}
wait();
})();
