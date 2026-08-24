self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('fetch',(e)=>{
  if(e.request.url.match(/icon/)) return;
  e.respondWith(fetch(e.request).catch(()=>new Response('Offline',{status:503})));
});