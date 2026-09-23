// Faint Conway's Game of Life in the page background, seeded with well-known patterns.
// Patterns are in RLE, the format LifeWiki (conwaylife.com/wiki) uses: b = dead, o = alive,
// $ = end of row, ! = end, and a number repeats the next token.

const LIFE_PATTERNS = {
  "glider": "bob$2bo$3o!",
  "lightweight spaceship": "bo2bo$o4b$o3bo$4o!",
  "middleweight spaceship": "3bo2b$bo3bo$o5b$o4bo$5o!",
  "heavyweight spaceship": "3b2o2b$bo4bo$o6b$o5bo$6o!",
  "R-pentomino": "b2o$2ob$bo!",
  "acorn": "bo5b$3bo3b$2o2b3o!",
  "diehard": "6bob$2o6b$bo3b3o!",
  "pulsar": "2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!",
  "pentadecathlon": "2bo4bo2b$2ob4ob2o$2bo4bo!",
  "Gosper glider gun": "24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8bo3bob2o4bobo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!",
};

// Relative odds of each pattern being dropped in. Guns are rare: they never stop firing.
const LIFE_WEIGHTS = {
  "glider": 5, "lightweight spaceship": 3, "middleweight spaceship": 2, "heavyweight spaceship": 2,
  "R-pentomino": 2, "acorn": 1, "diehard": 2, "pulsar": 1, "pentadecathlon": 1, "Gosper glider gun": 0.5,
};

// Parse RLE into a list of [x, y] live cells.
function parseRLE(rle) {
  const cells = [];
  let x = 0, y = 0, n = "";
  for (const ch of rle) {
    if (ch >= "0" && ch <= "9") { n += ch; continue; }
    const count = n ? parseInt(n, 10) : 1;
    n = "";
    if (ch === "b") x += count;
    else if (ch === "o") { for (let i = 0; i < count; i++) cells.push([x++, y]); }
    else if (ch === "$") { y += count; x = 0; }
    else if (ch === "!") break;
  }
  return cells;
}

const Life = (() => {
  const CELL = 12;         // CSS pixels per cell
  const STEP_MS = 160;     // time between generations
  const DROP_MS = 7000;    // how often a new pattern drops in
  const parsed = Object.fromEntries(Object.entries(LIFE_PATTERNS).map(([k, v]) => [k, parseRLE(v)]));

  let canvas, ctx, cols, rows, grid, next;
  let running = true, last = 0, lastDrop = 0;

  function pickPattern() {
    const names = Object.keys(LIFE_WEIGHTS);
    let r = Math.random() * names.reduce((s, k) => s + LIFE_WEIGHTS[k], 0);
    for (const k of names) if ((r -= LIFE_WEIGHTS[k]) <= 0) return k;
    return names[0];
  }

  // Stamp a pattern with a random rotation/flip, wrapping around the edges.
  function place(name, cx, cy) {
    const flipX = Math.random() < 0.5, flipY = Math.random() < 0.5, swap = Math.random() < 0.5;
    for (let [x, y] of parsed[name]) {
      if (swap) [x, y] = [y, x];
      if (flipX) x = -x;
      if (flipY) y = -y;
      const gx = (((cx + x) % cols) + cols) % cols, gy = (((cy + y) % rows) + rows) % rows;
      grid[gy * cols + gx] = 1;
    }
  }

  const dropRandom = () =>
    place(pickPattern(), Math.floor(Math.random() * cols), Math.floor(Math.random() * rows));

  function step() {
    for (let y = 0; y < rows; y++) {
      const up = ((y + rows - 1) % rows) * cols, mid = y * cols, down = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const l = (x + cols - 1) % cols, r = (x + 1) % cols;
        const n = grid[up + l] + grid[up + x] + grid[up + r] + grid[mid + l] + grid[mid + r]
                + grid[down + l] + grid[down + x] + grid[down + r];
        next[mid + x] = n === 3 || (n === 2 && grid[mid + x]) ? 1 : 0;
      }
    }
    [grid, next] = [next, grid];
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cols * CELL, rows * CELL);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) ctx.fillRect((i % cols) * CELL + 1, Math.floor(i / cols) * CELL + 1, CELL - 2, CELL - 2);
    }
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    cols = Math.ceil(window.innerWidth / CELL);
    rows = Math.ceil(window.innerHeight / CELL);
    canvas.width = cols * CELL * dpr;
    canvas.height = rows * CELL * dpr;
    canvas.style.width = `${cols * CELL}px`;
    canvas.style.height = `${rows * CELL}px`;
    grid = new Uint8Array(cols * rows);
    next = new Uint8Array(cols * rows);
    const seeds = Math.max(4, Math.round((cols * rows) / 1000));
    for (let i = 0; i < seeds; i++) dropRandom();
    draw();
  }

  function loop(t) {
    requestAnimationFrame(loop);
    if (!running) return;
    if (t - last >= STEP_MS) { step(); draw(); last = t; }
    if (t - lastDrop >= DROP_MS) { dropRandom(); lastDrop = t; }
  }

  function setRunning(on) {
    running = on;
    const btn = document.getElementById("life-toggle");
    if (btn) btn.textContent = on ? "Pause" : "Play";
  }

  function init() {
    canvas = document.createElement("canvas");
    canvas.id = "life";
    canvas.setAttribute("aria-hidden", "true");
    // Positioning also lives here, so a stale cached stylesheet can't push the page down.
    Object.assign(canvas.style, { position: "fixed", top: "0", left: "0", zIndex: "-1", pointerEvents: "none" });
    document.body.prepend(canvas);
    ctx = canvas.getContext("2d");
    resize();

    let w = window.innerWidth, timer;
    addEventListener("resize", () => {
      clearTimeout(timer);
      // Mobile browsers fire resize when the address bar hides; only restart on width changes.
      timer = setTimeout(() => { if (window.innerWidth !== w) { w = window.innerWidth; resize(); } }, 200);
    });

    // Clicking empty space drops a pattern where you clicked.
    document.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, canvas, .card, .pub, .photo-wrap, .topbar, pre")) return;
      if (String(window.getSelection())) return;
      place(pickPattern(), Math.floor(e.clientX / CELL), Math.floor(e.clientY / CELL));
      draw();
    });

    const btn = document.getElementById("life-toggle");
    if (btn) btn.addEventListener("click", () => setRunning(!running));

    requestAnimationFrame(loop);
  }

  return { init };
})();

Life.init();
