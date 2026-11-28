# Tiny AI Logic Hybrid Verification

**Status (28 November 2026):** Cloud fallback verified; evidence-backed pupil/class workflows added on Android and web. On-device Gemini Nano still not verified because no supported physical device is available.

## 1. Implementation review

The Android client uses Firebase AI Logic:

```kotlin
Firebase.ai(
    backend = GenerativeBackend.googleAI(),
    useLimitedUseAppCheckTokens = true,
).generativeModel(
    modelName = "gemini-3.5-flash-lite",
    onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE),
)
```

- `PREFER_ON_DEVICE` requests on-device inference first when the device has a supported model.
- The cloud route uses the Gemini Developer API free tier through the Firebase AI Logic proxy.
- App Check limited-use tokens are requested by the SDK.
- The displayed source comes only from `response.inferenceSource`:
  - `ON_DEVICE` → `On-device Gemini Nano`
  - `IN_CLOUD` → `Cloud Gemini`
  - anything else → `Unknown inference source`
- The mapping is covered by `AiInferenceSourceTest`.
- The UI reports the device model status from `onDeviceExtension.checkStatus()`; it does not infer on-device use from configuration.

### 1.1 Evidence-backed teaching tasks

Both apps expose the same inference modes through Firebase AI Logic: `PREFER_ON_DEVICE`, `ONLY_IN_CLOUD`, `ONLY_ON_DEVICE` (Android and web diagnostics) and `PREFER_IN_CLOUD` where supported. The selected mode is recorded with the result, but the displayed source is always the SDK-reported inference source, never the request.

Before any AI request, `IntelligenceEngine`/`intelligence.ts` computes attendance, assessment, observation, follow-up and class-gap facts deterministically. The AI prompt contains only de-identified aggregates and redacted observation text:

- the pupil name and guardian names are replaced with “the pupil”;
- phone numbers and emails are masked;
- no guardian identifier, message body, photo or diagnosis is included;
- the model is told to use only the supplied evidence and not to invent grades or events;
- output is capped and treated as a teacher-review draft.

The deterministic review, parent draft and lesson plan are always available without AI. If the model is unavailable, the app shows the deterministic template and marks it as a fallback. AI output never creates a parent message automatically: the teacher must inspect and approve the draft, and the approved message still enters the mock outbox.

Diagnostics (`/intelligence` on web, Intelligence tab on Android) show the requested mode, actual SDK source, duration, evidence fingerprint and fallback flag. AI analyses are stored locally with their evidence IDs so a teacher can see what supported a result.

## 2. Evidence

| Check | Result |
|---|---|
| Cloud fallback app-level test | `AiLogicLiveTest` passed in run `45950443728` |
| Cloud fallback UI evidence | Manual run `45950452014`; judge APK displayed `Source: Cloud Gemini`; screenshot `artifacts/emulator/tiny-ai-cloud.png` |
| On-device availability on test emulator | `FirebaseAIOnDeviceNotAvailableException`; SDK fell back to cloud |
| Reported source | `Cloud Gemini` asserted by the instrumentation test and shown in the UI |
| On-device hardware test | **Not run**; Samsung Galaxy Note 10+ (Android 12) is not supported |
| On-device claim | **None** |

The emulator test proves the honest cloud fallback and source reporting. It does not prove that a supported device selects Nano.

## 3. Supported-device acceptance procedure

Run this only on a currently supported physical Android device with AICore/Gemini Nano and a debug build containing `google-services.json` plus a registered App Check debug token.

1. Open **Lessons → Teaching helper**.
2. Confirm the on-device status card reports `Available` (or `Downloadable`/`Downloading` while the model is prepared).
3. Tap **Generate a strategy**.
4. Verify the source line says `On-device Gemini Nano`; capture a screenshot and logcat showing the SDK response.
5. Enable airplane mode and repeat the generation. An on-device result should still be possible; a cloud-only result must be reported as such or fail honestly.
6. Disable airplane mode, repeat once, and confirm the source is still read from the SDK response.
7. Record device model, Android build, AICore/model version, app commit, and the exact observed source in `AI_HANDOFF.md` and `docs/BUILD_LOG.md`.

Do not claim on-device inference from the status card alone, from configuration, or from an emulator result.

## 4. Risks and limitations

- The on-device SDK is beta/experimental; versions are pinned and may change.
- A supported device may still lack the model or AICore update; the app must fall back and report honestly.
- Cloud AI requires App Check and the non-production Firebase project; no PII is sent.
- The curated offline strategies remain available when both routes are unavailable.
- No real pupil/guardian data is used in prompts.
