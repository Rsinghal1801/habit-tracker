/* =====================================================================
   app.js — Habits UI controller
   Renders the day ring, habit cards, and heatmaps; runs the add/edit
   bottom sheet; and wires the PWA install prompt.
   ===================================================================== */

(() => {
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  let editingId = null;
  let pickedEmoji = Store.EMOJIS[0];
  let pickedColor = Store.PALETTE[0];

  const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>';

  /* ---------------- Ring + summary ---------------- */
  function renderSummary() {
    const habits = Store.getHabits();
    const total = habits.length;
    const done = Store.doneToday();
    const pct = total ? Math.round((done / total) * 100) : 0;

    const C = 327; // 2πr, r=52
    $('#ringFill').style.strokeDashoffset = C - (C * pct) / 100;
    $('#ringPct').textContent = pct + '%';

    const line = $('#summaryLine'), sub = $('#summarySub');
    if (!total) { line.textContent = "Let's build something today."; sub.textContent = 'No habits yet — add your first one.'; return; }
    if (done === total) { line.textContent = 'Every habit done. 🌅'; sub.textContent = 'A clean sweep — that\'s how streaks are made.'; }
    else if (done === 0) { line.textContent = 'A fresh page.'; sub.textContent = `${total} habit${total>1?'s':''} waiting. Start with one.`; }
    else { line.textContent = `${done} of ${total} done.`; sub.textContent = `${total - done} to go — keep the rhythm.`; }
  }

  /* ---------------- Heatmap ---------------- */
  function heatHtml(h) {
    const cols = Store.heatColumns(h, 16);
    const cells = cols.map(col => {
      const inner = col.map(c =>
        `<div class="heat__cell ${c.lit ? 'lit' : ''} ${c.isToday ? 'today' : ''}" title="${c.date}"></div>`
      ).join('');
      return `<div class="heat__col">${inner}</div>`;
    }).join('');
    return `<div class="heat" style="--cell:${h.color}">${cells}</div>`;
  }

  /* ---------------- Habit cards ---------------- */
  function renderHabits() {
    const habits = Store.getHabits();
    const wrap = $('#habits');
    const empty = $('#emptyState');

    if (!habits.length) { wrap.innerHTML = ''; empty.hidden = false; $('#summary').style.display = 'none'; return; }
    empty.hidden = true; $('#summary').style.display = 'flex';

    wrap.innerHTML = habits.map(h => {
      const streak = Store.currentStreak(h);
      const best = Store.bestStreak(h);
      const rate = Store.completionRate(h);
      const done = !!h.done[Store.today()];
      return `
        <article class="habit" data-id="${h.id}">
          <div class="habit__top">
            <div class="habit__emoji" style="box-shadow: inset 0 0 0 1px ${h.color}33">${h.emoji}</div>
            <div class="habit__info">
              <p class="habit__name">${escapeHtml(h.name)}</p>
              <p class="habit__stats">
                <span class="flame">🔥 <b>${streak}</b> day${streak===1?'':'s'}</span>
                <span>best <b>${best}</b></span>
                <span>${rate}% <span style="opacity:.6">/ 30d</span></span>
              </p>
            </div>
            <button class="habit__menu" data-edit="${h.id}" aria-label="Edit ${escapeHtml(h.name)}">⋯</button>
            <button class="check ${done ? 'is-done' : ''}" data-toggle="${h.id}" aria-pressed="${done}" aria-label="Mark ${escapeHtml(h.name)} done today">${CHECK_SVG}</button>
          </div>
          ${heatHtml(h)}
          <div class="heat__foot"><span>16 weeks ago</span><span>today</span></div>
        </article>`;
    }).join('');
  }

  function renderAll() { renderSummary(); renderHabits(); }

  /* ---------------- Sheet ---------------- */
  function buildPickers() {
    $('#emojiRow').innerHTML = Store.EMOJIS.map(e =>
      `<button type="button" class="emoji-pick ${e===pickedEmoji?'is-active':''}" data-emoji="${e}">${e}</button>`).join('');
    $('#colorRow').innerHTML = Store.PALETTE.map(c =>
      `<button type="button" class="color-pick ${c===pickedColor?'is-active':''}" data-color="${c}" style="background:${c}" aria-label="colour ${c}"></button>`).join('');
  }

  function openSheet(habit = null) {
    editingId = habit ? habit.id : null;
    pickedEmoji = habit ? habit.emoji : Store.EMOJIS[0];
    pickedColor = habit ? habit.color : Store.PALETTE[Math.floor(Math.random()*Store.PALETTE.length)];
    $('#sheetTitle').textContent = habit ? 'Edit habit' : 'New habit';
    $('#saveBtn').textContent = habit ? 'Save' : 'Add habit';
    $('#deleteBtn').hidden = !habit;
    $('#habitName').value = habit ? habit.name : '';
    buildPickers();
    $('#sheet').classList.add('is-open');
    $('#sheet').setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#habitName').focus(), 60);
  }
  function closeSheet() {
    $('#sheet').classList.remove('is-open');
    $('#sheet').setAttribute('aria-hidden', 'true');
    $('#habitForm').reset();
  }

  /* ---------------- Helpers ---------------- */
  function escapeHtml(s) { return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  let toastTimer;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('is-show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-show'), 2200);
  }

  /* ---------------- Events ---------------- */
  function bind() {
    $('#addBtn').addEventListener('click', () => openSheet());
    $('#emptyAdd').addEventListener('click', () => openSheet());
    $$('[data-close]').forEach(el => el.addEventListener('click', closeSheet));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet').classList.contains('is-open')) closeSheet(); });

    // pickers (delegated)
    $('#emojiRow').addEventListener('click', e => {
      const b = e.target.closest('[data-emoji]'); if (!b) return;
      pickedEmoji = b.dataset.emoji; $$('.emoji-pick').forEach(x => x.classList.toggle('is-active', x === b));
    });
    $('#colorRow').addEventListener('click', e => {
      const b = e.target.closest('[data-color]'); if (!b) return;
      pickedColor = b.dataset.color; $$('.color-pick').forEach(x => x.classList.toggle('is-active', x === b));
    });

    // save
    $('#habitForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#habitName').value.trim();
      if (!name) { $('#habitName').focus(); return; }
      if (editingId) { Store.updateHabit(editingId, { name, emoji: pickedEmoji, color: pickedColor }); toast('Habit updated'); }
      else { Store.addHabit({ name, emoji: pickedEmoji, color: pickedColor }); toast('Habit added'); }
      closeSheet(); renderAll();
    });

    // delete
    $('#deleteBtn').addEventListener('click', () => {
      if (editingId && confirm('Delete this habit and its history?')) { Store.removeHabit(editingId); closeSheet(); renderAll(); toast('Habit deleted'); }
    });

    // toggle + edit (delegated on the list)
    $('#habits').addEventListener('click', e => {
      const t = e.target.closest('[data-toggle]');
      if (t) {
        const nowDone = Store.toggle(t.dataset.toggle);
        t.classList.add('pop');
        setTimeout(() => t.classList.remove('pop'), 400);
        renderAll();
        if (nowDone && Store.doneToday() === Store.getHabits().length) toast('All done today 🌅');
        return;
      }
      const ed = e.target.closest('[data-edit]');
      if (ed) { const h = Store.getHabits().find(h => h.id === ed.dataset.edit); openSheet(h); }
    });
  }

  /* ---------------- PWA install ---------------- */
  let deferredPrompt = null;
  function setupInstall() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); deferredPrompt = e;
      if (localStorage.getItem('habits.install.dismissed')) return;
      $('#installBar').hidden = false;
    });
    $('#installBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null; $('#installBar').hidden = true;
    });
    $('#installDismiss').addEventListener('click', () => {
      $('#installBar').hidden = true; localStorage.setItem('habits.install.dismissed', '1');
    });
    window.addEventListener('appinstalled', () => { $('#installBar').hidden = true; toast('Installed — find Habits on your home screen'); });
  }

  /* ---------------- Init ---------------- */
  function init() {
    $('#todayLabel').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    if (Store.isEmpty()) Store.seed();   // first run: show a lived-in tracker
    bind(); setupInstall(); renderAll();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
