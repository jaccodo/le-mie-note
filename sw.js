// Cache dei file dell'app: dopo la prima apertura funziona anche senza internet.
// Cambia la versione quando modifichi i file (e anche APP_VERSION in app.js), così il telefono scarica l'aggiornamento.
const CACHE = 'note-v20';
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

// Stesso database dell'app: "inbox" tiene quello che arriva da Condividi finché l'app non lo legge.
function inbox(item) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('jaccodo-file', 2);
    open.onupgradeneeded = () => ['files', 'inbox', 'keys'].forEach(name => {
      if (!open.result.objectStoreNames.contains(name)) open.result.createObjectStore(name);
    });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('inbox', 'readwrite');
      tx.objectStore('inbox').put(item, 'share');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}
// Condividi → Jaccodo: Android manda qui testo, link e file; li metto da parte e apro l'app.
async function receiveShare(request) {
  try {
    const form = await request.formData();
    const files = form.getAll('file').filter(f => f && f.size);
    await inbox({ title: form.get('title') || '', text: form.get('text') || '', url: form.get('url') || '', files, at: Date.now() });
  } catch {}
  return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
}

// Prima la rete (per avere sempre l'ultima versione), poi la cache se sei offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.origin === location.origin && url.searchParams.has('share-target')) {
    e.respondWith(receiveShare(e.request));
    return;
  }
  if (e.request.method !== 'GET') return;
  // Solo i file dell'app e le librerie Firebase: il traffico di Firestore va lasciato passare.
  if (url.origin !== location.origin && url.hostname !== 'www.gstatic.com') return;
  // "no-cache": chiedo sempre al sito se il file è cambiato, invece di fidarmi della copia del browser.
  const fresh = e.request.mode === 'navigate' ? new Request(e.request.url, { cache: 'no-cache' }) : new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(fresh)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
