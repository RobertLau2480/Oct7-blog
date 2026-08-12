# OctSeventh 的 Blog

基于 Cloudflare Pages 部署的纯静态个人博客系统。Markdown 写作，自动构建，单页应用导航确保音乐播放不中断。

---

## 目录结构

```
e:\ck\First_single_blog/
├── index.html                 # 🎯 页面模板（含占位标记，构建时注入数据）
├── 404.html                   # 🚫 自定义 404 页面
├── README.md                  # 本文件
├── sw.js                      # Service Worker（离线缓存）
├── content/                   # 📝 Markdown 文章源文件（写作目录）
│   ├── index.md               # 首页
│   ├── 个人博客.md             # 个人博客页面
│   ├── 关于.md                # 关于本站
│   ├── 留言.md                # 留言板（Giscus 评论）
│   ├── 杂谈/
│   │   ├── index.md
│   │   └── 01 网名的故事.md
│   ├── 计算机入门指南/
│   │   ├── index.md
│   │   └── 基础入门/
│   │       ├── index.md
│   │       └── 01 认识你的电脑.md
│   ├── 随笔/
│   │   ├── index.md
│   │   └── 01.md
│   └── images/                # 🖼️ 文章图片
│       ├── CPU.jpg, GPU.jpg, RAM.jpg ... 共9张
├── scripts/                   # 🛠️ 构建 & 开发工具
│   ├── build.js               # 构建脚本（核心）
│   ├── serve.js               # 本地开发服务器
│   └── generate-content-index.js  # 旧版索引生成（已弃用）
├── static/                    # 🗂️ 静态资源源文件
│   ├── icon.png               # 网站图标
│   ├── quotes.json            # 首页随机引言（30条）
│   ├── bgm/                   # 🎵 背景音乐（10首）
│   └── bgv/                   # 🎬 视频背景素材（4个）
├── public/                    # 📦 构建产物（Cloudflare Pages 部署目录）
│   ├── index.html             # 首页
│   ├── 404.html               # 404 页面
│   ├── sw.js                  # Service Worker
│   ├── *.html                 # 每篇文章各一个独立 HTML
│   ├── content/images/        # 文章图片
│   └── static/                # 静态资源
└── .git/                      # Git 版本控制
```

---

## 工作原理

### 构建流程 (`node scripts/build.js`)

```
index.html（模板）
    + content/（Markdown 文章）
    + static/quotes.json（引言）
    + static/bgm/（音乐）
    + static/bgv/（视频背景）
    + static/icon.png（图标）
            ↓
      build.js（注入数据 + 复制资源）
            ↓
    public/（完整可部署的静态站点）
```

1. **扫描 `content/`**：递归读取所有 `.md` 文件，生成目录树 `tree` 和内容映射 `files`
2. **读取引言**：`static/quotes.json` → `__QUOTES__`
3. **扫描音乐**：`static/bgm/` → `__PLAYLIST__`
4. **注入到 HTML**：
   - `window.__TREE__` — 目录树
   - `window.__FILES__` — 所有文章内容（key=路径, value=Markdown原文）
   - `window.__QUOTES__` — 30 条引言
   - `window.__PLAYLIST__` — 10 首音乐（歌名 + 路径）
   - `window.__ARTICLE_PATH__` — 当前文章路径（每页不同）
5. **生成独立 HTML**：首页 + 每篇文章各一个 HTML
6. **复制资源**：图片、视频、音乐、图标、sw.js、404 等

### 页面加载后

- 所有数据已内嵌在 HTML 中，**零额外网络请求**
- 左侧目录从 `__TREE__` 渲染
- 点击文章 → **SPA 导航**（`history.pushState`），不刷新页面
- 音乐播放器持续播放，不受页面切换影响

### URL 映射

| Markdown | 生成的 HTML |
|----------|------------|
| `content/index.md` | `/index.html` |
| `content/关于.md` | `/关于.html` |
| `content/杂谈/01 网名的故事.md` | `/杂谈/01 网名的故事.html` |
| `content/计算机入门指南/index.md` | `/计算机入门指南/index.html` |

---

## 功能特性

### 核心功能

| 功能 | 说明 |
|------|------|
| 🌲 **目录树导航** | 自动从 content/ 结构生成，文件夹可展开/折叠，index.md 由文件夹代表 |
| 🔍 **文章搜索** | 输入关键词实时过滤目录树 |
| 📝 **Markdown 渲染** | 使用 marked.js，支持代码块、表格、引用、图片 |
| ⚡ **SPA 导航** | 文章切换不刷新页面，音乐持续播放，浏览器前进/后退正常 |
| 🚫 **404 页面** | 自定义 404，深色模式自适应 |

