const STORAGE_KEY = '__ccsm_mid__';
function hashString(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
export function getMachineId(): string {
  try { const cached = localStorage.getItem(STORAGE_KEY); if (cached && /^[a-f0-9]{8}$/.test(cached)) return cached; } catch {}
  const fingerprint = [
    typeof screen !== 'undefined' ? screen.width + 'x' + screen.height + 'x' + screen.colorDepth : '0x0x24',
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency?.toString() ?? '4' : '4',
    typeof navigator !== 'undefined' ? navigator.platform ?? 'web' : 'web',
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    typeof navigator !== 'undefined' ? navigator.language ?? 'fr' : 'fr',
  ].join('||');
  const id = hashString(fingerprint);
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  return id;
}
