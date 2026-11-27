import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, InferenceSource } from 'firebase/ai';
import { app } from '../firebase/config';

export const CLOUD_MODEL = 'gemini-3.5-flash-lite';

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
  };
}

export function onDeviceBrowserStatus(): string {
  if (typeof window === 'undefined') return 'No browser';
  const languageModel = (window as unknown as { LanguageModel?: { availability?: () => Promise<string> } }).LanguageModel;
  if (!languageModel) return 'Chrome built-in AI unavailable';
  return 'Chrome built-in AI detected; status is checked at generation';
}

export async function generateTeachingStrategy(index = 0): Promise<AiResult> {
  if (!app) {
    return {
      ...fallbackStrategy(index),
      detail: 'Firebase is not configured in this build, so the curated offline strategy is used.',
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
    const response = await model.generateContent(
      'Suggest one short, practical classroom strategy for a Primary 4 basic science lesson about sources and uses of water. ' +
      'Use at most 90 English words. Do not mention any pupil, phone number, school record or diagnosis. Return plain text only.',
    );
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
  } catch (error) {
    return {
      ...fallbackStrategy(index),
      detail: `Model unavailable: ${error instanceof Error ? error.message : 'unknown error'}. The curated strategy is shown instead.`,
    };
  }
}
