// WFC vs Stochastic WFC comparison page. Generators live in wfc.js.

const COLS = 56, ROWS = 24;

const ENVS = {
  overworld: {
    label: "Overworld",
    legend: { "~": "water", ".": "sand", ",": "grass", T: "forest", "^": "mountain", "*": "snow" },
    colors: {
      "~": ["#29adff", "#0b2a4a"], ".": ["#ffccaa", "#3a2e22"], ",": ["#00e436", "#0f2e14"],
      T: ["#3fbf6a", "#0a2212"], "^": ["#c2c3c7", "#2a2a2e"], "*": ["#ffffff", "#44444a"],
    },
    sample: [
      "~~~~~~~~~~~~~..,,,,,,TTTTTTTT,,,,,^^^^^^",
      "~~~~~~~~~~~~..,,,,,TTTTTTTTTTT,,,,^^**^^",
      "~~~~~~~~~~~..,,,,,,TTTTTTTTTT,,,,^^***^^",
      "~~~~~~~~~~..,,,,,,,,TTTTTTTT,,,,,,^^*^^,",
      "~~~~~~~~~...,,,,,,,,,,TTTTT,,,,,,,,^^^,,",
      "~~~~~~~~..,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,",
      "~~~~~~~..,,,,TTTT,,,,,,,,,,......,,,,,,,",
      "~~~~~~..,,,,TTTTTT,,,,,,,,..~~~~..,,,,,,",
      "~~~~~..,,,,,TTTTTT,,,,,,,..~~~~~~..,,,TT",
      "~~~~..,,,,,,,TTTT,,,,,,,,..~~~~~~..,,TTT",
      "~~~~..,,,,,,,,,,,,,,^^,,,,..~~~~..,,TTTT",
      "~~~~~..,,,,,,,,,,,,^^^^,,,,,....,,,,TTTT",
      "~~~~~~..,,,,,,,,,,^^**^^,,,,,,,,,,,,,TTT",
      "~~~~~~~..,,,,,,,,,^^^^^^,,,,,,,,,,,,,,TT",
      "~~~~~~~~..,,,,,,,,,,^^,,,,,,,,TTTT,,,,,,",
      "~~~~~~~~~...,,,,,,,,,,,,,,,,,TTTTTT,,,,,",
      "~~~~~~~~~~~...,,,,,,,,,,,,,,,TTTT,,,,...",
      "~~~~~~~~~~~~~~.....,,,,,,,,,,,,,,,,...~~",
    ],
  },
  caves: {
    label: "Caves",
    legend: { "#": "rock", ".": "floor", "~": "water", ",": "rubble", $: "gold" },
    colors: {
      "#": ["#83769c", "#1e1a26"], ".": ["#5f574f", null], "~": ["#29adff", "#0b2a4a"],
      ",": ["#ab5236", null], $: ["#ffec27", null],
    },
    sample: [
      "########################################",
      "####.....#######.......########...######",
      "###.......####..........######.....#####",
      "##.........##......,.....####.......####",
      "##....~~...........,,.....##.........###",
      "###..~~~~.................#....$.....###",
      "####..~~~.......####..............######",
      "#####......$...######.......,,.....#####",
      "######........########.............#####",
      "#####.........#######.......~~~.....####",
      "####....,,.....####........~~~~~.....###",
      "###.....,,,...............~~~~~......###",
      "###........................~~~........##",
      "####......####.....$...............#####",
      "#####....######..................#######",
      "######..########.......####....#########",
      "########################################",
    ],
  },
};

const ORDERS = {
  scan: {
    label: "Row by row",
    note: "Both fill cells left to right, top to bottom, so every new tile already has placed neighbours above and to its left.",
  },
  classic: {
    label: "Classic order",
    note: "Standard WFC fills the lowest-entropy cell next; SWFC fills the cell with the fewest options left, as in the original code.",
  },
};

const BALANCE = {
  on: {
    label: "Balanced",
    note: "Both nudge each choice toward the sample's overall tile proportions.",
  },
  off: {
    label: "Unbalanced",
    note: "No correction for overall tile proportions.",
  },
};

const state = { env: "overworld", order: "scan", balance: "on" };
const optsFor = (method, order, balance) => ({
  method,
  select: order === "scan" ? "scan" : undefined,
  balance: balance === "on" ? 1 : 0,
});
const $ = (sel) => document.querySelector(sel);

/* ---------- Measurements ---------- */
function stats(grid) {
  const pairs = {}, tiles = {};
  let n = 0, same = 0, cells = 0;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const a = grid[y][x];
      tiles[a] = (tiles[a] || 0) + 1;
      cells++;
      for (const [dx, dy, d] of [[1, 0, "h"], [0, 1, "v"]]) {
        const b = grid[y + dy]?.[x + dx];
        if (!b) continue;
        pairs[a + b + d] = (pairs[a + b + d] || 0) + 1;
        n++;
        if (a === b) same++;
      }
    }
  }
  for (const k in pairs) pairs[k] /= n;
  for (const k in tiles) tiles[k] /= cells;
  return { same: same / n, pairs, tiles };
}

// 1 - total variation distance between two distributions.
function match(p, q) {
  let tv = 0;
  for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) tv += Math.abs((p[k] || 0) - (q[k] || 0));
  return 1 - tv / 2;
}

function score(grid, ref) {
  const s = stats(grid);
  return { same: s.same, pairs: match(s.pairs, ref.pairs), mix: match(s.tiles, ref.tiles) };
}

const pct = (v) => `${Math.round(v * 100)}%`;

