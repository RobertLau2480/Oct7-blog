const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const contentDir = path.join(ROOT, 'content');
const imagesDir = path.join(contentDir, 'images');
const htmlPath = path.join(ROOT, 'index.html');

// 清空并重建 public 目录
if (fs.existsSync(PUBLIC)) {
  fs.rmSync(PUBLIC, { recursive: true, force: true });
}
fs.mkdirSync(PUBLIC, { recursive: true });

// ─── 扫描 content 目录（排除 images） ───
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

// ─── 注入到 index.html ───
const treeJSON = JSON.stringify({ tree }).replace(/<\//g, '<\\/');
const filesJSON = JSON.stringify(files).replace(/<\//g, '<\\/');
let html = fs.readFileSync(htmlPath, 'utf-8');
html = html.replace('/*__TREE_DATA__*/', 'window.__TREE__ = ' + treeJSON + ';');
html = html.replace('/*__FILES_DATA__*/', 'window.__FILES__ = ' + filesJSON + ';');
fs.writeFileSync(path.join(PUBLIC, 'index.html'), html, 'utf-8');

// ─── 复制图片 ───
if (fs.existsSync(imagesDir)) {
  const targetImgDir = path.join(PUBLIC, 'content', 'images');
  fs.mkdirSync(targetImgDir, { recursive: true });
  for (const file of fs.readdirSync(imagesDir)) {
    fs.copyFileSync(path.join(imagesDir, file), path.join(targetImgDir, file));
  }
  console.log(`✅ 已复制 ${fs.readdirSync(imagesDir).length} 张图片`);
}

console.log(`✅ 构建完成！public/index.html 已内嵌 ${Object.keys(files).length} 篇文章`);
console.log(`📁 输出目录: ${PUBLIC}`);