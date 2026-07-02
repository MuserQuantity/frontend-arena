# Frontend Arena

<p>
  <img src="client/public/logo.png" alt="MQ" width="48" align="left" />
  现代大语言模型的前端训练场，快速浏览各模型在前端性能方面的比较。<br/>
  MuserQuantity · <a href="https://github.com/MuserQuantity/frontend-arena">github.com/MuserQuantity/frontend-arena</a>
</p>

<br/>

每个站点均由模型基于公开 LLM Arena 数据集中的单条提示词一次性生成，未经人工修改。
点开任意卡片即可体验完整可交互的结果，并在多个模型之间并排切换对比。

## 功能

- **任务 × 模型对比网格**：每行一条提示词，横向并排展示各模型生成的页面，支持展开完整 prompt
- **全屏交互预览**：iframe 沙箱加载生成页面，`←`/`→` 切换模型、`Esc` 关闭
- **动态占位缩略图**：缩略图缺失/加载中时，按模型色系自动渲染线框风格占位图，亮/暗主题自适应
- **完整后端**：REST API（读公开 / 写需 API Key）+ multipart 上传 + 静态托管，JSON 文件存储，开箱即用
- **双数据模式**：接真实 API，或零配置回落内置 mock 数据独立运行
- **明暗主题**：跟随系统自动切换

## 技术栈

React 19 · Vite 7 · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · wouter · Express · zod

## 快速开始

```bash
pnpm install
cp .env.example .env        # 生成并填入 API_KEY：openssl rand -hex 32
```

**开发**（两个终端）：

```bash
pnpm dev:server             # API + 资源托管 → http://localhost:3001
pnpm dev                    # 前端           → http://localhost:3000
```

**生产**（单进程同源，应用 + API 一个端口）：

```bash
VITE_API_BASE_URL=/ pnpm build
pnpm start                  # http://localhost:3000
```

**只跑前端**（无后端，用内置 mock 数据）：把 `.env` 中 `VITE_API_BASE_URL` 置空后 `pnpm dev`。

其他命令：`pnpm check`（类型检查）· `pnpm format`（格式化）· `pnpm preview`（预览构建产物）

## 数据管理

后端数据（模型 / 任务 / 生成结果）通过 REST API 增删改查：
读接口公开，写接口需 `Authorization: Bearer <API_KEY>`。

```bash
export API_KEY=$(grep '^API_KEY=' .env | cut -d= -f2)

# 例：新增模型（color 为占位图色系）
curl -X POST http://localhost:3001/api/v1/models \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"name":"DeepSeek V4","is_mono":true,"color":"#4f46e5"}'

# 例：上传某任务 × 模型的生成页面
curl -X POST http://localhost:3001/api/v1/tasks/<taskId>/generations/<modelId>/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "html=@site.html;type=text/html" -F "thumb=@thumb.webp;type=image/webp"
```

完整接口契约与增删改查实操手册见 **[API.md](./API.md)**。

数据落在 `server/data/`（gitignore）：`db.json` + 上传的 `sites|thumbs` 文件。
删除 `db.json` 并重启即可重置回种子数据（15 任务 × 5 模型）。

## 环境变量（.env）

| 变量 | 说明 |
| --- | --- |
| `API_KEY` | 写接口的 Bearer 密钥，仅服务端持有，不会构建进前端 |
| `VITE_API_BASE_URL` | 前端 API 地址：开发 `http://localhost:3001`，生产同源 `/`，留空则用内置 mock |
| `PUBLIC_BASE_URL` | API 返回资源 url 的前缀：开发跨端口 `http://localhost:3001`，生产同源留空 |
| `PORT` / `DATA_DIR` | 服务端口（默认 3000）/ 数据目录（默认 `server/data`） |

## 项目结构

```
client/               前端（Vite root）
  public/             logo、模型图标、占位预览页
  src/components/     Header / Hero / TaskRow / ModelCard / PreviewModal / PlaceholderThumb ...
  src/lib/            api.ts（服务层，mock/真实双模式）· types.ts · mockData.ts
server/               后端
  index.ts            启动入口：静态托管 + SPA fallback
  api.ts              REST 路由（鉴权、校验、上传）
  store.ts            JSON 文件存储（首次自动播种）
  data/               运行时数据（gitignore）
shared/               前后端共享常量
API.md                接口契约 + 数据管理手册
```