/* ---------- Rendering ---------- */
function asciiHTML(grid, env) {
  const colors = ENVS[env].colors;
  return grid
    .map((row) => {
      let html = "", run = "", cur = null;
      const flush = () => {
        if (!run) return;
        const [fg, bg] = colors[cur] || ["inherit", null];
        html += `<span style="color:${fg}${bg ? `;background:${bg}` : ""}">${run}</span>`;
        run = "";
      };
      for (const ch of row) {
        if (ch !== cur) { flush(); cur = ch; }
        run += ch;
      }
      flush();
      return html;
    })
    .join("\n");
}

function renderLegend(env) {
  const { legend, colors } = ENVS[env];
  $("#legend").innerHTML = Object.entries(legend)
    .map(([ch, name]) => {
      const [fg, bg] = colors[ch];
      return `<li><code style="color:${fg}${bg ? `;background:${bg}` : ""}">${ch}</code> ${name}</li>`;
    })
    .join("");
}

function metricsHTML(m, ref) {
  return `
    <div><dt>Same-tile neighbours</dt><dd>${pct(m.same)} <span class="muted">(sample ${pct(ref.same)})</span></dd></div>
    <div><dt>Neighbour-pair match</dt><dd>${pct(m.pairs)}</dd></div>
    <div><dt>Tile mix match</dt><dd>${pct(m.mix)}</dd></div>`;
}

function generate() {
  const env = ENVS[state.env];
  const model = TileWFC.learn(env.sample);
  const ref = stats(env.sample);
  $("#sample").innerHTML = asciiHTML(env.sample, state.env);
  renderLegend(state.env);
  $("#order-note").textContent = `${ORDERS[state.order].note} ${BALANCE[state.balance].note}`;

  for (const method of ["wfc", "swfc"]) {
    const grid = TileWFC.generate(model, COLS, ROWS, optsFor(method, state.order, state.balance));
    if (!grid) {
      $(`#out-${method}`).textContent = "Hit too many contradictions. Try again.";
      $(`#m-${method}`).innerHTML = "";
      continue;
    }
    $(`#out-${method}`).innerHTML = asciiHTML(grid, state.env);
    $(`#m-${method}`).innerHTML = metricsHTML(score(grid, ref), ref);
  }
}

/* ---------- Benchmark ---------- */
const RUNS = 8;
let benchToken = 0;

function benchmark() {
  const token = ++benchToken;
  const envKey = state.env;
  const env = ENVS[envKey];
  const model = TileWFC.learn(env.sample);
  const ref = stats(env.sample);
  const configs = [];
  for (const order of ["scan", "classic"]) {
    for (const balance of ["on", "off"]) {
      for (const method of ["wfc", "swfc"]) configs.push({ order, balance, method, runs: [], fails: 0 });
    }
  }
  const jobs = configs.flatMap((c) => Array.from({ length: RUNS }, () => c));
  const btn = $("#bench");
  btn.disabled = true;
  let done = 0;

  const step = () => {
    if (token !== benchToken) return;
    const c = jobs[done];
    let grid = null;
    while (!grid) {
      grid = TileWFC.run(model, COLS, ROWS, optsFor(c.method, c.order, c.balance));
      if (!grid) c.fails++;
    }
    c.runs.push(score(grid, ref));
    done++;
    $("#bench-status").textContent = `${done} / ${jobs.length} maps`;
    if (done < jobs.length) setTimeout(step, 0);
    else finish();
  };

  const finish = () => {
    btn.disabled = false;
    const avg = (c, k) => c.runs.reduce((s, r) => s + r[k], 0) / c.runs.length;
    const best = (k, better) => Math.max(...configs.map((c) => better(avg(c, k))));
    const bestSame = best("same", (v) => -Math.abs(v - ref.same));
    const bestPairs = best("pairs", (v) => v);
    const bestMix = best("mix", (v) => v);
    const cell = (v, isBest) => `<td${isBest ? ' class="best"' : ""}>${pct(v)}</td>`;
    $("#bench-status").textContent = `${env.label}, ${RUNS} maps of ${COLS}×${ROWS} per row. Best in each column is highlighted.`;
    $("#bench-table tbody").innerHTML = configs
      .map((c) => {
        const s = avg(c, "same"), p = avg(c, "pairs"), m = avg(c, "mix");
        return `<tr>
          <th scope="row">${c.method === "wfc" ? "Standard WFC" : "Stochastic WFC"} <span class="muted">· ${ORDERS[c.order].label.toLowerCase()} · ${BALANCE[c.balance].label.toLowerCase()}</span></th>
          ${cell(s, -Math.abs(s - ref.same) === bestSame)}${cell(p, p === bestPairs)}${cell(m, m === bestMix)}
          <td>${c.fails}</td>
        </tr>`;
      })
      .join("") + `<tr class="ref"><th scope="row">Training sample</th><td>${pct(ref.same)}</td><td>100%</td><td>100%</td><td></td></tr>`;
    $("#bench-table").hidden = false;
  };

  $("#bench-status").textContent = `0 / ${jobs.length} maps`;
  setTimeout(step, 0);
}

/* ---------- Controls ---------- */
function segmented(el, options, key) {
  el.innerHTML = Object.entries(options)
    .map(([k, o]) => `<button type="button" data-key="${k}" aria-pressed="${state[key] === k}">${o.label}</button>`)
    .join("");
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state[key] = b.dataset.key;
    el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    if (key === "env") {
      benchToken++; // cancel a running benchmark for the other environment
      $("#bench").disabled = false;
      $("#bench-table").hidden = true;
      $("#bench-status").textContent = "";
    }
    generate();
  });
}

segmented($("#env-tabs"), ENVS, "env");
segmented($("#order-tabs"), ORDERS, "order");
segmented($("#balance-tabs"), BALANCE, "balance");
$("#regen").addEventListener("click", generate);
$("#bench").addEventListener("click", benchmark);
generate();
