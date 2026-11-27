// ARAMETRIC profile artwork — v4.
// Every function returns a self-contained SVG string: presentation attributes only (no <style>, no classes),
// no external fonts or images, SMIL for motion. GitHub serves these through its image proxy as <img>,
// where SMIL runs and inline attributes render identically everywhere.
// Animations always end in the element's static state, so renderers without SMIL show the finished frame.

const W = 800, L = 40, R = 760;
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace";
const NUMBER = new Intl.NumberFormat("en-US");

const C = {
  ground: "#08090B", panel: "#0F1114", raise: "#15181C", ink: "#F2F3F5", soft: "#C5C8CE",
  muted: "#80858E", line: "#1E2126", edge: "#2A2E34", a1: "#4ADE80", a2: "#2DD4BF", warn: "#F5B54A",
};

export function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

const fmt = n => Number(n.toFixed(2)).toString();

let uid = 0;
const id = prefix => `${prefix}${++uid}`;

function attrs(map) {
  return Object.entries(map).filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${escapeXml(v)}"`).join("");
}

function svg(title, description, width, height, body, { defs = "", glow = null } = {}) {
  const glowId = "glow";
  const glowDef = glow
    ? `<radialGradient id="${glowId}" cx="${glow.cx}" cy="${glow.cy}" r="${glow.r ?? "60%"}">
      <stop offset="0" stop-color="${glow.color ?? C.a1}" stop-opacity="${glow.opacity ?? .16}"/>
      <stop offset="1" stop-color="${glow.color ?? C.a1}" stop-opacity="0"/>
    </radialGradient>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <defs>${glowDef}${defs}</defs>
  <rect width="${width}" height="${height}" rx="14" fill="${C.ground}"/>
  ${glow ? `<rect width="${width}" height="${height}" rx="14" fill="url(#${glowId})"/>` : ""}
  <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="13.5" fill="none" stroke="${C.edge}"/>
  ${body}
</svg>
`.replace(/^[ \t]+$/gm, "").replace(/\n{2,}/g, "\n");
}

// <text> with every style as an attribute. `content` may be raw tspans when `raw` is set.
function text(x, y, content, size, { fill = C.ink, weight, mono = false, anchor, ls, opacity, raw = false, extra = "", children = "" } = {}) {
  return `<text${attrs({
    x: fmt(x), y: fmt(y), "font-family": mono ? MONO : SANS, "font-size": size, fill, "font-weight": weight,
    "text-anchor": anchor, "letter-spacing": ls, opacity, "xml:space": mono ? "preserve" : undefined,
  })}${extra}>${raw ? content : escapeXml(content)}${children}</text>`;
}

const tspan = (value, fill, extra = {}) => `<tspan${attrs({ fill, ...extra })}>${escapeXml(value)}</tspan>`;

function rect(x, y, width, height, fill, extra = {}) {
  return `<rect${attrs({ x: fmt(x), y: fmt(y), width: fmt(width), height: fmt(height), fill, ...extra })}/>`;
}

function gradient(gid, from = C.a1, to = C.a2, x2 = "1", y2 = "0") {
  return `<linearGradient id="${gid}" x1="0" y1="0" x2="${x2}" y2="${y2}">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient>`;
}

// Fade an element in after `delay` seconds. Starts at 0 so nothing flashes, freezes at full opacity.
function fadeIn(delay, duration = .35) {
  const total = delay + duration;
  return `<animate attributeName="opacity" values="0;0;1" keyTimes="0;${fmt(delay / total)};1" dur="${fmt(total)}s" fill="freeze"/>`;
}

// Typewriter: a clip rect that grows one character at a time. Final width is generous so no glyph is clipped.
function typeClip(cid, x, y, height, chars, charW, delay, cps) {
  const steps = chars + 1;
  const duration = chars / cps;
  const total = delay + duration;
  const values = ["0", ...Array.from({ length: steps }, (_, i) => fmt(i * charW)), "900"];
  const times = ["0", ...Array.from({ length: steps }, (_, i) => fmt((delay + duration * i / chars) / total)), "1"];
  return {
    end: total,
    def: `<clipPath id="${cid}"><rect x="${fmt(x - 2)}" y="${fmt(y)}" width="900" height="${height}">
        <animate attributeName="width" values="${values.join(";")}" keyTimes="${times.join(";")}" dur="${fmt(total)}s" calcMode="discrete" fill="freeze"/>
      </rect></clipPath>`,
  };
}

