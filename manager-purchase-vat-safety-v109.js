(()=>{
'use strict';
const M=window.DBM;
if(!M)return;
const $=id=>document.getElementById(id);
function inject(){
  const form=$('dbmPurchaseForm'), supplier=$('dbmPurchaseSupplier');
  if(!form||!supplier)return;
  const label=supplier.closest('label');
  if(!label)return;
  if(!$('dbmPurchaseSupplierVat')){
    label.insertAdjacentHTML('afterend',`<label>VAT / Registration fornitore <span class="micro">es. MT 1234-5678</span><input id="dbmPurchaseSupplierVat" inputmode="text" autocomplete="off" placeholder="MT 1234-5678"></label>`);
  }
  const supplierVatLabel=$('dbmPurchaseSupplierVat')?.closest('label')||label;
  if(!$('dbmPurchaseBuyerVat')){
    supplierVatLabel.insertAdjacentHTML('afterend',`<label>Tua VAT / Customer VAT <span class="micro">se stampata sulla ricevuta</span><input id="dbmPurchaseBuyerVat" inputmode="numeric" autocomplete="off" placeholder="12345678" maxlength="12"></label>`);
  }
  const oldOpen=M.openPurchase;
  if(typeof oldOpen==='function'&&!M.__purchaseVatOpenWrappedV109){
    M.__purchaseVatOpenWrappedV109=true;
    M.openPurchase=function(...args){
      const r=oldOpen.apply(this,args);
      const s=$('dbmPurchaseSupplierVat'),b=$('dbmPurchaseBuyerVat');
      if(s)s.value='';
      if(b)b.value='';
      return r;
    };
  }
  if(!M.__purchaseVatPutWrappedV109){
    M.__purchaseVatPutWrappedV109=true;
    const oldPut=M.lPut.bind(M);
    M.lPut=async function(store,value){
      if(store==='entries'&&value&&value.source==='dbm-purchase'){
        value={...value,
          supplierVat:($('dbmPurchaseSupplierVat')?.value||'').trim(),
          buyerVat:($('dbmPurchaseBuyerVat')?.value||'').replace(/\D/g,'').trim()
        };
      }
      return oldPut(store,value);
    };
  }
}
const wait=()=>{if($('dbmPurchaseForm')&&$('dbmPurchaseSupplier'))inject();else setTimeout(wait,100)};
wait();
})();