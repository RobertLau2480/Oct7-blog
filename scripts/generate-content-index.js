const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '..', 'content');
const outputPath = path.join(__dirname, '..', 'content-index.json');

function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const result = [];

  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'images') continue;

    const fullPath = path.join(dirPath, item.name);
    const relativePath = path.relative(contentDir, fullPath);
    const filePath = 'content/' + relativePath.replace(/\\/g, '/');

    if (item.isDirectory()) {
      result.push({
        name: item.name,
        type: 'folder',
        children: scanDirectory(fullPath)
      });
    } else if (item.name.endsWith('.md')) {
      result.push({
        name: item.name,
        type: 'file',
        path: filePath,
        label: item.name.replace(/\.md$/, '')
      });
    }
  }

  return result;
}

const tree = scanDirectory(contentDir);
fs.writeFileSync(outputPath, JSON.stringify({ tree }, null, 2), 'utf-8');
console.log('✅ content-index.json 已生成');