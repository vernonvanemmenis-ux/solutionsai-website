"""Download Veo3 outputs by taskId (skips re-submission, no credit spend).

Usage: edit TASK_IDS below if needed, then run.
Uses requests with a real User-Agent (urlretrieve was getting 403 from kie.ai's CDN).
"""
from __future__ import annotations

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
CLIPS_DIR = ROOT / "clips"
CLIPS_DIR.mkdir(parents=True, exist_ok=True)

ENV_PATH = Path(r"C:\Users\verno\SolutionsAI_Projects\Nano Banana2\.env")
load_dotenv(ENV_PATH)
API_KEY = os.environ.get("KIE_API_KEY")
if not API_KEY:
    sys.exit(f"KIE_API_KEY not found in {ENV_PATH}")

API_BASE = "https://api.kie.ai/api/v1/veo"
API_HEADERS = {"Authorization": f"Bearer {API_KEY}"}
DOWNLOAD_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

TASK_IDS = {
    "scene-1-ledger-island": "84e883988897a6dce7ac4b4f62a2544b",
    "scene-2-crt-island":    "b572a46d423f2efcbbaf09192365015f",
    "scene-3-saas-island":   "a06c3823fff59a3ed9f48d944bfe4f70",
    "scene-4-ai-island":     "950a5747eac8b5f8e310bbca83ec3532",
}

POLL_INTERVAL = 12
POLL_TIMEOUT = 60 * 12


def fetch_record(task_id: str) -> dict:
    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        r = requests.get(
            f"{API_BASE}/record-info",
            headers=API_HEADERS,
            params={"taskId": task_id},
            timeout=30,
        )
        r.raise_for_status()
        data = r.json().get("data", {}) or {}
        success = data.get("successFlag")
        if success == 1:
            return data
        if success in (2, 3):
            raise RuntimeError(
                f"task {task_id} failed: code={data.get('errorCode')} msg={data.get('errorMessage')}"
            )
        time.sleep(POLL_INTERVAL)
    raise TimeoutError(f"task {task_id} did not finish within {POLL_TIMEOUT}s")


def first_url(record: dict) -> str:
    resp = record.get("response") or {}
    urls = resp.get("resultUrls") or []
    if isinstance(urls, str):
        try:
            urls = json.loads(urls)
        except json.JSONDecodeError:
            urls = [urls]
    if not urls:
        raise RuntimeError(f"no resultUrls in record: {record}")
    return urls[0]


def download(url: str, dest: Path) -> None:
    with requests.get(url, headers=DOWNLOAD_HEADERS, stream=True, timeout=180) as r:
        r.raise_for_status()
        with dest.open("wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 256):
                f.write(chunk)


def run_one(name: str, task_id: str) -> Path:
    print(f"[{name}] fetching record...", flush=True)
    rec = fetch_record(task_id)
    url = first_url(rec)
    out = CLIPS_DIR / f"{name}.mp4"
    print(f"[{name}] downloading...", flush=True)
    download(url, out)
    print(f"[{name}] saved -> {out.name} ({out.stat().st_size // 1024} KB)", flush=True)
    return out


def main() -> None:
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(run_one, n, t): n for n, t in TASK_IDS.items()}
        results = {}
        for fut in as_completed(futs):
            n = futs[fut]
            try:
                results[n] = fut.result()
            except Exception as exc:
                print(f"[{n}] FAILED: {exc}", flush=True)
                results[n] = None
    print("\nResults:")
    for n, p in results.items():
        print(f"  {n}: {p if p else 'FAILED'}")
    if any(p is None for p in results.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
