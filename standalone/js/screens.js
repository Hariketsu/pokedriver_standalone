// SECTION 8: PARTICLES
// ============================================================
let particles = [];
let pCanvas = null;
let pCtx = null;

function initParticles() {
  pCanvas = $('particle-canvas');
  if (pCanvas) pCtx = pCanvas.getContext('2d');
}

function resizeParticleCanvas() {
  if (!pCanvas) return;
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120 - 40,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 0.5 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 3,
      color
    });
  }
}

function renderParticles(dt) {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt; // gravity
    const alpha = p.life / p.maxLife;
    pCtx.globalAlpha = alpha;
    pCtx.fillStyle = p.color;
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    pCtx.fill();
  }
  pCtx.globalAlpha = 1;
}

// ============================================================

// SECTION 16: POKEDEX
// ============================================================
function renderPokedex() {
  if (typeof POKEMON_DATA === 'undefined') {
    $('pokedex-grid').innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px">宝可梦数据加载中...</div>';
    return;
  }

  const filter = GS.pokeFilter;
  let list = POKEMON_DATA.filter(p => p.i === 1);

  if (filter === 'collected') list = list.filter(p => GS.collected[p.id]);
  else if (filter === 'locked') list = list.filter(p => !GS.collected[p.id]);
  else if (['c','u','r','l'].includes(filter)) list = list.filter(p => p.r === filter);

  $('pdex-collected').textContent = Object.keys(GS.collected).length;
  $('pdex-total').textContent = POKEMON_DATA.length;

  const grid = $('pokedex-grid');
  grid.innerHTML = '';

  list.forEach(p => {
    const collected = !!GS.collected[p.id];
    const el = document.createElement('div');
    el.className = `pkm-card rarity-${p.r}`;
    if (!collected) el.classList.add('locked');
    if (collected) el.classList.add('collected');

    const sprite = getPkmSprite(p.id);
    el.innerHTML = `
      <div class="pkm-id">#${p.id}</div>
      ${sprite ? `<img class="pkm-img" src="${sprite}" alt="${p.c}">` : `<div class="pkm-img-fallback">👾</div>`}
      <div class="pkm-name">${collected ? p.c : '???'}${GS.team.includes(p.id) ? ' ⭐' : ''}</div>
      <div class="pkm-rarity">${RARITY_NAMES[p.r] || ''}</div>
    `;

    el.onclick = () => {
      if (collected) showPkmDetail(p);
    };
    grid.appendChild(el);
  });
}

function showPkmDetail(pkm) {
  const overlay = $('detail-overlay');
  overlay.classList.add('active');
  $('detail-img').src = getPkmSprite(pkm.id);
  $('detail-name').textContent = `#${pkm.id} ${pkm.c}`;
  $('detail-name').style.color = RARITY_COLORS[pkm.r] || '#fff';
  const bst = getBST(pkm.id);
  const inTeam = GS.team.includes(pkm.id);
  const isActive = GS.team.length > 0 && GS.team[0] === pkm.id;

  $('detail-stats').innerHTML = `
    稀有度: ${RARITY_NAMES[pkm.r] || '??'}<br>
    种族值(BST): ${bst || '??'}<br>
    英文名: ${pkm.n}<br>
    ${TIER1_LEGEND.has(pkm.id) ? '👑 一级传说' : TIER2_LEGEND.has(pkm.id) ? '👑 二级传说' : MYTHICAL.has(pkm.id) ? '✨ 幻之宝可梦' : ''}
    ${inTeam ? '<br>📍 已在队伍中' + (isActive ? ' (出战)' : '') : ''}
  `;

  // Add team management buttons
  const existingBtns = $('detail-btns');
  if (existingBtns) existingBtns.remove();

  const btnContainer = document.createElement('div');
  btnContainer.id = 'detail-btns';
  btnContainer.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:8px';

  if (inTeam) {
    if (!isActive) {
      const setActiveBtn = document.createElement('button');
      setActiveBtn.textContent = '⭐ 设为出战';
      setActiveBtn.style.cssText = 'padding:8px 16px;background:var(--gold);border:none;border-radius:6px;color:#000;font-weight:700;cursor:pointer;font-family:inherit;font-size:11px';
      setActiveBtn.onclick = () => {
        GS.team = GS.team.filter(id => id !== pkm.id);
        GS.team.unshift(pkm.id);
        overlay.classList.remove('active');
        renderPokedex();
        saveMeta();
        notify(`${pkm.c} 设为出战宝可梦！`, 'var(--gold)');
      };
      btnContainer.appendChild(setActiveBtn);
    }
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '👋 移出队伍';
    removeBtn.style.cssText = 'padding:6px 12px;background:var(--surface);border:1px solid var(--red);border-radius:6px;color:var(--red);cursor:pointer;font-family:inherit;font-size:10px';
    removeBtn.onclick = () => {
      GS.team = GS.team.filter(id => id !== pkm.id);
      overlay.classList.remove('active');
      renderPokedex();
      saveMeta();
      notify(`${pkm.c} 移出队伍`, 'var(--text2)');
    };
    btnContainer.appendChild(removeBtn);
  } else if (GS.collected[pkm.id]) {
    if (GS.team.length < MAX_TEAM_SIZE) {
      const addBtn = document.createElement('button');
      addBtn.textContent = '➕ 加入队伍';
      addBtn.style.cssText = 'padding:8px 16px;background:var(--cyan);border:none;border-radius:6px;color:#000;font-weight:700;cursor:pointer;font-family:inherit;font-size:11px';
      addBtn.onclick = () => {
        GS.team.push(pkm.id);
        overlay.classList.remove('active');
        renderPokedex();
        saveMeta();
        notify(`${pkm.c} 加入队伍！`, 'var(--cyan)');
      };
      btnContainer.appendChild(addBtn);
    } else {
      const fullText = document.createElement('div');
      fullText.style.cssText = 'font-size:10px;color:var(--text2)';
      fullText.textContent = `队伍已满(${MAX_TEAM_SIZE}只)，请先移出其他宝可梦`;
      btnContainer.appendChild(fullText);
    }
  }

  $('detail-card').appendChild(btnContainer);
}

