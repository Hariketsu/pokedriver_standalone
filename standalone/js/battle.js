// SECTION 1: AUDIO ENGINE (WebAudio API)
// ============================================================
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
}

function playTone(freq, type, duration, vol=0.08, glide=0) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glide) osc.frequency.linearRampToValueAtTime(freq + glide, t + duration);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + duration);
  } catch(e) {}
}

function sfxCorrect() { playTone(523, 'square', 0.08, 0.06); setTimeout(() => playTone(659, 'square', 0.08, 0.06), 60); setTimeout(() => playTone(784, 'square', 0.08, 0.08), 120); }
function sfxWrong() { playTone(150, 'sawtooth', 0.15, 0.1); playTone(100, 'triangle', 0.1, 0.2); }
function sfxCombo() { playTone(880, 'square', 0.05, 0.05, 440); }
function sfxCard() { playTone(660, 'triangle', 0.06, 0.06); }
function sfxCapture() { for(let i=0;i<3;i++) setTimeout(()=>playTone(440+i*110,'square',0.08,0.06),i*100); setTimeout(()=>playTone(880,'square',0.1,0.15),350); }
function sfxCaptureFail() { playTone(300, 'sawtooth', 0.1, 0.15); setTimeout(()=>playTone(200,'sawtooth',0.1,0.2),150); }
function sfxDamage() { playTone(80, 'sawtooth', 0.15, 0.12); playTone(60, 'square', 0.1, 0.2); }
function sfxGold() { playTone(1047, 'triangle', 0.04, 0.04); }
function sfxHeal() { playTone(392, 'sine', 0.1, 0.1); setTimeout(()=>playTone(523,'sine',0.1,0.1),100); setTimeout(()=>playTone(659,'sine',0.1,0.15),200); }
function sfxClick() { playTone(800, 'square', 0.03, 0.03); }

// ============================================================

