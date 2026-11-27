#!/usr/bin/env bash
set -euo pipefail

# Manual, public judge-APK UI smoke. The APK contains a dedicated registered
# App Check debug token. Captures the real cloud AI result and its SDK source.
APK_PATH="${1:-tiny-judge-preview.apk}"
ACTIVITY="ng.tiny.education.dev.debug/ng.tiny.education.MainActivity"
OUT="artifacts/emulator"
XML="/tmp/tiny-ai-ui.xml"
mkdir -p "$OUT"

dump_ui() {
  adb shell uiautomator dump /sdcard/tiny-ai-ui.xml >/dev/null 2>&1 || true
  adb pull /sdcard/tiny-ai-ui.xml "$XML" >/dev/null 2>&1 || true
}

tap_text() {
  local value="$1"
  dump_ui
  python3 - "$value" <<'PY'
import re, subprocess, sys
value = sys.argv[1]
try:
    xml = open('/tmp/tiny-ai-ui.xml', encoding='utf-8').read()
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

tap_coord() { adb shell input tap "$1" "$2"; }

screenshot() {
  local name="$1"
  adb shell screencap -p "/sdcard/${name}.png"
  adb pull "/sdcard/${name}.png" "$OUT/${name}.png" >/dev/null
}

dismiss_anr() {
  dump_ui
  if grep -q "isn't responding" "$XML" 2>/dev/null; then
    tap_text "Wait" || true
    sleep 3
  fi
}

wait_for_text() {
  local value="$1"
  local attempts="${2:-15}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    dismiss_anr
    dump_ui
    if grep -q "$value" "$XML" 2>/dev/null; then return 0; fi
    sleep 2
  done
  return 1
}

tap_text_retry() {
  local value="$1"
  local attempts="${2:-5}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    dismiss_anr
    if tap_text "$value"; then return 0; fi
    sleep 3
  done
  return 1
}

adb install -r "$APK_PATH"
adb shell am start -n "$ACTIVITY"
wait_for_text "Choose your language" 30 || true
tap_text_retry "Continue" 5 || true
wait_for_text "Teaching tools that fit" 20 || true
tap_text_retry "Explore the preview" 5 || true
wait_for_text "Sign in with your phone" 30 || true
screenshot "tiny-ai-01-auth"

tap_text_retry "Phone number, for example 0803 123 4567" 5 || tap_coord 540 800
adb shell input text "08000000001" || true
sleep 1
tap_text_retry "Send verification code" 5 || tap_coord 540 1050
wait_for_text "6-digit code" 20
tap_text_retry "6-digit code" 5 || tap_coord 540 900
adb shell input text "123456" || true
sleep 1
tap_text_retry "Confirm and sign in" 5 || tap_coord 540 1130
wait_for_text "Quick actions" 30 || true

# Lessons tab, then the Teaching helper card.
tap_coord 690 2200
wait_for_text "Teaching helper" 20 || true
tap_text_retry "Teaching helper" 5 || true
wait_for_text "Generate a strategy" 20 || true
screenshot "tiny-ai-02-screen"
tap_text_retry "Generate a strategy" 5 || true

if wait_for_text "Source:" 45 || wait_for_text "Cloud Gemini" 45; then
  screenshot "tiny-ai-cloud"
  echo "AI cloud UI result captured in artifacts/emulator/tiny-ai-cloud.png"
else
  screenshot "tiny-ai-error"
  echo "AI UI result did not show a source; captured tiny-ai-error.png"
fi

adb logcat -d | sed -E 's/(Firebase App Check debug token: )[0-9a-fA-F-]{36}/\1<redacted>/g' > "$OUT/logcat-ai-ui.txt" || true