### 外观 & 主题

| 功能 | 说明 |
|------|------|
| 🌙 **深浅色模式** | 点击 🌙/☀️ 切换，自动检测系统偏好，localStorage 记忆 |
| 🎬 **4 种背景** | 视频背景/中性灰/暖色/冷色，桌面端 mp4，手机端 jpg |
| 🌫️ **模糊遮罩** | 全屏 blur(4px) + 两侧边缘 blur(2px) 半透明叠加 |
| 🫎 **字体大小** | 小字/默认/大字三档，全局调整 |
| 🖼️ **Obsidian 图片** | 支持 `![[filename.jpg#pic_center|size]]` 语法 |
| ➡️ **侧栏折叠** | 桌面端 ⇐/⇒ 按钮切换侧栏，正文同步拓宽 |
| ⬆️ **回到顶部** | 可拖动的圆形按钮，滚动超过一页时显示 |
| 🔄 **平滑过渡** | 所有颜色/背景/侧栏切换均有 0.25-0.35s CSS 过渡 |

### 音乐播放器

| 功能 | 说明 |
|------|------|
| 🎵 **10 首背景音乐** | 构建时自动扫描 static/bgm/ |
| ⏮⏸⏭ **播放控制** | 上一首/暂停/下一首 |
| 🔀 **切歌自动播放** | 点击下一首自动播放，不用担心浏览器策略 |
| ⏳ **加载状态** | 网络不佳时显示转圈动画 |
| 🔊 **音量滑条** | 拖动调节音量，localStorage 记忆 |
| 🔁 **跨页不中断** | SPA 导航保持 `<audio>` 元素持续运行 |
| ⏩ **进度记忆** | 切换页面/歌曲后恢复播放位置 |

### 评论系统

| 功能 | 说明 |
|------|------|
| 💬 **Giscus 评论** | 基于 GitHub Discussions，每篇文章独立评论区 |
| 🌗 **深浅色同步** | 切换深浅色时 Giscus 主题即时跟随 |
| 🔗 **路径映射** | 按 `pathname` 匹配对应 Discussion |

### 性能 & 缓存

| 功能 | 说明 |
|------|------|
| 📦 **数据内嵌** | 所有文章和目录树嵌入 HTML，零 API 请求 |
| 🔄 **Service Worker** | 图片缓存优先，音频/视频跳过缓存避免播放问题 |
| 🎞️ **视频渐显** | 视频/图片加载完成后平滑淡入 |

---

## Cloudflare Pages 部署

| 配置项 | 值 |
|--------|-----|
| **构建命令** | `node scripts/build.js` |
| **输出目录** | `/public` |
| **Node.js 版本** | 默认 |

### 部署步骤

1. 将整个项目推送到 GitHub 仓库
2. 登录 Cloudflare Dashboard → Workers & Pages → Pages
3. 点击 **连接到 Git** → 选择对应仓库
4. 在构建设置中填入：
   - 构建命令：`node scripts/build.js`
   - 输出目录：`/public`
5. 点击保存并部署

---

## 本地开发

```bash
# 1. 构建
node scripts/build.js

# 2. 起服务预览（服务 public/ 目录）
node scripts/serve.js
# 打开 http://localhost:8080

# 或用 Python
python -m http.server 8000 --directory public
```

### 写作新文章

1. 在 `content/` 下创建 `.md` 文件（支持子文件夹分类）
2. 图片放在 `content/images/`，用 `![[filename.jpg#pic_center|宽度]]` 引用
3. 运行 `node scripts/build.js` 重新构建
4. 预览效果

### 构建命令说明

```bash
npm run build    # 等价于 node scripts/build.js
npm start        # 等价于 node scripts/serve.js
```

---

## 技术栈

| 技术 | 用途 |
|------|------|
| **HTML5 + CSS3** | 页面结构与样式 |
| **JavaScript (vanilla)** | 全部交互逻辑，零框架依赖 |
| **marked.js** | Markdown → HTML 渲染 |
| **Node.js** | 构建脚本（build.js / serve.js） |
| **localStorage** | 用户偏好持久化（主题、背景、字号、音量、侧栏状态） |
| **Service Worker** | 静态资源缓存加速 |
| **Giscus** | GitHub 驱动的评论系统 |
| **Cloudflare Pages** | 托管与持续部署 |

---

## 许可

MIT License