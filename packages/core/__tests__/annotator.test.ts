import { describe, it, expect } from 'vitest';
import { annotate } from '../src/annotator.js';

describe('annotate', () => {
  describe('file_read', () => {
    it('is reversible with low risk', () => {
      const result = annotate('file_read', { path: '/tmp/foo.ts' });
      expect(result.reversible).toBe(1);
      expect(result.risk_level).toBe('low');
    });
  });

  describe('file_write', () => {
    it('is not reversible with medium risk', () => {
      const result = annotate('file_write', { path: '/tmp/foo.ts', line_delta: 3 });
      expect(result.reversible).toBe(0);
      expect(result.risk_level).toBe('medium');
    });
  });

  describe('file_delete', () => {
    it('is not reversible with high risk', () => {
      const result = annotate('file_delete', { path: '/tmp/foo.ts' });
      expect(result.reversible).toBe(0);
      expect(result.risk_level).toBe('high');
    });
  });

  describe('bash_execute', () => {
    it('classifies read-only commands as reversible low risk', () => {
      for (const cmd of ['ls -la', 'cat foo.txt', 'grep pattern file', 'git status', 'git log', 'find . -name "*.ts"']) {
        const result = annotate('bash_execute', { command: cmd });
        expect(result.reversible, `expected reversible for: ${cmd}`).toBe(1);
        expect(result.risk_level, `expected low risk for: ${cmd}`).toBe('low');
      }
    });

    it('classifies destructive commands as not reversible high risk', () => {
      for (const cmd of ['rm -rf node_modules', 'git reset --hard', 'git push origin main']) {
        const result = annotate('bash_execute', { command: cmd });
        expect(result.reversible, `expected not reversible for: ${cmd}`).toBe(0);
        expect(result.risk_level, `expected high risk for: ${cmd}`).toBe('high');
      }
    });

    it('classifies state-changing commands as not reversible medium risk', () => {
      for (const cmd of ['mkdir -p dist', 'cp foo bar', 'npm install', 'pnpm install']) {
        const result = annotate('bash_execute', { command: cmd });
        expect(result.reversible, `expected not reversible for: ${cmd}`).toBe(0);
        expect(result.risk_level, `expected medium risk for: ${cmd}`).toBe('medium');
      }
    });

    it('returns null reversible and medium risk for unknown commands', () => {
      const result = annotate('bash_execute', { command: 'some-unknown-tool --flag' });
      expect(result.reversible).toBeNull();
      expect(result.risk_level).toBe('medium');
    });
  });

  describe('web_search', () => {
    it('is reversible with low risk', () => {
      const result = annotate('web_search', { query: 'typescript docs' });
      expect(result.reversible).toBe(1);
      expect(result.risk_level).toBe('low');
    });
  });

  describe('mcp_tool_call', () => {
    it('has unknown reversibility with medium risk', () => {
      const result = annotate('mcp_tool_call', { tool: 'some_tool' });
      expect(result.reversible).toBeNull();
      expect(result.risk_level).toBe('medium');
    });
  });

  describe('agent_thinking / user_message / agent_message', () => {
    it('are reversible with low risk', () => {
      for (const type of ['agent_thinking', 'user_message', 'agent_message'] as const) {
        const result = annotate(type, {});
        expect(result.reversible).toBe(1);
        expect(result.risk_level).toBe('low');
      }
    });
  });
});
