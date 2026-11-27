import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { contributions, development, footer, hero, product, repositories, studio } from "./artwork.mjs";
import { fetchProfileData } from "./github-data.mjs";

const args = process.argv.slice(2);
const mode = args[0];
if (args.length > 2 || (mode && !["--static", "--from-snapshot"].includes(mode)) ||
    (mode === "--from-snapshot") !== Boolean(args[1])) {
  throw new Error("Usage: node scripts/generate.mjs [--static | --from-snapshot <file>]");
}

const directory = new URL("../assets/profile/", import.meta.url);
const assets = new Map([
  ["hero.svg", hero(false)],
  ["hero-compact.svg", hero(true)],
  ["sirago.svg", product("sirago")],
  ["creative-engine.svg", product("engine")],
  ["studio.svg", studio()],
  ["footer.svg", footer()],
]);
// Retired in v4: the stack now lives in the hero terminal.
const retired = ["technology.svg"];

if (mode !== "--static") {
  const data = mode === "--from-snapshot"
    ? JSON.parse(await readFile(args[1], "utf8"))
    : await fetchProfileData();
  assets.set("contribution.svg", contributions(data.days));
  assets.set("repositories.svg", repositories(data));
  assets.set("development.svg", development(data.days));
}

// Fetch and render everything before replacing the last successful set of images.
await mkdir(directory, { recursive: true });
for (const [name, content] of assets) {
  await writeFile(new URL(name, directory), content, "utf8");
}
for (const name of retired) await unlink(new URL(name, directory)).catch(() => {});
console.log(`Rendered ${assets.size} ARAMETRIC profile SVGs.`);
