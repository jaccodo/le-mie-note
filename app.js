// ===== Personalizzazione =====
// Modifica qui raccolte, categorie e priorità: l'app si adatta da sola.
const COLLECTIONS = [
  { id: 'ristoranti', label: 'Ristoranti', add: 'Nuovo ristorante', icon: '🍽️', titleHint: 'Nome del ristorante',
    todo: 'Da provare', done: 'Provati',
    place: { label: 'Luogo', hint: 'Città o zona', filter: true, suggest: true },
    tagPresets: ['Stellato', 'Osteria', 'Pettinato', 'Da gruppo'],
    maps: () => true },
  { id: 'vini', label: 'Vini e cantine', add: 'Nuovo vino o cantina', icon: '🍷', titleHint: 'Nome del vino o della cantina',
    todo: 'Da provare', done: 'Provati', kindLabel: 'Tipologia', kinds: ['Rosso', 'Bianco', 'Rosato', 'Bollicine', 'Dolce', 'Cantina'],
    maker: { label: 'Cantina', hint: 'es. Giacomo Conterno', hideFor: ['Cantina'], suggest: true },
    place: { label: 'Zona', hint: 'es. Langhe, Toscana', filter: true, suggest: true },
    extra: { label: 'Annata', hint: 'es. 2019', hideFor: ['Cantina'] },
    tagPresets: ['Tradizionale', 'Biologico', 'Biodinamico'],
    maps: n => n.kind === 'Cantina' || !!n.maker },
  { id: 'film', label: 'Film', add: 'Nuovo film', icon: '🎬', titleHint: 'Titolo del film',
    todo: 'Da vedere', done: 'Visti',
    maker: { label: 'Regista', hint: 'es. Paolo Sorrentino', suggest: true },
    place: { label: 'Dove vederlo', hint: 'es. Netflix, cinema', filter: true, suggest: true, icon: '📺' },
    extra: { label: 'Anno', hint: 'es. 2013' },
    tagPresets: ['Commedia', 'Drammatico', 'Thriller', 'Azione', 'Fantascienza', 'Animazione', 'Documentario'] },
  { id: 'luoghi', label: 'Luoghi', add: 'Nuovo luogo', icon: '🗺️', titleHint: 'Nome del luogo',
    todo: 'Da visitare', done: 'Visitati',
    place: { label: 'Dove', hint: 'Regione o paese', filter: true, suggest: true },
    extra: { label: 'Periodo migliore', hint: 'es. primavera' },
    tagPresets: ['Città', 'Mare', 'Montagna', 'Natura', 'Borgo', 'Museo'],
    maps: () => true },
  { id: 'attivita', label: 'Attività', add: 'Nuova attività', icon: '🥾', titleHint: 'Cosa vuoi fare',
    todo: 'Da fare', done: 'Fatte',
    place: { label: 'Dove', hint: 'Città o zona', filter: true, suggest: true },
    extra: { label: 'Quando', hint: 'es. estate, weekend' },
    tagPresets: ['All\'aperto', 'Sport', 'Cultura', 'Relax', 'Con amici', 'In famiglia'],
    maps: n => !!n.place },
  { id: 'regali', label: 'Idee regalo', add: 'Nuova idea regalo', icon: '🎁', titleHint: 'Cosa regalare',
    todo: 'Da regalare', noStatus: true,
    place: { label: 'Per chi', hint: 'es. Mamma, Luca', filter: true, suggest: true, icon: '👤' },
    link: { label: 'Link', hint: 'Incolla il link (facoltativo)' },
    tagPresets: ['Compleanno', 'Natale', 'Anniversario', 'Laurea'] },
  { id: 'documenti', label: 'Documentazione', add: 'Nuovo documento', icon: '📁', titleHint: 'Nome del documento',
    todo: 'Salvati', noStatus: true, files: true,
    extra: { label: 'Data del documento', hint: 'es. marzo 2026' },
    tagPresets: ['Referto', 'Analisi', 'Bolletta', 'Contratto', 'Ricevuta', 'Garanzia', 'Assicurazione', 'Tasse'] },
  { id: 'password', label: 'Password', icon: '🔐', external: true, externalLabel: 'Apri Bitwarden' },
  { id: 'appunti', label: 'Appunti', add: 'Nuovo appunto', icon: '🗒️', titleHint: 'Titolo dell\'appunto',
    todo: 'Salvati', noStatus: true, files: true, fileOptional: true, tagPresets: [],
    link: { label: 'Link', hint: 'Incolla il link (facoltativo)' } },
  { id: 'note', label: 'Note', add: 'Nuova nota', icon: '📝', titleHint: 'Titolo',
    todo: 'Da fare', done: 'Completate' },
];
const DEFAULT_CATEGORIES = [
  { id: 'casa',   label: '🏠 Casa' },
  { id: 'lavoro', label: '💼 Lavoro (mer)' },
  { id: 'idee',   label: '💡 Idee' },
];
const PRIORITIES = [
  { id: 'alta',  label: 'Alta',  rank: 0 },
  { id: 'media', label: 'Media', rank: 1 },
  { id: 'bassa', label: 'Bassa', rank: 2 },
];
const WORK_DAY = 3; // 0 = domenica ... 3 = mercoledì

// ===== Dati =====
const STORE_KEY = 'note-app-v1';
const APP_VERSION = 20; // Deve coincidere con CACHE in sw.js.
let notes = load();
// Le categorie si possono cambiare dall'app. "updated" dice quale versione è la più recente.
const CAT_KEY = 'le-mie-cose-categorie';
const CAT_DOC = '_categorie';
let catDoc = loadCategories();
const ui = { col: null, tab: 'todo', cat: null, kind: null, tag: null, place: null, q: '' };

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function loadCategories() {
  try {
    const doc = JSON.parse(localStorage.getItem(CAT_KEY));
    if (doc && Array.isArray(doc.list)) return doc;
  } catch {}
  return { list: DEFAULT_CATEGORIES, updated: 0 };
}
function storeCategories(doc) {
  catDoc = { list: doc.list, memo: doc.memo || '', updated: doc.updated };
  localStorage.setItem(CAT_KEY, JSON.stringify(catDoc));
  render();
}
function saveCategories(list) {
  storeCategories({ list, memo: catDoc.memo, updated: Date.now() });
  sync.pushCategories(catDoc);
}
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(notes));
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const byId = id => notes.find(n => n.id === id);
const colOf = n => n.col || 'note'; // Le note create prima delle raccolte non hanno "col".
const colById = id => COLLECTIONS.find(c => c.id === id);
const inCol = id => notes.filter(n => colOf(n) === id);

// Ganci per la sincronizzazione (sync.js li sostituisce dopo il login).
const sync = { push: () => {}, remove: () => {}, pushCategories: () => {} };
window.noteApp = {
  sync,
  getNotes: () => notes,
  replaceAll(list) { notes = list; save(); render(); queueDueSync(); },
  CAT_DOC,
  getCategories: () => catDoc,
  setCategories(doc) { if (Array.isArray(doc.list)) storeCategories(doc); },
};
function changed(note) {
  note.updated = Date.now();
  save(); render();
  sync.push(note);
  queueDueSync();
}

