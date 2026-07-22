/* ===== 游戏核心：状态 / 存档 / 地图 / 战斗 / 界面 ===== */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const RULES = window.GAME_RULES, CONST = window.GAME_CONST;
const PKMN_BY_ID = {}; window.POKEMON.forEach(p => PKMN_BY_ID[p.id] = p);
const ICON = id => window.PKMN_ICONS[String(id)] || '';
const RARITY_LABEL = RULES.rarity_labels;
const RARITY_CSS = { c: 'tag-c', u: 'tag-u', r: 'tag-r', l: 'tag-l' };
const TIMER_SEC = { easy: 30, normal: 20, hard: 12 };
const CATCH_BASE = { c: 0.9, u: 0.7, r: 0.45, l: 0.22 };
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= 全局状态 ================= */
const G = {
  meta: null, run: null, battle: null,
  screen: 'scr-title', prevScreen: null,
};

function defaultMeta() {
  return {
    dex: {}, bestScore: 0, runs: 0, wins: 0,
    totalCorrect: 0, totalAnswered: 0, maxComboEver: 0, totalCaught: 0,
    wrongQ: {}, settings: { bgm: 0.6, sfx: 0.8, shake: true, diff: 'normal' },
  };
}
function loadMeta() {
  try { const m = JSON.parse(localStorage.getItem('pd_meta_v1')); G.meta = m && m.settings ? m : defaultMeta(); }
  catch (e) { G.meta = defaultMeta(); }
}
function saveMeta() { try { localStorage.setItem('pd_meta_v1', JSON.stringify(G.meta)); } catch (e) {} }
function saveRun() {
  try {
    if (G.run) localStorage.setItem('pd_save_v1', JSON.stringify(G.run));
    else localStorage.removeItem('pd_save_v1');
  } catch (e) {}
}
function loadRun() {
  try { const r = JSON.parse(localStorage.getItem('pd_save_v1')); return r && r.mapRows ? r : null; }
  catch (e) { return null; }
}

/* ================= 数值公式（源自 game_rules.json） ================= */
function baseHp(p) { // 2 + (id%5)*mult, max 12
  return Math.min(12, Math.round(2 + (p.id % 5) * RULES.rarity_hp_mult[p.r]));
}
function pokeMaxHp(inst) {
  const p = PKMN_BY_ID[inst.id];
  return baseHp(p) + (inst.lv - 1) * 2 + (G.run ? G.run.hpBonus || 0 : 0);
}
function pokeAtk(inst) {
  return 2 + Math.floor((inst.lv - 1) / 3) + (G.run ? G.run.atkBonus || 0 : 0);
}
function pokeSpeed(p) {
  return Math.round((16 + (p.id % 10)) * RULES.rarity_speed_mult[p.r]);
}
function critChance(inst) {
  const p = PKMN_BY_ID[inst.id];
  return clamp((pokeSpeed(p) - 16) / 60, 0, 0.25);
}
function xpNeed(lv) { return lv * 12; }
function newInstance(id, lv) {
  const inst = { id, lv: lv || 1, xp: 0, hp: 0 };
  inst.hp = pokeMaxHp(inst);
  return inst;
}

/* ================= 界面工具 ================= */
function show(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  G.prevScreen = G.screen; G.screen = id;
}
let toastTimer = null;
function toast(msg, ms) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms || 1800);
}
function openModal(html) {
  $('#modal').innerHTML = html;
  $('#modal-wrap').classList.remove('hidden');
}
function closeModal() { $('#modal-wrap').classList.add('hidden'); $('#modal').innerHTML = ''; }
$('#modal-wrap').addEventListener('click', e => { if (e.target.id === 'modal-wrap') closeModal(); });

function shakeScreen() {
  if (!G.meta.settings.shake) return;
  const w = $('#shake-wrap');
  w.classList.remove('shaking'); void w.offsetWidth; w.classList.add('shaking');
}

/* DOM 粒子 & 飘字 */
function fxLayerRect() { return $('#fx-layer').getBoundingClientRect(); }
function spawnDmg(xPct, yPct, text, color, big) {
  const layer = $('#fx-layer'); if (!layer) return;
  const el = document.createElement('div');
  el.className = 'dmg-num';
  el.textContent = text;
  el.style.left = xPct + '%'; el.style.top = yPct + '%';
  el.style.color = color || '#fff';
  if (big) el.style.fontSize = '34px';
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
function spawnFxText(xPct, yPct, text, color) {
  const layer = $('#fx-layer'); if (!layer) return;
  const el = document.createElement('div');
  el.className = 'fx-text'; el.textContent = text;
  el.style.left = xPct + '%'; el.style.top = yPct + '%';
  el.style.color = color || '#0ff';
  layer.appendChild(el); setTimeout(() => el.remove(), 1200);
}
function domBurst(xPct, yPct, color, n) {
  const layer = $('#fx-layer'); if (!layer) return;
  for (let i = 0; i < (n || 14); i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = 3 + Math.random() * 5;
    p.style.cssText = `left:${xPct}%;top:${yPct}%;width:${sz}px;height:${sz}px;background:${color};box-shadow:0 0 6px ${color}`;
    layer.appendChild(p);
    const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 70;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 20;
    p.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 }
    ], { duration: 500 + Math.random() * 400, easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => p.remove();
  }
}