// The ARAMETRIC mark: an "A" apex over a measured baseline — a chevron and a crossbar.
function mark(x, y, size, fill) {
  const s = size, sw = s / 5.5;
  return `<g transform="translate(${fmt(x)} ${fmt(y)})" fill="none" stroke="${fill}" stroke-width="${fmt(sw)}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${fmt(sw / 2)} ${fmt(s - sw / 2)}L${fmt(s / 2)} ${fmt(sw / 2)}L${fmt(s - sw / 2)} ${fmt(s - sw / 2)}"/>
      <path d="M${fmt(s * .3)} ${fmt(s * .66)}H${fmt(s * .7)}"/>
    </g>`;
}

// Status dot: full circle for live (with a soft pulse ring), half-filled for in-development.
function statusDot(cx, cy, r, color, half) {
  if (half) {
    return `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r - .6)}" fill="none" stroke="${color}" stroke-width="1.2"/>
      <path d="M${fmt(cx)} ${fmt(cy - r + .6)}A${fmt(r - .6)} ${fmt(r - .6)} 0 0 0 ${fmt(cx)} ${fmt(cy + r - .6)}Z" fill="${color}"/>`;
  }
  return `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" fill="${color}" opacity=".35">
        <animate attributeName="r" values="${fmt(r)};${fmt(r * 2.4)};${fmt(r * 2.4)}" keyTimes="0;.6;1" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".45;0;0" keyTimes="0;.6;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" fill="${color}"/>`;
}

function badge(x, y, label, color, half) {
  const width = Math.round(label.length * 7.3 + 36);
  return {
    width,
    svg: `<g>
      ${rect(x, y, width, 26, color, { rx: 13, "fill-opacity": ".1" })}
      ${rect(x + .5, y + .5, width - 1, 25, "none", { rx: 12.5, stroke: color, "stroke-opacity": ".55" })}
      ${statusDot(x + 15, y + 13, 4, color, half)}
      ${text(x + 27, y + 17.5, label, 11.5, { fill: color, weight: 700, mono: true, ls: 1 })}
    </g>`,
  };
}

// ── Hero ────────────────────────────────────────────────────────────────────────────────────────────

// Identicon of @whyahmetss (5×5, mirrored), rendered as an ASCII portrait.
const IDENTICON = ["#.#.#", "..#..", ".#.#.", "#####", "#...#"];
const RAMP = "##%#@##%#&#";

function portrait(cellW, cellH) {
  const rows = [];
  for (let r = 0; r < IDENTICON.length * cellH; r++) {
    let line = "";
    for (let c = 0; c < IDENTICON[0].length * cellW; c++) {
      const on = IDENTICON[Math.floor(r / cellH)][Math.floor(c / cellW)] === "#";
      line += on ? RAMP[(r * 7 + c * 3) % RAMP.length] : ((r * 3 + c) % 9 === 0 ? "·" : " ");
    }
    rows.push(line);
  }
  return rows;
}

const STACK = ["TypeScript", "Node.js", "Next.js", "Python", "FFmpeg", "HyperFrames"];
const INFO = [
  ["User", "ahmet@arametric"],
  ["Role", "Founder / Builder"],
  ["Studio", "Arametric"],
  ["Based", "İstanbul"],
  ["Stack", STACK.join(", ")],
  ["Shipping", "SıraGO, Creative Engine"],
];
const MOTTO = "Build systems that outlast you.";
const BLOCKS = ["#1F2328", "#F87171", "#4ADE80", "#FACC15", "#60A5FA", "#C084FC", "#2DD4BF", "#E5E7EB"];

// Split the info rows into terminal lines: aligned keys, the stack wrapped neofetch-style.
function infoLines(maxChars) {
  const pad = Math.max(...INFO.map(([k]) => k.length)) + 2;
  const lines = [];
  for (const [key, value] of INFO) {
    const label = `${key}:`.padEnd(pad);
    const parts = key === "Stack" ? STACK.map((s, i) => s + (i < STACK.length - 1 ? "," : "")) : [value];
    let current = "";
    let first = true;
    const flush = () => { lines.push({ key: first ? label : " ".repeat(pad), value: current, field: key }); first = false; current = ""; };
    for (const part of parts) {
      const next = current ? `${current} ${part}` : part;
      if (current && pad + next.length > maxChars) flush();
      current = current ? `${current} ${part}` : part;
    }
    flush();
  }
  return lines;
}