function parseTags(str) {
  return [...new Set(str.split(/[\s,]+/).map(t => t.replace(/^#/, '').toLowerCase()).filter(Boolean))];
}
function allTags(colId) {
  const counts = {};
  inCol(colId).forEach(n => (n.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
}
// Valori già usati in un campo: "firenze" e "Firenze" contano come uno solo.
function usedValues(colId, field) {
  const found = new Map();
  inCol(colId).filter(n => n[field]).forEach(n => {
    const key = n[field].toLowerCase();
    const entry = found.get(key) || { label: n[field], count: 0 };
    entry.count++;
    found.set(key, entry);
  });
  return [...found.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).map(e => e.label);
}
// Accetta anche il testo copiato da "Condividi" (es. "Nome prodotto https://...") e i link senza https.
function linkUrl(text) {
  const s = (text || '').trim();
  const found = s.match(/https?:\/\/\S+/i);
  try {
    const url = new URL(found ? found[0] : 'https://' + s);
    return url.hostname.includes('.') ? url.href : '';
  } catch { return ''; }
}
const sameText = (a, b) => (a || '').toLowerCase() === (b || '').toLowerCase();

// ===== Helpers DOM =====
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Evidenzia le parole cercate senza toccare tag HTML ed entità già presenti.
function markWords(html, words) {
  words.forEach(w => {
    const re = new RegExp('(<[^>]+>|&[#\\w]+;)|(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    html = html.replace(re, (m, skip, hit) => skip ? m : `<mark>${hit}</mark>`);
  });
  return html;
}
const highlight = (text, words) => markWords(esc(text), words);

// Formattazione degli appunti: resta testo normale con pochi simboli.
// **grassetto**, ==evidenziato==, "- " elenco, "- [ ] " casella da spuntare.
const CHECK_LINE = /^- \[( |x)\] ?(.*)$/i;
const BULLET_LINE = /^- (.*)$/;
const hasFormat = text => /\*\*.+?\*\*|==.+?==|^- /m.test(text);
const hasList = text => /^- /m.test(text);
const formatInline = html => html
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/==(.+?)==/g, '<mark class="hl">$1</mark>');
function formatBody(text, words, interactive) {
  const inline = s => markWords(formatInline(esc(s)), words) || '<br>';
  return text.split('\n').map((line, i) => {
    const check = CHECK_LINE.exec(line);
    if (check) {
      const on = check[1] !== ' ';
      const box = interactive
        ? `<button type="button" class="cb" data-act="check" data-line="${i}" aria-pressed="${on}" aria-label="Spunta">${on ? '☑' : '☐'}</button>`
        : `<span class="cb">${on ? '☑' : '☐'}</span>`;
      return `<div class="ln boxed ${on ? 'ticked' : ''}">${box}<span>${inline(check[2])}</span></div>`;
    }
    const bullet = BULLET_LINE.exec(line);
    if (bullet) return `<div class="ln bullet"><span class="dot">•</span><span>${inline(bullet[1])}</span></div>`;
    return `<div class="ln">${inline(line)}</div>`;
  }).join('');
}
function toast(msg, actionLabel, action) {
  const t = $('toast');
  t.innerHTML = `<span>${esc(msg)}</span>`;
  if (actionLabel) {
    const b = document.createElement('button');
    b.textContent = actionLabel;
    b.onclick = () => { action(); t.hidden = true; };
    t.appendChild(b);
  }
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 4000);
}

// ===== Navigazione =====
// Uso la cronologia del browser così il tasto Indietro del telefono funziona:
// chiude il foglio aperto, poi torna alla home.
function resetFilters() {
  ui.tab = 'todo'; ui.cat = null; ui.kind = null; ui.tag = null; ui.place = null; ui.q = '';
  $('search').value = '';
}
function go(col, keepFilters) {
  if (!keepFilters) resetFilters();
  ui.col = col;
  history.pushState({ inApp: true }, '', col ? '#' + col : location.pathname + location.search);
  render();
  window.scrollTo(0, 0);
}
const SHEETS = ['sheet', 'menu', 'picker', 'calSheet', 'catSheet', 'fileSheet', 'backupSheet', 'viewSheet', 'pwdSheet'];
function hideSheets() {
  SHEETS.forEach(id => { $(id).hidden = true; });
  editing = null;
  memoMove = null;
  if (pwdResolve) { pwdResolve(null); pwdResolve = null; }
}
function showSheet(id) {
  const alreadyOpen = SHEETS.some(s => !$(s).hidden);
  SHEETS.forEach(s => { $(s).hidden = s !== id; });
  if (!alreadyOpen) history.pushState({ ...history.state, sheet: true }, '');
}
function closeSheet() {
  hideSheets();
  if (history.state && history.state.sheet) history.back();
}
function colFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  return colById(id) && !colById(id).external ? id : null;
}
window.addEventListener('popstate', () => {
  hideSheets();
  const col = colFromHash();
  if (col !== ui.col) { resetFilters(); ui.col = col; window.scrollTo(0, 0); }
  render();
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]') || SHEETS.includes(e.target.id)) closeSheet();
});

// ===== Filtri e ordinamento =====
function searchable(n) {
  return [n.title, n.body, n.maker, n.place, n.extra, n.link, n.fileName, n.kind, ...(n.tags || []).map(t => '#' + t)].filter(Boolean).join(' ').toLowerCase();
}
function matches(n) {
  if (ui.col && colOf(n) !== ui.col) return false;
  if (ui.cat && n.category !== ui.cat) return false;
  if (ui.kind && n.kind !== ui.kind) return false;
  if (ui.tag && !(n.tags || []).includes(ui.tag)) return false;
  if (ui.place && !sameText(n.place, ui.place)) return false;
  if (ui.q) {
    const hay = searchable(n);
    return ui.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
  }
  return ui.col && !colById(ui.col).noStatus ? !!n.done === (ui.tab === 'done') : true;
}
const prioRank = p => (PRIORITIES.find(x => x.id === p) || { rank: 9 }).rank;
function sorted(list) {
  return list.slice().sort((a, b) =>
    (!!a.done - !!b.done)
    || (isLate(b) - isLate(a)) // Le scadenze già passate vanno in cima.
    || ((b.rating || 0) - (a.rating || 0))
    || (prioRank(a.priority) - prioRank(b.priority))
    || ((a.due || Infinity) - (b.due || Infinity))
    || (b.updated - a.updated));
}

// ===== Render =====
function render() {
  const col = colById(ui.col);
  document.body.dataset.col = ui.col || '';
  $('heading').textContent = col ? col.label : 'Jaccodo 🧠';
  $('backBtn').hidden = !col;
  $('search').placeholder = col ? `Cerca in ${col.label.toLowerCase()}…` : 'Cerca in tutto…';

  const searching = !!ui.q;
  const home = !col && !searching;
  $('tiles').hidden = !home;
  if (home) renderTiles();
  $('memo').hidden = !home;
  $('memoToNote').hidden = !home || !(catDoc.memo || '').trim();
  if (home) renderMemo();
  $('agenda').hidden = !home;
  if (home) renderAgenda();
  renderTabs(col, searching);
  renderChips(col);
  renderHint(col, home);

  const words = ui.q.split(/\s+/).filter(Boolean);
  const shown = home ? [] : sorted(notes.filter(matches));
  const boxes = !!col && col.id === 'note' && !searching && !ui.cat;
  $('list').classList.toggle('boxes', boxes);
  $('list').innerHTML = boxes ? noteBoxes(shown) : shown.map(n => card(n, words, !col)).join('');

  $('empty').hidden = home || boxes || shown.length > 0;
  const filtering = ui.cat || ui.kind || ui.tag || ui.place;
  $('empty').textContent = searching ? `Nessun risultato per “${ui.q}”.`
    : filtering ? 'Niente con questi filtri.' : 'Ancora niente qui. Tocca + per aggiungere.';
}

function ratingHtml(r) {
  if (!r) return '';
  return `<div class="rating" aria-label="Voto ${r} su 5">${'★'.repeat(r)}<span class="off">${'★'.repeat(5 - r)}</span></div>`;
}
// Titoli brevi nelle Note: solo il titolo mostrato si accorcia, il testo resta com'è scritto.
const SUMMARY_KEY = 'jaccodo-riassunti';
const STOPWORDS = new Set(('il lo la i gli le un uno una di a da in con su per tra fra e ed o ma se che non è sono ho ha hanno del dello della dei degli delle ' +
  'al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle come più anche poi quindi perché ' +
  'questo questa questi queste quello quella quelli quelle mi ti si ci vi ne era sia essere fare molto tutto tutti').split(' '));
let summaryOn = localStorage.getItem(SUMMARY_KEY) !== 'off';
function shorten(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : max).replace(/[\s,;:.]+$/, '') + '…';
}
// Un titolo lungo si accorcia togliendo le parole di legame; "non" e "se" restano perché cambiano il senso.
const TITLE_MAX = 45;
function shortTitle(title) {
  return !summaryOn || title.length <= TITLE_MAX ? title : compressTitle(title);
}
function compressTitle(title) {
  const kept = title.trim().split(/\s+/).map(w => w.replace(/^(?:dell|dall|nell|sull|all|l|d|un)['’]/i, '')).filter(w => {
    const bare = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    return bare === 'non' || bare === 'se' || !STOPWORDS.has(bare);
  });
  const short = shorten(kept.join(' ').replace(/[,;:]+$/, ''), 60);
  return short.charAt(0).toUpperCase() + short.slice(1);
}
function renderSummaryBtn() {
  $('summaryBtn').textContent = `✂️ Titoli brevi nelle Note: ${summaryOn ? 'attivo' : 'disattivo'}`;
}

// Le note divise per categoria: ogni box è già in ordine di priorità.
const BOX_COLORS = ['film', 'ristoranti', 'luoghi', 'attivita', 'regali', 'documenti', 'vini'];
function miniCard(n) {
  const prio = PRIORITIES.find(p => p.id === n.priority);
  const boxes = (n.body || '').match(/^- \[[ x]\]/gim) || [];
  const ticked = boxes.filter(b => /x/i.test(b)).length;
  return `<li class="item mini ${n.done ? 'done' : ''} ${prio ? 'prio-' + prio.id : ''}" data-id="${n.id}" data-col="note">
    <button class="check" data-act="toggle" aria-label="${n.done ? 'Da fare' : 'Completata'}"></button>
    <div class="content" data-act="edit">
      <div class="mini-top">
        <span class="title">${esc(shortTitle(n.title))}</span>
        ${n.due && !n.done ? `<span class="due ${isLate(n) ? 'late' : ''}">⏰ ${esc(dayLabel(startOfDay(n.due)))}</span>` : ''}
        ${boxes.length ? `<span class="progress">${ticked}/${boxes.length}</span>` : ''}
      </div>
    </div>
  </li>`;
}
function noteBoxes(shown) {
  const known = new Set(catDoc.list.map(c => c.id));
  const groups = [...catDoc.list];
  if (shown.some(n => !known.has(n.category))) groups.push({ id: '', label: 'Senza categoria' });
  return groups.map((c, i) => {
    const inBox = shown.filter(n => c.id ? n.category === c.id : !known.has(n.category));
    if (!inBox.length && ui.tag) return '';
    return `<li class="note-box" style="--box:var(--c-${BOX_COLORS[i % BOX_COLORS.length]})">
      <button class="box-head" ${c.id ? `data-box="${esc(c.id)}"` : ''}><span>${esc(c.label)}</span><span class="count">${inBox.length}</span></button>
      ${inBox.length ? `<ul>${inBox.map(miniCard).join('')}</ul>` : '<div class="box-empty">Vuoto</div>'}
    </li>`;
  }).join('');
}
function mapUrl(n, c) {
  return c.maps && c.maps(n)
    ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([n.maker || n.title, n.place].filter(Boolean).join(' '))
    : null;
}
function toggleCheckLine(note, i) {
  const lines = note.body.split('\n');
  lines[i] = lines[i].replace(/^- \[( |x)\]/i, (m, x) => x === ' ' ? '- [x]' : '- [ ]');
  note.body = lines.join('\n');
  changed(note);
}
// Le prime righe non vuote di un testo, con "…" se continua.
const PREVIEW_LINES = 3;
function previewText(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.slice(0, PREVIEW_LINES).join('\n') + (lines.length > PREVIEW_LINES ? '\n…' : '');
}
function card(n, words, showCol) {
  const c = colById(colOf(n));
  const cat = catDoc.list.find(x => x.id === n.category);
  const prio = PRIORITIES.find(p => p.id === n.priority);
  const sub = [n.kind, n.maker, n.place, n.extra].filter(Boolean).join(' · ');
  const map = mapUrl(n, c);
  return `
    <li class="item ${n.done ? 'done' : ''} ${prio ? 'prio-' + prio.id : ''}" data-id="${n.id}" data-col="${c.id}">
      ${c.noStatus ? '' : `<button class="check" data-act="toggle" aria-label="${esc(n.done ? c.todo : c.done)}"></button>`}
      <div class="content" data-act="edit">
        <div class="title">${highlight(c.id === 'note' && !words.length ? shortTitle(n.title) : n.title, words)}</div>
        ${sub ? `<div class="sub">${highlight(sub, words)}</div>` : ''}
        ${ratingHtml(n.rating)}
        ${n.body ? (c.id === 'appunti'
          // Negli appunti solo un'anteprima: il testo intero si legge aprendo la scheda.
          ? `<div class="body preview">${formatBody(previewText(n.body), words, false)}</div>`
          : `<div class="body ${hasList(n.body) || c.id === 'note' ? 'full' : ''}">${formatBody(n.body, words, true)}</div>`) : ''}
        <div class="meta">${[
          showCol ? `<span class="badge">${c.icon} ${esc(c.label)}</span>` : '',
          !ui.cat && cat ? `<span class="badge">${esc(cat.label)}</span>` : '',
          prio ? `<span class="badge" style="color:var(--${prio.id})">● ${prio.label}</span>` : '',
          dueBadge(n),
          n.fileId ? fileBadge(n) : '',
          ...(n.tags || []).map(t => `<span class="badge tag">${c.tagPresets ? '' : '#'}${esc(t)}</span>`),
        ].join('')}</div>
      </div>
      ${n.fileId ? `<button class="pin" data-act="open" aria-label="Apri il file">📄</button>` : ''}
      ${n.link ? `<a class="pin" href="${esc(n.link)}" target="_blank" rel="noopener" aria-label="Apri il link">🔗</a>` : ''}
      ${map ? `<a class="pin" href="${esc(map)}" target="_blank" rel="noopener" aria-label="Apri in Maps">📍</a>` : ''}
    </li>`;
}

// L'ordine dei riquadri è salvato su questo dispositivo.
const ORDER_KEY = 'le-mie-cose-ordine';
function orderedCollections() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(ORDER_KEY)) || []; } catch {}
  const known = saved.map(colById).filter(Boolean);
  return [...known, ...COLLECTIONS.filter(c => !known.includes(c))];
}
function renderTiles() {
  if (tileDrag.tile) return; // Non ridisegno mentre un riquadro viene trascinato.
  $('tiles').innerHTML = orderedCollections().map(c => {
    const list = inCol(c.id);
    const done = list.filter(n => n.done).length;
    const open = list.length - done;
    const count = c.externalLabel ? c.externalLabel : !list.length ? 'Vuoto' : c.noStatus ? c.todo : `${c.todo} · ${c.done} ${done}`;
    return `<button class="tile" data-go="${c.id}">
      <span class="tile-top"><span class="tile-icon">${c.icon}</span>${list.length ? `<span class="tile-num">${open}</span>` : ''}</span>
      <span class="tile-name">${esc(c.label)}</span>
      <span class="tile-count">${esc(count)}</span>
    </button>`;
  }).join('');
}
function renderTabs(col, searching) {
  $('statusTabs').hidden = !col || searching || col.noStatus;
  if (!col || col.noStatus) return;
  const list = inCol(col.id);
  const doneCount = list.filter(n => n.done).length;
  $('statusTabs').innerHTML = [['todo', col.todo, list.length - doneCount], ['done', col.done, doneCount]].map(([id, label, n]) =>
    `<button data-tab="${id}" class="${ui.tab === id ? 'on' : ''}">${esc(label)}<span class="count">${n}</span></button>`
  ).join('');
}
function renderChips(col) {
  let html = '';
  let placeHtml = '';
  if (col) {
    const tags = col.id === 'note' || col.tagPresets ? allTags(col.id) : [];
    if (ui.tag && !tags.includes(ui.tag)) ui.tag = null;
    const tagChips = tags.map(t => `<button class="chip ${ui.tag === t ? 'on' : ''}" data-tag="${esc(t)}">${col.tagPresets ? '' : '#'}${esc(t)}</button>`).join('');
    if (col.kinds) html = col.kinds.map(k => `<button class="chip ${ui.kind === k ? 'on' : ''}" data-kind="${esc(k)}">${esc(k)}</button>`).join('');
    if (ui.cat && !catDoc.list.some(c => c.id === ui.cat)) ui.cat = null;
    // Con i box le categorie si vedono già: i pulsanti servono solo dentro una categoria.
    if (col.id === 'note') html = '<button class="chip" data-edit-cats="1">✎ Categorie</button>'
      + (ui.cat ? `<button class="chip" data-cat="${esc(ui.cat)}">▦ Tutti i box</button>` : '')
      + (!ui.cat && !ui.q ? [] : catDoc.list).map(c => `<button class="chip ${ui.cat === c.id ? 'on' : ''}" data-cat="${esc(c.id)}">${esc(c.label)}</button>`).join('');
    html += tagChips;
    if (col.place && col.place.filter) {
      const places = usedValues(col.id, 'place');
      if (ui.place && !places.some(p => sameText(p, ui.place))) ui.place = null;
      placeHtml = places.map(p => `<button class="chip ${sameText(ui.place, p) ? 'on' : ''}" data-place="${esc(p)}">${col.place.icon || '📍'} ${esc(p)}</button>`).join('');
    }
  }
  $('chips').innerHTML = html;
  $('chips').hidden = !html;
  $('placeChips').innerHTML = placeHtml;
  $('placeChips').hidden = !placeHtml;
}
function renderHint(col, home) {
  const hint = $('hint');
  const pending = inCol('note').filter(n => n.category === 'lavoro' && !n.done).length;
  const isWorkDay = new Date().getDay() === WORK_DAY;
  const hasWork = catDoc.list.some(c => c.id === 'lavoro');
  hint.hidden = !hasWork || !((home && isWorkDay) || (col && col.id === 'note' && ui.cat === 'lavoro'));
  if (!hint.hidden) hint.textContent = `📅 ${nextWorkDayLabel()} · ${pending} da fare`;
  hint.dataset.go = '';
  const due = col && col.id === 'note' ? dueHint() : null;
  if (due) { hint.hidden = false; hint.textContent = due.text; hint.dataset.go = due.go; }
  if (col && col.id === 'documenti') {
    const text = backupHint();
    hint.hidden = !text;
    hint.textContent = text;
  }
}
function nextWorkDayLabel() {
  const today = new Date();
  const diff = (WORK_DAY - today.getDay() + 7) % 7;
  if (diff === 0) return 'Oggi è giorno di lavoro';
  if (diff === 1) return 'Lavoro domani';
  const d = new Date(today); d.setDate(today.getDate() + diff);
  return 'Prossimo lavoro: ' + d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ===== Editor =====
let editing = null;
let memoMove = null; // Testo del memo che sta diventando una nota.
let form = {};
const TEXT_FIELDS = [['Maker', 'maker'], ['Place', 'place'], ['Extra', 'extra'], ['Link', 'link']];

function openEditor(colId, note) {
  const col = colById(colId);
  editing = note || null;
  form = note
    ? { col: col.id, done: !!note.done, rating: note.rating || 0, kind: note.kind || null, category: note.category || null, priority: note.priority || null, tags: [...(note.tags || [])] }
    : { col: col.id, done: ui.col === col.id && ui.tab === 'done', rating: 0, kind: ui.col === col.id ? ui.kind : null,
        category: ui.cat || catDoc.list[0]?.id || null, priority: 'media', tags: ui.col === col.id && ui.tag ? [ui.tag] : [] };

  document.body.dataset.col = col.id;
  $('editorTitle').textContent = note ? 'Modifica' : col.add;
  $('fTitle').placeholder = col.titleHint;
  $('fTitle').value = note ? note.title : '';
  $('fBody').value = note ? note.body || '' : '';
  $('fBody').placeholder = 'Quello che vuoi ricordare (facoltativo)';
  bodyLength = $('fBody').value.length;
  renderBodyPreview();
  $('fPlace').value = note ? note.place || '' : (ui.col === col.id && ui.place) || '';
  $('fNewTag').value = '';
  $('fMaker').value = note ? note.maker || '' : '';
  $('fExtra').value = note ? note.extra || '' : '';
  $('fFileWrap').hidden = !col.files;
  form.file = null;
  $('fFile').value = '';
  $('fFileName').textContent = note && note.fileName ? note.fileName + ' (tocca per sostituirlo)' : 'Scegli un file o fai una foto';
  $('fLink').value = note ? note.link || '' : '';
  $('fDue').value = note && note.due ? toLocalInput(note.due) : '';
  $('fTags').value = note ? (note.tags || []).join(' ') : (ui.tag || '');
  $('deleteBtn').hidden = !note;

  TEXT_FIELDS.forEach(([k, key]) => {
    const f = col[key];
    if (f) { $(`f${k}Label`).textContent = f.label; $(`f${k}`).placeholder = f.hint; }
  });
  $('noteFields').hidden = col.id !== 'note';
  $('fStatus').hidden = col.id === 'note' || col.noStatus;
  $('fKindWrap').hidden = !col.kinds;
  $('fKindLabel').textContent = col.kindLabel || '';
  $('fTagChoiceWrap').hidden = !col.tagPresets;
  renderEditorSegs();
  renderTagSuggest();
  renderTagChoice();
  renderSuggest('Place', 'place');
  renderSuggest('Maker', 'maker');
  showSheet('sheet');
  $('editor').scrollTop = 0;
  if (!note) setTimeout(() => $('fTitle').focus(), 50);
}

function renderEditorSegs() {
  const col = colById(form.col);
  $('fStatus').innerHTML = (col.noStatus ? [] : [[false, col.todo], [true, col.done]]).map(([v, label]) =>
    `<button type="button" data-v="${v}" class="${form.done === v ? 'on' : ''}">${esc(label)}</button>`).join('');
  // Alcuni campi spariscono in base alla tipologia: una cantina non ha annata.
  TEXT_FIELDS.forEach(([k, key]) => {
    const f = col[key];
    $(`f${k}Wrap`).hidden = !f || (f.hideFor || []).includes(form.kind);
  });
  $('fStarsWrap').hidden = !form.done || col.id === 'note';
  $('fStars').innerHTML = [1, 2, 3, 4, 5].map(v =>
    `<button type="button" data-v="${v}" class="${form.rating >= v ? 'on' : ''}" aria-label="${v} su 5">★</button>`).join('');
  $('fKind').innerHTML = (col.kinds || []).map(k =>
    `<button type="button" data-v="${esc(k)}" class="${form.kind === k ? 'on' : ''}">${esc(k)}</button>`).join('');
  $('fCat').innerHTML = catDoc.list.map(c =>
    `<button type="button" data-v="${esc(c.id)}" class="${form.category === c.id ? 'on' : ''}">${esc(c.label)}</button>`).join('');
  $('fPrio').innerHTML = [...PRIORITIES, { id: null, label: 'Nessuna' }].map(p =>
    `<button type="button" data-v="${p.id ?? ''}" class="${form.priority === p.id ? 'on' : ''}">${p.label}</button>`).join('');
}
function renderTagSuggest() {
  const current = parseTags($('fTags').value);
  $('tagSuggest').innerHTML = allTags('note').filter(t => !current.includes(t)).slice(0, 12)
    .map(t => `<button type="button" class="chip" data-tag="${esc(t)}">+ #${esc(t)}</button>`).join('');
}
// Tag a scelta rapida: quelli proposti, quelli già usati e quelli scelti ora.
function tagOptions() {
  const col = colById(form.col);
  const options = [];
  [...(col.tagPresets || []), ...allTags(col.id), ...form.tags].forEach(t => {
    if (!options.some(o => sameText(o, t))) options.push(t);
  });
  return options;
}
function renderTagChoice() {
  $('fTagChoice').innerHTML = tagOptions().map(t => {
    const on = form.tags.some(x => sameText(x, t));
    return `<button type="button" class="chip ${on ? 'on' : ''}" data-tag="${esc(t)}" aria-pressed="${on}">${esc(t)}</button>`;
  }).join('');
}
function addNewTag() {
  const text = $('fNewTag').value.replace(/,/g, ' ').trim().replace(/\s+/g, ' ');
  $('fNewTag').value = '';
  if (!text) return;
  // Se il tag esiste già con altre maiuscole riuso quello, così i filtri non si sdoppiano.
  const tag = tagOptions().find(o => sameText(o, text)) || text[0].toUpperCase() + text.slice(1);
  if (!form.tags.some(x => sameText(x, tag))) form.tags.push(tag);
  renderTagChoice();
}
function renderSuggest(k, key) {
  const f = colById(form.col)[key];
  const typed = $(`f${k}`).value.trim().toLowerCase();
  const values = f && f.suggest
    ? usedValues(form.col, key).filter(v => v.toLowerCase() !== typed && v.toLowerCase().includes(typed)).slice(0, 8)
    : [];
  const box = $(`f${k}Suggest`);
  box.innerHTML = values.map(v => `<button type="button" class="chip" data-v="${esc(v)}">${esc(v)}</button>`).join('');
  box.hidden = !values.length;
}

const segHandler = fn => e => {
  const b = e.target.closest('button'); if (!b) return;
  fn(b.dataset.v); renderEditorSegs();
};
$('fStatus').onclick = segHandler(v => { form.done = v === 'true'; });
$('fStars').onclick = segHandler(v => { form.rating = form.rating === +v ? 0 : +v; });
$('fKind').onclick = segHandler(v => { form.kind = form.kind === v ? null : v; });
$('fCat').onclick = segHandler(v => { form.category = v; });
$('fPrio').onclick = segHandler(v => { form.priority = v || null; });
$('fTags').oninput = renderTagSuggest;
$('tagSuggest').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  $('fTags').value = [...parseTags($('fTags').value), b.dataset.tag].join(' ');
  renderTagSuggest();
};
$('fTagChoice').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  const t = b.dataset.tag;
  form.tags = form.tags.some(x => sameText(x, t)) ? form.tags.filter(x => !sameText(x, t)) : [...form.tags, t];
  renderTagChoice();
};
$('fNewTagBtn').onclick = addNewTag;
$('fNewTag').onkeydown = e => {
  if (e.key === 'Enter') { e.preventDefault(); addNewTag(); }
};
// La tastiera Samsung non sempre segnala i tasti: controllo anche il testo inserito.
$('fNewTag').oninput = e => { if (e.target.value.includes(',')) addNewTag(); };
[['Place', 'place'], ['Maker', 'maker']].forEach(([k, key]) => {
  $(`f${k}`).oninput = () => renderSuggest(k, key);
  $(`f${k}Suggest`).onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    $(`f${k}`).value = b.dataset.v;
    renderSuggest(k, key);
  };
});

