// EVERY profile artwork — v2 ("quiet premium").
// Every function returns a self-contained SVG string. No external fonts or images,
// so GitHub's image proxy renders them the same everywhere. Light/dark via prefers-color-scheme.

const WIDTH = 640;
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Liberation Mono', monospace";
const NUMBER = new Intl.NumberFormat("en-US");

export function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

let uid = 0;
const id = prefix => `${prefix}${++uid}`;

function svg(title, description, height, body, { width = WIDTH, css = "", defs = "", glow = null } = {}) {
  const glowId = id("glow");
  const glowLayer = glow
    ? `<radialGradient id="${glowId}" cx="${glow.cx}" cy="${glow.cy}" r="${glow.r ?? "60%"}">
      <stop offset="0" class="g-glow" stop-opacity="${glow.opacity ?? .22}"/>
      <stop offset="1" class="g-glow" stop-opacity="0"/>
    </radialGradient>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <defs>${glowLayer}${defs}</defs>
  <style>
    svg { --ground:#08090B; --panel:#0F1114; --raise:#15181C; --ink:#F2F3F5; --soft:#C5C8CE; --muted:#80858E; --line:#1E2126; --edge:#2A2E34;
          --a1:#7C8CFF; --a2:#38D5F5; --ok:#3DDC97; --warn:#F5B54A; }
    @media (prefers-color-scheme: light) {
      svg { --ground:#FFFFFF; --panel:#F7F8FA; --raise:#FFFFFF; --ink:#0B0D12; --soft:#2E333B; --muted:#646A74; --line:#E7E9ED; --edge:#D9DCE1;
            --a1:#4F5BD5; --a2:#0E9FC2; --ok:#12A66B; --warn:#C98512; }
    }
    text { font-family:${SANS}; fill:#F2F3F5; fill:var(--ink); }
    .mono { font-family:${MONO}; }
    .soft { fill:#C5C8CE; fill:var(--soft); }
    .muted { fill:#80858E; fill:var(--muted); }
    .ground { fill:#08090B; fill:var(--ground); }
    .panel { fill:#0F1114; fill:var(--panel); }
    .raise { fill:#15181C; fill:var(--raise); }
    .line { fill:none; stroke:#1E2126; stroke:var(--line); }
    .edge { fill:none; stroke:#2A2E34; stroke:var(--edge); }
    .a1 { fill:#7C8CFF; fill:var(--a1); }
    .a2 { fill:#38D5F5; fill:var(--a2); }
    .s-a1 { fill:none; stroke:#7C8CFF; stroke:var(--a1); }
    .ok { fill:#3DDC97; fill:var(--ok); }
    .warn { fill:#F5B54A; fill:var(--warn); }
    .g-a1 { stop-color:#7C8CFF; stop-color:var(--a1); }
    .g-a2 { stop-color:#38D5F5; stop-color:var(--a2); }
    .g-glow { stop-color:#7C8CFF; stop-color:var(--a1); }
    .w5 { font-weight:500; } .w6 { font-weight:600; } .w7 { font-weight:700; }
    .caps { letter-spacing:1.6px; font-weight:600; }
    ${css}
  </style>
  <rect class="ground" width="${width}" height="${height}" rx="14"/>
  ${glow ? `<rect width="${width}" height="${height}" rx="14" fill="url(#${glowId})"/>` : ""}
  <rect class="edge" x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="13.5"/>
  ${body}
</svg>
`.replace(/^[ \t]+$/gm, "");
}

function text(x, y, value, size, classes = "", attributes = "") {
  // CSS "text { fill }" outranks presentation attributes, so gradient/colour fills must be inline styles.
  attributes = attributes.replace(/fill="([^"]+)"/g, 'style="fill:$1"');
  return `<text x="${x}" y="${y}" font-size="${size}"${classes ? ` class="${classes}"` : ""}${attributes ? ` ${attributes}` : ""}>${escapeXml(value)}</text>`;
}

