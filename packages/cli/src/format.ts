export function pad(str: string, len: number): string {
  if (str.length > len) return str.slice(0, len - 1) + '…';
  return str.padEnd(len);
}

export function revStr(reversible: 0 | 1 | null): string {
  if (reversible === 1) return 'yes';
  if (reversible === 0) return 'no';
  return '?';
}

export function formatActionData(data: Record<string, unknown>): string {
  const entries = Object.entries(data);
  if (entries.length === 0) return '';
  return entries
    .map(([k, v]) => `${k}: ${String(v ?? '').slice(0, 60)}`)
    .join(', ');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${min}:${ss}`;
}

export function riskColor(risk: string | null): 'red' | 'yellow' | 'green' | 'gray' {
  switch (risk) {
    case 'high': return 'red';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}
