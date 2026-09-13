import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const PROJECT_ORIGIN='https://bendinellidennis.github.io';
const OWNER_TOKEN_HASH='a2ffb96a15f0123f5d34ca4fbf36e45322472e9533139cfc3ec95528977d5f67';
const VAPID_SUBJECT='mailto:dbplumbingservicesmalta@gmail.com';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_ROLE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const db=createClient(SUPABASE_URL,SERVICE_ROLE,{auth:{persistSession:false,autoRefreshToken:false}});

const cors={
  'Access-Control-Allow-Origin':PROJECT_ORIGIN,
  'Access-Control-Allow-Headers':'content-type, apikey, x-cron-secret',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json; charset=utf-8'
};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

async function sha256Hex(value){
  const data=new TextEncoder().encode(String(value||''));
  const hash=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function safeEq(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function authorized(token){return safeEq(await sha256Hex(token),OWNER_TOKEN_HASH)}
function randomSecret(){const a=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function ensureConfig(){
  const {data,error}=await db.from('agenda_push_config').select('*').eq('id',1).maybeSingle();
  if(error)throw error;
  if(data)return data;
  const keys=webpush.generateVAPIDKeys(),row={id:1,vapid_public_key:keys.publicKey,vapid_private_key:keys.privateKey,cron_secret:randomSecret(),updated_at:new Date().toISOString()};
  const ins=await db.from('agenda_push_config').insert(row).select('*').single();
  if(!ins.error)return ins.data;
  if(ins.error.code!=='23505')throw ins.error;
  const retry=await db.from('agenda_push_config').select('*').eq('id',1).single();
  if(retry.error)throw retry.error;return retry.data;
}
function setVapid(cfg){webpush.setVapidDetails(VAPID_SUBJECT,cfg.vapid_public_key,cfg.vapid_private_key)}
function validSubscription(s){return !!(s&&typeof s.endpoint==='string'&&s.endpoint.startsWith('https://')&&s.keys?.p256dh&&s.keys?.auth)}
async function register(installationId,subscription){
  if(!installationId||!validSubscription(subscription))throw new Error('invalid push subscription');
  const row={installation_id:String(installationId),endpoint:String(subscription.endpoint),subscription,active:true,last_seen:new Date().toISOString(),updated_at:new Date().toISOString()};
  const {error}=await db.from('agenda_push_devices').upsert(row,{onConflict:'installation_id'});if(error)throw error;
  return {ok:true};
}
async function sync(installationId,reminders){
  if(!installationId||!Array.isArray(reminders))throw new Error('invalid reminder sync');
  const id=String(installationId),now=Date.now();
  const existing=await db.from('agenda_push_reminders').select('reminder_key').eq('installation_id',id).not('sent_at','is',null);
  if(existing.error)throw existing.error;const sent=new Set((existing.data||[]).map(x=>x.reminder_key));
  const del=await db.from('agenda_push_reminders').delete().eq('installation_id',id).is('sent_at',null);if(del.error)throw del.error;
  const rows=[];
  for(const r of reminders.slice(0,200)){
    const t=Date.parse(r?.fireAt||'');if(!r?.key||!Number.isFinite(t)||t<now-15*60000||t>now+400*86400000||sent.has(String(r.key)))continue;
    rows.push({installation_id:id,reminder_key:String(r.key),fire_at:new Date(t).toISOString(),payload:r.payload&&typeof r.payload==='object'?r.payload:{},updated_at:new Date().toISOString()});
  }
  if(rows.length){const ins=await db.from('agenda_push_reminders').upsert(rows,{onConflict:'installation_id,reminder_key'});if(ins.error)throw ins.error}
  await db.from('agenda_push_devices').update({last_seen:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('installation_id',id);
  return {ok:true,count:rows.length};
}
async function status(installationId){
  if(!installationId)return {registered:false};
  const d=await db.from('agenda_push_devices').select('active').eq('installation_id',String(installationId)).maybeSingle();if(d.error)throw d.error;
  const r=await db.from('agenda_push_reminders').select('fire_at').eq('installation_id',String(installationId)).is('sent_at',null).gte('fire_at',new Date().toISOString()).order('fire_at',{ascending:true}).limit(1);if(r.error)throw r.error;
  return {registered:!!d.data?.active,nextFireAt:r.data?.[0]?.fire_at||null};
}
async function scheduleTest(installationId,delaySeconds){
  if(!installationId)throw new Error('missing installation id');
  const d=await db.from('agenda_push_devices').select('active').eq('installation_id',String(installationId)).maybeSingle();if(d.error)throw d.error;if(!d.data?.active)throw new Error('device not registered');
  const delay=Math.max(60,Math.min(300,Number(delaySeconds)||90)),key=`closed-test-${crypto.randomUUID()}`,fire=new Date(Date.now()+delay*1000).toISOString();
  const row={installation_id:String(installationId),reminder_key:key,fire_at:fire,payload:{title:'DB Plumbing Services',body:'Test push con app completamente chiusa ✓',tag:key,url:'./'},updated_at:new Date().toISOString()};
  const ins=await db.from('agenda_push_reminders').insert(row);if(ins.error)throw ins.error;return {ok:true,fireAt:fire};
}
async function dispatch(req){
  const cfg=await ensureConfig(),given=req.headers.get('x-cron-secret')||'';
  if(!safeEq(given,cfg.cron_secret))return json({error:'unauthorized cron'},401);
  setVapid(cfg);
  const now=Date.now(),from=new Date(now-15*60000).toISOString(),to=new Date(now).toISOString();
  const due=await db.from('agenda_push_reminders').select('installation_id,reminder_key,payload,fire_at').is('sent_at',null).gte('fire_at',from).lte('fire_at',to).order('fire_at',{ascending:true}).limit(50);
  if(due.error)throw due.error;
  const ids=[...new Set((due.data||[]).map(x=>x.installation_id))];let devices=[];
  if(ids.length){const d=await db.from('agenda_push_devices').select('installation_id,subscription,active').in('installation_id',ids).eq('active',true);if(d.error)throw d.error;devices=d.data||[]}
  const map=new Map(devices.map(x=>[x.installation_id,x]));let sent=0,failed=0;
  for(const r of due.data||[]){
    const device=map.get(r.installation_id);if(!device){failed++;continue}
    try{
      await webpush.sendNotification(device.subscription,JSON.stringify(r.payload||{}),{TTL:3600});
      const u=await db.from('agenda_push_reminders').update({sent_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('installation_id',r.installation_id).eq('reminder_key',r.reminder_key);if(u.error)throw u.error;sent++;
    }catch(e){
      const code=Number(e?.statusCode||e?.status||0);console.error('agenda push send',code,e?.message||e);failed++;
      if(code===404||code===410){await db.from('agenda_push_devices').update({active:false,updated_at:new Date().toISOString()}).eq('installation_id',r.installation_id);await db.from('agenda_push_reminders').update({sent_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('installation_id',r.installation_id).eq('reminder_key',r.reminder_key)}
    }
  }
  await db.from('agenda_push_reminders').delete().lt('sent_at',new Date(now-30*86400000).toISOString());
  await db.from('agenda_push_reminders').delete().is('sent_at',null).lt('fire_at',new Date(now-86400000).toISOString());
  return json({ok:true,due:(due.data||[]).length,sent,failed});
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return json({error:'method not allowed'},405);
  try{
    const body=await req.json().catch(()=>({})),action=String(body?.action||'');
    if(action==='dispatch')return dispatch(req);
    if(!await authorized(body?.token||''))return json({error:'unauthorized'},401);
    if(action==='config'){const cfg=await ensureConfig();return json({ok:true,publicKey:cfg.vapid_public_key})}
    if(action==='register')return json(await register(body.installationId,body.subscription));
    if(action==='sync')return json(await sync(body.installationId,body.reminders));
    if(action==='status')return json(await status(body.installationId));
    if(action==='schedule_test')return json(await scheduleTest(body.installationId,body.delaySeconds));
    return json({error:'unknown action'},400);
  }catch(e){console.error('agenda-push',e);return json({error:String(e?.message||e)},500)}
});
