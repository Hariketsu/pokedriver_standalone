/* ===== 战斗系统：答题出招 / 答错挨打 / 连击 / 捕获 ===== */
(function () {
'use strict';
const C = window.GameCore;
const { $, $$, show, toast, openModal, closeModal, shakeScreen, spawnDmg, spawnFxText, domBurst,
  calcScore, baseHp, pokeMaxHp, pokeAtk, critChance, xpNeed, newInstance, markSeen, saveRun,
  PKMN_BY_ID, ICON, RARITY_LABEL, RARITY_CSS, TIMER_SEC, CATCH_BASE, rand, pick, clamp } = C;
const G = window.G;

/* ================= 敌人生成 ================= */
function enemyForNode(node) {
  const r = G.run;
  const floor = r.pos.f + 1;
  const t = node.type;
  let pool, mult, isBoss = false, name = '';
  if (t === 'boss') {
    pool = window.GAME_CONST.TIER1_LEGEND.concat(window.GAME_CONST.MYTHICAL);
    isBoss = true; name = '最终BOSS';
  } else if (t === 'boss2') {
    pool = window.GAME_CONST.TIER2_LEGEND;
    isBoss = true; name = '地牢守卫';
  } else if (t === 'elite') {
    pool = window.POKEMON.filter(p => p.r === 'r' || (p.r === 'u' && p.id % 3 === 0)).map(p => p.id);
  } else {
    const deep = clamp((floor - 1) / 14, 0, 1); // 越深越容易遇到高稀有度
    const roll = Math.random();
    let rarity = 'c';
    if (roll < deep * 0.28) rarity = 'r';
    else if (roll < deep * 0.28 + 0.18 + deep * 0.2) rarity = 'u';
    pool = window.POKEMON.filter(p => p.r === rarity).map(p => p.id);
  }
  const id = pick(pool);
  const p = PKMN_BY_ID[id];
  const bhp = baseHp(p);
  let hp = bhp + Math.round(floor * 0.7);
  if (t === 'elite') hp = Math.round(hp * 1.7);
  if (t === 'boss2') hp = Math.round(hp * 2.1) + 6;
  if (t === 'boss') hp = Math.round(hp * 2.5) + 10;
  let atk = 1 + Math.floor(floor / 4);
  if (t === 'elite') atk += 1;
  if (t === 'boss2') atk += 1;
  if (t === 'boss') atk += 2;
  return { id, hp, maxHp: hp, atk, isBoss, nodeType: t, title: name };
}

/* ================= 战斗开始 ================= */
function startBattle(node) {
  const r = G.run;
  const enemy = enemyForNode(node);
  G.battle = {
    node, enemy, phase: 'intro', q: null, timer: null, timeLeft: 0, timeTotal: 0,
    locked: true, captured: false,
  };
  markSeen(enemy.id, false);
  show('scr-battle');
  setupBattleScene();
  renderBattleHUD();
  renderTeamBar();
  const ep = PKMN_BY_ID[enemy.id];
  const boss = enemy.isBoss;
  AudioEngine.bgm(boss ? 'boss' : 'battle');
  if (boss) { AudioEngine.sfx('boss'); shakeScreen(); }
  spawnFxText(50, 40, boss ? `⚠ ${enemy.title} ${ep.c} 出现！` : `野生的 ${ep.c} 出现了！`, boss ? '#ff0044' : '#00f0ff');
  setTimeout(() => nextQuestion(), boss ? 1200 : 800);
}

function setupBattleScene() {
  const b = G.battle;
  const ok = BattleFX.ok || BattleFX.init($('#battle-canvas'));
  $('#battle-fallback').classList.toggle('hidden', ok);
  $('#battle-canvas').style.display = ok ? '' : 'none';
  const active = G.run.team[G.run.activeIdx];
  const ep = PKMN_BY_ID[b.enemy.id];
  if (ok) {
    BattleFX.setRunning(true);
    BattleFX.setEnemy(b.enemy.id, ep.r, b.enemy.isBoss);
    BattleFX.setPlayer(active.id);
    BattleFX.comboAura(0);
  } else {
    $('#fb-enemy').src = ICON(b.enemy.id);
    $('#fb-player').src = ICON(active.id);
  }
}

/* ================= HUD 渲染 ================= */
function renderBattleHUD() {
  const r = G.run, b = G.battle; if (!b) return;
  const e = b.enemy, ep = PKMN_BY_ID[e.id];
  const active = r.team[r.activeIdx], ap = PKMN_BY_ID[active.id];
  $('#bt-floor').textContent = `${r.pos.f + 1}F`;
  $('#bt-gold').textContent = `${r.gold} 金`;
  $('#bt-score').textContent = `${calcScore()}分`;
  $('#enemy-name').textContent = ep.c + (e.isBoss ? ' ★' : '');
  $('#enemy-hp-fill').style.width = clamp(e.hp / e.maxHp * 100, 0, 100) + '%';
  $('#enemy-hp-text').textContent = `${Math.max(0, e.hp)}/${e.maxHp}`;
  $('#enemy-tags').innerHTML =
    `<span class="tag ${RARITY_CSS[ep.r]}">${RARITY_LABEL[ep.r]}</span>` +
    (e.isBoss ? `<span class="tag tag-l">BOSS</span>` : e.nodeType === 'elite' ? `<span class="tag tag-r">精英</span>` : '');
  $('#player-name').textContent = ap.c;
  $('#player-hp-fill').style.width = clamp(active.hp / pokeMaxHp(active) * 100, 0, 100) + '%';
  $('#player-hp-text').textContent = `${Math.max(0, active.hp)}/${pokeMaxHp(active)}`;
  $('#player-lv').textContent = `Lv.${active.lv} · XP ${active.xp}/${xpNeed(active.lv)}`;
  // 连击
  const badge = $('#combo-badge');
  if (r.combo >= 2) {
    badge.classList.remove('hidden');
    badge.textContent = `COMBO ×${r.combo}`;
    badge.style.animation = 'none'; void badge.offsetWidth; badge.style.animation = '';
  } else badge.classList.add('hidden');
  // 伤药按钮
  const pb = $('#btn-potion');
  if (r.potions > 0) { pb.classList.remove('hidden'); pb.textContent = `🧪 伤药×${r.potions}`; }
  else pb.classList.add('hidden');
}

function renderTeamBar() {
  const r = G.run;
  const bar = $('#team-bar'); bar.innerHTML = '';
  r.team.forEach((inst, i) => {
    const p = PKMN_BY_ID[inst.id];
    const el = document.createElement('div');
    el.className = 'team-slot' + (i === r.activeIdx ? ' active' : '') + (inst.hp <= 0 ? ' fainted' : '');
    el.innerHTML = `<img src="${ICON(inst.id)}" alt="${p.c}"><div class="ts-hp"><i style="width:${clamp(inst.hp / pokeMaxHp(inst) * 100, 0, 100)}%"></i></div>`;
    el.title = p.c;
    el.addEventListener('click', () => trySwitch(i));
    bar.appendChild(el);
  });
}

function trySwitch(i) {
  const r = G.run, b = G.battle;
  if (!b || b.phase !== 'question' && b.phase !== 'anim') return;
  if (i === r.activeIdx || r.team[i].hp <= 0) return;
  if (b.switchUsed && b.phase === 'question') { toast('本题作答前只能换一次'); return; }
  r.activeIdx = i;
  b.switchUsed = true;
  AudioEngine.sfx('switchP');
  const inst = r.team[i];
  if (BattleFX.ok) BattleFX.setPlayer(inst.id);
  else $('#fb-player').src = ICON(inst.id);
  renderBattleHUD(); renderTeamBar();
  spawnFxText(24, 62, `换上 ${PKMN_BY_ID[inst.id].c}！`, '#00ff88');
  saveRun();
}

/* ================= 题目流程 ================= */
function pickQuestion() {
  const r = G.run;
  let q, guard = 0;
  do { q = pick(window.QUESTIONS); guard++; } while (r.usedQ[q.id] && guard < 60);
  r.usedQ[q.id] = 1;
  return q;
}

function nextQuestion() {
  const b = G.battle; if (!b) return;
  const r = G.run;
  b.phase = 'question'; b.locked = false; b.switchUsed = false;
  $('#q-card').classList.remove('dimmed');
  const q = pickQuestion();
  b.q = q;
  $('#q-text').textContent = q.q;
  const wrap = $('#q-opts'); wrap.innerHTML = ''; wrap.classList.remove('locked');
  const KEYS = ['A', 'B', 'C', 'D', 'E'];
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    const text = opt.replace(/^[A-E]\.\s*/, '');
    btn.innerHTML = `<span class="opt-key">${KEYS[i]}</span><span>${text}</span>`;
    btn.addEventListener('click', () => answer(i));
    wrap.appendChild(btn);
  });
  // 计时
  b.timeTotal = TIMER_SEC[G.meta.settings.diff] || 20;
  b.timeLeft = b.timeTotal;
  clearInterval(b.timer);
  updateTimerBar();
  b.timer = setInterval(() => {
    b.timeLeft -= 0.1;
    updateTimerBar();
    if (b.timeLeft <= 0) { clearInterval(b.timer); answer(-1); }
  }, 100);
}
function updateTimerBar() {
  const b = G.battle;
  const k = clamp(b.timeLeft / b.timeTotal, 0, 1);
  const fill = $('#q-timer-fill');
  fill.style.width = k * 100 + '%';
  fill.classList.toggle('low', k < 0.3);
}