/* ================= 分数 ================= */
function calcScore() {
  const r = G.run; if (!r) return 0;
  return r.goldEarned + r.floorsCleared * 50 + r.captures * 40 + r.maxCombo * 15 + r.bossKills * 250;
}

/* ================= 地图生成 ================= */
const NODE_ICON = { battle: '⚔️', elite: '💀', shop: '🛒', rest: '🔥', boss2: '👹', boss: '🐉' };
function genMap() {
  const ROWS = 15, rows = [];
  for (let f = 0; f < ROWS; f++) {
    let cols;
    if (f === ROWS - 1 || f === 7) cols = [1];
    else {
      const layouts = [[0, 2], [0, 1], [1, 2], [0, 1, 2]];
      cols = pick(layouts);
    }
    const row = cols.map(c => {
      let type = 'battle';
      if (f === ROWS - 1) type = 'boss';
      else if (f === 7) type = 'boss2';
      else if (f === 0) type = 'battle';
      else {
        const roll = Math.random();
        type = roll < 0.60 ? 'battle' : roll < 0.76 ? 'elite' : roll < 0.88 ? 'shop' : 'rest';
      }
      return { c, type, edges: [], x: 0, y: 0, done: false };
    });
    rows.push(row);
  }
  // 保证至少有 2 休息 1 商店
  const flats = [];
  rows.forEach((row, f) => row.forEach((n, i) => { if (f > 0 && f < ROWS - 1 && f !== 7) flats.push(n); }));
  const ensureType = (t, cnt) => {
    let have = flats.filter(n => n.type === t).length;
    while (have < cnt) { const n = pick(flats); if (n.type === 'battle') { n.type = t; have++; } }
  };
  ensureType('rest', 2); ensureType('shop', 2);
  // 连边
  for (let f = 0; f < ROWS - 1; f++) {
    const cur = rows[f], nxt = rows[f + 1];
    nxt.forEach(n => n._in = 0);
    cur.forEach((n, i) => {
      const targets = nxt.map((m, j) => ({ j, d: Math.abs(m.c - n.c) })).filter(t => t.d <= 1).sort((a, b) => a.d - b.d);
      const list = targets.length ? targets : nxt.map((m, j) => ({ j }));
      const first = list[0].j;
      n.edges.push(first); nxt[first]._in++;
      if (list.length > 1 && Math.random() < 0.45) {
        const second = list[1].j;
        if (!n.edges.includes(second)) { n.edges.push(second); nxt[second]._in++; }
      }
    });
    // 保证每个下层节点可达
    nxt.forEach((m, j) => {
      if (m._in === 0) {
        const src = cur.map((n, i) => ({ i, d: Math.abs(n.c - m.c) })).sort((a, b) => a.d - b.d)[0].i;
        cur[src].edges.push(j);
      }
    });
    nxt.forEach(n => delete n._in);
  }
  return rows;
}

