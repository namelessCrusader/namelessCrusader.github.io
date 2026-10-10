// Renders the page from SITE (data.js) and draws the pixel-art bits.

const $ = (sel) => document.querySelector(sel);

/* ---------- Pixel sprites for the hobby cards ----------
   Each sprite is the LEFT half (6px wide); it gets mirrored into a 12px-wide symmetric sprite. */
const SPRITES = {
  cat: {
    pal: { k: "#1d2b53", o: "#ffccaa", p: "#ff77a8", e: "#008751" },
    half: [".k....", "kok...", "kpok..", "koookk", "kooooo", "kooeoo", "koooop", ".koooo", "..kkkk"],
  },
  card: {
    pal: { k: "#1d2b53", b: "#ab5236", y: "#ffec27", o: "#ffa300", r: "#7e2553" },
    half: [".kkkkk", ".kbbbb", ".kbbyy", ".kbyoo", ".kbyoo", ".kbyor", ".kbyor", ".kbyoo", ".kbyoo", ".kbbyy", ".kbbbb", ".kkkkk"],
  },
  d20: {
    pal: { k: "#1d2b53", o: "#ff004d", w: "#fff1e8" },
    half: ["....kk", "..kkow", ".kooow", ".koowo", "koowoo", "kowooo", "kwwwww", "kowooo", "koowoo", ".koowo", "..kkow", "....kk"],
  },
  book: {
    pal: { k: "#1d2b53", p: "#fff1e8", l: "#83769c" },
    half: [".kkk..", "kpppkk", "kpllpk", "kppppk", "kpllpk", "kppppk", "kpllpk", "kkkkpk", "...kkk"],
  },
  pot: {
    pal: { k: "#1d2b53", s: "#fff1e8", l: "#c2c3c7", o: "#ff004d" },
    half: ["..s...", "...s..", "..s..k", ".kkkkk", "klllll", "kkkkkk", "kkoooo", ".koooo", "kkoooo", ".koooo", ".kkkkk"],
  },
};

