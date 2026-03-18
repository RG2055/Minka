const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = process.argv[2];
const outputPath = process.argv[3];

if (!sourcePath || !outputPath) {
  console.error('Usage: node export_numuri_to_d1.js <source-numuri.js> <output.sql>');
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, 'utf8');
const match = source.match(/const hospitalDatabase = (\[[\s\S]*?\]);/);

if (!match) {
  console.error('hospitalDatabase array not found in source file.');
  process.exit(1);
}

let rows;
try {
  rows = vm.runInNewContext(match[1], {});
} catch (error) {
  console.error('Failed to parse hospitalDatabase array:', error.message);
  process.exit(1);
}

if (!Array.isArray(rows)) {
  console.error('Parsed hospitalDatabase is not an array.');
  process.exit(1);
}

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

const values = rows.map((row) => {
  return `(${sql(row.name)}, ${sql(row.phone)}, ${sql(row.cat || '')}, ${sql(row.sub || '')}, 0)`;
});

const chunks = [];
for (let i = 0; i < values.length; i += 200) {
  chunks.push(values.slice(i, i + 200));
}

let sqlText = '';
sqlText += '-- Generated from old numuri.js for Cloudflare D1\n';
sqlText += '-- Source: ' + sourcePath + '\n';
sqlText += '-- Rows: ' + rows.length + '\n\n';
sqlText += 'DELETE FROM phones;\n\n';

chunks.forEach((chunk) => {
  sqlText += 'INSERT INTO phones (name, phone, cat, sub, hidden) VALUES\n';
  sqlText += chunk.join(',\n');
  sqlText += ';\n\n';
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sqlText, 'utf8');

console.log(`Generated ${rows.length} rows to ${outputPath}`);
