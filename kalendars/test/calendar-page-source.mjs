// The calendar page loads its larger style/script layers from css/page and js/page.
// Source-level tests read the page as one document, so put those layers back inline.
import fs from 'node:fs';

const pageUrl = new URL('../index.html', import.meta.url);
const read = path => fs.readFileSync(new URL(path, pageUrl), 'utf8');

export function readCalendarPage() {
  return read('index.html')
    .replace(/<link rel="stylesheet"( id="[^"]+")? href="(css\/page\/[^"?]+)\?[^"]*">/g,
      (_, id = '', path) => `<style${id}>\n${read(path).replace(/url\((\s*['"]?)\.\.\/\.\.\/assets\//g, 'url($1assets/')}</style>`)
    .replace(/<script( id="[^"]+")? src="(js\/page\/[^"?]+)\?[^"]*"><\/script>/g,
      (_, id = '', path) => `<script${id}>\n${read(path)}</script>`);
}