// SECTION 3: CARD DEFINITIONS
// ============================================================
const ALL_CARDS = [
  // ══════════════════════════════════════
  // 攻击系 atk — 基于宝可梦伤害技能
  // ══════════════════════════════════════
  // --- 普通 c (power:1) ---
  { id:'tackle', name:'撞击', type:'atk', cost:1, icon:'👊', desc:'造成6点伤害', rarity:'c', cat:'atk', power:1, fx:{dmg:6} },
  { id:'ember', name:'火花', type:'atk', cost:1, icon:'🔥', desc:'造成5点伤害，30%灼烧2回合', rarity:'c', cat:'atk', power:1, fx:{dmg:5, status:'burn', statusChance:0.3, statusTurns:2} },
  { id:'quick_attack', name:'电光一闪', type:'atk', cost:0, icon:'💨', desc:'造成4点伤害（0费）', rarity:'c', cat:'atk', power:1, fx:{dmg:4} },
  { id:'aqua_jet', name:'水流喷射', type:'atk', cost:1, icon:'💧', desc:'造成7点伤害', rarity:'c', cat:'atk', power:1, fx:{dmg:7} },
  { id:'bullet_punch', name:'子弹拳', type:'atk', cost:1, icon:'🔩', desc:'造成6点伤害', rarity:'c', cat:'atk', power:1, fx:{dmg:6} },
  { id:'thunder_shock', name:'电击', type:'atk', cost:1, icon:'⚡', desc:'造成5点伤害，20%麻痹1回合', rarity:'c', cat:'atk', power:1, fx:{dmg:5, status:'para', statusChance:0.2, statusTurns:1} },
  { id:'water_gun', name:'水枪', type:'atk', cost:1, icon:'💧', desc:'造成6点伤害', rarity:'c', cat:'atk', power:1, fx:{dmg:6} },
  { id:'razor_leaf', name:'飞叶快刀', type:'atk', cost:1, icon:'🍃', desc:'造成7点伤害', rarity:'c', cat:'atk', power:1, fx:{dmg:7} },
  // --- 稀有 u (power:2) ---
  { id:'double_kick', name:'二连踢', type:'atk', cost:1, icon:'👟', desc:'造成4点伤害×2', rarity:'u', cat:'atk', power:2, fx:{dmg:4, hits:2} },
  { id:'flame_thrower', name:'喷射火焰', type:'atk', cost:2, icon:'🔥', desc:'造成14点伤害，40%灼烧2回合', rarity:'u', cat:'atk', power:2, fx:{dmg:14, status:'burn', statusChance:0.4, statusTurns:2} },
  { id:'thunderbolt', name:'十万伏特', type:'atk', cost:2, icon:'⚡', desc:'造成14点伤害，无视部分格挡', rarity:'u', cat:'atk', power:2, fx:{dmg:14, pierce:0.5} },
  { id:'ice_beam', name:'冰冻光束', type:'atk', cost:2, icon:'❄️', desc:'造成13点伤害，35%冰冻1回合', rarity:'u', cat:'atk', power:2, fx:{dmg:13, status:'freeze', statusChance:0.35, statusTurns:1} },
  { id:'psychic', name:'精神强念', type:'atk', cost:2, icon:'🔮', desc:'造成12点伤害，敌方下回合伤害-15%', rarity:'u', cat:'atk', power:2, fx:{dmg:12, enemyWeak:0.15} },
  { id:'scald', name:'热水', type:'atk', cost:2, icon:'♨️', desc:'造成12点伤害，35%灼烧2回合', rarity:'u', cat:'atk', power:2, fx:{dmg:12, status:'burn', statusChance:0.35, statusTurns:2} },
  { id:'dragon_pulse', name:'龙之波动', type:'atk', cost:2, icon:'🐉', desc:'造成16点伤害', rarity:'u', cat:'atk', power:2, fx:{dmg:16} },
  { id:'aura_sphere', name:'波导弹', type:'atk', cost:2, icon:'🌀', desc:'造成14点伤害，无视格挡', rarity:'u', cat:'atk', power:2, fx:{dmg:14, ignoreBlock:true} },
  { id:'dark_pulse', name:'恶之波动', type:'atk', cost:2, icon:'🌑', desc:'造成13点伤害，25%混乱2回合', rarity:'u', cat:'atk', power:2, fx:{dmg:13, status:'confuse', statusChance:0.25, statusTurns:2} },
  { id:'surf', name:'冲浪', type:'atk', cost:2, icon:'🌊', desc:'造成15点伤害', rarity:'u', cat:'atk', power:2, fx:{dmg:15} },
  // --- 超稀有 r (power:3) ---
  { id:'earthquake', name:'地震', type:'atk', cost:2, icon:'🌍', desc:'造成16点伤害', rarity:'r', cat:'atk', power:3, fx:{dmg:16} },
  { id:'close_combat', name:'近身战', type:'atk', cost:2, icon:'🥊', desc:'造成20点伤害，自身-4格挡', rarity:'r', cat:'atk', power:3, fx:{dmg:20, selfBlock:-4} },
  { id:'shadow_ball', name:'暗影球', type:'atk', cost:2, icon:'👻', desc:'造成15点伤害，获得3格挡', rarity:'r', cat:'atk', power:3, fx:{dmg:15, block:3} },
  { id:'fire_blast', name:'大字爆炎', type:'atk', cost:3, icon:'🔥', desc:'造成22点伤害，30%灼烧2回合', rarity:'r', cat:'atk', power:3, fx:{dmg:22, status:'burn', statusChance:0.3, statusTurns:2} },
  { id:'hydro_pump', name:'水炮', type:'atk', cost:3, icon:'💧', desc:'造成22点伤害', rarity:'r', cat:'atk', power:3, fx:{dmg:22} },
  { id:'thunder', name:'打雷', type:'atk', cost:3, icon:'🌩️', desc:'造成21点伤害，30%麻痹2回合', rarity:'r', cat:'atk', power:3, fx:{dmg:21, status:'para', statusChance:0.3, statusTurns:2} },
  { id:'blizzard', name:'暴风雪', type:'atk', cost:3, icon:'❄️', desc:'造成20点伤害，30%冰冻1回合', rarity:'r', cat:'atk', power:3, fx:{dmg:20, status:'freeze', statusChance:0.3, statusTurns:1} },
  { id:'solar_beam', name:'日光束', type:'atk', cost:3, icon:'☀️', desc:'造成25点伤害', rarity:'r', cat:'atk', power:3, fx:{dmg:25} },
  { id:'flare_blitz', name:'闪焰冲锋', type:'atk', cost:2, icon:'🔥', desc:'造成18点伤害，自身-3格挡，20%灼烧', rarity:'r', cat:'atk', power:3, fx:{dmg:18, selfBlock:-3, status:'burn', statusChance:0.2, statusTurns:2} },
  { id:'stone_edge', name:'尖石攻击', type:'atk', cost:2, icon:'🪨', desc:'造成19点伤害', rarity:'r', cat:'atk', power:3, fx:{dmg:19} },
  { id:'draco_meteor', name:'流星群', type:'atk', cost:3, icon:'☄️', desc:'造成26点伤害，自身-5格挡', rarity:'r', cat:'atk', power:3, fx:{dmg:26, selfBlock:-5} },
  { id:'focus_blast', name:'真气弹', type:'atk', cost:3, icon:'💥', desc:'造成23点伤害，敌方下回合伤害-10%', rarity:'r', cat:'atk', power:3, fx:{dmg:23, enemyWeak:0.1} },
  // --- 传说 l (power:4) ---
  { id:'hyper_beam', name:'破坏光线', type:'atk', cost:3, icon:'💥', desc:'造成28点伤害', rarity:'l', cat:'atk', power:4, fx:{dmg:28} },
  { id:'giga_impact', name:'终极冲击', type:'atk', cost:3, icon:'☄️', desc:'造成30点伤害', rarity:'l', cat:'atk', power:4, fx:{dmg:30} },
  { id:'sacred_fire', name:'神圣之火', type:'atk', cost:3, icon:'🔥', desc:'造成26点伤害，50%灼烧3回合', rarity:'l', cat:'atk', power:4, fx:{dmg:26, status:'burn', statusChance:0.5, statusTurns:3} },
  { id:'volt_tackle', name:'伏特攻击', type:'atk', cost:3, icon:'⚡', desc:'造成30点伤害，自身-6格挡，30%麻痹', rarity:'l', cat:'atk', power:4, fx:{dmg:30, selfBlock:-6, status:'para', statusChance:0.3, statusTurns:2} },
  { id:'eruption', name:'喷火', type:'atk', cost:3, icon:'🌋', desc:'造成24-32点伤害（HP越低伤害越低）', rarity:'l', cat:'atk', power:4, fx:{dmg:28} },

  // ══════════════════════════════════════
  // 防御系 def — 基于宝可梦防御技能
  // ══════════════════════════════════════
  // --- 普通 c ---
  { id:'harden', name:'变硬', type:'def', cost:1, icon:'🪨', desc:'获得8点格挡', rarity:'c', cat:'def', power:1, fx:{block:8} },
  { id:'defense_curl', name:'变圆', type:'def', cost:1, icon:'🛡️', desc:'获得10点格挡', rarity:'c', cat:'def', power:1, fx:{block:10} },
  { id:'endure', name:'挺住', type:'def', cost:0, icon:'💪', desc:'获得5点格挡', rarity:'c', cat:'def', power:1, fx:{block:5} },
  { id:'withdraw', name:'缩入壳中', type:'def', cost:1, icon:'🐚', desc:'获得9点格挡', rarity:'c', cat:'def', power:1, fx:{block:9} },
  // --- 稀有 u ---
  { id:'protect', name:'守住', type:'def', cost:2, icon:'🔰', desc:'获得18点格挡', rarity:'u', cat:'def', power:2, fx:{block:18} },
  { id:'reflect', name:'反射壁', type:'def', cost:2, icon:'🪞', desc:'获得12点格挡，本回合受伤-25%', rarity:'u', cat:'def', power:2, fx:{block:12, defMult:0.75} },
  { id:'light_screen', name:'光墙', type:'def', cost:2, icon:'✨', desc:'获得10点格挡，本回合受伤-30%', rarity:'u', cat:'def', power:2, fx:{block:10, defMult:0.7} },
  { id:'amnesia', name:'瞬间失忆', type:'def', cost:1, icon:'😶', desc:'获得6点格挡，本回合受伤-20%', rarity:'u', cat:'def', power:2, fx:{block:6, defMult:0.8} },
  // --- 超稀有 r ---
  { id:'iron_defense', name:'铁壁', type:'def', cost:2, icon:'⛓️', desc:'获得22点格挡', rarity:'r', cat:'def', power:3, fx:{block:22} },
  { id:'barrier', name:'屏障', type:'def', cost:3, icon:'🧱', desc:'获得30点格挡', rarity:'r', cat:'def', power:3, fx:{block:30} },
  { id:'cosmic_power', name:'宇宙力量', type:'def', cost:2, icon:'🌌', desc:'获得14点格挡，抽1张牌', rarity:'r', cat:'def', power:3, fx:{block:14, draw:1} },
  { id:'spiky_shield', name:'尖刺防守', type:'def', cost:2, icon:'🌵', desc:'获得16点格挡，反弹4点伤害', rarity:'r', cat:'def', power:3, fx:{block:16, dmg:4} },
  { id:'baneful_bunker', name:'碉堡', type:'def', cost:2, icon:'🏰', desc:'获得15点格挡，25%中毒2回合', rarity:'r', cat:'def', power:3, fx:{block:15, status:'poison', statusChance:0.25, statusTurns:2} },
  // --- 传说 l ---
  { id:'king_shield', name:'王者盾牌', type:'def', cost:3, icon:'👑', desc:'获得35点格挡，下回合受伤减半', rarity:'l', cat:'def', power:4, fx:{block:35, defMult:0.5} },
  { id:'crafty_shield', name:'诡异之盾', type:'def', cost:2, icon:'🪬', desc:'获得20点格挡，抽1张牌', rarity:'l', cat:'def', power:4, fx:{block:20, draw:1} },

  // ══════════════════════════════════════
  // 恢复系 heal — 基于宝可梦回复技能
  // ══════════════════════════════════════
  // --- 普通 c ---
  { id:'recover', name:'自我再生', type:'heal', cost:1, icon:'💚', desc:'回复12点HP', rarity:'c', cat:'heal', power:1, fx:{healFlat:12} },
  { id:'roost', name:'羽栖', type:'heal', cost:1, icon:'🪶', desc:'回复 maxHP 的 20%', rarity:'c', cat:'heal', power:1, fx:{healPct:0.2} },
  { id:'life_dew', name:'生命水滴', type:'heal', cost:1, icon:'💧', desc:'回复10HP并获得3格挡', rarity:'c', cat:'heal', power:1, fx:{healFlat:10, block:3} },
  // --- 稀有 u ---
  { id:'synthesis', name:'光合作用', type:'heal', cost:1, icon:'🌿', desc:'回复 maxHP 的 25%', rarity:'u', cat:'heal', power:2, fx:{healPct:0.25} },
  { id:'softboiled', name:'生蛋', type:'heal', cost:2, icon:'🥚', desc:'回复 maxHP 的 35%', rarity:'u', cat:'heal', power:2, fx:{healPct:0.35} },
  { id:'giga_drain', name:'终极吸取', type:'heal', cost:2, icon:'🧛', desc:'造成8点伤害并回复等量HP', rarity:'u', cat:'heal', power:2, fx:{dmg:8, lifesteal:1} },
  { id:'draining_kiss', name:'吸取之吻', type:'heal', cost:1, icon:'💋', desc:'造成5点伤害，回复伤害值75%的HP', rarity:'u', cat:'heal', power:2, fx:{dmg:5, lifesteal:0.75} },
  { id:'aqua_ring', name:'水流环', type:'heal', cost:1, icon:'💍', desc:'回复8HP，敌方-5%伤害', rarity:'u', cat:'heal', power:2, fx:{healFlat:8, enemyWeak:0.05} },
  // --- 超稀有 r ---
  { id:'wish', name:'祈愿', type:'heal', cost:1, icon:'🌟', desc:'回复15HP并获得4格挡', rarity:'r', cat:'heal', power:3, fx:{healFlat:15, block:4} },
  { id:'moonlight', name:'月光', type:'heal', cost:2, icon:'🌙', desc:'回复 maxHP 的 40%', rarity:'r', cat:'heal', power:3, fx:{healPct:0.4} },
  { id:'pain_split', name:'分担痛楚', type:'heal', cost:2, icon:'🔄', desc:'回复18HP，敌方受到6点伤害', rarity:'r', cat:'heal', power:3, fx:{healFlat:18, dmg:6} },
  { id:'milk_drink', name:'喝牛奶', type:'heal', cost:2, icon:'🥛', desc:'回复 maxHP 的 35%，获得5格挡', rarity:'r', cat:'heal', power:3, fx:{healPct:0.35, block:5} },
  // --- 传说 l ---
  { id:'healing_wish', name:'治愈之愿', type:'heal', cost:3, icon:'💖', desc:'回复 maxHP 的 55%', rarity:'l', cat:'heal', power:4, fx:{healPct:0.55} },
  { id:'lunar_blessing', name:'月之祝福', type:'heal', cost:3, icon:'🌝', desc:'回复 maxHP 的 45%，获得10格挡', rarity:'l', cat:'heal', power:4, fx:{healPct:0.45, block:10} },

  // ══════════════════════════════════════
  // 控制系 control — 基于宝可梦强化技能
  // ══════════════════════════════════════
  // --- 普通 c ---
  { id:'agility', name:'高速移动', type:'control', cost:1, icon:'🏃', desc:'获得2点能量', rarity:'c', cat:'control', power:1, fx:{energy:2} },
  { id:'focus_energy', name:'聚气', type:'control', cost:1, icon:'🎯', desc:'本回合伤害×1.4', rarity:'c', cat:'control', power:1, fx:{mult:1.4} },
  { id:'work_up', name:'自我激励', type:'control', cost:1, icon:'📈', desc:'伤害×1.25，获得1能量', rarity:'c', cat:'control', power:1, fx:{mult:1.25, energy:1} },
  // --- 稀有 u ---
  { id:'swords_dance', name:'剑舞', type:'control', cost:1, icon:'🗡️', desc:'本回合伤害×1.8', rarity:'u', cat:'control', power:2, fx:{mult:1.8} },
  { id:'nasty_plot', name:'诡计', type:'control', cost:2, icon:'😈', desc:'本回合伤害×2.2', rarity:'u', cat:'control', power:2, fx:{mult:2.2} },
  { id:'calm_mind', name:'冥想', type:'control', cost:1, icon:'🧘', desc:'获得8格挡，伤害×1.3', rarity:'u', cat:'control', power:2, fx:{block:8, mult:1.3} },
  { id:'bulk_up', name:'健美', type:'control', cost:1, icon:'💪', desc:'获得10格挡，伤害×1.25', rarity:'u', cat:'control', power:2, fx:{block:10, mult:1.25} },
  { id:'growth', name:'生长', type:'control', cost:0, icon:'🌱', desc:'本回合伤害×1.3（0费）', rarity:'u', cat:'control', power:2, fx:{mult:1.3} },
  // --- 超稀有 r ---
  { id:'dragon_dance', name:'龙之舞', type:'control', cost:2, icon:'🐉', desc:'伤害×1.6，获得1能量', rarity:'r', cat:'control', power:3, fx:{mult:1.6, energy:1} },
  { id:'tailwind', name:'顺风', type:'control', cost:0, icon:'🌪️', desc:'获得1能量并抽1张', rarity:'r', cat:'control', power:3, fx:{energy:1, draw:1} },
  { id:'coil', name:'盘蜷', type:'control', cost:1, icon:'🐍', desc:'获得10格挡，伤害×1.35', rarity:'r', cat:'control', power:3, fx:{block:10, mult:1.35} },
  { id:'shell_smash', name:'破壳', type:'control', cost:2, icon:'🥚', desc:'伤害×2.2，但自身-8格挡', rarity:'r', cat:'control', power:3, fx:{mult:2.2, selfBlock:-8} },
  // --- 传说 l ---
  { id:'quiver_dance', name:'蝶舞', type:'control', cost:2, icon:'🦋', desc:'伤害×2，获得6格挡', rarity:'l', cat:'control', power:4, fx:{mult:2, block:6} },
  { id:'geomancy', name:'大地掌控', type:'control', cost:3, icon:'✨', desc:'伤害×2.5，获得8格挡，获得1能量', rarity:'l', cat:'control', power:4, fx:{mult:2.5, block:8, energy:1} },
  { id:'baton_pass', name:'接棒', type:'control', cost:1, icon:'🏏', desc:'获得2能量并抽2张牌', rarity:'l', cat:'control', power:4, fx:{energy:2, draw:2} },

  // ══════════════════════════════════════
  // 异常系 status — 基于宝可梦状态技能
  // ══════════════════════════════════════
  // --- 普通 c ---
  { id:'thunder_wave', name:'电磁波', type:'status', cost:1, icon:'⚡', desc:'麻痹：敌下2回合伤害-40%', rarity:'c', cat:'status', power:1, fx:{status:'para', statusTurns:2} },
  { id:'will_o_wisp', name:'鬼火', type:'status', cost:1, icon:'👻', desc:'灼烧：敌每回合结束受4伤，2回合', rarity:'c', cat:'status', power:1, fx:{status:'burn', statusTurns:2} },
  { id:'stun_spore', name:'麻痹粉', type:'status', cost:1, icon:'🌼', desc:'麻痹2回合并造成3点伤害', rarity:'c', cat:'status', power:1, fx:{dmg:3, status:'para', statusTurns:2} },
  { id:'poison_powder', name:'毒粉', type:'status', cost:1, icon:'☠️', desc:'中毒：敌每回合结束受4伤，3回合', rarity:'c', cat:'status', power:1, fx:{status:'poison', statusTurns:3} },
  // --- 稀有 u ---
  { id:'toxic', name:'剧毒', type:'status', cost:1, icon:'☠️', desc:'中毒：敌每回合结束受6伤，3回合', rarity:'u', cat:'status', power:2, fx:{status:'poison', statusTurns:3} },
  { id:'sleep_powder', name:'催眠粉', type:'status', cost:2, icon:'💤', desc:'催眠：敌跳过下1次攻击', rarity:'u', cat:'status', power:2, fx:{status:'sleep', statusTurns:1} },
  { id:'confuse_ray', name:'奇异之光', type:'status', cost:1, icon:'💫', desc:'混乱：敌下回合50%自伤', rarity:'u', cat:'status', power:2, fx:{status:'confuse', statusTurns:2} },
  { id:'yawn', name:'哈欠', type:'status', cost:1, icon:'🥱', desc:'催眠：敌方下回合结束后入睡1回合', rarity:'u', cat:'status', power:2, fx:{status:'sleep', statusTurns:1} },
  { id:'charm', name:'撒娇', type:'status', cost:1, icon:'😘', desc:'敌方下回合伤害-30%并造成4点伤害', rarity:'u', cat:'status', power:2, fx:{dmg:4, enemyWeak:0.3} },
  // --- 超稀有 r ---
  { id:'spore', name:'蘑菇孢子', type:'status', cost:2, icon:'🍄', desc:'强力催眠：敌跳过下2次攻击', rarity:'r', cat:'status', power:3, fx:{status:'sleep', statusTurns:2} },
  { id:'glare', name:'大蛇瞪眼', type:'status', cost:1, icon:'👀', desc:'麻痹3回合', rarity:'r', cat:'status', power:3, fx:{status:'para', statusTurns:3} },
  { id:'leech_seed', name:'寄生种子', type:'status', cost:2, icon:'🌱', desc:'寄生：造成5伤，中毒3回合（每回合6伤）', rarity:'r', cat:'status', power:3, fx:{dmg:5, status:'poison', statusTurns:3} },
  { id:'destiny_bond', name:'同命', type:'status', cost:2, icon:'🔗', desc:'敌方受到10点伤害，自身-5HP', rarity:'r', cat:'status', power:3, fx:{dmg:10, selfDmg:5} },
  { id:'scary_face', name:'鬼面', type:'status', cost:1, icon:'👹', desc:'敌方下回合伤害-35%，获得4格挡', rarity:'r', cat:'status', power:3, fx:{enemyWeak:0.35, block:4} },
  // --- 传说 l ---
  { id:'dark_void', name:'暗黑洞', type:'status', cost:3, icon:'🕳️', desc:'睡眠2回合+造成8伤害', rarity:'l', cat:'status', power:4, fx:{dmg:8, status:'sleep', statusTurns:2} },
  { id:'hypnosis', name:'催眠术', type:'status', cost:1, icon:'🌀', desc:'催眠2回合', rarity:'l', cat:'status', power:4, fx:{status:'sleep', statusTurns:2} },
  { id:'sheer_cold', name:'绝对零度', type:'status', cost:3, icon:'❄️', desc:'造成20点伤害，100%冰冻2回合', rarity:'l', cat:'status', power:4, fx:{dmg:20, status:'freeze', statusTurns:2} },
];

