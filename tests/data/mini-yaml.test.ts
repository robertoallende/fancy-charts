import { parseYamlValue } from '../../src/data/mini-yaml';

// ── scalars ──────────────────────────────────────────────────────────────────

describe('coercion', () => {
	it('returns null for empty string', () => expect(parseYamlValue('')).toBeNull());
	it('returns null for null keyword',  () => expect(parseYamlValue('null')).toBeNull());
	it('returns null for tilde',         () => expect(parseYamlValue('~')).toBeNull());
	it('parses true',  () => expect(parseYamlValue('true')).toBe(true));
	it('parses false', () => expect(parseYamlValue('false')).toBe(false));
	it('parses integer', () => expect(parseYamlValue('42')).toBe(42));
	it('parses negative integer', () => expect(parseYamlValue('-7')).toBe(-7));
	it('parses float', () => expect(parseYamlValue('3.14')).toBe(3.14));
	it('parses plain string', () => expect(parseYamlValue('hello')).toBe('hello'));
	it('parses single-quoted string', () => expect(parseYamlValue("'it''s fine'")).toBe("it's fine"));
	it('parses double-quoted string', () => expect(parseYamlValue('"line\\nbreak"')).toBe('line\nbreak'));
});

// ── flat mappings ─────────────────────────────────────────────────────────────

describe('flat block mapping', () => {
	it('parses key: value pairs', () => {
		const result = parseYamlValue('type: bar\ntitle: My Chart');
		expect(result).toEqual({ type: 'bar', title: 'My Chart' });
	});

	it('coerces integer values', () => {
		const result = parseYamlValue('version: 1\nheight: 300');
		expect(result).toEqual({ version: 1, height: 300 });
	});

	it('strips line comments', () => {
		const result = parseYamlValue('type: bar # the chart type');
		expect(result).toEqual({ type: 'bar' });
	});

	it('preserves # inside quoted values', () => {
		const result = parseYamlValue("color: '#ff0000'");
		expect(result).toEqual({ color: '#ff0000' });
	});

	it('handles empty/null value', () => {
		const result = parseYamlValue('key: null\nother: ~');
		expect(result).toEqual({ key: null, other: null });
	});
});

// ── nested mappings ───────────────────────────────────────────────────────────

describe('nested block mapping', () => {
	it('parses two-level nesting', () => {
		const yaml = `xAxis:\n  type: category\n  name: Quarter`;
		expect(parseYamlValue(yaml)).toEqual({ xAxis: { type: 'category', name: 'Quarter' } });
	});

	it('parses three-level nesting', () => {
		const yaml = `a:\n  b:\n    c: 1`;
		expect(parseYamlValue(yaml)).toEqual({ a: { b: { c: 1 } } });
	});

	it('parses siblings after nested block', () => {
		const yaml = `xAxis:\n  type: category\nyAxis:\n  type: value`;
		expect(parseYamlValue(yaml)).toEqual({
			xAxis: { type: 'category' },
			yAxis: { type: 'value' },
		});
	});
});

// ── flow sequences ────────────────────────────────────────────────────────────

describe('flow sequence', () => {
	it('parses inline array of strings', () => {
		const result = parseYamlValue('data: [Q1, Q2, Q3]');
		expect(result).toEqual({ data: ['Q1', 'Q2', 'Q3'] });
	});

	it('parses inline array of numbers', () => {
		const result = parseYamlValue('data: [120, 200, 150]');
		expect(result).toEqual({ data: [120, 200, 150] });
	});

	it('parses nested flow arrays', () => {
		const result = parseYamlValue('grid: [[0, 1], [2, 3]]');
		expect(result).toEqual({ grid: [[0, 1], [2, 3]] });
	});

	it('throws on unclosed bracket', () => {
		expect(() => parseYamlValue('data: [unclosed')).toThrow();
	});
});

// ── flow mappings ─────────────────────────────────────────────────────────────

describe('flow mapping', () => {
	it('parses inline object', () => {
		const result = parseYamlValue('style: {color: red, size: 12}');
		expect(result).toEqual({ style: { color: 'red', size: 12 } });
	});
});

// ── block sequences ───────────────────────────────────────────────────────────

describe('block sequence', () => {
	it('parses simple scalar list', () => {
		expect(parseYamlValue('- A\n- B\n- C')).toEqual(['A', 'B', 'C']);
	});

	it('parses list of numbers', () => {
		expect(parseYamlValue('- 1\n- 2\n- 3')).toEqual([1, 2, 3]);
	});

	it('parses sequence under a key', () => {
		const yaml = `categories:\n  - Mon\n  - Tue\n  - Wed`;
		expect(parseYamlValue(yaml)).toEqual({ categories: ['Mon', 'Tue', 'Wed'] });
	});
});

// ── sequence of mappings ──────────────────────────────────────────────────────

describe('block sequence of mappings', () => {
	it('parses sequence items with inline key-value', () => {
		const yaml = `- type: bar\n  data: [1, 2]\n- type: line\n  data: [3, 4]`;
		expect(parseYamlValue(yaml)).toEqual([
			{ type: 'bar',  data: [1, 2] },
			{ type: 'line', data: [3, 4] },
		]);
	});

	it('parses sequence of mappings under a key', () => {
		const yaml = `series:\n  - type: bar\n    data: [10, 20]\n  - type: line\n    data: [5, 15]`;
		expect(parseYamlValue(yaml)).toEqual({
			series: [
				{ type: 'bar',  data: [10, 20] },
				{ type: 'line', data: [5, 15]  },
			],
		});
	});
});

// ── realistic echarts option ──────────────────────────────────────────────────

describe('realistic ECharts YAML', () => {
	it('parses the VALID_ADVANCED fixture', () => {
		const yaml = `echarts:
  xAxis:
    type: category
    data: [Q1, Q2, Q3]
  yAxis:
    type: value
  series:
    - type: bar
      data: [120, 200, 150]`;

		expect(parseYamlValue(yaml)).toEqual({
			echarts: {
				xAxis:  { type: 'category', data: ['Q1', 'Q2', 'Q3'] },
				yAxis:  { type: 'value' },
				series: [{ type: 'bar', data: [120, 200, 150] }],
			},
		});
	});

	it('parses multi-series with title', () => {
		const yaml = `echarts:
  title:
    text: Sales
  xAxis:
    type: category
    data: [Jan, Feb, Mar]
  yAxis:
    type: value
  series:
    - type: bar
      name: Revenue
      data: [100, 200, 150]
    - type: line
      name: Profit
      data: [30, 60, 45]`;

		const result = parseYamlValue(yaml) as Record<string, unknown>;
		const e = result['echarts'] as Record<string, unknown>;
		expect((e['series'] as unknown[]).length).toBe(2);
		expect((e['xAxis'] as Record<string, unknown>)['data']).toEqual(['Jan', 'Feb', 'Mar']);
	});
});