function infoValue(line) {
  if (line.field !== "Shipping") return tspan(line.value, C.soft);
  return `${tspan("SıraGO", C.a1, { "font-weight": 700 })}${tspan(", ", C.soft)}${tspan("Creative Engine", C.a2, { "font-weight": 700 })}`;
}

function chrome(width, title) {
  return `${rect(0, 0, width, 36, C.panel, { rx: 14 })}${rect(0, 22, width, 14, C.panel)}
    <path d="M0 36.5H${width}" stroke="${C.line}"/>
    <circle cx="22" cy="18" r="5.5" fill="#F87171"/><circle cx="40" cy="18" r="5.5" fill="#FACC15"/><circle cx="58" cy="18" r="5.5" fill="#4ADE80"/>
    ${text(width / 2, 22.5, title, 11.5, { fill: C.muted, mono: true, anchor: "middle" })}`;
}

// Lays out the terminal session. Each line types after the previous one; the cursor blinks once typing ends.
function terminal({ x, y, size, lead, maxChars, gid, titleSize }) {
  const charW = size * .6;
  const cps = 55;
  let clock = .55;
  const defs = [];
  const out = [];
  const typed = (lineY, chars, content, opts) => {
    const cid = id("t");
    const clip = typeClip(cid, x, lineY - size - 2, size + 8, chars, opts.charW ?? charW, clock, opts.cps ?? cps);
    defs.push(clip.def);
    out.push(`<g clip-path="url(#${cid})">${content}</g>`);
    clock = clip.end + .06;
  };

  // Title: brand + studio line.
  const titleY = y;
  typed(titleY, 9, text(x, titleY, "ARAMETRIC", titleSize, { fill: `url(#${gid})`, weight: 800, mono: true, ls: 2 }),
    { charW: titleSize * .6 + 2, cps: 30 });
  const subY = titleY + 22;
  const sub = "Creative & Technology Studio";
  typed(subY, sub.length, text(x, subY, sub, size - 1, { fill: C.muted, mono: true }), { charW: (size - 1) * .6 });
  out.push(`<path d="M${x} ${subY + 12.5}H${x + maxChars * charW}" stroke="${C.a1}" stroke-opacity=".6">${fadeIn(clock - .2)}</path>`);

  let lineY = subY + 12 + lead + 4;
  for (const line of infoLines(maxChars)) {
    const content = text(x, lineY, `${tspan(line.key, C.a1, { "font-weight": 700 })}${infoValue(line)}`, size, { mono: true, raw: true });
    typed(lineY, line.key.length + line.value.length, content, {});
    lineY += lead;
  }

  const blocksY = lineY - lead + 18;
  const bw = size * 1.6, bh = size;
  out.push(`<g>${fadeIn(clock)}${BLOCKS.map((c, i) => rect(x + i * (bw + 4), blocksY, bw, bh, c, { rx: 3 })).join("")}</g>`);
  clock += .25;

  const p1 = blocksY + bh + lead + 8;
  const promptTop = "┌──(ahmet@arametric)-[~]";
  typed(p1, promptTop.length, text(x, p1, promptTop, size - .5, { fill: C.muted, mono: true }), { cps: 90 });
  const p2 = p1 + lead - 4;
  const command = "build --systems-that-outlast-you";
  const prompt = `${tspan("└─$ ", C.muted)}${tspan(command, C.ink)}`;
  typed(p2, command.length + 4, text(x, p2, prompt, size - .5, { mono: true, raw: true }), { cps: 38 });

  const blinkAt = clock;
  const cursor = `<tspan fill="${C.a1}"> █<animate attributeName="fill-opacity" values="0;0" dur="${fmt(blinkAt)}s"/><animate attributeName="fill-opacity" values="1;0" dur="1.05s" begin="${fmt(blinkAt)}s" calcMode="discrete" repeatCount="indefinite"/></tspan>`;
  // The cursor sits in its own text run, placed after the command so it follows real glyph widths.
  out.push(text(x, p2, `${tspan("└─$ " + command, C.ink, { "fill-opacity": 0 })}${cursor}`, size - .5, { mono: true, raw: true }));

  return { svg: out.join("\n    "), defs: defs.join(""), bottom: p2 };
}

