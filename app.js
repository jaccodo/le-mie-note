// ===== Personalizzazione =====
// Modifica qui categorie e priorità: l'app si adatta da sola.
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
const ui = { cat: 'all', prio: null, tag: null, q: '', showDone: false };

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(notes));
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const byId = id => notes.find(n => n.id === id);

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
function allTags() {
  const counts = {};
  notes.forEach(n => n.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
}

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

// ===== Filtri e ordinamento =====
function matches(n) {
  if (ui.cat !== 'all' && n.category !== ui.cat) return false;
  if (ui.prio && n.priority !== ui.prio) return false;
  if (ui.tag && !n.tags.includes(ui.tag)) return false;
  if (ui.q) {
    const hay = (n.title + ' ' + n.body + ' ' + n.tags.map(t => '#' + t).join(' ')).toLowerCase();
    if (!ui.q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w))) return false;
  }
  return true;
}
const prioRank = p => (PRIORITIES.find(x => x.id === p) || { rank: 9 }).rank;
function sorted(list) {
  return list.slice().sort((a, b) =>
    (a.done - b.done) || (prioRank(a.priority) - prioRank(b.priority)) || (b.updated - a.updated));
}

// ===== Render =====
function render() {
  renderTabs();
  renderPrioChips();
  renderTagChips();

  const visible = notes.filter(matches);
  const open = visible.filter(n => !n.done);
  const done = visible.filter(n => n.done);
  const shown = sorted(ui.showDone ? visible : open);
  const words = ui.q.split(/\s+/).filter(Boolean);

  $('list').innerHTML = shown.map(n => {
    const cat = CATEGORIES.find(c => c.id === n.category);
    const prio = PRIORITIES.find(p => p.id === n.priority);
    return `
    <li class="item ${n.priority ? 'p-' + n.priority : ''} ${n.done ? 'done' : ''}" data-id="${n.id}">
      <button class="check" data-act="toggle" aria-label="Completata">${n.done ? '✓' : ''}</button>
      <div class="content" data-act="edit">
        <div class="title">${highlight(n.title, words)}</div>
        ${n.body ? `<div class="body">${highlight(n.body, words)}</div>` : ''}
        <div class="meta">
          ${ui.cat === 'all' && cat ? `<span class="badge">${esc(cat.label)}</span>` : ''}
          ${prio ? `<span class="badge" style="color:var(--${prio.id})">● ${prio.label}</span>` : ''}
          ${n.tags.map(t => `<span class="badge tag">#${esc(t)}</span>`).join('')}
        </div>
      </div>
    </li>`;
  }).join('');

  $('empty').hidden = shown.length > 0;
  $('toggleDone').hidden = done.length === 0;
  $('toggleDone').textContent = ui.showDone ? 'Nascondi completate' : `Mostra completate (${done.length})`;

  const hint = $('wednesdayHint');
  if (ui.cat === 'lavoro') {
    const pending = notes.filter(n => n.category === 'lavoro' && !n.done).length;
    hint.hidden = false;
    hint.textContent = `📅 ${nextWorkDayLabel()} · ${pending} da fare`;
  } else {
    hint.hidden = true;
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

function renderTabs() {
  const openCount = c => notes.filter(n => !n.done && (c === 'all' || n.category === c)).length;
  const tabs = [{ id: 'all', label: 'Tutte' }, ...CATEGORIES];
  $('catTabs').innerHTML = tabs.map(t =>
    `<button data-cat="${t.id}" class="${ui.cat === t.id ? 'on' : ''}">${esc(t.label)}<span class="count">${openCount(t.id)}</span></button>`
  ).join('');
}
function renderPrioChips() {
  $('prioChips').innerHTML = PRIORITIES.map(p =>
    `<button class="chip ${ui.prio === p.id ? 'on' : ''}" data-prio="${p.id}"><span class="dot" style="background:var(--${p.id})"></span>${p.label}</button>`
  ).join('');
}
function renderTagChips() {
  const tags = allTags();
  if (ui.tag && !tags.includes(ui.tag)) ui.tag = null;
  $('tagChips').innerHTML = tags.map(t =>
    `<button class="chip ${ui.tag === t ? 'on' : ''}" data-tag="${esc(t)}">#${esc(t)}</button>`
  ).join('');
}

// ===== Editor =====
let editing = null;
let form = {};

function openEditor(note) {
  editing = note || null;
  form = note
    ? { category: note.category, priority: note.priority }
    : { category: ui.cat !== 'all' ? ui.cat : CATEGORIES[0].id, priority: ui.prio || 'media' };
  $('editorTitle').textContent = note ? 'Modifica nota' : 'Nuova nota';
  $('fTitle').value = note ? note.title : '';
  $('fBody').value = note ? note.body : '';
  $('fTags').value = note ? note.tags.join(' ') : (ui.tag || '');
  $('deleteBtn').hidden = !note;
  renderEditorSegs();
  renderTagSuggest();
  $('sheet').hidden = false;
  if (!note) setTimeout(() => $('fTitle').focus(), 50);
}
function closeEditor() { $('sheet').hidden = true; editing = null; }

function renderEditorSegs() {
  $('fCat').innerHTML = CATEGORIES.map(c =>
    `<button type="button" data-v="${c.id}" class="${form.category === c.id ? 'on' : ''}">${esc(c.label)}</button>`).join('');
  $('fPrio').innerHTML = [...PRIORITIES, { id: null, label: 'Nessuna' }].map(p =>
    `<button type="button" data-v="${p.id ?? ''}" class="${form.priority === p.id ? 'on' : ''}">${p.id ? `<span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--${p.id});margin-right:5px"></span>` : ''}${p.label}</button>`).join('');
}
function renderTagSuggest() {
  const current = parseTags($('fTags').value);
  $('tagSuggest').innerHTML = allTags().filter(t => !current.includes(t)).slice(0, 12)
    .map(t => `<button type="button" class="chip" data-tag="${esc(t)}">+ #${esc(t)}</button>`).join('');
}

$('fCat').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  form.category = b.dataset.v; renderEditorSegs();
};
$('fPrio').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  form.priority = b.dataset.v || null; renderEditorSegs();
};
$('fTags').oninput = renderTagSuggest;
$('tagSuggest').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  $('fTags').value = [...parseTags($('fTags').value), b.dataset.tag].join(' ');
  renderTagSuggest();
};

