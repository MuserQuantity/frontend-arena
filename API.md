# Frontend Arena 后端接口（已实现）

本文件是后端 REST 契约，**已由 `server/` 完整实现**（Express + JSON 文件存储，
首次启动自动用内置 mock 数据做种子）。前端通过 `client/src/lib/api.ts` 中的服务层调用：
`VITE_API_BASE_URL` 为空时用内置 mock；设为 API 地址（开发 `http://localhost:3001`、
生产同源 `/`）即切换到真实接口，业务代码无需改动。

## 本地运行

```bash
cp .env.example .env         # 填 API_KEY（openssl rand -hex 32）
pnpm dev:server              # API + 资源托管 → http://localhost:3001
pnpm dev                     # 前端（另开终端） → http://localhost:3000
```

生产为单进程同源（应用 + API 一个端口）：

```bash
VITE_API_BASE_URL=/ pnpm build && pnpm start   # http://localhost:3000
```

- 数据落在 `server/data/`（`db.json` + 上传的 `sites|thumbs|thumbs-mobile`，已 gitignore），可用 `DATA_DIR` 重定向。
- `PUBLIC_BASE_URL`：API 返回的资源 url 前缀。开发跨端口时设为 `http://localhost:3001`；生产同源留空（返回相对路径）。
- 删除 `server/data/db.json` 可重置回种子数据。

## 鉴权约定

| 类型 | 说明 |
| --- | --- |
| **读接口（GET）** | **公开，无需鉴权**。任何人可获取 prompt 列表、模型列表、各模型生成的前端预览等。 |
| **写接口（POST/PUT/PATCH/DELETE）** | 需在请求头携带 `Authorization: Bearer <API_KEY>`。用于新增/修改任务、导入模型、上传生成结果等管理操作。 |

- API Key 为长随机字符串，仅服务端与管理端持有，**绝不下发到公开前端**。
- 鉴权失败返回 `401 Unauthorized`；Key 无对应权限返回 `403 Forbidden`。

## 通用响应包裹

```jsonc
// 成功
{ "data": <payload>, "error": null }
// 失败
{ "data": null, "error": { "code": "NOT_FOUND", "message": "task not found" } }
```

前端服务层同时兼容「直接返回数组/对象」与「包裹在 `data` 中」两种形式。

---

## 数据模型

### Model
```jsonc
{
  "id": "claude-opus-4_7",        // 稳定 id，同时用于解析图标/资源路径
  "name": "Opus 4.7",             // 展示名
  "is_mono": false,               // true=单色图标(用 CSS mask 渲染, 跟随文字色); false=彩色 <img>
  "icon_url": "/model-icons/claude-opus-4_7.svg",
  "color": "#d97706"              // 可选。创建模型时选择的品牌色系；缩略图缺失/加载中时
                                  // 前端用它自动渲染线框占位图，未设置则回退为中性灰
}
```

### Task
```jsonc
{
  "id": "task_00",
  "index": 0,                     // 从 0 起的排序索引，用于编号与资源目录名(00,01,...)
  "summary": "Steampunk control panel ...",  // 单行摘要
  "prompt": "A complicated, complex ...",    // 完整原始 prompt（展开显示）
  "available_models": ["claude-opus-4_7", "gpt-5_5", "glm-5_2", "gemini-3_5-flash", "minimax-m3"]
}
```

### Generation（某个 task × model 的生成结果）
```jsonc
{
  "task_id": "task_00",
  "model_id": "claude-opus-4_7",
  "preview_url": "/sites/00/claude-opus-4_7.html", // 可交互的独立 HTML，前端用 iframe 加载
  "thumb_url": "/thumbs/00/claude-opus-4_7.webp",  // 桌面缩略图
  "thumb_mobile_url": "/thumbs-mobile/00/claude-opus-4_7.webp", // 移动缩略图(可选)
  "status": "ready"               // ready | pending | failed
}
```

---

## 读接口（公开）

### `GET /api/v1/models`
返回全部模型列表。
```jsonc
{ "data": [ { "id": "claude-opus-4_7", "name": "Opus 4.7", "is_mono": false, "icon_url": "..." }, ... ] }
```

