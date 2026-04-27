"""Stitch the 4 reel clips with 1 s cross-fades, then extract JPG frames.

Inputs : ../clips/scene-1-spaza-dawn.mp4
         ../clips/scene-2-office-morning.mp4
         ../clips/scene-3-boardroom-sunset.mp4
         ../clips/scene-4-ai-command-night.mp4

Output : ../clips/master.mp4
         ../../assets/bg-frames/frame-NNNN.jpg  (~200 frames @ 12 fps)

Run:
    python stitch_and_extract.py
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
WEBSITE = ROOT.parent
CLIPS_DIR = ROOT / "clips"
FRAMES_DIR = WEBSITE / "assets" / "bg-frames"
MASTER = CLIPS_DIR / "master.mp4"

CLIP_DURATION = 5.0
XFADE = 1.0
EXTRACT_FPS = 12

CLIPS = [
    CLIPS_DIR / "scene-1-ledger-island.mp4",
    CLIPS_DIR / "scene-2-crt-island.mp4",
    CLIPS_DIR / "scene-3-saas-island.mp4",
    CLIPS_DIR / "scene-4-ai-island.mp4",
]

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd: list[str]) -> None:
    print("$", " ".join(f'"{c}"' if " " in c else c for c in cmd[:6]) + " ...", flush=True)
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        sys.stderr.write(res.stderr[-2000:])
        raise SystemExit(res.returncode)


def stitch() -> None:
    for c in CLIPS:
        if not c.exists():
            sys.exit(f"missing input clip: {c}")

    inputs: list[str] = []
    for c in CLIPS:
        inputs += ["-i", str(c)]

    offsets = [
        CLIP_DURATION - XFADE,
        2 * CLIP_DURATION - 2 * XFADE,
        3 * CLIP_DURATION - 3 * XFADE,
    ]
    filter_parts = [
        f"[0:v][1:v]xfade=transition=fade:duration={XFADE}:offset={offsets[0]}[v01]",
        f"[v01][2:v]xfade=transition=fade:duration={XFADE}:offset={offsets[1]}[v012]",
        f"[v012][3:v]xfade=transition=fade:duration={XFADE}:offset={offsets[2]}[v]",
    ]
    filter_complex = ";".join(filter_parts)

    cmd = [
        FFMPEG, "-y", *inputs,
        "-filter_complex", filter_complex,
        "-map", "[v]", "-an",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        str(MASTER),
    ]
    run(cmd)
    print(f"stitched -> {MASTER.name} ({MASTER.stat().st_size // 1024} KB)", flush=True)


def extract() -> None:
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        FFMPEG, "-y", "-i", str(MASTER),
        "-vf", f"fps={EXTRACT_FPS},scale=1280:720:flags=lanczos",
        "-q:v", "6",
        str(FRAMES_DIR / "frame-%04d.jpg"),
    ]
    run(cmd)
    frames = sorted(FRAMES_DIR.glob("frame-*.jpg"))
    total_kb = sum(f.stat().st_size for f in frames) // 1024
    print(f"extracted {len(frames)} frames -> {FRAMES_DIR.relative_to(WEBSITE)} ({total_kb} KB total)", flush=True)


if __name__ == "__main__":
    stitch()
    extract()