export function hero(compact) {
  const gid = "brand";
  const description = `ARAMETRIC — Creative & Technology Studio. ${INFO.map(([k, v]) => `${k}: ${v}`).join(". ")}. ${MOTTO}`;
  const title = "ARAMETRIC — ahmet@arametric";
  if (compact) {
    const width = 400;
    const art = portrait(4, 2);
    const artLines = art.map((l, i) => text(width / 2, 70 + i * 12.5, l, 11.5, { fill: C.a1, mono: true, anchor: "middle", children: fadeIn(.05 + i * .03, .25) })).join("");
    const term = terminal({ x: 26, y: 228, size: 12, lead: 21, maxChars: 48, gid, titleSize: 19 });
    const height = Math.round(term.bottom + 28);
    return svg(title, description, width, height, `
    ${chrome(width, "ahmet@arametric: ~ — zsh")}
    <g>${artLines}</g>
    ${term.svg}
  `, { defs: gradient(gid) + term.defs, glow: { cx: "50%", cy: "22%", r: "60%", opacity: .14 } });
  }
  const art = portrait(6, 3);
  const artLines = art.map((l, i) => text(40, 92 + i * 17, l, 12.5, { fill: C.a1, mono: true, children: fadeIn(.05 + i * .03, .25) })).join("");
  const term = terminal({ x: 318, y: 84, size: 13.5, lead: 24, maxChars: 54, gid, titleSize: 22 });
  const height = Math.round(term.bottom + 32);
  return svg(title, description, W, height, `
    ${chrome(W, "ahmet@arametric: ~ — zsh")}
    <g>${artLines}</g>
    <path d="M292.5 60V${height - 26}" stroke="${C.line}"/>
    ${term.svg}
  `, { defs: gradient(gid) + term.defs, glow: { cx: "16%", cy: "45%", r: "55%", opacity: .16 } });
}

// ── Products ────────────────────────────────────────────────────────────────────────────────────────

const PRODUCTS = {
  sirago: {
    name: "SıraGO",
    status: "LIVE", color: C.a1, half: false,
    tagline: "WhatsApp'tan yapay zekâ ile 7/24 randevu",
    features: ["TR / EN / AR yapay zekâ asistan", "Google Takvim senkronu", "Sesli mesajla randevu"],
    link: "sırago.com", cta: "Ziyaret et",
  },
  engine: {
    name: "Creative Engine",
    status: "IN DEVELOPMENT", color: C.a2, half: true,
    tagline: "Brief'ten yayına video prodüksiyon motoru",
    features: ["HyperFrames + FFmpeg render", "AI storyboard", "Otomatik kalite kontrol"],
    link: "arametric", cta: "Yakında",
  },
};

