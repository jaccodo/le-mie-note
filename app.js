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
  { id: 'note', label: 'Note', add: 'Nuova nota', icon: '📝', titleHint: 'Titolo',
    todo: 'Da fare', done: 'Completate' },
];
const CATEGORIES = [
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
const ui = { col: null, tab: 'todo', cat: null, kind: null, tag: null, place: null, q: '' };

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
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
const sync = { push: () => {}, remove: () => {} };
window.noteApp = {
  sync,
  getNotes: () => notes,
  replaceAll(list) { notes = list; save(); render(); },
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
const sameText = (a, b) => (a || '').toLowerCase() === (b || '').toLowerCase();

// ===== Helpers DOM =====
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function highlight(text, words) {
  let html = esc(text);
  words.forEach(w => {
    const re = new RegExp('(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    html = html.replace(re, '<mark>$1</mark>');
  });
  return html;
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
const SHEETS = ['sheet', 'menu', 'picker'];
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
  return [n.title, n.body, n.maker, n.place, n.extra, n.kind, ...(n.tags || []).map(t => '#' + t)].filter(Boolean).join(' ').toLowerCase();
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
  return ui.col ? !!n.done === (ui.tab === 'done') : true;
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
  renderTabs(col, searching);
  renderChips(col);
  renderHint(col, home);

  const words = ui.q.split(/\s+/).filter(Boolean);
  const shown = home
    ? notes.slice().sort((a, b) => b.updated - a.updated).slice(0, 5)
    : sorted(notes.filter(matches));
  $('list').innerHTML = shown.map(n => card(n, words, !col)).join('');

  $('listTitle').hidden = !(home && shown.length);
  $('listTitle').textContent = 'Ultime modifiche';
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
  const cat = CATEGORIES.find(x => x.id === n.category);
  const prio = PRIORITIES.find(p => p.id === n.priority);
  const sub = [n.kind, n.maker, n.place, n.extra].filter(Boolean).join(' · ');
  const mapUrl = c.maps && c.maps(n)
    ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([n.maker || n.title, n.place].filter(Boolean).join(' '))
    : null;
  return `
    <li class="item ${n.done ? 'done' : ''}" data-id="${n.id}" data-col="${c.id}">
      <button class="check" data-act="toggle" aria-label="${esc(n.done ? c.todo : c.done)}"></button>
      <div class="content" data-act="edit">
        <div class="title">${highlight(n.title, words)}</div>
        ${sub ? `<div class="sub">${highlight(sub, words)}</div>` : ''}
        ${ratingHtml(n.rating)}
        ${n.body ? `<div class="body">${highlight(n.body, words)}</div>` : ''}
        <div class="meta">${[
          showCol ? `<span class="badge">${c.icon} ${esc(c.label)}</span>` : '',
          !ui.cat && cat ? `<span class="badge">${esc(cat.label)}</span>` : '',
          prio ? `<span class="badge" style="color:var(--${prio.id})">● ${prio.label}</span>` : '',
          ...(n.tags || []).map(t => `<span class="badge tag">${c.tagPresets ? '' : '#'}${esc(t)}</span>`),
        ].join('')}</div>
      </div>
      ${mapUrl ? `<a class="pin" href="${esc(mapUrl)}" target="_blank" rel="noopener" aria-label="Apri in Maps">📍</a>` : ''}
    </li>`;
}

function renderTiles() {
  $('tiles').innerHTML = COLLECTIONS.map(c => {
    const list = inCol(c.id);
    const done = list.filter(n => n.done).length;
    const open = list.length - done;
    const count = list.length ? `${c.todo} ${open} · ${c.done} ${done}` : 'Ancora vuoto';
    return `<button class="tile" data-go="${c.id}">
      <span class="tile-icon">${c.icon}</span>
      <span class="tile-name">${esc(c.label)}</span>
      <span class="tile-count">${esc(count)}</span>
    </button>`;
  }).join('');
}
function renderTabs(col, searching) {
  $('statusTabs').hidden = !col || searching;
  if (!col) return;
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
    if (col.id === 'note') html = CATEGORIES.map(c => `<button class="chip ${ui.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${esc(c.label)}</button>`).join('');
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
  hint.hidden = !((home && isWorkDay) || (col && col.id === 'note' && ui.cat === 'lavoro'));
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
const TEXT_FIELDS = [['Maker', 'maker'], ['Place', 'place'], ['Extra', 'extra']];

function openEditor(colId, note) {
  const col = colById(colId);
  editing = note || null;
  form = note
    ? { col: col.id, done: !!note.done, rating: note.rating || 0, kind: note.kind || null, category: note.category || null, priority: note.priority || null, tags: [...(note.tags || [])] }
    : { col: col.id, done: ui.col === col.id && ui.tab === 'done', rating: 0, kind: ui.col === col.id ? ui.kind : null,
        category: ui.cat || CATEGORIES[0].id, priority: 'media', tags: ui.col === col.id && ui.tag ? [ui.tag] : [] };

  document.body.dataset.col = col.id;
  $('editorTitle').textContent = note ? 'Modifica' : col.add;
  $('fTitle').placeholder = col.titleHint;
  $('fTitle').value = note ? note.title : '';
  $('fBody').value = note ? note.body || '' : '';
  $('fBody').placeholder = 'Quello che vuoi ricordare (facoltativo)';
  $('fPlace').value = note ? note.place || '' : (ui.col === col.id && ui.place) || '';
  $('fNewTag').value = '';
  $('fMaker').value = note ? note.maker || '' : '';
  $('fExtra').value = note ? note.extra || '' : '';
  $('fTags').value = note ? (note.tags || []).join(' ') : (ui.tag || '');
  $('deleteBtn').hidden = !note;

  TEXT_FIELDS.forEach(([k, key]) => {
    const f = col[key];
    if (f) { $(`f${k}Label`).textContent = f.label; $(`f${k}`).placeholder = f.hint; }
  });
  $('noteFields').hidden = col.id !== 'note';
  $('fStatus').hidden = col.id === 'note';
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
  $('fStatus').innerHTML = [[false, col.todo], [true, col.done]].map(([v, label]) =>
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
  $('fCat').innerHTML = CATEGORIES.map(c =>
    `<button type="button" data-v="${c.id}" class="${form.category === c.id ? 'on' : ''}">${esc(c.label)}</button>`).join('');
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

$('editor').onsubmit = e => {
  e.preventDefault();
  const title = $('fTitle').value.trim();
  if (!title) { $('fTitle').focus(); return toast('Scrivi almeno il nome'); }
  const isNote = form.col === 'note';
  addNewTag(); // Un tag scritto ma non ancora aggiunto non deve andare perso.
  const data = {
    col: form.col,
    title,
    body: $('fBody').value.trim(),
    maker: $('fMakerWrap').hidden ? '' : $('fMaker').value.trim(),
    place: $('fPlaceWrap').hidden ? '' : $('fPlace').value.trim(),
    extra: $('fExtraWrap').hidden ? '' : $('fExtra').value.trim(),
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
  $('pickerList').innerHTML = COLLECTIONS.map(c =>
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
  const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go);
};
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
  } else if (act === 'edit') {
    openEditor(colOf(note), note);
  }
};

// ===== Menu: backup =====
$('menuBtn').onclick = () => {
  $('stats').textContent = COLLECTIONS.map(c => `${c.label}: ${inCol(c.id).length}`).join(' · ');
  showSheet('menu');
};
$('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
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

// ===== Avvio =====
if (history.state && history.state.sheet) history.replaceState({ inApp: history.state.inApp }, '');
ui.col = colFromHash();
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
