---
name: arena
description: 管理 Frontend Arena 数据：增删改模型 / 任务（提示词）/ 前端体验卡（生成结果）
argument-hint: "<想做什么，如：新增模型 DeepSeek V4 蓝色系 / 给任务3上传fable的页面 xx.html>"
allowed-tools:
  - read
  - grep
  - glob
  - exec
  - edit
permissions:
  allow:
    - Read(.env)
    - Exec(curl)
    - Exec(lsof)
---

你是 Frontend Arena 的数据管理助手。用户的需求：**$ARGUMENTS**

按下面的流程完成操作。完整接口契约见项目根目录 API.md。

## 1. 准备

```bash
KEY=$(grep '^API_KEY=' .env | cut -d= -f2)   # 不要把 key 打印到对话里
B=http://localhost:3001/api/v1
```

- 用 `lsof -i :3001 -sTCP:LISTEN` 确认 API 在线。**不在线时先询问用户**：
  由用户在自己终端跑 `pnpm dev:server`，或经用户同意后你临时后台启动、操作完立即停掉。
- 先 `GET $B/models` 和 `GET $B/tasks` 拿现状，把用户口语（如 "fable"、"任务3"）解析成
  准确的 `id`（模型如 `fable-5-max`；任务序号 N 对应 `index == N-1` 的 task id）。
  有歧义时列出候选让用户选。

## 2. 数据约定速查

**模型**：`name` 展示名 · `id` 可省略（由 name 生成 slug）· `color` 占位缩略图色系（hex，
选和厂商品牌接近的颜色）· `is_mono` 单色图标为 true（CSS mask 渲染跟随文字色）·
`icon_url` 按**厂商**命名共用：`/model-icons/{vendor}.svg`（现有 claude / gemini / glm / gpt，
如 Fable-5 Max 与 Opus-4.8 Max 共用 claude.svg）。新厂商需把 svg 放进
`client/public/model-icons/<vendor>.svg`（用户没给图标文件就先建模型、提醒补图标）。

**任务**：`summary` 单行摘要 · `prompt` 完整提示词 · `index` 排序（0 起，可省略追加末尾）。

**体验卡**（Generation，任务 × 模型的生成结果）：
- 上传文件：`POST $B/tasks/{taskId}/generations/{modelId}/upload`，multipart 字段
  `html`（可交互页面）、`thumb`、`thumb_mobile`（webp/png/jpg/svg）。含 html 时状态自动转 ready。
- 已有外部托管 url：`PUT` 同路径，body 直接写 `preview_url` / `thumb_url` / `status`。
- `status`：`ready` 可点击查看 ｜ `pending` / `failed` 卡片置灰。
- 缩略图为 16:10（建议 640×400）；**不传缩略图也可以**，前端会按模型色系自动渲染线框占位图。
- 用户只给了 html 时，可提议用无头 Chrome 给页面截一张 16:10 缩略图再一起上传（需用户同意）。

## 3. 操作模板

```bash
# 新增模型
curl -X POST $B/models -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"name":"DeepSeek V4","is_mono":true,"color":"#4f46e5","icon_url":"/model-icons/deepseek.svg"}'

# 修改（模型 PATCH $B/models/{id}；任务 PATCH $B/tasks/{id}；体验卡 PATCH $B/tasks/{tid}/generations/{mid}）
curl -X PATCH $B/models/deepseek-v4 -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{"color":"#0891b2"}'

# 新增任务
curl -X POST $B/tasks -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"summary":"贪吃蛇游戏","prompt":"完整提示词..."}'

# 上传体验卡
curl -X POST $B/tasks/{taskId}/generations/{modelId}/upload -H "Authorization: Bearer $KEY" \
  -F "html=@/path/page.html;type=text/html" -F "thumb=@/path/thumb.webp;type=image/webp"

# 删除（模型/任务/体验卡同理用 DELETE）
curl -X DELETE $B/tasks/{taskId} -H "Authorization: Bearer $KEY"
```

## 4. 规则

- **一切通过 API 操作，绝不直接改 `server/data/db.json`**（服务端内存会覆盖文件改动）。
- 删除是级联的（删模型/任务会连带删其体验卡和上传文件）——**执行任何删除前必须向用户复述影响并确认**。
- 写操作若返回 401/400，检查 key 与 body 格式；404 先核对 id 是否解析正确。
- 完成后用 GET 复查结果，向用户简要汇报（做了什么、新 id 是什么），提醒刷新浏览器即可看到。
- `db.json` 是运行时数据；若用户要求改动"长期/默认生效"（换机器或重置后仍在），
  需同步修改种子 `client/src/lib/mockData.ts`，并注意占位页 `client/public/sites/{NN}/{model_id}.html`
  的文件名要跟着模型 id 走。