function answer(idx) {
  const b = G.battle; if (!b || b.locked) return;
  b.locked = true; b.phase = 'anim';
  clearInterval(b.timer);
  const r = G.run;
  const q = b.q;
  const correct = idx === q.ans;
  r.answered++; G.meta.totalAnswered++;
  const optBtns = $$('#q-opts .opt-btn');
  $('#q-opts').classList.add('locked');
  if (idx >= 0 && optBtns[idx]) optBtns[idx].classList.add(correct ? 'correct' : 'wrong');

  if (correct) {
    r.correct++; G.meta.totalCorrect++;
    if (G.meta.wrongQ[q.id]) { delete G.meta.wrongQ[q.id]; }
    r.combo++;
    r.maxCombo = Math.max(r.maxCombo, r.combo);
    G.meta.maxComboEver = Math.max(G.meta.maxComboEver, r.combo);
    const fast = b.timeLeft / b.timeTotal > 0.66;
    playerAttack(fast);
  } else {
    r.combo = 0;
    G.meta.wrongQ[q.id] = 1;
    if (optBtns[q.ans]) optBtns[q.ans].classList.add('reveal');
    if (idx === -1) { AudioEngine.sfx('timeout'); spawnFxText(50, 30, '⏰ 超时！', '#ff8800'); }
    else AudioEngine.sfx('wrong');
    BattleFX.comboAura(0);
    setTimeout(enemyAttack, idx === -1 ? 500 : 750);
  }
  C.saveMeta(); saveRun();
  renderBattleHUD();
}

