const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const parts = (pkg.version || '0.0.0').split('.');
if (parts.length !== 3) {
  console.error(`Invalid version in package.json: ${pkg.version}`);
  process.exit(1);
}

const [major, minor, patch] = parts.map((n) => parseInt(n, 10));
const newVersion = `${major}.${minor}.${patch + 1}`;

pkg.version = newVersion;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

console.log(`Bumped version: ${parts.join('.')} -> ${newVersion}`);