function siragoGlyph(x, y, color) {
  // A chat bubble that turns into a confirmed slot.
  return `<g>
      ${rect(x, y, 66, 30, C.raise, { rx: 9 })}
      ${rect(x + .5, y + .5, 65, 29, "none", { rx: 8.5, stroke: C.edge })}
      <path d="M${x + 12} ${y + 30}l-4 8l11-8z" fill="${C.raise}"/>
      ${rect(x + 10, y + 9, 34, 4, C.edge, { rx: 2 })}${rect(x + 10, y + 17, 22, 4, C.edge, { rx: 2 })}
      <circle cx="${x + 54}" cy="${y + 15}" r="7" fill="${color}"/>
      <path d="M${x + 50.5} ${y + 15}l2.5 2.5l4.5-5" fill="none" stroke="${C.ground}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

function engineGlyph(x, y, color) {
  // A tiny edit timeline with a travelling playhead.
  const tracks = [[[0, 26], [29, 22], [54, 18]], [[8, 34, true], [45, 27]], [[0, 16], [19, 53]]];
  const clips = tracks.map((row, t) => row.map(([cx, w, hot]) =>
    rect(x + cx, y + 4 + t * 12, w, 8, hot ? color : C.raise, { rx: 2.5, stroke: hot ? undefined : C.edge, "stroke-width": hot ? undefined : 1 })).join("")).join("");
  return `<g>${clips}
      <g>
        <path d="M${x + 38}.5 ${y}V${y + 42}" stroke="${color}" stroke-width="1.4"/>
        <path d="M${x + 34.5} ${y - 2}h7l-3.5 4z" fill="${color}"/>
        <animateTransform attributeName="transform" type="translate" values="-30 0;30 0;-30 0" dur="6s" repeatCount="indefinite"/>
      </g>
    </g>`;
}

export function product(kind) {
  const p = PRODUCTS[kind];
  const width = 400, height = 300;
  const gid = "accent";
  const status = badge(28, 28, p.status, p.color, p.half);
  const features = p.features.map((f, i) => {
    const fy = 186 + i * 24;
    return `${rect(28, fy - 9, 8, 8, p.color, { rx: 2, opacity: .9 })}
      ${text(46, fy, f, 14, { fill: C.soft })}`;
  }).join("\n      ");
  const glyph = kind === "sirago" ? siragoGlyph(306, 26, p.color) : engineGlyph(298, 34, p.color);
  const ctaY = 277;
  const cta = kind === "sirago"
    ? `${text(28, ctaY, p.link, 13.5, { fill: p.color, weight: 700, mono: true })}
      ${text(width - 28, ctaY, `${p.cta} →`, 13, { fill: C.ink, weight: 600, anchor: "end" })}`
    : `${text(28, ctaY, "Arametric · iç altyapı", 13, { fill: C.muted, mono: true })}
      ${text(width - 28, ctaY, `${p.cta} →`, 13, { fill: C.soft, weight: 600, anchor: "end" })}`;
  return svg(p.name, `${p.name} — ${p.tagline}. ${p.features.join(" · ")}. Durum: ${p.status}.`, width, height, `
    ${status.svg}
    ${glyph}
    ${text(28, 106, p.name, p.name.length > 8 ? 30 : 34, { weight: 800, ls: -.6 })}
    ${text(28, 134, p.tagline, 14.5, { fill: C.soft })}
    <path d="M28 160.5H${width - 28}" stroke="${C.line}"/>
    ${features}
    <path d="M28 250.5H${width - 28}" stroke="${C.line}"/>
    ${cta}
    ${rect(0, height - 3, width, 3, `url(#${gid})`, { "clip-path": "url(#edge)" })}
  `, {
    defs: `${gradient(gid, p.color, kind === "sirago" ? C.a2 : C.a1)}<clipPath id="edge"><rect width="${width}" height="${height}" rx="14"/></clipPath>`,
    glow: { cx: "88%", cy: "8%", r: "70%", opacity: .14, color: p.color },
  });
}

// ── Studio strip ────────────────────────────────────────────────────────────────────────────────────

export function studio() {
  const height = 124;
  const gid = "brand";
  const frames = [0, 1, 2].map(i => {
    const fx = 40 + i * 22, fy = 34 + (i === 1 ? -6 : 0);
    return `${rect(fx, fy, 30, 50, i === 1 ? `url(#${gid})` : C.raise, { rx: 6, stroke: i === 1 ? undefined : C.edge })}`;
  }).join("");
  const play = `<path d="M${40 + 22 + 11} ${28 + 18}l10 7l-10 7z" fill="${C.ground}"/>`;
  return svg("ARAMETRIC STUDIO", "ARAMETRIC STUDIO — Kısa video · Reels · Marka içerikleri. Kreatif prodüksiyon ve dijital pazarlama. Portfolyo.", W, height, `
    ${frames}${play}
    ${text(132, 44, "ARAMETRIC STUDIO", 12, { fill: `url(#${gid})`, weight: 800, mono: true, ls: 2.5 })}
    ${text(132, 76, "Kısa video · Reels · Marka içerikleri", 22, { weight: 800, ls: -.4 })}
    ${text(132, 100, "Kreatif prodüksiyon ve dijital pazarlama", 13.5, { fill: C.muted })}
    ${rect(R - 132, 44, 132, 36, C.a1, { rx: 18, "fill-opacity": ".1", stroke: C.a1, "stroke-opacity": ".6" })}
    ${text(R - 66, 67, "Portfolyo →", 14, { fill: C.a1, weight: 700, anchor: "middle" })}
  `, { defs: gradient(gid, C.a1, C.a2, "1", "1"), glow: { cx: "8%", cy: "50%", r: "45%", opacity: .14 } });
}

// ── Footer ──────────────────────────────────────────────────────────────────────────────────────────

export function footer() {
  const gid = "brand";
  return svg("ARAMETRIC", MOTTO, W, 84, `
    ${mark(L, 30, 24, `url(#${gid})`)}
    ${text(L + 36, 48, "ARAMETRIC", 15, { weight: 800, mono: true, ls: 3 })}
    ${text(L + 36 + 9 * 12.2, 48, "· Creative &amp; Technology Studio", 12, { fill: C.muted, mono: true, raw: true })}
    ${text(R, 49, MOTTO, 17, { fill: C.ink, weight: 700, anchor: "end", ls: -.2 })}
  `, { defs: gradient(gid), glow: { cx: "96%", cy: "50%", r: "40%", opacity: .12 } });
}

// ── Analytics (real GitHub data only) ───────────────────────────────────────────────────────────────

const RANGE_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const OPACITY = [0, .28, .5, .75, 1];
const caps = (x, y, label) => text(x, y, label, 11, { fill: C.muted, weight: 700, ls: 1.6 });

export function contributions(days) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const active = days.filter(day => day.count > 0).length;
  const range = `${RANGE_DATE.format(new Date(days[0].date))} – ${RANGE_DATE.format(new Date(days.at(-1).date))}`;
  const start = new Date(days[0].date).getUTCDay();
  const cell = 10.6, gap = 2, step = cell + gap;
  const weeks = Math.ceil((days.length + start) / 7);
  const gridW = weeks * step - gap;
  const x0 = Math.round((W - gridW) / 2), y0 = 112;
  const gid = "accent";
  const months = [];
  const cells = days.map((day, i) => {
    const k = i + start, w = Math.floor(k / 7), d = k % 7;
    const x = x0 + w * step, y = y0 + d * step;
    if (day.date.endsWith("-01") || i === 0) {
      const label = [x, MONTH.format(new Date(day.date))];
      // A partial first month yields to the first full month when their labels would collide.
      if (!months.length || x - months.at(-1)[0] > 40) months.push(label);
      else if (months.length === 1 && i > 0) months[0] = label;
    }
    return day.level
      ? rect(x, y, cell, cell, `url(#${gid})`, { rx: 2.4, "fill-opacity": OPACITY[day.level] })
      : rect(x, y, cell, cell, C.panel, { rx: 2.4 });
  });
  const legendY = y0 + 7 * step + 22;
  const lx = R - 36 - 5 * 15;
  const legend = OPACITY.map((o, i) => o
    ? rect(lx + i * 15, legendY - 10, 11, 11, `url(#${gid})`, { rx: 2.4, "fill-opacity": o })
    : rect(lx + i * 15, legendY - 10, 11, 11, C.panel, { rx: 2.4 })).join("");
  return svg("Contribution activity", `${NUMBER.format(total)} public contributions on ${active} active days, ${range}.`, W, legendY + 24, `
    ${caps(L, 36, "CONTRIBUTIONS")}
    ${text(L, 72, `${tspan(NUMBER.format(total), C.ink, { "font-size": 32, "font-weight": 800, "letter-spacing": -.6 })}${tspan("in the last year", C.soft, { "font-size": 13.5, dx: 10 })}`, 13.5, { raw: true })}
    ${text(R, 72, `${active} active days`, 12.5, { fill: C.muted, mono: true, anchor: "end" })}
    ${months.map(([x, label]) => text(x, y0 - 8, label, 10.5, { fill: C.muted })).join("")}
    <g>${cells.join("")}</g>
    ${text(L, legendY, range, 11, { fill: C.muted, mono: true })}
    ${text(lx - 8, legendY, "Less", 11, { fill: C.muted, anchor: "end" })}
    ${text(R, legendY, "More", 11, { fill: C.muted, anchor: "end" })}
    ${legend}
  `, { defs: gradient(gid, C.a1, C.a2, "1", "1") });
}

