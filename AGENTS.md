# Frontend Arena Data Management Info

This file documents useful project information discovered during the data management and card upload tasks.

## Deployment Environments & API Configuration

- **Local Docker Environment**:
  - URL: `http://localhost:3000/api/v1`
  - Auth: Uses the Bearer token defined as `API_KEY` in the `.env` file.
  - Port: Hosted on port `3000`.

- **Online Production Environment**:
  - URL: `https://frontend-arena.muserquantity.cn/api/v1`

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