/* ================= 玩家攻击 ================= */
function playerAttack(fast) {
  const b = G.battle, r = G.run;
  const active = r.team[r.activeIdx];
  let dmg = pokeAtk(active) + Math.floor(r.combo / 4) + (fast ? 1 : 0);
  const crit = Math.random() < critChance(active);
  if (crit) dmg = Math.round(dmg * 1.6);
  const goldGain = 2 + Math.floor(r.combo / 2) + (fast ? 1 : 0);
  r.gold += goldGain; r.goldEarned += goldGain;
  AudioEngine.sfx('correct');
  setTimeout(() => AudioEngine.sfx('coin'), 250);
  BattleFX.comboAura(r.combo);
  const doHit = () => {
    b.enemy.hp -= dmg;
    AudioEngine.sfx(crit ? 'crit' : 'hit');
    if (crit) shakeScreen();
    spawnDmg(66, 38, `-${dmg}`, crit ? '#ffd700' : '#ff6688', crit);
    if (crit) spawnFxText(66, 30, '暴击！', '#ffd700');
    if (fast) spawnFxText(30, 55, '⚡快速作答 +1', '#00f0ff');
    domBurst(66, 42, crit ? '#ffd700' : '#ff6688', crit ? 22 : 12);
    renderBattleHUD();
    if (b.enemy.hp <= 0) setTimeout(winBattle, 650);
    else setTimeout(nextQuestion, 800);
  };
  if (BattleFX.ok) BattleFX.attack('player', { crit }, doHit);
  else doHit();
}

