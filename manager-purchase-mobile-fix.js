(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
@media(max-width:767px){
  #dbmPurchaseDialog input,#dbmPurchaseDialog select,#dbmPurchaseDialog textarea{font-size:16px!important}
  #dbmPurchaseDialog .dbm-line,#dbmPurchaseDialog .dbm-line-top,#dbmPurchaseDialog .dbm-line-grid{min-width:0}
  #dbmPurchaseDialog .dbm-line input,#dbmPurchaseDialog .dbm-line select{min-width:0;width:100%;max-width:100%;box-sizing:border-box}
  #dbmPurchaseDialog{overflow-x:hidden}
}
`;
document.head.appendChild(style);
})();
