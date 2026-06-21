/* =====================================================================
   store.js — Habits's data layer
   Habits + per-day completions, persisted to localStorage. All streak and
   completion-rate maths live here so the UI layer stays declarative.
   ===================================================================== */

const Store = (() => {
  const KEY = 'habits.v1';

  const PALETTE = ['#ff6b9d', '#ffb347', '#2dd4bf', '#7c83ff', '#5ad19a', '#ff8c5a'];
  const EMOJIS  = ['📖', '🏃', '💧', '🧘', '🎸', '✍️', '🌙', '🥗', '💪', '🧠'];

  const blank = () => ({ habits: [] });
  let state = load();

  function load() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : blank(); }
    catch { return blank(); }
  }
  function persist() { localStorage.setItem(KEY, JSON.stringify(state)); }

  /* ---- date helpers (local-time, ISO yyyy-mm-dd) ---- */
  const iso = d => {
    const x = new Date(d); x.setHours(0,0,0,0);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  };
  const today = () => iso(new Date());
  const shift = (isoStr, days) => { const d = new Date(isoStr + 'T00:00'); d.setDate(d.getDate()+days); return iso(d); };

  /* ---- CRUD ---- */
  function addHabit({ name, emoji, color }) {
    state.habits.push({ id: crypto.randomUUID(), name: name.trim(), emoji, color, created: today(), done: {} });
    persist();
  }
  function updateHabit(id, patch) {
    const h = state.habits.find(h => h.id === id);
    if (h) { Object.assign(h, patch); persist(); }
  }
  function removeHabit(id) { state.habits = state.habits.filter(h => h.id !== id); persist(); }
  function getHabits() { return state.habits; }

  function toggle(id, dateStr = today()) {
    const h = state.habits.find(h => h.id === id);
    if (!h) return false;
    if (h.done[dateStr]) delete h.done[dateStr]; else h.done[dateStr] = true;
    persist();
    return !!h.done[dateStr];
  }

  /* ---- analytics ---- */
  // current streak: consecutive completed days ending today (or yesterday,
  // so a not-yet-done today doesn't read as a broken streak).
  function currentStreak(h) {
    let start = h.done[today()] ? today() : shift(today(), -1);
    if (!h.done[start]) return 0;
    let count = 0, cur = start;
    while (h.done[cur]) { count++; cur = shift(cur, -1); }
    return count;
  }

  function bestStreak(h) {
    const days = Object.keys(h.done).filter(d => h.done[d]).sort();
    let best = 0, run = 0, prev = null;
    for (const d of days) {
      run = (prev && shift(prev, 1) === d) ? run + 1 : 1;
      best = Math.max(best, run); prev = d;
    }
    return best;
  }

  // completion rate over a trailing window (default 30 days, capped at age).
  function completionRate(h, window = 30) {
    const age = Math.max(1, Math.round((Date.parse(today()) - Date.parse(h.created)) / 86400000) + 1);
    const span = Math.min(window, age);
    let hit = 0;
    for (let i = 0; i < span; i++) if (h.done[shift(today(), -i)]) hit++;
    return Math.round((hit / span) * 100);
  }

  function doneToday() { return state.habits.filter(h => h.done[today()]).length; }

  // last `weeks` worth of day cells, grouped into columns of 7 (Mon→Sun-ish)
  function heatColumns(h, weeks = 16) {
    const cells = [];
    const totalDays = weeks * 7;
    const end = today();
    // align so the last column ends on today
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = shift(end, -i);
      cells.push({ date: d, lit: !!h.done[d], isToday: d === end, future: false });
    }
    const cols = [];
    for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
    return cols;
  }

  /* ---- lifecycle ---- */
  function reset() { state = blank(); persist(); }

  function seed() {
    const samples = [
      { name: 'Read 10 pages', emoji: '📖', color: '#ff6b9d', density: 0.82 },
      { name: 'Morning run',   emoji: '🏃', color: '#2dd4bf', density: 0.55 },
      { name: 'Drink water',   emoji: '💧', color: '#7c83ff', density: 0.9  },
      { name: 'Meditate',      emoji: '🧘', color: '#ffb347', density: 0.68 },
    ];
    const habits = samples.map(s => {
      const created = shift(today(), -97);
      const done = {};
      // build a realistic streaky history
      let streaky = false;
      for (let i = 97; i >= 0; i--) {
        const d = shift(today(), -i);
        if (Math.random() < 0.12) streaky = !streaky;       // occasional mood swings
        const p = streaky ? Math.min(0.97, s.density + 0.15) : s.density - 0.2;
        if (Math.random() < p) done[d] = true;
      }
      done[today()] = Math.random() < 0.5;                   // mix of done/undone today
      return { id: crypto.randomUUID(), name: s.name, emoji: s.emoji, color: s.color, created, done };
    });
    state = { habits };
    persist();
  }

  return {
    PALETTE, EMOJIS,
    addHabit, updateHabit, removeHabit, getHabits, toggle,
    currentStreak, bestStreak, completionRate, doneToday, heatColumns,
    reset, seed, today,
    isEmpty: () => state.habits.length === 0,
  };
})();
