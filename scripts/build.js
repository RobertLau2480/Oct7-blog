const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const contentDir = path.join(ROOT, 'content');
const imagesDir = path.join(contentDir, 'images');
const quotesPath = path.join(ROOT, 'static', 'quotes.json');
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

  let html = fs.readFileSync(htmlTemplate, 'utf-8');

  html = html.replace(
    'window.__TREE__ = {"tree":[]};',
    'window.__TREE__ = ' + treeStr + ';'
  );
  html = html.replace(
    'window.__FILES__ = {};',
    'window.__FILES__ = ' + filesStr + ';'
  );
  html = html.replace(
    'window.__ARTICLE_PATH__ = "";',
    'window.__ARTICLE_PATH__ = "' + articlePath + '";'
  );
  html = html.replace(
    'window.__QUOTES__ = [];',
    'window.__QUOTES__ = ' + quotesStr + ';'
  );

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

if (fs.existsSync(imagesDir)) {
  const targetImgDir = path.join(PUBLIC, 'content', 'images');
  fs.mkdirSync(targetImgDir, { recursive: true });
  for (const file of fs.readdirSync(imagesDir)) {
    fs.copyFileSync(path.join(imagesDir, file), path.join(targetImgDir, file));
  }
  console.log(`✅ 已复制 ${fs.readdirSync(imagesDir).length} 张图片`);
}

console.log(`\n✨ 构建完成！${quotes.length} 条引言已注入，${Object.keys(files).length} 篇文章 + 首页`);