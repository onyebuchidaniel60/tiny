import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, InferenceSource } from 'firebase/ai';
import { app } from '../firebase/config';

export const CLOUD_MODEL = 'gemini-3.5-flash-lite';

export type AiMode = 'lesson_plan' | 'explain' | 'adapt' | 'assess' | 'support' | 'parent_note';

export const aiModes: AiMode[] = ['lesson_plan', 'explain', 'adapt', 'assess', 'support', 'parent_note'];

export const modePrompts: Record<AiMode, string> = {
  lesson_plan:
    'Draft a short Primary 4 basic science lesson outline about sources and uses of water using the 5E structure. ' +
    'Use at most 140 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.',
  explain:
    'Explain the water cycle in simple English for a Primary 4 teacher, with one local example. ' +
    'Use at most 100 words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.',
  adapt:
    'Suggest three ways to adapt a Primary 4 lesson on water for pupils with mixed reading levels, using low-cost classroom materials. ' +
    'Use at most 120 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.',
  assess:
    'Suggest a five-question quick check for understanding after a Primary 4 lesson on sources and uses of water. Include answers. ' +
    'Use at most 140 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.',
  support:
    'Suggest two practical ways a teacher can support a pupil who is still unsure about sources of water, without labelling or diagnosing the child. ' +
    'Use at most 100 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.',
  parent_note:
    'Draft a short, factual, friendly family message about the week\'s water lesson and one home activity. ' +
    'Do not mention any pupil name, phone number, grade or diagnosis. Use at most 60 English words. Return plain text only.',
};

export const curatedStrategies = [
  {
    title: 'Think, pair, share',
    body: 'Give pupils 30 seconds to think, 60 seconds to explain to a partner, then choose two pairs to share with the class.',
  },
  {
    title: 'One-minute misconception check',
    body: 'Ask pupils to write one sentence about what they are still unsure of. Read three aloud without names and correct the class together.',
  },
  {
    title: 'Concrete before abstract',
    body: 'Start with a local object, picture or story. Ask pupils to describe what they notice before introducing the formal term.',
  },
];

export type AiSource = 'On-device Gemini Nano' | 'Cloud Gemini' | 'Unknown inference source' | 'Curated offline library';

export type AiInferenceMode = 'prefer_on_device' | 'only_in_cloud' | 'only_on_device' | 'prefer_in_cloud';

export const inferenceModeOptions: Array<{ value: AiInferenceMode; labelKey: string }> = [
  { value: 'prefer_on_device', labelKey: 'mode_prefer_device' },
  { value: 'only_in_cloud', labelKey: 'mode_cloud_only' },
  { value: 'only_on_device', labelKey: 'mode_device_only' },
];

export interface AiResult {
  text: string;
  source: AiSource;
  title?: string;
  detail?: string;
  fallback?: boolean;
  requestedMode?: AiInferenceMode;
  durationMs?: number;
  error?: string;
}

export function sourceLabel(source: InferenceSource | undefined): AiSource {
  if (source === InferenceSource.ON_DEVICE) return 'On-device Gemini Nano';
  if (source === InferenceSource.IN_CLOUD) return 'Cloud Gemini';
  return 'Unknown inference source';
}

export function fallbackStrategy(index = 0): AiResult {
  const strategy = curatedStrategies[index % curatedStrategies.length];
  return {
    title: strategy.title,
    text: strategy.body,
    source: 'Curated offline library',
    detail: 'No model was used. This reviewed strategy is bundled in the app and works without a network.',
    fallback: true,
  };
}

export type BrowserAiState = 'unavailable' | 'detected' | 'server';

export function browserAiAvailability(): BrowserAiState {
  if (typeof window === 'undefined') return 'server';
  const languageModel = (window as unknown as { LanguageModel?: { availability?: () => Promise<string> } }).LanguageModel;
  return languageModel ? 'detected' : 'unavailable';
}

function modelFor(mode: AiInferenceMode) {
  if (!app) return null;
  const ai = getAI(app, {
    backend: new GoogleAIBackend(),
    useLimitedUseAppCheckTokens: true,
  });
  const firebaseMode = mode === 'only_in_cloud'
    ? InferenceMode.ONLY_IN_CLOUD
    : mode === 'only_on_device'
      ? InferenceMode.ONLY_ON_DEVICE
      : mode === 'prefer_in_cloud'
        ? InferenceMode.PREFER_IN_CLOUD
        : InferenceMode.PREFER_ON_DEVICE;
  return getGenerativeModel(ai, {
    mode: firebaseMode,
    inCloudParams: { model: CLOUD_MODEL },
  });
}

export async function generateTeachingStrategy(
  index = 0,
  mode: AiMode = 'lesson_plan',
  inferenceMode: AiInferenceMode = 'prefer_on_device',
): Promise<AiResult> {
  const started = performance.now();
  if (!app) {
    return {
      ...fallbackStrategy(index),
      requestedMode: inferenceMode,
      durationMs: Math.round(performance.now() - started),
      detail: 'Firebase is not configured in this build, so the reviewed offline strategy is used.',
    };
  }
  try {
    const model = modelFor(inferenceMode);
    if (!model) throw new Error('Model unavailable');
    const response = await model.generateContent(modePrompts[mode]);
    const text = response.response.text().trim();
    if (!text) throw new Error('The model returned no text.');
    return {
      text,
      source: sourceLabel(response.response.inferenceSource),
      requestedMode: inferenceMode,
      durationMs: Math.round(performance.now() - started),
      detail: response.response.inferenceSource === InferenceSource.ON_DEVICE
        ? 'The SDK reported on-device inference.'
        : response.response.inferenceSource === InferenceSource.IN_CLOUD
          ? 'The SDK reported cloud inference.'
          : 'The SDK did not report an inference source.',
    };
  } catch (error) {
    return {
      ...fallbackStrategy(index),
      requestedMode: inferenceMode,
      durationMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : 'AI request failed',
    };
  }
}

/** Single-turn evidence analysis. The caller supplies the already-minimized prompt. */
export async function generateEvidenceText(
  prompt: string,
  fallbackText: string,
  inferenceMode: AiInferenceMode = 'prefer_on_device',
): Promise<AiResult> {
  const started = performance.now();
  if (!app) {
    return {
      text: fallbackText,
      source: 'Curated offline library',
      fallback: true,
      requestedMode: inferenceMode,
      durationMs: Math.round(performance.now() - started),
      detail: 'Firebase is not configured in this build; the deterministic evidence template is shown.',
    };
  }
  try {
    const model = modelFor(inferenceMode);
    if (!model) throw new Error('Model unavailable');
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    if (!text) throw new Error('The model returned no text.');
    return {
      text,
      source: sourceLabel(response.response.inferenceSource),
      requestedMode: inferenceMode,
      durationMs: Math.round(performance.now() - started),
      detail: response.response.inferenceSource === InferenceSource.ON_DEVICE
        ? 'The SDK reported on-device inference.'
        : response.response.inferenceSource === InferenceSource.IN_CLOUD
          ? 'The SDK reported cloud inference.'
          : 'The SDK did not report an inference source.',
    };
  } catch (error) {
    return {
      text: fallbackText,
      source: 'Curated offline library',
      fallback: true,
      requestedMode: inferenceMode,
      durationMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : 'AI request failed',
    };
  }
}
