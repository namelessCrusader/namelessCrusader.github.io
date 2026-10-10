// Hidden training-plan easter egg. Opens train.html in a pixel "game window" over the page.
// Triggers:
//   Desktop: type the Konami code (up up down down left right left right b a)
//   Phone:   tap any element marked with data-egg 5 times within 2 seconds
//            (the name in the top bar, and the face-down card in Side Quests)
//   Direct:  any page URL ending in #train, e.g. bookmark namelesscrusader.github.io/#train
(() => {
  const SRC = 'train.html';
  const HASH = '#train';

  // Konami code: compare the last 10 keys, so extra presses before it don't break it.
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let recent = [];
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'Escape' && wrap) { close(); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    recent = [...recent, k].slice(-seq.length);
    if (recent.join() === seq.join()) { recent = []; unlock(); }
  });

  let taps = [];
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-egg]')) return;
    const now = performance.now();
    taps = taps.filter((t) => now - t < 2000);
    taps.push(now);
    if (taps.length >= 5) { taps = []; unlock(); }
  });

  let wrap = null, opener = null, pushed = false;

  // The fun part: a banner and a burst of spaceships in the Game of Life background.
  function unlock() {
    if (wrap || document.querySelector('.egg-banner')) return;
    if (typeof Life !== 'undefined' && Life.burst) Life.burst();
    const banner = document.createElement('div');
    banner.className = 'egg-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = '★ Secret unlocked ★<small>Training grounds</small>';
    document.body.append(banner);
    setTimeout(() => { banner.remove(); open(); }, 1300);
  }

  function open({ fromHash = false } = {}) {
    if (wrap) return;
    opener = document.activeElement;
    if (!fromHash) { history.pushState({ egg: true }, '', HASH); pushed = true; }
    wrap = document.createElement('div');
    wrap.id = 'egg-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Home strength plan');
    wrap.innerHTML = `
      <div class="egg-window">
        <div class="egg-bar"><span>Training grounds</span><button class="egg-close" aria-label="Close">✕ Close</button></div>
        <iframe src="${SRC}" title="Home strength plan"></iframe>
      </div>`;
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('.egg-close').addEventListener('click', close);
    document.documentElement.classList.add('egg-open');
    document.body.append(wrap);
    wrap.querySelector('.egg-close').focus();
  }

  // Closing goes back through history when we added the #train entry, so the phone's
  // back gesture and the close button end up in the same place.
  function close() {
    if (!wrap) return;
    if (pushed) { pushed = false; history.back(); return; }
    history.replaceState(null, '', location.pathname + location.search);
    teardown();
  }

  function teardown() {
    wrap.remove();
    wrap = null;
    document.documentElement.classList.remove('egg-open');
    if (opener && opener.focus) opener.focus();
  }

  addEventListener('popstate', () => {
    if (wrap && location.hash !== HASH) { pushed = false; teardown(); }
    else if (!wrap && location.hash === HASH) open({ fromHash: true });
  });

  // train.html asks to close when Escape is pressed inside the frame.
  addEventListener('message', (e) => {
    if (e.origin === location.origin && e.data === 'egg:close') close();
  });

  if (location.hash === HASH) open({ fromHash: true });

  console.log('%c↑ ↑ ↓ ↓ ← → ← → B A', 'font: 16px monospace; color: #ff004d');
  console.log('Psst. Try typing that on the page.');
})();
