import { fitsSegments } from './sms';

export interface DigestPupil {
  displayName: string;
  indicator: 'doing_well' | 'developing' | 'needs_support' | 'not_assessed';
  note?: string;
  homeActivity?: string;
}

export interface DigestGroup {
  guardianId: string;
  workspaceName: string;
  locale: string;
  pupils: DigestPupil[];
}

const indicatorLabel: Record<DigestPupil['indicator'], string> = {
  doing_well: 'Doing well',
  developing: 'Developing',
  needs_support: 'Needs support',
  not_assessed: 'Not assessed',
};

export function buildDigest(group: DigestGroup, maxSegments = 2): string {
  const header = `Tiny weekly update — ${group.workspaceName}`;
  const pupilLines = group.pupils.map((pupil) => {
    const note = pupil.note?.trim() ? ` ${pupil.note.trim()}` : '';
    return `${pupil.displayName}: ${indicatorLabel[pupil.indicator]}.${note}`;
  });
  const home = [...new Set(group.pupils.map((pupil) => pupil.homeActivity?.trim()).filter(Boolean))].join(' ');
  const footer = 'Reply to your school if you have a question.';
  const candidates = [
    [header, ...pupilLines, home, footer].filter(Boolean).join('\n'),
    [header, ...pupilLines, footer].join('\n'),
    [header, pupilLines[0], footer].filter(Boolean).join('\n'),
  ];
  return candidates.find((candidate) => fitsSegments(candidate, maxSegments)) ?? header;
}

export function approvedOnly<T extends { approvalStatus: string; indicator: string }>(entries: T[]): T[] {
  return entries.filter((entry) => entry.approvalStatus === 'approved' && entry.indicator !== 'not_assessed');
}