export function repositories(data) {
  const total = data.languages.reduce((sum, [, bytes]) => sum + bytes, 0);
  const leading = data.languages.slice(0, 5);
  const rest = total - leading.reduce((sum, [, bytes]) => sum + bytes, 0);
  const rows = rest > 0 ? [...leading, ["Other", rest]] : leading;
  const palette = [C.a1, C.a2, "#60A5FA", C.warn, "#F472B6", C.muted];
  const pct = v => v < .1 ? "<0.1%" : `${v.toFixed(1)}%`;
  const barW = R - L;
  let bx = L;
  const segments = rows.map(([, bytes], i) => {
    const w = total ? Math.max(2, barW * bytes / total) : 0;
    const out = rect(bx, 70, Math.max(0, w - 2), 10, palette[i], { rx: 3 });
    bx += w;
    return out;
  }).join("");
  const colW = barW / 3;
  const legend = rows.map(([label, bytes], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = L + col * colW, y = 118 + row * 30;
    const name = label.length > 16 ? `${label.slice(0, 15)}…` : label;
    return `<circle cx="${fmt(x + 5)}" cy="${y - 4.5}" r="4.5" fill="${palette[i]}"/>
      ${text(x + 18, y, name, 13.5, { weight: 600 })}
      ${text(col === 2 ? R : x + colW - 32, y, pct(bytes / total * 100), 12.5, { fill: C.muted, mono: true, anchor: "end" })}`;
  }).join("");
  const height = 118 + Math.ceil(rows.length / 3) * 30 + 2;
  const meta = `${data.repositories} public ${data.repositories === 1 ? "repository" : "repositories"}`;
  return svg("Languages", `${meta}. ${rows.map(([l, b]) => `${l} ${pct(b / total * 100)}`).join(", ")}.`, W, height, `
    ${caps(L, 42, "LANGUAGES")}
    ${text(R, 42, meta, 12.5, { fill: C.muted, mono: true, anchor: "end" })}
    ${rect(L, 70, barW, 10, C.panel, { rx: 3 })}
    ${segments}
    ${legend}
  `);
}

