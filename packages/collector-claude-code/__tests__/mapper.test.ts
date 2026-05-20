import { describe, it, expect } from 'vitest';
import { mapTool } from '../src/mapper.js';

describe('mapTool', () => {
  it('Read → file_read with path', () => {
    const r = mapTool('Read', { file_path: '/tmp/foo.ts' });
    expect(r.action_type).toBe('file_read');
    expect(r.action_data).toEqual({ path: '/tmp/foo.ts' });
  });

  it('Write → file_write with path and operation=create', () => {
    const r = mapTool('Write', { file_path: '/tmp/foo.ts' });
    expect(r.action_type).toBe('file_write');
    expect(r.action_data).toEqual({ path: '/tmp/foo.ts', operation: 'create' });
  });

  it('Edit → file_write with path and operation=patch', () => {
    const r = mapTool('Edit', { file_path: '/tmp/foo.ts' });
    expect(r.action_type).toBe('file_write');
    expect(r.action_data).toEqual({ path: '/tmp/foo.ts', operation: 'patch' });
  });

  it('MultiEdit → file_write with path and operation=patch', () => {
    const r = mapTool('MultiEdit', { file_path: '/tmp/foo.ts' });
    expect(r.action_type).toBe('file_write');
    expect(r.action_data).toEqual({ path: '/tmp/foo.ts', operation: 'patch' });
  });

  it('NotebookEdit → file_write with path from notebook_path and operation=patch', () => {
    const r = mapTool('NotebookEdit', { notebook_path: '/tmp/nb.ipynb' });
    expect(r.action_type).toBe('file_write');
    expect(r.action_data).toEqual({ path: '/tmp/nb.ipynb', operation: 'patch' });
  });

  it('Bash → bash_execute with command', () => {
    const r = mapTool('Bash', { command: 'ls -la' });
    expect(r.action_type).toBe('bash_execute');
    expect(r.action_data).toEqual({ command: 'ls -la' });
  });

  it('Bash truncates command to 500 chars', () => {
    const long = 'x'.repeat(600);
    const r = mapTool('Bash', { command: long });
    expect((r.action_data['command'] as string).length).toBe(500);
  });

  it('WebSearch → web_search with query', () => {
    const r = mapTool('WebSearch', { query: 'typescript docs' });
    expect(r.action_type).toBe('web_search');
    expect(r.action_data).toEqual({ query: 'typescript docs' });
  });

  it('WebFetch → web_search with url', () => {
    const r = mapTool('WebFetch', { url: 'https://example.com' });
    expect(r.action_type).toBe('web_search');
    expect(r.action_data).toEqual({ url: 'https://example.com' });
  });

  it('Think → agent_thinking with structured fields', () => {
    const r = mapTool('Think', {});
    expect(r.action_type).toBe('agent_thinking');
    expect(r.action_data).toEqual({ phase: null, decision: null, alternatives: [], confidence: null });
  });

  it('ThinkingTool → agent_thinking', () => {
    const r = mapTool('ThinkingTool', {});
    expect(r.action_type).toBe('agent_thinking');
  });

  it('Write → file_write with operation=create', () => {
    const r = mapTool('Write', { file_path: '/tmp/new.ts' });
    expect(r.action_data['operation']).toBe('create');
  });

  it('Edit → file_write with operation=patch', () => {
    const r = mapTool('Edit', { file_path: '/tmp/foo.ts' });
    expect(r.action_data['operation']).toBe('patch');
  });

  it('MultiEdit → file_write with operation=patch', () => {
    const r = mapTool('MultiEdit', { file_path: '/tmp/foo.ts' });
    expect(r.action_data['operation']).toBe('patch');
  });

  it('mcp__ → mcp_tool_call with input_keys', () => {
    const r = mapTool('mcp__my_server__do_thing', { foo: 1, bar: 2 });
    expect(r.action_data['input_keys']).toEqual(['foo', 'bar']);
    expect(r.action_data['server']).toBe('my_server');
    expect(r.action_data['tool']).toBe('mcp__my_server__do_thing');
    expect(r.action_data).not.toHaveProperty('operation');
  });

  it('mcp__ prefix → mcp_tool_call with server and input_keys', () => {
    const r = mapTool('mcp__my_server__do_thing', {});
    expect(r.action_type).toBe('mcp_tool_call');
    expect(r.action_data).toEqual({ tool: 'mcp__my_server__do_thing', server: 'my_server', input_keys: [] });
  });

  it('unknown tool → mcp_tool_call with tool name, server, and input_keys', () => {
    const r = mapTool('SomeFutureTool', { whatever: 'data' });
    expect(r.action_type).toBe('mcp_tool_call');
    expect(r.action_data).toEqual({ tool: 'SomeFutureTool', server: 'unknown', input_keys: ['whatever'] });
  });

  it('missing file_path → path is null', () => {
    const r = mapTool('Read', {});
    expect(r.action_data['path']).toBeNull();
  });
});