/* ================= 敌方攻击 ================= */
function enemyAttack() {
  const b = G.battle, r = G.run; if (!b) return;
  const active = r.team[r.activeIdx];
  const dmg = b.enemy.atk;
  const doHit = () => {
    active.hp -= dmg;
    AudioEngine.sfx('hurt'); shakeScreen();
    spawnDmg(28, 55, `-${dmg}`, '#ff0044');
    domBurst(28, 60, '#ff0044', 12);
    renderBattleHUD(); renderTeamBar(); saveRun();
    if (active.hp <= 0) setTimeout(playerFaint, 650);
    else setTimeout(nextQuestion, 800);
  };
  if (BattleFX.ok) BattleFX.attack('enemy', {}, doHit);
  else doHit();
}

/* ================= 我方倒下 ================= */
function playerFaint() {
  const b = G.battle, r = G.run;
  const active = r.team[r.activeIdx];
  AudioEngine.sfx('ko');
  spawnFxText(28, 50, `${PKMN_BY_ID[active.id].c} 倒下了…`, '#8fa3cf');
  const after = () => {
    const alive = r.team.findIndex(p => p.hp > 0);
    if (alive === -1) { gameOver(false); return; }
    r.activeIdx = alive;
    if (BattleFX.ok) BattleFX.setPlayer(r.team[alive].id);
    else $('#fb-player').src = ICON(r.team[alive].id);
    spawnFxText(28, 55, `加油，${PKMN_BY_ID[r.team[alive].id].c}！`, '#00ff88');
    renderBattleHUD(); renderTeamBar();
    setTimeout(nextQuestion, 700);
  };
  if (BattleFX.ok) BattleFX.ko('player', after); else after();
}

/* ================= 胜利 ================= */
function winBattle() {
  const b = G.battle, r = G.run;
  const e = b.enemy, ep = PKMN_BY_ID[e.id];
  b.phase = 'won';
  $('#q-card').classList.add('dimmed');
  const goldWin = 10 + (r.pos.f + 1) * 2 + (e.nodeType === 'elite' ? 20 : 0) + (e.isBoss ? 60 : 0);
  r.gold += goldWin; r.goldEarned += goldWin;
  if (e.isBoss) r.bossKills++;
  AudioEngine.sfx('victory');
  const xpGain = 6 + (r.pos.f + 1) * 2 + (e.nodeType === 'elite' ? 10 : 0) + (e.nodeType === 'boss2' ? 20 : 0) + (e.nodeType === 'boss' ? 34 : 0);
  const after = () => {
    spawnFxText(50, 40, `胜利！+${goldWin} 金币`, '#ffd700');
    domBurst(50, 40, '#ffd700', 24);
    grantXp(xpGain);
    renderBattleHUD(); renderTeamBar(); saveRun();
    setTimeout(() => openCapture(), 1100);
  };
  if (BattleFX.ok) BattleFX.ko('enemy', after); else after();
}

function grantXp(xp) {
  const r = G.run;
  const active = r.team[r.activeIdx];
  active.xp += xp;
  let leveled = 0;
  while (active.lv < window.GAME_CONST.MAX_LEVEL && active.xp >= xpNeed(active.lv)) {
    active.xp -= xpNeed(active.lv);
    active.lv++; leveled++;
    active.hp = Math.min(pokeMaxHp(active), active.hp + 2);
  }
  if (active.lv >= window.GAME_CONST.MAX_LEVEL) active.xp = Math.min(active.xp, xpNeed(active.lv));
  if (leveled > 0) {
    AudioEngine.sfx('levelup');
    spawnFxText(28, 50, `⬆ ${PKMN_BY_ID[active.id].c} 升到 Lv.${active.lv}！`, '#00ff88');
    if (BattleFX.ok) BattleFX.heal('player');
    domBurst(28, 55, '#00ff88', 18);
  }
}

