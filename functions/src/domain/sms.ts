const GSM7 = new Set(
  ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
    ' @£$¥èéùìòÇ\nØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&\'()*+,-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[]~|€').split(''),
);

export function isGsm7(text: string): boolean {
  return [...text].every((char) => GSM7.has(char));
}

export function estimateSegments(text: string): number {
  if (!text) return 0;
  if (isGsm7(text)) return text.length <= 160 ? 1 : Math.ceil(text.length / 153);
  return text.length <= 70 ? 1 : Math.ceil(text.length / 67);
}

export function fitsSegments(text: string, maxSegments = 2): boolean {
  return estimateSegments(text) <= maxSegments;
}
