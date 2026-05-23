const fs   = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'generators');
const dst = path.join(__dirname, '..', 'dist', 'generators');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function copyDir(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(dstDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.name.endsWith('.css') || entry.name.endsWith('.js')) {
      copyFile(s, d);
    }
  }
}

// Copy all CSS/JS assets from generators tree
copyDir(src, dst);

// Legacy files (kept for backwards compat)
const legacyFiles = ['varadi-styles.css', 'varadi-scripts.js'];
for (const f of legacyFiles) {
  const from = path.join(src, f);
  if (fs.existsSync(from)) copyFile(from, path.join(dst, f));
}

// Logo + fonts
const logoDst = path.join(__dirname, '..', 'dist', 'screenshots');
ensureDir(logoDst);
const logoSrc = path.join(__dirname, '..', 'screenshots', 'logo.svg');
if (fs.existsSync(logoSrc)) copyFile(logoSrc, path.join(logoDst, 'logo.svg'));
const syneSrc = path.join(__dirname, '..', 'screenshots', 'syne-latin.woff2');
if (fs.existsSync(syneSrc)) copyFile(syneSrc, path.join(logoDst, 'syne-latin.woff2'));

console.log('Assets copied to dist/generators');