/* ================= 捕获 ================= */
function openCapture() {
  const b = G.battle, r = G.run;
  const e = b.enemy, ep = PKMN_BY_ID[e.id];
  const chance = ball => clamp(CATCH_BASE[ep.r] * (ball === 'super' ? 1.6 : 1), 0, 0.95);
  const render = () => {
    openModal(`
      <h3>捕获机会！</h3>
      <div class="capture-pkmn"><img src="${ICON(e.id)}" alt=""></div>
      <div class="capture-info">
        <b style="color:var(--txt)">${ep.c}</b> <span class="tag ${RARITY_CSS[ep.r]}">${RARITY_LABEL[ep.r]}</span><br>
        精灵球 ${(chance('normal') * 100).toFixed(0)}% · 超级球 ${(chance('super') * 100).toFixed(0)}%
        ${r.team.length >= window.GAME_CONST.MAX_TEAM ? '<br><span style="color:var(--gold)">队伍已满，捕获后需替换或放生</span>' : ''}
      </div>
      <div class="ball-row">
        <button class="ball-btn" id="cap-normal" ${r.balls <= 0 ? 'disabled' : ''}>
          <span class="b-icon">🔴</span>精灵球<br><span class="b-cnt">×${r.balls}</span></button>
        <button class="ball-btn" id="cap-super" ${r.superBalls <= 0 ? 'disabled' : ''}>
          <span class="b-icon">🔵</span>超级球<br><span class="b-cnt">×${r.superBalls}</span></button>
      </div>
      <div class="m-actions"><button class="btn" id="cap-skip">放过它（直接离开）</button></div>
    `);
    $('#cap-normal').onclick = () => doCapture('normal', render);
    $('#cap-super').onclick = () => doCapture('super', render);
    $('#cap-skip').onclick = () => { AudioEngine.sfx('flee'); endBattle(); };
  };
  render();
}

function doCapture(ball, rerender) {
  const b = G.battle, r = G.run;
  if (ball === 'normal' && r.balls <= 0) return;
  if (ball === 'super' && r.superBalls <= 0) return;
  if (ball === 'normal') r.balls--; else r.superBalls--;
  const ep = PKMN_BY_ID[b.enemy.id];
  const success = Math.random() < clamp(CATCH_BASE[ep.r] * (ball === 'super' ? 1.6 : 1), 0, 0.95);
  closeModal();
  AudioEngine.sfx('throwBall');
  const finish = ok => {
    saveRun();
    if (ok) {
      AudioEngine.sfx('caught');
      markSeen(ep.id, true);
      r.captures++;
      if (BattleFX.ok) setTimeout(() => BattleFX.endCapture(), 400);
      spawnFxText(50, 38, `🎉 成功捕获 ${ep.c}！`, '#ffd700');
      domBurst(50, 40, '#ffd700', 26);
      setTimeout(() => addToTeam(b.enemy.id), 900);
    } else {
      AudioEngine.sfx('escape');
      spawnFxText(50, 38, `${ep.c} 挣脱了精灵球，逃走了…`, '#ff8800');
      setTimeout(endBattle, 1200);
    }
  };
  if (BattleFX.ok) {
    BattleFX.capture({
      result: success,
      onShake: n => { AudioEngine.sfx('ballShake'); },
      onAbsorbed: () => AudioEngine.sfx('ballHit'),
      onResult: finish,
    });
  } else {
    setTimeout(() => finish(success), 1200);
  }
}

