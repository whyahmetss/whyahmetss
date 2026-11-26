const WIDTH = 640;
const FONT = "ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";
const NUMBER = new Intl.NumberFormat("en-US");

export function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function svg(title, description, height, body, { width = WIDTH, css = "" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <style>
    svg { --ground:#0B0D10; --panel:#14171C; --ink:#F4F4F4; --muted:#90969E; --line:#30373C; --accent:#C5F36D; --low:#344523; --mid:#526E32; --high:#80A94B; }
    @media (prefers-color-scheme: light) {
      svg { --ground:#F4F6F0; --panel:#FFFFFF; --ink:#151C12; --muted:#4E584D; --line:#CCD4C7; --accent:#385720; --low:#C7DBAB; --mid:#A1C372; --high:#678D47; }
    }
    text { font-family:${FONT}; fill:#F4F4F4; fill:var(--ink); }
    .rule { fill:none; stroke:#30373C; stroke:var(--line); }
    .wire { fill:none; stroke:#90969E; stroke:var(--muted); }
    .signal { fill:none; stroke:#C5F36D; stroke:var(--accent); }
    .ground { fill:#0B0D10; fill:var(--ground); }
    .panel { fill:#14171C; fill:var(--panel); }
    .muted { fill:#90969E; fill:var(--muted); }
    .accent { fill:#C5F36D; fill:var(--accent); }
    .low { fill:#344523; fill:var(--low); }
    .mid { fill:#526E32; fill:var(--mid); }
    .high { fill:#80A94B; fill:var(--high); }
    .label { font-weight:600; letter-spacing:1px; }
    .bold { font-weight:700; }
    ${css}
  </style>
  <rect class="ground" width="${width}" height="${height}"/>
  <rect class="rule" x=".5" y=".5" width="${width - 1}" height="${height - 1}"/>
  ${body}
</svg>
`.replace(/^[ \t]+$/gm, "");
}

function text(x, y, value, size, classes = "", attributes = "") {
  return `<text x="${x}" y="${y}" font-size="${size}"${classes ? ` class="${classes}"` : ""}${attributes ? ` ${attributes}` : ""}>${escapeXml(value)}</text>`;
}

function rect(x, y, width, height, classes = "", attributes = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="${classes}"${attributes ? ` ${attributes}` : ""}/>`;
}

function mark(cx, cy, size, classes = "signal") {
  return `<path class="${classes}" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" d="M${cx + size} ${cy - size}H${cx - size}V${cy + size}H${cx + size}M${cx - size} ${cy}H${cx + size / 2}"/>`;
}

const letters = {
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  V: ["#...#", "#...#", "#...#", ".#.#.", ".#.#.", "..#..", "..#.."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
};

function wordmark(x, y, stepX, stepY, size) {
  const word = "EVERY";
  return letters.E.map((_, row) => {
    const chars = [...word].map(letter => letters[letter][row]).join(".");
    return [...chars].map((char, column) => {
      if (char !== "#") return "";
      const distance = (column + row * 3) % 13;
      const glyph = distance < 3 ? "+" : distance === 4 ? "=" : "#";
      return text(x + column * stepX, y + row * stepY, glyph, size, "accent bold");
    }).join("");
  }).join("\n    ");
}

export function hero(compact) {
  const width = compact ? 400 : WIDTH;
  const height = compact ? 443 : 420;
  const x = compact ? 24 : 37;
  const top = compact ? 94 : 100;
  const divider = compact ? 209 : 230;
  const railX = compact ? 0 : 485;
  const mask = `inset(0 100% 0 0)`;
  const command = "identity --brief";
  const title = "EVERY / @whyahmetss";
  const focus = ["Artificial Intelligence", "Software Development", "Business Automation", "Creative Technology", "Digital Products"];
  const body = `
    ${rect(1, 1, width - 2, 50, "panel")}
    <path class="rule" d="M1 51.5H${width - 1}"/>
    ${mark(x + 6, 26, 6)}
    ${text(x + 24, 32, "every / profile", compact ? 16 : 17, "label")}
    ${text(width - x, 32, "BUILD FOR TOMORROW.", compact ? 13 : 16, "muted label", 'text-anchor="end"')}
    <defs>
      <pattern id="grid" width="${compact ? 16 : 22}" height="${compact ? 16 : 22}" patternUnits="userSpaceOnUse">
        <path class="rule" opacity=".56" d="M${compact ? 16 : 22} 0H0V${compact ? 16 : 22}"/>
      </pattern>
    </defs>
    <rect x="${x}" y="72" width="${width - x * 2}" height="${divider - 96}" fill="url(#grid)"/>
    ${compact ? "" : `
    <path class="rule" d="M${railX} 73V208M${railX + 3} 143H603"/>
    <path class="wire" opacity=".8" d="M500 89H514M500 89V103M589 89H603V103M500 176V190H514M589 190H603V176"/>
    <g class="sweep" opacity=".85">
      <path class="signal" d="M501 145.5H603"/>
      <rect class="accent" x="544" y="141" width="9" height="9"/>
    </g>`}
    <g aria-hidden="true">${wordmark(x + 4, top, compact ? 12 : 14.5, compact ? 14 : 15.5, compact ? 17 : 21)}</g>
    <path class="rule" d="M${x} ${divider}.5H${width - x}"/>
    ${text(x, divider + 27, "›", 20, "accent bold")}
    ${text(x + 22, divider + 27, command, 16, "muted command", 'textLength="153.6" lengthAdjust="spacingAndGlyphs"')}
    ${rect(x + 182, divider + 14, 8, 16, "accent cursor")}
    ${text(x, divider + 60, "@whyahmetss", compact ? 21 : 24, "bold")}
    ${text(width - x, divider + 59, "Founder / Builder", compact ? 16 : 19, "accent", 'text-anchor="end"')}
    ${compact
      ? text(x, divider + 91, "Building systems that outlast", 18) +
        text(x, divider + 114, "their creators.", 18)
      : text(x, divider + 99, "Building systems that outlast their creators.", 20)}
    ${focus.map((item, i) => {
      const positions = compact ? [[0, 149], [0, 171], [0, 193], [0, 215], [0, 0]] :
        [[0, 139], [201, 139], [0, 164], [201, 164], [403, 164]];
      if (compact && i === 4) return text(width - x, divider + 171, item, 15, "muted", 'text-anchor="end"');
      return text(x + positions[i][0], divider + positions[i][1], item, compact ? 15 : 16, "muted");
    }).join("\n    ")}`;
  return svg(title, "Founder / Builder. Building systems that outlast their creators. " + focus.join(", ") + ".", height, body, {
    width,
    css: `
    @keyframes type { from { clip-path:${mask}; } to { clip-path:inset(0); } }
    @keyframes caret-travel { from { transform:translateX(-158px); } to { transform:translateX(0); } }
    @keyframes blink { 50% { opacity:0; } }
    @keyframes sweep { from { transform:translateY(-45px); opacity:.2; } to { transform:translateY(0); opacity:.85; } }
    @media (prefers-reduced-motion: no-preference) {
      .command { animation:type 1.12s steps(16,end) both; }
      .cursor { animation:caret-travel 1.12s steps(16,end) both, blink .8s step-end 1.12s 4; }
      .sweep { animation:sweep 1.65s cubic-bezier(.23,1,.32,1) both; }
    }`,
  });
}

export function product(creative) {
  const name = creative ? "Creative Engine" : "SıraGo";
  const status = creative ? "IN DEVELOPMENT" : "OPEN FOR SIGN-UP";
  const lines = creative ? ["AI-assisted video", "production infrastructure."] :
    ["Appointments and automation", "for service businesses."];
  const slotFill = ["line", "line", "accent", "line", "line", "line", "line", "line", "accent", "line", "line", "line"];
  const illustration = creative
    ? `<g fill="none" stroke-width="1.4">
        <path class="rule" d="M0 6H188M0 36H188M0 66H188M30 2V80M78 2V80M126 2V80M174 2V80"/>
        ${rect(8, 13, 71, 15, "panel wire")}
        ${rect(86, 13, 57, 15, "panel wire")}
        ${rect(54, 43, 89, 15, "low signal")}
        ${rect(148, 43, 28, 15, "panel wire")}
        <path class="signal" d="M105 3V76M101 3H109M101 76H109"/>
        <path class="wire" d="M17 76h14m12 0h14m68 0h14m14 0h14"/>
      </g>`
    : `<g stroke-width="1.4">
        <path class="wire" d="M7 14H181M7 43H181M7 72H181M40 1V84M94 1V84M148 1V84"/>
        ${slotFill.map((fill, i) => rect(5 + i % 4 * 45, 7 + Math.floor(i / 4) * 29, 24, 14, fill === "line" ? "panel rule" : "low signal")).join("")}
        <path class="signal" d="M104 13h6v-5m-6 64h6v-5"/>
      </g>`;
  return svg(name, `${lines.join(" ")} ${status.toLowerCase()}.`, 152, `
    ${rect(400, 1, 239, 150, "panel")}
    ${rect(37, 26, 7, 7, creative ? "muted" : "accent")}
    ${text(54, 37, status, 17, `${creative ? "muted" : "accent"} label`)}
    ${text(36, 79, name, 34, "bold")}
    ${lines.map((line, i) => text(37, 110 + i * 23, line, 19, "muted")).join("")}
    <g aria-hidden="true" transform="translate(426 34)">${illustration}</g>
    ${creative ? "" : '<path class="signal" stroke-width="1.5" d="M610 28l12-12m-9 0h9v9"/>'}
  `);
}

const stack = [
  ["JavaScript", '<path d="M4 7 11 14 4 21M17 21h14"/>'],
  ["TypeScript", '<path d="M2 7h26M15 7v19M22 26h9m0-19v19"/>'],
  ["Python", '<path d="M4 15c-1-5 2-9 7-9h13v10H10c-4 0-6 3-6 6m28-8c1 5-2 9-7 9H12V13h14c4 0 6-3 6-6"/>'],
  ["React", '<path d="M17 3 31 11v14l-14 8-14-8V11zM3 11l14 8 14-8m-14 8v14m-7-17 14-8"/>'],
  ["Node.js", '<path d="M3 19 17 7l14 12-14 12zM9 18l8-7 8 7-8 7z"/>'],
  ["PostgreSQL", '<path d="M4 9c0-6 26-6 26 0v16c0 6-26 6-26 0zm0 0c0 6 26 6 26 0m-26 8c0 6 26 6 26 0"/>'],
];

export function technology() {
  return svg("Technology stack", stack.map(([label]) => label).join(", "), 161, `
    <path class="rule" d="M1 80.5H639M213.5 1V160M426.5 1V160"/>
    ${stack.map(([label, icon], i) => {
      const x = 26 + i % 3 * 213;
      const y = 25 + Math.floor(i / 3) * 80;
      return `<g transform="translate(${x} ${y})">
        <g class="signal icon" fill="none" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="round" style="animation-delay:${i * 55}ms">${icon}</g>
        ${text(43, 23, label, 18, "label")}
      </g>`;
    }).join("\n    ")}
  `, { css: `
    @keyframes settle { from { opacity:.5; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
    @media (prefers-reduced-motion: no-preference) {
      .icon { animation:settle .24s cubic-bezier(.23,1,.32,1) both; }
    }` });
}

export function footer() {
  return svg("EVERY", "Build for tomorrow.", 75, `
    ${mark(49, 37.5, 10)}
    ${text(75, 45, "EVERY", 24, "bold", 'letter-spacing="2"')}
    ${text(603, 44, "BUILD FOR TOMORROW.", 21, "muted label", 'text-anchor="end"')}
  `);
}

const LEVEL_CLASS = ["panel", "low", "mid", "high", "accent"];
const DATE_FMT = new Intl.DateTimeFormat("en-US", { month:"short", timeZone:"UTC" });
const RANGE_DATE = new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", year:"numeric", timeZone:"UTC" });

function dateLabel(date, formatter) {
  return formatter.format(new Date(date));
}

function sampledRoute(group) {
  const active = group.filter(day => day.count > 0);
  const stops = Math.min(6, active.length);
  if (stops <= 1) return active;
  return Array.from({ length:stops }, (_, i) => active[Math.round(i * (active.length - 1) / (stops - 1))]);
}

function signature(groups) {
  const route = groups.flatMap(sampledRoute);
  const last = route.at(-1);
  if (!last) return { artwork:"", css:"" };
  const placement = `transform:translate(${last.x}px,${last.y}px)`;
  const agent = `<g class="agent" style="${placement}">
    ${rect(-8, -8, 16, 16, "ground signal")}
    ${mark(0, 0, 4)}
  </g>`;
  if (route.length === 1) return { artwork:agent, css:"" };

  const times = route.map((_, i) => i / (route.length - 1) * 100);
  const position = (day, time, opacity) => `${time.toFixed(3)}% { transform:translate(${day.x}px,${day.y}px); opacity:${opacity}; }`;
  const frames = route.map((day, i) => {
    if (i > 0 && day.band !== route[i - 1].band) {
      return position(route[i - 1], times[i] - 2.5, 0) + position(day, times[i] - 2, 0) + position(day, times[i], 1);
    }
    return position(day, times[i], 1);
  }).join("\n    ");
  const rings = route.slice(0, -1).map((day, i) =>
    rect(day.x - 7.5, day.y - 7.5, 15, 15, "signal ring",
      `style="animation-delay:${(times[i] * 45).toFixed(1)}ms" stroke-width="1.4"`)).join("");
  return {
    artwork: `${rings}${agent}`,
    css: `
    .ring { opacity:0; }
    @keyframes route { ${frames} }
    @keyframes visit { 0%,100% { opacity:0; } 25% { opacity:1; } }
    @media (prefers-reduced-motion: no-preference) {
      .agent { animation:route 4.5s linear both; }
      .ring { animation:visit .48s cubic-bezier(.23,1,.32,1); }
    }`,
  };
}

export function contributions(days) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const active = days.filter(day => day.count > 0).length;
  const range = `${dateLabel(days[0].date, RANGE_DATE)} – ${dateLabel(days.at(-1).date, RANGE_DATE)}`;
  const startingWeekday = new Date(days[0].date).getUTCDay();
  const groups = [[], []];
  const monthMarkers = [new Map(), new Map()];
  for (const [index, day] of days.entries()) {
    const adjusted = index + startingWeekday;
    const week = Math.floor(adjusted / 7);
    const band = Number(week >= 26);
    const x = 72 + (week - band * 26) * 20;
    const y = 123 + band * 179 + (adjusted % 7) * 18;
    groups[band].push({ ...day, x, y, band });
    const dayOfMonth = Number(day.date.slice(-2));
    if (index === 0 || dayOfMonth === 1 || !monthMarkers[band].size) {
      const labels = monthMarkers[band];
      const lastX = [...labels.keys()].at(-1);
      if (lastX === undefined || x - lastX >= 52) {
        labels.set(x, dateLabel(day.date, DATE_FMT));
      }
    }
  }
  const trail = signature(groups);
  const cells = groups.flat().map(day => rect(day.x - 7, day.y - 7, 14, 14, LEVEL_CLASS[day.level], 'rx="1"'));
  return svg("Contribution activity", `${NUMBER.format(total)} publicly visible contributions on ${active} active days from ${range}. The EVERY mark visits recorded contribution days.`, 475, `
    ${text(35, 36, `${NUMBER.format(total)} contributions`, 27, "bold")}
    ${text(605, 36, `${NUMBER.format(active)} active days`, 17, "muted", 'text-anchor="end"')}
    ${text(35, 63, range, 18, "muted")}
    ${groups.map((_, i) => `
    <path class="rule" d="M35 ${78 + i * 179}.5H605"/>
    ${[["S", 0], ["T", 2], ["T", 4], ["S", 6]].map(([label, row]) =>
      text(36, 129 + i * 179 + row * 18, label, 14, "muted")).join("")}
    ${[...monthMarkers[i]].map(([x, label]) => text(x - 7, 104 + i * 179, label, 16, "muted")).join("")}`).join("")}
    <g aria-hidden="true">${cells.join("\n    ")}${trail.artwork}</g>
    <path class="rule" d="M35 431.5H605"/>
    ${text(35, 454, "Activity level", 17, "muted")}
    ${text(405, 454, "Less", 17, "muted", 'text-anchor="end"')}
    ${LEVEL_CLASS.map((level, i) => rect(417 + i * 20, 442, 14, 14, level, 'rx="1"')).join("")}
    ${text(605, 454, "More", 17, "muted", 'text-anchor="end"')}
  `, { css:trail.css });
}

export function repositories(data) {
  const metrics = [["Repositories", data.repositories], ["Stars received", data.stars], ["Forks received", data.forks]];
  const total = data.languages.reduce((sum, [, bytes]) => sum + bytes, 0);
  const limit = 5;
  const leading = data.languages.slice(0, limit);
  const remaining = total - leading.reduce((sum, [, bytes]) => sum + bytes, 0);
  const rows = remaining > 0 ? [...leading, ["Other", remaining]] : leading;
  const shares = rows.map(([label, value]) => ({ label, share: value / total * 100 }));
  const fmt = value => value < 0.1 ? "<0.1%" : `${value.toFixed(1)}%`;
  const height = Math.max(209, 167 + rows.length * 40);
  return svg("Public repositories and most used languages", metrics.map(([label, value]) =>
    `${value} ${label.toLowerCase()}`).concat(shares.map(({ label, share }) => `${label} ${fmt(share)}`)).join(", "), height, `
    ${rect(1, 1, 638, 87, "panel")}
    <path class="rule" d="M1 88.5H639M213.5 1V88M426.5 1V88"/>
    ${metrics.map(([label, value], i) => {
      const x = 33 + i * 213;
      return text(x, 44, NUMBER.format(value), 31, "bold") + text(x, 70, label, 17, "muted");
    }).join("")}
    ${text(35, 125, "Most used languages", 24, "bold")}
    ${text(35, 151, shares.length ? "Share of GitHub language bytes" : "No language bytes reported by GitHub.", 17, "muted")}
    ${shares.map(({ label, share }, i) => {
      const y = 179 + i * 40;
      const displayLabel = label.length > 25 ? `${label.slice(0, 24)}…` : label;
      return `<g>
      ${text(35, y, displayLabel, 18, i === 0 ? "bold" : "")}
      ${text(605, y, fmt(share), 18, "muted", 'text-anchor="end"')}
      ${rect(35, y + 8, 570, 6, "panel")}
      ${rect(35, y + 8, (570 * share / 100).toFixed(2), 6, i === 0 ? "accent" : "high")}
    </g>`;
    }).join("")}
  `);
}

export function development(days) {
  const weeks = [];
  for (const day of days.slice(-92, -1)) {
    if (new Date(day.date).getUTCDay() === 0 || !weeks.length) weeks.push({ date:day.date, count:0, days:0 });
    weeks.at(-1).count += day.count;
    weeks.at(-1).days += 1;
  }
  const complete = weeks.filter(week => week.days === 7).slice(-12);
  const max = Math.max(1, ...complete.map(week => week.count));
  const tick = Math.ceil(max / 20) * 20;
  const top = 101;
  const baseline = 200;
  const y = value => baseline - (baseline - top) * value / tick;
  const points = complete.map((week, index) => [76 + index * 47.5, y(week.count)]);
  const total = complete.reduce((sum, week) => sum + week.count, 0);
  const last = complete.at(-1);
  const end = new Date(Date.parse(last.date) + 6 * 86_400_000);
  const range = `${dateLabel(complete[0].date, RANGE_DATE)} – ${RANGE_DATE.format(end)}`;
  return svg("Development activity", `${NUMBER.format(total)} publicly visible contributions over 12 completed weeks from ${range}. Weekly counts: ${complete.map(week => NUMBER.format(week.count)).join(", ")}.`, 259, `
    ${text(35, 37, "Development activity", 24, "bold")}
    ${text(605, 37, `${NUMBER.format(total)} total`, 20, "accent label", 'text-anchor="end"')}
    ${text(35, 65, "Weekly contributions · last 12 complete weeks", 17, "muted")}
    ${[tick, tick / 2, 0].map(value => `<path class="rule" d="M65 ${y(value)}H605"/>${text(56, y(value) + 5, NUMBER.format(value), 14, "muted", 'text-anchor="end"')}`).join("")}
    <polyline class="signal" stroke-width="2" points="${points.map(point => point.join(",")).join(" ")}"/>
    ${points.map(([x, y]) => rect(x - 3, y - 3, 6, 6, "accent")).join("")}
    ${text(35, 235, range, 17, "muted")}
  `);
}
