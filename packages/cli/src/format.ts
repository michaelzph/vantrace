export function pad(str: string, len: number): string {
  if (str.length > len) return str.slice(0, len - 1) + '…';
  return str.padEnd(len);
}

export function revStr(reversible: 0 | 1 | null): string {
  if (reversible === 1) return 'yes';
  if (reversible === 0) return 'no';
  return '?';
}

export function formatActionData(data: Record<string, unknown>, maxWidth = 80): string {
  const entries = Object.entries(data);
  if (entries.length === 0) return '';
  const str = entries
    .map(([k, v]) => `${k}: ${String(v ?? '').replace(/\n/g, ' ')}`)
    .join(', ');
  if (str.length <= maxWidth) return str;
  return str.slice(0, maxWidth - 1) + '…';
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

export function outcomeStr(outcome: 'success' | 'error' | undefined): string {
  if (outcome === 'success') return 'ok';
  if (outcome === 'error') return 'err';
  return '?';
}

export function outcomeColor(outcome: 'success' | 'error' | undefined): 'green' | 'red' | 'gray' {
  if (outcome === 'success') return 'green';
  if (outcome === 'error') return 'red';
  return 'gray';
}