const STARTER_CARD_IDS = ['tackle', 'harden', 'recover', 'agility', 'thunder_wave'];

function getPlayerAtk() {
  return 1 + (GS.metaAtkLv || 0) * ATK_PER_LEVEL;
}

function getMaxHpFromMeta() {
  return STARTING_HP + (GS.metaHpLv || 0) * HP_PER_LEVEL;
}

function upgradeCost(level) {
  // level = 当前等级，升到 level+1 的费用
  return UPGRADE_BASE_COST + level * UPGRADE_COST_STEP;
}

function applyCardFx(card) {
  const fx = card.fx || {};
  const atk = getPlayerAtk();
  let totalDmg = 0;

  // damage
  if (fx.dmg) {
    const hits = fx.hits || 1;
    for (let h = 0; h < hits; h++) {
      let d = fx.dmg + atk; // 全局攻击力加在技能基础伤害上
      if (fx.pierce) {
        // 部分无视格挡：先按穿透比例直伤，剩余走正常
        const direct = Math.floor(d * fx.pierce);
        const rest = d - direct;
        if (direct > 0) dealEnemyDamage(direct, true);
        if (rest > 0) dealEnemyDamage(rest, false);
        totalDmg += d;
      } else {
        dealEnemyDamage(d, !!fx.ignoreBlock);
        totalDmg += d;
      }
    }
  }

  if (fx.selfBlock) {
    GS.block = Math.max(0, GS.block + fx.selfBlock);
  }
  if (fx.block) GS.block += fx.block;

  // selfDmg: 自身受到直接伤害（无视格挡）
  if (fx.selfDmg) {
    GS.hp = Math.max(0, GS.hp - fx.selfDmg);
    notify('自身受到 ' + fx.selfDmg + ' 伤害', 'var(--red)');
    updateHeaderUI();
    updateBattleUI();
    if (GS.hp <= 0) {
      updateHeaderUI();
    }
  }

  if (fx.healFlat) {
    const before = GS.hp;
    GS.hp = Math.min(GS.maxHp, GS.hp + fx.healFlat);
    if (GS.hp > before) notify('+' + (GS.hp - before) + ' HP', 'var(--green)');
  }
  if (fx.healPct) {
    const amt = Math.floor(GS.maxHp * fx.healPct);
    const before = GS.hp;
    GS.hp = Math.min(GS.maxHp, GS.hp + amt);
    if (GS.hp > before) notify('+' + (GS.hp - before) + ' HP', 'var(--green)');
  }
  if (fx.lifesteal && totalDmg > 0) {
    const heal = Math.floor(totalDmg * fx.lifesteal);
    GS.hp = Math.min(GS.maxHp, GS.hp + heal);
  }

  if (fx.energy) GS.energy += fx.energy;
  if (fx.mult) GS.playerDmgMult *= fx.mult;
  if (fx.defMult) GS.playerDefMult *= fx.defMult;
  if (fx.enemyWeak) {
    GS.enemyAtkMult = (GS.enemyAtkMult || 1) * (1 - fx.enemyWeak);
  }

  if (fx.status) {
    const chance = fx.statusChance == null ? 1 : fx.statusChance;
    if (Math.random() < chance) {
      GS.enemyStatus = { type: fx.status, turns: fx.statusTurns || 1 };
      const names = { burn:'灼烧', para:'麻痹', poison:'中毒', sleep:'催眠', freeze:'冰冻', confuse:'混乱' };
      notify((names[fx.status] || fx.status) + '！', 'var(--purple)');
    }
  }

  if (fx.draw) drawCards(fx.draw);

  updateHeaderUI();
  updateBattleUI();
}


