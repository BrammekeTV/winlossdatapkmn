(() => {
  'use strict';

  // ── Storage helpers ─────────────────────────────────────────
  const KEYS = { decks: 'pkmn_decks', matches: 'pkmn_matches', oppDecks: 'pkmn_opp_decks' };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }

  function loadObj(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch { return {}; }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ── State ────────────────────────────────────────────────────
  let decks    = load(KEYS.decks);
  let matches  = load(KEYS.matches);
  let oppDecks = loadObj(KEYS.oppDecks); // { [deckName]: string[] }

  // Migrate old string-based decks to objects
  decks = decks.map(d => typeof d === 'string' ? { name: d, sprites: [], archetype: '', rotation: '' } : { ...d, archetype: d.archetype || '', rotation: d.rotation || '' });

  // Migrate oppDecks from { name: string[] } to { name: { sprites: string[], archetype: string } }
  Object.keys(oppDecks).forEach(name => {
    if (Array.isArray(oppDecks[name])) {
      oppDecks[name] = { sprites: oppDecks[name], archetype: '' };
    } else if (oppDecks[name] && typeof oppDecks[name] === 'object') {
      oppDecks[name] = { sprites: oppDecks[name].sprites || [], archetype: oppDecks[name].archetype || '' };
    }
  });

  // ── Stats view state ─────────────────────────────────────────
  let splitArchetypes = false; // false = merge by archetype (default), true = show individual decks
  const archetypeCollapsed = {}; // { [archKey]: boolean } – which archetype groups are collapsed

  // ── PokeAPI HOME sprite resolution ──────────────────────────────────────────
  const HOME_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/';
  // Unown (#201) is the sprite shown for the "Other" catch-all pie slice
  const UNOWN_SPRITE_URL = HOME_SPRITE_BASE + '201-question.png';

  // These Pokémon have alternate-form sprites named '{base_id}-{form_suffix}.png'
  // (e.g. unown-a → 201-a.png, unown-exclamation → 201-exclamation.png)
  // Most other alternate forms use their numeric PokeAPI ID directly (10xxx.png).
  const NAMED_FORM_BASE_IDS = {
    unown: 201, burmy: 412, cherrim: 421, shellos: 422,
    gastrodon: 423, arceus: 493, deerling: 585, sawsbuck: 586,
  };

  // Alternate forms that are absent from the standard /pokemon listing.
  // 'id' is the sprite filename (without .png) used directly by homeUrl().
  const STATIC_EXTRA_FORMS = [
    // Unown – 26 letters + ! + ?
    ...'abcdefghijklmnopqrstuvwxyz'.split('').map(l => ({
      name: `unown-${l}`, displayName: `Unown ${l.toUpperCase()}`, id: `201-${l}`,
    })),
    { name: 'unown-exclamation', displayName: 'Unown !',  id: '201-exclamation' },
    { name: 'unown-question',    displayName: 'Unown ?',  id: '201-question'    },
    // Burmy
    { name: 'burmy-sandy', displayName: 'Burmy Sandy', id: '412-sandy' },
    { name: 'burmy-trash', displayName: 'Burmy Trash', id: '412-trash' },
    // Cherrim
    { name: 'cherrim-sunshine', displayName: 'Cherrim Sunshine', id: '421-sunshine' },
    // Shellos
    { name: 'shellos-east', displayName: 'Shellos East', id: '422-east' },
    // Gastrodon
    { name: 'gastrodon-east', displayName: 'Gastrodon East', id: '423-east' },
    // Arceus – one entry per type plate
    ...['fighting','flying','poison','ground','rock','bug','ghost','steel',
        'fire','water','grass','electric','psychic','ice','dragon','dark','fairy'].map(t => ({
      name: `arceus-${t}`,
      displayName: `Arceus ${t.charAt(0).toUpperCase() + t.slice(1)}`,
      id: `493-${t}`,
    })),
    // Deerling
    { name: 'deerling-summer', displayName: 'Deerling Summer', id: '585-summer' },
    { name: 'deerling-autumn', displayName: 'Deerling Autumn', id: '585-autumn' },
    { name: 'deerling-winter', displayName: 'Deerling Winter', id: '585-winter' },
    // Sawsbuck
    { name: 'sawsbuck-summer', displayName: 'Sawsbuck Summer', id: '586-summer' },
    { name: 'sawsbuck-autumn', displayName: 'Sawsbuck Autumn', id: '586-autumn' },
    { name: 'sawsbuck-winter', displayName: 'Sawsbuck Winter', id: '586-winter' },
  ];

  let _pokeList    = null; // [{name, displayName, id}] – loaded from PokeAPI
  const _nameToIdMap    = Object.create(null);
  const _idToSpriteFile = Object.create(null); // id → sprite filename (without .png)

  function _titleCase(slug) {
    return slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }

  // Merge STATIC_EXTRA_FORMS into list, skipping names already present.
  function _mergeStaticForms(list) {
    const existing = new Set(list.map(p => p.name));
    STATIC_EXTRA_FORMS.forEach(f => { if (!existing.has(f.name)) list.push(f); });
  }

  function _buildNameMap(list) {
    list.forEach(p => {
      _nameToIdMap[p.name]                  = p.id;
      _nameToIdMap[p.name.replace(/-/g, '')] = p.id;
      _nameToIdMap[p.displayName.toLowerCase()] = p.id;
      // Only register the stripped-display variant for numeric-ID entries.
      // Skipping it for string-ID (static) entries prevents display names like
      // 'Unown !' (stripped → 'unown') from overwriting the base form's mapping.
      if (typeof p.id === 'number') {
        _nameToIdMap[p.displayName.toLowerCase().replace(/[^a-z0-9]/g, '')] = p.id;
      }

      // For forms whose sprites use '{base_id}-{suffix}.png' rather than the
      // numeric PokeAPI form ID, store the correct filename so homeUrl() can use it.
      if (typeof p.id === 'number' && p.id >= 10000) {
        const dash = p.name.indexOf('-');
        if (dash !== -1) {
          const baseName   = p.name.slice(0, dash);
          const formSuffix = p.name.slice(dash + 1);
          if (NAMED_FORM_BASE_IDS[baseName] !== undefined) {
            _idToSpriteFile[p.id] = NAMED_FORM_BASE_IDS[baseName] + '-' + formSuffix;
          }
        }
      }
    });
  }

  // Try to populate from sessionStorage immediately (synchronous path)
  try {
    const cached = sessionStorage.getItem('pkmn_poke_list_v6');
    if (cached) {
      _pokeList = JSON.parse(cached);
      _mergeStaticForms(_pokeList);
      _buildNameMap(_pokeList);
    }
  } catch { /* sessionStorage unavailable */ }

  // Fetch the main Pokémon list from PokeAPI. Alternate forms for several Pokémon
  // (Unown, Burmy, Cherrim, etc.) are absent from this listing, so STATIC_EXTRA_FORMS
  // guarantees they are always present as a reliable fallback.
  const _pokeListReady = fetch('https://pokeapi.co/api/v2/pokemon?limit=10000')
    .then(r => r.json())
    .then(data => {
      _pokeList = data.results.map(p => {
        const id = parseInt(p.url.replace(/\/$/, '').split('/').pop(), 10);
        return { name: p.name, displayName: _titleCase(p.name), id };
      });
      _mergeStaticForms(_pokeList);
      console.info(
        `[PokéPicker] Loaded ${_pokeList.length} entries (including static forms).`,
        'unown-a present:', _pokeList.some(p => p.name === 'unown-a')
      );
      try { sessionStorage.setItem('pkmn_poke_list_v6', JSON.stringify(_pokeList)); } catch {}
      _buildNameMap(_pokeList);
    })
    .catch(() => { /* PokeAPI unavailable – graceful degradation */ });

  function homeUrl(id) {
    if (typeof id === 'string') return HOME_SPRITE_BASE + id + '.png';
    const file = _idToSpriteFile[id] !== undefined ? _idToSpriteFile[id] : id;
    return HOME_SPRITE_BASE + file + '.png';
  }

  function spriteIdFromName(name) {
    if (!name || !_pokeList) return null;
    const lower = String(name).toLowerCase().trim();
    return _nameToIdMap[lower]
      || _nameToIdMap[lower.replace(/[^a-z0-9]/g, '')]
      || _nameToIdMap[lower.replace(/[^a-z0-9-]/g, '-')]
      || null;
  }


  // ── Tab navigation ───────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'stats')     renderStats();
      if (btn.dataset.tab === 'history')   renderHistory();
      if (btn.dataset.tab === 'opp-decks') renderOppDecks();
    });
  });

  // ────────────────────────────────────────────────────────────
  // SPRITE PICKER
  // ────────────────────────────────────────────────────────────
  let pickerCallback = null;
  let pickerSelected = [];

  const pickerModal    = document.getElementById('sprite-picker-modal');
  const pickerSearch   = document.getElementById('sprite-search');
  const pickerGrid     = document.getElementById('sprite-picker-grid');
  const pickerCurrent  = document.getElementById('sprite-picker-current');

  function openPicker(currentSprites, cb) {
    pickerSelected = [...(currentSprites || [])];
    pickerCallback = cb;
    pickerSearch.value = '';
    renderPickerGrid('');
    renderPickerCurrent();
    pickerModal.classList.remove('hidden');
    pickerSearch.focus();
  }

  function closePicker(confirm) {
    pickerModal.classList.add('hidden');
    if (confirm && pickerCallback) pickerCallback([...pickerSelected]);
    pickerCallback = null;
  }

  function renderPickerCurrent() {
    if (!pickerSelected.length) {
      pickerCurrent.innerHTML = '<span class="picker-none">No sprites selected</span>';
      return;
    }
    pickerCurrent.innerHTML = pickerSelected.map(name => {
      const id = spriteIdFromName(name);
      const imgHtml = id ? `<img src="${homeUrl(id)}" width="32" height="32" alt="${esc(name)}" loading="lazy" />` : '';
      return `
      <span class="picker-chip">
        ${imgHtml}
        <span class="picker-chip-name">${esc(name)}</span>
        <button type="button" class="picker-chip-remove" data-name="${esc(name)}" aria-label="Remove ${esc(name)}">✕</button>
      </span>
    `;
    }).join('');
    pickerCurrent.querySelectorAll('.picker-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        pickerSelected = pickerSelected.filter(s => s !== btn.dataset.name);
        renderPickerCurrent();
        renderPickerGrid(pickerSearch.value);
      });
    });
  }

  function renderPickerGrid(query) {
    const q = query.toLowerCase().trim();
    if (!_pokeList) {
      pickerGrid.innerHTML = '<p class="picker-hint">Loading Pokémon list…</p>';
      _pokeListReady.then(() => renderPickerGrid(pickerSearch.value));
      return;
    }

    const filtered = q
      ? _pokeList.filter(p => p.name.includes(q) || p.displayName.toLowerCase().includes(q))
      : _pokeList;

    const visible = filtered.slice(0, 120);
    pickerGrid.innerHTML = visible.map(p => {
      const sel = pickerSelected.includes(p.displayName);
      return `<button type="button" class="sprite-cell${sel ? ' selected' : ''}" data-name="${esc(p.displayName)}" title="${esc(p.displayName)}">
        <img src="${homeUrl(p.id)}" width="32" height="32" alt="${esc(p.displayName)}" loading="lazy" />
        <span class="sprite-cell-name">${esc(p.displayName)}</span>
      </button>`;
    }).join('');

    if (filtered.length > 120) {
      pickerGrid.insertAdjacentHTML('beforeend', `<p class="picker-hint">Showing 120 of ${filtered.length}. Type to narrow results.</p>`);
    } else if (!q) {
      pickerGrid.insertAdjacentHTML('beforeend', `<p class="picker-hint">${_pokeList.length} Pokémon + forms loaded. Type to search.</p>`);
    }

    pickerGrid.querySelectorAll('.sprite-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        if (pickerSelected.includes(name)) {
          pickerSelected = pickerSelected.filter(s => s !== name);
        } else if (pickerSelected.length < 2) {
          pickerSelected.push(name);
        } else {
          pickerSelected = [pickerSelected[1], name];
        }
        renderPickerCurrent();
        renderPickerGrid(pickerSearch.value);
      });
    });
  }

  pickerSearch.addEventListener('input', () => renderPickerGrid(pickerSearch.value));
  document.getElementById('sprite-picker-close').addEventListener('click', () => closePicker(false));
  document.getElementById('sprite-picker-cancel').addEventListener('click', () => closePicker(false));
  document.getElementById('sprite-picker-confirm').addEventListener('click', () => closePicker(true));
  pickerModal.addEventListener('click', e => { if (e.target === pickerModal) closePicker(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !pickerModal.classList.contains('hidden')) closePicker(false);
  });

  // ────────────────────────────────────────────────────────────
  // DECK MANAGEMENT
  // ────────────────────────────────────────────────────────────
  const addDeckForm  = document.getElementById('add-deck-form');
  const newDeckInput = document.getElementById('new-deck-name');
  const deckListEl   = document.getElementById('deck-list');
  const noDecksEl    = document.getElementById('no-decks');

  // Sprite picker buttons for new deck form
  let pendingSprites = [null, null];

  function updateDeckSpritePreview(idx) {
    const name    = pendingSprites[idx];
    const preview = document.getElementById(`sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`new-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  document.getElementById('pick-sprite-1-btn').addEventListener('click', () => {
    openPicker(pendingSprites[0] ? [pendingSprites[0]] : [], sprites => {
      pendingSprites[0] = sprites[0] || null;
      pendingSprites[1] = sprites[1] || pendingSprites[1] || null;
      updateDeckSpritePreview(0);
      if (sprites[1] !== undefined) updateDeckSpritePreview(1);
    });
  });

  document.getElementById('pick-sprite-2-btn').addEventListener('click', () => {
    openPicker(pendingSprites[1] ? [pendingSprites[1]] : [], sprites => {
      pendingSprites[1] = sprites[0] || null;
      updateDeckSpritePreview(1);
    });
  });

  addDeckForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = newDeckInput.value.trim();
    if (!name) return;
    if (decks.some(d => d.name === name)) {
      alert(`"${name}" already exists.`);
      return;
    }
    const sprites = pendingSprites.filter(Boolean);
    const archetype = document.getElementById('new-deck-archetype').value.trim();
    const rotation = document.getElementById('new-deck-rotation').value.trim();
    decks.push({ name, sprites, archetype, rotation });
    save(KEYS.decks, decks);
    newDeckInput.value = '';
    document.getElementById('new-deck-archetype').value = '';
    document.getElementById('new-deck-rotation').value = '';
    pendingSprites = [null, null];
    updateDeckSpritePreview(0);
    updateDeckSpritePreview(1);
    renderDecks();
    populateDeckSelects();
  });

  function renderDecks() {
    deckListEl.innerHTML = '';
    noDecksEl.classList.toggle('hidden', decks.length > 0);

    // Group by archetype
    const grouped = {};
    decks.forEach(deck => {
      const key = deck.archetype ? deck.archetype.trim() : '';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(deck);
    });

    // Sort: named archetypes first (alphabetically), then unassigned
    const archetypeKeys = Object.keys(grouped).sort((a, b) => {
      if (a === '' && b !== '') return 1;
      if (a !== '' && b === '') return -1;
      return a.localeCompare(b);
    });

    archetypeKeys.forEach(archKey => {
      if (archetypeKeys.length > 1 || archKey !== '') {
        const header = document.createElement('li');
        header.className = 'archetype-group-header';
        header.textContent = archKey || 'Unassigned';
        deckListEl.appendChild(header);
      }

      grouped[archKey].forEach(deck => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'deck-name-label';
        const sprites = deckSpritesHtml(deck.name);
        let nameHtml = (sprites ? sprites + ' ' : '') + esc(deck.name);
        if (deck.rotation) nameHtml += ` <span class="rotation-badge">${esc(deck.rotation)}</span>`;
        nameSpan.innerHTML = nameHtml;
        li.appendChild(nameSpan);

        const actions = document.createElement('div');
        actions.className = 'row-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.textContent = '✏ Edit';
        editBtn.addEventListener('click', () => openEditDeckModal(deck.name));
        actions.appendChild(editBtn);

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
        actions.appendChild(del);
        li.appendChild(actions);
        deckListEl.appendChild(li);
      });
    });
  }

  // ────────────────────────────────────────────────────────────
  // POPULATE DECK SELECTS (log form + history filter)
  // ────────────────────────────────────────────────────────────
  function populateDeckSelects() {
    const myDeckSel      = document.getElementById('my-deck');
    const historyDeckSel = document.getElementById('history-deck-filter');

    const savedMyDeck      = myDeckSel.value;
    const savedHistoryDeck = historyDeckSel.value;

    myDeckSel.innerHTML = '<option value="" disabled>— select your deck —</option>';
    historyDeckSel.innerHTML = '<option value="all">All Decks</option>';

    const allDeckNames = new Set([...decks.map(d => d.name), ...matches.map(m => m.myDeck)]);
    [...allDeckNames].sort().forEach(d => {
      myDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
      historyDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
    });

    if (savedMyDeck) myDeckSel.value = savedMyDeck;
    if (savedHistoryDeck) historyDeckSel.value = savedHistoryDeck;

    updateMyDeckSpritePreview();
    populateOppDeckSelects();
    populateStatsDeckFilter();
  }

  function populateStatsDeckFilter() {
    const sel = document.getElementById('stats-deck-filter');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="all">All Decks</option>';
    const allDeckNames = new Set([...decks.map(d => d.name), ...matches.map(m => m.myDeck)]);
    [...allDeckNames].sort().forEach(d => {
      sel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
    });
    if (cur && cur !== 'all') sel.value = cur;
  }

  function populateOppDeckSelects() {
    const names = getAllOppDeckNames();
    [
      document.getElementById('opp-deck-select'),
      document.getElementById('edit-opp-deck-select')
    ].forEach(sel => {
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = '<option value="" disabled selected>— select opponent deck —</option>';
      names.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        sel.appendChild(opt);
      });
      const newOpt = document.createElement('option');
      newOpt.value = '__new__';
      newOpt.textContent = '+ Add new opponent deck…';
      sel.appendChild(newOpt);
      if (cur && cur !== '') sel.value = cur;
    });

    // Also populate the edit match "your deck" select
    const editMyDeckSel = document.getElementById('edit-my-deck');
    if (editMyDeckSel) {
      const cur = editMyDeckSel.value;
      editMyDeckSel.innerHTML = '<option value="" disabled selected>— select your deck —</option>';
      const allDeckNames = new Set([...decks.map(d => d.name), ...matches.map(m => m.myDeck)]);
      [...allDeckNames].sort().forEach(d => {
        editMyDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
      });
      if (cur) editMyDeckSel.value = cur;
    }
  }

  function getAllOppDeckNames() {
    const names = new Set([...Object.keys(oppDecks), ...matches.map(m => m.oppDeck).filter(Boolean)]);
    return [...names].sort();
  }

  // ────────────────────────────────────────────────────────────
  // LOG MATCH
  // ────────────────────────────────────────────────────────────
  const logForm     = document.getElementById('log-form');
  const resultInput = document.getElementById('result-input');
  const logSuccess  = document.getElementById('log-success');

  function updateMyDeckSpritePreview() {
    const myDeckSel = document.getElementById('my-deck');
    const preview   = document.getElementById('my-deck-sprite-preview');
    if (!preview) return;
    preview.innerHTML = deckSpritesHtml(myDeckSel.value);
  }

  function updateOppDeckSpritePreview() {
    const name    = document.getElementById('opp-deck').value.trim();
    const preview = document.getElementById('opp-deck-sprite-preview');
    if (!preview) return;
    preview.innerHTML = oppSpritesHtml(name) || deckSpritesHtml(name);
  }

  document.getElementById('my-deck').addEventListener('change', updateMyDeckSpritePreview);

  // ── Shared helper: wire up opp-deck select + new-input → hidden input sync ──
  function setupOppDeckSelectHandlers(selectId, newWrapId, newInputId, hiddenId, onChangeCb) {
    document.getElementById(selectId).addEventListener('change', function () {
      const newWrap  = document.getElementById(newWrapId);
      const hiddenIn = document.getElementById(hiddenId);
      if (this.value === '__new__') {
        newWrap.classList.remove('hidden');
        hiddenIn.value = document.getElementById(newInputId).value.trim();
      } else {
        newWrap.classList.add('hidden');
        hiddenIn.value = this.value;
      }
      if (onChangeCb) onChangeCb();
    });
    document.getElementById(newInputId).addEventListener('input', function () {
      document.getElementById(hiddenId).value = this.value.trim();
      if (onChangeCb) onChangeCb();
    });
  }

  setupOppDeckSelectHandlers(
    'opp-deck-select', 'opp-new-deck-wrap', 'opp-deck-new-input', 'opp-deck',
    updateOppDeckSpritePreview
  );
  setupOppDeckSelectHandlers(
    'edit-opp-deck-select', 'edit-opp-new-deck-wrap', 'edit-opp-deck-new-input', 'edit-opp-deck',
    null
  );

  // Opponent sprite picker
  document.getElementById('pick-opp-sprite-btn').addEventListener('click', () => {
    const name = document.getElementById('opp-deck').value.trim();
    if (!name) { alert('Please select or enter the opponent\'s deck name first.'); return; }
    const { sprites: current, archetype: arch } = getOppDeckData(name);
    openPicker(current, sprites => {
      oppDecks[name] = { sprites, archetype: arch };
      if (!sprites.length) delete oppDecks[name];
      save(KEYS.oppDecks, oppDecks);
      updateOppDeckSpritePreview();
      populateOppDeckSelects();
    });
  });

  // Default date to today
  document.getElementById('match-date').valueAsDate = new Date();

  // Result toggle buttons
  document.querySelectorAll('#log-form .result-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#log-form .result-btn').forEach(b => b.classList.remove('selected'));
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

    if (!oppDeck) { alert('Please select an opponent deck or enter a new deck name.'); return; }
    if (!result) { alert('Please select Win, Loss, or Tie.'); return; }

    matches.push({ id: Date.now(), myDeck, oppDeck, result, event, date, notes });
    save(KEYS.matches, matches);

    logForm.reset();
    document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
    resultInput.value = '';
    document.getElementById('match-date').valueAsDate = new Date();
    document.getElementById('opp-deck-sprite-preview').innerHTML = '';
    document.getElementById('opp-deck').value = '';
    document.getElementById('opp-new-deck-wrap').classList.add('hidden');
    document.getElementById('opp-deck-new-input').value = '';

    logSuccess.classList.remove('hidden');
    setTimeout(() => logSuccess.classList.add('hidden'), 2500);

    populateDeckSelects();
    updateMyDeckSpritePreview();
  });

  // ────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────
  // STATS + CHARTS
  // ────────────────────────────────────────────────────────────
  const statsEventFilter = document.getElementById('stats-event-filter');
  statsEventFilter.addEventListener('change', renderStats);
  document.getElementById('stats-deck-filter').addEventListener('change', renderStats);
  document.getElementById('stats-rotation-filter').addEventListener('input', renderStats);

  // "Split Archetypes" toggle
  document.getElementById('split-arch-toggle').addEventListener('change', function () {
    splitArchetypes = this.checked;
    renderStats();
  });

  // Screenshot button
  document.getElementById('screenshot-btn').addEventListener('click', async () => {
    const card = document.getElementById('stats-card');
    const btn  = document.getElementById('screenshot-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Capturing…';
    try {
      const canvas = await html2canvas(card, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false
      });
      const url = canvas.toDataURL('image/png');
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `pkmn-stats-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Screenshot failed. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = '📸 Screenshot';
    }
  });

  let overallChartInst = null;

  // ── Pantone-inspired pie palette (10 colours + "Other" grey) ────────────────
  const PIE_PALETTE = [
    '#E8A400', // Pantone Saffron / Warm Gold
    '#0F4C81', // Pantone Classic Blue
    '#DD4132', // Pantone Flame
    '#5B9A68', // Pantone Greenery
    '#C72366', // Pantone Pink Yarrow
    '#4EC5C1', // Pantone Island Paradise
    '#8B4513', // Pantone Caramel
    '#7B5EA7', // Pantone Ultra Violet (muted)
    '#D27D52', // Pantone Tangerine
    '#2E8B57', // Pantone Jade
  ];
  const PIE_OTHER_COLOR = '#9E9E9E'; // Neutral grey for the "Other" catch-all

  function _sliceColor(idx) {
    return PIE_PALETTE[idx % PIE_PALETTE.length];
  }

  // ── Render the opponent-deck distribution pie with side legend ─
  function renderDeckDistributionChart(entries) {
    if (overallChartInst) { overallChartInst.destroy(); overallChartInst = null; }

    const chartWrap = document.getElementById('stats-chart-wrap');
    if (!entries.length) { chartWrap.classList.add('hidden'); return; }
    chartWrap.classList.remove('hidden');

    // Cap at top 10; bundle the rest into an "Other" slice
    const PIE_MAX = 10;
    let displayEntries = entries;
    if (entries.length > PIE_MAX) {
      const top   = entries.slice(0, PIE_MAX);
      const rest  = entries.slice(PIE_MAX);
      const oWins   = rest.reduce((s, e) => s + e.wins,   0);
      const oLosses = rest.reduce((s, e) => s + e.losses, 0);
      const oTies   = rest.reduce((s, e) => s + e.ties,   0);
      top.push({ label: 'Other', wins: oWins, losses: oLosses, ties: oTies, spriteUrl: UNOWN_SPRITE_URL, isOther: true });
      displayEntries = top;
    }

    const grandTotal = displayEntries.reduce((s, e) => s + e.wins + e.losses + e.ties, 0);
    const labels   = displayEntries.map(e => e.label);
    const data     = displayEntries.map(e => e.wins + e.losses + e.ties);
    const bgColors = displayEntries.map((e, i) => e.isOther ? PIE_OTHER_COLOR : _sliceColor(i));

    const canvas = document.getElementById('overall-pie');
    overallChartInst = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const pct = grandTotal ? Math.round((ctx.parsed / grandTotal) * 100) : 0;
                const e   = displayEntries[ctx.dataIndex];
                return ` ${ctx.label}: ${ctx.parsed} matches (${pct}%) — ${e.wins}W / ${e.losses}L`;
              }
            }
          }
        },
        animation: { duration: 400 }
      }
    });

    // Side legend: split entries left / right
    const leftEl  = document.getElementById('deck-pie-legend-left');
    const rightEl = document.getElementById('deck-pie-legend-right');
    leftEl.innerHTML  = '';
    rightEl.innerHTML = '';

    const half = Math.ceil(displayEntries.length / 2);

    displayEntries.forEach((entry, i) => {
      const entryTotal = entry.wins + entry.losses + entry.ties;
      const pct = grandTotal ? Math.round((entryTotal / grandTotal) * 100) : 0;

      const item = document.createElement('div');
      item.className = 'deck-pie-legend-item';

      const colorDot = document.createElement('span');
      colorDot.className = 'deck-pie-legend-dot';
      colorDot.style.background = entry.isOther ? PIE_OTHER_COLOR : _sliceColor(i);

      const info = document.createElement('div');
      info.className = 'deck-pie-legend-info';

      const nameRow = document.createElement('div');
      nameRow.className = 'deck-pie-legend-name';
      if (entry.spriteUrl) {
        const img = document.createElement('img');
        img.className = 'pkmn-sprite';
        img.src     = entry.spriteUrl;
        img.alt     = entry.label;
        img.width   = 24;
        img.height  = 24;
        nameRow.appendChild(img);
      }
      const nameTxt = document.createElement('span');
      nameTxt.textContent = entry.label;
      nameRow.appendChild(nameTxt);

      const pctEl = document.createElement('div');
      pctEl.className = 'deck-pie-legend-pct';
      pctEl.textContent = `${pct}% (${entry.wins}W / ${entry.losses}L)`;

      info.appendChild(nameRow);
      info.appendChild(pctEl);
      item.appendChild(colorDot);
      item.appendChild(info);

      if (i < half) {
        leftEl.appendChild(item);
      } else {
        rightEl.appendChild(item);
      }
    });
  }

  function renderStats() {
    const eventFilter    = statsEventFilter.value;
    const deckFilter     = document.getElementById('stats-deck-filter').value;
    const rotationFilter = document.getElementById('stats-rotation-filter').value.trim().toLowerCase();

    let filtered = eventFilter === 'all' ? matches : matches.filter(m => m.event === eventFilter);
    if (deckFilter !== 'all') filtered = filtered.filter(m => m.myDeck === deckFilter);
    if (rotationFilter) {
      filtered = filtered.filter(m => {
        const deck = decks.find(d => d.name === m.myDeck);
        return deck && (deck.rotation || '').toLowerCase().includes(rotationFilter);
      });
    }

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

    // Show/hide the archetype column
    const archetypeColHeader = document.getElementById('stats-archetype-col');
    if (archetypeColHeader) archetypeColHeader.style.display = splitArchetypes ? '' : 'none';

    // Build per-opponent-deck stats
    const oppMap = {};
    filtered.forEach(m => {
      const opp = m.oppDeck;
      if (!opp) return;
      if (!oppMap[opp]) oppMap[opp] = { wins: 0, losses: 0, ties: 0 };
      const key = { Win: 'wins', Loss: 'losses', Tie: 'ties' }[m.result];
      if (key) oppMap[opp][key]++;
    });

    const statsBody = document.getElementById('stats-body');
    const noStats   = document.getElementById('no-stats');

    if (Object.keys(oppMap).length === 0) {
      statsBody.innerHTML = '';
      noStats.classList.remove('hidden');
      document.getElementById('stats-chart-wrap').classList.add('hidden');
      if (overallChartInst) { overallChartInst.destroy(); overallChartInst = null; }
      document.getElementById('deck-pie-legend-left').innerHTML  = '';
      document.getElementById('deck-pie-legend-right').innerHTML = '';
      const collapseAllBtn = document.getElementById('arch-collapse-all-btn');
      if (collapseAllBtn) collapseAllBtn.classList.add('hidden');
      return;
    }
    noStats.classList.add('hidden');

    const oppRows = Object.entries(oppMap)
      .map(([opp, s]) => {
        const tot = s.wins + s.losses + s.ties;
        const wr  = tot ? Math.round((s.wins / tot) * 100) : 0;
        return { opp, ...s, total: tot, wr, archetype: getOppDeckArchetype(opp) };
      })
      .sort((a, b) => b.total - a.total);

    // Build pie entries
    let pieEntries;
    if (!splitArchetypes) {
      const archetypeMap = {};
      oppRows.forEach(r => {
        // Use archetype when set; fall back to a namespaced key so a deck named "X"
        // doesn't collide with an archetype also named "X".
        const key   = r.archetype ? r.archetype : '\x00' + r.opp;
        const label = r.archetype || r.opp;
        if (!archetypeMap[key]) archetypeMap[key] = { wins: 0, losses: 0, ties: 0, spriteUrl: null, label };
        archetypeMap[key].wins   += r.wins;
        archetypeMap[key].losses += r.losses;
        archetypeMap[key].ties   += r.ties;
        if (!archetypeMap[key].spriteUrl) archetypeMap[key].spriteUrl = getOppSpriteUrl(r.opp);
      });
      pieEntries = Object.values(archetypeMap)
        .sort((a, b) => (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties));
    } else {
      // splitArchetypes = true → individual deck rows
      pieEntries = oppRows.map(r => ({
        label: r.opp, wins: r.wins, losses: r.losses, ties: r.ties,
        spriteUrl: getOppSpriteUrl(r.opp)
      }));
    }

    renderDeckDistributionChart(pieEntries);

    // Render the stats table
    statsBody.innerHTML = '';

    if (!splitArchetypes) {
      const archetypeGroups = {};
      oppRows.forEach(r => {
        const key = r.archetype || '— No archetype —';
        if (!archetypeGroups[key]) archetypeGroups[key] = [];
        archetypeGroups[key].push(r);
      });

      const sortedGroups = Object.entries(archetypeGroups).sort((a, b) => {
        if (a[0] === '— No archetype —') return 1;
        if (b[0] === '— No archetype —') return -1;
        return a[0].localeCompare(b[0]);
      });

      // Show "Collapse All / Expand All" button above table when there are groups
      let collapseAllBtn = document.getElementById('arch-collapse-all-btn');
      if (!collapseAllBtn) {
        collapseAllBtn = document.createElement('button');
        collapseAllBtn.id        = 'arch-collapse-all-btn';
        collapseAllBtn.type      = 'button';
        collapseAllBtn.className = 'btn-secondary btn-sm arch-collapse-all-btn';
        const tableEl = document.getElementById('stats-table');
        tableEl.parentNode.insertBefore(collapseAllBtn, tableEl);
      }
      const allCollapsed = sortedGroups.every(([k]) => archetypeCollapsed[k]);
      collapseAllBtn.textContent = allCollapsed ? '⊞ Expand All' : '⊟ Collapse All';
      collapseAllBtn.onclick = () => {
        const nowAll = sortedGroups.every(([k]) => archetypeCollapsed[k]);
        sortedGroups.forEach(([k]) => { archetypeCollapsed[k] = !nowAll; });
        renderStats();
      };
      collapseAllBtn.classList.remove('hidden');

      sortedGroups.forEach(([archKey, rows]) => {
        const archWins   = rows.reduce((s, r) => s + r.wins,   0);
        const archLosses = rows.reduce((s, r) => s + r.losses, 0);
        const archTies   = rows.reduce((s, r) => s + r.ties,   0);
        const archTotal  = archWins + archLosses + archTies;
        const archWr     = archTotal ? Math.round((archWins / archTotal) * 100) : 0;
        const collapsed  = !!archetypeCollapsed[archKey];

        const archTr = document.createElement('tr');
        archTr.className = 'archetype-row';
        archTr.dataset.archKey = archKey;
        archTr.style.cursor = 'pointer';
        archTr.innerHTML = `
          <td class="sprite-col">
            <span class="arch-chevron">${collapsed ? '▶' : '▼'}</span>
          </td>
          <td><strong class="archetype-label">🗂 ${esc(archKey)}</strong></td>
          <td style="display:none"></td>
          <td>${archTotal}</td>
          <td>${archWins}</td>
          <td>${archLosses}</td>
          <td>${archTies}</td>
          <td>
            <div class="wr-bar">
              <span>${archWr}%</span>
              <div class="wr-track"><div class="wr-fill" style="width:${archWr}%"></div></div>
            </div>
          </td>
        `;
        archTr.addEventListener('click', () => {
          archetypeCollapsed[archKey] = !archetypeCollapsed[archKey];
          renderStats();
        });
        statsBody.appendChild(archTr);

        if (!collapsed) {
          rows.forEach(r => appendOppRow(r, statsBody, 'indent'));
        }
      });
    } else {
      // splitArchetypes = true → individual rows; hide collapse-all button
      const collapseAllBtn = document.getElementById('arch-collapse-all-btn');
      if (collapseAllBtn) collapseAllBtn.classList.add('hidden');
      oppRows.forEach(r => appendOppRow(r, statsBody, ''));
    }
  }

  function appendOppRow(r, statsBody, extraClass) {
    const tr = document.createElement('tr');
    if (extraClass) tr.classList.add(extraClass);
    tr.innerHTML = `
      <td class="sprite-col">${oppSpritesHtml(r.opp)}</td>
      <td><strong>${esc(r.opp)}</strong></td>
      <td style="${splitArchetypes ? '' : 'display:none'}">${esc(r.archetype || '')}</td>
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
    `;
    statsBody.appendChild(tr);
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

    let filtered = [...matches].reverse();
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
      deckCell.className = 'deck-cell';
      const spritesHtml = deckSpritesHtml(m.myDeck);
      if (spritesHtml) {
        deckCell.innerHTML = spritesHtml + ' <strong>' + esc(m.myDeck) + '</strong>';
      } else {
        const strong = document.createElement('strong');
        strong.textContent = m.myDeck;
        deckCell.appendChild(strong);
      }
      tr.appendChild(deckCell);

      const oppCell = document.createElement('td');
      oppCell.className = 'deck-cell';
      const oppSpr  = oppSpritesHtml(m.oppDeck);
      if (oppSpr) {
        oppCell.innerHTML = oppSpr + ' ' + esc(m.oppDeck);
      } else {
        oppCell.textContent = m.oppDeck;
      }
      tr.appendChild(oppCell);

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

      const actCell = document.createElement('td');
      actCell.className = 'action-cell';
      const actWrap = document.createElement('div');
      actWrap.className = 'row-actions';

      const editBtn = document.createElement('button');
      editBtn.className   = 'btn-edit';
      editBtn.textContent = '✏';
      editBtn.title       = 'Edit match';
      editBtn.addEventListener('click', () => openEditMatchModal(m.id));
      actWrap.appendChild(editBtn);

      const delBtn  = document.createElement('button');
      delBtn.className   = 'btn-delete';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        if (!confirm('Delete this match?')) return;
        matches = matches.filter(n => n.id !== m.id);
        save(KEYS.matches, matches);
        populateDeckSelects();
        renderHistory();
        renderStats();
      });
      actWrap.appendChild(delBtn);
      actCell.appendChild(actWrap);
      tr.appendChild(actCell);

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
  function spriteImg(name) {
    const id = spriteIdFromName(name);
    if (!id) return '';
    return `<img class="pkmn-sprite" src="${homeUrl(id)}" width="32" height="32" alt="${esc(String(name))}" title="${esc(String(name))}" loading="lazy" />`;
  }

  function deckSpritesHtml(deckName) {
    const deck = decks.find(d => d.name === deckName);
    if (!deck || !deck.sprites || !deck.sprites.length) return '';
    return deck.sprites.map(s => spriteImg(s)).join(' ');
  }

  function oppSpritesHtml(deckName) {
    if (!deckName) return '';
    const { sprites } = getOppDeckData(deckName);
    if (!sprites.length) return '';
    return sprites.map(s => spriteImg(s)).join(' ');
  }

  function getOppDeckArchetype(deckName) {
    if (!deckName) return '';
    return getOppDeckData(deckName).archetype;
  }

  function getOppSpriteUrl(deckName) {
    if (!deckName) return null;
    const { sprites } = getOppDeckData(deckName);
    if (!sprites.length) return null;
    const sid = spriteIdFromName(sprites[0]);
    return sid ? homeUrl(sid) : null;
  }

  function getOppDeckData(deckName) {
    const deck = oppDecks[deckName];
    if (!deck) return { sprites: [], archetype: '' };
    if (Array.isArray(deck)) return { sprites: deck, archetype: '' };
    return { sprites: deck.sprites || [], archetype: deck.archetype || '' };
  }

  // ────────────────────────────────────────────────────────────
  // OPP. DECKS TAB
  // ────────────────────────────────────────────────────────────
  let pendingOppSprites = [null, null];

  function updateOppDeckTabSpritePreview(idx) {
    const name    = pendingOppSprites[idx];
    const preview = document.getElementById(`opp-sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`new-opp-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  document.getElementById('pick-opp-s1-btn').addEventListener('click', () => {
    openPicker(pendingOppSprites[0] ? [pendingOppSprites[0]] : [], sprites => {
      pendingOppSprites[0] = sprites[0] || null;
      pendingOppSprites[1] = sprites[1] || pendingOppSprites[1] || null;
      updateOppDeckTabSpritePreview(0);
      if (sprites[1] !== undefined) updateOppDeckTabSpritePreview(1);
    });
  });

  document.getElementById('pick-opp-s2-btn').addEventListener('click', () => {
    openPicker(pendingOppSprites[1] ? [pendingOppSprites[1]] : [], sprites => {
      pendingOppSprites[1] = sprites[0] || null;
      updateOppDeckTabSpritePreview(1);
    });
  });

  document.getElementById('add-opp-deck-form').addEventListener('submit', e => {
    e.preventDefault();
    const name     = document.getElementById('new-opp-deck-name').value.trim();
    if (!name) return;
    const sprites   = pendingOppSprites.filter(Boolean);
    const archetype = document.getElementById('new-opp-deck-archetype').value.trim();
    const existing  = getOppDeckData(name);
    oppDecks[name] = {
      sprites:   sprites.length ? sprites : existing.sprites,
      archetype: archetype !== '' ? archetype : existing.archetype
    };
    save(KEYS.oppDecks, oppDecks);
    document.getElementById('new-opp-deck-name').value = '';
    document.getElementById('new-opp-deck-archetype').value = '';
    pendingOppSprites = [null, null];
    updateOppDeckTabSpritePreview(0);
    updateOppDeckTabSpritePreview(1);
    renderOppDecks();
    populateOppDeckSelects();
  });

  function renderOppDecks() {
    const listEl = document.getElementById('opp-deck-list');
    const noEl   = document.getElementById('no-opp-decks');
    if (!listEl) return;
    listEl.innerHTML = '';
    const names = getAllOppDeckNames();
    noEl.classList.toggle('hidden', names.length > 0);

    // Group by archetype
    const grouped = {};
    names.forEach(name => {
      const arch = getOppDeckArchetype(name);
      if (!grouped[arch]) grouped[arch] = [];
      grouped[arch].push(name);
    });

    const archetypeKeys = Object.keys(grouped).sort((a, b) => {
      if (a === '' && b !== '') return 1;
      if (a !== '' && b === '') return -1;
      return a.localeCompare(b);
    });

    const showHeaders = archetypeKeys.length > 1 || (archetypeKeys.length === 1 && archetypeKeys[0] !== '');

    archetypeKeys.forEach(archKey => {
      if (showHeaders) {
        const header = document.createElement('li');
        header.className = 'archetype-group-header';
        header.textContent = archKey || 'Unassigned';
        listEl.appendChild(header);
      }
      grouped[archKey].forEach(name => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'deck-name-label';
        const sprites = oppSpritesHtml(name);
        nameSpan.innerHTML = (sprites ? sprites + ' ' : '') + esc(name);
        li.appendChild(nameSpan);

        const actions = document.createElement('div');
        actions.className = 'row-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.textContent = '✏ Edit';
        editBtn.addEventListener('click', () => openEditOppDeckModal(name));
        actions.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete';
        delBtn.textContent = 'Remove';
        delBtn.addEventListener('click', () => {
          if (!confirm(`Remove "${name}" from opponent decks? This won't delete match history.`)) return;
          delete oppDecks[name];
          save(KEYS.oppDecks, oppDecks);
          renderOppDecks();
          populateOppDeckSelects();
        });
        actions.appendChild(delBtn);
        li.appendChild(actions);
        listEl.appendChild(li);
      });
    });
  }

  // ────────────────────────────────────────────────────────────
  // EDIT DECK MODAL
  // ────────────────────────────────────────────────────────────
  let editDeckSprites = [null, null];

  function updateEditDeckSpritePreview(idx) {
    const name    = editDeckSprites[idx];
    const preview = document.getElementById(`edit-sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`edit-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  function openEditDeckModal(deckName) {
    const deck = decks.find(d => d.name === deckName);
    if (!deck) return;
    document.getElementById('edit-deck-original-name').value = deckName;
    document.getElementById('edit-deck-name').value = deckName;
    document.getElementById('edit-deck-archetype').value = deck.archetype || '';
    document.getElementById('edit-deck-rotation').value = deck.rotation || '';
    editDeckSprites[0] = deck.sprites[0] || null;
    editDeckSprites[1] = deck.sprites[1] || null;
    updateEditDeckSpritePreview(0);
    updateEditDeckSpritePreview(1);
    document.getElementById('edit-deck-modal').classList.remove('hidden');
  }

  function closeEditDeckModal() {
    document.getElementById('edit-deck-modal').classList.add('hidden');
  }

  document.getElementById('edit-deck-close').addEventListener('click', closeEditDeckModal);
  document.getElementById('edit-deck-cancel').addEventListener('click', closeEditDeckModal);
  document.getElementById('edit-deck-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-deck-modal')) closeEditDeckModal();
  });

  document.getElementById('edit-pick-sprite-1-btn').addEventListener('click', () => {
    openPicker(editDeckSprites[0] ? [editDeckSprites[0]] : [], sprites => {
      editDeckSprites[0] = sprites[0] || null;
      editDeckSprites[1] = sprites[1] || editDeckSprites[1] || null;
      updateEditDeckSpritePreview(0);
      if (sprites[1] !== undefined) updateEditDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-pick-sprite-2-btn').addEventListener('click', () => {
    openPicker(editDeckSprites[1] ? [editDeckSprites[1]] : [], sprites => {
      editDeckSprites[1] = sprites[0] || null;
      updateEditDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-deck-save').addEventListener('click', () => {
    const originalName = document.getElementById('edit-deck-original-name').value;
    const newName      = document.getElementById('edit-deck-name').value.trim();
    const archetype    = document.getElementById('edit-deck-archetype').value.trim();
    if (!newName) { alert('Deck name cannot be empty.'); return; }
    if (newName !== originalName && decks.some(d => d.name === newName)) {
      alert(`"${newName}" already exists.`); return;
    }
    const sprites = editDeckSprites.filter(Boolean);
    const idx = decks.findIndex(d => d.name === originalName);
    if (idx === -1) return;
    decks[idx] = { name: newName, sprites, archetype, rotation: document.getElementById('edit-deck-rotation').value.trim() };
    // Update match history references if name changed
    if (newName !== originalName) {
      matches = matches.map(m => m.myDeck === originalName ? { ...m, myDeck: newName } : m);
      save(KEYS.matches, matches);
    }
    save(KEYS.decks, decks);
    closeEditDeckModal();
    renderDecks();
    populateDeckSelects();
    renderHistory();
    renderStats();
  });

  // ────────────────────────────────────────────────────────────
  // EDIT OPP. DECK MODAL
  // ────────────────────────────────────────────────────────────
  let editOppDeckSprites = [null, null];

  function updateEditOppDeckSpritePreview(idx) {
    const name    = editOppDeckSprites[idx];
    const preview = document.getElementById(`edit-opp-sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`edit-opp-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  function openEditOppDeckModal(deckName) {
    const { sprites, archetype } = getOppDeckData(deckName);
    document.getElementById('edit-opp-deck-original-name').value = deckName;
    document.getElementById('edit-opp-deck-name').value = deckName;
    document.getElementById('edit-opp-deck-archetype').value = archetype;
    editOppDeckSprites[0] = sprites[0] || null;
    editOppDeckSprites[1] = sprites[1] || null;
    updateEditOppDeckSpritePreview(0);
    updateEditOppDeckSpritePreview(1);
    document.getElementById('edit-opp-deck-modal').classList.remove('hidden');
  }

  function closeEditOppDeckModal() {
    document.getElementById('edit-opp-deck-modal').classList.add('hidden');
  }

  document.getElementById('edit-opp-deck-close').addEventListener('click', closeEditOppDeckModal);
  document.getElementById('edit-opp-deck-cancel').addEventListener('click', closeEditOppDeckModal);
  document.getElementById('edit-opp-deck-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-opp-deck-modal')) closeEditOppDeckModal();
  });

  document.getElementById('edit-opp-pick-sprite-1-btn').addEventListener('click', () => {
    openPicker(editOppDeckSprites[0] ? [editOppDeckSprites[0]] : [], sprites => {
      editOppDeckSprites[0] = sprites[0] || null;
      editOppDeckSprites[1] = sprites[1] || editOppDeckSprites[1] || null;
      updateEditOppDeckSpritePreview(0);
      if (sprites[1] !== undefined) updateEditOppDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-opp-pick-sprite-2-btn').addEventListener('click', () => {
    openPicker(editOppDeckSprites[1] ? [editOppDeckSprites[1]] : [], sprites => {
      editOppDeckSprites[1] = sprites[0] || null;
      updateEditOppDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-opp-deck-save').addEventListener('click', () => {
    const originalName = document.getElementById('edit-opp-deck-original-name').value;
    const newName      = document.getElementById('edit-opp-deck-name').value.trim();
    if (!newName) { alert('Deck name cannot be empty.'); return; }
    const sprites   = editOppDeckSprites.filter(Boolean);
    const archetype = document.getElementById('edit-opp-deck-archetype').value.trim();
    // If name changed, migrate oppDecks key and match history
    if (newName !== originalName) {
      delete oppDecks[originalName];
      matches = matches.map(m => m.oppDeck === originalName ? { ...m, oppDeck: newName } : m);
      save(KEYS.matches, matches);
    }
    oppDecks[newName] = { sprites, archetype };
    save(KEYS.oppDecks, oppDecks);
    closeEditOppDeckModal();
    renderOppDecks();
    populateOppDeckSelects();
    renderHistory();
    renderStats();
  });

  // ────────────────────────────────────────────────────────────
  // EDIT MATCH MODAL
  // ────────────────────────────────────────────────────────────
  function openEditMatchModal(matchId) {
    const m = matches.find(x => x.id === matchId);
    if (!m) return;

    // Populate your deck select
    const myDeckSel = document.getElementById('edit-my-deck');
    const allNames = new Set([...decks.map(d => d.name), ...matches.map(x => x.myDeck)]);
    myDeckSel.innerHTML = '<option value="" disabled selected>— select your deck —</option>';
    [...allNames].sort().forEach(d => {
      myDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
    });

    // Populate opp deck select
    populateOppDeckSelects();

    document.getElementById('edit-match-id').value     = m.id;
    myDeckSel.value                                     = m.myDeck;
    document.getElementById('edit-event-type').value   = m.event;
    document.getElementById('edit-match-date').value   = m.date;
    document.getElementById('edit-match-notes').value  = m.notes || '';

    // Set opp deck
    const oppSel   = document.getElementById('edit-opp-deck-select');
    const newWrap  = document.getElementById('edit-opp-new-deck-wrap');
    const hiddenIn = document.getElementById('edit-opp-deck');
    const knownNames = getAllOppDeckNames();
    if (knownNames.includes(m.oppDeck)) {
      oppSel.value = m.oppDeck;
      newWrap.classList.add('hidden');
    } else {
      oppSel.value = '__new__';
      newWrap.classList.remove('hidden');
      document.getElementById('edit-opp-deck-new-input').value = m.oppDeck;
    }
    hiddenIn.value = m.oppDeck;

    // Set result
    const editResultInput = document.getElementById('edit-result-input');
    editResultInput.value = m.result;
    document.querySelectorAll('.edit-result-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.result === m.result);
    });

    document.getElementById('edit-match-modal').classList.remove('hidden');
  }

  function closeEditMatchModal() {
    document.getElementById('edit-match-modal').classList.add('hidden');
  }

  document.getElementById('edit-match-close').addEventListener('click', closeEditMatchModal);
  document.getElementById('edit-match-cancel').addEventListener('click', closeEditMatchModal);
  document.getElementById('edit-match-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-match-modal')) closeEditMatchModal();
  });

  // Edit match result buttons
  document.querySelectorAll('.edit-result-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.edit-result-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('edit-result-input').value = btn.dataset.result;
    });
  });

  document.getElementById('edit-match-save').addEventListener('click', () => {
    const id      = Number(document.getElementById('edit-match-id').value);
    const myDeck  = document.getElementById('edit-my-deck').value;
    const oppDeck = document.getElementById('edit-opp-deck').value.trim();
    const result  = document.getElementById('edit-result-input').value;
    const event   = document.getElementById('edit-event-type').value;
    const date    = document.getElementById('edit-match-date').value;
    const notes   = document.getElementById('edit-match-notes').value.trim();

    if (!myDeck)  { alert('Please select your deck.'); return; }
    if (!oppDeck) { alert('Please select an opponent deck or enter a new deck name.'); return; }
    if (!result)  { alert('Please select a result.'); return; }
    if (!event)   { alert('Please select an event.'); return; }
    if (!date)    { alert('Please enter a date.'); return; }

    const idx = matches.findIndex(m => m.id === id);
    if (idx === -1) return;
    matches[idx] = { id, myDeck, oppDeck, result, event, date, notes };
    save(KEYS.matches, matches);
    closeEditMatchModal();
    populateDeckSelects();
    renderHistory();
    renderStats();
  });

  // ────────────────────────────────────────────────────────────
  // DATA TAB – Export / Import / Clear
  // ────────────────────────────────────────────────────────────

  document.getElementById('export-btn').addEventListener('click', () => {
    const data = {
      decks,
      oppDecks,
      matches
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pkmn-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const importFileInput   = document.getElementById('import-file');
  const importFileNameEl  = document.getElementById('import-file-name');
  const importBtn         = document.getElementById('import-btn');
  const importSuccessEl   = document.getElementById('import-success');
  const importErrorEl     = document.getElementById('import-error');
  let pendingImportData   = null;

  importFileInput.addEventListener('change', () => {
    const file = importFileInput.files[0];
    importSuccessEl.classList.add('hidden');
    importErrorEl.classList.add('hidden');
    pendingImportData = null;
    importBtn.disabled = true;

    if (!file) {
      importFileNameEl.textContent = 'No file chosen';
      return;
    }
    importFileNameEl.textContent = file.name;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid format');
        // Validate decks array
        if ('decks' in parsed) {
          if (!Array.isArray(parsed.decks)) throw new Error('decks must be an array');
          for (const d of parsed.decks) {
            if (typeof d !== 'string' && (typeof d !== 'object' || d === null || typeof d.name !== 'string')) {
              throw new Error('Each deck must have a name');
            }
          }
        }
        // Validate oppDecks object
        if ('oppDecks' in parsed) {
          if (typeof parsed.oppDecks !== 'object' || parsed.oppDecks === null || Array.isArray(parsed.oppDecks)) {
            throw new Error('oppDecks must be an object');
          }
          for (const val of Object.values(parsed.oppDecks)) {
            if (!Array.isArray(val) && (typeof val !== 'object' || val === null)) {
              throw new Error('oppDecks values must be arrays or deck objects');
            }
          }
        }
        // Validate matches array
        if ('matches' in parsed) {
          if (!Array.isArray(parsed.matches)) throw new Error('matches must be an array');
          for (const m of parsed.matches) {
            if (typeof m !== 'object' || m === null ||
                typeof m.myDeck !== 'string' || typeof m.oppDeck !== 'string' ||
                typeof m.result !== 'string' || typeof m.date !== 'string') {
              throw new Error('Each match must have myDeck, oppDeck, result, and date');
            }
          }
        }
        pendingImportData = parsed;
        importBtn.disabled = false;
      } catch (err) {
        importErrorEl.textContent = `Invalid file: ${err.message}. Please choose a valid export file.`;
        importErrorEl.classList.remove('hidden');
      }
    };
    reader.readAsText(file);
  });

  importBtn.addEventListener('click', () => {
    if (!pendingImportData) return;
    if (!confirm('This will replace all existing data. Continue?')) return;

    if (Array.isArray(pendingImportData.decks)) {
      decks = pendingImportData.decks.map(d => typeof d === 'string' ? { name: d, sprites: [], archetype: '' } : { ...d, archetype: d.archetype || '' });
      save(KEYS.decks, decks);
    }
    if (pendingImportData.oppDecks && typeof pendingImportData.oppDecks === 'object' && !Array.isArray(pendingImportData.oppDecks)) {
      oppDecks = pendingImportData.oppDecks;
      // Migrate imported oppDecks to new format
      Object.keys(oppDecks).forEach(name => {
        if (Array.isArray(oppDecks[name])) {
          oppDecks[name] = { sprites: oppDecks[name], archetype: '' };
        } else {
          oppDecks[name] = { sprites: oppDecks[name]?.sprites || [], archetype: oppDecks[name]?.archetype || '' };
        }
      });
      save(KEYS.oppDecks, oppDecks);
    }
    if (Array.isArray(pendingImportData.matches)) {
      matches = pendingImportData.matches;
      save(KEYS.matches, matches);
    }

    pendingImportData = null;
    importBtn.disabled = true;
    importFileInput.value = '';
    importFileNameEl.textContent = 'No file chosen';
    importErrorEl.classList.add('hidden');
    importSuccessEl.classList.remove('hidden');

    renderDecks();
    renderOppDecks();
    populateDeckSelects();
    renderStats();
    renderHistory();
  });

  document.getElementById('clear-matches-btn').addEventListener('click', () => {
    if (!confirm('Delete all match history? This cannot be undone.')) return;
    matches = [];
    save(KEYS.matches, matches);
    renderStats();
    renderHistory();
  });

  document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (!confirm('Delete ALL data (decks, opponent decks, and match history)? This cannot be undone.')) return;
    decks    = [];
    oppDecks = {};
    matches  = [];
    save(KEYS.decks,    decks);
    save(KEYS.oppDecks, oppDecks);
    save(KEYS.matches,  matches);
    renderDecks();
    renderOppDecks();
    populateDeckSelects();
    renderStats();
    renderHistory();
  });

  // ────────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────────
  renderDecks();
  populateDeckSelects();
  renderStats();
  renderHistory();

  // Once the PokeAPI list loads (first visit), refresh sprite displays
  _pokeListReady.then(() => {
    if (!Object.keys(_nameToIdMap).length) return; // shouldn't happen
    renderDecks();
    renderOppDecks();
    renderStats();
    if (!document.getElementById('sprite-picker-modal').classList.contains('hidden')) {
      renderPickerGrid(document.getElementById('sprite-search').value);
    }
  }).catch(() => {});
})();