function addToTeam(id) {
  const r = G.run;
  const ep = PKMN_BY_ID[id];
  const lv = clamp(1 + Math.floor((r.pos.f + 1) / 4), 1, window.GAME_CONST.MAX_LEVEL);
  if (r.team.length < window.GAME_CONST.MAX_TEAM) {
    r.team.push(newInstance(id, lv));
    saveRun();
    endBattle();
    return;
  }
  // 队伍满：替换或放生
  let rows = r.team.map((inst, i) => {
    const p = PKMN_BY_ID[inst.id];
    return `<div class="tm-poke"><img src="${ICON(inst.id)}">
      <div class="tm-info"><div class="tm-name">${p.c} Lv.${inst.lv}</div>
      <div class="tm-sub">HP ${inst.hp}/${pokeMaxHp(inst)}</div></div>
      <button class="btn btn-mini" data-replace="${i}">替换</button></div>`;
  }).join('');
  openModal(`
    <h3>队伍已满</h3>
    <p class="dim" style="margin-bottom:10px">选择一只替换为 ${ep.c}，或放生获得 40 金币</p>
    <div class="team-modal-list">${rows}</div>
    <div class="m-actions"><button class="btn" id="btn-release">放生 ${ep.c}（+40 金币）</button></div>
  `);
  $$('#modal [data-replace]').forEach(btn => btn.onclick = () => {
    const i = +btn.dataset.replace;
    const old = PKMN_BY_ID[r.team[i].id];
    r.team[i] = newInstance(id, lv);
    if (r.activeIdx === i) { if (BattleFX.ok) BattleFX.setPlayer(id); }
    toast(`${old.c} 离队，${ep.c} 加入！`);
    saveRun(); closeModal(); endBattle();
  });
  $('#btn-release').onclick = () => {
    G.run.gold += 40; G.run.goldEarned += 40;
    toast(`放生了 ${ep.c}，获得 40 金币`);
    saveRun(); closeModal(); endBattle();
  };
}

/* ================= 战斗结束 ================= */
function endBattle() {
  const b = G.battle;
  closeModal();
  clearInterval(b && b.timer);
  const node = b ? b.node : null;
  G.battle = null;
  BattleFX.setRunning(false);
  saveRun();
  if (node && node.type === 'boss') { gameOver(true); return; }
  show('scr-map');
  C.renderMap();
  AudioEngine.bgm('map');
}

function gameOver(win) {
  const r = G.run;
  BattleFX.setRunning(false);
  const score = calcScore();
  const isRecord = score > G.meta.bestScore;
  if (isRecord) G.meta.bestScore = score;
  if (win) G.meta.wins++;
  C.saveMeta();
  AudioEngine.sfx(win ? 'fanfare' : 'defeat');
  AudioEngine.bgm(win ? 'rest' : 'title');
  // 结算
  const mins = Math.max(1, Math.round((Date.now() - r.startTime) / 60000));
  $('#over-title').textContent = win ? '🏆 通关地牢！' : '💀 冒险失败';
  $('#over-title').className = 'over-title ' + (win ? 'win' : 'lose');
  $('#over-sub').innerHTML = (win ? '你击败了最终 BOSS，驾驭了交规之力！' : `止步于第 ${r.pos.f + 1} 层`) +
    (isRecord ? '<div class="new-record">✨ 新纪录！</div>' : '');
  const acc = r.answered ? Math.round(r.correct / r.answered * 100) : 0;
  $('#over-stats').innerHTML = [
    [score, '总分'], [r.goldEarned, '累计金币'],
    [`${r.correct}/${r.answered}`, '答题（正确/总数）'], [acc + '%', '正确率'],
    [r.maxCombo, '最高连击'], [r.captures, '捕获宝可梦'],
    [r.floorsCleared, '通过层数'], [mins + ' 分钟', '用时'],
  ].map(([v, k]) => `<div class="over-stat"><div class="os-v">${v}</div><div class="os-k">${k}</div></div>`).join('');
  G.run = null; saveRun();
  show('scr-over');
  if (win) { domBurst(50, 30, '#ffd700', 30); }
}

/* 伤药 */
$('#btn-potion').addEventListener('click', () => {
  const b = G.battle, r = G.run;
  if (!b || r.potions <= 0 || b.phase === 'won') return;
  const active = r.team[r.activeIdx];
  if (active.hp >= pokeMaxHp(active)) { toast('HP 已满'); return; }
  r.potions--;
  active.hp = Math.min(pokeMaxHp(active), active.hp + Math.ceil(pokeMaxHp(active) / 2));
  AudioEngine.sfx('heal');
  if (BattleFX.ok) BattleFX.heal('player');
  spawnFxText(28, 55, '+HP 恢复', '#00ff88');
  domBurst(28, 58, '#00ff88', 14);
  renderBattleHUD(); renderTeamBar(); saveRun();
});

window.Battle = { startBattle, gameOver, endBattle };
})();
