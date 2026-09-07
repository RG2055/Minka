// Run with a path to an installed @fluentui/react-theme@9.2.2 package.
// Theme values are emitted as CSS so the PWA needs no Fluent/React runtime.
const fs = require('node:fs');
const path = require('node:path');
const source = process.argv[2] || '@fluentui/react-theme';
const { webDarkTheme } = require(source);
const keys = ['fontFamilyBase','fontSizeBase100','fontSizeBase200','fontWeightRegular','fontWeightSemibold','fontWeightBold','borderRadiusMedium','borderRadiusXLarge','borderRadius2XLarge','borderRadius3XLarge','borderRadius4XLarge','spacingHorizontalXS','spacingHorizontalS','spacingHorizontalM','spacingHorizontalL','durationFaster','curveEasyEase','colorStrokeFocus2'];
const start = '/* BEGIN Microsoft Fluent UI tokens — @fluentui/react-theme 9.2.2 (MIT) */';
const end = '/* END Microsoft Fluent UI tokens */';
const block = start + '\n#nsPanel {\n' + keys.map(key => '  --fluent-' + key + ': ' + webDarkTheme[key] + ';').join('\n') + '\n}\n' + end;
const file = path.join(__dirname, '../kalendars/css/nightsplit-brand.css');
let css = fs.readFileSync(file, 'utf8');
if (css.includes(start)) css = css.slice(0, css.indexOf(start)) + block + css.slice(css.indexOf(end) + end.length);
else css += '\n' + block + '\n';
fs.writeFileSync(file, css);
console.log('Fluent UI CSS tokens: ' + Buffer.byteLength(block) + ' bytes; no browser JavaScript.');