function spriteSVG(name) {
  const { pal, half } = SPRITES[name];
  const rows = half.map((r) => r + [...r].reverse().join(""));
  let rects = "";
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (pal[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[ch]}"/>`;
    })
  );
  return `<svg viewBox="0 0 12 ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

/* ---------- Content ---------- */
function render() {
  $("#about-paras").innerHTML = SITE.about.map((p) => `<p>${p}</p>`).join("");
  $("#links").innerHTML = SITE.links
    .map((l) => `<a class="btn" href="${l.href}"${l.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${l.label}</a>`)
    .join("");

  $("#news-list").innerHTML = SITE.news
    .map((n) => `<li><span class="date">${n.date}</span><span>${n.text}</span></li>`)
    .join("");

  const me = (s) => s.replace(SITE.name, `<b>${SITE.name}</b>`);
  $("#pub-list").innerHTML = SITE.publications
    .map((p) => `
      <li class="pub">
        <div class="pub-head">
          <p class="pub-title">${p.title}</p>
          <span class="tag${p.venue === "Preprint" ? " preprint" : ""}">${p.venue} ${p.year}</span>
        </div>
        <p class="authors">${me(p.authors)}</p>
        <p class="pub-summary">${p.summary}</p>
        <div class="pub-links">${p.links.map((l) => `<a class="btn small" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join("")}</div>
      </li>`)
    .join("");

  $("#exp-list").innerHTML = SITE.experience
    .map((e) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${e.org} <span class="muted">· ${e.role}</span></span>
          <span class="entry-meta">${e.when} · ${e.where}</span>
        </div>
        <p>${e.text}</p>
      </div>`)
    .join("");

  $("#proj-list").innerHTML = SITE.projects
    .map((p) => `
      <div class="entry">
        <div class="entry-head">
          <a class="entry-title" href="${p.href}" target="_blank" rel="noopener">${p.title}</a>
          <span class="entry-meta">${p.when}</span>
        </div>
        <p>${p.text}</p>
        ${p.demo ? `<a class="btn small demo" href="${p.demo.href}">${p.demo.label}</a>` : ""}
      </div>`)
    .join("");

  $("#hobby-list").innerHTML = SITE.hobbies
    .map((h) => `
      <article class="card${h.facedown ? " facedown" : ""}"${h.facedown ? ' data-egg title="Set face-down"' : ""}>
        <div class="card-name"><span>${h.name}</span></div>
        <div class="card-art">${spriteSVG(h.sprite)}</div>
        <div class="card-text">
          <span class="card-type">[${h.type}]</span>
          ${h.text}
          <div class="card-stats">ATK/${h.atk} DEF/${h.def}</div>
        </div>
      </article>`)
    .join("");

  $("#year").textContent = new Date().getFullYear();
  $("#level-count").textContent = SWFC_MODEL.levels.length;
}

/* ---------- Photo: pixel art by default, real photo on hover/tap ---------- */
function setupPhoto() {
  const fig = $("#photo");
  const { real, pixel, alt } = SITE.photo;
  fig.innerHTML = `<img class="real" src="${real}" alt="${alt}">`;
  fig.addEventListener("click", () => fig.classList.toggle("reveal"));
  if (pixel) {
    fig.insertAdjacentHTML("beforeend", `<img class="pixel" src="${pixel}" alt="" aria-hidden="true">`);
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.className = "pixel";
  canvas.setAttribute("aria-hidden", "true");
  fig.appendChild(canvas);
  const img = fig.querySelector(".real");
  const draw = () => pixelArt(img, canvas, 96, 12);
  if (img.complete && img.naturalWidth) draw();
  else img.addEventListener("load", draw);
}

// Downscale to `width` pixels and reduce to `k` colours picked from the image itself (k-means).
function pixelArt(img, canvas, width, k) {
  // Halve repeatedly first so the final downscale averages cleanly.
  let src = img, w = img.naturalWidth, h = img.naturalHeight;
  while (w / 2 > width) {
    const c = document.createElement("canvas");
    c.width = w = Math.round(w / 2);
    c.height = h = Math.round(h / 2);
    c.getContext("2d").drawImage(src, 0, 0, w, h);
    src = c;
  }
  canvas.width = width;
  canvas.height = Math.round((width * img.naturalHeight) / img.naturalWidth);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);

  let data;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (e) {
    return; // browsers block pixel reads for local files; keep the plain downscale
  }
  const d = data.data;
  const px = [];
  for (let i = 0; i < d.length; i += 4) {
    // A little extra saturation and contrast so the flat colours read well.
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    px.push([0, 1, 2].map((c) => (l + (d[i + c] - l) * 1.15 - 128) * 1.08 + 128));
  }
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const closest = (p, cents) => cents.reduce((bi, c, j) => (dist(p, c) < dist(p, cents[bi]) ? j : bi), 0);
  let cents = Array.from({ length: k }, (_, j) => px[Math.floor(((j + 0.5) / k) * px.length)].slice());
  for (let it = 0; it < 12; it++) {
    const sums = cents.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      const s = sums[closest(p, cents)];
      s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    cents = cents.map((c, j) => (sums[j][3] ? sums[j].slice(0, 3).map((v) => v / sums[j][3]) : c));
  }
  px.forEach((p, n) => {
    const c = cents[closest(p, cents)];
    for (let ch = 0; ch < 3; ch++) d[n * 4 + ch] = Math.max(0, Math.min(255, Math.round(c[ch])));
  });
  ctx.putImageData(data, 0, 0);
}

/* ---------- Level strip (VGLC tiles, 8x8 each, drawn at 3x) ---------- */
const TILES = {
  X: { pal: { G: "#00e436", g: "#008751", b: "#ab5236", d: "#7e2553" },
       rows: ["GGGGGGGG", "GgGGGGgG", "bbgbbbbb", "bbbbbdbb", "bdbbbbbb", "bbbbbbdb", "bbbdbbbb", "bbbbbbbb"] },
  dirt: { pal: { b: "#ab5236", d: "#7e2553" },
       rows: ["bbbbbbbb", "bbdbbbbb", "bbbbbbdb", "bbbbbbbb", "bdbbbbbb", "bbbbbdbb", "bbbbbbbb", "bbbdbbbb"] },
  S: { pal: { r: "#ab5236", m: "#1d2b53" },
       rows: ["rrrmrrrr", "rrrmrrrr", "mmmmmmmm", "rrrrrrmr", "rrrrrrmr", "mmmmmmmm", "rrrmrrrr", "rrrmrrrr"] },
  "?": { pal: { k: "#1d2b53", y: "#ffa300", w: "#fff1e8" },
       rows: ["kkkkkkkk", "kyyyyyyk", "kyywwyyk", "kywyywyk", "kyyywyyk", "kyyyyyyk", "kyyywyyk", "kkkkkkkk"] },
  "<": { pal: { k: "#1d2b53", g: "#008751", G: "#00e436" },
       rows: ["kkkkkkkk", "kGgGgggg", "kGgGgggg", "kGgGgggg", "kkkkkkkk", ".kGgGggg", ".kGgGggg", ".kGgGggg"] },
  ">": { pal: { k: "#1d2b53", g: "#008751" },
       rows: ["kkkkkkkk", "gggggggk", "gggggggk", "gggggggk", "kkkkkkkk", "ggggggk.", "ggggggk.", "ggggggk."] },
  "[": { pal: { k: "#1d2b53", g: "#008751", G: "#00e436" },
       rows: Array(8).fill(".kGgGggg") },
  "]": { pal: { k: "#1d2b53", g: "#008751" },
       rows: Array(8).fill("ggggggk.") },
  o: { pal: { y: "#ffa300", w: "#ffec27" },
       rows: ["........", "...yy...", "..ywyy..", "..ywyy..", "..ywyy..", "..yyyy..", "...yy...", "........"] },
  E: { pal: { p: "#7e2553", w: "#fff1e8", k: "#1d2b53" },
       rows: ["........", "..pppp..", ".pppppp.", "pwkppwkp", "pwkppwkp", "pppppppp", ".pppppp.", ".k....k."] },
  B: { pal: { k: "#1d2b53", d: "#5f574f", w: "#c2c3c7" },
       rows: ["kkkkkkkk", "kddddddk", "kdwwdddk", "kdwkkddk", "kddkkddk", "kddddddk", "kddddddk", "kkkkkkkk"] },
  b: { pal: { k: "#1d2b53", d: "#5f574f" },
       rows: [".kkkkkk.", ".kddddk.", ".kdkkdk.", ".kddddk.", ".kddddk.", ".kdkkdk.", ".kddddk.", "kkkkkkkk"] },
};
TILES.Q = TILES["?"];

function drawTile(ctx, tile, tx, ty) {
  const t = TILES[tile];
  if (!t) return;
  t.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (!t.pal[ch]) return;
      ctx.fillStyle = t.pal[ch];
      ctx.fillRect(tx * 8 + x, ty * 8 + y, 1, 1);
    })
  );
}

let levelCols = 0;
function drawLevel(force = false) {
  const canvas = $("#level");
  const cols = Math.max(24, Math.min(160, Math.round(canvas.parentElement.clientWidth / 24)));
  if (!force && cols === levelCols) return;
  levelCols = cols;

  const skip = 2; // the top rows of a 14-row VGLC level are almost always sky
  const grid = SWFC.generate(cols).slice(skip);
  const rows = grid.length;
  canvas.width = cols * 8;
  canvas.height = (rows + 1) * 8;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      // VGLC uses X for ground and stairs alike: grass on top, dirt underneath.
      const buried = ch === "X" && y > 0 && grid[y - 1][x] === "X";
      drawTile(ctx, buried ? "dirt" : ch, x, y);
    })
  );
  // Dirt under anything standing on the ground row (not under gaps).
  [...grid[rows - 1]].forEach((ch, x) => { if (ch !== "-") drawTile(ctx, "dirt", x, rows); });
}

render();
setupPhoto();
drawLevel(true);
$("#reroll").addEventListener("click", () => drawLevel(true));
$("#level").addEventListener("click", () => drawLevel(true));
let resizeTimer;
addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => drawLevel(), 150); });
