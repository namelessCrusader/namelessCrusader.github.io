// Mario levels with Stochastic Wave Function Collapse (the SWFC method in wfc.js), a port of
// github.com/namelessCrusader/Stochastic-Wave-Function-Collapse
//
// Neighbour counts come from VGLC Super Mario Bros. overworld levels (swfc_model.js, built by
// tools/learn_swfc.py, leaving out the underground and athletic levels). As in the original,
// the top row and side columns start as sky, both ends of the floor are safe ground, and the
// floor in between is laid left to right as a Markov chain over {X, -}.
// Changes from the original: full constraint propagation, loop-based restarts, and a rough
// playability check that rerolls levels Mario couldn't finish. Unless { original: true } is
// passed, two learned priors are added too: the floor chain uses transitions from the ground
// row only (all-row counts make gaps run on forever), and each tile's weight is multiplied by
// how much more (or less) common it is at that height than overall, i.e. P(tile | row) / P(tile).
//
// VGLC tiles:  -  sky       X  ground/solid   S  brick     ?  Q  question blocks
//              E  enemy     <> pipe top       [] pipe body  o  coin    B b  cannon top/base

const SWFC = (() => {
  const M = SWFC_MODEL;
  const SMOOTHING = 0.01;
  const SOLID = new Set("XS?Q<>[]Bb");
  const count = (a, d, b) => M.counts[a]?.[d]?.[b] || 0;

  const total = Object.values(M.freq).reduce((a, b) => a + b, 0);
  const rowTotal = M.rowFreq.map((r) => Object.values(r).reduce((a, b) => a + b, 0));
  const lift = (t, y) => ((M.rowFreq[y][t] || 0) + SMOOTHING) / rowTotal[y] / (M.freq[t] / total);

  function seeds(cols, rows, original) {
    return (fix) => {
      for (let x = 0; x < cols; x++) fix(x, 0, "-");
      for (let y = 1; y < rows - 1; y++) { fix(0, y, "-"); fix(cols - 1, y, "-"); }
      const safe = Math.min(15, Math.max(3, Math.floor(cols / 10)));
      let prev = "X";
      for (let x = 0; x < cols; x++) {
        let t = "X";
        if (x >= safe && x < cols - safe) {
          const n = (c) => (original ? count(prev, "right", c) : M.floor[prev]?.[c] || 0);
          const wX = n("X") + SMOOTHING, wGap = n("-") + SMOOTHING;
          t = Math.random() * (wX + wGap) < wX ? "X" : "-";
        }
        fix(x, rows - 1, t);
        prev = t;
      }
    };
  }

  function attempt(cols, rows = M.height, original = false) {
    return TileWFC.run(M, cols, rows, {
      method: "swfc",
      seed: seeds(cols, rows, original),
      prior: original ? null : (t, x, y) => lift(t, y),
    });
  }

  // Rough check that Mario can get from the left edge to the right edge. Mario stands on
  // any solid tile, jumps up to 4 tiles up and 4 across (further when falling), and can't
  // pass a column that is solid across his whole jump height.
  function playable(grid) {
    const rows = grid.length, cols = grid[0].length;
    const solid = (x, y) => SOLID.has(grid[y][x]);
    const stands = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 1; y < rows - 1; y++) if (!solid(x, y) && solid(x, y + 1)) stands.push([x, y]);
    }
    const blocked = (c, top, bottom) => {
      for (let r = Math.max(0, top); r <= bottom; r++) if (!solid(c, r)) return false;
      return true;
    };
    const reach = (x, y, x2, y2) => {
      const dx = Math.abs(x2 - x), dy = y2 - y;
      if (dy < -4 || dx > 4 + Math.max(0, Math.floor(dy / 2))) return false;
      const step = Math.sign(x2 - x);
      for (let c = x + step; c !== x2; c += step) if (blocked(c, y - 4, Math.max(y, y2))) return false;
      return true;
    };

    const seen = new Set();
    const todo = stands.filter(([x]) => x <= 1);
    todo.forEach((s) => seen.add(s));
    while (todo.length) {
      const [x, y] = todo.pop();
      if (x >= cols - 2) return true;
      for (const s of stands) {
        if (!seen.has(s) && Math.abs(s[0] - x) <= 8 && reach(x, y, s[0], s[1])) {
          seen.add(s);
          todo.push(s);
        }
      }
    }
    return false;
  }

  function generate(cols, { rows = M.height, original = false, maxTries = 40 } = {}) {
    let fallback = null;
    for (let i = 0; i < maxTries; i++) {
      const grid = attempt(cols, rows, original);
      if (!grid) continue;
      if (playable(grid)) return grid;
      fallback = fallback || grid;
    }
    return fallback || Array.from({ length: rows }, (_, y) => (y === rows - 1 ? "X" : "-").repeat(cols));
  }

  return { generate, playable, attempt, height: M.height };
})();
