// Sincronizzazione tra dispositivi con Firebase (login Google + Firestore).
// Le note restano anche in locale: senza internet l'app funziona e le modifiche
// vengono inviate appena torna la connessione.
import { firebaseConfig } from './firebase-config.js';

const app = window.noteApp;
const V = '10.12.2';
const statusEl = document.getElementById('syncStatus');
const infoEl = document.getElementById('syncInfo');
const btn = document.getElementById('syncBtn');

function setStatus(icon, text) {
  statusEl.textContent = icon;
  statusEl.title = text;
  infoEl.textContent = text;
}

if (firebaseConfig) start().catch(err => {
  console.error(err);
  setStatus('⚠️', 'Sincronizzazione non disponibile (sei offline?)');
});

async function start() {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const fb = initializeApp(firebaseConfig);
  const a = auth.getAuth(fb);
  const db = fs.initializeFirestore(fb, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
  });

  document.getElementById('syncBox').hidden = false;
  let unsubscribe = null;

  btn.onclick = async () => {
    if (a.currentUser) {
      if (!confirm('Uscire? Le note restano su questo dispositivo ma non verranno più sincronizzate.')) return;
      await auth.signOut(a);
      return;
    }
    try {
      await auth.signInWithPopup(a, new auth.GoogleAuthProvider());
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') alert('Accesso non riuscito: ' + e.message);
    }
  };

  auth.onAuthStateChanged(a, user => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    app.sync.push = () => {};
    app.sync.remove = () => {};
    if (!user) {
      btn.textContent = 'Accedi con Google';
      setStatus('', 'Non sincronizzato: accedi per avere le note su tutti i dispositivi');
      return;
    }
    btn.textContent = 'Esci';
    setStatus('⏳', `Sincronizzazione in corso… (${user.email})`);

    const col = fs.collection(db, 'users', user.uid, 'notes');
    const lastSyncKey = 'note-last-sync-' + user.uid;
    let first = true;

    app.sync.push = note => fs.setDoc(fs.doc(col, note.id), note);
    app.sync.remove = id => fs.deleteDoc(fs.doc(col, id));

    unsubscribe = fs.onSnapshot(col, { includeMetadataChanges: true }, snap => {
      const remote = new Map(snap.docs.map(d => [d.id, d.data()]));

      if (first) {
        // Primo collegamento: unisce le note locali con quelle online.
        first = false;
        const lastSync = Number(localStorage.getItem(lastSyncKey) || 0);
        app.getNotes().forEach(n => {
          const r = remote.get(n.id);
          // Nota nuova creata qui (o mai caricata): la invio. Se invece è più vecchia
          // dell'ultima sincronizzazione e online non c'è più, è stata eliminata altrove.
          if ((!r && n.updated > lastSync) || (r && n.updated > r.updated)) {
            app.sync.push(n);
            remote.set(n.id, n);
          }
        });
      }

      app.replaceAll([...remote.values()]);

      if (snap.metadata.fromCache) {
        setStatus('📴', `Offline: le modifiche verranno sincronizzate più tardi (${user.email})`);
      } else if (snap.metadata.hasPendingWrites) {
        setStatus('⏳', `Invio modifiche… (${user.email})`);
      } else {
        localStorage.setItem(lastSyncKey, String(Date.now()));
        setStatus('☁️', `Sincronizzato con ${user.email}`);
      }
    }, err => {
      console.error(err);
      setStatus('⚠️', 'Errore di sincronizzazione: ' + err.message);
    });
  });
}