// ============================================================

// SECTION 17: QUESTION BANK
// ============================================================
let bankQuestions = [];
function renderBank() {
  if (bankQuestions.length === 0) {
    bankQuestions = GS.allQuestions.length > 0 ? GS.allQuestions :
      (typeof BUILTIN_QUESTIONS !== 'undefined' ? BUILTIN_QUESTIONS : []);
  }

  const search = ($('bank-search-input')?.value || '').toLowerCase();
  let filtered = bankQuestions;
  if (search) {
    filtered = bankQuestions.filter(q => q.q.toLowerCase().includes(search) || q.id.includes(search));
  }

  const page = GS.bankPage;
  const perPage = 30;
  const totalPages = Math.ceil(filtered.length / perPage);
  const start = (page - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const list = $('bank-list');
  if (!list) return;
  list.innerHTML = '';
  // force full-width layout at runtime
  list.style.cssText = 'display:block;width:100%;max-width:none;margin:0;padding:12px 14px 16px;box-sizing:border-box;overflow-x:hidden;overflow-y:auto;color:#e8f0ff;position:relative;left:0;transform:none;';
  const pageEl = $('page-bank');
  if (pageEl) {
    pageEl.style.left = '0';
    pageEl.style.right = '0';
    pageEl.style.width = '100%';
    pageEl.style.margin = '0';
    pageEl.style.transform = 'none';
    pageEl.style.overflow = 'hidden';
    pageEl.style.color = '#e8f0ff';
  }
  const bankPage = pageEl && pageEl.querySelector('.bank-page');
  if (bankPage) {
    bankPage.style.cssText = 'display:flex;flex-direction:column;flex:1 1 auto;min-height:0;width:100%;margin:0;padding:0;position:relative;left:0;transform:none;color:#e8f0ff;box-sizing:border-box;';
  }
  if (pageItems.length === 0) {
    list.innerHTML = '<div style="padding:24px;text-align:center;color:#8fa3cf;font-size:14px">暂无题目数据</div>';
  }

  pageItems.forEach((q, i) => {
    const el = document.createElement('div');
    el.className = 'bank-item';
    var qText = (q && q.q != null) ? String(q.q) : '(无题干)';
    var opts = Array.isArray(q.opts) ? q.opts : [];
    var ans = (typeof q.ans === 'number') ? q.ans : 0;
    var optsHtml = '';
    for (var oi = 0; oi < opts.length; oi++) {
      optsHtml += '<div class="detail-opt' + (oi === ans ? ' is-ans' : '') + '"></div>';
    }
    el.innerHTML =
      '<div class="bank-item-header">' +
        '<span class="q-num">' + (start + i + 1) + '</span>' +
        '<div class="q-preview"></div>' +
        '<span class="q-toggle">▼</span>' +
      '</div>' +
      '<div class="bank-item-detail">' +
        optsHtml +
        '<div class="detail-ans">正确答案: ' + String.fromCharCode(65 + ans) + '</div>' +
      '</div>';
    el.querySelector('.q-preview').textContent = qText;
    var optEls = el.querySelectorAll('.detail-opt');
    for (var oi2 = 0; oi2 < opts.length; oi2++) {
      if (optEls[oi2]) optEls[oi2].textContent = String(opts[oi2]) + (oi2 === ans ? ' ✅' : '');
    }
    el.querySelector('.bank-item-header').onclick = () => {
      el.classList.toggle('expanded');
    };
    /* bank-item-force */
    el.style.cssText = 'display:block;width:100%;max-width:none;margin:0 0 10px 0;box-sizing:border-box;background:#101830;border:1px solid #26355e;border-radius:12px;color:#e8f0ff;min-height:52px;position:relative;left:0;transform:none;overflow:visible;';
    var prev = el.querySelector('.q-preview');
    if (prev) prev.style.cssText = 'display:block;flex:1;min-width:0;color:#e8f0ff;-webkit-text-fill-color:#e8f0ff;font-size:15px;line-height:1.6;white-space:normal;word-break:break-word;overflow:visible;height:auto;opacity:1;visibility:visible;';
    list.appendChild(el);
  });

  // Pagination
  const pag = $('bank-pagination');
  pag.innerHTML = `
    <button onclick="GS.bankPage=1;renderBank()" ${page===1?'disabled':''}>«</button>
    <button onclick="GS.bankPage=Math.max(1,${page}-1);renderBank()" ${page===1?'disabled':''}>‹</button>
    <span class="page-info">${page}/${Math.max(1,totalPages)}</span>
    <button onclick="GS.bankPage=Math.min(${totalPages},${page}+1);renderBank()" ${page>=totalPages?'disabled':''}>›</button>
    <button onclick="GS.bankPage=${totalPages};renderBank()" ${page>=totalPages?'disabled':''}>»</button>
  `;
}

// ============================================================

// SECTION 18: SETTINGS
// ============================================================

// ============================================================
// TRAIN / GACHA / DECK BUILD UI
// ============================================================
function renderTrainUI() {
  ensureMetaDefaults();
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set('train-meta-gold', GS.metaGold);
  set('train-hp-lv', GS.metaHpLv);
  set('train-hp-val', getMaxHpFromMeta());
  set('train-hp-cost', upgradeCost(GS.metaHpLv));
  set('train-atk-lv', GS.metaAtkLv);
  set('train-atk-val', getPlayerAtk());
  set('train-atk-cost', upgradeCost(GS.metaAtkLv));
}

function tryUpgradeHp() {
  ensureMetaDefaults();
  const cost = upgradeCost(GS.metaHpLv);
  if (GS.metaGold < cost) { notify('养成金币不足！', 'var(--red)'); return; }
  GS.metaGold -= cost;
  GS.metaHpLv += 1;
  // 若在冒险中，同步提升上限并回一点血
  if (!GS.gameOver && GS.maxHp) {
    GS.maxHp = getMaxHpFromMeta();
    GS.hp = Math.min(GS.maxHp, GS.hp + HP_PER_LEVEL);
  }
  saveMeta();
  renderTrainUI();
  updateHeaderUI();
  notify('生命升级！+3 最大HP', 'var(--green)');
  sfxHeal();
}

function tryUpgradeAtk() {
  ensureMetaDefaults();
  const cost = upgradeCost(GS.metaAtkLv);
  if (GS.metaGold < cost) { notify('养成金币不足！', 'var(--red)'); return; }
  GS.metaGold -= cost;
  GS.metaAtkLv += 1;
  saveMeta();
  renderTrainUI();
  updateHeaderUI();
  notify('攻击升级！+1 攻击', 'var(--cyan)');
  sfxGold();
}

function rarityWeight(r) {
  return r === 'c' ? 50 : r === 'u' ? 28 : r === 'r' ? 16 : 6;
}

function renderGachaUI() {
  ensureMetaDefaults();
  const owned = getOwnedCardIds().length;
  const total = ALL_CARDS.length;
  if ($('gacha-gold')) $('gacha-gold').textContent = GS.metaGold;
  if ($('gacha-owned')) $('gacha-owned').textContent = owned + '/' + total;
  const btn = $('btn-gacha-once');
  if (btn) btn.disabled = owned >= total || GS.metaGold < GACHA_COST;
}

function doGachaOnce() {
  ensureMetaDefaults();
  if (GS.metaGold < GACHA_COST) { notify('养成金币不足！', 'var(--red)'); return; }
  const pool = ALL_CARDS.filter(c => !GS.ownedCards[c.id]);
  if (pool.length === 0) { notify('已集齐全部技能！', 'var(--gold)'); renderGachaUI(); return; }
  // weighted
  let totalW = 0;
  const weights = pool.map(c => { const w = rarityWeight(c.rarity); totalW += w; return w; });
  let r = Math.random() * totalW;
  let pick = pool[0];
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) { pick = pool[i]; break; }
  }
  GS.metaGold -= GACHA_COST;
  GS.ownedCards[pick.id] = true;
  saveMeta();
  const rareName = RARITY_NAMES[pick.rarity] || pick.rarity;
  if ($('gacha-result')) {
    $('gacha-result').innerHTML =
      '<div style="font-size:36px">' + pick.icon + '</div>' +
      '<div style="font-size:18px;font-weight:800;color:var(--cyan);margin-top:6px">' + pick.name + '</div>' +
      '<div style="color:var(--dim);margin-top:4px">' + rareName + ' · ' + pick.desc + '</div>';
  }
  notify('获得技能：' + pick.name, 'var(--gold)');
  sfxGold();
  renderGachaUI();
}

