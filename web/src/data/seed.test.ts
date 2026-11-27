import { describe, expect, it } from 'vitest';
import { seedState } from './seed';

describe('synthetic seed integrity', () => {
  const state = seedState();

  it('keeps classes and pupils scoped to the workspace', () => {
    expect(state.classes.every((item) => item.workspaceId === state.workspace.id)).toBe(true);
    expect(state.pupils.every((item) => state.classes.some((classroom) => classroom.id === item.classId))).toBe(true);
  });

  it('links every guardian to an existing pupil and supports shared endpoints', () => {
    expect(state.links.every((link) => state.pupils.some((pupil) => pupil.id === link.pupilId))).toBe(true);
    expect(state.links.every((link) => state.guardians.some((guardian) => guardian.id === link.guardianId))).toBe(true);
    const shared = state.guardians.find((guardian) => guardian.pupilIds.length > 1);
    expect(shared).toBeDefined();
  });

  it('keeps attendance entries aligned with the roster', () => {
    for (const session of state.attendance) {
      const roster = new Set(state.pupils.filter((pupil) => pupil.classId === session.classId).map((pupil) => pupil.id));
      expect(session.entries.every((entry) => roster.has(entry.pupilId))).toBe(true);
    }
  });

  it('keeps conversations and messages consistent', () => {
    expect(state.messages.every((message) => state.conversations.some((conversation) => conversation.id === message.conversationId))).toBe(true);
    expect(state.guardians.every((guardian) => guardian.phoneE164.startsWith('+234'))).toBe(true);
  });
});
