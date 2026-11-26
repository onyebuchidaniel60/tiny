#!/usr/bin/env python3
"""Build a reviewed Tiny preview demo from real emulator screenshots.

Narration uses the locally installed Windows SAPI voice (free, offline).
No cloud TTS or paid service is used. The video is a slideshow of actual
emulator screenshots plus captions; it does not claim motion capture.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "artifacts" / "emulator"
OUT = ROOT / "artifacts" / "demo"
BUILD = OUT / "build"
OUT.mkdir(parents=True, exist_ok=True)
BUILD.mkdir(parents=True, exist_ok=True)

PAPER = (247, 240, 225)
PAPER_2 = (251, 246, 234)
INK = (29, 42, 36)
INK_SOFT = (76, 91, 82)
FOREST = (30, 91, 72)
TOMATO = (216, 92, 61)
COBALT = (37, 90, 168)
BUTTER = (241, 196, 83)
WHITE = (255, 253, 247)

FONT_SERIF = "C:/Windows/Fonts/georgiab.ttf"
FONT_SERIF_REG = "C:/Windows/Fonts/georgia.ttf"
FONT_SANS = "C:/Windows/Fonts/segoeui.ttf"
FONT_SANS_BOLD = "C:/Windows/Fonts/segoeuib.ttf"

SCENES = [
    {
        "id": "01-intro",
        "kicker": "Tiny · teacher preview",
        "title": "Big impact.\nSmall requirements.",
        "body": "An offline-first teacher tool for rural primary schools. Parents use ordinary SMS. Pupils have no account or app.",
        "shot": "tiny-03-home.png",
        "narration": "Tiny is an offline-first teacher tool for rural primary schools. Teachers use the Android phone they already have. Parents use ordinary SMS, and pupils have no account or app.",
    },
    {
        "id": "02-language",
        "kicker": "Language",
        "title": "A teacher chooses\nthe language.",
        "body": "English, Hausa, Yoruba or Igbo. Non-English interface strings are drafts and fall back to English until native review.",
        "shot": "tiny-01-language.png",
        "narration": "Teachers can choose English, Hausa, Yoruba, or Igbo. The non-English interface strings are drafts, and missing text falls back to English until native review.",
    },
    {
        "id": "03-welcome",
        "kicker": "Honest preview",
        "title": "Local first.\nNo fake cloud.",
        "body": "Cloud sync and live SMS are not connected. The preview runs on synthetic data only.",
        "shot": "tiny-02-welcome.png",
        "narration": "This build is deliberately honest. Cloud sync and live SMS are not connected. The preview runs on synthetic data only.",
    },
    {
        "id": "04-home",
        "kicker": "Home",
        "title": "The next useful\naction.",
        "body": "Today's classes, pending sync, parent messages and quick actions in one calm dashboard.",
        "shot": "tiny-03-home.png",
        "narration": "The home screen shows today's classes, pending sync, parent messages, and the next useful action.",
    },
    {
        "id": "05-classes",
        "kicker": "Classes",
        "title": "More than one\nclass.",
        "body": "A teacher can manage multiple classes, open a roster and add a pupil locally.",
        "shot": "tiny-04-classes.png",
        "narration": "A teacher can manage more than one class, view the roster, and add a pupil locally.",
    },
    {
        "id": "06-attendance",
        "kicker": "Offline attendance",
        "title": "Mark the register.\nSubmit locally.",
        "body": "Only absent pupils create an immediate notification job after server acceptance. Present and late do not.",
        "shot": "tiny-06-attendance.png",
        "narration": "Attendance works offline. Mark every active pupil, review the register, and submit locally. Only absences create an immediate notification job after server acceptance.",
    },
    {
        "id": "07-lessons",
        "kicker": "5E lessons",
        "title": "A plan that opens\nwithout signal.",
        "body": "A saved 5E lesson is a teacher-authored scaffold, not a claim of full NERDC coverage.",
        "shot": "tiny-07-lessons.png",
        "narration": "A saved 5E lesson opens without internet. It is a teacher-authored scaffold, not a claim of full NERDC coverage.",
    },
    {
        "id": "08-messages",
        "kicker": "Parent SMS",
        "title": "Parents reply\nby ordinary SMS.",
        "body": "In this preview the SMS adapter is mocked, so nothing leaves the device.",
        "shot": "tiny-08-messages.png",
        "narration": "Parent conversations arrive through the SMS adapter. In this preview the adapter is mocked, so nothing leaves the device.",
    },
    {
        "id": "09-conversation",
        "kicker": "Teacher reply",
        "title": "No personal\nphone number.",
        "body": "A teacher replies from Tiny. Provider acceptance is not the same as delivery.",
        "shot": "tiny-09-conversation.png",
        "narration": "A teacher can reply from Tiny without exposing a personal phone number. Provider acceptance is not the same as delivery.",
    },
    {
        "id": "10-settings",
        "kicker": "Settings",
        "title": "Language, sync\nand privacy.",
        "body": "The Note 10 plus is a general test device. Gemini Nano requires supported physical hardware.",
        "shot": "tiny-10-settings.png",
        "narration": "Settings contains language, sync, and privacy controls. The Note 10 plus is a general test device; Gemini Nano needs supported hardware.",
    },
    {
        "id": "11-final",
        "kicker": "The next gates",
        "title": "Big impact.\nSmall requirements.",
        "body": "Remaining gates: Firebase access, App Distribution, native translation review and a supported on-device AI device.",
        "shot": None,
        "narration": "Tiny is not finished. The remaining gates are Firebase access, App Distribution, native translation review, and a supported on-device AI device. Big impact. Small requirements. Accessible everywhere.",
    },
]

W, H = 1920, 1080


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def wrap(text: str, width: int) -> str:
    return "\n".join(textwrap.fill(line, width=width) for line in text.split("\n"))


def make_background() -> Image.Image:
    img = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    for y in range(0, H, 10):
        for x in range(0, W, 10):
            if (x + y) % 20 == 0:
                draw.ellipse((x, y, x + 1, y + 1), fill=(226, 215, 195))
    draw.rounded_rectangle((48, 48, W - 48, H - 48), radius=36, outline=(205, 187, 159), width=2)
    return img


def add_wordmark(img: Image.Image) -> None:
    draw = ImageDraw.Draw(img)
    draw.ellipse((84, 74, 134, 124), fill=FOREST, outline=INK, width=2)
    draw.text((99, 82), "T", font=font(FONT_SERIF, 34), fill=PAPER)
    draw.ellipse((124, 72, 138, 86), fill=TOMATO, outline=INK, width=1)
    draw.text((151, 78), "Tiny", font=font(FONT_SERIF, 42), fill=INK)
    draw.text((152, 124), "Big impact. Small requirements.", font=font(FONT_SANS_BOLD, 18), fill=INK_SOFT)


def add_chip(img: Image.Image, x: int, y: int, text: str, fill: tuple[int, int, int], color: tuple[int, int, int] = INK) -> int:
    draw = ImageDraw.Draw(img)
    f = font(FONT_SANS_BOLD, 18)
    bbox = draw.textbbox((0, 0), text, font=f)
    w = bbox[2] - bbox[0] + 28
    h = 34
    draw.rounded_rectangle((x, y, x + w, y + h), radius=17, fill=fill, outline=INK, width=2)
    draw.text((x + 14, y + 7), text, font=f, fill=color)
    return x + w + 10


def add_phone(img: Image.Image, shot_path: Path) -> None:
    shot = Image.open(shot_path).convert("RGB")
    target_h = 860
    target_w = int(shot.width * target_h / shot.height)
    shot = shot.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = W - target_w - 160
    y = 110
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((x - 18, y - 18, x + target_w + 18, y + target_h + 18), radius=42, fill=(29, 42, 36))
    draw.rounded_rectangle((x - 4, y - 4, x + target_w + 4, y + target_h + 4), radius=32, fill=INK)
    img.paste(shot, (x, y))
    draw.rounded_rectangle((x - 4, y - 4, x + target_w + 4, y + target_h + 4), radius=32, outline=(12, 18, 15), width=3)


def make_frame(scene: dict, index: int, total: int) -> Path:
    img = make_background()
    add_wordmark(img)
    draw = ImageDraw.Draw(img)
    x = 100
    y = 220
    add_chip(img, x, y, scene["kicker"].upper(), BUTTER)
    y += 58
    title_font = font(FONT_SERIF, 76 if len(scene["title"]) < 35 else 66)
    title = wrap(scene["title"], 25 if len(scene["title"]) < 35 else 27)
    draw.multiline_text((x, y), title, font=title_font, fill=INK, spacing=6)
    y += (title.count("\n") + 1) * (92 if len(scene["title"]) < 35 else 80)
    draw.line((x, y + 4, x + 250, y + 4), fill=TOMATO, width=5)
    y += 34
    body_font = font(FONT_SANS, 30)
    body = wrap(scene["body"], 48)
    draw.multiline_text((x, y), body, font=body_font, fill=INK_SOFT, spacing=10)
    y += (body.count("\n") + 1) * 40
    add_chip(img, x, y + 18, "PREVIEW BUILD", PAPER_2, FOREST)
    add_chip(img, x + 190, y + 18, "SYNTHETIC DATA", PAPER_2, TOMATO)
    if scene["shot"]:
        add_phone(img, SHOTS / scene["shot"])
    else:
        draw.rounded_rectangle((1130, 180, 1790, 860), radius=36, fill=FOREST, outline=INK, width=3)
        draw.multiline_text((1190, 280), "Big impact.\nSmall\nrequirements.", font=font(FONT_SERIF, 72), fill=PAPER, spacing=8)
        draw.text((1190, 620), "Accessible everywhere.", font=font(FONT_SERIF_REG, 35), fill=BUTTER)
    draw.text((100, H - 88), "Tiny preview · no live SMS · no production data", font=font(FONT_SANS_BOLD, 19), fill=INK_SOFT)
    draw.text((W - 220, H - 88), f"{index:02d} / {total:02d}", font=font(FONT_SANS_BOLD, 19), fill=INK_SOFT)
    path = BUILD / f"{scene['id']}.png"
    img.save(path)
    return path


def sapi_wav(text: str, wav: Path) -> None:
    script = (
        "Add-Type -AssemblyName System.Speech; "
        "$s=New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        "$s.SelectVoice('Microsoft Zira Desktop'); $s.Rate=-1; $s.Volume=100; "
        "$s.SetOutputToWaveFile($env:TINY_WAV); $s.Speak($env:TINY_TEXT); $s.Dispose()"
    )
    env = dict(os.environ, TINY_WAV=str(wav), TINY_TEXT=text)
    subprocess.run(["powershell", "-NoProfile", "-Command", script], check=True, env=env)


def duration(path: Path) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ], text=True).strip()
    return float(out)


def build() -> None:
    if not SHOTS.exists():
        raise SystemExit(f"Missing emulator screenshots: {SHOTS}")
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("ffmpeg not found on PATH")

    frames = []
    audio_files = []
    durations = []
    for i, scene in enumerate(SCENES, start=1):
        frame = make_frame(scene, i, len(SCENES))
        frames.append(frame)
        wav = BUILD / f"{scene['id']}.wav"
        sapi_wav(scene["narration"], wav)
        audio_files.append(wav)
        durations.append(duration(wav))

    segment_paths = []
    total = 0.0
    for scene, frame, wav, audio_duration in zip(SCENES, frames, audio_files, durations):
        seg_duration = max(6.0, audio_duration + 1.2)
        total += seg_duration
        seg = BUILD / f"{scene['id']}.mp4"
        subprocess.run([
            ffmpeg, "-y", "-loop", "1", "-framerate", "30", "-i", str(frame),
            "-i", str(wav),
            "-filter_complex", "[0:v]scale=1920:1080,format=yuv420p[v];[1:a]aresample=44100,apad[a]",
            "-map", "[v]", "-map", "[a]", "-t", f"{seg_duration:.3f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "160k", "-shortest", str(seg),
        ], check=True)
        segment_paths.append(seg)

    concat_file = BUILD / "segments.txt"
    concat_file.write_text("\n".join(f"file '{p.as_posix()}'" for p in segment_paths), encoding="utf-8")
    final = OUT / "tiny-demo.mp4"
    subprocess.run([
        ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file),
        "-c", "copy", "-movflags", "+faststart", str(final),
    ], check=True)

    # Captions
    caption_lines = []
    clock = 0.0
    for i, (scene, audio_duration) in enumerate(zip(SCENES, durations), start=1):
        seg_duration = max(6.0, audio_duration + 1.2)
        start = clock
        end = clock + seg_duration
        def ts(value: float) -> str:
            ms = int(round(value * 1000))
            h, rem = divmod(ms, 3600000)
            m, rem = divmod(rem, 60000)
            s, ms = divmod(rem, 1000)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
        caption_lines.append(f"{i}\n{ts(start)} --> {ts(end)}\n{scene['body']}\n")
        clock = end
    (OUT / "captions.srt").write_text("\n".join(caption_lines), encoding="utf-8")

    script = ["# Tiny demo narration script", "", f"Target: 90–150s; rendered: {total:.1f}s", "", "## Scenes", ""]
    for i, (scene, audio_duration) in enumerate(zip(SCENES, durations), start=1):
        script.append(f"### {i:02d}. {scene['kicker']}")
        script.append("")
        script.append(scene["narration"])
        script.append("")
    (OUT / "narration-script.md").write_text("\n".join(script), encoding="utf-8")

    notes = f"""# Tiny demo production notes

- Source: actual Android emulator screenshots from GitHub Actions run 45789068836.
- Platform: Windows ffmpeg + Pillow + Windows SAPI (Microsoft Zira Desktop).
- TTS: local, free, offline fallback. No Google AI TTS credentials/paid service were used.
- Capture limitation: this is a reviewed screenshot slideshow with narration, not motion screen recording. It does not claim real parent SMS delivery or on-device Gemini Nano inference.
- Synthetic data only; no real pupil/guardian data.
- Rendered duration: {total:.1f}s.
- Output: `artifacts/demo/tiny-demo.mp4`.
- Captions: `artifacts/demo/captions.srt`.
"""
    (OUT / "production-notes.md").write_text(notes, encoding="utf-8")
    print(json.dumps({"duration": total, "output": str(final)}, indent=2))


if __name__ == "__main__":
    build()
