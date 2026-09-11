(()=>{
'use strict';
const KEY='jobScheduleV1';
let M,baseOpenJob,baseOpenQuote,basePut,baseRefreshHome,baseShow,schedules={};
const wait=()=>{M=window.DBM;const form=document.getElementById('dbmJobForm'),dash=document.getElementById('dashboard');if(!M?.mPut||!M?.setting||!M?.lPut||!M?.openJob||!form||!dash)return setTimeout(wait,100);init(form,dash)};
async function load(){const raw=await M.setting(KEY,'');try{schedules=raw?JSON.parse(raw):{};if(!schedules||Array.isArray(schedules)||typeof schedules!=='object')schedules={}}catch{schedules={}}}
const persist=()=>M.lPut('settings',{key:KEY,value:JSON.stringify(schedules)});
function init(form,dash){
 if(M.__agendaReady)return;M.__agendaReady=true;
 injectStyles();injectScheduleFields(form);injectDashboard(dash);
 basePut=M.mPut.bind(M);M.mPut=async(store,val)=>{const out=await basePut(store,val);if(store==='jobs'&&val?.id&&document.getElementById('dbmJobDialog')?.open&&!String(val.status||'').startsWith('quote')){const date=document.getElementById('dbmWorkDate')?.value||'',time=document.getElementById('dbmWorkTime')?.value||'';await load();if(date||time)schedules[val.id]={date,time};else delete schedules[val.id];await persist()}return out};
 baseOpenJob=M.openJob.bind(M);M.openJob=async id=>{await baseOpenJob(id);await applySchedule(id||document.getElementById('dbmJobId')?.value||'');showSchedule(true)};
 if(M.openQuote){baseOpenQuote=M.openQuote.bind(M);M.openQuote=async id=>{await baseOpenQuote(id);showSchedule(false)}}
 baseRefreshHome=M.refreshHome.bind(M);M.refreshHome=async()=>{await baseRefreshHome();await renderAgenda()};
 baseShow=M.show.bind(M);M.show=v=>{const r=baseShow(v);if(v==='dashboard')setTimeout(renderAgenda,0);return r};
 document.getElementById('dbmJobDialog')?.addEventListener('close',()=>setTimeout(renderAgenda,0));
 load().then(renderAgenda);
}
function injectStyles(){const s=document.createElement('style');s.textContent=`
#dbmAgendaPanel{margin:12px 0}.dbm-agenda-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.dbm-agenda-head h2{margin:0}.dbm-agenda-sub{font-size:11px;color:#64748b;margin-top:3px}.dbm-agenda-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:11px}.dbm-agenda-stat{border:1px solid #dce6ee;border-radius:13px;background:#fff;padding:10px}.dbm-agenda-stat span{display:block;font-size:9.5px;color:#64748b}.dbm-agenda-stat b{display:block;font-size:17px;margin-top:3px}.dbm-agenda-section{margin-top:12px}.dbm-agenda-section-title{font-size:11px;font-weight:850;color:#0b1f35;margin-bottom:6px}.dbm-agenda-list{display:grid;gap:7px}.dbm-agenda-row{width:100%;display:grid;grid-template-columns:74px minmax(0,1fr) auto;gap:9px;align-items:center;border:1px solid #dce6ee;background:#f8fbfd;border-radius:12px;padding:9px;text-align:left;color:#0b1f35}.dbm-agenda-date{font-size:10px;font-weight:850;color:#087bc1}.dbm-agenda-row b{font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dbm-agenda-row small{display:block;color:#64748b;font-size:9.5px;margin-top:2px}.dbm-agenda-money{font-size:10.5px;font-weight:800;white-space:nowrap}.dbm-agenda-empty{font-size:11px;color:#64748b;padding:8px 0}.dbm-schedule-fields{margin-top:4px}@media(max-width:430px){.dbm-agenda-row{grid-template-columns:66px minmax(0,1fr) auto}.dbm-schedule-fields input{font-size:17px!important}}
`;document.head.appendChild(s)}
function injectScheduleFields(form){if(document.getElementById('dbmScheduleFields'))return;const loc=document.getElementById('dbmJobLocation')?.closest('label');if(!loc)return;loc.insertAdjacentHTML('afterend',`<div id="dbmScheduleFields" class="two-cols dbm-schedule-fields"><label>Data intervento<input id="dbmWorkDate" type="date"></label><label>Ora<input id="dbmWorkTime" type="time"></label></div>`)}
function injectDashboard(dash){if(document.getElementById('dbmAgendaPanel'))return;const actions=dash.querySelector('.dbm-home-actions'),cards=dash.querySelector('.cards');const panel=document.createElement('section');panel.id='dbmAgendaPanel';panel.className='panel';panel.innerHTML=`<div class="dbm-agenda-head"><div><h2>Da fare</h2><div class="dbm-agenda-sub">Solo ciò che richiede una tua decisione o programmazione.</div></div></div><div id="dbmAgendaStats" class="dbm-agenda-stats"></div><div id="dbmAgendaList" class="dbm-agenda-list"></div>`;(actions||cards)?.insertAdjacentElement('afterend',panel)}
function showSchedule(show){const f=document.getElementById('dbmScheduleFields');if(f)f.style.display=show?'grid':'none'}
async function applySchedule(id){await load();const x=schedules[id]||{};const d=document.getElementById('dbmWorkDate'),t=document.getElementById('dbmWorkTime');if(d)d.value=x.date||'';if(t)t.value=x.time||''}
const total=j=>(j.lines||[]).reduce((s,l)=>s+M.n(l.qty)*M.n(l.sell),0);
const received=e=>{if(typeof M.receivedAmount==='function')return M.n(M.receivedAmount(e));if(Array.isArray(e?.payments)&&e.payments.length)return Math.min(M.n(e.amount),e.payments.reduce((s,p)=>s+M.n(p.amount),0));if(e?.paidAmount!=null&&e.paidAmount!=='')return Math.min(M.n(e.amount),M.n(e.paidAmount));return e?.paid==='paid'?M.n(e.amount):0};
const outstanding=e=>Math.max(0,M.n(e?.amount)-received(e));
const shortDate=s=>{if(!s)return '—';const [y,m,d]=s.split('-');return `${d}/${m}`};
const isoLocal=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const endOfWeek=()=>{const d=new Date(),day=d.getDay()||7;d.setDate(d.getDate()+(7-day));return isoLocal(d)};
function row(j,clients,label=''){const s=schedules[j.id]||{},cl=clients[j.clientId];return `<button type="button" class="dbm-agenda-row" data-agenda-job="${M.esc(j.id)}"><div class="dbm-agenda-date">${label||shortDate(s.date)}${s.time?'<br>'+M.esc(s.time):''}</div><div><b>${M.esc(j.title||'Intervento')}</b><small>${M.esc(cl?.name||'Nessun cliente')}${j.location?' · '+M.esc(j.location):''}</small></div><div class="dbm-agenda-money">${M.money(total(j))}</div></button>`}
async function renderAgenda(){
 const stats=document.getElementById('dbmAgendaStats'),list=document.getElementById('dbmAgendaList');if(!stats||!list)return;await load();
 const jobs=await M.mAll('jobs'),entries=await M.entries(),clients=Object.fromEntries((await M.clients()).map(c=>[c.id,c]));
 const drafts=jobs.filter(j=>j.status==='quote').length,acceptedOpen=jobs.filter(j=>j.status==='quote_accepted'&&!j.convertedJobId).length,unscheduledJobs=jobs.filter(j=>j.status==='scheduled'&&!schedules[j.id]?.date).length,unpaid=entries.filter(e=>e.type==='income'&&outstanding(e)>0.005);
 const unpaidTotal=unpaid.reduce((s,e)=>s+outstanding(e),0);const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);const cut=isoLocal(cutoff),overdue=unpaid.filter(e=>e.date&&e.date<cut).reduce((s,e)=>s+outstanding(e),0);
 const today=isoLocal(new Date()),weekEnd=endOfWeek();const weekJobs=jobs.filter(j=>!String(j.status||'').startsWith('quote')&&j.status!=='completed'&&schedules[j.id]?.date>=today&&schedules[j.id]?.date<=weekEnd);
 stats.innerHTML=`<div class="dbm-agenda-stat"><span>PREVENTIVI DA INVIARE</span><b>${drafts}</b></div><div class="dbm-agenda-stat"><span>DA PROGRAMMARE</span><b>${acceptedOpen+unscheduledJobs}</b></div><div class="dbm-agenda-stat"><span>LAVORI QUESTA SETTIMANA</span><b>${weekJobs.length}</b></div><div class="dbm-agenda-stat"><span>DA INCASSARE</span><b>${M.money(unpaidTotal)}</b>${overdue?`<span>oltre 7 gg: ${M.money(overdue)}</span>`:''}</div>`;
 const scheduled=jobs.filter(j=>!String(j.status||'').startsWith('quote')&&j.status!=='completed'&&schedules[j.id]?.date).sort((a,b)=>{const A=schedules[a.id],B=schedules[b.id];return `${A.date}T${A.time||'99:99'}`.localeCompare(`${B.date}T${B.time||'99:99'}`)});
 const todayJobs=scheduled.filter(j=>schedules[j.id].date===today),laterWeek=scheduled.filter(j=>schedules[j.id].date>today&&schedules[j.id].date<=weekEnd),unscheduled=jobs.filter(j=>j.status==='scheduled'&&!schedules[j.id]?.date);
 let html='';if(todayJobs.length)html+=`<div class="dbm-agenda-section"><div class="dbm-agenda-section-title">Oggi</div>${todayJobs.map(j=>row(j,clients,'OGGI')).join('')}</div>`;if(laterWeek.length)html+=`<div class="dbm-agenda-section"><div class="dbm-agenda-section-title">Questa settimana</div>${laterWeek.slice(0,5).map(j=>row(j,clients)).join('')}</div>`;if(unscheduled.length)html+=`<div class="dbm-agenda-section"><div class="dbm-agenda-section-title">Da programmare</div>${unscheduled.slice(0,5).map(j=>row(j,clients,'SENZA DATA')).join('')}</div>`;
 if(!html)html='<div class="dbm-agenda-empty">Nessun lavoro urgente da programmare. Le manutenzioni in scadenza compariranno qui sotto.</div>';list.innerHTML=html;list.querySelectorAll('[data-agenda-job]').forEach(b=>b.onclick=()=>M.openJob(b.dataset.agendaJob));
}
wait();
})();
