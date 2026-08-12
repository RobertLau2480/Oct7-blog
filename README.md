# Oct7's Blog / 孟冬初柒的博客

这是一个基于纯静态页面搭建的个人博客系统，结构清晰，功能完整，适合用来做个人主页、随笔或技术教程的展示。

本项目的核心思想是：把所有 Markdown 文章和站点数据预先生成到静态页面里，浏览时不需要额外请求文章内容；同时通过 SPA 方式实现文章切换，保证背景音乐不间断。

---

## 项目结构一览

```
Oct7-blog/
├── index.html                 # 页面模板，构建时注入数据
├── 404.html                   # 自定义 404 页面
├── README.md                  # 本说明文件
├── sw.js                      # Service Worker
├── content/                   # Markdown 源文件目录
│   ├── index.md               # 首页内容
│   ├── 个人博客.md            # 个人博客介绍页
│   ├── 关于.md                # 关于本站
│   ├── 留言.md                # 留言板（Giscus 评论）
│   ├── 示例文档/              # 示例文章目录
│   │   ├── index.md
│   │   ├── 1 博客写作示例.md
│   │   └── 2 流程图和时序图示例.md
│   ├── 杂谈/                  # 个人随笔类内容
│   ├── 计算机入门指南/        # 教程类内容
│   ├── 随笔/                  # 记录类文章
│   └── images/                # 文章图片资源
├── scripts/                   # 构建与预览脚本
│   ├── build.js               # 静态站点生成脚本
│   └── serve.js               # 本地预览服务
├── static/                    # 站点静态资源
│   ├── icon.png               # 站点图标
│   ├── quotes.json            # 首页随机引言
│   ├── bgm/                   # 背景音乐
│   └── bgv/                   # 视频背景素材
├── public/                    # 构建输出目录，直接部署即可
└── .git/                      # Git 版本控制
```

---

## 项目简介

这个博客系统的核心在于“构建时把内容打包进静态页面”。

- `scripts/build.js` 读取 `content/` 下的 Markdown 文件，生成文章目录树和内容映射。
- 同时读取 `static/` 中的音乐、背景视频、引言等资源。
- 将这些数据注入 `index.html` 模板，生成可直接部署的 `public/`。
- 页面加载后，所有文章数据已经嵌入到 HTML 中，浏览时不再发起额外文章请求。
- 文章切换采用 SPA 路由，页面不刷新，背景音乐可持续播放。

### 主要注入的数据

- `window.__TREE__`：目录结构
- `window.__FILES__`：Markdown 原文内容
- `window.__QUOTES__`：首页随机引言
- `window.__PLAYLIST__`：音乐列表
- `window.__ARTICLE_PATH__`：当前文章路径

---

## 核心功能

### 内容与导航

- 自动根据 `content/` 目录生成树形目录
- 支持多级目录与 `index.md` 目录主页
- SPA 内部导航，文章切换不会刷新页面
- 浏览器前进/后退支持正常工作
- 自定义 404 页面

### 页面渲染能力

- Markdown 基本语法支持
- 代码块、高亮、表格、引用、任务列表
- Mermaid 流程图与时序图渲染
- KaTeX 数学公式渲染
- Obsidian 风格提示框与本地图片引用

### 视觉与主题

- 深浅色模式切换，自动记忆用户设置
- 四种背景风格：视频 / 中性 / 暖色 / 冷色
- 桌面端使用视频背景，移动端自动切换图片背景
- 字体大小可调
- 主题与背景切换带平滑过渡效果

### 多媒体与评论

- 背景音乐播放器，支持上一曲 / 暂停 / 下一曲
- 音量与播放进度记忆
- Giscus 评论系统，每篇文章独立评论区
- 深浅色模式同步 Giscus 主题

### 性能与缓存

- 所有文章内容内嵌到 HTML，减少请求次数
- Service Worker 缓存静态资源，加速页面加载
- 视频与图片加载采用渐显效果，体验更平滑

---

## 本地开发

```bash
# 构建静态站点
node scripts/build.js

# 启动本地预览服务
node scripts/serve.js
# 打开 http://localhost:8080
```

如果只是想直接预览 `public/`，也可以用 Python 简单服务器：

```bash
python -m http.server 8000 --directory public
```

---

## 写文章指南

1. 在 `content/` 目录下创建 `.md` 文件。
2. 如果是目录主页，请在子目录中创建 `index.md`。
3. 图片可放在 `content/images/` 或文章所在目录。
4. 运行 `node scripts/build.js` 重新生成 `public/`。

### 推荐写法

- 使用标准 Markdown 标题、段落、列表、引用、表格
- 代码块使用 ```` ``` ```` 包裹
- Mermaid 直接写入 ` ```mermaid ` 代码块
- KaTeX 支持行内公式与块级公式

---

## 部署说明

建议部署目录为 `public/`。

- 构建命令：`node scripts/build.js`
- 输出目录：`public`

将仓库连接到 Cloudflare Pages 或其他静态托管服务，保存配置后发布即可。

---

## 技术栈

- HTML5 + CSS3
- 原生 JavaScript
- marked.js 用于 Markdown 渲染
- Node.js 负责构建与预览
- localStorage 保存主题与用户设置
- Service Worker 缓存静态资源
- Giscus 提供评论功能

---

## 许可证

MIT License
