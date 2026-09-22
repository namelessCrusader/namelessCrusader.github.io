// Tile-based Wave Function Collapse core, shared by the footer level and the WFC vs SWFC page.
//
// Both methods learn which tiles may touch (and how often) from an ASCII sample and use the
// same constraint propagation. They differ only in how they pick and fill the next cell:
//   "wfc"  standard WFC (github.com/mxgmn/WaveFunctionCollapse, simple tiled model):
//          lowest-entropy cell first; tile sampled by its overall frequency in the sample.
//   "swfc" Stochastic WFC (github.com/namelessCrusader/Stochastic-Wave-Function-Collapse):
//          smallest-domain cell first; tile sampled from the sum of the count distributions
//          of its already collapsed neighbours, so neighbours shift the odds, not just the rules.
//
// The cell order can be overridden with `select`: "entropy", "domain", "random", or "scan"
// (left to right, top to bottom, which makes SWFC behave like a constrained Markov chain).
// `balance` (0 = off) nudges each choice toward the sample's overall tile proportions by
// multiplying weights by (target share / share placed so far) ^ balance.
//
// A model is { freq: {tile: n}, counts: {tile: {left|right|up|down: {neighbour: n}}} }.

const TileWFC = (() => {
  const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const OPP = { left: "right", right: "left", up: "down", down: "up" };
  const SMOOTHING = 0.01; // additive smoothing, as in the original SWFC

  // Learn a model from an ASCII sample (array of equal-length strings).
  function learn(sample) {
    const freq = {}, counts = {};
    const H = sample.length, W = sample[0].length;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = sample[y][x];
        freq[t] = (freq[t] || 0) + 1;
        counts[t] = counts[t] || { left: {}, right: {}, up: {}, down: {} };
        for (const [d, [dx, dy]] of Object.entries(DIRS)) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = sample[ny][nx];
          counts[t][d][n] = (counts[t][d][n] || 0) + 1;
        }
      }
    }
    return { freq, counts };
  }

  function pick(weights) {
    let total = 0;
    for (const w of weights.values()) total += w;
    let r = Math.random() * total;
    for (const [t, w] of weights) if ((r -= w) <= 0) return t;
    return [...weights.keys()].pop();
  }

  // One generation attempt. Returns an array of strings, or null on a contradiction.
  //   select:         cell order (defaults to "entropy" for WFC and "domain" for SWFC)
  //   seed(fix):      optional, pre-place tiles with fix(x, y, tile)
  //   prior(t, x, y): optional extra weight multiplier for tile t at (x, y)
  //   balance:        strength of the pull toward the sample's tile proportions (0 = off)
  function run(model, cols, rows, { method = "swfc", select, seed, prior, balance = 0 } = {}) {
    select = select || (method === "wfc" ? "entropy" : "domain");
    const tiles = Object.keys(model.freq);
    const count = (a, d, b) => model.counts[a]?.[d]?.[b] || 0;
    const cells = Array.from({ length: cols * rows }, () => new Set(tiles));
    const idx = (x, y) => y * cols + x;
    const queue = [];
    const placed = {};
    let placedTotal = 0;
    const fix = (x, y, t) => {
      cells[idx(x, y)] = new Set([t]);
      queue.push([x, y]);
      placed[t] = (placed[t] || 0) + 1;
      placedTotal++;
    };
    const sampleTotal = Object.values(model.freq).reduce((a, b) => a + b, 0);

    // Arc consistency: drop any tile that no tile in a neighbouring cell allows.
    const propagate = () => {
      while (queue.length) {
        const [x, y] = queue.pop();
        const here = cells[idx(x, y)];
        for (const [d, [dx, dy]] of Object.entries(DIRS)) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const there = cells[idx(nx, ny)];
          let changed = false;
          for (const b of [...there]) {
            let ok = false;
            for (const a of here) if (count(a, d, b) > 0) { ok = true; break; }
            if (!ok) { there.delete(b); changed = true; }
          }
          if (there.size === 0) return false;
          if (changed) queue.push([nx, ny]);
        }
      }
      return true;
    };

    const entropy = (cell) => {
      let sum = 0, sumLog = 0;
      for (const t of cell) { const w = model.freq[t]; sum += w; sumLog += w * Math.log(w); }
      return Math.log(sum) - sumLog / sum;
    };

    if (seed) seed(fix);
    if (!propagate()) return null;

    while (true) {
      // Choose the next cell.
      let best = [], min = Infinity;
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c.size <= 1) continue;
        const score =
          select === "scan" ? i
          : select === "random" ? Math.random()
          : select === "entropy" ? entropy(c) + Math.random() * 1e-6
          : c.size;
        if (score < min) { min = score; best = [i]; } else if (score === min) best.push(i);
      }
      if (!best.length) break;
      const i = best[Math.floor(Math.random() * best.length)];
      const x = i % cols, y = Math.floor(i / cols);

      // Weight its remaining options.
      const options = [...cells[i]];
      const weights = new Map(options.map((t) => [t, 0]));
      let neighbours = 0;
      if (method === "swfc") {
        for (const [d, [dx, dy]] of Object.entries(DIRS)) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const n = cells[idx(nx, ny)];
          if (n.size !== 1) continue;
          const [nt] = n;
          const raw = options.map((t) => count(nt, OPP[d], t) + SMOOTHING);
          const sum = raw.reduce((a, b) => a + b, 0);
          options.forEach((t, k) => weights.set(t, weights.get(t) + raw[k] / sum));
          neighbours++;
        }
      }
      if (!neighbours) options.forEach((t) => weights.set(t, model.freq[t]));
      if (prior) options.forEach((t) => weights.set(t, weights.get(t) * prior(t, x, y)));
      if (balance) {
        options.forEach((t) => {
          const target = model.freq[t] / sampleTotal;
          const share = (placed[t] || 0) / Math.max(1, placedTotal);
          weights.set(t, weights.get(t) * Math.pow((target + 0.01) / (share + 0.01), balance));
        });
      }

      fix(x, y, pick(weights));
      if (!propagate()) return null;
    }

    const grid = [];
    for (let y = 0; y < rows; y++) {
      grid.push(Array.from({ length: cols }, (_, x) => [...cells[idx(x, y)]][0]).join(""));
    }
    return grid;
  }

  // Retry until an attempt succeeds (or give up and return null).
  function generate(model, cols, rows, opts = {}, maxTries = 30) {
    for (let i = 0; i < maxTries; i++) {
      const g = run(model, cols, rows, opts);
      if (g) return g;
    }
    return null;
  }

  return { learn, run, generate };
})();