// ============================================================

// SECTION 4: STARTER DECK
// ============================================================
function getStarterDeck() {
  // 初始五类基础技各 1 张，凑够 DECK_MAX 用撞击补足
  const ids = STARTER_CARD_IDS.slice();
  while (ids.length < Math.min(5, DECK_MAX)) ids.push('tackle');
  return ids.map(id => findCard(id)).filter(Boolean);
}

function getOwnedCardIds() {
  return GS.ownedCards && typeof GS.ownedCards === 'object'
    ? Object.keys(GS.ownedCards).filter(id => GS.ownedCards[id])
    : STARTER_CARD_IDS.slice();
}

function ensureMetaDefaults() {
  if (typeof GS.metaGold !== 'number') GS.metaGold = 0;
  if (typeof GS.metaHpLv !== 'number') GS.metaHpLv = 0;
  if (typeof GS.metaAtkLv !== 'number') GS.metaAtkLv = 0;
  if (!GS.ownedCards || typeof GS.ownedCards !== 'object') {
    GS.ownedCards = {};
    STARTER_CARD_IDS.forEach(id => { GS.ownedCards[id] = true; });
  }
  STARTER_CARD_IDS.forEach(id => { GS.ownedCards[id] = true; });
  if (!Array.isArray(GS.builtDeckIds) || GS.builtDeckIds.length === 0) {
    GS.builtDeckIds = STARTER_CARD_IDS.slice();
  }
  // 清理失效 id
  GS.builtDeckIds = GS.builtDeckIds.filter(id => ALL_CARDS.some(c => c.id === id)).slice(0, DECK_MAX);
  if (GS.builtDeckIds.length === 0) GS.builtDeckIds = STARTER_CARD_IDS.slice();
}

function deckFromBuilt() {
  ensureMetaDefaults();
  let ids = GS.builtDeckIds.filter(id => GS.ownedCards[id]);
  if (ids.length === 0) ids = STARTER_CARD_IDS.slice();
  // 运行中牌组：按构建列表各 1 张；不足 5 张时用基础技填充到 5，便于开局
  while (ids.length < 5) {
    for (const sid of STARTER_CARD_IDS) {
      if (ids.length >= 5) break;
      ids.push(sid);
    }
  }
  return ids.map(id => findCard(id)).filter(Boolean);
}

function grantMetaGold(amount) {
  if (!amount || amount <= 0) return;
  ensureMetaDefaults();
  GS.metaGold += amount;
  saveMeta();
}


function findCard(id) {
  const c = ALL_CARDS.find(x => x.id === id);
  return c ? { ...c } : null;
}

/** 把存档/浅拷贝后的卡牌重新挂上 effect，并清掉残留 _played */
function hydrateCard(card) {
  if (!card) return null;
  const id = card.id || card.cardId;
  const base = id ? ALL_CARDS.find(x => x.id === id) : null;
  if (base) {
    const out = {
      ...base,
      upgraded: !!card.upgraded,
      _played: false,
    };
    // 统一挂 effect，内部走 fx
    out.effect = function() { applyCardFx(out); };
    return out;
  }
  return {
    id: id || 'unknown',
    name: card.name || '未知卡牌',
    type: card.type || 'atk',
    cost: typeof card.cost === 'number' ? card.cost : 0,
    icon: card.icon || '❓',
    desc: card.desc || '',
    rarity: card.rarity || 'c',
    fx: card.fx || { dmg: 4 },
    effect() { applyCardFx(this); },
    _played: false,
  };
}

function hydrateCardList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(hydrateCard).filter(Boolean);
}

// ============================================================

// SECTION 10: CARDS / DECK SYSTEM
// ============================================================
function shuffleDeck() {
  GS.drawPile = shuffle([...GS.deck]);
  GS.discardPile = [];
}

function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (GS.drawPile.length === 0) {
      if (GS.discardPile.length === 0) break;
      GS.drawPile = shuffle(hydrateCardList(GS.discardPile));
      GS.discardPile = [];
    }
    if (GS.drawPile.length > 0) {
      GS.hand.push(hydrateCard(GS.drawPile.pop()));
    }
  }
  renderHand();
}

function startTurn() {
  // Reset for new turn
  GS.turnPhase = 'question';
  GS.turnCorrect = 0;
  GS.energy = 0;
  GS.block = 0;
  GS.cardPlayedThisTurn = false;
  GS.questionAnswered = false;
  GS.playerDmgMult = 1;
  GS.playerDefMult = 1;
  GS.enemyBlock = 0;
  GS.captureBonus = 0;

  // Discard any cards remaining from previous turn
  if (GS.hand.length > 0) {
    GS.discardPile = [...GS.discardPile, ...GS.hand];
    GS.hand = [];
  }

  // Set enemy intent
  GS.enemyIntent = {
    damage: GS.enemyBaseDamage + rand(-2, 3),
    type: 'attack',
  };
  $('enemy-intent').textContent = `敌方意图: 攻击 ${GS.enemyIntent.damage} 伤害`;

  // Update UI for question phase
  $('hand-area').innerHTML = '<div style="color:var(--text2);font-size:10px;text-align:center;width:100%;padding:12px">📝 答对获取能量 | 答错或点击按钮进入出牌阶段</div>';
  $('btn-end-turn').style.display = 'inline-block';
  $('battle-combo').textContent = '';
  updateEnergyUI();

  // Start question chain
  nextBattleQuestion();
}

// Called when player answers wrong → switch to card phase
function enterCardPhase() {
  GS.turnPhase = 'card';
  GS.energy = GS.turnCorrect; // Energy = number of correct answers
  GS.questionAnswered = true; // block further answers

  // 确保牌组/牌堆带有 effect
  GS.deck = hydrateCardList(GS.deck);
  GS.drawPile = hydrateCardList(GS.drawPile || []);
  GS.discardPile = hydrateCardList(GS.discardPile || []);

  // Draw cards
  if (GS.drawPile.length === 0) GS.drawPile = shuffle(hydrateCardList(GS.deck));
  drawCards(HAND_DRAW);

  // Update UI
  renderHand();
  updateEnergyUI();
  $('btn-end-turn').style.display = 'inline-block';
  $('btn-end-turn').disabled = false;
  $('battle-q-area').style.opacity = '0.4';
  $('enemy-intent').textContent = `⚡ ${GS.energy} 能量 — 打出卡牌后结束回合`;

  if (GS.turnCorrect > 0) {
    notify(`⚡ 获得 ${GS.turnCorrect} 点能量！`, 'var(--cyan)');
  }
}

