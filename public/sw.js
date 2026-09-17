const LEGACY_CACHE="lumen-premium-beta-v4";

self.addEventListener("install",event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    await caches.delete(LEGACY_CACHE);
    await self.registration.unregister();
  })());
});
