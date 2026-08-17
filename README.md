# Glass Home — 简约毛玻璃浏览器主页

一个极简风格的浏览器起始页 / 新标签页，支持侧边栏、书签管理与多搜索引擎，同时提供 **Cloudflare Workers** 与 **本地运行** 两种部署方式。

## 功能特性

- 简约设计 + 毛玻璃（Glassmorphism）效果
- 左侧固定侧边栏，展示快捷链接
- 大时钟、日期与智能问候语
- 内置 Google / Bing / 百度 / GitHub / DuckDuckGo 多引擎切换
- 书签按分类展示，支持增删改，数据保存在浏览器 localStorage
- 深色 / 浅色主题一键切换
- 纯原生 HTML/CSS/JS，零构建、零运行时依赖

## 项目结构

```
.
├── public/            # 前端静态资源（本地与 Worker 共用）
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── worker/index.js    # Cloudflare Worker 入口
├── wrangler.toml      # Cloudflare Workers 配置（静态资源托管）
├── server.js          # 本地静态服务器（Node 内置模块，无需依赖）
├── start.sh           # 本地启动脚本
└── package.json
```

## 本地运行

需要 Node.js 16 或更高版本。

```bash
# 方式一：启动脚本
./start.sh

# 方式二：Node 直接运行
node server.js
```

启动后访问 http://localhost:3000 ，也可以指定端口：

```bash
PORT=8080 node server.js
```

## 部署到 Cloudflare Workers

前置条件：已安装 Node.js，并已登录 Cloudflare 账户（`npx wrangler login`）。

```bash
# 安装 wrangler（全局安装）
npm install -g wrangler

# 本地预览 Worker 效果
npx wrangler dev

# 正式部署
npx wrangler deploy
```

部署完成后会输出一个 `*.workers.dev` 地址（如 `https://glass-home.你的子域.workers.dev`），打开即为你的浏览器主页。

> 说明：项目使用 Cloudflare Workers 的 Static Assets 能力，自动托管 `public/` 目录，无需绑定 KV 或额外存储。

## 使用提示

- 在侧边栏点击「设置」，可管理书签、切换默认搜索引擎、调整主题
- 在首页搜索框直接输入网址（如 `github.com`）会直接跳转访问
- 书签数据保存在浏览器 localStorage，换浏览器或清除数据后会恢复默认
