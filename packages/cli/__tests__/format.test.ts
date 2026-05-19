import { describe, it, expect } from 'vitest';
import { pad, revStr, formatActionData, formatDate, formatTime } from '../src/format.js';

describe('pad', () => {
  it('pads short string to given length with spaces', () => {
    expect(pad('hi', 6)).toBe('hi    ');
  });

  it('truncates long string and appends ellipsis', () => {
    expect(pad('hello world', 6)).toBe('hello…');
  });

  it('returns string unchanged when exactly the given length', () => {
    expect(pad('hello', 5)).toBe('hello');
  });
});

describe('revStr', () => {
  it('returns "yes" for 1', () => expect(revStr(1)).toBe('yes'));
  it('returns "no" for 0', () => expect(revStr(0)).toBe('no'));
  it('returns "?" for null', () => expect(revStr(null)).toBe('?'));
});

describe('formatActionData', () => {
  it('returns empty string for empty object', () => {
    expect(formatActionData({})).toBe('');
  });

  it('formats a single key-value pair', () => {
    expect(formatActionData({ path: '/tmp/foo.ts' })).toBe('path: /tmp/foo.ts');
  });

  it('formats multiple key-value pairs separated by comma', () => {
    const result = formatActionData({ command: 'ls', cwd: '/tmp' });
    expect(result).toContain('command: ls');
    expect(result).toContain('cwd: /tmp');
  });

  it('truncates result to maxWidth', () => {
    const long = 'x'.repeat(100);
    const result = formatActionData({ key: long }, 80);
    expect(result.length).toBeLessThanOrEqual(80);
  });

  it('replaces newlines with spaces', () => {
    const result = formatActionData({ command: 'line1\nline2\nline3' });
    expect(result).not.toContain('\n');
    expect(result).toContain('line1 line2 line3');
  });
});

describe('formatDate', () => {
  it('formats ISO string as MM-DD HH:mm', () => {
    const result = formatDate('2026-05-19T10:30:00.000Z');
    expect(result).toMatch(/^\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});

describe('formatTime', () => {
  it('formats ISO string as HH:mm:ss', () => {
    const result = formatTime('2026-05-19T10:30:45.000Z');
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
