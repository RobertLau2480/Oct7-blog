const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const contentDir = path.join(ROOT, 'content');
const imagesDir = path.join(contentDir, 'images');
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

const { tree, files } = scan(contentDir);

// ─── 构建输出 HTML ───
function buildHtml(articlePath) {
  const treeStr = JSON.stringify({ tree }).replace(/<\//g, '<\\/');
  const filesStr = JSON.stringify(files).replace(/<\//g, '<\\/');

  let html = fs.readFileSync(htmlTemplate, 'utf-8');

  // 替换注入数据
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

  // 设置标题
  if (articlePath) {
    const articleLabel = articlePath
      .replace(/^content\//, '')
      .replace(/\.md$/, '')
      .replace(/\/index$/, '');
    html = html.replace('<title>个人博客</title>', `<title>${articleLabel} - 个人博客</title>`);
  }

  return html;
}

// ─── 写入文件（递归创建目录） ───
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

// 重建文件路径映射：content/xxx.md → public/xxx.html
// content/xxx/index.md → public/xxx/index.html
function mapOutputPath(fileKey) {
  // fileKey: content/xxx.md → xxx.html
  // fileKey: content/xxx/index.md → xxx/index.html
  let relative = fileKey
    .replace(/^content\//, '')
    .replace(/\/index\.md$/, '/index.html')
    .replace(/\.md$/, '.html');
  return path.join(PUBLIC, relative);
}

// ─── 生成首页 (/) ───
writeFile(path.join(PUBLIC, 'index.html'), buildHtml(''));
console.log('✅ 首页: /index.html');

// ─── 为每篇文章生成独立 HTML ───
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

console.log(`\n✨ 构建完成！共 ${Object.keys(files).length} 篇文章 + 首页`);