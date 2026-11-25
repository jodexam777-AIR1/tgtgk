/* TGT GK अभ्यास — offline cache (JOD 2028 jaisa). Pehle net (naya maal), net na ho to cache. Naya release = C ka number badlo. */
const C='tgtgk-v15';
const FILES=['./','./index.html','./manifest.webmanifest','./data/avatars.js','./data/chapters_bundle.js','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!=='tgtgk-kitab').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url); if(u.origin!==location.origin) return;
  if(u.pathname.indexOf('/kitab/')>=0){ /* KITAB_V1: kitab photo — ek baar khuli to hamesha phone me (version badalne par bhi) */
    e.respondWith(caches.open('tgtgk-kitab').then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;}))));
    return; }
  const page=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
  const key=page?'./index.html':r;
  e.respondWith(new Promise(resolve=>{
    let done=false;
    const fromCache=()=>caches.match(key).then(m=>m||(page?caches.match('./'):undefined));
    const t=setTimeout(()=>{fromCache().then(m=>{if(m&&!done){done=true;resolve(m)}})},3500);
    fetch(r).then(res=>{clearTimeout(t); if(res&&res.ok){const cp=res.clone(); caches.open(C).then(c=>c.put(key,cp))} if(!done){done=true;resolve(res)}})
      .catch(()=>{clearTimeout(t); fromCache().then(m=>{if(!done){done=true;resolve(m||Response.error())}})});
  }));
});
