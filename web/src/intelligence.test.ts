import { describe, expect, it } from 'vitest';
import { seedState } from './data/seed';
import {
  buildAttendanceStats,
  buildClassIntelligence,
  buildPupilEvidenceContext,
  buildPupilIntelligence,
  buildSuggestedFollowUps,
  deterministicParentDraft,
} from './intelligence';

describe('shared intelligence engine', () => {
  const state = seedState();

  it('calculates attendance deterministically from submitted registers', () => {
    const amina = buildAttendanceStats(state, 'pupil_amina');
    expect(amina.marked).toBe(7);
    expect(amina.absent).toBe(0);
    expect(amina.rate).toBe(100);
    const musa = buildAttendanceStats(state, 'pupil_musa');
    expect(musa.absent).toBe(4);
    expect(musa.rate).toBeLessThan(50);
  });

  it('derives different evidence statuses for different pupils', () => {
    const amina = buildPupilIntelligence(state, 'pupil_amina');
    const musa = buildPupilIntelligence(state, 'pupil_musa');
    expect(amina?.status).toBe('strong');
    expect(musa?.status).toBe('needs_attention');
    expect(musa?.nextActions).toContain('action_contact_family');
  });

  it('identifies a class gap without turning it into an individual fact', () => {
    const classroom = buildClassIntelligence(state, 'class_p4_blue');
    expect(classroom?.pupilCount).toBe(4);
    expect(classroom?.commonGaps.some((gap) => gap.objectiveId === 'plant_parts')).toBe(true);
    expect(classroom?.attentionPupils.map((pupil) => pupil.pupilId)).toContain('pupil_musa');
  });

  it('creates a follow-up suggestion for attendance and low assessment', () => {
    const suggestions = buildSuggestedFollowUps(state, 'class_p4_blue');
    expect(suggestions.some((item) => item.source === 'attendance' && item.pupilId === 'pupil_musa')).toBe(true);
    expect(suggestions.some((item) => item.source === 'assessment' && item.pupilId === 'pupil_tunde')).toBe(true);
  });

  it('builds a de-identified AI prompt with traceable evidence', () => {
    const profile = buildPupilIntelligence(state, 'pupil_amina');
    expect(profile).not.toBeNull();
    const context = buildPupilEvidenceContext(state, profile!, 'Review progress');
    expect(context.prompt).not.toContain('Amina');
    expect(context.prompt).not.toContain('+234');
    expect(context.evidenceIds.length).toBeGreaterThan(5);
    expect(context.summary).toContain('attendance');
  });

  it('parent draft uses recorded facts and no another-pupil data', () => {
    const profile = buildPupilIntelligence(state, 'pupil_musa');
    const draft = deterministicParentDraft(profile!, 'Basic science');
    expect(draft).toContain('Your child attended');
    expect(draft).not.toContain('Amina');
    expect(draft).not.toContain('Ngozi');
  });
});
