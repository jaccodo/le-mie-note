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
  catDoc = { list: doc.list, updated: doc.updated };
  localStorage.setItem(CAT_KEY, JSON.stringify(catDoc));
  render();
}
function saveCategories(list) {
  storeCategories({ list, updated: Date.now() });
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
  replaceAll(list) { notes = list; save(); render(); },
  CAT_DOC,
  getCategories: () => catDoc,
  setCategories(doc) { if (Array.isArray(doc.list)) storeCategories(doc); },
};
function changed(note) {
  note.updated = Date.now();
  save(); render();
  sync.push(note);
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
const SHEETS = ['sheet', 'menu', 'picker', 'calSheet', 'catSheet'];
function hideSheets() {
  SHEETS.forEach(id => { $(id).hidden = true; });
  editing = null;
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
  return colById(id) ? id : null;
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
  return [n.title, n.body, n.maker, n.place, n.extra, n.link, n.kind, ...(n.tags || []).map(t => '#' + t)].filter(Boolean).join(' ').toLowerCase();
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
    || ((b.rating || 0) - (a.rating || 0))
    || (prioRank(a.priority) - prioRank(b.priority))
    || (b.updated - a.updated));
}

// ===== Render =====
function render() {
  const col = colById(ui.col);
  document.body.dataset.col = ui.col || '';
  $('heading').textContent = col ? col.label : 'Le mie cose';
  $('backBtn').hidden = !col;
  $('search').placeholder = col ? `Cerca in ${col.label.toLowerCase()}…` : 'Cerca in tutto…';

  const searching = !!ui.q;
  const home = !col && !searching;
  $('tiles').hidden = !home;
  if (home) renderTiles();
  $('agenda').hidden = !home;
  if (home) renderAgenda();
  renderTabs(col, searching);
  renderChips(col);
  renderHint(col, home);

  const words = ui.q.split(/\s+/).filter(Boolean);
  const shown = home ? [] : sorted(notes.filter(matches));
  $('list').innerHTML = shown.map(n => card(n, words, !col)).join('');

  $('empty').hidden = home || shown.length > 0;
  const filtering = ui.cat || ui.kind || ui.tag || ui.place;
  $('empty').textContent = searching ? `Nessun risultato per “${ui.q}”.`
    : filtering ? 'Niente con questi filtri.' : 'Ancora niente qui. Tocca + per aggiungere.';
}

