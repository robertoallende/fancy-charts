import { splitSource, parseYaml, detectMode } from '../../src/data/yaml-parser';

describe('splitSource', () => {
	it('splits a simple mode block on the --- delimiter', () => {
		const source = `type: bar
title: My Chart
---
| quarter | sales |
| --- | --- |
| Q1 | 120 |`;
		const result = splitSource(source);
		expect('error' in result).toBe(false);
		const { yaml, rest } = result as { yaml: string; rest: string };
		expect(yaml).toContain('type: bar');
		expect(rest).toContain('| quarter | sales |');
	});

	it('returns the full source as yaml when no --- delimiter (advanced mode)', () => {
		const source = `echarts:
  xAxis:
    type: category`;
		const result = splitSource(source);
		expect('error' in result).toBe(false);
		const { yaml } = result as { yaml: string; rest: string };
		expect(yaml).toContain('echarts:');
	});

	it('handles front-matter style with leading ---', () => {
		const source = `---
type: bar
title: My Chart
---
| quarter | sales |
| --- | --- |
| Q1 | 120 |`;
		const result = splitSource(source);
		expect('error' in result).toBe(false);
		const { yaml, rest } = result as { yaml: string; rest: string };
		expect(yaml).toContain('type: bar');
		expect(rest).toContain('| quarter | sales |');
	});

	it('handles front-matter advanced mode with leading ---', () => {
		const source = `---
echarts:
  xAxis:
    type: category`;
		const result = splitSource(source);
		expect('error' in result).toBe(false);
		const { yaml } = result as { yaml: string; rest: string };
		expect(yaml).toContain('echarts:');
	});

	it('returns error when no --- delimiter and no echarts key', () => {
		const source = `type: bar
title: My Chart`;
		const result = splitSource(source);
		expect('error' in result).toBe(true);
	});

	it('handles leading and trailing whitespace in sections', () => {
		const source = `  type: line
---
  | a | b |
  | --- | --- |
  | 1 | 2 |`;
		const result = splitSource(source);
		expect('error' in result).toBe(false);
	});
});

describe('parseYaml', () => {
	it('parses a valid YAML string into an object', () => {
		const result = parseYaml('type: bar\ntitle: My Chart');
		expect('error' in result).toBe(false);
		expect((result as Record<string, unknown>)['type']).toBe('bar');
	});

	it('returns error on invalid YAML', () => {
		const result = parseYaml('key: [unclosed');
		expect('error' in result).toBe(true);
	});

	it('returns error when YAML parses to a non-object', () => {
		const result = parseYaml('- item1\n- item2');
		expect('error' in result).toBe(true);
	});

	it('handles an empty string as an error', () => {
		const result = parseYaml('');
		expect('error' in result).toBe(true);
	});
});

describe('detectMode', () => {
	it('returns simple when no echarts key is present', () => {
		expect(detectMode({ type: 'bar' })).toBe('simple');
	});

	it('returns advanced when echarts key is present', () => {
		expect(detectMode({ echarts: { xAxis: {} } })).toBe('advanced');
	});

	it('returns simple for an empty config object', () => {
		expect(detectMode({})).toBe('simple');
	});
});