function renderMap() {
  const r = G.run; if (!r) return;
  const scroll = $('#map-scroll'), inner = $('#map-inner');
  const W = inner.clientWidth || scroll.clientWidth || window.innerWidth;
  const rowH = 78, topPad = 60, botPad = 70;
  const H = topPad + botPad + rowH * 14 + 40;
  inner.style.height = H + 'px';
  const colX = c => W * (0.2 + c * 0.3);
  r.mapRows.forEach((row, f) => row.forEach(n => {
    n.x = colX(n.c) + (r.mapRows[f].length > 1 ? rand(-8, 8) : 0);
    n.y = H - botPad - f * rowH;
  }));
  // SVG 连线
  let svg = '';
  r.mapRows.forEach((row, f) => row.forEach(n => n.edges.forEach(j => {
    const m = r.mapRows[f + 1][j];
    let cls = '';
    if (n.done && m.done) cls = 'done';
    else if (isCurrentNode(n)) cls = 'open';
    svg += `<line class="${cls}" x1="${n.x}" y1="${n.y}" x2="${m.x}" y2="${m.y}"/>`;
  })));
  $('#map-svg').setAttribute('viewBox', `0 0 ${W} ${H}`);
  $('#map-svg').innerHTML = svg;
  // 节点
  const wrap = $('#map-nodes'); wrap.innerHTML = '';
  r.mapRows.forEach((row, f) => row.forEach((n, i) => {
    const el = document.createElement('div');
    const boss = n.type === 'boss' || n.type === 'boss2';
    el.className = 'map-node' + (boss ? ' boss' : '');
    el.style.left = n.x + 'px'; el.style.top = n.y + 'px';
    el.textContent = NODE_ICON[n.type];
    if (n.done) el.classList.add('done');
    else if (isCurrentNode(n)) el.classList.add('current');
    else if (isReachable(f, i)) {
      el.classList.add('reachable');
      el.addEventListener('click', () => { AudioEngine.sfx('click'); moveTo(f, i); });
    } else el.classList.add('locked');
    wrap.appendChild(el);
  }));
  // HUD
  $('#hud-floor').textContent = `第 ${clamp(r.pos.f + 1, 1, 15)} 层`;
  $('#hud-gold').textContent = `${r.gold} 金币`;
  $('#hud-score').textContent = `分数 ${calcScore()}`;
  // 滚动到当前位置
  const curY = r.pos.f < 0 ? H : r.mapRows[r.pos.f][r.pos.i].y;
  scroll.scrollTop = clamp(curY - scroll.clientHeight * 0.6, 0, H);
}
function isCurrentNode(n) { return G.run.pos.f >= 0 && G.run.mapRows[G.run.pos.f][G.run.pos.i] === n; }
function isReachable(f, i) {
  const r = G.run;
  if (r.pos.f === -1) return f === 0;
  const cur = r.mapRows[r.pos.f][r.pos.i];
  return f === r.pos.f + 1 && cur.edges.includes(i);
}

function moveTo(f, i) {
  const r = G.run;
  const node = r.mapRows[f][i];
  r.pos = { f, i };
  node.done = true;
  r.floorsCleared = f + 1;
  saveRun();
  if (node.type === 'shop') { window.Screens.openShop(); }
  else if (node.type === 'rest') { window.Screens.openRest(); }
  else { window.Battle.startBattle(node); }
}

/* ================= 新一局 ================= */
const STARTERS = [
  { id: 1, desc: '草系伙伴 · 稳扎稳打，HP 均衡' },
  { id: 4, desc: '火系伙伴 · 攻击手，答题越快越强' },
  { id: 7, desc: '水系伙伴 · 坚韧可靠，适合新手' },
];
function renderStarters() {
  const row = $('#starter-row'); row.innerHTML = '';
  STARTERS.forEach(s => {
    const p = PKMN_BY_ID[s.id];
    const el = document.createElement('div');
    el.className = 'starter-card';
    el.innerHTML = `<img src="${ICON(p.id)}" alt="${p.c}">
      <div><div class="sc-name">${p.c} <span class="tag ${RARITY_CSS[p.r]}">${RARITY_LABEL[p.r]}</span></div>
      <div class="sc-desc">${s.desc}</div>
      <div class="sc-desc">HP ${baseHp(p)} · 速度 ${pokeSpeed(p)}</div></div>`;
    el.addEventListener('click', () => { AudioEngine.sfx('click'); newRun(p.id); });
    row.appendChild(el);
  });
}
function newRun(starterId) {
  G.run = {
    mapRows: genMap(), pos: { f: -1, i: -1 },
    gold: 60, goldEarned: 0,
    balls: 5, superBalls: 1, potions: 1, bigPotions: 0, teamPotions: 0, revives: 0,
    atkBonus: 0, hpBonus: 0,
    team: [newInstance(starterId, 1)], activeIdx: 0,
    usedQ: {}, combo: 0, maxCombo: 0,
    captures: 0, bossKills: 0, floorsCleared: 0,
    answered: 0, correct: 0, startTime: Date.now(),
  };
  G.meta.runs++; saveMeta(); saveRun();
  markSeen(starterId, true);
  show('scr-map'); renderMap();
  AudioEngine.bgm('map');
  toast(`${PKMN_BY_ID[starterId].c} 加入了队伍！冒险开始`);
}

/* ================= 图鉴记录 ================= */
function markSeen(id, caught) {
  const d = G.meta.dex[id] || (G.meta.dex[id] = { seen: 0, caught: 0 });
  d.seen++;
  if (caught) { d.caught++; G.meta.totalCaught++; }
  saveMeta();
}

window.G = G;
window.GameCore = {
  $, $$, show, toast, openModal, closeModal, shakeScreen,
  spawnDmg, spawnFxText, domBurst, calcScore, renderMap, renderStarters, newRun,
  baseHp, pokeMaxHp, pokeAtk, pokeSpeed, critChance, xpNeed, newInstance,
  markSeen, saveMeta, saveRun, loadRun, loadMeta, defaultMeta,
  PKMN_BY_ID, ICON, RARITY_LABEL, RARITY_CSS, TIMER_SEC, CATCH_BASE,
  rand, pick, clamp, moveTo, isReachable,
};
})();