// ----- Barra di formattazione -----
let bodyLength = 0;
function renderBodyPreview() {
  const text = $('fBody').value.trim();
  const show = hasFormat(text);
  $('fBodyPreview').hidden = !show;
  $('fBodyPreview').innerHTML = show ? formatBody(text, [], false) : '';
}
function bodyChanged() {
  bodyLength = $('fBody').value.length;
  renderBodyPreview();
}
// Mette o toglie i simboli attorno alla selezione, riga per riga.
function toggleMarker(marker) {
  const ta = $('fBody');
  let start = ta.selectionStart;
  let end = ta.selectionEnd;
  const v = ta.value;
  while (start < end && /\s/.test(v[start])) start++;
  while (end > start && /\s/.test(v[end - 1])) end--;
  const size = marker.length;
  const lines = v.slice(start, end).split('\n');
  const isWrapped = l => l.length > size * 2 && l.startsWith(marker) && l.endsWith(marker);
  if (v.slice(start - size, start) === marker && v.slice(end, end + size) === marker) {
    ta.setRangeText(v.slice(start, end), start - size, end + size, 'select');
  } else if (start === end) {
    ta.setRangeText(marker + marker, start, end, 'end');
    ta.setSelectionRange(start + size, start + size);
  } else if (lines.every(l => !l.trim() || isWrapped(l))) {
    const plain = lines.map(l => l.trim() ? l.slice(size, -size) : l).join('\n');
    ta.setRangeText(plain, start, end, 'select');
  } else {
    const wrapped = lines.map(l => l.trim() ? marker + l + marker : l).join('\n');
    ta.setRangeText(wrapped, start, end, 'select');
  }
  ta.focus();
  bodyChanged();
}
// Trasforma le righe selezionate in elenco o caselle (o le riporta a testo).
function toggleLinePrefix(prefix) {
  const ta = $('fBody');
  const v = ta.value;
  const from = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
  const nextBreak = v.indexOf('\n', ta.selectionEnd);
  const to = nextBreak === -1 ? v.length : nextBreak;
  const strip = l => l.replace(/^- \[( |x)\] ?/i, '').replace(/^- /, '');
  const lines = v.slice(from, to).split('\n');
  const isSame = l => prefix === '- ' ? BULLET_LINE.test(l) && !CHECK_LINE.test(l) : CHECK_LINE.test(l);
  const remove = lines.every(isSame);
  const result = lines.map(l => remove ? strip(l) : prefix + strip(l)).join('\n');
  ta.setRangeText(result, from, to, 'end');
  ta.focus();
  bodyChanged();
}
// Il tocco sui pulsanti non deve togliere il cursore dal testo né chiudere la tastiera.
$('fFormat').onpointerdown = e => e.preventDefault();
$('fFormat').onmousedown = e => e.preventDefault();
$('fFormat').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.marker) toggleMarker(b.dataset.marker);
  else toggleLinePrefix(b.dataset.prefix);
};
// A capo in un elenco: continua l'elenco; a capo su una voce vuota: lo chiude.
$('fBody').oninput = () => {
  const ta = $('fBody');
  const v = ta.value;
  const pos = ta.selectionStart;
  if (v[pos - 1] === '\n' && v.length === bodyLength + 1) {
    const prevStart = v.lastIndexOf('\n', pos - 2) + 1;
    const prev = v.slice(prevStart, pos - 1);
    const prefix = CHECK_LINE.test(prev) ? '- [ ] ' : BULLET_LINE.test(prev) ? '- ' : null;
    if (prefix) {
      const empty = !(CHECK_LINE.exec(prev) || BULLET_LINE.exec(prev)).slice(-1)[0].trim();
      if (empty) ta.setRangeText('', prevStart, pos, 'end');
      else ta.setRangeText(prefix, pos, pos, 'end');
    }
  }
  bodyChanged();
};