function rect(x, y, width, height, classes = "", attributes = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="${classes}"${attributes ? ` ${attributes}` : ""}/>`;
}

function gradient(gid, x2 = "1", y2 = "0") {
  return `<linearGradient id="${gid}" x1="0" y1="0" x2="${x2}" y2="${y2}">
      <stop offset="0" class="g-a1"/><stop offset="1" class="g-a2"/>
    </linearGradient>`;
}

// The EVERY mark: an "E" built from three bars, the middle one shorter.
function mark(x, y, size, fill) {
  const bar = size / 5;
  return `<g transform="translate(${x} ${y})">
      <rect width="${size}" height="${bar}" rx="${bar / 2}" fill="${fill}"/>
      <rect y="${size / 2 - bar / 2}" width="${size * .66}" height="${bar}" rx="${bar / 2}" fill="${fill}"/>
      <rect y="${size - bar}" width="${size}" height="${bar}" rx="${bar / 2}" fill="${fill}"/>
    </g>`;
}

function pill(x, y, label, { dot = null, mono = false } = {}) {
  const w = Math.round(label.length * (mono ? 7.4 : 6.75) + (dot ? 34 : 24));
  return {
    width: w,
    svg: `<g>
      ${rect(x, y, w, 26, "raise", 'rx="13"')}
      ${rect(x + .5, y + .5, w - 1, 25, "edge", 'rx="12.5"')}
      ${dot ? `<circle cx="${x + 14}" cy="${y + 13}" r="3.5" class="${dot}"/>` : ""}
      ${text(x + (dot ? 25 : 12), y + 17.5, label, 12, `${mono ? "mono " : ""}soft w5`)}
    </g>`,
  };
}

function pillRow(x, y, labels, maxWidth, options) {
  let cx = x, cy = y;
  const out = [];
  for (const label of labels) {
    const probe = pill(0, 0, label, options);
    if (cx + probe.width > x + maxWidth) { cx = x; cy += 34; }
    out.push(pill(cx, cy, label, options).svg);
    cx += probe.width + 8;
  }
  return out.join("");
}

const FOCUS = ["Artificial Intelligence", "Software Development", "Business Automation", "Creative Technology", "Digital Products"];

export function hero(compact) {
  const gid = id("grad");
  if (compact) {
    return svg("EVERY — @whyahmetss", "Founder and builder. Building systems that outlast their creators.", 320, `
    ${mark(28, 30, 22, `url(#${gid})`)}
    ${text(60, 47, "EVERY", 15, "w7", 'letter-spacing="3"')}
    ${text(28, 112, "Building systems", 30, "w7", 'letter-spacing="-.6"')}
    ${text(28, 148, "that outlast", 30, "w7", 'letter-spacing="-.6"')}
    ${text(28, 184, "their creators.", 30, "w7", `letter-spacing="-.6" fill="url(#${gid})"`)}
    ${text(28, 222, "@whyahmetss · Founder / Builder", 14, "muted w5")}
    ${pillRow(28, 248, ["AI", "Software", "Automation", "Creative Tech"], 344)}
  `, { width: 400, defs: gradient(gid), glow: { cx: "85%", cy: "0%", r: "75%", opacity: .28 } });
  }
  return svg("EVERY — @whyahmetss", `Founder and builder. Building systems that outlast their creators. Focus: ${FOCUS.join(", ")}.`, 330, `
    ${mark(40, 38, 22, `url(#${gid})`)}
    ${text(72, 55, "EVERY", 15, "w7", 'letter-spacing="3"')}
    ${text(600, 55, "@whyahmetss", 13, "mono muted", 'text-anchor="end"')}
    <path class="line" d="M40 84.5H600"/>
    ${text(40, 142, "Building systems that", 40, "w7", 'letter-spacing="-1"')}
    ${text(40, 190, "outlast their creators.", 40, "w7", `letter-spacing="-1" fill="url(#${gid})"`)}
    ${text(40, 228, "Founder / Builder — products at the edge of AI, automation and video.", 15, "soft")}
    ${pillRow(40, 256, FOCUS, 560)}
  `, { defs: gradient(gid), glow: { cx: "88%", cy: "-10%", r: "70%", opacity: .3 } });
}

function siragoArt(x, y, gid) {
  // A small appointment board: time column + slots, one booked with the accent gradient.
  const times = ["09:00", "10:30", "12:00", "14:30"];
  const rows = times.map((t, i) => {
    const ry = y + 14 + i * 34;
    const booked = i === 1;
    return `${text(x, ry + 17, t, 11, "mono muted")}
      ${rect(x + 46, ry, 158, 26, booked ? "" : "raise", `rx="7"${booked ? ` fill="url(#${gid})"` : ""}`)}
      ${booked ? "" : rect(x + 46.5, ry + .5, 157, 25, "edge", 'rx="6.5"')}
      ${booked ? text(x + 58, ry + 17.5, "Booked · confirmed", 11, "w6", 'fill="#0B0D12"') : rect(x + 58, ry + 11, 46 + (i * 17) % 40, 4, "edge", 'rx="2"')}`;
  }).join("");
  return rows;
}

function engineArt(x, y, gid) {
  // A miniature edit timeline: three tracks, clips, and a playhead.
  const tracks = [[[0, 70], [76, 60], [140, 58]], [[18, 96, true], [120, 70]], [[0, 44], [50, 140]]];
  const clips = tracks.map((clips, t) => clips.map(([cx, w, hot]) =>
    rect(x + cx, y + 20 + t * 34, w, 24, hot ? "" : "raise", `rx="6"${hot ? ` fill="url(#${gid})"` : ""}`) +
    (hot ? "" : rect(x + cx + .5, y + 20.5 + t * 34, w - 1, 23, "edge", 'rx="5.5"'))).join("")).join("");
  const ticks = Array.from({ length: 11 }, (_, i) => `<path class="edge" d="M${x + i * 20}.5 ${y + 4}V${y + (i % 5 ? 9 : 12)}"/>`).join("");
  return `${ticks}${clips}
      <path class="s-a1" stroke-width="1.5" d="M${x + 112}.5 ${y + 2}V${y + 132}"/>
      <path class="a1" d="M${x + 106} ${y}h13l-6.5 7z"/>`;
}

export function product(creative) {
  const gid = id("grad");
  const name = creative ? "Creative Engine" : "SıraGo";
  const status = creative ? ["In development", "warn"] : ["Open for sign-up", "ok"];
  const lines = creative
    ? ["AI-assisted video production", "infrastructure for brands."]
    : ["Appointments and automation", "for service businesses."];
  const link = creative ? "Private beta" : "sırago.com  →";
  const statusPill = pill(36, 34, status[0], { dot: status[1] });
  return svg(name, `${name}: ${lines.join(" ")} Status: ${status[0]}.`, 210, `
    ${statusPill.svg}
    ${text(36, 104, name, 32, "w7", 'letter-spacing="-.8"')}
    ${text(36, 134, lines[0], 15, "soft")}
    ${text(36, 156, lines[1], 15, "soft")}
    ${text(36, 186, link, 13, creative ? "mono muted" : "w6", creative ? "" : `fill="url(#${gid})"`)}
    ${rect(372, 14, 254, 182, "panel", 'rx="10"')}
    ${rect(372.5, 14.5, 253, 181, "line", 'rx="9.5"')}
    ${creative ? engineArt(392, 30, gid) : siragoArt(392, 22, gid)}
  `, { defs: gradient(gid), glow: { cx: creative ? "95%" : "90%", cy: "50%", r: "55%", opacity: .16 } });
}

const STACK = [
  ["JavaScript", "#F7DF1E"], ["TypeScript", "#3178C6"], ["Python", "#4B8BBE"],
  ["React", "#61DAFB"], ["Node.js", "#5FA04E"], ["PostgreSQL", "#4169E1"],
];

export function technology() {
  const cells = STACK.map(([label, color], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 36 + col * 192, y = 62 + row * 50;
    return `${rect(x, y, 180, 40, "panel", 'rx="9"')}
      ${rect(x + .5, y + .5, 179, 39, "line", 'rx="8.5"')}
      <circle cx="${x + 20}" cy="${y + 20}" r="5" fill="${color}"/>
      ${text(x + 36, y + 25, label, 14, "w6")}`;
  }).join("");
  return svg("Technology stack", `Selected technologies: ${STACK.map(([l]) => l).join(", ")}.`, 192, `
    ${text(36, 40, "STACK", 11, "caps muted")}
    ${text(604, 40, "tools I ship with", 12, "mono muted", 'text-anchor="end"')}
    ${cells}
  `);
}

export function footer() {
  const gid = id("grad");
  return svg("EVERY", "Build for tomorrow.", 72, `
    ${mark(36, 26, 20, `url(#${gid})`)}
    ${text(66, 42, "EVERY", 14, "w7", 'letter-spacing="3"')}
    ${text(604, 42, "Build for tomorrow.", 14, "muted w5", 'text-anchor="end"')}
  `, { defs: gradient(gid) });
}

const RANGE_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const OPACITY = [0, .28, .5, .75, 1];

export function contributions(days) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const active = days.filter(day => day.count > 0).length;
  const range = `${RANGE_DATE.format(new Date(days[0].date))} – ${RANGE_DATE.format(new Date(days.at(-1).date))}`;
  const start = new Date(days[0].date).getUTCDay();
  const cell = 9, gap = 1.6, step = cell + gap;
  const weeks = Math.ceil((days.length + start) / 7);
  const gridW = weeks * step - gap;
  const x0 = Math.round((WIDTH - gridW) / 2), y0 = 106;
  const gid = id("grad");
  const months = [];
  const cells = days.map((day, i) => {
    const k = i + start, w = Math.floor(k / 7), d = k % 7;
    const x = (x0 + w * step).toFixed(1), y = (y0 + d * step).toFixed(1);
    if (day.date.endsWith("-01") || i === 0) {
      const mx = x0 + w * step;
      if (!months.length || mx - months.at(-1)[0] > 36) months.push([mx, MONTH.format(new Date(day.date))]);
    }
    return day.level
      ? rect(x, y, cell, cell, "", `rx="2" fill="url(#${gid})" fill-opacity="${OPACITY[day.level]}"`)
      : rect(x, y, cell, cell, "panel", 'rx="2"');
  });
  return svg("Contribution activity", `${NUMBER.format(total)} public contributions on ${active} active days, ${range}.`, 222, `
    ${text(36, 46, NUMBER.format(total), 30, "w7", 'letter-spacing="-.6"')}
    ${text(36, 68, "contributions in the last year", 13, "soft")}
    ${text(604, 44, `${active} active days`, 12, "mono muted", 'text-anchor="end"')}
    ${months.map(([x, label]) => text(x, 98, label, 10, "muted")).join("")}
    <g>${cells.join("")}</g>
    ${text(36, 204, range, 11, "mono muted")}
    ${text(604 - 5 * 13 - 8, 204, "Less", 11, "muted", 'text-anchor="end"')}
    ${OPACITY.map((o, i) => o
      ? rect(604 - (5 - i) * 13, 195, 9, 9, "", `rx="2" fill="url(#${gid})" fill-opacity="${o}"`)
      : rect(604 - (5 - i) * 13, 195, 9, 9, "panel", 'rx="2"')).join("")}
  `, { defs: gradient(gid, "1", "1") });
}

export function repositories(data) {
  const total = data.languages.reduce((sum, [, bytes]) => sum + bytes, 0);
  const leading = data.languages.slice(0, 5);
  const rest = total - leading.reduce((sum, [, bytes]) => sum + bytes, 0);
  const rows = rest > 0 ? [...leading, ["Other", rest]] : leading;
  const palette = ["var(--a1)", "var(--a2)", "#3DDC97", "#F5B54A", "#F472B6", "#80858E"];
  const fallback = ["#7C8CFF", "#38D5F5", "#3DDC97", "#F5B54A", "#F472B6", "#80858E"];
  const fmt = v => v < .1 ? "<0.1%" : `${v.toFixed(1)}%`;
  const barW = 568;
  let bx = 36;
  const segments = rows.map(([, bytes], i) => {
    const w = total ? Math.max(2, barW * bytes / total) : 0;
    const out = `<rect x="${bx.toFixed(2)}" y="78" width="${Math.max(0, w - 2).toFixed(2)}" height="10" rx="3" style="fill:${fallback[i]};fill:${palette[i]}"/>`;
    bx += w;
    return out;
  }).join("");
  const legend = rows.map(([label, bytes], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 36 + col * 192, y = 124 + row * 28;
    const name = label.length > 14 ? `${label.slice(0, 13)}…` : label;
    return `<circle cx="${x + 5}" cy="${y - 4}" r="4.5" style="fill:${fallback[i]};fill:${palette[i]}"/>
      ${text(x + 18, y, name, 13, "w6")}
      ${text(x + 170, y, fmt(bytes / total * 100), 12, "mono muted", 'text-anchor="end"')}`;
  }).join("");
  const height = 124 + Math.ceil(rows.length / 3) * 28 + 6;
  const meta = `${data.repositories} public ${data.repositories === 1 ? "repository" : "repositories"}`;
  return svg("Languages", `${meta}. ${rows.map(([l, b]) => `${l} ${fmt(b / total * 100)}`).join(", ")}.`, height, `
    ${text(36, 44, "LANGUAGES", 11, "caps muted")}
    ${text(604, 44, meta, 12, "mono muted", 'text-anchor="end"')}
    ${rect(36, 78, barW, 10, "panel", 'rx="3"')}
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
  const top = 78, base = 176, left = 36, right = 604;
  const stepX = (right - left) / Math.max(1, complete.length - 1);
  const pts = complete.map((w, i) => [left + i * stepX, base - (base - top) * w.count / max]);
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
  const gid = id("grad"), fid = id("fill");
  const peak = pts.reduce((a, p) => (p[1] < a[1] ? p : a), pts[0]);
  return svg("Development activity", `${NUMBER.format(total)} public contributions over the last 12 complete weeks (${range}). Weekly: ${complete.map(w => w.count).join(", ")}.`, 224, `
    ${text(36, 44, "LAST 12 WEEKS", 11, "caps muted")}
    ${text(604, 46, NUMBER.format(total), 22, "w7", `text-anchor="end" fill="url(#${gid})"`)}
    ${text(604, 66, "contributions", 12, "muted", 'text-anchor="end"')}
    ${[top, (top + base) / 2, base].map(y => `<path class="line" stroke-dasharray="2 4" d="M${left} ${y}.5H${right}"/>`).join("")}
    <path d="${path}L${right} ${base}L${left} ${base}Z" fill="url(#${fid})"/>
    <path d="${path}" fill="none" stroke="url(#${gid})" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="${peak[0].toFixed(1)}" cy="${peak[1].toFixed(1)}" r="4" fill="url(#${gid})"/>
    <circle cx="${peak[0].toFixed(1)}" cy="${peak[1].toFixed(1)}" r="9" fill="url(#${gid})" fill-opacity=".18"/>
    ${text(36, 204, range, 11, "mono muted")}
  `, { defs: `${gradient(gid)}
    <linearGradient id="${fid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="g-a1" stop-opacity=".28"/><stop offset="1" class="g-a1" stop-opacity="0"/>
    </linearGradient>` });
}