function ratingHtml(r) {
  if (!r) return '';
  return `<div class="rating" aria-label="Voto ${r} su 5">${'★'.repeat(r)}<span class="off">${'★'.repeat(5 - r)}</span></div>`;
}
function card(n, words, showCol) {
  const c = colById(colOf(n));
  const cat = catDoc.list.find(x => x.id === n.category);
  const prio = PRIORITIES.find(p => p.id === n.priority);
  const sub = [n.kind, n.maker, n.place, n.extra].filter(Boolean).join(' · ');
  const mapUrl = c.maps && c.maps(n)
    ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([n.maker || n.title, n.place].filter(Boolean).join(' '))
    : null;
  return `
    <li class="item ${n.done ? 'done' : ''}" data-id="${n.id}" data-col="${c.id}">
      ${c.noStatus ? '' : `<button class="check" data-act="toggle" aria-label="${esc(n.done ? c.todo : c.done)}"></button>`}
      <div class="content" data-act="edit">
        <div class="title">${highlight(n.title, words)}</div>
        ${sub ? `<div class="sub">${highlight(sub, words)}</div>` : ''}
        ${ratingHtml(n.rating)}
        ${n.body ? `<div class="body ${hasList(n.body) ? 'full' : ''}">${formatBody(n.body, words, true)}</div>` : ''}
        <div class="meta">${[
          showCol ? `<span class="badge">${c.icon} ${esc(c.label)}</span>` : '',
          !ui.cat && cat ? `<span class="badge">${esc(cat.label)}</span>` : '',
          prio ? `<span class="badge" style="color:var(--${prio.id})">● ${prio.label}</span>` : '',
          ...(n.tags || []).map(t => `<span class="badge tag">${c.tagPresets ? '' : '#'}${esc(t)}</span>`),
        ].join('')}</div>
      </div>
      ${n.link ? `<a class="pin" href="${esc(n.link)}" target="_blank" rel="noopener" aria-label="Apri il link">🔗</a>` : ''}
      ${mapUrl ? `<a class="pin" href="${esc(mapUrl)}" target="_blank" rel="noopener" aria-label="Apri in Maps">📍</a>` : ''}
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
    const count = !list.length ? 'Ancora vuoto' : c.noStatus ? `${c.todo} ${open}` : `${c.todo} ${open} · ${c.done} ${done}`;
    return `<button class="tile" data-go="${c.id}">
      <span class="tile-icon">${c.icon}</span>
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
    if (col.id === 'note') html = '<button class="chip" data-edit-cats="1">✎ Categorie</button>'
      + catDoc.list.map(c => `<button class="chip ${ui.cat === c.id ? 'on' : ''}" data-cat="${esc(c.id)}">${esc(c.label)}</button>`).join('');
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
  $('fLink').value = note ? note.link || '' : '';
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

$('editor').onsubmit = e => {
  e.preventDefault();
  const title = $('fTitle').value.trim();
  if (!title) { $('fTitle').focus(); return toast('Scrivi almeno il nome'); }
  const isNote = form.col === 'note';
  const rawLink = $('fLinkWrap').hidden ? '' : $('fLink').value.trim();
  const link = rawLink ? linkUrl(rawLink) : '';
  if (rawLink && !link) { $('fLink').focus(); return toast('Il link non sembra valido'); }
  addNewTag(); // Un tag scritto ma non ancora aggiunto non deve andare perso.
  const data = {
    col: form.col,
    title,
    body: $('fBody').value.trim(),
    maker: $('fMakerWrap').hidden ? '' : $('fMaker').value.trim(),
    place: $('fPlaceWrap').hidden ? '' : $('fPlace').value.trim(),
    extra: $('fExtraWrap').hidden ? '' : $('fExtra').value.trim(),
    link,
    kind: form.kind,
    rating: form.done && !isNote ? form.rating : 0,
    done: form.done,
    tags: isNote ? parseTags($('fTags').value) : form.tags,
    category: isNote ? form.category : null,
    priority: isNote ? form.priority : null,
  };
  // Cerco per id: nel frattempo la lista può essere stata aggiornata dalla sync.
  let note = editing && byId(editing.id);
  if (note) Object.assign(note, data);
  else notes.push(note = { id: uid(), created: Date.now(), ...data });
  closeSheet();
  ui.tab = ui.col === note.col ? (note.done ? 'done' : 'todo') : ui.tab;
  changed(note);
};
$('deleteBtn').onclick = () => {
  const removed = byId(editing.id) || editing;
  notes = notes.filter(n => n.id !== removed.id);
  save(); closeSheet(); render();
  sync.remove(removed.id);
  toast('Eliminato', 'Annulla', () => { notes.push(removed); changed(removed); });
};

// ===== Eventi principali =====
$('addBtn').onclick = () => {
  if (ui.col) return openEditor(ui.col);
  $('pickerList').innerHTML = orderedCollections().map(c =>
    `<button data-pick="${c.id}"><span class="tile-icon">${c.icon}</span>${esc(c.add.replace(/^Nuov[oa] /, '').replace(/^./, m => m.toUpperCase()))}</button>`).join('');
  showSheet('picker');
};
$('pickerList').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  openEditor(b.dataset.pick);
};
$('backBtn').onclick = () => {
  if (history.state && history.state.inApp) history.back();
  else go(null);
};
$('search').oninput = e => { ui.q = e.target.value.trim(); render(); };
$('tiles').onclick = e => {
  if (tileDrag.justEnded) return;
  const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go);
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
    const lines = note.body.split('\n');
    const i = +e.target.closest('[data-line]').dataset.line;
    lines[i] = lines[i].replace(/^- \[( |x)\]/i, (m, x) => x === ' ' ? '- [x]' : '- [ ]');
    note.body = lines.join('\n');
    changed(note);
  } else if (act === 'edit') {
    openEditor(colOf(note), note);
  }
};

// ===== Menu: backup =====
$('menuBtn').onclick = () => {
  $('stats').textContent = COLLECTIONS.map(c => `${c.label}: ${inCol(c.id).length}`).join(' · ');
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
  a.download = `le-mie-cose-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
$('importInput').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error();
    const cats = data.find(n => n && n.id === CAT_DOC);
    if (cats && cats.updated > catDoc.updated) window.noteApp.setCategories(cats);
    const merged = new Map(notes.map(n => [n.id, n]));
    const imported = data.filter(n => n.id && n.title).map(n => ({ tags: [], body: '', ...n }));
    imported.forEach(n => merged.set(n.id, n));
    notes = [...merged.values()];
    save(); closeSheet(); render();
    imported.forEach(n => sync.push(n));
    toast(`Importati ${imported.length} elementi`);
  } catch {
    toast('File non valido');
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

// ===== Avvio =====
if (history.state && history.state.sheet) history.replaceState({ inApp: history.state.inApp }, '');
ui.col = colFromHash();
render();
loadAgenda();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
