// Cache dei file dell'app: dopo la prima apertura funziona anche senza internet.
// Cambia la versione quando modifichi i file, così il telefono scarica l'aggiornamento.
const CACHE = 'note-v2';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'sync.js', 'firebase-config.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Prima la rete (per avere sempre l'ultima versione), poi la cache se sei offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Solo i file dell'app e le librerie Firebase: il traffico di Firestore va lasciato passare.
  const url = new URL(e.request.url);
  if (url.origin !== location.origin && url.hostname !== 'www.gstatic.com') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