function endTurn() {
  if (GS.turnPhase === 'question') {
    // 未进入出牌阶段就结束：能量=答对题数
    GS.energy = GS.turnCorrect;
  }

  // 泄能：剩余能量 × 攻击力 结算伤害后清空
  if (GS.energy > 0 && GS.enemyHp > 0 && GS.inBattle) {
    const dump = GS.energy * getPlayerAtk();
    if (dump > 0) {
      dealEnemyDamage(dump);
      notify(`⚡ 泄能 ${GS.energy}×${getPlayerAtk()} = ${dump} 伤害`, 'var(--cyan)');
    }
    GS.energy = 0;
    updateEnergyUI();
    if (GS.enemyHp <= 0) {
      GS.discardPile = [...GS.discardPile, ...GS.hand];
      GS.hand = [];
      endBattle(true);
      return;
    }
  }

  // Clear hand
  GS.discardPile = [...GS.discardPile, ...GS.hand.filter(c => !c._played)];
  GS.hand = [];

  // 异常状态回合结算（灼烧/中毒）
  if (GS.enemyStatus && GS.enemyHp > 0) {
    const st = GS.enemyStatus;
    if (st.type === 'burn') {
      dealEnemyDamage(4, true);
      notify('灼烧 -4', 'var(--orange)');
    } else if (st.type === 'poison') {
      dealEnemyDamage(6, true);
      notify('中毒 -6', 'var(--purple)');
    }
    st.turns -= 1;
    if (st.turns <= 0) GS.enemyStatus = null;
    if (GS.enemyHp <= 0) {
      endBattle(true);
      return;
    }
  }

  // Enemy attacks
  if (GS.enemyPkm && GS.enemyHp > 0 && GS.enemyIntent) {
    // sleep: skip attack
    if (GS.enemyStatus && GS.enemyStatus.type === 'sleep') {
      notify('敌方睡着了…', 'var(--dim)');
      GS.enemyStatus.turns -= 1;
      if (GS.enemyStatus.turns <= 0) GS.enemyStatus = null;
    } else if (GS.enemyStatus && GS.enemyStatus.type === 'confuse' && Math.random() < 0.5) {
      const selfDmg = Math.floor((GS.enemyIntent.damage || GS.enemyBaseDamage) * 0.5);
      dealEnemyDamage(selfDmg, true);
      notify(`敌方混乱自伤 - ${selfDmg}`, 'var(--purple)');
      if (GS.enemyHp <= 0) { endBattle(true); return; }
    } else {
      let dmg = Math.floor((GS.enemyIntent.damage || GS.enemyBaseDamage) * GS.playerDefMult * (GS.enemyAtkMult || 1));
      if (GS.enemyStatus && GS.enemyStatus.type === 'para') {
        dmg = Math.floor(dmg * 0.6);
      }
      if (GS.enemyStatus && GS.enemyStatus.type === 'freeze') {
        notify('敌方被冰冻，无法行动！', 'var(--cyan)');
        GS.enemyStatus.turns -= 1;
        if (GS.enemyStatus.turns <= 0) GS.enemyStatus = null;
      } else {
        damagePlayer(dmg);
        if (GS.hp > 0) notify(`敌方攻击！ -${dmg}`, 'var(--red)');
        sfxDamage();
        screenshake();
      }
    }
  }

  GS.block = Math.max(0, GS.block);
  GS.playerDmgMult = 1;
  GS.playerDefMult = 1;
  GS.enemyAtkMult = 1;

  // Reset question area
  $('battle-q-area').style.opacity = '1';
  $('btn-end-turn').style.display = 'inline-block';
  $('btn-end-turn').textContent = '⏹ 停止答题';

  if (GS.hp <= 0) return;
  startTurn();
}

function playCard(card, idx) {
  // Can only play cards during card phase
  if (GS.turnPhase !== 'card') return;
  if (!GS.hand || idx < 0 || idx >= GS.hand.length) return;

  // 出牌前重新水合，修复存档丢失 effect / 残留 _played
  const live = hydrateCard(GS.hand[idx] || card);
  if (!live) return;
  GS.hand[idx] = live;
  card = live;

  if (typeof card.cost !== 'number') card.cost = 0;
  if (GS.energy < card.cost) {
    notify('能量不足', 'var(--red)');
    return;
  }
  if (card._played) return;
  if (typeof card.effect !== 'function') {
    // 再试一次挂 effect
    const fixed = hydrateCard(card);
    if (!fixed || typeof fixed.effect !== 'function') {
      notify('这张牌损坏了，已移出', 'var(--red)');
      GS.hand.splice(idx, 1);
      renderHand();
      updateEnergyUI();
      return;
    }
    GS.hand[idx] = fixed;
    card = fixed;
  }

  // 先扣能量并执行效果；成功后再离手
  GS.energy -= card.cost;
  GS.cardPlayedThisTurn = true;

  sfxCard();
  try {
    if (typeof card.effect === 'function' && !card.fx) {
      card.effect();
    } else {
      applyCardFx(card);
    }
  } catch (err) {
    console.error('card effect failed', card && card.id, err);
    GS.energy += card.cost;
    notify('卡牌效果失败，请重试', 'var(--red)');
    renderHand();
    updateEnergyUI();
    return;
  }

  // Visual effect based on card type
  try { showCardEffect(card); } catch (e) {}

  // Move to discard（不要先标 _played 再留在手牌里）
  const played = hydrateCard(card);
  if (played) played._played = false;
  GS.discardPile.push(played || card);
  GS.hand.splice(idx, 1);

  renderHand();
  updateEnergyUI();
  updateBattleUI();

  if (GS.enemyHp <= 0) {
    endBattle(true);
  }
  if (GS.hp <= 0) {
    endBattle(false);
    gameOverDefeat();
  }
}

function showCardEffect(card) {
  const overlay = $('battle-overlay');
  if (!overlay) return;

  switch (card.type) {
    case 'atk': {
      // Enemy sprite flashes red + shake
      const enemy = $('enemy-sprite');
      enemy.style.filter = 'brightness(2) drop-shadow(0 0 20px #ff5252)';
      enemy.classList.add('card-shake');
      setTimeout(() => { enemy.style.filter = ''; enemy.classList.remove('card-shake'); }, 400);
      // Red border flash
      overlay.style.boxShadow = 'inset 0 0 80px rgba(255,82,82,0.5), inset 0 0 0 3px rgba(255,82,82,0.6)';
      setTimeout(() => overlay.style.boxShadow = '', 300);
      showCardPopup('⚔️ ' + card.name, '#ff5252');
      break;
    }
    case 'def': {
      // Player sprite blue glow
      const player = $('player-pkm-sprite');
      player.style.filter = 'drop-shadow(0 0 18px #448aff) brightness(1.3)';
      setTimeout(() => player.style.filter = '', 400);
      // Blue border
      overlay.style.boxShadow = 'inset 0 0 60px rgba(68,138,255,0.4), inset 0 0 0 3px rgba(68,138,255,0.5)';
      setTimeout(() => overlay.style.boxShadow = '', 350);
      showCardPopup('🛡️ ' + card.name, '#448aff');
      break;
    }
    case 'heal': {
      const player = $('player-pkm-sprite');
      if (player) {
        player.style.filter = 'drop-shadow(0 0 18px #00ff88) brightness(1.3)';
        setTimeout(() => player.style.filter = '', 400);
      }
      showCardPopup('💚 ' + card.name, '#00ff88');
      break;
    }
    case 'control': {
      showCardPopup('🎯 ' + card.name, '#8844ff');
      break;
    }
    case 'status': {
      showCardPopup('☠️ ' + card.name, '#e040fb');
      break;
    }
    case 'skill': {
      // Both sprites flash green + shake
      const enemy = $('enemy-sprite');
      const player = $('player-pkm-sprite');
      enemy.style.filter = 'brightness(1.5) drop-shadow(0 0 16px #69f0ae)';
      player.style.filter = 'brightness(1.5) drop-shadow(0 0 16px #69f0ae)';
      enemy.classList.add('card-shake');
      player.classList.add('card-shake');
      setTimeout(() => {
        enemy.style.filter = ''; player.style.filter = '';
        enemy.classList.remove('card-shake'); player.classList.remove('card-shake');
      }, 400);
      overlay.style.boxShadow = 'inset 0 0 70px rgba(105,240,174,0.4), inset 0 0 0 3px rgba(105,240,174,0.5)';
      setTimeout(() => overlay.style.boxShadow = '', 350);
      showCardPopup('✨ ' + card.name, '#69f0ae');
      break;
    }
    case 'item': {
      // Gold flash on whole arena
      overlay.style.boxShadow = 'inset 0 0 60px rgba(255,215,64,0.5), inset 0 0 0 3px rgba(255,215,64,0.7)';
      setTimeout(() => overlay.style.boxShadow = '', 350);
      // Brief gold tint on player
      $('player-pkm-sprite').style.filter = 'brightness(1.4) sepia(0.6)';
      setTimeout(() => $('player-pkm-sprite').style.filter = '', 350);
      showCardPopup('🎒 ' + card.name, '#ffd740');
      break;
    }
  }
}