function renderDeckBuildUI() {
  ensureMetaDefaults();
  if ($('deckbuild-max')) $('deckbuild-max').textContent = DECK_MAX;
  if ($('deckbuild-count')) $('deckbuild-count').textContent = GS.builtDeckIds.length;

  const active = $('deckbuild-active');
  const pool = $('deckbuild-pool');
  if (!active || !pool) return;
  active.innerHTML = '';
  pool.innerHTML = '';

  GS.builtDeckIds.forEach((id, idx) => {
    const c = ALL_CARDS.find(x => x.id === id);
    if (!c) return;
    const chip = document.createElement('div');
    chip.className = 'deck-chip';
    chip.innerHTML = c.icon + ' ' + c.name;
    chip.title = '点击移出';
    chip.onclick = () => {
      GS.builtDeckIds.splice(idx, 1);
      saveMeta();
      renderDeckBuildUI();
    };
    active.appendChild(chip);
  });

  const filter = GS.deckBuildFilter || 'all';
  const cats = ['atk', 'def', 'heal', 'control', 'status'];
  const catName = { atk:'攻击', def:'防御', heal:'恢复', control:'控制', status:'异常' };
  ALL_CARDS.forEach(c => {
    const owned = !!GS.ownedCards[c.id];
    // Apply filter
    if (filter === 'collected' && !owned) return;
    if (filter === 'locked' && owned) return;

    const inDeck = GS.builtDeckIds.includes(c.id);
    const el = document.createElement('div');
    el.className = 'deck-pick-card' + (inDeck ? ' in-deck' : '') + (!owned ? ' locked' : '');
    el.innerHTML =
      '<div style="font-size:22px">' + c.icon + '</div>' +
      '<div class="dp-name">' + c.name + '</div>' +
      '<div class="dp-meta">' + (catName[c.cat] || c.type) + ' · 费' + c.cost + ' · ' + (RARITY_NAMES[c.rarity] || '') +
      (!owned ? ' · 未拥有' : inDeck ? ' · 已在牌组' : '') + '</div>' +
      '<div class="dp-meta" style="margin-top:4px">' + c.desc + '</div>';
    if (owned) {
      el.onclick = () => {
        if (inDeck) {
          GS.builtDeckIds = GS.builtDeckIds.filter(x => x !== c.id);
        } else {
          if (GS.builtDeckIds.length >= DECK_MAX) {
            notify('牌组已满（' + DECK_MAX + '）', 'var(--red)');
            return;
          }
          GS.builtDeckIds.push(c.id);
        }
        saveMeta();
        renderDeckBuildUI();
      };
    }
    pool.appendChild(el);
  });
}


function updateSettingsUI() {
  $('btn-toggle-sound').textContent = soundEnabled ? '开启' : '关闭';
  $('settings-stats').textContent = `总游戏: ${GS.totalRuns} | 最高分: ${GS.bestScore} | 最高层: ${GS.bestFloor}`;
}

// ============================================================
