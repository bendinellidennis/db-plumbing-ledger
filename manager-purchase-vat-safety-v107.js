(()=>{
'use strict';
const M=window.DBM;
if(!M)return;
const $=id=>document.getElementById(id);
function inject(){
  const form=$('dbmPurchaseForm');
  const supplier=$('dbmPurchaseSupplier');
  if(!form||!supplier||$('dbmPurchaseSupplierVat'))return;
  const label=supplier.closest('label');
  if(!label)return;
  label.insertAdjacentHTML('afterend',`<label>VAT / Registration fornitore <span class="micro">es. MT 1234-5678</span><input id="dbmPurchaseSupplierVat" inputmode="text" autocomplete="off" placeholder="MT 1234-5678"></label>`);
  const oldOpen=M.openPurchase;
  if(typeof oldOpen==='function'&&!M.__purchaseVatOpenWrappedV107){
    M.__purchaseVatOpenWrappedV107=true;
    M.openPurchase=function(...args){
      const r=oldOpen.apply(this,args);
      const el=$('dbmPurchaseSupplierVat');
      if(el)el.value='';
      return r;
    };
  }
  if(!M.__purchaseVatPutWrappedV107){
    M.__purchaseVatPutWrappedV107=true;
    const oldPut=M.lPut.bind(M);
    M.lPut=async function(store,value){
      if(store==='entries'&&value&&value.source==='dbm-purchase'){
        const vatNo=($('dbmPurchaseSupplierVat')?.value||'').trim();
        value={...value,supplierVat:vatNo};
      }
      return oldPut(store,value);
    };
  }
}
const wait=()=>{if($('dbmPurchaseForm')&&$('dbmPurchaseSupplier'))inject();else setTimeout(wait,100)};
wait();
})();