// SECTION 19: EVENT HANDLERS
// ============================================================
function screenshake() {
  const el = $('app');
  el.classList.add('screenshake');
  setTimeout(() => el.classList.remove('screenshake'), 300);
}

// Tab clicks

// Title menu / page back buttons (standalone-style navigation, no logic change)
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.getAttribute('data-goto');
    if (t) { switchTab(t); sfxClick(); }
  });
});

// 养成 / 抽卡 / 组卡
document.getElementById('btn-up-hp')?.addEventListener('click', () => { sfxClick(); tryUpgradeHp(); });
document.getElementById('btn-up-atk')?.addEventListener('click', () => { sfxClick(); tryUpgradeAtk(); });
document.getElementById('btn-gacha-once')?.addEventListener('click', () => { sfxClick(); doGachaOnce(); });
document.getElementById('btn-deck-clear')?.addEventListener('click', () => {
  sfxClick();
  ensureMetaDefaults();
  GS.builtDeckIds = STARTER_CARD_IDS.slice();
  saveMeta();
  renderDeckBuildUI();
  notify('已重置为初始五张基础技', 'var(--cyan)');
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
    sfxClick();
  });
});

// Start buttons
$('btn-new-game').addEventListener('click', () => { initAudio(); newGame(); sfxClick(); });
$('btn-continue').addEventListener('click', () => {
  initAudio();
  if (loadGame()) {
    switchTab('game');
    renderDungeonMap();
    renderDeckPanel();
    updateHeaderUI();
    if (GS.inBattle) {
      $('battle-overlay').classList.add('active');
      updateBattleUI();
      if (GS.turnPhase === 'card') {
        renderHand();
        $('btn-end-turn').style.display = 'inline-block';
        $('battle-q-area').style.opacity = '0.4';
      } else {
        $('hand-area').innerHTML = '<div style="color:var(--text2);font-size:10px;text-align:center;width:100%;padding:12px">📝 答题获取能量中...</div>';
        $('btn-end-turn').style.display = 'inline-block';
        nextBattleQuestion();
      }
      updateEnergyUI();
    }
    notify('继续冒险！', 'var(--cyan)');
  }
});

// Capture is now handled through ball selection in offerCapture()
// Old button handlers removed

// End turn
$('btn-end-turn').addEventListener('click', () => {
  if (GS.turnPhase === 'question') {
    // Voluntarily stop question chain, enter card phase with energy earned so far
    enterCardPhase();
    return;
  }
  // Already in card phase, enemy attacks
  endTurn();
});

// Game over restart
$('btn-go-restart').addEventListener('click', () => {
  $('go-overlay').classList.remove('active');
  switchTab('start');
  updateStartScreen();
});

// Map click
$('map-canvas').addEventListener('click', (e) => onMapClick(e));
$('map-canvas').addEventListener('touchend', (e) => {
  e.preventDefault();
  onMapClick(e.changedTouches[0]);
});

// Deck toggle
$('btn-deck-toggle').addEventListener('click', () => {
  renderDeckPanel();
  $('deck-panel').classList.toggle('active');
});
$('btn-deck-close').addEventListener('click', () => {
  $('deck-panel').classList.remove('active');
});

// Detail close
function closePkmDetail() {
  const btns = $('detail-btns');
  if (btns) btns.remove();
  $('detail-overlay').classList.remove('active');
}
$('detail-close').addEventListener('click', closePkmDetail);
$('detail-overlay').addEventListener('click', (e) => {
  if (e.target === $('detail-overlay')) closePkmDetail();
});

// Pokedex filter
$('pokedex-filter').addEventListener('click', (e) => {
  if (e.target.classList.contains('poke-filter-btn')) {
    $('pokedex-filter').querySelectorAll('.poke-filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    GS.pokeFilter = e.target.dataset.filter;
    renderPokedex();
  }
});

// Deckbuild filter
$('deckbuild-filter').addEventListener('click', (e) => {
  if (e.target.classList.contains('poke-filter-btn')) {
    $('deckbuild-filter').querySelectorAll('.poke-filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    GS.deckBuildFilter = e.target.dataset.filter;
    renderDeckBuildUI();
  }
});

// Bank search
$('bank-search-input').addEventListener('input', () => {
  GS.bankPage = 1;
  renderBank();
});

// Settings
$('btn-toggle-sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  $('btn-toggle-sound').textContent = soundEnabled ? '开启' : '关闭';
  saveMeta();
  if (soundEnabled) initAudio();
});
// 页面内确认（替代 window.confirm，移动端可用）
function showConfirm(message, opts) {
  opts = opts || {};
  return new Promise((resolve) => {
    const overlay = $('confirm-overlay');
    const titleEl = $('confirm-title');
    const msgEl = $('confirm-message');
    const okBtn = $('confirm-ok');
    const cancelBtn = $('confirm-cancel');
    if (!overlay || !okBtn || !cancelBtn) {
      // 极端降级：没有 DOM 时才用系统弹窗
      resolve(window.confirm(message));
      return;
    }
    titleEl.textContent = opts.title || '请确认';
    msgEl.textContent = message || '';
    okBtn.textContent = opts.okText || '确定';
    cancelBtn.textContent = opts.cancelText || '取消';
    overlay.classList.add('active');

    const cleanup = (result) => {
      overlay.classList.remove('active');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick = null;
      resolve(result);
    };
    okBtn.onclick = (e) => { e.stopPropagation(); cleanup(true); };
    cancelBtn.onclick = (e) => { e.stopPropagation(); cleanup(false); };
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(false); };
  });
}

