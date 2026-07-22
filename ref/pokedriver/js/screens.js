/* ===== 界面：标题 / 商店 / 休息 / 图鉴 / 复习 / 设置 ===== */
(function () {
'use strict';
const C = window.GameCore;
const { $, $$, show, toast, openModal, closeModal, calcScore, renderMap, renderStarters, newRun,
  baseHp, pokeMaxHp, pokeAtk, pokeSpeed, xpNeed, markSeen, saveMeta, saveRun, loadRun,
  PKMN_BY_ID, ICON, RARITY_LABEL, RARITY_CSS, rand, pick, clamp } = C;
const G = window.G;

/* ================= 标题页 ================= */
function renderTitle() {
  // 随机展示 3 只宝可梦
  const wrap = $('#title-pkmn'); wrap.innerHTML = '';
  const ids = new Set();
  while (ids.size < 3) ids.add(pick(window.POKEMON).id);
  ids.forEach(id => {
    const img = document.createElement('img');
    img.src = ICON(id); img.alt = PKMN_BY_ID[id].c;
    wrap.appendChild(img);
  });
  const save = loadRun();
  $('#btn-continue').classList.toggle('hidden', !save);
  const caught = Object.values(G.meta.dex).filter(d => d.caught > 0).length;
  $('#title-stats').innerHTML =
    `<span>🏆 最高分 ${G.meta.bestScore}</span><span>🗺 冒险 ${G.meta.runs} 次</span><span>📖 图鉴 ${caught}/721</span>`;
}

/* ================= 商店 ================= */
const SHOP_POOL = [
  { icon: '🧪', name: '伤药', desc: '恢复当前出战宝可梦 50% HP', price: 30, can: r => true, apply(r) { r.potions++; } },
  { icon: '💊', name: '好伤药', desc: '完全恢复当前出战宝可梦 HP', price: 55, can: r => true, apply(r) { const a = r.team[r.activeIdx]; a.hp = pokeMaxHp(a); } },
  { icon: '🧴', name: '全队恢复喷雾', desc: '全队存活宝可梦恢复 50% HP', price: 85, can: r => true, apply(r) { r.team.forEach(p => { if (p.hp > 0) p.hp = Math.min(pokeMaxHp(p), p.hp + Math.ceil(pokeMaxHp(p) / 2)); }); } },
  { icon: '🔴', name: '精灵球 ×3', desc: '用于捕获击败的宝可梦', price: 45, can: r => true, apply(r) { r.balls += 3; } },
  { icon: '🔵', name: '超级球 ×2', desc: '捕获率 ×1.6 的高级精灵球', price: 70, can: r => true, apply(r) { r.superBalls += 2; } },
  { icon: '⚔️', name: '攻击之证', desc: '本次冒险全队攻击 +1', price: 80, can: r => true, apply(r) { r.atkBonus++; } },
  { icon: '❤️', name: '生命宝珠', desc: '本次冒险全队最大 HP +3', price: 80, can: r => true, apply(r) { r.hpBonus += 3; r.team.forEach(p => p.hp += 3); } },
  { icon: '✨', name: '复活水晶', desc: '复活所有倒下宝可梦并恢复 50% HP', price: 100, can: r => r.team.some(p => p.hp <= 0), apply(r) { r.team.forEach(p => { if (p.hp <= 0) p.hp = Math.ceil(pokeMaxHp(p) / 2); }); } },
  { icon: '📚', name: '考前秘籍', desc: '立即获得 25 XP（出战宝可梦）', price: 50, can: r => true, apply(r) { const a = r.team[r.activeIdx]; a.xp += 25; } },
];
let shopStock = [];
function openShop() {
  const r = G.run;
  shopStock = [];
  const pool = SHOP_POOL.slice();
  while (shopStock.length < 5 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    shopStock.push(pool.splice(i, 1)[0]);
  }
  AudioEngine.bgm('shop');
  renderShop();
  show('scr-shop');
}
function renderShop() {
  const r = G.run;
  $('#shop-gold').textContent = `金币：${r.gold}`;
  const list = $('#shop-list'); list.innerHTML = '';
  shopStock.forEach((item, i) => {
    const price = item.price + Math.floor((r.pos.f + 1) * 2.5);
    const el = document.createElement('div');
    el.className = 'shop-item';
    el.innerHTML = `<div class="si-icon">${item.icon}</div>
      <div class="si-body"><div class="si-name">${item.name}</div><div class="si-desc">${item.desc}</div></div>
      <button class="btn btn-mini si-buy">💰${price}</button>`;
    const btn = el.querySelector('.si-buy');
    if (r.gold < price) btn.disabled = true;
    btn.addEventListener('click', () => {
      if (r.gold < price) return;
      r.gold -= price;
      item.apply(r);
      AudioEngine.sfx('coin');
      toast(`购买了 ${item.name}`);
      shopStock.splice(i, 1);
      saveRun(); renderShop();
    });
    list.appendChild(el);
  });
}
$('#btn-shop-leave').addEventListener('click', () => {
  AudioEngine.sfx('click');
  show('scr-map'); renderMap(); AudioEngine.bgm('map');
});

/* ================= 休息 ================= */
function openRest() {
  AudioEngine.bgm('rest');
  const r = G.run;
  const list = $('#rest-list'); list.innerHTML = '';
  const opts = [
    { icon: '🔥', name: '篝火休息', desc: '全队恢复 40% 最大 HP', fn() {
      r.team.forEach(p => { if (p.hp > 0) p.hp = Math.min(pokeMaxHp(p), p.hp + Math.ceil(pokeMaxHp(p) * 0.4)); });
      AudioEngine.sfx('heal'); toast('全队恢复了体力');
    } },
    { icon: '📖', name: '考前特训', desc: '出战宝可梦获得 20 XP', fn() {
      const a = r.team[r.activeIdx]; a.xp += 20;
      let lv = 0;
      while (a.lv < window.GAME_CONST.MAX_LEVEL && a.xp >= xpNeed(a.lv)) { a.xp -= xpNeed(a.lv); a.lv++; lv++; a.hp = Math.min(pokeMaxHp(a), a.hp + 2); }
      AudioEngine.sfx(lv ? 'levelup' : 'correct');
      toast(lv ? `${PKMN_BY_ID[a.id].c} 升到了 Lv.${a.lv}！` : '经验值提升了');
    } },
    { icon: '🧘', name: '冥想温习', desc: '随机清除 3 道错题记录', fn() {
      const keys = Object.keys(G.meta.wrongQ);
      for (let i = 0; i < 3 && keys.length; i++) delete G.meta.wrongQ[keys.splice(Math.floor(Math.random() * keys.length), 1)[0]];
      AudioEngine.sfx('heal'); saveMeta(); toast('错题本清爽了一些');
    } },
  ];
  opts.forEach(o => {
    const el = document.createElement('div');
    el.className = 'rest-card';
    el.innerHTML = `<div class="rc-icon">${o.icon}</div><div class="rc-name">${o.name}</div><div class="rc-desc">${o.desc}</div>`;
    el.addEventListener('click', () => {
      o.fn(); saveRun();
      setTimeout(() => { show('scr-map'); renderMap(); AudioEngine.bgm('map'); }, 600);
    });
    list.appendChild(el);
  });
  show('scr-rest');
}

/* ================= 队伍弹窗 ================= */
function openTeamModal() {
  const r = G.run; if (!r) return;
  const rows = r.team.map((inst, i) => {
    const p = PKMN_BY_ID[inst.id];
    return `<div class="tm-poke"><img src="${ICON(inst.id)}">
      <div class="tm-info"><div class="tm-name">${p.c} <span class="tag ${RARITY_CSS[p.r]}">${RARITY_LABEL[p.r]}</span>
        ${i === r.activeIdx ? '<span class="tag tag-c">出战中</span>' : ''}</div>
      <div class="tm-sub">Lv.${inst.lv} · XP ${inst.xp}/${xpNeed(inst.lv)} · 攻击 ${pokeAtk(inst)} · 速度 ${pokeSpeed(p)}</div>
      <div class="tm-hpbar"><i style="width:${clamp(inst.hp / pokeMaxHp(inst) * 100, 0, 100)}%"></i></div></div></div>`;
  }).join('');
  openModal(`<h3>我的队伍（${r.team.length}/${window.GAME_CONST.MAX_TEAM}）</h3>
    <div class="team-modal-list">${rows}</div>
    <p class="dim" style="margin-top:10px">精灵球 🔴×${r.balls} 🔵×${r.superBalls} · 伤药 ×${r.potions}</p>
    <div class="m-actions"><button class="btn" id="tm-close">关闭</button></div>`);
  $('#tm-close').onclick = closeModal;
}
$('#btn-map-team').addEventListener('click', () => { AudioEngine.sfx('click'); openTeamModal(); });
$('#btn-map-quit').addEventListener('click', () => {
  AudioEngine.sfx('click'); saveRun();
  show('scr-title'); renderTitle(); AudioEngine.bgm('title');
  toast('进度已保存');
});

/* ================= 图鉴 ================= */
let dexFilter = 'all', dexBuilt = false;
function dexCaught(id) { const d = G.meta.dex[id]; return d && d.caught > 0; }
function dexSeen(id) { const d = G.meta.dex[id]; return d && d.seen > 0; }
function renderDex() {
  const grid = $('#dex-grid'); grid.innerHTML = '';
  const caughtTotal = window.POKEMON.filter(p => dexCaught(p.id)).length;
  $('#dex-progress').textContent = `${caughtTotal}/721`;
  const frag = document.createDocumentFragment();
  window.POKEMON.forEach(p => {
    const caught = dexCaught(p.id), seen = dexSeen(p.id);
    if (dexFilter === 'caught' && !caught) return;
    if (['c', 'u', 'r', 'l'].includes(dexFilter) && p.r !== dexFilter) return;
    const el = document.createElement('div');
    el.className = 'dex-cell r-' + p.r + (seen ? '' : ' unknown');
    el.innerHTML = `<img src="${ICON(p.id)}" loading="lazy">
      <div class="dc-name">${seen ? p.c : '？？？'}</div>
      <div class="dc-id">No.${String(p.id).padStart(3, '0')}${caught ? ' ✅' : ''}</div>`;
    if (seen) el.addEventListener('click', () => { AudioEngine.sfx('click'); openDexDetail(p); });
    frag.appendChild(el);
  });
  grid.appendChild(frag);
}
function openDexDetail(p) {
  const d = G.meta.dex[p.id] || { seen: 0, caught: 0 };
  const tiers = [];
  if (window.GAME_CONST.TIER1_LEGEND.includes(p.id)) tiers.push('一级神');
  if (window.GAME_CONST.TIER2_LEGEND.includes(p.id)) tiers.push('二级神');
  if (window.GAME_CONST.MYTHICAL.includes(p.id)) tiers.push('幻兽');
  openModal(`
    <div class="capture-pkmn"><img src="${ICON(p.id)}" style="width:120px;height:100px"></div>
    <h3 style="text-align:center">No.${String(p.id).padStart(3, '0')} ${p.c}</h3>
    <div style="text-align:center;margin:6px 0">
      <span class="tag ${RARITY_CSS[p.r]}">${RARITY_LABEL[p.r]}</span>
      ${tiers.map(t => `<span class="tag tag-l">${t}</span>`).join('')}
    </div>
    <div class="capture-info">
      基础 HP ${baseHp(p)} · 速度 ${pokeSpeed(p)}<br>
      遇见 ${d.seen} 次 · 捕获 ${d.caught} 次 ${d.caught ? '✅ 已收藏' : ''}
    </div>
    <div class="m-actions"><button class="btn" id="dd-close">关闭</button></div>`);
  $('#dd-close').onclick = closeModal;
}
$$('#dex-filter .chip').forEach(ch => ch.addEventListener('click', () => {
  $$('#dex-filter .chip').forEach(x => x.classList.remove('active'));
  ch.classList.add('active');
  dexFilter = ch.dataset.f;
  AudioEngine.sfx('click'); renderDex();
}));

/* ================= 题库复习 ================= */
const REV_PAGE = 40;
let revPage = 0, revWrongOnly = false, revSearch = '';
function reviewList() {
  let list = window.QUESTIONS;
  if (revWrongOnly) list = list.filter(q => G.meta.wrongQ[q.id]);
  if (revSearch) list = list.filter(q => q.q.includes(revSearch) || q.opts.some(o => o.includes(revSearch)));
  return list;
}
function renderReview() {
  $('#wrong-count').textContent = Object.keys(G.meta.wrongQ).length;
  $('#chip-wrong').classList.toggle('active', revWrongOnly);
  const list = reviewList();
  const pages = Math.max(1, Math.ceil(list.length / REV_PAGE));
  revPage = clamp(revPage, 0, pages - 1);
  const slice = list.slice(revPage * REV_PAGE, revPage * REV_PAGE + REV_PAGE);
  $('#pg-info').textContent = `${revPage + 1}/${pages} · 共 ${list.length} 题`;
  const wrap = $('#review-list'); wrap.innerHTML = '';
  const KEYS = ['A', 'B', 'C', 'D', 'E'];
  slice.forEach(q => {
    const el = document.createElement('div');
    el.className = 'rev-card';
    const wrong = G.meta.wrongQ[q.id];
    el.innerHTML = `<div class="rq">${wrong ? '🔴 ' : ''}${q.q}</div>
      <div class="ra">${q.opts.map((o, i) =>
        `<div class="${i === q.ans ? 'ok' : 'no'}">${KEYS[i]}. ${o.replace(/^[A-E]\.\s*/, '')}${i === q.ans ? ' ✓' : ''}</div>`).join('')}</div>
      <div class="rid">${q.id}${wrong ? ' · 错题' : ''} · 点击查看答案</div>`;
    el.addEventListener('click', () => { el.classList.toggle('open'); AudioEngine.sfx('click'); });
    wrap.appendChild(el);
  });
}
$('#review-search').addEventListener('input', e => { revSearch = e.target.value.trim(); revPage = 0; renderReview(); });
$('#chip-wrong').addEventListener('click', () => { revWrongOnly = !revWrongOnly; revPage = 0; renderReview(); });
$('#pg-prev').addEventListener('click', () => { revPage--; renderReview(); });
$('#pg-next').addEventListener('click', () => { revPage++; renderReview(); });

/* 模拟练习：10 题快测 */
function openQuiz() {
  const qs = [];
  const pool = window.QUESTIONS.slice();
  while (qs.length < 10 && pool.length) qs.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  let idx = 0, score = 0;
  const KEYS = ['A', 'B', 'C', 'D', 'E'];
  const renderQ = () => {
    const q = qs[idx];
    openModal(`
      <h3>模拟练习 ${idx + 1}/10</h3>
      <div style="font-size:15px;line-height:1.6;margin-bottom:12px">${q.q}</div>
      <div class="m-actions" id="quiz-opts">
        ${q.opts.map((o, i) => `<button class="btn opt-btn" data-i="${i}"><span class="opt-key">${KEYS[i]}</span><span>${o.replace(/^[A-E]\.\s*/, '')}</span></button>`).join('')}
      </div>`);
    $$('#quiz-opts .opt-btn').forEach(btn => btn.onclick = () => {
      const i = +btn.dataset.i;
      const ok = i === q.ans;
      if (ok) { score++; AudioEngine.sfx('correct'); delete G.meta.wrongQ[q.id]; }
      else { AudioEngine.sfx('wrong'); G.meta.wrongQ[q.id] = 1; }
      G.meta.totalAnswered++; if (ok) G.meta.totalCorrect++;
      saveMeta();
      $$('#quiz-opts .opt-btn').forEach(b => {
        b.style.pointerEvents = 'none';
        if (+b.dataset.i === q.ans) b.classList.add('correct');
        else if (+b.dataset.i === i) b.classList.add('wrong');
      });
      setTimeout(() => { idx++; idx < 10 ? renderQ() : renderResult(); }, 900);
    });
  };
  const renderResult = () => {
    const pass = score >= 9; // 科目一 90 分合格
    openModal(`
      <h3 style="text-align:center">${pass ? '🎉 合格！' : '继续努力'}</h3>
      <div style="text-align:center;font-size:44px;font-weight:900;color:${pass ? 'var(--gold)' : 'var(--red)'};margin:12px 0">${score * 10}<span style="font-size:16px;color:var(--dim)">/100</span></div>
      <p class="dim" style="text-align:center">科目一合格线为 90 分${pass ? '，你已具备上路理论资格！' : '，错题已加入错题本。'}</p>
      <div class="m-actions"><button class="btn btn-primary" id="quiz-close">完成</button></div>`);
    if (pass) AudioEngine.sfx('fanfare');
    $('#quiz-close').onclick = () => { closeModal(); renderReview(); };
  };
  renderQ();
}
$('#btn-quiz').addEventListener('click', () => { AudioEngine.sfx('click'); openQuiz(); });

/* ================= 设置 ================= */
function renderSettings() {
  const s = G.meta.settings;
  $('#set-bgm').value = Math.round(s.bgm * 100);
  $('#set-sfx').value = Math.round(s.sfx * 100);
  $('#set-shake').textContent = s.shake ? '开' : '关';
  $('#set-shake').classList.toggle('active', s.shake);
  $$('#set-diff button').forEach(b => b.classList.toggle('active', b.dataset.d === s.diff));
}
$('#set-bgm').addEventListener('input', e => {
  G.meta.settings.bgm = e.target.value / 100;
  AudioEngine.setBgmVol(G.meta.settings.bgm); saveMeta();
});
$('#set-sfx').addEventListener('input', e => {
  G.meta.settings.sfx = e.target.value / 100;
  AudioEngine.setSfxVol(G.meta.settings.sfx); saveMeta();
  AudioEngine.sfx('click');
});
$('#set-shake').addEventListener('click', () => {
  G.meta.settings.shake = !G.meta.settings.shake;
  saveMeta(); renderSettings();
});
$$('#set-diff button').forEach(b => b.addEventListener('click', () => {
  G.meta.settings.diff = b.dataset.d; saveMeta(); renderSettings(); AudioEngine.sfx('click');
}));
$('#set-wipe').addEventListener('click', () => {
  openModal(`<h3>确认清除？</h3><p class="dim">将删除存档、图鉴收藏、错题本和所有设置，不可恢复。</p>
    <div class="m-actions">
      <button class="btn btn-danger" id="wipe-yes">确认清除</button>
      <button class="btn" id="wipe-no">取消</button></div>`);
  $('#wipe-yes').onclick = () => {
    localStorage.removeItem('pd_meta_v1'); localStorage.removeItem('pd_save_v1');
    G.meta = C.defaultMeta(); G.run = null; saveMeta();
    closeModal(); renderSettings(); renderTitle();
    toast('数据已清除');
  };
  $('#wipe-no').onclick = closeModal;
});

/* ================= 导航绑定 ================= */
$('#btn-start').addEventListener('click', () => {
  AudioEngine.sfx('click');
  if (loadRun()) {
    openModal(`<h3>发现未完成的冒险</h3><p class="dim">继续旧存档，还是开始新的冒险？</p>
      <div class="m-actions">
        <button class="btn btn-primary" id="rs-continue">继续冒险</button>
        <button class="btn" id="rs-new">新的冒险（覆盖旧档）</button>
        <button class="btn" id="rs-cancel">取消</button></div>`);
    $('#rs-continue').onclick = () => { closeModal(); continueRun(); };
    $('#rs-new').onclick = () => { closeModal(); renderStarters(); show('scr-starter'); };
    $('#rs-cancel').onclick = closeModal;
  } else { renderStarters(); show('scr-starter'); }
});
$('#btn-continue').addEventListener('click', () => { AudioEngine.sfx('click'); continueRun(); });
$('#btn-dex').addEventListener('click', () => { AudioEngine.sfx('click'); renderDex(); show('scr-dex'); });
$('#btn-review').addEventListener('click', () => { AudioEngine.sfx('click'); renderReview(); show('scr-review'); });
$('#btn-settings').addEventListener('click', () => { AudioEngine.sfx('click'); renderSettings(); show('scr-settings'); });
$$('.btn.back').forEach(b => b.addEventListener('click', () => {
  AudioEngine.sfx('click');
  show('scr-title'); renderTitle();
}));
$('#btn-over-restart').addEventListener('click', () => { AudioEngine.sfx('click'); renderStarters(); show('scr-starter'); });
$('#btn-over-title').addEventListener('click', () => { AudioEngine.sfx('click'); show('scr-title'); renderTitle(); AudioEngine.bgm('title'); });

function continueRun() {
  const save = loadRun();
  if (!save) { renderStarters(); show('scr-starter'); return; }
  G.run = save;
  show('scr-map'); renderMap(); AudioEngine.bgm('map');
}

/* ================= 启动 ================= */
window.Screens = { renderTitle, openShop, openRest, continueRun };
window.openShop = openShop;
window.openRest = openRest;
window.startBattleNode = node => window.Battle.startBattle(node);
})();