function showCardPopup(text, color) {
  const overlay = $('battle-overlay');
  if (!overlay) return;
  const el = document.createElement('div');
  el.className = 'card-popup';
  el.textContent = text;
  el.style.cssText = `
    position:absolute;z-index:50;top:40%;left:50%;
    transform:translate(-50%,-50%);
    font-size:24px;font-weight:900;color:${color};
    pointer-events:none;
    text-shadow:0 0 20px ${color}, 0 2px 4px rgba(0,0,0,0.8);
    animation:cardPopIn 0.8s ease-out forwards;
  `;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function renderHand() {
  const container = $('hand-area');
  if (!container) return;
  container.innerHTML = '';

  // 渲染前整体水合，避免残缺卡牌
  if (Array.isArray(GS.hand)) {
    GS.hand = hydrateCardList(GS.hand);
  } else {
    GS.hand = [];
  }

  GS.hand.forEach((card, i) => {
    const el = document.createElement('div');
    const type = card.type || 'item';
    const cost = typeof card.cost === 'number' ? card.cost : 0;
    const unaffordable = GS.turnPhase === 'card' && GS.energy < cost;
    el.className = 'hand-card type-' + type + (card._played ? ' played' : '') + (unaffordable ? ' unaffordable' : '');
    el.innerHTML =
      '<div class="card-cost">' + cost + '</div>' +
      '<div class="card-icon">' + (card.icon || '❓') + '</div>' +
      '<div class="card-name">' + (card.name || '?') + '</div>' +
      '<div class="card-desc">' + (card.desc || '') + '</div>';
    el.onclick = () => {
      // 始终用当前下标对应的手牌，避免闭包拿到旧对象
      playCard(GS.hand[i], i);
    };
    container.appendChild(el);
  });
}

function updateEnergyUI() {
  $('energy-current').textContent = GS.energy;
  $('energy-max').textContent = '';
  // Dynamic orbs: show up to current energy (max 12 visible)
  const showOrbs = Math.min(GS.energy, 12);
  let orbs = '';
  for (let i = 0; i < showOrbs; i++) {
    orbs += '<span class="energy-orb"></span>';
  }
  if (GS.energy > 12) orbs += `<span style="font-size:8px;color:var(--cyan)">+${GS.energy - 12}</span>`;
  $('energy-orbs').innerHTML = orbs;
  // Button always available — acts as "stop chain" in question phase or "end turn" in card phase
  $('btn-end-turn').disabled = false;
  if (GS.turnPhase === 'question') {
    $('btn-end-turn').textContent = '⏹ 停止答题';
  } else {
    $('btn-end-turn').textContent = '▶ 结束回合';
  }
}

function renderDeckPanel() {
  const list = $('deck-card-list');
  if (!list) return;
  list.innerHTML = '';
  $('deck-count').textContent = GS.deck.length;

  const sorted = [...GS.deck].sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  sorted.forEach(card => {
    const el = document.createElement('div');
    el.className = `deck-mini-card type-${card.type}`;
    el.innerHTML = `<div>${card.icon}</div><div>${card.name}</div>`;
    list.appendChild(el);
  });
}

// ============================================================

// SECTION 11: BATTLE SYSTEM
// ============================================================
function startBattle(node, isBoss = false) {
  GS.inBattle = true;
  GS.combo = 0;
  GS.block = 0;
  GS.playerDmgMult = 1;
  GS.playerDefMult = 1;
  GS.captureBonus = 0;
  GS.turnPhase = 'question';
  GS.turnCorrect = 0;
  GS.energy = 0;
  GS.hand = [];

  const pkm = node.enemyPkm;
  const stats = getEnemyStats(pkm);
  GS.enemyPkm = pkm;
  GS.enemyMaxHp = isBoss ? Math.floor(stats.hp * 1.5) : stats.hp;
  GS.enemyHp = GS.enemyMaxHp;
  GS.enemyBlock = 0;
  GS.enemyBaseDamage = stats.dmg;
  GS.enemyCaptureRate = stats.captureRate;
  GS.currentMapNode = node;

  // Show battle overlay
  $('battle-overlay').classList.add('active');
  $('battle-q-area').style.opacity = '1';
  $('enemy-name-inline').textContent = `${isBoss ? '👑 ' : ''}${getPkmName(pkm.id)} ${isBoss ? '(BOSS)' : ''}`;
  $('enemy-sprite').src = getPkmSprite(pkm.id);
  $('enemy-sprite').style.display = getPkmSprite(pkm.id) ? 'block' : 'none';
  const fb = $('enemy-sprite-fb');
  if (!getPkmSprite(pkm.id)) {
    fb.style.display = 'flex';
    fb.textContent = '👾';
  } else {
    fb.style.display = 'none';
  }
  $('enemy-intent').textContent = '准备攻击...';
  $('btn-end-turn').style.display = 'inline-block';
  updateBattleUI();
  updatePlayerPkmDisplay();

  // Show map controls
  $('btn-deck-toggle').style.display = 'block';

  GS.drawPile = shuffle([...GS.deck]);
  GS.discardPile = [];

  startTurn();
}

function updatePlayerPkmDisplay() {
  const activeId = GS.team.length > 0 ? GS.team[0] : 25;
  const pkm = getPkmById(activeId);
  const sprite = getPkmSprite(activeId);
  const name = pkm ? pkm.c : '皮卡丘';

  const img = $('player-pkm-sprite');
  const fb = $('player-pkm-fallback');
  if (sprite) {
    img.src = sprite;
    img.style.display = 'block';
    fb.style.display = 'none';
  } else {
    img.style.display = 'none';
    fb.style.display = 'flex';
    fb.style.alignItems = 'center';
    fb.style.justifyContent = 'center';
    fb.textContent = '👾';
  }
  $('player-pkm-name').textContent = name;
  $('battle-energy-display').textContent = GS.energy;
}

function updateBattleUI() {
  $('enemy-hp-text').textContent = `HP: ${Math.max(0,Math.ceil(GS.enemyHp))}/${GS.enemyMaxHp}`;
  $('enemy-hp-fill').style.width = Math.max(0, (GS.enemyHp / GS.enemyMaxHp) * 100) + '%';
  $('battle-player-hp').textContent = Math.ceil(GS.hp);
  $('battle-block').textContent = GS.block;
  $('battle-combo').textContent = GS.combo > 1 ? `🔥 x${GS.combo}` : '';
  $('battle-energy-display').textContent = GS.energy;

  if (GS.combo >= 3) $('battle-combo').classList.add('pulse');
  else $('battle-combo').classList.remove('pulse');
}

function dealEnemyDamage(amount, ignoreBlock = false) {
  let actual = amount * GS.playerDmgMult;
  actual = Math.floor(actual);

  if (!ignoreBlock && GS.enemyBlock > 0) {
    const blocked = Math.min(GS.enemyBlock, actual);
    GS.enemyBlock -= blocked;
    actual -= blocked;
    if (blocked > 0) showDamageNumber(rand(80,180), rand(30,100), `🛡️${blocked}`, '');
  }

  GS.enemyHp -= actual;
  if (GS.enemyHp < 0) GS.enemyHp = 0;

  // Damage number
  showDamageNumber(
    rand(100, 200),
    rand(40, 120),
    `-${actual}`,
    'atk'
  );

  // Particles for big hits
  const arena = $('battle-arena');
  if (arena) {
    const rect = arena.getBoundingClientRect();
    const count = actual > 15 ? 15 : actual > 8 ? 10 : 5;
    spawnParticles(rect.left + rand(80,200), rect.top + rand(50,150), count, '#00e676');
    if (actual > 10) spawnParticles(rect.left + rand(80,200), rect.top + rand(50,150), 5, '#ffd740');
  }

  // Screen flash for massive damage
  if (actual > 20) {
    $('battle-overlay').style.boxShadow = 'inset 0 0 60px rgba(255,215,64,0.3)';
    setTimeout(() => $('battle-overlay').style.boxShadow = '', 200);
  }

  updateBattleUI();
}

function damagePlayer(amount) {
  let actual = amount;
  if (GS.block > 0) {
    const blocked = Math.min(GS.block, actual);
    GS.block -= blocked;
    actual -= blocked;
  }
  GS.hp = Math.max(0, GS.hp - Math.floor(actual));
  updateBattleUI();
  updateHeaderUI();

  // Player hurt particles
  const arena = $('battle-arena');
  if (arena && actual > 0) {
    const rect = arena.getBoundingClientRect();
    spawnParticles(rect.left + rand(40,120), rect.top + rect.height - rand(40,120), 6, '#ff1744');
    $('battle-overlay').style.boxShadow = 'inset 0 0 40px rgba(255,23,68,0.25)';
    setTimeout(() => $('battle-overlay').style.boxShadow = '', 200);
  }

  if (GS.hp <= 0) {
    endBattle(false);
    gameOverDefeat();
  }
}

function nextBattleQuestion() {
  if (GS.gameOver || !GS.inBattle || GS.enemyHp <= 0) return;
  // Only show questions during question phase
  if (GS.turnPhase !== 'question') return;

  const pool = GS.allQuestions.length > 0 ? GS.allQuestions : (typeof BUILTIN_QUESTIONS !== 'undefined' ? BUILTIN_QUESTIONS : []);
  if (pool.length === 0) return;

  const candidates = pool.filter(q => !GS.questionHistory.slice(-10).includes(q.id));
  const q = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pool[Math.floor(Math.random() * pool.length)];

  GS.currentQ = q;
  GS.questionHistory.push(q.id);
  if (GS.questionHistory.length > 60) GS.questionHistory.splice(0, 20);

  $('battle-q-text').textContent = `[⚡已获得${GS.turnCorrect}能量] ${q.q}`;
  const optsContainer = $('battle-options');
  optsContainer.innerHTML = '';

  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'battle-opt-btn';
    btn.textContent = opt;
    btn.onclick = () => handleBattleAnswer(i);
    optsContainer.appendChild(btn);
  });

  updateEnergyUI();
}

