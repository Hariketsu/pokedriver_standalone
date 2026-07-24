// SECTION 0: CONSTANTS & CONFIG
// ============================================================
const FLOORS_PER_RUN = Infinity; // 无限闯关，无层数通关上限
const NODES_PER_FLOOR = 7;
const STARTING_HP = 80;
const STARTING_GOLD = 0;
const MAX_ENERGY = 3;
const MAX_TEAM_SIZE = 1;
const DECK_MAX = 12;
const HAND_DRAW = 5;
const GACHA_COST = 50;
const UPGRADE_BASE_COST = 5;
const UPGRADE_COST_STEP = 2;
const HP_PER_LEVEL = 3;
const ATK_PER_LEVEL = 1;

const RARITY_COLORS = { c: '#90a4ae', u: '#00e5ff', r: '#ff9100', l: '#ffd740' };
const RARITY_NAMES = { c: '普通', u: '稀有', r: '超稀有', l: '传说' };
const RARITY_CAPTURE = { c: 0.70, u: 0.45, r: 0.25, l: 0.08 };
const RARITY_HP_MULT = { c: 0.7, u: 1.0, r: 1.5, l: 3.0 };
const RARITY_DMG_MULT = { c: 0.7, u: 1.0, r: 1.4, l: 2.2 };

// Poke Ball types with exact capture rates per rarity [c, u, r, l]
const POKE_BALLS = {
  normal: { id:'normal', name:'精灵球', icon:'🔴', price:30,  rates:{c:0.30, u:0.20, r:0.10, l:0.01}, desc:'基础捕获' },
  great:  { id:'great',  name:'超级球', icon:'🔵', price:75,  rates:{c:0.50, u:0.30, r:0.20, l:0.05}, desc:'较好捕获' },
  ultra:  { id:'ultra',  name:'高级球', icon:'🟡', price:150, rates:{c:0.60, u:0.40, r:0.30, l:0.08}, desc:'强力捕获' },
  beast:  { id:'beast',  name:'究极球', icon:'🟣', price:300, rates:{c:0.70, u:0.50, r:0.40, l:0.10}, desc:'究极捕获' },
  master: { id:'master', name:'大师球', icon:'⭐', price:1000, rates:{c:1.00, u:1.00, r:1.00, l:1.00}, desc:'100%必定捕获！' },
};

const TIER1_LEGEND = new Set([150,249,250,382,383,384,483,484,487,493,643,644,646,716,717,718]);
const TIER2_LEGEND = new Set([144,145,146,243,244,245,377,378,379,380,381,480,481,482,485,486,488,638,639,640,641,642,645]);
const MYTHICAL = new Set([151,251,385,386,489,490,491,492,494,647,648,649,719,720,721]);

const NODE_TYPES = ['battle','battle','battle','elite','shop','rest','event','treasure'];
const NODE_ICONS = { battle:'⚔️', elite:'💀', shop:'🏪', rest:'🏕️', event:'❓', treasure:'🎁', boss:'👑' };
const NODE_NAMES = { battle:'战斗', elite:'精英战', shop:'商店', rest:'营地', event:'事件', treasure:'宝箱', boss:'BOSS' };

// ============================================================