$('editor').onsubmit = async e => {
  e.preventDefault();
  const fromMemo = memoMove;
  const title = $('fTitle').value.trim();
  if (!title) { $('fTitle').focus(); return toast('Scrivi almeno il nome'); }
  const isNote = form.col === 'note';
  const rawLink = $('fLinkWrap').hidden ? '' : $('fLink').value.trim();
  const link = rawLink ? linkUrl(rawLink) : '';
  if (rawLink && !link) { $('fLink').focus(); return toast('Il link non sembra valido'); }
  const needsFile = colById(form.col).files && !colById(form.col).fileOptional && !form.file && !(editing && editing.fileId);
  if (needsFile) return toast('Scegli il file da salvare');
  let fileData = null;
  if (form.file) {
    const file = form.file;
    form.file = null; // Un secondo tocco su Salva non deve salvare il file due volte.
    try {
      fileData = await storeFile(file);
    } catch {
      form.file = file;
      return toast('Non riesco a salvare il file su questo dispositivo');
    }
  }
  addNewTag(); // Un tag scritto ma non ancora aggiunto non deve andare perso.
  const data = {
    col: form.col,
    title,
    body: $('fBody').value.trim(),
    maker: $('fMakerWrap').hidden ? '' : $('fMaker').value.trim(),
    place: $('fPlaceWrap').hidden ? '' : $('fPlace').value.trim(),
    extra: $('fExtraWrap').hidden ? '' : $('fExtra').value.trim(),
    link,
    ...fileData,
    kind: form.kind,
    rating: form.done && !isNote ? form.rating : 0,
    done: form.done,
    tags: isNote ? parseTags($('fTags').value) : form.tags,
    category: isNote ? form.category : null,
    priority: isNote ? form.priority : null,
    due: isNote && $('fDue').value ? new Date($('fDue').value).getTime() : null,
  };
  // Cerco per id: nel frattempo la lista può essere stata aggiornata dalla sync.
  let note = editing && byId(editing.id);
  if (note) Object.assign(note, data);
  else notes.push(note = { id: uid(), created: Date.now(), ...data });
  closeSheet();
  ui.tab = ui.col === note.col ? (note.done ? 'done' : 'todo') : ui.tab;
  changed(note);
  if (fileData) runBackup();
  if (fromMemo) removeFromMemo(fromMemo);
};
$('deleteBtn').onclick = () => {
  const removed = byId(editing.id) || editing;
  notes = notes.filter(n => n.id !== removed.id);
  save(); closeSheet(); render();
  sync.remove(removed.id);
  if (removed.eventId) postScript({ kind: 'evento', eventId: removed.eventId }).catch(() => {});
  toast('Eliminato', 'Annulla', () => { removed.eventId = null; removed.eventSig = ''; notes.push(removed); changed(removed); });
};

// ===== Eventi principali =====
$('addBtn').onclick = () => {
  pendingShare = null;
  if (ui.col) return openEditor(ui.col);
  openPicker('Cosa vuoi segnare?');
};
$('pickerList').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  openEditor(b.dataset.pick);
  if (pendingShare) { fillShared(pendingShare, colById(b.dataset.pick)); pendingShare = null; }
};
$('backBtn').onclick = () => {
  if (history.state && history.state.inApp) history.back();
  else go(null);
};
$('search').oninput = e => { ui.q = e.target.value.trim(); render(); };
// Le password restano in Bitwarden: su Android provo ad aprire la sua app, altrimenti il sito.
function openPasswords() {
  if (/android/i.test(navigator.userAgent)) {
    location.href = 'intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.x8bit.bitwarden;S.browser_fallback_url=' + encodeURIComponent('https://vault.bitwarden.com') + ';end';
  } else {
    window.open('https://vault.bitwarden.com', '_blank', 'noopener');
  }
}
$('tiles').onclick = e => {
  if (tileDrag.justEnded) return;
  const b = e.target.closest('[data-go]'); if (!b) return;
  if (colById(b.dataset.go).external) return openPasswords();
  go(b.dataset.go);
};

