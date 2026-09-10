(()=>{
'use strict';
if(!window.matchMedia('(max-width:767px)').matches)return;
const style=document.createElement('style');
style.textContent=`
#dbmPurchaseDialog{width:min(calc(100vw - 16px),560px)!important;max-width:calc(100vw - 16px)!important;overflow-x:hidden!important}
#dbmPurchaseDialog form{overflow-x:hidden!important}
#dbmPurchaseDialog input,#dbmPurchaseDialog select,#dbmPurchaseDialog textarea{font-size:17px!important;line-height:1.25!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;touch-action:manipulation}
#dbmPurchaseDialog .two-cols,#dbmPurchaseDialog .dbm-line,#dbmPurchaseDialog .dbm-line-top,#dbmPurchaseDialog .dbm-line-grid{min-width:0!important;max-width:100%!important;width:100%!important}
#dbmPurchaseDialog .dbm-line-top{grid-template-columns:minmax(92px,32%) minmax(0,1fr) 42px!important}
#dbmPurchaseDialog .dbm-line-grid{grid-template-columns:minmax(60px,.7fr) minmax(0,1fr) minmax(0,1fr)!important}
`;
document.head.appendChild(style);
const meta=document.querySelector('meta[name="viewport"]');
if(!meta)return;
const normal=meta.getAttribute('content')||'width=device-width, initial-scale=1, viewport-fit=cover';
const locked='width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
const selector='#dbmPurchaseDialog input,#dbmPurchaseDialog select,#dbmPurchaseDialog textarea';
const lock=e=>{if(e.target?.matches?.(selector))meta.setAttribute('content',locked)};
document.addEventListener('pointerdown',lock,true);
document.addEventListener('touchstart',lock,{capture:true,passive:true});
document.addEventListener('focusin',lock,true);
document.addEventListener('focusout',()=>setTimeout(()=>{if(!document.activeElement?.matches?.(selector))meta.setAttribute('content',normal)},350),true);
})();
