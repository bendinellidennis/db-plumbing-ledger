const CACHE='db-ledger-v11';
const ASSETS=['./','index.html','styles.css','refine.css','manager.css','premium.css','app.js','manager-safe-loader.js','manager-core.js','manager-loader.js','manager-jobs.js','manager-materials.js','manager-import.js','manager-photos.js','manager-search.js','manager-office.js','manager-smart.js','manifest.webmanifest','db-brand-mark.svg','app-icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request))));