// Riordino: tieni premuto un riquadro finché si solleva, poi trascinalo.
const LONG_PRESS_MS = 350;
const MOVE_TOLERANCE = 10;
const tileDrag = { tile: null, timer: null, x: 0, y: 0, justEnded: false };
function cancelLongPress() { clearTimeout(tileDrag.timer); tileDrag.timer = null; }
$('tiles').addEventListener('pointerdown', e => {
  const tile = e.target.closest('.tile');
  if (!tile || (e.pointerType === 'mouse' && e.button !== 0)) return;
  tileDrag.x = e.clientX; tileDrag.y = e.clientY;
  cancelLongPress();
  tileDrag.timer = setTimeout(() => {
    tileDrag.timer = null;
    tileDrag.tile = tile;
    tile.classList.add('dragging');
    document.body.classList.add('reordering');
    if (navigator.vibrate) navigator.vibrate(15);
  }, LONG_PRESS_MS);
});
document.addEventListener('pointermove', e => {
  if (tileDrag.timer && Math.hypot(e.clientX - tileDrag.x, e.clientY - tileDrag.y) > MOVE_TOLERANCE) cancelLongPress();
  if (!tileDrag.tile) return;
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tile');
  if (!over || over === tileDrag.tile) return;
  const tiles = [...$('tiles').children];
  const after = tiles.indexOf(tileDrag.tile) < tiles.indexOf(over);
  $('tiles').insertBefore(tileDrag.tile, after ? over.nextSibling : over);
});
// Durante il trascinamento la pagina non deve scorrere (serve un ascolto non "passive").
document.addEventListener('touchmove', e => { if (tileDrag.tile) e.preventDefault(); }, { passive: false });
$('tiles').addEventListener('contextmenu', e => e.preventDefault());
function endTileDrag() {
  cancelLongPress();
  if (!tileDrag.tile) return;
  tileDrag.tile.classList.remove('dragging');
  document.body.classList.remove('reordering');
  tileDrag.tile = null;
  localStorage.setItem(ORDER_KEY, JSON.stringify([...$('tiles').children].map(t => t.dataset.go)));
  // Il dito che si alza genera anche un tocco: non deve aprire la sezione.
  tileDrag.justEnded = true;
  setTimeout(() => { tileDrag.justEnded = false; }, 300);
}
document.addEventListener('pointerup', endTileDrag);
document.addEventListener('pointercancel', endTileDrag);
$('hint').onclick = () => {
  if ($('hint').dataset.go === 'cal') return openCalSheet();
  if ($('hint').dataset.go === 'backup') return openBackupSheet();
  if (ui.col === 'documenti') return openBackupSheet();
  if (ui.col === 'note') return;
  resetFilters(); ui.cat = 'lavoro'; go('note', true);
};
$('statusTabs').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  ui.tab = b.dataset.tab; render();
};
$('chips').onclick = $('placeChips').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.editCats) return openCatSheet();
  const { kind, cat, tag, place } = b.dataset;
  if (kind) ui.kind = ui.kind === kind ? null : kind;
  if (cat) ui.cat = ui.cat === cat ? null : cat;
  if (tag) ui.tag = ui.tag === tag ? null : tag;
  if (place) ui.place = sameText(ui.place, place) ? null : place;
  render();
};
$('list').onclick = e => {
  const box = e.target.closest('[data-box]');
  if (box) { ui.cat = box.dataset.box; render(); window.scrollTo(0, 0); return; }
  const li = e.target.closest('.item'); if (!li) return;
  const id = li.dataset.id;
  const note = byId(id);
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'toggle') {
    note.done = !note.done;
    if (!note.done) note.rating = 0;
    changed(note);
    const col = colById(colOf(note));
    if (!note.done) return;
    if (col.id === 'note') toast('Completata ✓', 'Annulla', () => {
      const n = byId(id); if (n) { n.done = false; changed(n); }
    });
    else toast(`Spostato in ${col.done}`, 'Dai un voto', () => {
      const n = byId(id); if (n) openEditor(col.id, n);
    });
  } else if (act === 'check') {
    toggleCheckLine(note, +e.target.closest('[data-line]').dataset.line);
  } else if (act === 'open') {
    openFile(note);
  } else if (act === 'edit') {
    openView(note);
  }
};

// ===== Menu: backup =====
$('menuBtn').onclick = () => {
  renderSummaryBtn();
  $('appVersion').textContent = `Jaccodo · versione ${APP_VERSION}`;
  $('stats').textContent = COLLECTIONS.filter(c => !c.external).map(c => `${c.label}: ${inCol(c.id).length}`).join(' · ');
  showSheet('menu');
};
$('reorderBtn').onclick = () => {
  closeSheet();
  if (ui.col) go(null);
  toast('Tieni premuto un riquadro e trascinalo dove vuoi');
};
$('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify([...notes, { id: CAT_DOC, ...catDoc }], null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `jaccodo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
$('importInput').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await readBackupText(file));
    if (!Array.isArray(data)) throw new Error();
    const cats = data.find(n => n && n.id === CAT_DOC);
    if (cats && cats.updated > catDoc.updated) window.noteApp.setCategories(cats);
    const imported = [];
    let skipped = 0;
    for (const { fileBase64, importOnce, ...item } of data.filter(n => n && n.id && n.title)) {
      // Le note portate da altre app entrano una volta sola e non sovrascrivono quelle già scritte.
      if (importOnce && (byId(item.id) || notes.some(n => colOf(n) === item.col && sameText(n.title, item.title)))) { skipped++; continue; }
      const n = { tags: [], body: '', ...item };
      if (fileBase64) {
        const bytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
        Object.assign(n, await storeFile(new File([bytes], item.fileName, { type: item.fileType })));
      }
      imported.push(n);
    }
    const merged = new Map(notes.map(n => [n.id, n]));
    imported.forEach(n => merged.set(n.id, n));
    notes = [...merged.values()];
    save(); closeSheet(); render();
    imported.forEach(n => sync.push(n));
    toast(`Importati ${imported.length} elementi` + (skipped ? ` · ${skipped} già presenti` : ''));
    runBackup();
  } catch (err) {
    if (!$('pwdSheet').hidden) closeSheet();
    toast(err.message === 'password' ? 'Password sbagliata' : err.message === 'annullato' ? 'Importazione annullata' : 'File non valido');
  }
  e.target.value = '';
};
$('clearDoneBtn').onclick = () => {
  // Solo le note: ristoranti, vini ecc. "fatti" sono ricordi da tenere.
  const toClear = inCol('note').filter(x => x.done);
  if (!toClear.length) return toast('Nessuna nota completata');
  if (!confirm(`Eliminare ${toClear.length} note completate?`)) return;
  toClear.forEach(x => sync.remove(x.id));
  notes = notes.filter(x => !toClear.includes(x));
  save(); closeSheet(); render();
};

// ===== Categorie delle note =====
let catDraft = [];
function readCatDraft() {
  $('catList').querySelectorAll('input').forEach((input, i) => { catDraft[i].label = input.value; });
}
function renderCatDraft() {
  $('catList').innerHTML = catDraft.map(c => `<div class="cat-row">
    <input value="${esc(c.label)}" autocomplete="off" aria-label="Nome della categoria">
    <button type="button" class="icon-btn" data-del="${esc(c.id)}" aria-label="Elimina ${esc(c.label)}">🗑️</button>
  </div>`).join('');
}
function openCatSheet() {
  catDraft = catDoc.list.map(c => ({ ...c }));
  $('catNew').value = '';
  renderCatDraft();
  showSheet('catSheet');
}
function addCatDraft() {
  const label = $('catNew').value.trim();
  if (!label) return;
  readCatDraft();
  catDraft.push({ id: uid(), label });
  $('catNew').value = '';
  renderCatDraft();
}
$('catList').onclick = e => {
  const id = e.target.closest('[data-del]')?.dataset.del;
  if (!id) return;
  readCatDraft();
  const used = inCol('note').filter(n => n.category === id).length;
  if (used && !confirm(`Le note di questa categoria (${used}) non verranno cancellate, ma resteranno senza categoria. Eliminarla?`)) return;
  catDraft = catDraft.filter(c => c.id !== id);
  renderCatDraft();
};
$('catNewBtn').onclick = addCatDraft;
$('catNew').onkeydown = e => {
  if (e.key === 'Enter') { e.preventDefault(); addCatDraft(); }
};
$('catSave').onclick = () => {
  readCatDraft();
  addCatDraft(); // Una categoria scritta ma non ancora aggiunta non deve andare persa.
  const list = catDraft.map(c => ({ ...c, label: c.label.trim() }));
  if (list.some(c => !c.label)) return toast('Ogni categoria deve avere un nome');
  if (new Set(list.map(c => c.label.toLowerCase())).size < list.length) return toast('Ci sono due categorie con lo stesso nome');
  const kept = new Set(list.map(c => c.id));
  const removed = new Set(catDoc.list.filter(c => !kept.has(c.id)).map(c => c.id));
  closeSheet();
  saveCategories(list);
  inCol('note').filter(n => removed.has(n.category)).forEach(n => { n.category = null; changed(n); });
};

