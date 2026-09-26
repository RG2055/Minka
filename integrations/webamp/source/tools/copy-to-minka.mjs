// dist-embed/ -> ../player/ for Minka (served as integrations/webamp/player/).
// Minka has its own station catalogue, so data/minka is left out, and the
// precache list follows.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const from = "dist-embed";
const to = "../player";
if (!existsSync(from)) throw new Error("Run the embed build first");
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true, filter: (src) => !/[\\/]data([\\/]|$)/.test(src.slice(from.length)) });
const list = JSON.parse(readFileSync(`${to}/precache.json`, "utf8")).filter((file) => !file.startsWith("data/"));
writeFileSync(`${to}/precache.json`, JSON.stringify(list, null, 2) + "\n");
console.log(`copied ${list.length} files to ${to}`);
