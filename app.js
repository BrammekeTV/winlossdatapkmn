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
  decks = decks.map(d => typeof d === 'string' ? { name: d, sprites: [] } : d);

  // ── Pokémon slugs (Gen 1–8 base forms) ──────────────────────
  const POKEMON_SLUGS = ['abomasnow','abra','absol','accelgor','aegislash','aerodactyl','aggron','aipom','alakazam','alcremie','alomomola','altaria','amaura','ambipom','amoonguss','ampharos','anorith','appletun','applin','araquanid','arbok','arcanine','arceus','archen','archeops','arctovish','arctozolt','ariados','armaldo','aromatisse','aron','arrokuda','articuno','audino','aurorus','avalugg','axew','azelf','azumarill','azurill','bagon','baltoy','banette','barbaracle','barboach','barraskewda','basculin','bastiodon','bayleef','beartic','beautifly','beedrill','beheeyem','beldum','bellossom','bellsprout','bergmite','bewear','bibarel','bidoof','binacle','bisharp','blacephalon','blastoise','blaziken','blipbug','blissey','blitzle','boldore','boltund','bonsly','bouffalant','bounsweet','braixen','braviary','breloom','brionne','bronzong','bronzor','bruxish','budew','buizel','bulbasaur','buneary','bunnelby','burmy','butterfree','buzzwole','cacnea','cacturne','camerupt','carbink','carkol','carnivine','carracosta','carvanha','cascoon','castform','caterpie','celebi','celesteela','centiskorch','chandelure','chansey','charizard','charjabug','charmander','charmeleon','chatot','cherrim','cherubi','chesnaught','chespin','chewtle','chikorita','chimchar','chimecho','chinchou','chingling','cinccino','cinderace','clamperl','clauncher','clawitzer','claydol','clefable','clefairy','cleffa','clobbopus','cloyster','coalossal','cobalion','cofagrigus','combee','combusken','comfey','conkeldurr','copperajah','corphish','corsola','corviknight','corvisquire','cosmoem','cosmog','cottonee','crabominable','crabrawler','cradily','cramorant','cranidos','crawdaunt','cresselia','croagunk','crobat','croconaw','crustle','cryogonal','cubchoo','cubone','cufant','cursola','cutiefly','cyndaquil','darkrai','darmanitan','dartrix','darumaka','decidueye','dedenne','deerling','deino','delcatty','delibird','delphox','deoxys','dewgong','dewott','dewpider','dhelmise','dialga','diancie','diggersby','diglett','ditto','dodrio','doduo','donphan','dottler','doublade','dracovish','dracozolt','dragalge','dragapult','dragonair','dragonite','drakloak','drampa','drapion','dratini','drednaw','dreepy','drifblim','drifloon','drilbur','drizzile','drowzee','druddigon','dubwool','ducklett','dugtrio','dunsparce','duosion','duraludon','durant','dusclops','dusknoir','duskull','dustox','dwebble','eelektrik','eelektross','eevee','eiscue','ekans','eldegoss','electabuzz','electivire','electrike','electrode','elekid','elgyem','emboar','emolga','empoleon','entei','escavalier','espeon','espurr','eternatus','excadrill','exeggcute','exeggutor','exploud','falinks','farfetchd','fearow','feebas','fennekin','feraligatr','ferroseed','ferrothorn','finneon','flaaffy','flabebe','flapple','flareon','fletchinder','fletchling','floatzel','floette','florges','flygon','fomantis','foongus','forretress','fraxure','frillish','froakie','frogadier','froslass','frosmoth','furfrou','furret','gabite','gallade','galvantula','garbodor','garchomp','gardevoir','gastly','gastrodon','genesect','gengar','geodude','gible','gigalith','girafarig','giratina','glaceon','glalie','glameow','gligar','gliscor','gloom','gogoat','golbat','goldeen','golduck','golem','golett','golisopod','golurk','goodra','goomy','gorebyss','gossifleur','gothita','gothitelle','gothorita','gourgeist','granbull','grapploct','graveler','greedent','greninja','grimer','grimmsnarl','grookey','grotle','groudon','grovyle','growlithe','grubbin','grumpig','gulpin','gumshoos','gurdurr','guzzlord','gyarados','happiny','hariyama','hatenna','hatterene','hattrem','haunter','hawlucha','haxorus','heatmor','heatran','heliolisk','helioptile','heracross','herdier','hippopotas','hippowdon','hitmonchan','hitmonlee','hitmontop','honchkrow','honedge','hoopa','hoothoot','hoppip','horsea','houndoom','houndour','huntail','hydreigon','hypno','igglybuff','illumise','impidimp','incineroar','indeedee','infernape','inkay','inteleon','ivysaur','jellicent','jigglypuff','jirachi','jolteon','joltik','jumpluff','jynx','kabuto','kabutops','kadabra','kakuna','kangaskhan','karrablast','kartana','kecleon','keldeo','kingdra','kingler','kirlia','klang','klefki','klink','klinklang','koffing','komala','krabby','kricketot','kricketune','krokorok','krookodile','kubfu','kyogre','kyurem','lairon','lampent','landorus','lanturn','lapras','larvesta','larvitar','latias','latios','leafeon','leavanny','ledian','ledyba','lickilicky','lickitung','liepard','lileep','lilligant','lillipup','linoone','litleo','litten','litwick','lombre','lopunny','lotad','loudred','lucario','ludicolo','lugia','lumineon','lunala','lunatone','lurantis','luvdisc','luxio','luxray','lycanroc','machamp','machoke','machop','magby','magcargo','magearna','magikarp','magmar','magmortar','magnemite','magneton','magnezone','makuhita','malamar','mamoswine','manaphy','mandibuzz','manectric','mankey','mantine','mantyke','maractus','mareanie','mareep','marill','marowak','marshadow','marshtomp','masquerain','mawile','medicham','meditite','meganium','melmetal','meloetta','meltan','meowstic','meowth','mesprit','metagross','metang','metapod','mew','mewtwo','mienfoo','mienshao','mightyena','milcery','milotic','miltank','mimikyu','minccino','minior','minun','misdreavus','mismagius','moltres','monferno','morelull','morgrem','morpeko','mothim','mudbray','mudkip','mudsdale','muk','munchlax','munna','murkrow','musharna','naganadel','natu','necrozma','nickit','nidoking','nidoqueen','nidorina','nidorino','nihilego','nincada','ninetales','ninjask','noctowl','noibat','noivern','nosepass','numel','nuzleaf','obstagoon','octillery','oddish','omanyte','omastar','onix','oranguru','orbeetle','oricorio','oshawott','pachirisu','palkia','palossand','palpitoad','pancham','pangoro','panpour','pansage','pansear','paras','parasect','passimian','patrat','pawniard','pelipper','perrserker','persian','petilil','phanpy','phantump','pheromosa','phione','pichu','pidgeot','pidgeotto','pidgey','pidove','pignite','pikachu','pikipek','piloswine','pincurchin','pineco','pinsir','piplup','plusle','poipole','politoed','poliwag','poliwhirl','poliwrath','polteageist','ponyta','poochyena','popplio','porygon','porygon2','primarina','primeape','prinplup','probopass','psyduck','pumpkaboo','pupitar','purrloin','purugly','pyroar','pyukumuku','quagsire','quilava','quilladin','qwilfish','raboot','raichu','raikou','ralts','rampardos','rapidash','raticate','rattata','rayquaza','regice','regigigas','regirock','registeel','relicanth','remoraid','reshiram','reuniclus','rhydon','rhyhorn','rhyperior','ribombee','rillaboom','riolu','rockruff','roggenrola','rolycoly','rookidee','roselia','roserade','rotom','rowlet','rufflet','runerigus','sableye','salamence','salandit','salazzle','samurott','sandaconda','sandile','sandshrew','sandslash','sandygast','sawk','sawsbuck','scatterbug','sceptile','scizor','scolipede','scorbunny','scrafty','scraggy','scyther','seadra','seaking','sealeo','seedot','seel','seismitoad','sentret','serperior','servine','seviper','sewaddle','sharpedo','shaymin','shedinja','shelgon','shellder','shellos','shelmet','shieldon','shiftry','shiinotic','shinx','shroomish','shuckle','shuppet','sigilyph','silcoon','silicobra','silvally','simipour','simisage','simisear','sinistea','sirfetchd','sizzlipede','skarmory','skiddo','skiploom','skitty','skorupi','skrelp','skuntank','skwovet','slaking','slakoth','sliggoo','slowbro','slowking','slowpoke','slugma','slurpuff','smeargle','smoochum','sneasel','snivy','snom','snorlax','snorunt','snover','snubbull','sobble','solgaleo','solosis','solrock','spearow','spewpa','spheal','spinarak','spinda','spiritomb','spoink','spritzee','squirtle','stakataka','stantler','staraptor','staravia','starly','starmie','staryu','steelix','steenee','stonjourner','stoutland','stufful','stunfisk','stunky','sudowoodo','suicune','sunflora','sunkern','surskit','swablu','swadloon','swalot','swampert','swanna','swellow','swinub','swirlix','swoobat','sylveon','taillow','talonflame','tangela','tangrowth','tauros','teddiursa','tentacool','tentacruel','tepig','terrakion','thievul','throh','thundurus','thwackey','timburr','tirtouga','togedemaru','togekiss','togepi','togetic','torchic','torkoal','tornadus','torracat','torterra','totodile','toucannon','toxapex','toxel','toxicroak','toxtricity','tranquill','trapinch','treecko','trevenant','tropius','trubbish','trumbeak','tsareena','turtonator','turtwig','tympole','tynamo','typhlosion','tyranitar','tyrantrum','tyrogue','tyrunt','umbreon','unfezant','unown','ursaring','urshifu','uxie','vanillish','vanillite','vanilluxe','vaporeon','venipede','venomoth','venonat','venusaur','vespiquen','vibrava','victini','victreebel','vigoroth','vikavolt','vileplume','virizion','vivillon','volbeat','volcanion','volcarona','voltorb','vullaby','vulpix','wailmer','wailord','walrein','wartortle','watchog','weavile','weedle','weepinbell','weezing','whimsicott','whirlipede','whiscash','whismur','wigglytuff','wimpod','wingull','wishiwashi','wobbuffet','woobat','wooloo','wooper','wormadam','wurmple','wynaut','xatu','xerneas','xurkitree','yamask','yamper','yanma','yanmega','yungoos','yveltal','zacian','zamazenta','zangoose','zapdos','zarude','zebstrika','zekrom','zeraora','zigzagoon','zoroark','zorua','zubat','zweilous','zygarde'];

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
    pickerCurrent.innerHTML = pickerSelected.map(s => `
      <span class="picker-chip">
        <span class="pokesprite pokemon ${s}"></span>
        <span class="picker-chip-name">${s}</span>
        <button type="button" class="picker-chip-remove" data-slug="${esc(s)}" aria-label="Remove ${s}">✕</button>
      </span>
    `).join('');
    pickerCurrent.querySelectorAll('.picker-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        pickerSelected = pickerSelected.filter(s => s !== btn.dataset.slug);
        renderPickerCurrent();
        renderPickerGrid(pickerSearch.value);
      });
    });
  }

  function renderPickerGrid(query) {
    const q = query.toLowerCase().trim();
    const matches = q
      ? POKEMON_SLUGS.filter(s => s.includes(q))
      : POKEMON_SLUGS;

    const visible = matches.slice(0, 120);
    pickerGrid.innerHTML = visible.map(s => {
      const sel = pickerSelected.includes(s);
      return `<button type="button" class="sprite-cell${sel ? ' selected' : ''}" data-slug="${s}" title="${s}">
        <span class="pokesprite pokemon ${s}"></span>
        <span class="sprite-cell-name">${s}</span>
      </button>`;
    }).join('');

    if (matches.length > 120) {
      pickerGrid.insertAdjacentHTML('beforeend', `<p class="picker-hint">Showing 120 of ${matches.length}. Type to narrow results.</p>`);
    }

    pickerGrid.querySelectorAll('.sprite-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        if (pickerSelected.includes(slug)) {
          pickerSelected = pickerSelected.filter(s => s !== slug);
        } else if (pickerSelected.length < 2) {
          pickerSelected.push(slug);
        } else {
          pickerSelected = [pickerSelected[1], slug];
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
    const slug    = pendingSprites[idx];
    const preview = document.getElementById(`sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`new-sprite-${idx + 1}`);
    if (slug) {
      preview.className = `pokesprite pokemon ${slug}`;
      preview.style.display = 'inline-block';
      input.value = slug;
    } else {
      preview.className = 'pokesprite pokemon';
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
    decks.push({ name, sprites });
    save(KEYS.decks, decks);
    newDeckInput.value = '';
    pendingSprites = [null, null];
    updateDeckSpritePreview(0);
    updateDeckSpritePreview(1);
    renderDecks();
    populateDeckSelects();
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
    updateOppDeckDatalist();
  }

  function updateOppDeckDatalist() {
    const dl = document.getElementById('opp-deck-list');
    if (!dl) return;
    const names = new Set([...matches.map(m => m.oppDeck), ...Object.keys(oppDecks)]);
    dl.innerHTML = [...names].filter(Boolean).sort()
      .map(n => `<option value="${esc(n)}"></option>`).join('');
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
    preview.innerHTML = oppSpritesHtml(name);
  }

  document.getElementById('my-deck').addEventListener('change', updateMyDeckSpritePreview);
  document.getElementById('opp-deck').addEventListener('input', updateOppDeckSpritePreview);

  // Opponent sprite picker
  document.getElementById('pick-opp-sprite-btn').addEventListener('click', () => {
    const name = document.getElementById('opp-deck').value.trim();
    if (!name) { alert('Please enter the opponent\'s deck name first.'); return; }
    const current = oppDecks[name] || [];
    openPicker(current, sprites => {
      if (sprites.length) {
        oppDecks[name] = sprites;
      } else {
        delete oppDecks[name];
      }
      save(KEYS.oppDecks, oppDecks);
      updateOppDeckSpritePreview();
      updateOppDeckDatalist();
    });
  });

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

    logForm.reset();
    document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
    resultInput.value = '';
    document.getElementById('match-date').valueAsDate = new Date();
    document.getElementById('opp-deck-sprite-preview').innerHTML = '';

    logSuccess.classList.remove('hidden');
    setTimeout(() => logSuccess.classList.add('hidden'), 2500);

    populateDeckSelects();
    updateMyDeckSpritePreview();
  });

  // ────────────────────────────────────────────────────────────
  // STATS + CHARTS
  // ────────────────────────────────────────────────────────────
  const statsEventFilter = document.getElementById('stats-event-filter');
  statsEventFilter.addEventListener('change', renderStats);

  let overallChartInst = null;
  const deckChartInsts = {};

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

    // Overall pie chart
    const chartWrap = document.getElementById('stats-chart-wrap');
    if (total > 0) {
      chartWrap.classList.remove('hidden');
      renderPieChart('overall-pie', [wins, losses, ties], overallChartInst, inst => { overallChartInst = inst; });
    } else {
      chartWrap.classList.add('hidden');
    }

    // Per-deck breakdown
    const deckMap = {};
    filtered.forEach(m => {
      if (!deckMap[m.myDeck]) deckMap[m.myDeck] = { wins: 0, losses: 0, ties: 0, opponents: {} };
      const key = { Win: 'wins', Loss: 'losses', Tie: 'ties' }[m.result];
      if (key) deckMap[m.myDeck][key]++;
      if (m.oppDeck) {
        if (!deckMap[m.myDeck].opponents[m.oppDeck]) {
          deckMap[m.myDeck].opponents[m.oppDeck] = { wins: 0, losses: 0, ties: 0 };
        }
        const oppKey = { Win: 'wins', Loss: 'losses', Tie: 'ties' }[m.result];
        if (oppKey) deckMap[m.myDeck].opponents[m.oppDeck][oppKey]++;
      }
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
        const tot = s.wins + s.losses + s.ties;
        const wr  = tot ? Math.round((s.wins / tot) * 100) : 0;
        return { deck, ...s, total: tot, wr };
      })
      .sort((a, b) => b.wr - a.wr || b.total - a.total);

    statsBody.innerHTML = '';
    Object.values(deckChartInsts).forEach(c => c && c.destroy());
    Object.keys(deckChartInsts).forEach(k => delete deckChartInsts[k]);

    rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
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
        <td>
          <button type="button" class="btn-expand" data-deck="${esc(r.deck)}" aria-expanded="false">▶ Opponents</button>
        </td>
      `;
      statsBody.appendChild(tr);

      // Expandable opponent row
      const oppTr = document.createElement('tr');
      oppTr.className = 'opp-breakdown-row hidden';
      oppTr.dataset.deck = r.deck;
      const opponents = r.opponents;
      const oppEntries = Object.entries(opponents)
        .map(([opp, s]) => {
          const t  = s.wins + s.losses + s.ties;
          const wr = t ? Math.round((s.wins / t) * 100) : 0;
          return { opp, ...s, total: t, wr };
        })
        .sort((a, b) => b.total - a.total);

      const canvasId = `deck-pie-${idx}`;
      oppTr.innerHTML = `
        <td colspan="8" class="opp-breakdown-cell">
          <div class="opp-breakdown-inner">
            <div class="opp-breakdown-chart-wrap">
              <canvas id="${canvasId}" width="180" height="180"></canvas>
              <p class="chart-label">${esc(r.deck)}</p>
            </div>
            <table class="opp-table">
              <thead>
                <tr>
                  <th>Opponent Deck</th>
                  <th>W</th><th>L</th><th>T</th><th>Win%</th>
                </tr>
              </thead>
              <tbody>
                ${oppEntries.map(o => `
                  <tr>
                    <td>${oppSpritesHtml(o.opp) ? oppSpritesHtml(o.opp) + ' ' : ''}${esc(o.opp)}</td>
                    <td class="opp-w">${o.wins}</td>
                    <td class="opp-l">${o.losses}</td>
                    <td class="opp-t">${o.ties}</td>
                    <td>${o.wr}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </td>
      `;
      statsBody.appendChild(oppTr);

      // Toggle button
      tr.querySelector('.btn-expand').addEventListener('click', function () {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        this.textContent = expanded ? '▶ Opponents' : '▼ Opponents';
        oppTr.classList.toggle('hidden', expanded);
        if (!expanded && !deckChartInsts[canvasId]) {
          deckChartInsts[canvasId] = renderPieChart(canvasId, [r.wins, r.losses, r.ties], null, null);
        }
      });
    });
  }

  function renderPieChart(canvasId, data, existingInst, setInst) {
    if (existingInst) existingInst.destroy();
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const inst = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses', 'Ties'],
        datasets: [{
          data,
          backgroundColor: ['#2f9e44', '#c92a2a', '#868e96'],
          borderWidth: 2,
          borderColor: '#ffffff',
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
        },
        animation: { duration: 400 }
      }
    });
    if (setInst) setInst(inst);
    return inst;
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

      const delCell = document.createElement('td');
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

  function oppSpritesHtml(deckName) {
    if (!deckName) return '';
    const sprites = oppDecks[deckName];
    if (!sprites || !sprites.length) return '';
    return sprites.map(s => `<span class="pokesprite pokemon ${spriteSlug(s)}"></span>`).join(' ');
  }

  // ────────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────────
  renderDecks();
  populateDeckSelects();
  renderStats();
  renderHistory();
})();