export function development(days) {
  const weeks = [];
  for (const day of days.slice(-92, -1)) {
    if (new Date(day.date).getUTCDay() === 0 || !weeks.length) weeks.push({ date: day.date, count: 0, days: 0 });
    weeks.at(-1).count += day.count;
    weeks.at(-1).days += 1;
  }
  const complete = weeks.filter(w => w.days === 7).slice(-12);
  const max = Math.max(1, ...complete.map(w => w.count));
  const top = 80, base = 178;
  const stepX = (R - L) / Math.max(1, complete.length - 1);
  const pts = complete.map((w, i) => [L + i * stepX, base - (base - top) * w.count / max]);
  const total = complete.reduce((s, w) => s + w.count, 0);
  const end = new Date(Date.parse(complete.at(-1).date) + 6 * 86_400_000);
  const range = `${RANGE_DATE.format(new Date(complete[0].date))} – ${RANGE_DATE.format(end)}`;
  // Smooth curve through points (Catmull-Rom → cubic Bézier).
  const path = pts.map(([x, y], i) => {
    if (!i) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
    const [x0, y0] = pts[i - 2] ?? pts[i - 1], [x1, y1] = pts[i - 1], [x3, y3] = pts[i + 1] ?? [x, y];
    const c1 = [x1 + (x - x0) / 6, Math.min(base, y1 + (y - y0) / 6)], c2 = [x - (x3 - x1) / 6, Math.min(base, y - (y3 - y1) / 6)];
    return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("");
  const gid = "accent", fid = "area";
  const peak = pts.reduce((a, p) => (p[1] < a[1] ? p : a), pts[0]);
  return svg("Development activity", `${NUMBER.format(total)} public contributions over the last 12 complete weeks (${range}). Weekly: ${complete.map(w => w.count).join(", ")}.`, W, 222, `
    ${caps(L, 42, "LAST 12 WEEKS")}
    ${text(R, 46, NUMBER.format(total), 24, { weight: 800, anchor: "end", fill: `url(#${gid})` })}
    ${text(R, 66, "contributions", 12, { fill: C.muted, anchor: "end" })}
    ${[top, (top + base) / 2, base].map(y => `<path d="M${L} ${y}.5H${R}" stroke="${C.line}" stroke-dasharray="2 4"/>`).join("")}
    <path d="${path}L${R} ${base}L${L} ${base}Z" fill="url(#${fid})"/>
    <path d="${path}" fill="none" stroke="url(#${gid})" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="${peak[0].toFixed(1)}" cy="${peak[1].toFixed(1)}" r="9" fill="${C.a1}" fill-opacity=".18"/>
    <circle cx="${peak[0].toFixed(1)}" cy="${peak[1].toFixed(1)}" r="4" fill="${C.a1}"/>
    ${text(L, 204, range, 11, { fill: C.muted, mono: true })}
  `, { defs: `${gradient(gid)}
    <linearGradient id="${fid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.a1}" stop-opacity=".28"/><stop offset="1" stop-color="${C.a1}" stop-opacity="0"/>
    </linearGradient>` });
}