// SECTION 2: GAME STATE
// ============================================================
const GS = {
  // Run state
  hp: STARTING_HP, maxHp: STARTING_HP,
  gold: STARTING_GOLD, score: 0,
  floor: 1, currentNodeIdx: -1,
  deck: [], hand: [], drawPile: [], discardPile: [],
  energy: 0, maxEnergy: 99,
  block: 0,
  combo: 0, maxCombo: 0, totalCorrect: 0, totalAnswered: 0,

  // Battle state
  inBattle: false,
  enemyPkm: null, enemyHp: 0, enemyMaxHp: 0, enemyBlock: 0,
  enemyIntent: null,
  currentQ: null,
  questionAnswered: false,
  cardPlayedThisTurn: false,
  playerDmgMult: 1, playerDefMult: 1,

  // Turn flow: 'question' → answer chain → 'card' → end turn
  turnPhase: 'question', // 'question' | 'card'
  turnCorrect: 0, // correct answers this turn = energy earned

  // Map state
  mapNodes: [], currentMapNode: null,

  // Meta
  gameOver: false, runWon: false,
  visitedNodes: [], // per floor
  collected: {}, // { dexId: true }
  team: [], // Array of Pokemon IDs (max 6), first is active
  pokeBalls: { normal: 3, great: 0, ultra: 0, beast: 0, master: 0 },
  bestScore: 0, bestFloor: 0,
  totalRuns: 0,
  // 全局养成 / 卡组
  metaGold: 0, metaHpLv: 0, metaAtkLv: 0,
  ownedCards: null, builtDeckIds: null,
  enemyStatus: null, enemyAtkMult: 1,
  questions: [],
  allQuestions: [],
  questionHistory: [],

  // UI state
  bankPage: 1, bankFilter: '',
  pokeFilter: 'all',
  deckBuildFilter: 'all',
};

// ============================================================

// SECTION 5: HELPER FUNCTIONS
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.random() * (max - min) + min; }

function getBST(id) {
  if (typeof PKM_BST !== 'undefined' && PKM_BST[id]) return PKM_BST[id];
  return 300; // fallback
}

function getPkmById(id) {
  if (typeof POKEMON_DATA !== 'undefined') return POKEMON_DATA.find(p => p.id === id);
  return null;
}

function getPkmName(id) {
  const p = getPkmById(id);
  return p ? p.c : '???';
}

function getPkmSprite(id) {
  // Gen 1-7 HD icons (inlined base64)
  if (typeof POKEMON_ICON_FILES !== 'undefined' && POKEMON_ICON_FILES[id] && typeof POKEMON_ICONS_HD !== 'undefined') {
    const file = POKEMON_ICON_FILES[id];
    if (POKEMON_ICONS_HD[file]) return POKEMON_ICONS_HD[file];
  }
  // Gen 8-9 base64 icons
  if (typeof POKEMON_ICONS_GEN89 !== 'undefined' && POKEMON_ICONS_GEN89[id]) {
    return POKEMON_ICONS_GEN89[id];
  }
  // Legacy base64 fallback
  if (typeof POKEMON_ICONS !== 'undefined' && POKEMON_ICONS[id]) return POKEMON_ICONS[id];
  return '';
}

function getEnemyStats(pkm) {
  const bst = getBST(pkm.id);
  const rarity = pkm.r || 'c';
  const hpMult = RARITY_HP_MULT[rarity] || 1;
  // 无限层：每层小幅成长，深层级仍有压力但不爆炸
  const floor = Math.max(1, GS.floor || 1);
  const floorScale = 1 + (floor - 1) * 0.12; // F1=1.0, F5≈1.48, F10≈2.08
  const baseHp = 20 + (bst / 720) * 80;
  const hp = Math.floor(baseHp * hpMult * floorScale);
  const dmg = Math.floor((5 + (bst / 720) * 15 * (RARITY_DMG_MULT[rarity] || 1)) * floorScale);
  const captureRate = RARITY_CAPTURE[rarity] || 0.5;
  if (TIER1_LEGEND.has(pkm.id)) return { hp: Math.floor(hp * 3), dmg: Math.floor(dmg * 2.5), captureRate: 0.02, isBoss: true };
  if (TIER2_LEGEND.has(pkm.id)) return { hp: Math.floor(hp * 2), dmg: Math.floor(dmg * 1.8), captureRate: 0.05, isBoss: true };
  if (MYTHICAL.has(pkm.id)) return { hp: Math.floor(hp * 2.5), dmg: Math.floor(dmg * 2), captureRate: 0.03, isBoss: true };
  return { hp, dmg, captureRate, isBoss: false };
}

