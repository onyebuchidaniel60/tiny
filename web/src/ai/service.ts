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

export interface AiResult {
  text: string;
  source: AiSource;
  title?: string;
  detail?: string;
  fallback?: boolean;
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

export async function generateTeachingStrategy(index = 0, mode: AiMode = 'lesson_plan'): Promise<AiResult> {
  if (!app) {
    return {
      ...fallbackStrategy(index),
      detail: 'Firebase is not configured in this build, so the reviewed offline strategy is used.',
    };
  }
  try {
    const ai = getAI(app, {
      backend: new GoogleAIBackend(),
      useLimitedUseAppCheckTokens: true,
    });
    const model = getGenerativeModel(ai, {
      mode: InferenceMode.PREFER_ON_DEVICE,
      inCloudParams: { model: CLOUD_MODEL },
    });
    const response = await model.generateContent(modePrompts[mode]);
    const text = response.response.text().trim();
    if (!text) throw new Error('The model returned no text.');
    return {
      text,
      source: sourceLabel(response.response.inferenceSource),
      detail: response.response.inferenceSource === InferenceSource.ON_DEVICE
        ? 'The SDK reported on-device inference.'
        : response.response.inferenceSource === InferenceSource.IN_CLOUD
          ? 'The SDK reported cloud inference.'
          : 'The SDK did not report an inference source.',
    };
  } catch {
    return fallbackStrategy(index);
  }
}
