# 安巢鸟的个人网站

基于 Cloudflare Pages 部署的纯静态个人博客。Markdown 驱动，无需数据库，自动构建。

---

## 目录结构

```
e:\ck\First_single_blog/
├── index.html                 # 🎯 HTML 模板（含占位标记，构建时注入数据）
├── README.md                  # 本文件
├── content/                   # 📝 Markdown 源文章（写作目录）
│   ├── index.md               # 首页
│   ├── 个人博客.md             # 个人博客页面
│   ├── 关于.md                # 关于本站
│   ├── 留言.md                # 留言板
│   ├── 杂谈/                  # 杂谈专栏
│   │   ├── index.md
│   │   └── 01 网名的故事.md
│   ├── 计算机入门指南/          # 计算机入门专栏
│   │   ├── index.md
│   │   └── 基础入门/
│   │       ├── index.md
│   │       └── 01 认识你的电脑.md
│   ├── 随笔/                  # 随笔专栏
│   │   ├── index.md
│   │   └── 01.md
│   └── images/                # 🖼️ 文章内嵌图片
│       ├── CPU.jpg, GPU.jpg, RAM.jpg ... 共9张
├── static/                    # 🗂️ 静态资源（源文件）
│   ├── icon.png               # 网站图标
│   ├── quotes.json            # 首页随机引言（30条）
│   ├── bgm/                   # 🎵 背景音乐（10首）
│   │   ├── 风清月白.mp3
│   │   ├── Coffee Cats.mp3
│   │   └── ... 共10首
│   └── bgv/                   # 🎬 视频背景素材
│       ├── light_bg.mp4       # 浅色桌面端
│       ├── light_bg.jpg       # 浅色手机端
│       ├── dark_bg.mp4        # 深色桌面端
│       └── dark_bg.jpg        # 深色手机端
├── scripts/                   # 🛠️ 构建与开发工具
│   ├── build.js               # 构建脚本（核心）
│   ├── serve.js               # 本地开发服务器
│   └── generate-content-index.js  # 旧版索引生成（已弃用）
├── public/                    # 📦 构建产物（Cloudflare Pages 部署目录）
│   ├── index.html             # 首页
│   ├── 个人博客.html           # 独立文章页
│   ├── 关于.html
│   ├── 留言.html
│   ├── 杂谈/
│   ├── 计算机入门指南/
│   ├── 随笔/
│   ├── content/images/        # 文章图片
│   └── static/               # 静态资源
│       ├── icon.png
│       ├── bgm/              # 音乐文件
│       └── bgv/              # 视频背景
└── docs/                      # 📚 项目文档（原 Quartz 文档，保留）
```

---

## 工作原理

### 构建流程 (`node scripts/build.js`)

```
index.html（模板）+ content/（文章）+ static/（资源）
                     ↓
              build.js（注入数据 + 复制文件）
                     ↓
            public/（完整可部署的静态站点）
```

1. **扫描 `content/`**：递归读取所有 `.md` 文件，生成目录树 `tree` 和内容映射 `files`
2. **读取 `static/quotes.json`**：获取 30 条引言
3. **扫描 `static/bgm/`**：获取 10 首音乐的信息（歌名、文件路径）
4. **注入到 HTML 模板**：
   - `window.__TREE__` — 目录树
   - `window.__FILES__` — 所有文章内容（key=路径, value=Markdown原文）
   - `window.__QUOTES__` — 引言列表
   - `window.__PLAYLIST__` — 音乐列表
   - `window.__ARTICLE_PATH__` — 当前文章路径（每页不同）
5. **生成独立 HTML**：首页 + 每篇文章各生成一个 HTML 文件
6. **复制资源**：图片、bgv、bgm、icon 等复到 `public/` 对应目录

### 页面加载后

- 所有文章数据已内嵌在 HTML 中，**无需额外网络请求**
- 左侧目录从 `__TREE__` 渲染
- 点击文章跳转到独立 URL（例：`/计算机入门指南/基础入门/01 认识你的电脑.html`）
- 切换文章时**页面跳转**，所有数据通过 `__FILES__` 即时渲染
- 设置偏好（深浅色、背景、字号、音乐进度）存到 `localStorage`，跨页面持久化

### URL 映射规则

| Markdown 源文件 | 生成的 HTML |
|----------------|-------------|
| `content/index.md` | `/index.html` |
| `content/关于.md` | `/关于.html` |
| `content/杂谈/01 网名的故事.md` | `/杂谈/01 网名的故事.html` |
| `content/计算机入门指南/index.md` | `/计算机入门指南/index.html` |

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 🌲 **左侧目录树** | 从 content/ 结构自动生成，文件夹可展开/折叠 |
| 🔍 **搜索文章** | 输入关键词实时过滤目录树 |
| 📝 **Markdown 渲染** | 使用 marked.js，支持代码块、表格、引用、图片 |
| 🌙 **深浅色模式** | 点击标题栏按钮切换，自动检测系统偏好，localStorage 记忆 |
| 🎬 **视频/纯色背景** | 4种选项：视频背景、中性灰、暖色、冷色，桌面端mp4/手机端jpg |
| 🌫️ **模糊遮罩** | 全屏 blur(4px) + 两侧边缘浅 blur(2px) 半透明叠加 |
| 🫎 **字体大小** | 小字/默认/大字 三档，全局调整 |
| 🎵 **音乐播放器** | 10首背景音乐，上一首/暂停/下一首，跨页面不中断 |
| 💬 **随机引言** | 首页显示 quotes.json 中的随机引言 |
| 📱 **移动端适配** | 768px 以下侧栏弹出、按钮靠右、字体适配 |
| 🔄 **平滑过渡** | 所有颜色/背景切换均有 0.25s CSS 过渡动画 |

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
5. 点击保存并部署即可 🚀

---

## 本地开发

```bash
# 1. 构建
node scripts/build.js

# 2. 启动本地服务
node scripts/serve.js
# 打开 http://localhost:8080

# 或者用 Python 起静态服务
python -m http.server 8000 --directory public
```

### 写作新文章

1. 在 `content/` 下创建 `.md` 文件（支持文件夹分类）
2. 运行 `node scripts/build.js` 重新构建
3. 预览效果

> **注意**：文章内的图片请放到 `content/images/` 中，在 Markdown 中用 `./images/xxx.jpg` 引用，构建时会自动处理路径。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| **HTML5 + CSS3** | 页面结构与样式 |
| **JavaScript (vanilla)** | 全部交互逻辑（无框架） |
| **marked.js** | Markdown → HTML 渲染 |
| **Node.js** | 构建脚本（build.js） |
| **localStorage** | 用户偏好持久化 |
| **Cloudflare Pages** | 托管与持续部署 |

---

## 许可

MIT License