function getRandomPokemon(rarityWeights = null) {
  if (typeof POKEMON_DATA === 'undefined') return {id:25,n:'pikachu',c:'皮卡丘',r:'c',i:1};
  const defaults = { c: 60, u: 25, r: 10, l: 5 };
  const weights = rarityWeights || defaults;
  const total = Object.values(weights).reduce((a,b)=>a+b,0);
  let r = Math.random() * total;
  for (const [rarity, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) {
      const pool = POKEMON_DATA.filter(p => p.r === rarity);
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return POKEMON_DATA[Math.floor(Math.random() * POKEMON_DATA.length)];
}

// ============================================================

// SECTION 6: DOM REFS
// ============================================================
const $ = id => document.getElementById(id);
const DOM = {
  get app() { return $('app'); },
  get headerStats() { return $('header-stats'); },
  get hdrHp() { return $('hdr-hp'); },
  get hdrGold() { return $('hdr-gold'); },
  get hdrScore() { return $('hdr-score'); },
  get hdrFloor() { return $('hdr-floor'); },
};

// ============================================================

// SECTION 7: UI HELPERS
// ============================================================
function updateHeaderUI() {
  if (!DOM.hdrHp) return;
  DOM.hdrHp.textContent = Math.ceil(GS.hp) + '/' + GS.maxHp;
  DOM.hdrHp.className = 'val ' + (GS.hp > GS.maxHp * 0.6 ? 'hp-ok' : GS.hp > GS.maxHp * 0.3 ? 'hp-warn' : 'hp-danger');
  DOM.hdrGold.textContent = GS.gold;
  DOM.hdrScore.textContent = GS.score;
  DOM.hdrFloor.textContent = `F${GS.floor}`;
  const atkEl = $('hdr-atk');
  if (atkEl) atkEl.textContent = getPlayerAtk();

  // Ball inventory
  const balls = GS.pokeBalls || {};
  const ballIcons = [];
  for (const [key, ball] of Object.entries(POKE_BALLS)) {
    const count = balls[key] || 0;
    if (count > 0) ballIcons.push(`${ball.icon}${count}`);
  }
  $('hdr-balls').innerHTML = ballIcons.length > 0 ? ballIcons.join(' ') : '🔴0';
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  const page = $(`page-${tabName}`);
  if (page) page.classList.add('active');

  if (tabName === 'pokedex') renderPokedex();
  if (tabName === 'bank') renderBank();
  if (tabName === 'settings') updateSettingsUI();
  if (tabName === 'game') renderDungeonMap();
  if (tabName === 'train') renderTrainUI();
  if (tabName === 'gacha') renderGachaUI();
  if (tabName === 'deckbuild') renderDeckBuildUI();

  initAudio();
}

function notify(msg, color='var(--gold)') {
  const el = document.createElement('div');
  el.className = 'notify';
  el.textContent = msg;
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function showDamageNumber(x, y, text, cls) {
  const el = document.createElement('div');
  el.className = 'dmg-num ' + cls;
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  $('battle-arena').appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function showComboPopup(text) {
  const arena = $('battle-arena');
  if (!arena) return;
  const el = document.createElement('div');
  el.className = 'combo-popup';
  el.textContent = text;
  el.style.left = '50%';
  el.style.top = '40%';
  el.style.transform = 'translate(-50%, -50%)';
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ============================================================

// SECTION 9: DUNGEON MAP
// ============================================================
let mapAnimFrame = null;
let mapNodes = [];
let mapPlayerPos = -1;
let mapScrollY = 0;

function generateMapNodes(floor) {
  // Generate nodes in columns, Slay the Spire style
  const nodes = [];
  const cols = Math.min(4 + floor, 7);
  const rows = 3;

  for (let col = 0; col < cols; col++) {
    const colNodes = [];
    const numInCol = col === 0 ? 1 : col === cols - 1 ? 1 : rand(2, rows);
    const availableRows = [...Array(rows).keys()];

    for (let i = 0; i < numInCol; i++) {
      const rowIdx = Math.floor(Math.random() * availableRows.length);
      const row = availableRows.splice(rowIdx, 1)[0];

      let type;
      if (col === 0) type = 'battle';
      else if (col === cols - 1) type = 'boss';
      else {
        const weights = { battle: 40, elite: 10, shop: 15, rest: 15, event: 10, treasure: 10 };
        const total = Object.values(weights).reduce((a,b)=>a+b,0);
        let r = Math.random() * total;
        for (const [t, w] of Object.entries(weights)) { r -= w; if (r <= 0) { type = t; break; } }
      }

      const enemyPool = type === 'boss' ? { c: 20, u: 30, r: 30, l: 20 } :
                        type === 'elite' ? { c: 30, u: 35, r: 25, l: 10 } :
                        { c: 60, u: 25, r: 12, l: 3 };

      colNodes.push({
        id: `n_${floor}_${col}_${row}`,
        type, col, row,
        enemyPkm: getRandomPokemon(enemyPool),
        visited: false,
        reachable: col === 0,
        rewards: generateRewards(type),
      });
    }
    nodes.push(colNodes);
  }
  return nodes;
}

function generateRewards(type) {
  switch(type) {
    case 'battle': return { gold: rand(15, 30), cardChoices: 1 };
    case 'elite': return { gold: rand(30, 50), cardChoices: 2 };
    case 'boss': return { gold: rand(50, 100), cardChoices: 3 };
    case 'treasure': return { gold: rand(25, 45), cardChoices: 1 };
    case 'shop': return {};
    case 'rest': return {};
    case 'event': return {};
    default: return { gold: rand(10, 20), cardChoices: 1 };
  }
}

function renderDungeonMap() {
  if (GS.gameOver) return;

  const container = $('dungeon-map');
  const canvas = $('map-canvas');
  if (!container || !canvas) return;

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * (window.devicePixelRatio || 1);
  canvas.height = rect.height * (window.devicePixelRatio || 1);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Clear
  ctx.fillStyle = '#070b16';
  ctx.fillRect(0, 0, W, H);

  if (!GS.mapNodes || GS.mapNodes.length === 0) return;

  const cols = GS.mapNodes;
  const dpr = window.devicePixelRatio || 1;
  // 安全边距：节点半径 + 光晕 + 顶栏控件/底边，避免上下被裁切
  const nodeR = 18 * dpr;
  const padExtra = 16 * dpr; // glow / ring
  const topChrome = 36 * dpr; // floor label + deck button 区域
  const bottomChrome = 18 * dpr;
  const marginX = Math.max(50 * dpr, nodeR + padExtra + 8 * dpr);
  const marginY = Math.max(72 * dpr, nodeR + padExtra + topChrome * 0.50);
  const topPad = marginY + topChrome * 0.25;
  const botPad = marginY + bottomChrome * 0.25;
  const usableH = Math.max(1, H - topPad - botPad);
  const usableW = Math.max(1, W - marginX * 2);
  const colW = usableW / (cols.length - 1 || 1);
  const rowSpan = 2; // rows 0..2
  const nodeY = (row) => topPad + (row / rowSpan) * usableH;
  const nodeX = (col) => marginX + col * colW;

  // Draw connections
  ctx.strokeStyle = '#26355e';
  ctx.lineWidth = 2;
  for (let c = 0; c < cols.length - 1; c++) {
    for (const nodeA of cols[c]) {
      for (const nodeB of cols[c + 1]) {
        const x1 = nodeX(c);
        const y1 = nodeY(nodeA.row);
        const x2 = nodeX(c + 1);
        const y2 = nodeY(nodeB.row);

        const bothVisited = nodeA.visited && nodeB.visited;
        const eitherReachable = nodeA.reachable && (nodeB.reachable || c + 1 === GS.currentNodeIdx);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        if (bothVisited) ctx.strokeStyle = '#555';
        else if (nodeA.visited && nodeB.reachable) ctx.strokeStyle = '#00f0ff';
        else ctx.strokeStyle = '#162040';
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  for (let c = 0; c < cols.length; c++) {
    for (const node of cols[c]) {
      const x = nodeX(c);
      const y = nodeY(node.row);

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, nodeR, 0, Math.PI * 2);

      if (node.visited) {
        ctx.fillStyle = '#162040';
        ctx.strokeStyle = '#3f5f4f';
      } else if (node.reachable) {
        ctx.fillStyle = '#101830';
        ctx.strokeStyle = '#00f0ff';
        // Glow effect
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = '#0c1226';
        ctx.strokeStyle = '#26355e';
      }

      ctx.fill();
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Icon
      ctx.fillStyle = node.visited ? '#555' : (node.reachable ? '#fff' : '#333');
      ctx.font = `${14 * (window.devicePixelRatio||1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(NODE_ICONS[node.type] || '?', x, y);

      // Player indicator
      if (node.visited && c === GS.currentNodeIdx) {
        ctx.beginPath();
        ctx.arc(x, y, nodeR + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.lineWidth = 2;
      }
    }
  }

  // Floor label
  ctx.fillStyle = '#8fa3cf';
  ctx.font = `${11 * (window.devicePixelRatio||1)}px "Noto Sans SC","Microsoft YaHei",sans-serif`;
  ctx.fillText(`第 ${GS.floor} 层 - 选择路径前进`, W/2, Math.max(14 * dpr, topPad * 0.35));
}

function onMapClick(e) {
  if (GS.inBattle || GS.gameOver) return;

  const canvas = $('map-canvas');
  const container = $('dungeon-map');
  if (!canvas || !container) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  const cols = GS.mapNodes;
  if (!cols || !cols.length) return;
  const W = canvas.width, H = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  const nodeR = 18 * dpr;
  const padExtra = 16 * dpr;
  const topChrome = 36 * dpr;
  const bottomChrome = 18 * dpr;
  const marginX = Math.max(50 * dpr, nodeR + padExtra + 8 * dpr);
  const marginY = Math.max(72 * dpr, nodeR + padExtra + topChrome * 0.50);
  const topPad = marginY + topChrome * 0.25;
  const botPad = marginY + bottomChrome * 0.25;
  const usableH = Math.max(1, H - topPad - botPad);
  const usableW = Math.max(1, W - marginX * 2);
  const colW = usableW / (cols.length - 1 || 1);
  const rowSpan = 2;
  const nodeY = (row) => topPad + (row / rowSpan) * usableH;
  const nodeX = (col) => marginX + col * colW;

  for (let c = 0; c < cols.length; c++) {
    for (const node of cols[c]) {
      if (!node.reachable || node.visited) continue;
      const x = nodeX(c);
      const y = nodeY(node.row);
      const dist = Math.hypot(mx - x, my - y);
      if (dist <= nodeR + 8) {
        // Select this node
        selectMapNode(c, node);
        return;
      }
    }
  }
}

function selectMapNode(col, node) {
  node.visited = true;
  GS.currentNodeIdx = col;

  // Mark ALL other same-column nodes as unreachable (can't choose another at same depth)
  for (const sameColNode of GS.mapNodes[col]) {
    if (sameColNode !== node) {
      sameColNode.reachable = false;
      sameColNode.visited = true; // visually mark as unavailable too
    }
  }

  // Mark ALL previous column nodes as unreachable (can't go back)
  for (let c = 0; c < col; c++) {
    for (const prevNode of GS.mapNodes[c]) {
      prevNode.reachable = false;
      if (!prevNode.visited) prevNode.visited = true;
    }
  }

  // Mark next column reachable
  if (col + 1 < GS.mapNodes.length) {
    for (const nextNode of GS.mapNodes[col + 1]) {
      nextNode.reachable = true;
    }
  }

  renderDungeonMap();

  // Activate node
  switch (node.type) {
    case 'battle':
    case 'elite':
      startBattle(node);
      break;
    case 'boss':
      startBattle(node, true);
      break;
    case 'shop':
      openShop();
      break;
    case 'rest':
      openRest();
      break;
    case 'treasure':
      openTreasure(node);
      break;
    case 'event':
      openEvent(node);
      break;
  }
}

// ============================================================

// SECTION 13: GAME OVER / VICTORY
// ============================================================
function gameOverDefeat() {
  GS.gameOver = true;
  GS.inBattle = false;
  $('battle-overlay').classList.remove('active');
  $('capture-overlay').classList.remove('active');

  const overlay = $('go-overlay');
  overlay.classList.add('active');
  $('go-title').textContent = '💀 冒险结束';
  $('go-title').className = 'go-title';
  $('go-stats').innerHTML = `
    到达: <span>第 ${GS.floor} 层</span><br>
    得分: <span>${GS.score}</span><br>
    答题正确率: <span>${GS.totalAnswered > 0 ? Math.round(GS.totalCorrect / GS.totalAnswered * 100) : 0}%</span><br>
    最大连击: <span>${GS.maxCombo}</span><br>
    收集宝可梦: <span>${Object.keys(GS.collected).length}</span>
  `;

  // 结算：剩余金币入库养成
  if (GS.gold > 0) {
    grantMetaGold(GS.gold);
    notify('剩余 ' + GS.gold + ' 金已存入养成', 'var(--gold)');
  }
  updateBestScore();
  saveGame();
  sfxDamage();
}

function gameOverVictory() {
  GS.gameOver = true;
  GS.runWon = true;
  GS.inBattle = false;
  $('battle-overlay').classList.remove('active');

  const overlay = $('go-overlay');
  overlay.classList.add('active');
  $('go-title').textContent = '🏆 恭喜通关！';
  $('go-title').className = 'go-title win';
  $('go-stats').innerHTML = `
    得分: <span>${GS.score}</span><br>
    答题正确率: <span>${GS.totalAnswered > 0 ? Math.round(GS.totalCorrect / GS.totalAnswered * 100) : 0}%</span><br>
    最大连击: <span>${GS.maxCombo}</span><br>
    收集宝可梦: <span>${Object.keys(GS.collected).length}</span><br>
    <br>🎉 你征服了宝可牢！
  `;

  GS.score += 500;
  updateBestScore();
  saveGame();
}

function updateBestScore() {
  if (GS.score > GS.bestScore) {
    GS.bestScore = GS.score;
    notify('🏆 新最高分！', 'var(--gold)');
  }
  if (GS.floor > GS.bestFloor) GS.bestFloor = GS.floor;
  saveMeta();
}

// ============================================================

// SECTION 14: SAVE / LOAD
// ============================================================
function saveGame() {
  try {
    const data = {
      hp: GS.hp, maxHp: GS.maxHp, gold: GS.gold, score: GS.score,
      floor: GS.floor, deck: GS.deck, totalCorrect: GS.totalCorrect,
      totalAnswered: GS.totalAnswered, maxCombo: GS.maxCombo, combo: GS.combo,
      collected: GS.collected, currentNodeIdx: GS.currentNodeIdx,
      mapNodes: GS.mapNodes, enemyHp: GS.enemyHp, enemyMaxHp: GS.enemyMaxHp,
      enemyPkm: GS.enemyPkm, inBattle: GS.inBattle, enemyCaptureRate: GS.enemyCaptureRate,
      gameOver: GS.gameOver, runWon: GS.runWon,
      turnPhase: GS.turnPhase, turnCorrect: GS.turnCorrect, energy: GS.energy,
      enemyBaseDamage: GS.enemyBaseDamage, block: GS.block,
      team: GS.team, pokeBalls: GS.pokeBalls,
    };
    localStorage.setItem('dungeonDrive_save', JSON.stringify(data));
  } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem('dungeonDrive_save');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.gameOver) return false;

    GS.hp = data.hp; GS.maxHp = data.maxHp; GS.gold = data.gold;
    GS.score = data.score; GS.floor = data.floor; GS.deck = hydrateCardList(data.deck || []);
    GS.totalCorrect = data.totalCorrect; GS.totalAnswered = data.totalAnswered;
    GS.maxCombo = data.maxCombo; GS.combo = data.combo || 0;
    GS.collected = data.collected || {};
    GS.currentNodeIdx = data.currentNodeIdx; GS.mapNodes = data.mapNodes;
    GS.enemyHp = data.enemyHp; GS.enemyMaxHp = data.enemyMaxHp;
    GS.enemyPkm = data.enemyPkm; GS.inBattle = data.inBattle;
    GS.enemyCaptureRate = data.enemyCaptureRate || 0.5;
    GS.gameOver = data.gameOver || false; GS.runWon = data.runWon || false;
    GS.turnPhase = data.turnPhase || 'question'; GS.turnCorrect = data.turnCorrect || 0;
    GS.energy = data.energy || 0; GS.enemyBaseDamage = data.enemyBaseDamage || 8;
    GS.block = data.block || 0;
    GS.team = data.team || []; GS.pokeBalls = data.pokeBalls || { normal: 3, great: 0, ultra: 0, beast: 0, master: 0 };

    if (GS.mapNodes && GS.mapNodes.length > 0) {
      // Reset all reachable/visited first
      GS.mapNodes.forEach(col => col.forEach(n => { n.reachable = false; n.visited = false; }));
      // First column is always reachable
      if (GS.mapNodes[0].length > 0) {
        GS.mapNodes[0].forEach(n => { n.reachable = true; });
      }
      // Only the player's current node and path should be visited;
      // nodes in previous columns should be unreachable
      if (GS.currentNodeIdx >= 0) {
        GS.mapNodes.forEach((col, ci) => {
          if (ci < GS.currentNodeIdx) {
            // Previous columns: all nodes marked visited (unavailable), not reachable
            col.forEach(n => { n.visited = true; n.reachable = false; });
          } else if (ci === GS.currentNodeIdx) {
            // Current column: find the visited node and mark it
            const visitedNode = col.find(n => n.visited);
            if (visitedNode) {
              // Keep the selected node visited, mark others unreachable
              col.forEach(n => {
                if (n !== visitedNode) { n.visited = true; n.reachable = false; }
              });
            }
            // Next column reachable
            if (ci + 1 < GS.mapNodes.length) {
              GS.mapNodes[ci + 1].forEach(n => { n.reachable = true; });
            }
          }
          // Future columns: leave as-is (not visited, not reachable)
        });
      }
    }

    // 卡牌从 JSON 回来没有 effect，必须重建；并重置抽弃牌堆
    GS.deck = hydrateCardList(GS.deck);
    GS.drawPile = hydrateCardList(GS.drawPile || []);
    GS.discardPile = hydrateCardList(GS.discardPile || []);
    GS.hand = hydrateCardList(GS.hand || []);
    // 若抽牌堆空但有牌组，开战时会再洗；这里预置一份
    if (GS.drawPile.length === 0 && GS.deck.length > 0) {
      GS.drawPile = shuffle(hydrateCardList(GS.deck));
    }

    return true;
  } catch(e) {
    return false;
  }
}

function saveMeta() {
  try {
    ensureMetaDefaults();
    localStorage.setItem('dungeonDrive_meta', JSON.stringify({
      bestScore: GS.bestScore, bestFloor: GS.bestFloor,
      totalRuns: GS.totalRuns, collected: GS.collected,
      team: GS.team, pokeBalls: GS.pokeBalls,
      soundEnabled,
      metaGold: GS.metaGold,
      metaHpLv: GS.metaHpLv,
      metaAtkLv: GS.metaAtkLv,
      ownedCards: GS.ownedCards,
      builtDeckIds: GS.builtDeckIds,
    }));
  } catch(e) {}
}

function loadMeta() {
  try {
    const raw = localStorage.getItem('dungeonDrive_meta');
    if (!raw) {
      ensureMetaDefaults();
      return;
    }
    const data = JSON.parse(raw);
    GS.bestScore = data.bestScore || 0;
    GS.bestFloor = data.bestFloor || 0;
    GS.totalRuns = data.totalRuns || 0;
    GS.collected = data.collected || {};
    GS.team = data.team || [];
    GS.pokeBalls = data.pokeBalls || { normal: 3, great: 0, ultra: 0, beast: 0, master: 0 };
    soundEnabled = data.soundEnabled !== false;
    GS.metaGold = data.metaGold || 0;
    GS.metaHpLv = data.metaHpLv || 0;
    GS.metaAtkLv = data.metaAtkLv || 0;
    GS.ownedCards = data.ownedCards || null;
    GS.builtDeckIds = data.builtDeckIds || null;
    ensureMetaDefaults();
  } catch(e) {
    ensureMetaDefaults();
  }
}

function loadQuestions() {
  // Try localStorage first
  try {
    const saved = localStorage.getItem('dungeonDrive_importedQuestions');
    if (saved) {
      const data = JSON.parse(saved);
      if (Array.isArray(data) && data.length > 0) {
        GS.allQuestions = data;
        bankQuestions = data;
        return;
      }
    }
  } catch(e) {}

  // Use built-in (loaded via script tag)
  if (typeof BUILTIN_QUESTIONS !== 'undefined' && BUILTIN_QUESTIONS.length > 0) {
    GS.allQuestions = [...BUILTIN_QUESTIONS];
    bankQuestions = [...BUILTIN_QUESTIONS];
    return;
  }

  // Try loading from JSON as fallback
  fetch('questions_bank.json')
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        GS.allQuestions = data;
        bankQuestions = data;
      }
    })
    .catch(() => {});
}

// ============================================================

// SECTION 15: NEW GAME
// ============================================================
function newGame() {
  ensureMetaDefaults();
  GS.maxHp = getMaxHpFromMeta();
  GS.hp = GS.maxHp;
  GS.gold = STARTING_GOLD;
  GS.score = 0;
  GS.floor = 1;
  GS.deck = deckFromBuilt();
  GS.enemyStatus = null;
  GS.enemyAtkMult = 1;
  GS.combo = 0;
  GS.maxCombo = 0;
  GS.totalCorrect = 0;
  GS.totalAnswered = 0;
  GS.block = 0;
  GS.energy = 0;
  GS.turnPhase = 'question';
  GS.turnCorrect = 0;
  GS.team = [25]; // Start with Pikachu
  GS.pokeBalls = { normal: 3, great: 0, ultra: 0, beast: 0, master: 0 };
  GS.collected[25] = true; // Pikachu always collected
  GS.inBattle = false;
  GS.gameOver = false;
  GS.runWon = false;
  GS.enemyPkm = null;
  GS.enemyHp = 0;
  GS.enemyMaxHp = 0;
  GS.enemyBlock = 0;
  GS.playerDmgMult = 1;
  GS.playerDefMult = 1;
  GS.captureBonus = 0;
  GS.questionHistory = [];
  GS.currentNodeIdx = -1;
  GS.hand = [];
  GS.drawPile = [];
  GS.discardPile = [];

  // Generate first floor map
  GS.mapNodes = generateMapNodes(GS.floor);
  if (GS.mapNodes.length > 0 && GS.mapNodes[0].length > 0) {
    GS.mapNodes[0][0].reachable = true;
  }

  GS.totalRuns++;
  $('floor-indicator').textContent = '第 1 层';
  $('go-overlay').classList.remove('active');
  $('battle-overlay').classList.remove('active');
  $('capture-overlay').classList.remove('active');
  $('reward-overlay').classList.remove('active');
  $('shop-overlay').classList.remove('active');
  $('rest-overlay').classList.remove('active');
  $('event-overlay').classList.remove('active');

  updateHeaderUI();
  updateEnergyUI();
  renderDungeonMap();
  renderDeckPanel();
  saveGame();
  saveMeta();

  switchTab('game');
}

// ============================================================
