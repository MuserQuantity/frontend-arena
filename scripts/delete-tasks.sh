#!/usr/bin/env bash
# 删除 Frontend Arena 任务（级联删除其体验卡与上传文件，不可逆！）
# 剩余任务会由服务端自动重排为连续序号。
#
# 用法:
#   scripts/delete-tasks.sh local task_02 task_04 ...   # 本地 Docker (localhost:3000)
#   scripts/delete-tasks.sh prod  task_02 task_04 ...   # 线上生产环境
#
# 密钥来源（项目根目录 .env，已 gitignore）:
#   local → API_KEY        prod → PROD_API_KEY
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_NAME="${1:-}"
shift || true

case "$ENV_NAME" in
  local) BASE="http://localhost:3000/api/v1"; KEY_VAR="API_KEY" ;;
  prod)  BASE="https://frontend-arena.muserquantity.cn/api/v1"; KEY_VAR="PROD_API_KEY" ;;
  *) echo "用法: $0 <local|prod> <task_id...>"; exit 1 ;;
esac

[ $# -ge 1 ] || { echo "缺少 task id。用法: $0 <local|prod> <task_id...>"; exit 1; }

KEY="$(grep "^${KEY_VAR}=" "$ROOT/.env" | head -1 | cut -d= -f2- || true)"
[ -n "$KEY" ] || { echo "错误: .env 中没有 ${KEY_VAR}"; exit 1; }

echo "目标环境: $ENV_NAME ($BASE)"
echo "将删除以下任务（级联删除体验卡，不可逆）:"
for id in "$@"; do
  SUMMARY=$(curl -s --max-time 15 "$BASE/tasks/$id" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d['data']['summary'][:60] if d.get('data') else '(不存在，将跳过)')" 2>/dev/null || echo "(查询失败)")
  printf "  %-16s %s\n" "$id" "$SUMMARY"
done

read -r -p "确认删除? 输入 yes 继续: " CONFIRM
[ "${CONFIRM:-}" = "yes" ] || { echo "已取消，未做任何改动"; exit 0; }

echo "执行删除:"
for id in "$@"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X DELETE \
    "$BASE/tasks/$id" -H "Authorization: Bearer $KEY")
  echo "  $id → HTTP $CODE"   # 200 成功 / 404 不存在 / 401 密钥错误
done

echo "复核 — 剩余任务:"
curl -s --max-time 15 "$BASE/tasks" | python3 -c "
import json,sys
d=json.load(sys.stdin)['data']
print('  共', len(d), '个')
for t in d: print(f\"  {t['index']+1:02d} | {t['id']:16s} | {t['summary'][:50]}\")"
