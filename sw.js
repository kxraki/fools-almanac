/* The Fool's Almanac — service worker.
   Bump VERSION whenever you change any file below, or browsers will serve the old one. */
const VERSION="almanac-v1";
const IMGCACHE="almanac-img-v1";
const CORE=["./","index.html","styles.css","data.js","app.js","manifest.json","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/apple-touch-icon.png","icons/favicon.png","thumb/cups1.webp","thumb/cups10.webp","thumb/cups2.webp","thumb/cups3.webp","thumb/cups4.webp","thumb/cups5.webp","thumb/cups6.webp","thumb/cups7.webp","thumb/cups8.webp","thumb/cups9.webp","thumb/cupsking.webp","thumb/cupsknight.webp","thumb/cupspage.webp","thumb/cupsqueen.webp","thumb/m0.webp","thumb/m1.webp","thumb/m10.webp","thumb/m11.webp","thumb/m12.webp","thumb/m13.webp","thumb/m14.webp","thumb/m15.webp","thumb/m16.webp","thumb/m17.webp","thumb/m18.webp","thumb/m19.webp","thumb/m2.webp","thumb/m20.webp","thumb/m21.webp","thumb/m3.webp","thumb/m4.webp","thumb/m5.webp","thumb/m6.webp","thumb/m7.webp","thumb/m8.webp","thumb/m9.webp","thumb/pentacles1.webp","thumb/pentacles10.webp","thumb/pentacles2.webp","thumb/pentacles3.webp","thumb/pentacles4.webp","thumb/pentacles5.webp","thumb/pentacles6.webp","thumb/pentacles7.webp","thumb/pentacles8.webp","thumb/pentacles9.webp","thumb/pentaclesking.webp","thumb/pentaclesknight.webp","thumb/pentaclespage.webp","thumb/pentaclesqueen.webp","thumb/swords1.webp","thumb/swords10.webp","thumb/swords2.webp","thumb/swords3.webp","thumb/swords4.webp","thumb/swords5.webp","thumb/swords6.webp","thumb/swords7.webp","thumb/swords8.webp","thumb/swords9.webp","thumb/swordsking.webp","thumb/swordsknight.webp","thumb/swordspage.webp","thumb/swordsqueen.webp","thumb/wands1.webp","thumb/wands10.webp","thumb/wands2.webp","thumb/wands3.webp","thumb/wands4.webp","thumb/wands5.webp","thumb/wands6.webp","thumb/wands7.webp","thumb/wands8.webp","thumb/wands9.webp","thumb/wandsking.webp","thumb/wandsknight.webp","thumb/wandspage.webp","thumb/wandsqueen.webp"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==VERSION&&k!==IMGCACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  e.respondWith((async()=>{
    const hit=await caches.match(req,{ignoreSearch:true});
    if(hit)return hit;
    try{
      const res=await fetch(req);
      if(res.ok&&url.pathname.indexOf("/img/")>-1){
        const c=await caches.open(IMGCACHE); c.put(req,res.clone());
      }
      return res;
    }catch(err){
      if(req.mode==="navigate")return caches.match("index.html");
      return new Response("",{status:504,statusText:"Offline"});
    }
  })());
});