$('editor').onsubmit = e => {
  e.preventDefault();
  const data = {
    title: $('fTitle').value.trim(),
    body: $('fBody').value.trim(),
    category: form.category,
    priority: form.priority,
    tags: parseTags($('fTags').value),
  };
  if (!data.title) return;
  // Cerco per id: nel frattempo la lista può essere stata aggiornata dalla sync.
  let note = editing && byId(editing.id);
  if (note) Object.assign(note, data);
  else notes.push(note = { id: uid(), done: false, created: Date.now(), ...data });
  closeEditor();
  changed(note);
};
$('cancelBtn').onclick = closeEditor;
$('sheet').onclick = e => { if (e.target === $('sheet')) closeEditor(); };
$('deleteBtn').onclick = () => {
  const removed = byId(editing.id) || editing;
  notes = notes.filter(n => n.id !== removed.id);
  save(); closeEditor(); render();
  sync.remove(removed.id);
  toast('Nota eliminata', 'Annulla', () => { notes.push(removed); changed(removed); });
};

// ===== Eventi principali =====
$('addBtn').onclick = () => openEditor();
$('search').oninput = e => { ui.q = e.target.value.trim(); render(); };
$('catTabs').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  ui.cat = b.dataset.cat; render();
};
$('prioChips').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  ui.prio = ui.prio === b.dataset.prio ? null : b.dataset.prio; render();
};
$('tagChips').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  ui.tag = ui.tag === b.dataset.tag ? null : b.dataset.tag; render();
};
$('toggleDone').onclick = () => { ui.showDone = !ui.showDone; render(); };
$('list').onclick = e => {
  const li = e.target.closest('.item'); if (!li) return;
  const id = li.dataset.id;
  const note = byId(id);
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'toggle') {
    note.done = !note.done;
    changed(note);
    if (note.done) toast('Completata ✓', 'Annulla', () => {
      const n = byId(id); if (n) { n.done = false; changed(n); }
    });
  } else if (act === 'edit') {
    openEditor(note);
  }
};

// ===== Menu: backup =====
$('menuBtn').onclick = () => {
  const open = notes.filter(n => !n.done).length;
  $('stats').textContent = `${notes.length} note totali · ${open} da fare · ${notes.length - open} completate`;
  $('menu').hidden = false;
};
$('menuClose').onclick = () => { $('menu').hidden = true; };
$('menu').onclick = e => { if (e.target === $('menu')) $('menu').hidden = true; };
$('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `note-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
    save(); render(); $('menu').hidden = true;
    imported.forEach(n => sync.push(n));
    toast(`Importate ${data.length} note`);
  } catch {
    toast('File non valido');
  }
  e.target.value = '';
};
$('clearDoneBtn').onclick = () => {
  const n = notes.filter(x => x.done).length;
  if (!n) return toast('Nessuna nota completata');
  if (!confirm(`Eliminare ${n} note completate?`)) return;
  notes.filter(x => x.done).forEach(x => sync.remove(x.id));
  notes = notes.filter(x => !x.done);
  save(); render(); $('menu').hidden = true;
};

// ===== Avvio =====
if (new Date().getDay() === WORK_DAY) ui.cat = 'lavoro';
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
