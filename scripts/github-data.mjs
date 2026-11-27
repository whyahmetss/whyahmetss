const DAY_MS = 86_400_000;
const LOGIN = "whyahmetss";
const API = "https://api.github.com";

async function request(url, accept, token) {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "Accept-Language": "en-US",
      "User-Agent": "arametric-profile-generator",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const limit = remaining === null ? "" : ` (rate limit remaining: ${remaining})`;
    throw new Error(`GitHub returned HTTP ${response.status} for ${url.pathname}${limit}`);
  }
  return response;
}

async function json(path) {
  const response = await request(new URL(path, API), "application/vnd.github+json", process.env.PROFILE_API_TOKEN);
  return response.json();
}

function readAttributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
}

export function parseCalendar(html, today = new Date().toISOString().slice(0, 10)) {
  const labels = new Map();
  for (const [, tag, label] of html.matchAll(/(<tool-tip\b[^>]+>)([^<]*)<\/tool-tip>/gi)) {
    const target = readAttributes(tag).for;
    if (target?.startsWith("contribution-day-component-")) labels.set(target, label.trim());
  }

  const dates = new Map();
  for (const [tag] of html.matchAll(/<td\b[^>]+>/gi)) {
    const attrs = readAttributes(tag);
    if (!attrs.class?.split(/\s+/).includes("ContributionCalendar-day")) continue;
    const date = attrs["data-date"];
    const countText = /^(No|\d[\d,]*) contributions? on /i.exec(labels.get(attrs.id) ?? "")?.[1];
    const count = countText?.toLowerCase() === "no" ? 0 : Number(countText?.replaceAll(",", ""));
    const level = Number(attrs["data-level"]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || dates.has(date) ||
        !Number.isSafeInteger(count) || !Number.isInteger(level) || level < 0 || level > 4 ||
        (count === 0) !== (level === 0)) {
      throw new Error("GitHub contribution calendar contains invalid or unmatched cells");
    }
    dates.set(date, { date, count, level });
  }

  const sorted = [...dates.values()].filter(({ date }) => date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const days = sorted.slice(-365);
  const last = Date.parse(days.at(-1)?.date);
  const age = Date.parse(today) - last;
  if (days.length !== 365 || !Number.isFinite(age) || age < 0 || age > DAY_MS ||
      days.some(({ date }, i) => Date.parse(date) !== last - (364 - i) * DAY_MS)) {
    throw new Error("GitHub contribution calendar does not contain 365 recent consecutive dates");
  }
  return days;
}

async function publicCalendar() {
  const url = new URL(`https://github.com/users/${LOGIN}/contributions`);
  const response = await request(url, "text/html");
  return parseCalendar(await response.text());
}

async function publicRepositories() {
  const repos = [];
  for (let page = 1; ; page += 1) {
    const batch = await json(`/users/${LOGIN}/repos?type=owner&sort=full_name&per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.some(repo => repo.owner?.login.toLowerCase() !== LOGIN ||
        repo.private !== false || typeof repo.name !== "string" || !Number.isSafeInteger(repo.stargazers_count) ||
        !Number.isSafeInteger(repo.forks_count))) {
      throw new Error("GitHub returned unexpected public repository metadata");
    }
    repos.push(...batch.filter(repo => !repo.fork && !repo.archived && repo.name.toLowerCase() !== LOGIN));
    if (batch.length < 100) break;
  }
  return repos;
}

async function repositorySummary() {
  const repos = await publicRepositories();
  const bytes = new Map();
  for (const { name } of repos) {
    const languages = await json(`/repos/${LOGIN}/${encodeURIComponent(name)}/languages`);
    if (!languages || typeof languages !== "object" || Array.isArray(languages)) {
      throw new Error("GitHub returned an invalid language list");
    }
    for (const [language, count] of Object.entries(languages)) {
      if (!Number.isSafeInteger(count) || count < 0) throw new Error("GitHub reported invalid language bytes");
      if (count > 0) bytes.set(language, (bytes.get(language) ?? 0) + count);
    }
  }
  return {
    repositories: repos.length,
    stars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
    forks: repos.reduce((total, repo) => total + repo.forks_count, 0),
    languages: [...bytes].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en")),
  };
}

export async function fetchProfileData() {
  const [days, summary] = await Promise.all([publicCalendar(), repositorySummary()]);
  return { days, ...summary };
}
