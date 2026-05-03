(() => {
  'use strict';

  // ── Storage helpers ─────────────────────────────────────────
  const KEYS = { decks: 'pkmn_decks', matches: 'pkmn_matches' };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ── State ────────────────────────────────────────────────────
  let decks   = load(KEYS.decks);
  let matches = load(KEYS.matches);

  // Migrate old string-based decks to objects
  decks = decks.map(d => typeof d === 'string' ? { name: d, sprites: [] } : d);

  // ── Tab navigation ───────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'stats')   renderStats();
      if (btn.dataset.tab === 'history') renderHistory();
    });
  });

  // ────────────────────────────────────────────────────────────
  // DECK MANAGEMENT
  // ────────────────────────────────────────────────────────────
  const addDeckForm   = document.getElementById('add-deck-form');
  const newDeckInput  = document.getElementById('new-deck-name');
  const deckListEl    = document.getElementById('deck-list');
  const noDecksEl     = document.getElementById('no-decks');

  addDeckForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = newDeckInput.value.trim();
    if (!name) return;
    if (decks.some(d => d.name === name)) {
      alert(`"${name}" already exists.`);
      return;
    }
    const sprite1 = document.getElementById('new-sprite-1').value.trim();
    const sprite2 = document.getElementById('new-sprite-2').value.trim();
    const sprites = [sprite1, sprite2].filter(Boolean);
    decks.push({ name, sprites });
    save(KEYS.decks, decks);
    newDeckInput.value = '';
    document.getElementById('new-sprite-1').value = '';
    document.getElementById('new-sprite-2').value = '';
    document.getElementById('sprite-preview-1').style.display = 'none';
    document.getElementById('sprite-preview-2').style.display = 'none';
    renderDecks();
    populateDeckSelects();
  });

  // Live sprite previews for sprite inputs
  ['new-sprite-1', 'new-sprite-2'].forEach((id, i) => {
    document.getElementById(id).addEventListener('input', function () {
      const preview = document.getElementById(`sprite-preview-${i + 1}`);
      const slug = spriteSlug(this.value.trim());
      if (slug) {
        preview.className = `pokesprite pokemon ${slug}`;
        preview.style.display = 'inline-block';
      } else {
        preview.className = 'pokesprite pokemon';
        preview.style.display = 'none';
      }
    });
  });

  function renderDecks() {
    deckListEl.innerHTML = '';
    noDecksEl.classList.toggle('hidden', decks.length > 0);
    decks.forEach(deck => {
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'deck-name-label';
      const sprites = deckSpritesHtml(deck.name);
      nameSpan.innerHTML = (sprites ? sprites + ' ' : '') + esc(deck.name);
      li.appendChild(nameSpan);
      const del = document.createElement('button');
      del.className = 'btn-delete';
      del.textContent = 'Remove';
      del.addEventListener('click', () => {
        if (!confirm(`Remove "${deck.name}"? This won't delete match history for this deck.`)) return;
        decks = decks.filter(d => d.name !== deck.name);
        save(KEYS.decks, decks);
        renderDecks();
        populateDeckSelects();
      });
      li.appendChild(del);
      deckListEl.appendChild(li);
    });
  }

  // ────────────────────────────────────────────────────────────
  // POPULATE DECK SELECTS (log form + history filter)
  // ────────────────────────────────────────────────────────────
  function populateDeckSelects() {
    const myDeckSel       = document.getElementById('my-deck');
    const historyDeckSel  = document.getElementById('history-deck-filter');

    const savedMyDeck      = myDeckSel.value;
    const savedHistoryDeck = historyDeckSel.value;

    myDeckSel.innerHTML = '<option value="" disabled>— select your deck —</option>';
    historyDeckSel.innerHTML = '<option value="all">All Decks</option>';

    // Also collect decks used in matches but not in managed list
    const allDeckNames = new Set([...decks.map(d => d.name), ...matches.map(m => m.myDeck)]);
    [...allDeckNames].sort().forEach(d => {
      myDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
      historyDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
    });

    if (savedMyDeck) myDeckSel.value = savedMyDeck;
    if (savedHistoryDeck) historyDeckSel.value = savedHistoryDeck;

    updateMyDeckSpritePreview();
  }

  // ────────────────────────────────────────────────────────────
  // LOG MATCH
  // ────────────────────────────────────────────────────────────
  const logForm      = document.getElementById('log-form');
  const resultInput  = document.getElementById('result-input');
  const logSuccess   = document.getElementById('log-success');

  function updateMyDeckSpritePreview() {
    const myDeckSel = document.getElementById('my-deck');
    const preview   = document.getElementById('my-deck-sprite-preview');
    if (!preview) return;
    preview.innerHTML = deckSpritesHtml(myDeckSel.value);
  }

  document.getElementById('my-deck').addEventListener('change', updateMyDeckSpritePreview);

  // Default date to today
  document.getElementById('match-date').valueAsDate = new Date();

  // Result toggle buttons
  document.querySelectorAll('.result-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      resultInput.value = btn.dataset.result;
    });
  });

  logForm.addEventListener('submit', e => {
    e.preventDefault();
    const myDeck  = document.getElementById('my-deck').value;
    const oppDeck = document.getElementById('opp-deck').value.trim();
    const result  = resultInput.value;
    const event   = document.getElementById('event-type').value;
    const date    = document.getElementById('match-date').value;
    const notes   = document.getElementById('match-notes').value.trim();

    if (!result) { alert('Please select Win, Loss, or Tie.'); return; }

    matches.push({ id: Date.now(), myDeck, oppDeck, result, event, date, notes });
    save(KEYS.matches, matches);

    // Reset form
    logForm.reset();
    document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
    resultInput.value = '';
    document.getElementById('match-date').valueAsDate = new Date();

    logSuccess.classList.remove('hidden');
    setTimeout(() => logSuccess.classList.add('hidden'), 2500);

    populateDeckSelects();
    updateMyDeckSpritePreview();
  });

  // ────────────────────────────────────────────────────────────
  // STATS
  // ────────────────────────────────────────────────────────────
  const statsEventFilter = document.getElementById('stats-event-filter');
  statsEventFilter.addEventListener('change', renderStats);

  function renderStats() {
    const eventFilter = statsEventFilter.value;
    const filtered    = eventFilter === 'all' ? matches : matches.filter(m => m.event === eventFilter);

    const total  = filtered.length;
    const wins   = filtered.filter(m => m.result === 'Win').length;
    const losses = filtered.filter(m => m.result === 'Loss').length;
    const ties   = filtered.filter(m => m.result === 'Tie').length;
    const pct    = total ? Math.round((wins / total) * 100) : 0;

    document.getElementById('stats-summary').innerHTML = `
      <div class="stat-chip total"><span class="chip-val">${total}</span><span class="chip-lbl">Matches</span></div>
      <div class="stat-chip wins"><span class="chip-val">${wins}</span><span class="chip-lbl">Wins</span></div>
      <div class="stat-chip losses"><span class="chip-val">${losses}</span><span class="chip-lbl">Losses</span></div>
      <div class="stat-chip ties"><span class="chip-val">${ties}</span><span class="chip-lbl">Ties</span></div>
      <div class="stat-chip pct"><span class="chip-val">${pct}%</span><span class="chip-lbl">Win Rate</span></div>
    `;

    // Per-deck breakdown
    const deckMap = {};
    filtered.forEach(m => {
      if (!deckMap[m.myDeck]) deckMap[m.myDeck] = { wins: 0, losses: 0, ties: 0 };
      const key = { Win: 'wins', Loss: 'losses', Tie: 'ties' }[m.result];
      if (key) deckMap[m.myDeck][key]++;
    });

    const statsBody = document.getElementById('stats-body');
    const noStats   = document.getElementById('no-stats');

    if (Object.keys(deckMap).length === 0) {
      statsBody.innerHTML = '';
      noStats.classList.remove('hidden');
      return;
    }
    noStats.classList.add('hidden');

    const rows = Object.entries(deckMap)
      .map(([deck, s]) => {
        const total = s.wins + s.losses + s.ties;
        const wr    = total ? Math.round((s.wins / total) * 100) : 0;
        return { deck, ...s, total, wr };
      })
      .sort((a, b) => b.wr - a.wr || b.total - a.total);

    statsBody.innerHTML = rows.map(r => `
      <tr>
        <td class="sprite-col">${deckSpritesHtml(r.deck)}</td>
        <td><strong>${esc(r.deck)}</strong></td>
        <td>${r.total}</td>
        <td>${r.wins}</td>
        <td>${r.losses}</td>
        <td>${r.ties}</td>
        <td>
          <div class="wr-bar">
            <span>${r.wr}%</span>
            <div class="wr-track"><div class="wr-fill" style="width:${r.wr}%"></div></div>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ────────────────────────────────────────────────────────────
  // HISTORY
  // ────────────────────────────────────────────────────────────
  document.getElementById('history-deck-filter').addEventListener('change', renderHistory);
  document.getElementById('history-event-filter').addEventListener('change', renderHistory);
  document.getElementById('history-result-filter').addEventListener('change', renderHistory);

  function renderHistory() {
    const deckFilter   = document.getElementById('history-deck-filter').value;
    const eventFilter  = document.getElementById('history-event-filter').value;
    const resultFilter = document.getElementById('history-result-filter').value;

    let filtered = [...matches].reverse(); // newest first
    if (deckFilter   !== 'all') filtered = filtered.filter(m => m.myDeck === deckFilter);
    if (eventFilter  !== 'all') filtered = filtered.filter(m => m.event  === eventFilter);
    if (resultFilter !== 'all') filtered = filtered.filter(m => m.result === resultFilter);

    const historyBody = document.getElementById('history-body');
    const noHistory   = document.getElementById('no-history');

    if (filtered.length === 0) {
      historyBody.innerHTML = '';
      noHistory.classList.remove('hidden');
      return;
    }
    noHistory.classList.add('hidden');

    const VALID_RESULT_CLS = { Win: 'win', Loss: 'loss', Tie: 'tie' };

    historyBody.innerHTML = '';
    filtered.forEach(m => {
      const dateStr = m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString() : '—';

      const tr = document.createElement('tr');

      function td(text) {
        const cell = document.createElement('td');
        cell.textContent = text;
        return cell;
      }

      tr.appendChild(td(dateStr));

      const deckCell = document.createElement('td');
      const spritesHtml = deckSpritesHtml(m.myDeck);
      if (spritesHtml) {
        deckCell.innerHTML = spritesHtml + ' <strong>' + esc(m.myDeck) + '</strong>';
      } else {
        const strong = document.createElement('strong');
        strong.textContent = m.myDeck;
        deckCell.appendChild(strong);
      }
      tr.appendChild(deckCell);

      tr.appendChild(td(m.oppDeck));
      tr.appendChild(td(m.event));

      const resultCell = document.createElement('td');
      const badge      = document.createElement('span');
      badge.className  = 'badge ' + (VALID_RESULT_CLS[m.result] || 'tie');
      badge.textContent = m.result;
      resultCell.appendChild(badge);
      tr.appendChild(resultCell);

      const notesCell = document.createElement('td');
      notesCell.className   = 'notes-cell';
      notesCell.title       = m.notes || '';
      notesCell.textContent = m.notes || '';
      tr.appendChild(notesCell);

      const delCell = document.createElement('td');
      const delBtn  = document.createElement('button');
      delBtn.className  = 'btn-delete';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        if (!confirm('Delete this match?')) return;
        matches = matches.filter(n => n.id !== m.id);
        save(KEYS.matches, matches);
        populateDeckSelects();
        renderHistory();
        renderStats();
      });
      delCell.appendChild(delBtn);
      tr.appendChild(delCell);

      historyBody.appendChild(tr);
    });
  }

  // ────────────────────────────────────────────────────────────
  // Utility: escape HTML to prevent XSS
  // ────────────────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ────────────────────────────────────────────────────────────
  // Sprite helpers
  // ────────────────────────────────────────────────────────────
  function spriteSlug(s) {
    return s.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[-]+(?:ex|v|vmax|vstar|gx)$/i, '')
      .replace(/[^a-z0-9-]/g, '');
  }

  function deckSpritesHtml(deckName) {
    const deck = decks.find(d => d.name === deckName);
    if (!deck || !deck.sprites || !deck.sprites.length) return '';
    return deck.sprites.map(s => `<span class="pokesprite pokemon ${spriteSlug(s)}"></span>`).join(' ');
  }

  // ────────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────────
  renderDecks();
  populateDeckSelects();
  renderStats();
  renderHistory();
})();
