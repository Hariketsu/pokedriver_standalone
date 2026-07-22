/* ===== 启动引导 ===== */
(function () {
'use strict';
const C = window.GameCore;
const G = window.G;

function boot() {
  C.loadMeta();
  // 应用音频设置
  AudioEngine.setBgmVol(G.meta.settings.bgm);
  AudioEngine.setSfxVol(G.meta.settings.sfx);
  // 首次交互解锁音频
  const unlock = () => {
    AudioEngine.unlock();
    AudioEngine.bgm('title');
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  window.Screens.renderTitle();
  // 预初始化 3D 场景（隐藏时建立上下文，避免战斗首开卡顿）
  try { BattleFX.init(document.querySelector('#battle-canvas')); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', boot);
})();