### `GET /api/v1/tasks`
返回全部任务，含每个任务的可用模型清单（`available_models`）。
```jsonc
{ "data": [ { "id": "task_00", "index": 0, "summary": "...", "prompt": "...", "available_models": [...] }, ... ] }
```

### `GET /api/v1/tasks/:id`
返回单个任务详情。

### `GET /api/v1/tasks/:id/generations`
返回该任务下所有模型的生成结果（前端据此渲染卡片与模态框）。
```jsonc
{ "data": [ { "task_id": "task_00", "model_id": "...", "preview_url": "...", "thumb_url": "...", "status": "ready" }, ... ] }
```

### 静态资源（公开）
生成结果与缩略图建议按索引目录托管（也可用 CDN 绝对 URL 替换）：
```
GET /sites/{NN}/{model_id}.html          # 可交互预览（iframe 源）
GET /thumbs/{NN}/{model_id}.webp         # 桌面缩略图
GET /thumbs-mobile/{NN}/{model_id}.webp  # 移动缩略图
GET /model-icons/{model_id}.svg          # 模型图标
```
其中 `NN` 为 `index` 的两位零填充（0 → `00`）。

---

## 写接口（需 API Key）

> 全部要求请求头 `Authorization: Bearer <API_KEY>`，请求体为 `application/json`。

### 模型管理
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/models` | 新增模型（`name`,`is_mono`,`icon_url`,`color` 色系可选；`id` 可省略由后端生成） |
| PATCH | `/api/v1/models/:id` | 更新模型字段 |
| DELETE | `/api/v1/models/:id` | 删除模型 |

### 任务管理
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/tasks` | 新增任务（`summary`,`prompt`；`index` 可省略追加到末尾） |
| PATCH | `/api/v1/tasks/:id` | 更新任务摘要/prompt/排序 |
| DELETE | `/api/v1/tasks/:id` | 删除任务及其生成结果 |

### 生成结果管理
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| PUT | `/api/v1/tasks/:taskId/generations/:modelId` | 创建或替换某 task×model 的生成结果 |
| POST | `/api/v1/tasks/:taskId/generations/:modelId/upload` | `multipart/form-data` 上传，字段：`html`（预览页）、`thumb`、`thumb_mobile`（webp/png/jpg/svg）。后端落盘并回填 url，含 `html` 时 status 置为 `ready` |
| PATCH | `/api/v1/tasks/:taskId/generations/:modelId` | 更新 `status` 或替换 url |
| DELETE | `/api/v1/tasks/:taskId/generations/:modelId` | 删除该生成结果 |

### 触发生成（预留，暂未接入）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/tasks/:taskId/generate` | 预留的云端生成钩子，当前返回 `501 NOT_IMPLEMENTED` |

---

## 数据管理指南（增删改查实操）

以下命令均在项目根目录执行，改动即时生效，**刷新前端页面即可看到，无需重启**。

### 0. 一次性准备

```bash
export API_KEY=$(grep '^API_KEY=' .env | cut -d= -f2)
B=http://localhost:3001/api/v1
```

### 1. 查看现有数据（拿 id，无需 key）

```bash
curl -s $B/models | python3 -m json.tool               # 模型列表
curl -s $B/tasks  | python3 -m json.tool               # 任务列表（含 id、index）
curl -s $B/tasks/task_00/generations | python3 -m json.tool   # 某任务的生成结果
```

### 2. 模型

```bash
# 增：color 即占位缩略图的色系；id 自动从 name 生成（如 deepseek-v4），也可显式指定
curl -X POST $B/models -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"DeepSeek V4","is_mono":true,"color":"#4f46e5","icon_url":"/model-icons/deepseek-v4.svg"}'

# 改：任意字段局部更新
curl -X PATCH $B/models/deepseek-v4 -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" -d '{"color":"#0891b2"}'

# 删：连带删除该模型全部生成结果与上传文件
curl -X DELETE $B/models/deepseek-v4 -H "Authorization: Bearer $API_KEY"
```

