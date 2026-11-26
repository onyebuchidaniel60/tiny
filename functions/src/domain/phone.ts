export function normalizeNigerianPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^[0-9+ ()-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, '');
  let national: string;
  if (digits.startsWith('234') && digits.length === 13) national = digits.slice(3);
  else if (digits.startsWith('0') && digits.length === 11) national = digits.slice(1);
  else if (digits.length === 10) national = digits;
  else return null;
  if (!/^[789][0-9]{9}$/.test(national)) return null;
  return `+234${national}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***';
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}
