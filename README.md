# Glass Home — 简约毛玻璃浏览器主页

一个极简风格的浏览器起始页 / 新标签页，支持侧边栏、书签管理与多搜索引擎，同时提供 **Cloudflare Workers**、**Cloudflare Pages（Web 端快速部署）** 与 **本地运行** 三种方式。

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
├── public/            # 前端静态资源（本地 / Workers / Pages 共用）
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── worker/index.js    # Cloudflare Worker 入口
├── wrangler.toml      # Cloudflare Workers 配置（静态资源托管）
├── server.js          # 本地静态服务器（Node 内置模块，无需依赖）
├── start.sh           # 本地启动脚本
└── package.json
```

---

## 一、本地运行

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

---

## 二、部署到 Cloudflare Workers（命令行方式，详细）

前置条件：已安装 Node.js 16+，并拥有 Cloudflare 账号。

### 第 1 步：安装 wrangler

```bash
# 全局安装（推荐）
npm install -g wrangler

# 或在项目内安装
npm install
```

### 第 2 步：登录 Cloudflare

```bash
wrangler login
```

浏览器会弹出授权页面，点击「Allow」完成授权。

> 若在无浏览器环境下，可改用 API Token：
> `wrangler login --api-key` 或直接配置 `CLOUDFLARE_API_TOKEN` 环境变量。

### 第 3 步：本地预览 Worker 效果

```bash
wrangler dev
```

默认打开 http://localhost:8787 查看实际运行效果（Worker 会以 Static Assets 方式托管 `public/` 目录）。

### 第 4 步：正式部署

```bash
wrangler deploy
```

部署成功后终端会输出类似：

```
Uploaded 3 files (××× bytes)
Total Upload: ××× bytes
↗️  https://glass-home.你的子域.workers.dev
```

打开输出的 `*.workers.dev` 地址即为你的浏览器主页。

### 第 5 步（可选）：绑定自定义域名

在 Cloudflare 控制台 → Workers → 你的 Worker → 设置 → 域与路由 → 添加自定义域，选择你的域名即可（需先在 Cloudflare 托管该域名）。

### 原理说明

项目使用 Cloudflare Workers 的 **Static Assets** 能力：`wrangler.toml` 中的 `[assets]` 把 `public/` 目录自动托管到 CDN，`worker/index.js` 仅需把请求交给 `env.ASSETS.fetch()`。无需 KV、R2 或额外存储。

---

## 三、Web 端快速部署（免命令行）

不想装命令行工具？以下两种方式都只需浏览器操作。

### 方式 A：Cloudflare Pages 拖拽上传（最快，推荐）

1. 打开 https://dash.cloudflare.com 并登录
2. 左侧菜单进入 **Workers 与 Pages** → 点击 **创建** → 选择 **Pages**
3. 选择 **直接上传**（Direct Upload），填写项目名（如 `glass-home`）
4. 将本地项目里的 **`public/` 文件夹**（内含 `index.html`、`css/`、`js/`）**整体拖入**上传框
5. 点击「部署站点」，稍等几秒即完成
6. 部署成功后，在「部署」标签页会看到形如 `https://glass-home-xxxx.pages.dev` 的访问地址

> 以后更新时，把新版 `public/` 拖到同一项目重新上传即可，地址不变。

### 方式 B：Cloudflare Workers 控制台（Assets 上传）

1. 打开 https://dash.cloudflare.com 并登录
2. 左侧菜单进入 **Workers 与 Pages** → 点击 **创建** → 选择 **Worker** → 起名（如 `glass-home`）→ 点击「部署」
3. 进入该 Worker → **设置** → **资产**（Assets）→ **管理资产** → 上传 `public/` 文件夹内的文件（`index.html`、`css/`、`js/`）
4. 回到 **代码** 页，把 `worker/index.js` 的内容粘贴进编辑器的 `fetch` 处理器中：

   ```js
   export default {
     async fetch(request, env) {
       return env.ASSETS.fetch(request);
     }
   };
   ```

5. 点击右上角「保存并部署」即可

> 说明：Workers 控制台的「资产」功能会为 `env.ASSETS` 自动注入静态文件，无需手动绑定。若你的账号界面暂未显示「资产」入口，请直接使用上方的 Pages 方式 A。

---

## 四、常见问题

**Q：打开页面直接弹出「添加书签」弹窗？**
> 这是早期版本样式冲突导致的 bug（弹窗 `display:grid` 覆盖了 `hidden` 属性），新版已修复。请拉取最新代码重新部署，或强制刷新浏览器（Ctrl+F5）。

**Q：部署后访问 404？**
> 检查上传的文件是否放在 `public/` 根目录（`index.html` 必须在根，不能套一层文件夹）。Pages 上传时需直接拖 `public/` 里的内容。

**Q：如何设置成浏览器默认主页 / 新标签页？**
> 在 Chrome/Edge 的设置中，把「启动时」设为打开特定网址，填入部署后的地址即可。部分浏览器可用扩展（如 New Tab Redirect）覆盖新标签页。

---

## 使用提示

- 在侧边栏点击「设置」，可管理书签、切换默认搜索引擎、调整主题
- 在首页搜索框直接输入网址（如 `github.com`）会直接跳转访问
- 书签数据保存在浏览器 localStorage，换浏览器或清除数据后会恢复默认
