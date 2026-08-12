const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const contentDir = path.join(ROOT, 'content');
const imagesDir = path.join(contentDir, 'images');
const quotesPath = path.join(ROOT, 'static', 'quotes.json');
const bgmDir = path.join(ROOT, 'static', 'bgm');
const bgvDir = path.join(ROOT, 'static', 'bgv');
const htmlTemplate = path.join(ROOT, 'index.html');

// 清空并重建 public 目录
if (fs.existsSync(PUBLIC)) {
  fs.rmSync(PUBLIC, { recursive: true, force: true });
}
fs.mkdirSync(PUBLIC, { recursive: true });

// ─── 扫描 content ───
function scan(dirPath, relPath = '') {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const tree = [];
  const files = {};
  let hasIndexMd = false; // 当前目录下是否有 index.md

  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'images') continue;
    const fullPath = path.join(dirPath, item.name);
    const itemRel = relPath ? `${relPath}/${item.name}` : item.name;

    if (item.isDirectory()) {
      const result = scan(fullPath, itemRel);
      if (result.tree.length > 0 || result.hasIndexMd) {
        tree.push({ name: item.name, type: 'folder', children: result.tree });
        Object.assign(files, result.files);
      }
    } else if (item.name.endsWith('.md')) {
      const fileKey = `content/${itemRel}`;
      if (item.name === 'index.md') {
        hasIndexMd = true;
        // 根目录的 index.md 作为首页加入 tree
        if (!relPath) {
          tree.push({
            name: item.name,
            type: 'file',
            path: fileKey,
            label: '首页'
          });
        }
        // 文件夹内的 index.md 由文件夹代表，不重复加入
      } else {
        tree.push({
          name: item.name,
          type: 'file',
          path: fileKey,
          label: item.name.replace(/\.md$/, '')
        });
      }
      files[fileKey] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
  // 排序：个人博客首位，文件夹中间，关于/留言最后
  const priority = { '个人博客.md': -2, '关于.md': 999, '留言.md': 999 };
  function rank(n) {
    const p = priority[n.name];
    if (p !== undefined) return p;        // 指定优先级
    if (n.type === 'folder') return 500;  // 文件夹统一排在中间
    return 0;                              // 普通文件按名字排序
  }
  tree.sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.type !== b.type) return a.type === 'folder' ? 1 : -1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  return { tree, files, hasIndexMd };
}

// ─── 扫描 bgm ───
let playlist = [];
if (fs.existsSync(bgmDir)) {
  for (const file of fs.readdirSync(bgmDir)) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.mp3' || ext === '.m4a' || ext === '.ogg' || ext === '.wav') {
      playlist.push({
        name: file.replace(/\.[^/.]+$/, ''),
        file: `static/bgm/${file}`
      });
    }
  }
}

// ─── 读取引言 ───
let quotes = [];
try {
  quotes = JSON.parse(fs.readFileSync(quotesPath, 'utf-8'));
} catch {
  quotes = [];
}

const { tree, files } = scan(contentDir);