// ===== Agenda (Google Calendar) =====
// Un piccolo script sull'account Google legge il calendario e lo passa all'app.
// Il suo indirizzo è privato: resta su questo dispositivo, mai nel codice pubblico.
const CAL_URL_KEY = 'le-mie-cose-calendario';
const CAL_CACHE_KEY = 'le-mie-cose-agenda';
const CAL_URL = /^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/exec$/;
const CAL_REFRESH = 10 * 60 * 1000;
const CAL_PREVIEW = 8;
const CAL_SCRIPT = `function doGet() {
  var from = new Date();
  var to = new Date(from.getTime() + 60 * 24 * 60 * 60 * 1000);
  var events = [];
  CalendarApp.getAllCalendars().forEach(function (cal) {
    if (!cal.isSelected()) return;
    var zone = cal.getTimeZone();
    cal.getEvents(from, to).forEach(function (e) {
      var item = { title: e.getTitle(), place: e.getLocation(), color: cal.getColor() };
      if (e.isAllDayEvent()) {
        item.startDay = Utilities.formatDate(e.getAllDayStartDate(), zone, 'yyyy-MM-dd');
        item.endDay = Utilities.formatDate(e.getAllDayEndDate(), zone, 'yyyy-MM-dd');
      } else {
        item.start = e.getStartTime().getTime();
        item.end = e.getEndTime().getTime();
      }
      events.push(item);
    });
  });
  return ContentService.createTextOutput(JSON.stringify({ events: events }))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.kind === 'evento') {
    // Promemoria delle scadenze: un evento sul calendario principale, con avviso all'ora giusta.
    var cal = CalendarApp.getDefaultCalendar();
    var old = data.eventId ? cal.getEventById(data.eventId) : null;
    if (old) old.deleteEvent();
    var out = { ok: true };
    if (data.title) {
      var start = new Date(data.start);
      var ev = cal.createEvent(data.title, start, new Date(start.getTime() + 30 * 60 * 1000), { description: data.description || '' });
      ev.removeAllReminders();
      ev.addPopupReminder(0);
      out.eventId = ev.getId();
    }
    return ContentService.createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var found = DriveApp.getFoldersByName('Jaccodo backup');
  var folder = found.hasNext() ? found.next() : DriveApp.createFolder('Jaccodo backup');
  var same = data.name ? folder.getFilesByName(data.name) : null;
  if (data.kind === 'dati') {
    if (same.hasNext()) same.next().setContent(data.text);
    else folder.createFile(data.name, data.text, 'application/json');
  } else if (data.kind === 'file' && !same.hasNext()) {
    folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.base64), data.type, data.name));
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
// Da eseguire una volta nell'editor: fa chiedere a Google il permesso di creare file su Drive.
function autorizzaDrive() {
  if (!DriveApp.getFoldersByName('Jaccodo backup').hasNext()) DriveApp.createFolder('Jaccodo backup');
}
// Da eseguire una volta nell'editor: fa chiedere a Google il permesso di creare i promemoria.
function autorizzaCalendario() {
  CalendarApp.getDefaultCalendar().createEvent('Jaccodo prova', new Date(), new Date()).deleteEvent();
}`;
const agenda = { events: [], updated: 0, loading: false, error: false, showAll: false };
try { Object.assign(agenda, JSON.parse(localStorage.getItem(CAL_CACHE_KEY)) || {}); } catch {}