function doResetAllData() {
  localStorage.removeItem('dungeonDrive_save');
  localStorage.removeItem('dungeonDrive_meta');
  localStorage.removeItem('dungeonDrive_importedQuestions');
  GS.collected = {};
  GS.team = [];
  GS.pokeBalls = { normal: 3, great: 0, ultra: 0, beast: 0, master: 0 };
  GS.bestScore = 0;
  GS.bestFloor = 0;
  GS.totalRuns = 0;
  GS.metaGold = 0;
  GS.metaHpLv = 0;
  GS.metaAtkLv = 0;
  GS.ownedCards = null;
  GS.builtDeckIds = null;
  ensureMetaDefaults();
  // 同步清掉本局进行中状态，避免残留
  try {
    GS.gameOver = false;
    GS.inBattle = false;
    GS.deck = [];
    GS.hand = [];
    GS.drawPile = [];
    GS.discardPile = [];
  } catch (e) {}
  updateSettingsUI();
  updateStartScreen();
  // 按钮状态
  const cont = $('btn-continue');
  if (cont) cont.disabled = true;
  notify('所有数据已重置', 'var(--red)');
}

$('btn-reset-all').addEventListener('click', async () => {
  sfxClick();
  const ok = await showConfirm('确定要重置所有数据吗？此操作不可恢复！', {
    title: '重置所有数据',
    okText: '确认重置',
    cancelText: '取消',
  });
  if (ok) doResetAllData();
});

// Import questions
$('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data) && data.length > 0) {
        const parsed = data.map((q, i) => ({
          id: q.id || `imp_${i}`,
          q: q.q || q.question,
          opts: q.opts || q.options,
          ans: q.ans || q.answer || 0,
        }));
        GS.allQuestions = parsed;
        bankQuestions = parsed;
        localStorage.setItem('dungeonDrive_importedQuestions', JSON.stringify(parsed));
        notify(`成功导入 ${parsed.length} 道题！`, 'var(--green)');
      }
    } catch(ex) {
      notify('文件格式错误', 'var(--red)');
    }
  };
  reader.readAsText(file);
});

// Resize
window.addEventListener('resize', () => {
  resizeParticleCanvas();
  renderDungeonMap();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (GS.gameOver && (e.key === 'Enter' || e.key === ' ')) {
    $('go-overlay').classList.remove('active');
    switchTab('start');
    updateStartScreen();
    return;
  }
  if (!GS.inBattle) return;

  const keys = ['1', '2', '3', '4'];
  const idx = keys.indexOf(e.key);
  if (idx >= 0) {
    const btns = $('battle-options').querySelectorAll('.battle-opt-btn');
    if (btns[idx] && !btns[idx].classList.contains('disabled')) {
      btns[idx].click();
    }
  }
  if (e.key === 'e' || e.key === 'E') {
    if (GS.turnPhase === 'question' && GS.turnCorrect > 0) {
      enterCardPhase();
    } else if (GS.turnPhase === 'card') {
      endTurn();
    }
  }
});

// ============================================================

// SECTION 20: GAME LOOP & INIT
// ============================================================
let lastTime = performance.now();
let animFrameId = null;

function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  renderParticles(dt);

  if (!GS.gameOver && GS.inBattle) {
    updateBattleUI();
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

function updateStartScreen() {
  $('best-record').textContent = GS.bestScore > 0 ? `${GS.bestScore} 分 (第${GS.bestFloor}层)` : '暂无';
  $('btn-continue').disabled = !hasSaveData();

  // Show Pikachu
  const sprite = getPkmSprite(25);
  if (sprite) {
    $('start-pkm-img').src = sprite;
    $('start-pkm-img').style.display = 'block';
  }
}

function hasSaveData() {
  try {
    const raw = localStorage.getItem('dungeonDrive_save');
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !data.gameOver;
  } catch(e) { return false; }
}

// ============================================================

// SECTION 21: INIT
// ============================================================
function init() {
  initParticles();
  resizeParticleCanvas();
  loadMeta();
  ensureMetaDefaults();
  loadQuestions();

  updateStartScreen();
  updateHeaderUI();
  updateSettingsUI();
  $('floor-indicator').textContent = '第 1 层';

  // Check for continue
  if (hasSaveData()) {
    $('btn-continue').disabled = false;
  }

  // Start game loop
  lastTime = performance.now();
  animFrameId = requestAnimationFrame(gameLoop);
}

init();

