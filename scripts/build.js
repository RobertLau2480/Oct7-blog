const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SRC = p => path.join(ROOT, p);
const DST = p => path.join(PUBLIC, p);

// 清空并重建 public
if (fs.existsSync(PUBLIC)) fs.rmSync(PUBLIC, { recursive: true, force: true });
fs.mkdirSync(PUBLIC, { recursive: true });

// 扫描 content 目录
function scan(dirPath, relPath = '') {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const tree = [], files = {};

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
      if (item.name !== 'index.md') tree.push({ name: item.name, type: 'file', path: fileKey, label: item.name.replace(/\.md$/, '') });
      files[fileKey] = fs.readFileSync(fullPath, 'utf-8');
    }
  }

  // 排序：个人博客首位，文件夹中间，关于/留言最后
  const priority = { '个人博客.md': -2, '关于.md': 999, '留言.md': 999 };
  tree.sort((a, b) => {
    const ra = priority[a.name] ?? (a.type === 'folder' ? 500 : 0);
    const rb = priority[b.name] ?? (b.type === 'folder' ? 500 : 0);
    return ra - rb || (a.type === b.type ? a.name.localeCompare(b.name, 'zh-CN') : a.type === 'folder' ? 1 : -1);
  });
  return { tree, files };
}

// 读取引言
let quotes = [];
try { quotes = JSON.parse(fs.readFileSync(SRC('static/quotes.json'), 'utf-8')); } catch { /* 忽略 */ }

// 扫描音乐
const playlist = [];
if (fs.existsSync(SRC('static/bgm'))) {
  for (const file of fs.readdirSync(SRC('static/bgm'))) {
    if (['.mp3','.m4a','.ogg','.wav'].includes(path.extname(file).toLowerCase()))
      playlist.push({ name: file.replace(/\.[^/.]+$/, ''), file: `static/bgm/${file}` });
  }
}

const { tree, files } = scan(SRC('content'));

// 构建 HTML
function buildHtml(articlePath) {
  let html = fs.readFileSync(SRC('index.html'), 'utf-8');
  const esc = s => JSON.stringify(s).replace(/<\//g, '<\\/');
  html = html.replace('window.__TREE__ = {"tree":[]};', `window.__TREE__ = ${esc({ tree })};`);
  html = html.replace('window.__FILES__ = {};', `window.__FILES__ = ${esc(files)};`);
  html = html.replace('window.__ARTICLE_PATH__ = "";', `window.__ARTICLE_PATH__ = "${articlePath}";`);
  html = html.replace('window.__QUOTES__ = [];', `window.__QUOTES__ = ${esc(quotes)};`);
  html = html.replace('window.__PLAYLIST__ = [];', `window.__PLAYLIST__ = ${esc(playlist)};`);
  if (articlePath) {
    const label = articlePath.replace(/^content\//, '').replace(/\.md$/, '').replace(/\/index$/, '');
    html = html.replace('<title>安巢鸟的小站</title>', `<title>${label} - 安巢鸟的小站</title>`);
  }
  return html;
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function mapOutputPath(fileKey) {
  const relative = fileKey.replace(/^content\//, '').replace(/\/index\.md$/, '/index.html').replace(/\.md$/, '.html');
  return path.join(PUBLIC, relative);
}

writeFile(DST('index.html'), buildHtml(''));
console.log('✅ 首页: /index.html');

for (const [fileKey] of Object.entries(files)) {
  const outputPath = mapOutputPath(fileKey);
  writeFile(outputPath, buildHtml(fileKey));
  console.log(`  📄 ${fileKey} → /${path.relative(PUBLIC, outputPath).replace(/\\/g, '/')}`);
}

// 复制资源
function copyDir(src, dest, label) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const file of fs.readdirSync(src)) { fs.copyFileSync(path.join(src, file), path.join(dest, file)); count++; }
  console.log(`✅ 已复制 ${count} ${label}`);
}

function copyFile(src, dest, label) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`✅ 已复制${label ? ' ' + label : ''}`);
}

copyDir(SRC('content/images'), DST('content/images'), '张图片');
copyFile(SRC('sw.js'), DST('sw.js'), 'Service Worker sw.js');
copyFile(SRC('404.html'), DST('404.html'), '404.html');
copyFile(SRC('static/icon.png'), DST('static/icon.png'), '网站图标 icon.png');
copyDir(SRC('static/bgv'), DST('static/bgv'), '个背景视频/图片');
copyDir(SRC('static/bgm'), DST('static/bgm'), '首音乐');

console.log(`\n✨ 构建完成！${playlist.length} 首音乐，${quotes.length} 条引言，${Object.keys(files).length} 篇文章 + 首页`);