function handleBattleAnswer(index) {
  // Only accept answers during question phase
  if (GS.gameOver || !GS.inBattle || GS.turnPhase !== 'question') return;

  const q = GS.currentQ;
  if (!q) return;

  const btns = $('battle-options').querySelectorAll('.battle-opt-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const correct = index === q.ans;
  btns[index].classList.add(correct ? 'correct' : 'wrong');
  if (!correct) btns[q.ans].classList.add('correct');

  GS.totalAnswered++;

  if (correct) {
    // CORRECT: continue the chain!
    GS.totalCorrect++;
    GS.combo++;
    GS.turnCorrect++;
    if (GS.combo > GS.maxCombo) GS.maxCombo = GS.combo;
    GS.score += 5;

    // Attack damage scales with combo
    const baseDmg = 3 + Math.floor(GS.combo / 3) * 2 + getPlayerAtk();
    const comboMult = 1 + (GS.combo - 1) * 0.15;
    const totalDmg = Math.floor(baseDmg * comboMult * GS.playerDmgMult);

    dealEnemyDamage(totalDmg);
    sfxCorrect();

    // Combo milestones
    if (GS.combo === 5) { showComboPopup('💪 5连击！'); sfxCombo(); }
    else if (GS.combo === 10) { showComboPopup('🔥 10连击！'); sfxCombo(); }
    else if (GS.combo === 15) { showComboPopup('⚡ 15连击！势不可挡！'); sfxCombo(); }
    else if (GS.combo % 5 === 0) { sfxCombo(); }

    // Show accumulated energy
    $('battle-combo').textContent = `⚡+${GS.turnCorrect}`;

    updateBattleUI();

    // If enemy killed, end battle
    if (GS.enemyHp <= 0) {
      endBattle(true);
      return;
    }

    // Continue the chain — next question after short delay
    setTimeout(() => nextBattleQuestion(), 400);

  } else {
    // WRONG: combo broken, take counter damage, switch to card phase
    GS.combo = 0;
    sfxWrong();

    const counterDmg = Math.floor(GS.enemyBaseDamage * 0.5);
    damagePlayer(counterDmg);

    updateBattleUI();

    if (GS.hp <= 0) return;

    // Transition to card phase
    enterCardPhase();
  }
}

function endBattle(won) {
  GS.inBattle = false;
  $('battle-overlay').classList.remove('active');
  $('capture-overlay').classList.remove('active');

  if (won) {
    const node = GS.currentMapNode;
    if (node && node.rewards) {
      const g = node.rewards.gold || 20;
      GS.gold += g;
      grantMetaGold(g);
      GS.score += node.type === 'boss' ? 100 : node.type === 'elite' ? 50 : 20;
      sfxGold();
    }

    // NOTE: Defeating a Pokemon does NOT register it in the Pokedex.
    // Only successful capture (attemptCapture) unlocks the entry.

    // 击败 BOSS：进入下一层（无限闯关，不再因层数通关）
    let bossDefeated = false;
    if (node && node.type === 'boss') {
      bossDefeated = true;
      const clearedFloor = GS.floor;
      GS.floor++;
      GS.score += 50 + clearedFloor * 10; // 层数越高通关分越多
      GS.mapNodes = generateMapNodes(GS.floor);
      GS.currentNodeIdx = -1;
      GS.visitedNodes = [];
      notify(`🎉 击败第 ${clearedFloor} 层BOSS！进入第 ${GS.floor} 层！`, 'var(--gold)');
      if ($('floor-indicator')) $('floor-indicator').textContent = `第 ${GS.floor} 层`;
      if (GS.mapNodes.length > 0 && GS.mapNodes[0].length > 0) {
        GS.mapNodes[0].forEach(n => { n.reachable = true; });
      }
      updateBestScore();
    }

    // ALWAYS offer capture after battle (except game over/victory)
    if (GS.enemyPkm && GS.enemyPkm.id && !GS.gameOver) {
      offerCapture();
    } else {
      renderDungeonMap();
    }

    updateHeaderUI();
  } else {
    renderDungeonMap();
  }

  saveGame();
  saveMeta();
}

function offerCapture() {
  const pkm = GS.enemyPkm;
  if (!pkm) return;

  $('capture-overlay').classList.add('active');
  $('capture-pkm-img').src = getPkmSprite(pkm.id);
  $('capture-pkm-img').style.display = getPkmSprite(pkm.id) ? 'block' : 'none';

  $('capture-chance-text').innerHTML = `
    目标: <span style="color:${RARITY_COLORS[pkm.r]}">${getPkmName(pkm.id)}</span>
    (${RARITY_NAMES[pkm.r] || '?'})
  `;

  // Build ball selection UI
  const existingSelect = $('capture-ball-select');
  if (existingSelect) existingSelect.remove();

  const ballSelect = document.createElement('div');
  ballSelect.className = 'capture-ball-select';
  ballSelect.id = 'capture-ball-select';

  for (const [key, ball] of Object.entries(POKE_BALLS)) {
    const count = GS.pokeBalls[key] || 0;
    const rate = ball.rates[pkm.r] || ball.rates['c'];
    const ratePct = Math.floor(rate * 100);
    const btn = document.createElement('button');
    btn.className = `capture-ball-btn ${key === 'master' ? 'master' : ''} ${count <= 0 ? 'empty' : ''}`;
    btn.innerHTML = `
      <span class="ball-name">${ball.icon} ${ball.name}</span>
      <span class="ball-rate">捕获率: ${ratePct}%</span>
      <span class="ball-count">拥有: ${count}个</span>
    `;
    btn.onclick = () => {
      if (count <= 0) { notify('没有这种精灵球了！', 'var(--red)'); return; }
      attemptCapture(key);
    };
    ballSelect.appendChild(btn);
  }

  $('capture-overlay').appendChild(ballSelect);

  // Also add skip button
  const skipBtn = document.createElement('button');
  skipBtn.className = 'capture-btn pass';
  skipBtn.textContent = '跳过捕获';
  skipBtn.style.marginTop = '8px';
  skipBtn.onclick = () => skipCapture();
  skipBtn.id = 'capture-skip-btn';
  $('capture-overlay').appendChild(skipBtn);

  // Hide default throw button
  $('btn-capture-throw').style.display = 'none';
  $('btn-capture-pass').style.display = 'none';
}

function attemptCapture(ballType) {
  const pkm = GS.enemyPkm;
  if (!pkm) return;

  // Use one ball
  GS.pokeBalls[ballType] = Math.max(0, (GS.pokeBalls[ballType] || 0) - 1);

  const ball = POKE_BALLS[ballType];
  const finalRate = ball.rates[pkm.r] || ball.rates['c'] || 0.5;

  if (Math.random() < finalRate) {
    // Success!
    GS.collected[pkm.id] = true;
    notify(`🎉 成功捕获 ${getPkmName(pkm.id)}！`, 'var(--gold)');
    sfxCapture();
    // Add to team if space
    if (GS.team.length < MAX_TEAM_SIZE && !GS.team.includes(pkm.id)) {
      GS.team.push(pkm.id);
      notify(`➕ ${getPkmName(pkm.id)} 加入队伍！`, 'var(--cyan)');
    }
  } else {
    notify(`${ball.name}摇了三下...失败了...`, 'var(--red)');
    sfxCaptureFail();
  }

  // Close capture overlay and show rewards
  $('capture-overlay').classList.remove('active');
  // Clean up dynamic elements
  const ballSelect = $('capture-ball-select');
  if (ballSelect) ballSelect.remove();
  const skipBtn = document.getElementById('capture-skip-btn');
  if (skipBtn) skipBtn.remove();
  $('btn-capture-throw').style.display = '';
  $('btn-capture-pass').style.display = '';

  // Offer card reward
  const node = GS.currentMapNode;
  if (node && node.rewards && node.rewards.cardChoices > 0 && node.type !== 'shop' && node.type !== 'rest') {
    offerReward(node);
  }

  renderDungeonMap();
  saveGame();
  saveMeta();
}

function skipCapture() {
  $('capture-overlay').classList.remove('active');
  const ballSelect = $('capture-ball-select');
  if (ballSelect) ballSelect.remove();
  const skipBtn = document.getElementById('capture-skip-btn');
  if (skipBtn) skipBtn.remove();
  $('btn-capture-throw').style.display = '';
  $('btn-capture-pass').style.display = '';

  notify('放弃了捕获...', 'var(--text2)');

  const node = GS.currentMapNode;
  if (node && node.rewards && node.rewards.cardChoices > 0 && node.type !== 'shop' && node.type !== 'rest') {
    offerReward(node);
  }
  renderDungeonMap();
  saveGame();
}

function offerReward(node) {
  const overlay = $('reward-overlay');
  overlay.classList.add('active');
  $('reward-title').textContent = node.type === 'boss' ? '👑 BOSS战利品！' : node.type === 'elite' ? '💀 精英战利品！' : '🎁 战利品！';
  $('reward-gold').textContent = `+${node.rewards.gold || 20} 🪙`;
  const cards = $('reward-cards');
  cards.innerHTML = '';

  const choices = [];
  const pool = ALL_CARDS.filter(c => c.rarity !== 'l' || node.type === 'boss');
  for (let i = 0; i < 3; i++) {
    const weights = { c: 40, u: 35, r: 20, l: node.type === 'boss' ? 5 : 0 };
    const total = Object.values(weights).reduce((a,b)=>a+b,0);
    let r = Math.random() * total;
    let rarity = 'c';
    for (const [k, w] of Object.entries(weights)) { r -= w; if (r <= 0) { rarity = k; break; } }
    const rPool = pool.filter(c => c.rarity === rarity);
    const card = rPool.length > 0 ? rPool[Math.floor(Math.random() * rPool.length)] : pool[Math.floor(Math.random() * pool.length)];
    choices.push(card);
  }

  choices.forEach(card => {
    const el = document.createElement('div');
    el.className = `reward-card type-${card.type}`;
    el.innerHTML = `
      <div style="font-size:7px;color:var(--text2)">${RARITY_NAMES[card.rarity]||card.rarity}</div>
      <div style="font-size:22px">${card.icon}</div>
      <div style="font-weight:700;font-size:10px">${card.name}</div>
      <div style="font-size:7px;color:var(--text2)">${card.type==='atk'?'攻击':card.type==='def'?'防御':card.type==='skill'?'技能':'道具'} | ${card.cost}⚡</div>
      <div style="font-size:7px;line-height:1.2">${card.desc}</div>
    `;
    el.onclick = () => {
      GS.deck.push(hydrateCard(card));
      $('reward-overlay').classList.remove('active');
      notify(`获得卡片: ${card.name}`, 'var(--gold)');
      sfxGold();
      renderDeckPanel();
      saveGame();
    };
    cards.appendChild(el);
  });

  $('reward-skip').onclick = () => {
    GS.gold += 25;
    $('reward-overlay').classList.remove('active');
    updateHeaderUI();
    saveGame();
    sfxGold();
  };
}

// ============================================================

// SECTION 12: SHOP / REST / EVENT / TREASURE
// ============================================================
function openShop() {
  const overlay = $('shop-overlay');
  overlay.classList.add('active');
  $('shop-gold-amount').textContent = GS.gold;

  const container = $('shop-cards');
  container.innerHTML = '';

  // === Section 1: Poke Balls ===
  const ballHeader = document.createElement('div');
  ballHeader.style.cssText = 'width:100%;text-align:center;font-size:13px;color:var(--gold);font-weight:700;margin-bottom:4px';
  ballHeader.textContent = '🔴 精灵球';
  container.appendChild(ballHeader);

  for (const [key, ball] of Object.entries(POKE_BALLS)) {
    const el = document.createElement('div');
    el.className = `shop-card ${key === 'master' ? 'type-item' : ''}`;
    el.style.borderColor = key === 'master' ? 'var(--gold)' : 'var(--border)';
    el.innerHTML = `
      <div class="card-price">${ball.price}🪙</div>
      <div class="card-icon" style="font-size:28px">${ball.icon}</div>
      <div style="font-weight:700;font-size:10px">${ball.name}</div>
      <div style="font-size:7px;color:var(--text2)">${ball.desc}</div>
      <div style="font-size:7px;color:var(--cyan)">库存: ${GS.pokeBalls[key] || 0}个</div>
    `;
    el.onclick = () => {
      if (GS.gold >= ball.price) {
        GS.gold -= ball.price;
        GS.pokeBalls[key] = (GS.pokeBalls[key] || 0) + 1;
        updateHeaderUI();
        $('shop-gold-amount').textContent = GS.gold;
        notify(`购买: ${ball.name}`, 'var(--gold)');
        sfxGold();
        openShop(); // Refresh shop display
        saveGame();
      } else {
        notify('金币不足！', 'var(--red)');
      }
    };
    container.appendChild(el);
  }

  // === Section 2: Cards ===
  const cardHeader = document.createElement('div');
  cardHeader.style.cssText = 'width:100%;text-align:center;font-size:13px;color:var(--cyan);font-weight:700;margin:8px 0 4px';
  cardHeader.textContent = '🃏 技能卡片';
  container.appendChild(cardHeader);

  const shopCards = [];
  const pool = ALL_CARDS.filter(c => c.rarity !== 'l');
  for (let i = 0; i < 4; i++) {
    const card = pool[Math.floor(Math.random() * pool.length)];
    const price = card.rarity === 'r' ? rand(90, 130) : card.rarity === 'u' ? rand(55, 85) : rand(30, 55);
    shopCards.push({ card, price });
  }

  shopCards.forEach(({ card, price }) => {
    const el = document.createElement('div');
    el.className = `shop-card type-${card.type}`;
    el.innerHTML = `
      <div class="card-price">${price}🪙</div>
      <div class="card-icon">${card.icon}</div>
      <div style="font-weight:700;font-size:9px">${card.name}</div>
      <div style="font-size:7px;color:var(--text2)">${card.desc}</div>
    `;
    el.onclick = () => {
      if (GS.gold >= price) {
        GS.gold -= price;
        GS.deck.push(hydrateCard(card));
        updateHeaderUI();
        $('shop-gold-amount').textContent = GS.gold;
        notify(`购买: ${card.name}`, 'var(--gold)');
        sfxGold();
        el.style.opacity = '0.3';
        el.style.pointerEvents = 'none';
        saveGame();
      } else {
        notify('金币不足！', 'var(--red)');
      }
    };
    container.appendChild(el);
  });

  $('btn-shop-remove').onclick = () => {
    if (GS.gold >= 75 && GS.deck.length > 5) {
      GS.gold -= 75;
      updateHeaderUI();
      $('shop-gold-amount').textContent = GS.gold;
      const idx = Math.floor(Math.random() * GS.deck.length);
      const removed = GS.deck.splice(idx, 1)[0];
      notify(`移除: ${removed.name}`, 'var(--text2)');
      saveGame();
    } else {
      notify(GS.deck.length <= 5 ? '牌组至少保留5张！' : '金币不足！', 'var(--red)');
    }
  };

  $('btn-shop-leave').onclick = () => {
    overlay.classList.remove('active');
    saveGame();
  };
}

function openRest() {
  const overlay = $('rest-overlay');
  overlay.classList.add('active');

  $('btn-rest-heal').onclick = () => {
    const heal = Math.floor(GS.maxHp * 0.3);
    GS.hp = Math.min(GS.maxHp, GS.hp + heal);
    updateHeaderUI();
    notify(`回复了 ${heal} HP！`, 'var(--green)');
    sfxHeal();
    overlay.classList.remove('active');
    saveGame();
  };

  $('btn-rest-upgrade').onclick = () => {
    // 营地特训：回复 + 少量养成金币（全局）
    const heal = Math.floor(GS.maxHp * 0.15);
    GS.hp = Math.min(GS.maxHp, GS.hp + heal);
    grantMetaGold(3);
    updateHeaderUI();
    notify('特训完成！回复HP，养成金币+3', 'var(--cyan)');
    sfxHeal();
    overlay.classList.remove('active');
    saveGame();
  };

  $('btn-rest-leave').onclick = () => {
    overlay.classList.remove('active');
    saveGame();
  };
}

function openTreasure(node) {
  GS.gold += node.rewards.gold || 30;
  updateHeaderUI();
  notify(`🎁 获得 ${node.rewards.gold || 30} 金币！`);

  if (node.rewards.cardChoices > 0) {
    // Give a random free card
    const card = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
    if (card.rarity !== 'l' || Math.random() < 0.1) {
      GS.deck.push(hydrateCard(card));
      notify(`获得卡片: ${card.name}`, 'var(--gold)');
    }
  }
  sfxGold();
  saveGame();
}

function openEvent(node) {
  const overlay = $('event-overlay');
  overlay.classList.add('active');

  const events = [
    {
      title: '神秘商人',
      text: '一个神秘商人出现在你面前，愿意用一张稀有卡片换取你的一些金币。',
      choices: [
        { text: '支付30金币 (获得稀有卡)', action(){ if(GS.gold>=30){GS.gold-=30;const c=ALL_CARDS.filter(x=>x.rarity==='r');GS.deck.push(hydrateCard(c[rand(0,c.length-1)]));notify('获得稀有卡片！','var(--gold)')}else{notify('金币不足','var(--red)')};overlay.classList.remove('active');saveGame(); }},
        { text: '拒绝', action(){ overlay.classList.remove('active'); } },
      ]
    },
    {
      title: '温泉',
      text: '你发现了一处温泉，可以选择休息回复HP，但会浪费时间。',
      choices: [
        { text: '泡温泉 (回复25%HP)', action(){ GS.hp=Math.min(GS.maxHp,GS.hp+Math.floor(GS.maxHp*0.25));notify('回复了HP！','var(--green)');sfxHeal();overlay.classList.remove('active');saveGame(); }},
        { text: '继续前进', action(){ overlay.classList.remove('active'); } },
      ]
    },
    {
      title: '训练师挑战',
      text: '一位路过的训练师向你发起挑战！高风险，高回报。',
      choices: [
        { text: '接受挑战 (获得50金币，但可能受伤)', action(){ if(Math.random()<0.6){GS.gold+=50;notify('战胜训练师！+50金币','var(--gold)')}else{damagePlayer(rand(8,18));notify('训练师太强了！','var(--red)')};overlay.classList.remove('active');saveGame(); }},
        { text: '婉拒', action(){ overlay.classList.remove('active'); } },
      ]
    },
    {
      title: '宝可梦中心',
      text: '你遇到了一台野外宝可梦中心的治疗机器。',
      choices: [
        { text: '使用机器 (回复至满血)', action(){ GS.hp=GS.maxHp;notify('完全回复！','var(--green)');sfxHeal();overlay.classList.remove('active');saveGame(); }},
        { text: '继续赶路', action(){ overlay.classList.remove('active'); } },
      ]
    },
  ];

  const evt = events[Math.floor(Math.random() * events.length)];
  $('event-title').textContent = '❓ ' + evt.title;
  $('event-text').textContent = evt.text;
  const choices = $('event-choices');
  choices.innerHTML = '';
  evt.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'shop-action-btn';
    btn.textContent = c.text;
    btn.style.margin = '4px';
    btn.onclick = () => c.action();
    choices.appendChild(btn);
  });
}

// ============================================================
