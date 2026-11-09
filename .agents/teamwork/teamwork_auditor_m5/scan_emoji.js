const fs = require('fs');
const path = require('path');

const root = 'C:\\laragon\\www\\FamilyGuard';
const subtrees = {
  'services/api': path.join(root, 'services', 'api'),
  'apps/android': path.join(root, 'apps', 'android'),
  'apps/windows-agent': path.join(root, 'apps', 'windows-agent'),
  'apps/web': path.join(root, 'apps', 'web')
};

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

const results = {};

for (const [name, dir] of Object.entries(subtrees)) {
  let fileCount = 0;
  let lineCount = 0;
  const violations = [];

  function scan(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!['vendor', 'node_modules', 'dist', 'build', '.gradle', 'bin', 'obj', '.idea', '.git'].includes(entry.name)) {
          scan(full);
        }
      } else if (/\.(php|kt|java|cs|ts|tsx|js|jsx|css|html|json|xml|ps1|md)$/i.test(entry.name)) {
        if (entry.name === 'zero_emoji.test.ts') continue;
        fileCount++;
        const content = fs.readFileSync(full, 'utf-8');
        const lines = content.split('\n');
        lineCount += lines.length;
        lines.forEach((l, idx) => {
          const match = l.match(emojiRegex);
          if (match) {
            violations.push({
              file: path.relative(root, full),
              line: idx + 1,
              char: match[0],
              snippet: l.trim()
            });
          }
        });
      }
    }
  }

  scan(dir);
  results[name] = {
    filesScanned: fileCount,
    linesScanned: lineCount,
    violationsCount: violations.length,
    violations: violations
  };
}

console.log(JSON.stringify(results, null, 2));
