const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const contentDir = path.join(ROOT, 'content');
const htmlPath = path.join(ROOT, 'index.html');

function scan(dirPath, relPath = '') {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const tree = [];
  const files = {};

  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'images') continue;
    const fullPath = path.join(dirPath, item.name);
    const itemRel = relPath ? `${relPath}/${item.name}` : item.name;

    if (item.isDirectory()) {
      const result = scan(fullPath, itemRel);
      if (result.tree.length > 0) {
        tree.push({ name: item.name, type: 'folder', children: result.tree });
        Object.assign(files, result.files);
      }
    } else if (item.name.endsWith('.md')) {
      const fileKey = `content/${itemRel}`;
      tree.push({
        name: item.name,
        type: 'file',
        path: fileKey,
        label: item.name.replace(/\.md$/, '')
      });
      files[fileKey] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
  return { tree, files };
}

const { tree, files } = scan(contentDir);

// JSON 字符串（需要转义掉 </script> 防 HTML 解析错误）
const treeJSON = JSON.stringify({ tree }).replace(/<\//g, '<\\/');
const filesJSON = JSON.stringify(files).replace(/<\//g, '<\\/');

// 读取 index.html 模板
let html = fs.readFileSync(htmlPath, 'utf-8');

// 替换占位标记
html = html.replace('/*__TREE_DATA__*/', 'window.__TREE__ = ' + treeJSON + ';');
html = html.replace('/*__FILES_DATA__*/', 'window.__FILES__ = ' + filesJSON + ';');

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`✅ index.html 已内嵌 ${Object.keys(files).length} 篇文章`);