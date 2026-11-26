#!/usr/bin/env bash
set -euo pipefail

APK_PATH="${1:-artifacts/app-dev-debug.apk}"
PACKAGE="ng.tiny.education.dev.debug"
ACTIVITY="ng.tiny.education.dev.debug/ng.tiny.education.MainActivity"
OUT="artifacts/emulator"
XML="/tmp/tiny-ui.xml"

mkdir -p "$OUT"

dump_ui() {
  adb shell uiautomator dump /sdcard/tiny-window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/tiny-window.xml "$XML" >/dev/null 2>&1 || true
}

tap_text() {
  local value="$1"
  dump_ui
  python3 - "$value" <<'PY'
import re, subprocess, sys
value = sys.argv[1]
try:
    xml = open('/tmp/tiny-ui.xml', encoding='utf-8').read()
except FileNotFoundError:
    sys.exit(1)
pattern = r'text="' + re.escape(value) + r'"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
match = re.search(pattern, xml)
if not match:
    sys.exit(1)
x = (int(match.group(1)) + int(match.group(3))) // 2
y = (int(match.group(2)) + int(match.group(4))) // 2
subprocess.run(['adb', 'shell', 'input', 'tap', str(x), str(y)], check=True)
PY
}

tap_coord() {
  adb shell input tap "$1" "$2"
}

screenshot() {
  local name="$1"
  adb shell screencap -p "/sdcard/${name}.png"
  adb pull "/sdcard/${name}.png" "$OUT/${name}.png" >/dev/null
}

adb install -r "$APK_PATH"
adb shell am start -n "$ACTIVITY"
sleep 7

# Emulator launchers can throw a transient ANR on slow CI hosts. Dismiss it
# without touching Tiny, then wait for the app to settle.
tap_text "Wait" || true
sleep 2
screenshot "tiny-01-language"

tap_text "Continue" || true
sleep 3
screenshot "tiny-02-welcome"

tap_text "Explore the preview" || true
sleep 4
screenshot "tiny-03-home"

# Bottom navigation is 1080 px wide on the Pixel 5 emulator profile.
tap_coord 405 2200
sleep 3
screenshot "tiny-04-classes"

tap_text "P4 Blue" || true
sleep 3
screenshot "tiny-05-class-detail"

tap_text "Mark attendance" || true
sleep 3
screenshot "tiny-06-attendance"

adb shell input keyevent 4 || true
sleep 1
adb shell input keyevent 4 || true
sleep 1

tap_coord 690 2200
sleep 3
screenshot "tiny-07-lessons"

tap_coord 945 2200
sleep 3
screenshot "tiny-08-messages"

tap_text "Amina's family" || true
sleep 3
screenshot "tiny-09-conversation"

# Settings from the top app bar; then return.
tap_coord 1005 210 || true
sleep 2
screenshot "tiny-10-settings"

dump_ui
adb logcat -d > "$OUT/logcat.txt" || true
