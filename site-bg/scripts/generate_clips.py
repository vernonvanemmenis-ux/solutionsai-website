"""Generate the 4 SolutionsAI reel clips via kie.ai Veo 3 Fast.

Reads KIE_API_KEY from C:\\Users\\verno\\SolutionsAI_Projects\\.env.
Posts 4 generations in parallel, polls /record-info until each is done,
downloads the resulting MP4s into ../clips/scene-N.mp4.

Run:
    python generate_clips.py
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

DOWNLOAD_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

ROOT = Path(__file__).resolve().parents[1]
CLIPS_DIR = ROOT / "clips"
CLIPS_DIR.mkdir(parents=True, exist_ok=True)

ENV_PATH = Path(r"C:\Users\verno\SolutionsAI_Projects\Nano Banana2\.env")
load_dotenv(ENV_PATH)
API_KEY = os.environ.get("KIE_API_KEY")
if not API_KEY:
    sys.exit(f"KIE_API_KEY not found in {ENV_PATH}")

API_BASE = "https://api.kie.ai/api/v1/veo"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
MODEL = "veo3_fast"
ASPECT = "16:9"
POLL_INTERVAL = 15
POLL_TIMEOUT = 60 * 12

PROMPTS = {
    "scene-1-ledger-island": (
        "Cinematic 3D fantasy render in Unreal Engine 5 style, photoreal CGI. "
        "A floating sky-island at golden hour, drifting in a vast cloud sea. "
        "Weathered stone slab covered in moss and tufted grass. Centred on it stands "
        "a heavy Victorian-era wooden writing desk with leather-bound ledgers stacked "
        "open, ink quills, a brass oil lamp glowing warm amber, a brass abacus, and "
        "loose papers held by an iron paperweight. Warm amber lantern light pools "
        "across the desk; cool cyan rim light from a glowing portal-stone at the "
        "island's edge. Glowing cyan-blue data ribbons trail off the right edge of "
        "the island toward a distant second island barely visible in the clouds. "
        "Slow horizontal dolly with a gentle forward push. Anamorphic lens flares, "
        "soft volumetric god rays, deep depth of field, dusk peach-and-cobalt sky. "
        "16:9. No text, no UI, no people, no logos."
    ),
    "scene-2-crt-island": (
        "Cinematic 3D fantasy render in Unreal Engine 5 style, photoreal CGI. "
        "A smaller industrial floating sky-island at golden hour: a riveted metal-grate "
        "platform bolted to a stone chunk, cables draped over the edges, drifting in "
        "the same cloud sea as the previous scene. Centred on it sits a beige early-"
        "1990s desktop computer setup: boxy CRT monitor showing glowing green phosphor "
        "text, mechanical keyboard, a dot-matrix printer trailing continuous-feed paper "
        "off the platform edge, a small desk lamp casting amber light. The CRT bathes "
        "the foreground in a cool green-blue glow. Glowing cyan-blue data ribbons enter "
        "from the left and exit right toward a distant third island. Slow horizontal "
        "dolly. Anamorphic lens, volumetric haze, depth of field, dusk peach-and-cobalt "
        "sky. 16:9. No text, no UI, no people, no logos."
    ),
    "scene-3-saas-island": (
        "Cinematic 3D fantasy render in Unreal Engine 5 style, photoreal CGI. "
        "A larger modern floating sky-island at golden hour, drifting in the same cloud "
        "sea: a polished obsidian platform with subtle glowing cyan edge runes, holding "
        "a minimalist white desk. Floating above the desk hover several semi-translucent "
        "glass dashboard panels showing cool cyan-blue bar charts, line graphs and pie "
        "charts, drifting at slight angles. A pair of slender chrome floor-lamps cast "
        "soft warm fill light. Glowing cyan-blue data ribbons stream in from the left "
        "and arc out right toward a fourth larger island. Slow horizontal dolly with "
        "mild forward push. Anamorphic lens flares, volumetric atmosphere, deep depth "
        "of field, late-golden-hour sky. 16:9. No text, no UI, no people, no logos."
    ),
    "scene-4-ai-island": (
        "Cinematic 3D fantasy render in Unreal Engine 5 style, photoreal CGI. "
        "The largest, most futuristic floating sky-island at dusk turning to night, "
        "drifting in the same cloud sea: a curved obsidian platform inlaid with "
        "concentric glowing cyan rings. At the centre rises a tall holographic spire "
        "emitting cyan-blue voice-waveform ribbons that swirl outward, surrounded by "
        "several floating holographic agent avatars — semi-translucent humanoid "
        "silhouettes formed from glowing cyan data points. Deep cobalt sky with the "
        "last glow of sunset. Glowing cyan-blue data ribbons converge into the island "
        "from the left. Soft volumetric cyan haze pulses across the scene. Slow "
        "horizontal dolly with slight downward tilt revealing the island's full curve. "
        "Anamorphic lens flares, deep volumetric god rays. 16:9. No text, no UI, no "
        "people other than the holographic avatars, no logos."
    ),
}


def submit(prompt: str) -> str:
    body = {
        "prompt": prompt,
        "model": MODEL,
        "aspect_ratio": ASPECT,
        "enableFallback": True,
        "enableTranslation": False,
    }
    r = requests.post(f"{API_BASE}/generate", headers=HEADERS, json=body, timeout=60)
    r.raise_for_status()
    data = r.json()
    if data.get("code") != 200:
        raise RuntimeError(f"submit failed: {data}")
    task_id = data["data"]["taskId"]
    return task_id


def poll(task_id: str) -> dict:
    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        r = requests.get(
            f"{API_BASE}/record-info",
            headers=HEADERS,
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


def run_one(name: str, prompt: str) -> Path:
    print(f"[{name}] submitting...", flush=True)
    task_id = submit(prompt)
    print(f"[{name}] taskId={task_id} polling...", flush=True)
    record = poll(task_id)
    url = first_url(record)
    out = CLIPS_DIR / f"{name}.mp4"
    print(f"[{name}] downloading {url[:80]}...", flush=True)
    with requests.get(url, headers=DOWNLOAD_HEADERS, stream=True, timeout=180) as r:
        r.raise_for_status()
        with out.open("wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 256):
                f.write(chunk)
    print(f"[{name}] saved -> {out.name} ({out.stat().st_size // 1024} KB)", flush=True)
    return out


def main() -> None:
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(run_one, name, prompt): name for name, prompt in PROMPTS.items()}
        results = {}
        for fut in as_completed(futures):
            name = futures[fut]
            try:
                results[name] = fut.result()
            except Exception as exc:
                print(f"[{name}] FAILED: {exc}", flush=True)
                results[name] = None

    print("\nResults:")
    for name, path in results.items():
        print(f"  {name}: {path if path else 'FAILED'}")
    if any(p is None for p in results.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
