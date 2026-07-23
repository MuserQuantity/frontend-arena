# Frontend Arena Data Management Info

This file documents useful project information discovered during the data management and card upload tasks.

## ⚠️ Upload Collision Gotcha (index-based storage)

The server stores generation files by the task's **current index**: `sites/{NN}/{model_id}.html`
(`NN` = zero-padded index). But deleting tasks **resequences indexes without moving files**, so a
task's stored directory can go stale (e.g. a task at index 4 whose files still live in `sites/08/`).
Any later upload for a *different* task that now occupies index 8 will **silently overwrite** the
stale files (this destroyed 4 cards on 2026-07-06; they had to be regenerated/restored).

Rules before ANY `/upload`:
1. `GET /tasks` and `GET /tasks/{id}/generations` — verify for every task that
   `preview_url` dir == current `index`. If any mismatch exists, migrate first.
2. Migration = re-upload each generation's current files via the API (download from `preview_url`,
   POST to the same task) **in ascending target-index order**; the server re-homes files to the
   current index dir and updates URLs.
3. As of 2026-07-17 both local and prod are fully aligned (dir == index for all 10 tasks).
   Keep it that way: avoid deleting tasks; if a deletion is necessary, re-run the alignment
   check afterwards before any new upload.

## Deployment Environments & API Configuration

- **Local Docker Environment**:
  - URL: `http://localhost:3000/api/v1`
  - Auth: Uses the Bearer token defined as `API_KEY` in the `.env` file.
  - Port: Hosted on port `3000`.

- **Online Production Environment**:
  - URL: `https://frontend-arena.muserquantity.cn/api/v1`

## Runtime Data Policy

Models, tasks, prompts, uploaded HTML, and thumbnails are runtime data under `server/data/`.
They must not be added to Git or mirrored into source-code seeds / `client/public/sites/`.
Back up and restore the complete data directory when moving environments.

## Task Deletion Script

`scripts/delete-tasks.sh` deletes tasks (cascades to experience cards; remaining
tasks are auto-resequenced by the server). Keys are read from `.env`
(`API_KEY` for local, `PROD_API_KEY` for prod). Interactive confirmation required.

```bash
scripts/delete-tasks.sh local task_02 task_04   # local Docker (localhost:3000)
scripts/delete-tasks.sh prod  task_02 task_04   # production
```

## Thumbnail Generation with Headless Chrome

For high-quality card previews, the 16:10 thumbnails can be generated and resized on macOS as follows:

```bash
# Generate 1280x800 screenshot of the HTML file
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 \
  --virtual-time-budget=6000 --screenshot=shot.png "file:///absolute/path/to/page.html"

# Resize the screenshot to 16:10 (640x400)
sips -z 400 640 shot.png --out shot_resized.png
```

## Batch Uploading Script

To upload HTML and thumbnail generations for a specific model (e.g. `gemini-3_5-flash-high`) across all tasks, a Python script can automate headless Chrome screenshots, resizing, and multipart POST uploads:

```python
import os
import subprocess
import requests

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def generate_screenshot(index: int, html_path: str):
    nn = f"{index:02d}"
    shot_png = f"temp_shot_{nn}.png"
    resized_png = f"temp_shot_resized_{nn}.png"
    
    # Take headless chrome screenshot
    abs_html_path = os.path.abspath(html_path)
    cmd_chrome = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1280,800",
        "--virtual-time-budget=6000",
        f"--screenshot={shot_png}",
        f"file://{abs_html_path}"
    ]
    subprocess.run(cmd_chrome, capture_output=True)
    
    # Resize using sips
    cmd_sips = ["sips", "-z", "400", "640", shot_png, "--out", resized_png]
    subprocess.run(cmd_sips, capture_output=True)
    
    return shot_png, resized_png

def upload_to_env(base_url: str, api_key: str, index: int, html_path: str, thumb_path: str):
    nn = f"{index:02d}"
    task_id = f"task_{nn}"
    model_id = "gemini-3_5-flash-high"
    
    url = f"{base_url}/tasks/{task_id}/generations/{model_id}/upload"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    with open(html_path, 'rb') as f_html, open(thumb_path, 'rb') as f_thumb:
        files = {
            "html": ("gemini-3_5-flash-high.html", f_html, "text/html"),
            "thumb": ("gemini-3_5-flash-high.png", f_thumb, "image/png")
        }
        response = requests.post(url, headers=headers, files=files)
    return response.status_code in (200, 201)
```

## Cursor Cloud specific instructions

Single product (React 19 + Vite frontend + Express API, pnpm, Node 22). No external
database — runtime data is JSON-file storage under `server/data/` (auto-created empty
on first run). The update script already runs `pnpm install`.

Dev services (run each in its own tmux session; start `dev:server` before `dev`):
- `pnpm dev:server` — API + static assets on `http://localhost:3001` (`PORT=3001`, tsx watch)
- `pnpm dev` — Vite frontend on `http://localhost:3000` (reads runtime data from the API)

The frontend requires the API to be running; a fresh DB is empty, so the homepage shows
no cards until you seed models/tasks/generations via the API (see `API.md`).

- Type check / lint gate: `pnpm check` (tsc). `pnpm format` runs Prettier with `--write`
  (many files have pre-existing style warnings, so `prettier --check` is noisy — not a gate).
- No automated test suite exists (vitest is a dependency but there are no test files and no
  `test` script).
- `.env` is gitignored and optional: without it the server prints a NEW temporary `API_KEY`
  each run (reads are public; only writes need the key). For a stable write key, copy
  `.env.example` to `.env` and set `API_KEY` (e.g. `openssl rand -hex 32`).
- Do not run the local `pnpm dev:server` and the Docker container at the same time — they
  share `./server/data` and will double-write.
