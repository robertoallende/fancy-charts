import { buildAdvancedOption } from '../../src/data/sanitizer';

describe('buildAdvancedOption', () => {
	it('returns the echarts option unchanged when no XSS vectors present', () => {
		const config = { echarts: { xAxis: { type: 'category' }, series: [{ type: 'bar' }] } };
		const result = buildAdvancedOption(config);
		expect('error' in result).toBe(false);
		expect((result as Record<string, unknown>)['xAxis']).toEqual({ type: 'category' });
	});

	it('strips title.link when it starts with javascript:', () => {
		const config = { echarts: { title: { text: 'Chart', link: 'javascript:alert(1)' } } };
		const result = buildAdvancedOption(config) as Record<string, unknown>;
		expect((result['title'] as Record<string, unknown>)['link']).toBeUndefined();
		expect((result['title'] as Record<string, unknown>)['text']).toBe('Chart');
	});

	it('strips title.link when it starts with JAVASCRIPT: (case-insensitive)', () => {
		const config = { echarts: { title: { link: 'JAVASCRIPT:alert(1)' } } };
		const result = buildAdvancedOption(config) as Record<string, unknown>;
		expect((result['title'] as Record<string, unknown>)['link']).toBeUndefined();
	});

	it('keeps title.link when it is a normal https URL', () => {
		const config = { echarts: { title: { link: 'https://example.com' } } };
		const result = buildAdvancedOption(config) as Record<string, unknown>;
		expect((result['title'] as Record<string, unknown>)['link']).toBe('https://example.com');
	});

	it('strips tooltip.formatter when it is a string', () => {
		const config = { echarts: { tooltip: { trigger: 'axis', formatter: '<b>{a}</b>' } } };
		const result = buildAdvancedOption(config) as Record<string, unknown>;
		expect((result['tooltip'] as Record<string, unknown>)['formatter']).toBeUndefined();
		expect((result['tooltip'] as Record<string, unknown>)['trigger']).toBe('axis');
	});

	it('leaves tooltip unchanged when formatter is absent', () => {
		const config = { echarts: { tooltip: { trigger: 'item' } } };
		const result = buildAdvancedOption(config) as Record<string, unknown>;
		expect(result['tooltip']).toEqual({ trigger: 'item' });
	});

	it('returns error when echarts key is missing', () => {
		const config = { type: 'bar' };
		const result = buildAdvancedOption(config);
		expect('error' in result).toBe(true);
	});

	it('returns error when echarts key is not an object', () => {
		const config = { echarts: 'not an object' };
		const result = buildAdvancedOption(config);
		expect('error' in result).toBe(true);
	});

	it('passes through a deeply nested option with no XSS vectors unchanged', () => {
		const config = {
			echarts: {
				series: [{ type: 'bar', data: [1, 2, 3] }],
				grid: { left: '10%', right: '10%' },
			},
		};
		const result = buildAdvancedOption(config) as Record<string, unknown>;
		expect((result['grid'] as Record<string, unknown>)['left']).toBe('10%');
	});
});
