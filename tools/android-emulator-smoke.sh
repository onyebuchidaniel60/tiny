#!/usr/bin/env bash
set -euo pipefail

APK_PATH="${1:-artifacts/app-dev-debug.apk}"
PACKAGE="ng.tiny.education.dev.debug"
ACTIVITY="ng.tiny.education.dev.debug/ng.tiny.education.MainActivity"
OUT="artifacts/emulator"
XML="/tmp/tiny-ui.xml"

mkdir -p "$OUT"
# The repository keeps earlier evidence. Remove stale PNGs before a new run so
# the uploaded artifact can only contain screenshots from this build.
rm -f "$OUT"/*.png

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

# Slow CI emulators can throw a launcher ANR at any point. Dismiss it without
# touching Tiny so the script never mistakes the dialog for the app.
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
    if grep -q "$value" "$XML" 2>/dev/null; then
      return 0
    fi
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
    if tap_text "$value"; then
      return 0
    fi
    sleep 3
  done
  return 1
}

adb install -r "$APK_PATH"
adb shell am start -n "$ACTIVITY"
wait_for_text "Choose your language" 30 || true
screenshot "tiny-01-language"

tap_text_retry "Continue" 5 || true
wait_for_text "Teaching tools that fit" 20 || true
screenshot "tiny-02-welcome"

tap_text_retry "Open my workspace" 5 || true
wait_for_text "Sign in with your phone" 30 || true
dump_ui
if grep -q 'Sign in with your phone' "$XML" 2>/dev/null || grep -q 'Send verification code' "$XML" 2>/dev/null; then
  # A Firebase-configured build stops at the phone-auth gate. Capture it, then
  # sign in with the synthetic test number and continue the app journey.
  screenshot "tiny-03-auth-gate"
  if [ "${TINY_SMOKE_TEST_AUTH:-false}" = "true" ]; then
    tap_text_retry "Phone number, for example 0803 123 4567" 5 || tap_coord 540 800
    adb shell input text "08000000001" || true
    sleep 1
    tap_text_retry "Send verification code" 5 || tap_coord 540 1050
    if wait_for_text "6-digit code" 20; then
      tap_text_retry "6-digit code" 5 || tap_coord 540 900
      adb shell input text "123456" || true
      sleep 1
      tap_text_retry "Confirm and sign in" 5 || tap_coord 540 1130
      if wait_for_text "Skip tour" 15 || wait_for_text "Quick actions" 30; then
        tap_text_retry "Skip tour" 3 || true
        # Give the Firestore bootstrap a moment to load the remote workspace;
        # if it is not configured, keep the local sample screen.
        wait_for_text "Quick actions" 20 || true
        screenshot "tiny-04-authenticated"
        echo "Test-phone auth succeeded; captured tiny-04-authenticated.png."
      else
        screenshot "tiny-04-auth-failed"
        echo "Test-phone auth did not reach Home; captured tiny-04-auth-failed.png."
      fi
    else
      screenshot "tiny-04-auth-failed"
      echo "Verification code field did not appear; captured tiny-04-auth-failed.png."
    fi
    if [ -f "$OUT/tiny-04-auth-failed.png" ]; then
      adb logcat -d | sed -E 's/(Firebase App Check debug token: )[0-9a-fA-F-]{36}/\1<redacted>/g' > "$OUT/logcat.txt" || true
      echo "Test-phone auth did not reach Home; stopping without a false journey claim."
      exit 0
    fi
    echo "Test-phone auth succeeded; continuing the authenticated journey."
  else
    adb logcat -d | sed -E 's/(Firebase App Check debug token: )[0-9a-fA-F-]{36}/\1<redacted>/g' > "$OUT/logcat.txt" || true
    echo "Firebase auth gate detected; captured tiny-03-auth-gate.png and skipped local journey."
    exit 0
  fi
fi
tap_text_retry "Skip tour" 3 || true
wait_for_text "Good morning" 20 || true
screenshot "tiny-03-home"

# Bottom navigation is 1080 px wide on the Pixel 5 emulator profile.
tap_coord 405 2200
sleep 3
dismiss_anr
screenshot "tiny-04-classes"

tap_text_retry "P4 Blue" 5 || true
sleep 3
dismiss_anr
screenshot "tiny-05-class-detail"

tap_text_retry "Amina Bello" 5 || true
sleep 3
dismiss_anr
screenshot "tiny-05a-progress"
adb shell input swipe 540 1800 540 500 300 || true
sleep 1
screenshot "tiny-05b-family-contacts"
adb shell input keyevent 4 || true
sleep 2

tap_text_retry "Mark attendance" 5 || true
sleep 3
dismiss_anr
screenshot "tiny-06-attendance"

adb shell input keyevent 4 || true
sleep 1
adb shell input keyevent 4 || true
sleep 1

tap_coord 690 2200
sleep 3
dismiss_anr
screenshot "tiny-07-lessons"

tap_text_retry "Teaching helper" 5 || true
sleep 2
dismiss_anr
screenshot "tiny-07a-ai-fallback"
adb shell input keyevent 4 || true
sleep 1

tap_coord 945 2200
sleep 3
dismiss_anr
screenshot "tiny-08-messages"

tap_text_retry "Amina's family" 5 || true
sleep 3
dismiss_anr
screenshot "tiny-09-conversation"

# Settings from the top app bar; then return.
tap_coord 1005 210 || true
sleep 2
dismiss_anr
screenshot "tiny-10-settings"

# Capture representative screens for every supported teacher language.
# The settings screen exposes the language chips; changing language recreates
# the activity, so we re-open Settings before each choice.
open_settings() {
  tap_coord 1005 210 || true
  sleep 2
  dismiss_anr
}

go_home() {
  # Settings and Sync have no bottom navigation, so a tab tap is not reliable.
  # Restarting the activity preserves the persisted session/language and starts
  # Compose navigation at Home.
  adb shell am force-stop "$PACKAGE" || true
  adb shell am start -n "$ACTIVITY" || true
  sleep 5
  dismiss_anr
}

capture_language_home() {
  local suffix="$1"
  local expected="$2"
  open_settings
  screenshot "tiny-i18n-${suffix}-settings"
  go_home
  wait_for_text "$expected" 25 || true
  screenshot "tiny-i18n-${suffix}-home"
  open_settings
}

# English settings is already open at this point.
screenshot "tiny-i18n-en-settings"
open_settings
tap_text_retry "Hausa" 3 || true
sleep 3
open_settings
capture_language_home "ha" "Ina kwana"

open_settings
tap_text_retry "Yarbanci" 3 || true
sleep 3
open_settings
capture_language_home "yo" "Ẹ káàárọ̀"

open_settings
tap_text_retry "Igbo" 3 || true
sleep 3
open_settings
capture_language_home "ig" "Ụtụtụ ọma"

open_settings
tap_text_retry "Bekee" 3 || true
sleep 3
open_settings
capture_language_home "en" "Good morning"

dump_ui
adb logcat -d | sed -E 's/(Firebase App Check debug token: )[0-9a-fA-F-]{36}/\1<redacted>/g' > "$OUT/logcat.txt" || true