模型图标：把 svg 放进 `client/public/model-icons/`，`icon_url` 填 `/model-icons/<文件名>.svg`。
`is_mono: true` 表示单色图标（前端用 CSS mask 渲染、自动跟随文字颜色），彩色图标填 `false`。

### 3. 任务（提示词）

```bash
# 增：id 自动生成（task_xxxxxxxx，从返回值里拿）；index 可选，默认追加到末尾
curl -X POST $B/tasks -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"summary":"贪吃蛇游戏","prompt":"Build a snake game with canvas and keyboard controls"}'

# 改：摘要 / prompt / 排序（index 从 0 起，其余任务自动顺移）
curl -X PATCH $B/tasks/task_xxxxxxxx -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" -d '{"summary":"新摘要","index":0}'

# 删：连带删除该任务全部生成结果与上传文件
curl -X DELETE $B/tasks/task_xxxxxxxx -H "Authorization: Bearer $API_KEY"
```

### 4. 生成结果（任务 × 模型的实际页面）

```bash
# 上传模型生成的 HTML（必备）+ 缩略图（可选，不传则显示按色系自动渲染的占位图）
curl -X POST $B/tasks/task_xxxxxxxx/generations/deepseek-v4/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "html=@./snake.html;type=text/html" \
  -F "thumb=@./snake.webp;type=image/webp"
# 成功后卡片自动变为「查看」，点开即上传的可交互页面

# 手动登记（文件已在别处托管时，直接写 url）
curl -X PUT $B/tasks/task_xxxxxxxx/generations/deepseek-v4 \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"preview_url":"https://cdn.example.com/snake.html","status":"ready"}'

# 改状态（ready | pending | failed，pending/failed 时卡片置灰不可点）
curl -X PATCH $B/tasks/task_xxxxxxxx/generations/deepseek-v4 \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"status":"pending"}'

# 删
curl -X DELETE $B/tasks/task_xxxxxxxx/generations/deepseek-v4 \
  -H "Authorization: Bearer $API_KEY"
```

### 5. 重置与备份

```bash
rm server/data/db.json      # 重启 dev:server 后自动重新播种（15 任务 × 5 模型）
cp -R server/data ~/backup/ # 全量备份：db.json + 上传的 sites/thumbs 文件
```

---

## 前端切换真实接口的方法

1. 构建/运行时设置 `VITE_API_BASE_URL`：开发 `http://localhost:3001`；生产同源填 `/`；也可指向远端 `https://api.example.com`。
2. 前端 `api.ts` 检测到该变量非空即自动走真实分支（GET 读接口）；为空回落内置 mock。
3. 缩略图与预览路径由后端返回的 `thumb_url` / `preview_url` 决定，可用相对路径或 CDN 绝对 URL（相对路径会被 `PUBLIC_BASE_URL` 前缀）。

## 存储结构（server/data/db.json）

```
tasks         (id, index, summary, prompt, created_at)
models        (id, name, is_mono, icon_url, color, created_at)
generations   (task_id, model_id, preview_url, thumb_url, thumb_mobile_url, status, updated_at)
              键：(task_id, model_id)
```

当前实现为 JSON 文件存储（规模小、便于人工检查），接口层与存储解耦，
需要时可平滑替换为 SQLite/Postgres。`Task.available_models` 由 generations 动态计算。

## 备注：占位缩略图（自动渲染）

- 前端当前内置 5 个模型、15 个任务的 mock 数据（`client/src/lib/mockData.ts`）。
- 缩略图**不再使用静态占位文件**：当 `thumb_url` 为空、加载中或加载失败时，
  前端用模型的 `color` 色系自动渲染线框风格占位图
  （`client/src/components/PlaceholderThumb.tsx`），亮/暗主题自适应。
  真实缩略图就绪后由后端返回 `thumb_url`（建议 `.webp`），前端在其加载完成后淡入覆盖。
- `client/public/sites` 下为**占位**预览页（说明性内容），后端就绪后请以真实生成结果替换。
- 模型图标（`client/public/model-icons/*.svg`）取自参考站真实图标，可继续沿用。
