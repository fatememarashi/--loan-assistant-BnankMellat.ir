// sw.js
const CACHE_VERSION = "bankyar-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : null))
        )
      )
  );
  self.clients.claim();
});

const isHTML = (req) =>
  req.headers.get("accept")?.includes("text/html") ||
  new URL(req.url).pathname.endsWith("/") ||
  new URL(req.url).pathname.endsWith(".html");

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (isHTML(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSION);
          return (await cache.match(req)) || cache.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
