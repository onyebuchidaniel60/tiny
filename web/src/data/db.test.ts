import { beforeEach, describe, expect, it } from 'vitest';
import { clearLocalData, loadDraft, loadState, saveDraft, saveState } from './db';
import { seedState } from './seed';

describe('local persistence', () => {
  beforeEach(async () => {
    await clearLocalData();
    localStorage.clear();
  });

  it('restores the workspace state after a refresh', async () => {
    const state = seedState();
    state.workspace.name = 'Persisted Primary';
    await saveState(state);
    const restored = await loadState();
    expect(restored?.workspace.name).toBe('Persisted Primary');
    expect(restored?.pupils.length).toBe(8);
  });

  it('restores an in-progress attendance draft', async () => {
    await saveDraft('attendance:class_p4_blue:2026-11-27', { pupil_amina: 'present', pupil_musa: 'absent' });
    const draft = await loadDraft<Record<string, string>>('attendance:class_p4_blue:2026-11-27');
    expect(draft).toEqual({ pupil_amina: 'present', pupil_musa: 'absent' });
  });
});