const calUrl = () => localStorage.getItem(CAL_URL_KEY) || '';
const startOfDay = ms => new Date(ms).setHours(0, 0, 0, 0);
// Gli eventi di un giorno intero arrivano come data, gli altri come istante preciso.
function upcomingEvents() {
  const now = Date.now();
  return agenda.events.map(e => ({
    ...e,
    allDay: !!e.startDay,
    start: e.startDay ? new Date(e.startDay + 'T00:00').getTime() : e.start,
    end: e.startDay ? new Date(e.endDay + 'T00:00').getTime() : e.end,
  })).filter(e => e.end > now).sort((a, b) => a.start - b.start || b.allDay - a.allDay);
}
function dayLabel(day) {
  const diff = Math.round((day - startOfDay(Date.now())) / 864e5);
  if (diff === 0) return 'Oggi';
  if (diff === 1) return 'Domani';
  return new Date(day).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
}
const clock = ms => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
function dayUrl(day) {
  const d = new Date(day);
  return `https://calendar.google.com/calendar/r/day/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
function agendaRow(e, day) {
  const color = /^#[0-9a-f]{6}$/i.test(e.color) ? e.color : 'var(--muted)';
  return `<a class="agenda-item" href="${dayUrl(day)}" target="_blank" rel="noopener">
    <span class="agenda-dot" style="background:${color}"></span>
    <span class="agenda-time">${e.allDay ? 'Tutto il giorno' : clock(e.start)}</span>
    <span class="agenda-text">
      <span class="agenda-title">${esc(String(e.title || '(Senza titolo)'))}</span>
      ${e.place ? `<span class="agenda-place">${esc(String(e.place))}</span>` : ''}
    </span>
  </a>`;
}
function renderAgenda() {
  const box = $('agenda');
  if (!calUrl()) {
    box.innerHTML = `<button class="agenda-connect" data-cal="setup">📅 Collega Google Calendar</button>`;
    return;
  }
  const events = upcomingEvents();
  const shown = agenda.showAll ? events : events.slice(0, CAL_PREVIEW);
  let lastDay = null;
  const rows = shown.map(e => {
    // Un evento di più giorni già iniziato compare sotto Oggi.
    const day = Math.max(startOfDay(e.start), startOfDay(Date.now()));
    const head = day !== lastDay ? `<div class="agenda-day">${esc(dayLabel(day))}</div>` : '';
    lastDay = day;
    return head + agendaRow(e, day);
  }).join('');
  const message = agenda.error ? 'Non riesco ad aggiornare il calendario.'
    : agenda.loading ? 'Aggiorno…'
    : agenda.updated ? `Aggiornato: ${dayLabel(startOfDay(agenda.updated)).toLowerCase()} alle ${clock(agenda.updated)}` : '';
  box.innerHTML = `
    <div class="agenda-head">
      <h2>Prossimi appuntamenti</h2>
      <button class="icon-btn" data-cal="refresh" aria-label="Aggiorna il calendario">↻</button>
    </div>
    ${rows ? `<div class="agenda-card">${rows}</div>` : (agenda.updated ? '<p class="muted small">Nessun appuntamento nei prossimi 60 giorni.</p>' : '')}
    ${events.length > shown.length ? `<button class="link-btn" data-cal="more">Mostra altri ${events.length - shown.length}</button>` : ''}
    <p class="muted small agenda-status ${agenda.error ? 'agenda-error' : ''}">${esc(message)}
      ${agenda.error ? '<button class="link-btn" data-cal="setup">Controlla il collegamento</button>' : ''}</p>`;
}
function showAgenda() {
  if (!$('agenda').hidden) renderAgenda();
}
async function loadAgenda(force) {
  const url = calUrl();
  if (!url || agenda.loading || (!force && Date.now() - agenda.updated < CAL_REFRESH)) return;
  agenda.loading = true;
  agenda.error = false;
  showAgenda();
  try {
    const data = await (await fetch(url)).json();
    if (!Array.isArray(data.events)) throw new Error('Risposta non valida');
    agenda.events = data.events;
    agenda.updated = Date.now();
    localStorage.setItem(CAL_CACHE_KEY, JSON.stringify({ events: agenda.events, updated: agenda.updated }));
  } catch {
    agenda.error = true;
  }
  agenda.loading = false;
  showAgenda();
}
function forgetAgenda() {
  localStorage.removeItem(CAL_URL_KEY);
  localStorage.removeItem(CAL_CACHE_KEY);
  Object.assign(agenda, { events: [], updated: 0, error: false, showAll: false });
}
function openCalSheet() {
  $('calCode').value = CAL_SCRIPT;
  $('calUrl').value = calUrl();
  $('calForget').hidden = !calUrl();
  showSheet('calSheet');
  $('calSheet').querySelector('.sheet-body').scrollTop = 0;
}
$('agenda').onclick = e => {
  const act = e.target.closest('[data-cal]')?.dataset.cal;
  if (act === 'setup') openCalSheet();
  if (act === 'refresh') loadAgenda(true);
  if (act === 'more') { agenda.showAll = true; renderAgenda(); }
};
$('calBtn').onclick = openCalSheet;
$('calCopy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(CAL_SCRIPT);
    toast('Codice copiato');
  } catch {
    $('calCode').select();
    toast('Tieni premuto sul testo e copialo');
  }
};
$('calSave').onclick = () => {
  const url = $('calUrl').value.trim();
  if (!CAL_URL.test(url)) { $('calUrl').focus(); return toast('Incolla l\'URL che finisce con /exec'); }
  if (url !== calUrl()) forgetAgenda();
  localStorage.setItem(CAL_URL_KEY, url);
  closeSheet();
  showAgenda();
  loadAgenda(true);
};
$('calForget').onclick = () => {
  forgetAgenda();
  closeSheet();
  showAgenda();
  toast('Calendario scollegato');
};
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  showAgenda();
  loadAgenda();
});

// ===== Documentazione: file sul dispositivo =====
// I file restano nel browser (IndexedDB); nelle note vanno solo titolo, tag e nome del file.
const FILE_DB = 'jaccodo-file';
const FILE_STORE = 'files';
const localFiles = new Set();
// Versione 2: oltre ai file, "inbox" per Condividi e "keys" per la password del backup.
function fileStore(mode, action, store = FILE_STORE) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(FILE_DB, 2);
    open.onupgradeneeded = () => [FILE_STORE, 'inbox', KEY_STORE].forEach(name => {
      if (!open.result.objectStoreNames.contains(name)) open.result.createObjectStore(name);
    });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(store, mode);
      const req = action(tx.objectStore(store));
      tx.oncomplete = () => { db.close(); resolve(req.result); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}
const putFile = (id, file) => fileStore('readwrite', s => s.put(file, id));
const getFile = id => fileStore('readonly', s => s.get(id));
const deleteFile = id => fileStore('readwrite', s => s.delete(id));
const allFileIds = () => fileStore('readonly', s => s.getAllKeys());
const docNotes = () => notes.filter(n => n.fileId);

async function storeFile(file) {
  const fileId = uid();
  await putFile(fileId, file);
  localFiles.add(fileId);
  // Chiedo al browser di non cancellare i file quando serve spazio.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const dot = file.name.lastIndexOf('.');
  const base = dot > 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot > 0 ? file.name.slice(dot) : '';
  return {
    fileId, fileName: file.name, fileType: file.type || 'application/octet-stream', fileSize: file.size,
    backupName: `${base} (${fileId.slice(-4)})${ext}`, backedUp: false,
  };
}
function fileBadge(n) {
  if (!localFiles.has(n.fileId)) return '<span class="badge">📵 File non su questo dispositivo</span>';
  if (n.backedUp) return '<span class="badge">☁️ Copia su Drive</span>';
  return backup.on ? '<span class="badge">⏳ Copia in attesa</span>' : '';
}
$('fFile').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  form.file = file;
  $('fFileName').textContent = file.name;
  if (!$('fTitle').value.trim()) $('fTitle').value = file.name.replace(/\.[^.]+$/, '');
};

// Apertura di un file
let fileUrl = null;
async function openFile(n) {
  if (!localFiles.has(n.fileId)) return toast('Il file è sul dispositivo dove l\'hai caricato');
  const file = await getFile(n.fileId).catch(() => null);
  if (!file) return toast('Non riesco ad aprire il file');
  if (fileUrl) URL.revokeObjectURL(fileUrl);
  fileUrl = URL.createObjectURL(file);
  const isImage = (n.fileType || '').startsWith('image/');
  $('fileTitle').textContent = n.title;
  $('fileInfo').textContent = n.fileName;
  $('fileImg').hidden = !isImage;
  if (isImage) $('fileImg').src = fileUrl; else $('fileImg').removeAttribute('src');
  $('fileDownload').href = fileUrl;
  $('fileDownload').download = n.fileName;
  const shareable = new File([file], n.fileName, { type: n.fileType });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [shareable] }));
  $('fileShare').hidden = !canShare;
  $('fileShare').onclick = () => navigator.share({ files: [shareable], title: n.title }).catch(() => {});
  showSheet('fileSheet');
}

// ===== Backup automatico su Drive =====
// Usa lo stesso script del calendario: i file finiscono nella cartella "Jaccodo backup" del tuo Drive.
const BACKUP_KEY = 'jaccodo-backup';
const BACKUP_MAX = 25 * 1024 * 1024; // Oltre questa misura lo script di Google non riceve il file.
const DATA_EVERY = 24 * 60 * 60 * 1000;
const backup = { on: false, last: 0, dataAt: 0, running: false, error: false };
try { Object.assign(backup, JSON.parse(localStorage.getItem(BACKUP_KEY)) || {}); } catch {}
function saveBackupState() {
  localStorage.setItem(BACKUP_KEY, JSON.stringify({ on: backup.on, last: backup.last, dataAt: backup.dataAt }));
}
const toBackup = () => docNotes().filter(n => n.fileId && !n.backedUp && localFiles.has(n.fileId));
const tooBig = n => n.fileSize > BACKUP_MAX;
async function postScript(payload) {
  const res = await fetch(calUrl(), { method: 'POST', body: JSON.stringify(payload) });
  const data = await res.json();
  if (!data.ok) throw new Error('Risposta non valida');
  return data;
}
const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1] || '');
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});
async function runBackup() {
  if (!backup.on || !backupKey || !calUrl() || backup.running || !navigator.onLine) return;
  backup.running = true;
  let sent = 0;
  try {
    for (const { id } of toBackup().filter(n => !tooBig(n))) {
      const n = byId(id);
      if (!n) continue;
      const { fileId } = n;
      const file = await getFile(fileId);
      await postScript({ kind: 'file', name: n.backupName + '.jaccodo', type: 'application/octet-stream', base64: await encryptedBase64(new Uint8Array(await file.arrayBuffer())) });
      const current = byId(id);
      if (current && current.fileId === fileId) { current.backedUp = true; changed(current); }
      sent++;
    }
    // Una copia di titoli, tag e appunti: serve per ricostruire tutto su un telefono nuovo.
    if (sent || Date.now() - backup.dataAt > DATA_EVERY) {
      await postScript({ kind: 'dati', name: 'Jaccodo-dati.jaccodo', text: await encryptedBase64(new TextEncoder().encode(JSON.stringify([...notes, { id: CAT_DOC, ...catDoc }]))) });
      backup.dataAt = Date.now();
    }
    backup.last = Date.now();
    backup.error = false;
  } catch {
    backup.error = true;
  }
  backup.running = false;
  saveBackupState();
  render();
  if (!$('backupSheet').hidden) renderBackupStatus();
}
function backupHint() {
  if (!docNotes().length) return '';
  if (!backup.on) return '☁️ Attiva il backup automatico su Drive';
  if (!backupKey) return '🔒 Imposta la password del backup su Drive';
  if (backup.error) return `⚠️ Backup non riuscito: ${toBackup().length} file in attesa. Tocca per controllare`;
  return '';
}
function renderBackupStatus() {
  const waiting = toBackup();
  const big = waiting.filter(tooBig).length;
  const missing = docNotes().filter(n => n.fileId && !localFiles.has(n.fileId)).length;
  const lines = [
    backupKey ? '🔒 Protetto da password.' : '🔓 Prima imposta una password: senza, il backup non parte.',
    !backup.on ? 'Backup non attivo su questo dispositivo.'
      : backup.error ? 'L\'ultimo backup non è riuscito: riproverò da solo.'
      : backup.last ? `Attivo. Ultimo controllo: ${dayLabel(startOfDay(backup.last)).toLowerCase()} alle ${clock(backup.last)}.` : 'Attivo.',
    backup.on && waiting.length ? `File in attesa: ${waiting.length}.` : '',
    big ? `${big} file superano i 25 MB e non vengono copiati.` : '',
    missing ? `File non presenti su questo dispositivo: ${missing}.` : '',
  ];
  $('backupStatus').textContent = lines.filter(Boolean).join(' ');
  $('backupCode').value = CAL_SCRIPT;
  $('backupOn').textContent = backup.on ? 'Riprova adesso' : 'Attiva il backup';
  $('backupOff').hidden = !backup.on;
  $('backupPwdSave').textContent = backupKey ? 'Cambia la password' : 'Imposta la password';
  $('backupRelinkWrap').hidden = !missing;
}
function openBackupSheet() {
  renderBackupStatus();
  showSheet('backupSheet');
}
$('backupBtn').onclick = openBackupSheet;
$('backupCopy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(CAL_SCRIPT);
    toast('Codice copiato');
  } catch {
    $('backupCode').select();
    toast('Tieni premuto sul testo e copialo');
  }
};
$('backupOn').onclick = async () => {
  if (!calUrl()) { toast('Prima collega Google Calendar'); return openCalSheet(); }
  if (!backupKey) { $('backupPwd').focus(); return toast('Prima imposta la password del backup'); }
  $('backupOn').disabled = true;
  try {
    await postScript({ kind: 'ping' });
    backup.on = true;
    backup.error = false;
    saveBackupState();
    toast('Backup attivo');
    await runBackup();
  } catch {
    toast('Non funziona ancora: aggiorna lo script e crea una nuova versione');
  }
  $('backupOn').disabled = false;
  render();
  renderBackupStatus();
};
$('backupOff').onclick = () => {
  backup.on = false;
  backup.error = false;
  saveBackupState();
  render();
  renderBackupStatus();
};
// Su un dispositivo nuovo: scarichi i file dal Drive e l'app li rimette al loro posto.
$('backupRelink').onchange = async e => {
  let linked = 0;
  let failed = 0;
  let password = null;
  for (const file of e.target.files) {
    // Le copie protette finiscono con .jaccodo: le apro con la password del backup.
    const encrypted = file.name.endsWith('.jaccodo');
    const name = encrypted ? file.name.slice(0, -'.jaccodo'.length) : file.name;
    const n = docNotes().find(x => x.fileId && !localFiles.has(x.fileId) && (x.backupName === name || x.fileName === name));
    if (!n) continue;
    try {
      let content = file;
      if (encrypted) {
        if (password === null) password = await askPassword('I file del backup sono protetti: scrivi la password.');
        if (password === null) break;
        content = new File([await decryptBytes(new Uint8Array(await file.arrayBuffer()), password)], n.fileName, { type: n.fileType });
      }
      await putFile(n.fileId, content);
      localFiles.add(n.fileId);
      linked++;
    } catch {
      failed++;
    }
  }
  e.target.value = '';
  if (password !== null) closeSheet();
  toast(`File ricollegati: ${linked}` + (failed ? ` · ${failed} non aperti (password sbagliata?)` : ''));
  render();
  renderBackupStatus();
};
window.addEventListener('online', runBackup);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') runBackup();
});
async function initFiles() {
  backupKey = await fileStore('readonly', s => s.get('backup'), KEY_STORE).catch(() => null) || null;
  try {
    const ids = await allFileIds();
    ids.forEach(id => localFiles.add(id));
    // I file dei documenti eliminati si cancellano qui: fino ad ora "Annulla" poteva recuperarli.
    // Se non vedo nessun documento non tocco niente, per non perdere file per un errore di lettura.
    const used = new Set(docNotes().map(n => n.fileId));
    if (used.size) await Promise.all(ids.filter(id => !used.has(id)).map(id => { localFiles.delete(id); return deleteFile(id); }));
  } catch {}
  render();
  runBackup();
}

// ===== Memo della home =====
// Viaggia con le categorie, così arriva sugli altri dispositivi e finisce nei backup.
let memoTimer = null;
function sizeMemo() {
  const memo = $('memo');
  memo.style.height = 'auto';
  memo.style.height = memo.scrollHeight + 'px';
}
function renderMemo() {
  if (document.activeElement !== $('memo')) $('memo').value = catDoc.memo || '';
  sizeMemo();
}
function pushMemo() {
  if (!memoTimer) return;
  clearTimeout(memoTimer);
  memoTimer = null;
  sync.pushCategories(catDoc);
}
$('memo').oninput = () => {
  catDoc = { ...catDoc, memo: $('memo').value, updated: Date.now() };
  localStorage.setItem(CAT_KEY, JSON.stringify(catDoc));
  sizeMemo();
  $('memoToNote').hidden = !$('memo').value.trim();
  clearTimeout(memoTimer);
  memoTimer = setTimeout(pushMemo, 1000);
};
$('memo').onblur = pushMemo;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') pushMemo();
});
$('summaryBtn').onclick = () => {
  summaryOn = !summaryOn;
  localStorage.setItem(SUMMARY_KEY, summaryOn ? 'on' : 'off');
  renderSummaryBtn();
  render();
};

// ===== Lettura di una scheda =====
// Aprendo una scheda si legge soltanto: un tocco sul contenuto apre la modifica, scorrere no.
const TAP_TOLERANCE = 10;
const SCROLL_PAUSE = 250;
const viewTap = { x: 0, y: 0, top: 0, scrolledAt: 0 };
let viewId = null;
function renderView(n) {
  const c = colById(colOf(n));
  const cat = catDoc.list.find(x => x.id === n.category);
  const prio = PRIORITIES.find(p => p.id === n.priority);
  const sub = [n.kind, n.maker, n.place, n.extra].filter(Boolean).join(' · ');
  const map = mapUrl(n, c);
  const badges = [
    cat ? `<span class="badge">${esc(cat.label)}</span>` : '',
    prio ? `<span class="badge" style="color:var(--${prio.id})">● ${prio.label}</span>` : '',
    dueBadge(n),
    ...(n.tags || []).map(t => `<span class="badge tag">${c.tagPresets ? '' : '#'}${esc(t)}</span>`),
  ].join('');
  const actions = [
    n.fileId ? `<button type="button" class="chip" data-view="file">📄 Apri il file</button>` : '',
    n.link ? `<a class="chip" href="${esc(n.link)}" target="_blank" rel="noopener">🔗 Apri il link</a>` : '',
    map ? `<a class="chip" href="${esc(map)}" target="_blank" rel="noopener">📍 Apri in Maps</a>` : '',
  ].join('');
  document.body.dataset.col = c.id;
  $('viewCol').textContent = c.label;
  $('viewContent').innerHTML = `
    <h2 class="view-title">${esc(n.title)}</h2>
    ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
    ${ratingHtml(n.rating)}
    ${badges ? `<div class="meta">${badges}</div>` : ''}
    ${actions ? `<div class="view-actions">${actions}</div>` : ''}
    ${n.body ? `<div class="view-text">${formatBody(n.body, [], true)}</div>` : ''}
    <p class="muted small view-hint">Tocca per modificare</p>`;
}
function openView(note) {
  viewId = note.id;
  renderView(note);
  showSheet('viewSheet');
  $('viewBody').scrollTop = 0;
}
$('viewBody').addEventListener('scroll', () => { viewTap.scrolledAt = Date.now(); });
$('viewBody').addEventListener('pointerdown', e => {
  viewTap.x = e.clientX; viewTap.y = e.clientY; viewTap.top = $('viewBody').scrollTop;
});
$('viewBody').onclick = e => {
  const note = byId(viewId);
  if (!note) return;
  const box = e.target.closest('[data-act="check"]');
  if (box) { toggleCheckLine(note, +box.dataset.line); return renderView(note); }
  if (e.target.closest('[data-view="file"]')) return openFile(note);
  if (e.target.closest('a, button')) return;
  const moved = Math.hypot(e.clientX - viewTap.x, e.clientY - viewTap.y) > TAP_TOLERANCE;
  const scrolled = $('viewBody').scrollTop !== viewTap.top || Date.now() - viewTap.scrolledAt < SCROLL_PAUSE;
  if (moved || scrolled || String(getSelection()).trim()) return;
  openEditor(colOf(note), note);
};

// Password del backup: i file vengono cifrati sul telefono prima di andare su Drive.
// La chiave resta in IndexedDB e non si può esportare; la password non viene salvata.
const KEY_STORE = 'keys';
const MAGIC = new TextEncoder().encode('JCD1');
let backupKey = null;
async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
// Formato: "JCD1" + sale (16) + iv (12) + dati cifrati. Il sale nel file permette di aprirlo da qualsiasi dispositivo.
async function encryptBytes(bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, backupKey.key, bytes));
  const out = new Uint8Array(4 + 16 + 12 + data.length);
  out.set(MAGIC, 0); out.set(backupKey.salt, 4); out.set(iv, 20); out.set(data, 32);
  return out;
}
async function decryptBytes(bytes, password) {
  if (MAGIC.some((b, i) => bytes[i] !== b)) throw new Error('formato');
  const key = await deriveKey(password, bytes.slice(4, 20));
  try {
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(20, 32) }, key, bytes.slice(32)));
  } catch {
    throw new Error('password');
  }
}
const encryptedBase64 = async bytes => toBase64(new Blob([await encryptBytes(bytes)]));
// Un backup scaricato da Drive può essere cifrato (testo base64) o un vecchio JSON in chiaro.
async function readBackupText(file) {
  const text = await file.text();
  if (/^\s*[[{]/.test(text)) return text;
  const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
  const password = await askPassword('Il backup è protetto: scrivi la password.');
  if (password === null) throw new Error('annullato');
  return new TextDecoder().decode(await decryptBytes(bytes, password));
}
let pwdResolve = null;
function askPassword(info) {
  $('pwdInfo').textContent = info;
  $('pwdInput').value = '';
  showSheet('pwdSheet');
  setTimeout(() => $('pwdInput').focus(), 50);
  return new Promise(resolve => { pwdResolve = resolve; });
}
$('pwdOk').onclick = () => {
  const resolve = pwdResolve;
  pwdResolve = null;
  if (resolve) resolve($('pwdInput').value);
};
$('pwdInput').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('pwdOk').click(); } };
$('backupPwdSave').onclick = async () => {
  const password = $('backupPwd').value;
  if (password.length < 8) return toast('Usa almeno 8 caratteri');
  if (password !== $('backupPwd2').value) return toast('Le due password non coincidono');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  backupKey = { key: await deriveKey(password, salt), salt };
  try {
    await fileStore('readwrite', s => s.put(backupKey, 'backup'), KEY_STORE);
  } catch {
    return toast('Non riesco a salvare la password su questo dispositivo');
  }
  $('backupPwd').value = $('backupPwd2').value = '';
  // Le copie già su Drive non sono protette: le rifaccio tutte cifrate.
  docNotes().forEach(n => { if (n.backedUp) { n.backedUp = false; changed(n); } });
  backup.dataAt = 0;
  saveBackupState();
  toast('Password del backup impostata');
  renderBackupStatus();
  runBackup();
};

// ===== Scadenze: promemoria su Google Calendar =====
// La notifica la manda l'app Google Calendar: per ogni scadenza c'è un evento con avviso all'ora giusta.
let dueTimer = null;
let dueRunning = false;
let dueError = false;
const dueSig = n => !n.done && n.due ? `${n.title}|${n.due}` : '';
const isLate = n => !n.done && !!n.due && n.due < Date.now();
const dueText = ms => `${dayLabel(startOfDay(ms))} ${clock(ms)}`;
const dueBadge = n => n.due && !n.done ? `<span class="badge ${isLate(n) ? 'late' : ''}">⏰ ${esc(dueText(n.due))}</span>` : '';
const toLocalInput = ms => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
function queueDueSync() {
  clearTimeout(dueTimer);
  dueTimer = setTimeout(syncDueEvents, 800);
}
async function syncDueEvents() {
  if (dueRunning || !calUrl() || !navigator.onLine) return;
  dueRunning = true;
  const before = dueError;
  try {
    for (const { id } of inCol('note').filter(n => dueSig(n) !== (n.eventSig || ''))) {
      const n = byId(id);
      if (!n) continue;
      const sig = dueSig(n);
      const res = await postScript({ kind: 'evento', eventId: n.eventId || '', title: sig ? '📝 ' + n.title : '', start: n.due, description: n.body || '' });
      if (sig && !res.eventId) throw new Error('Script senza promemoria');
      const current = byId(id);
      if (!current || dueSig(current) !== sig) continue; // Cambiata nel frattempo: la riprendo al prossimo giro.
      current.eventId = res.eventId || null;
      current.eventSig = sig;
      changed(current);
    }
    dueError = false;
  } catch {
    dueError = true;
  }
  dueRunning = false;
  if (dueError !== before) render();
}
function dueHint() {
  if (!inCol('note').some(n => n.due && !n.done)) return null;
  if (!calUrl()) return { text: '⏰ Collega Google Calendar per ricevere le notifiche delle scadenze', go: 'cal' };
  if (dueError) return { text: '⚠️ Le scadenze non arrivano su Google Calendar: aggiorna lo script', go: 'backup' };
  return null;
}
window.addEventListener('online', queueDueSync);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') queueDueSync();
});

// ===== Memo che diventa nota =====
// Prende la riga dove sei (o il testo selezionato); salvata la nota, la toglie dal memo.
function removeFromMemo(text) {
  const memo = catDoc.memo || '';
  const i = memo.indexOf(text);
  if (i < 0) return;
  // Tolgo anche l'a capo della riga, così non resta una riga vuota.
  let from = i;
  let to = i + text.length;
  if (memo[to] === '\n') to++;
  else if (from > 0 && memo[from - 1] === '\n') from--;
  const rest = memo.slice(0, from) + memo.slice(to);
  catDoc = { ...catDoc, memo: rest, updated: Date.now() };
  localStorage.setItem(CAT_KEY, JSON.stringify(catDoc));
  sync.pushCategories(catDoc);
  renderMemo();
}
// Il titolo nasce dalla prima riga, accorciata se è lunga.
function memoTitle(text) {
  const first = text.split('\n').map(l => l.replace(/^- (\[( |x)\] )?/i, '').replace(/\*\*|==/g, '').trim()).find(Boolean) || 'Memo';
  return first.length > TITLE_MAX ? compressTitle(first) : first.charAt(0).toUpperCase() + first.slice(1);
}
// Tutto il memo diventa una nota; salvata la nota, il memo si svuota.
$('memoToNote').onclick = () => {
  const text = $('memo').value.trim();
  if (!text) return toast('Il memo è vuoto');
  openEditor('note');
  memoMove = text;
  $('fTitle').value = memoTitle(text);
  $('fBody').value = text;
  bodyLength = $('fBody').value.length;
  renderBodyPreview();
};

// ===== Condividi → Jaccodo =====
// Il service worker riceve quello che condividi da un'altra app e lo lascia qui; tu scegli dove salvarlo.
let pendingShare = null;
function openPicker(title) {
  $('pickerTitle').textContent = title;
  $('pickerList').innerHTML = orderedCollections().filter(c => !c.external).map(c =>
    `<button data-pick="${c.id}"><span class="tile-icon">${c.icon}</span>${esc(c.add.replace(/^Nuov[oa] /, '').replace(/^./, m => m.toUpperCase()))}</button>`).join('');
  showSheet('picker');
}
function fillShared(item, col) {
  const file = (item.files || [])[0];
  const link = linkUrl(item.url) || (/https?:\/\//i.test(item.text) ? linkUrl(item.text) : '');
  const text = (item.text || '').replace(/https?:\/\/\S+/gi, '').trim();
  const title = (item.title || '').trim() || text.split('\n')[0] || (file ? file.name.replace(/\.[^.]+$/, '') : '') || (link ? new URL(link).hostname : '');
  $('fTitle').value = title.slice(0, 120);
  if (col.link) $('fLink').value = link;
  $('fBody').value = [text !== title ? text : '', !col.link ? link : ''].filter(Boolean).join('\n');
  bodyLength = $('fBody').value.length;
  renderBodyPreview();
  if (file && col.files) {
    form.file = file;
    $('fFileName').textContent = file.name;
  } else if (file) {
    toast('Per salvare il file scegli Documentazione o Appunti');
  }
}
async function checkShared() {
  if (!new URLSearchParams(location.search).has('shared')) return;
  history.replaceState(history.state, '', location.pathname + location.hash);
  const item = await fileStore('readwrite', s => { const req = s.get('share'); s.delete('share'); return req; }, 'inbox').catch(() => null);
  if (!item) return;
  pendingShare = item;
  openPicker('Dove lo salvo?');
}

// ===== Versione e aggiornamento automatico =====
// Quando il telefono scarica una versione nuova l'app si ricarica da sola, ma mai mentre stai scrivendo.
let updateReady = false;
const busyWriting = () => SHEETS.some(id => !$(id).hidden) || document.activeElement === $('memo');
function reloadIfReady() {
  if (updateReady && !busyWriting()) location.reload();
}
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // Prima installazione: niente da ricaricare.
    updateReady = true;
    reloadIfReady();
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reloadIfReady();
  });
  window.addEventListener('popstate', reloadIfReady);
  $('memo').addEventListener('blur', reloadIfReady);
}

// ===== Avvio =====
if (history.state && history.state.sheet) history.replaceState({ inApp: history.state.inApp }, '');
ui.col = colFromHash();
render();
loadAgenda();
initFiles();

checkShared();
syncDueEvents();