// ─── 构建输出 HTML ───
function buildHtml(articlePath) {
  const treeStr = JSON.stringify({ tree }).replace(/<\//g, '<\\/');
  const filesStr = JSON.stringify(files).replace(/<\//g, '<\\/');
  const quotesStr = JSON.stringify(quotes).replace(/<\//g, '<\\/');
  const playlistStr = JSON.stringify(playlist).replace(/<\//g, '<\\/');

  let html = fs.readFileSync(htmlTemplate, 'utf-8');

  // 字面量替换：String.replace 会把替换串中的 $ 特殊序列（$$ $& 等）展开，破坏数学公式等数据
  const inject = (html, placeholder, replacement) => html.split(placeholder).join(replacement);
  html = inject(html, 'window.__TREE__ = {"tree":[]};', 'window.__TREE__ = ' + treeStr + ';');
  html = inject(html, 'window.__FILES__ = {};', 'window.__FILES__ = ' + filesStr + ';');
  html = inject(html, 'window.__ARTICLE_PATH__ = "";', 'window.__ARTICLE_PATH__ = "' + articlePath + '";');
  html = inject(html, 'window.__QUOTES__ = [];', 'window.__QUOTES__ = ' + quotesStr + ';');
  html = inject(html, 'window.__PLAYLIST__ = [];', 'window.__PLAYLIST__ = ' + playlistStr + ';');

  if (articlePath) {
    const articleLabel = articlePath
      .replace(/^content\//, '')
      .replace(/\.md$/, '')
      .replace(/\/index$/, '');
    html = html.replace('<title>个人博客</title>', `<title>${articleLabel} - 个人博客</title>`);
  }

  return html;
}

// ─── 写入文件 ───
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

function mapOutputPath(fileKey) {
  let relative = fileKey
    .replace(/^content\//, '')
    .replace(/\/index\.md$/, '/index.html')
    .replace(/\.md$/, '.html');
  return path.join(PUBLIC, relative);
}

writeFile(path.join(PUBLIC, 'index.html'), buildHtml(''));
console.log('✅ 首页: /index.html');

for (const [fileKey] of Object.entries(files)) {
  const outputPath = mapOutputPath(fileKey);
  writeFile(outputPath, buildHtml(fileKey));
  console.log(`  📄 ${fileKey} → /${path.relative(PUBLIC, outputPath).replace(/\\/g, '/')}`);
}

// ─── 复制图片 ───
if (fs.existsSync(imagesDir)) {
  const targetImgDir = path.join(PUBLIC, 'content', 'images');
  fs.mkdirSync(targetImgDir, { recursive: true });
  for (const file of fs.readdirSync(imagesDir)) {
    fs.copyFileSync(path.join(imagesDir, file), path.join(targetImgDir, file));
  }
  console.log(`✅ 已复制 ${fs.readdirSync(imagesDir).length} 张图片`);
}

// ─── 复制 sw.js ───
const swPath = path.join(ROOT, 'sw.js');
if (fs.existsSync(swPath)) {
  fs.copyFileSync(swPath, path.join(PUBLIC, 'sw.js'));
  console.log('✅ 已复制 Service Worker sw.js');
}

// ─── 复制 404 ───
const h404Path = path.join(ROOT, '404.html');
if (fs.existsSync(h404Path)) {
  fs.copyFileSync(h404Path, path.join(PUBLIC, '404.html'));
  console.log('✅ 已复制 404.html');
}

// ─── 复制 icon ───
const iconPath = path.join(ROOT, 'static', 'icon.png');
if (fs.existsSync(iconPath)) {
  const targetStatic = path.join(PUBLIC, 'static');
  if (!fs.existsSync(targetStatic)) fs.mkdirSync(targetStatic, { recursive: true });
  fs.copyFileSync(iconPath, path.join(targetStatic, 'icon.png'));
  console.log('✅ 已复制网站图标 icon.png');
}

// ─── 复制 bgv ───
if (fs.existsSync(bgvDir)) {
  const targetBgvDir = path.join(PUBLIC, 'static', 'bgv');
  fs.mkdirSync(targetBgvDir, { recursive: true });
  for (const file of fs.readdirSync(bgvDir)) {
    fs.copyFileSync(path.join(bgvDir, file), path.join(targetBgvDir, file));
  }
  console.log(`✅ 已复制 ${fs.readdirSync(bgvDir).length} 个背景视频/图片`);
}

// ─── 复制 bgm ───
if (fs.existsSync(bgmDir)) {
  const targetBgmDir = path.join(PUBLIC, 'static', 'bgm');
  fs.mkdirSync(targetBgmDir, { recursive: true });
  for (const file of fs.readdirSync(bgmDir)) {
    fs.copyFileSync(path.join(bgmDir, file), path.join(targetBgmDir, file));
  }
  console.log(`✅ 已复制 ${fs.readdirSync(bgmDir).length} 首音乐`);
}

console.log(`\n✨ 构建完成！${playlist.length} 首音乐，${quotes.length} 条引言，${Object.keys(files).length} 篇文章 + 首页`);