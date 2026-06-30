// Service Worker for 我的知识库 PWA
// Bump CACHE_VERSION whenever you change index.html / manifest / icon to force an update.
var CACHE_VERSION = "kb-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

// Install: pre-cache the app shell.
self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){ return self.skipWaiting(); })
  );
});

// Activate: drop old caches from previous versions.
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE_VERSION){ return caches.delete(k); }
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Fetch strategy:
//  - Only handle same-origin GET (never cache the 智谱 API or other cross-origin calls).
//  - Network-first for the HTML document (so you get updates when online),
//    falling back to cache when offline.
//  - Cache-first for the other static assets.
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET"){ return; }
  var url = new URL(req.url);
  if(url.origin !== self.location.origin){ return; }  // let API/cross-origin pass through untouched

  if(req.mode === "navigate" || req.destination === "document"){
    e.respondWith(
      fetch(req).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE_VERSION).then(function(c){ c.put("./index.html", copy); });
        return resp;
      }).catch(function(){
        return caches.match("./index.html").then(function(r){ return r || caches.match("./"); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE_VERSION).then(function(c){ c.put(req, copy); });
        return resp;
      });
    })
  );
});
