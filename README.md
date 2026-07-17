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
- **运行时数据管理**：模型、任务、prompt 和生成结果均由 API 管理，不写入 Git
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

前端始终从 API 读取运行时数据；开发时需同时启动 `dev:server`。

其他命令：`pnpm check`（类型检查）· `pnpm format`（格式化）· `pnpm preview`（预览构建产物）

## Docker 部署

```bash
# .env 里已有 API_KEY 即可（compose 自动读取）
docker compose up -d --build     # → http://localhost:3000
docker compose logs -f arena     # 看日志
docker compose down              # 停止（数据保留在 ./server/data）
```

- 单容器同源：前端 + API + 静态资源一个端口，`VITE_API_BASE_URL=/` 已在构建时烘焙
- 数据通过 bind mount 持久化到宿主机 `./server/data`（db.json + 上传文件），可直接查看和备份
- 改宿主机端口：编辑 `docker-compose.yml` 的 `ports`（如 `"8080:3000"`）
- 注意：容器和本机 `pnpm dev:server` 共用 `./server/data`，不要同时运行两者写数据

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
新环境从空数据库开始；删除 `db.json` 并重启会清空模型、任务和生成记录。

## 环境变量（.env）

| 变量 | 说明 |
| --- | --- |
| `API_KEY` | 写接口的 Bearer 密钥，仅服务端持有，不会构建进前端 |
| `VITE_API_BASE_URL` | 前端 API 地址：开发 `http://localhost:3001`，生产同源 `/`；留空也使用同源 API |
| `PUBLIC_BASE_URL` | API 返回资源 url 的前缀：开发跨端口 `http://localhost:3001`，生产同源留空 |
| `PORT` / `DATA_DIR` | 服务端口（默认 3000）/ 数据目录（默认 `server/data`） |

## 项目结构

```
client/               前端（Vite root）
  public/             logo、模型厂商图标
  src/components/     Header / Hero / TaskRow / ModelCard / PreviewModal / PlaceholderThumb ...
  src/lib/            api.ts（运行时 API 服务层）· types.ts
server/               后端
  index.ts            启动入口：静态托管 + SPA fallback
  api.ts              REST 路由（鉴权、校验、上传）
  store.ts            JSON 文件存储（首次创建空数据库）
  data/               运行时模型、任务、prompt 和生成结果（gitignore）
shared/               前后端共享常量
API.md                接口契约 + 数据管理手册
```
