import { buildOption } from '../../src/data/option-builder';
import type { SimpleConfig, TableData } from '../../src/model/chart';

const basicTable: TableData = {
	headers: ['quarter', 'sales', 'profit'],
	rows: [['Q1', '120', '30'], ['Q2', '200', '50'], ['Q3', '150', '35']],
};

const twoColTable: TableData = {
	headers: ['month', 'revenue'],
	rows: [['Jan', '100'], ['Feb', '200']],
};

describe('buildOption — bar', () => {
	it('builds a bar chart with a single series', () => {
		const config: SimpleConfig = { type: 'bar', xAxis: 'month' };
		const option = buildOption(config, twoColTable);
		expect((option.series as unknown[]).length).toBe(1);
		expect((option.series as { type: string }[])[0].type).toBe('bar');
		expect((option.xAxis as { type: string }).type).toBe('category');
	});

	it('auto-detects all non-xAxis columns as series when yAxis is omitted', () => {
		const config: SimpleConfig = { type: 'bar', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.series as unknown[]).length).toBe(2);
	});

	it('uses only specified yAxis columns', () => {
		const config: SimpleConfig = { type: 'bar', xAxis: 'quarter', yAxis: ['sales'] };
		const option = buildOption(config, basicTable);
		expect((option.series as unknown[]).length).toBe(1);
	});

	it('includes title when provided', () => {
		const config: SimpleConfig = { type: 'bar', title: 'My Chart', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.title as { text: string }).text).toBe('My Chart');
	});

	it('omits title when not provided', () => {
		const config: SimpleConfig = { type: 'bar', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect(option.title).toBeUndefined();
	});

	it('uses first column as xAxis when xAxis is omitted', () => {
		const config: SimpleConfig = { type: 'bar' };
		const option = buildOption(config, basicTable);
		const series = option.series as { encode: { x: string } }[];
		expect(series[0].encode.x).toBe('quarter');
	});

	it('dataset source includes header row followed by data rows', () => {
		const config: SimpleConfig = { type: 'bar', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const source = (option.dataset as { source: unknown[] }).source;
		expect(source[0]).toEqual(['quarter', 'sales', 'profit']);
		expect(source[1]).toEqual(['Q1', '120', '30']);
	});

	it('positions legend at the bottom', () => {
		const config: SimpleConfig = { type: 'bar', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.legend as Record<string, unknown>).bottom).toBe(10);
	});

	it('sets grid bottom padding to leave room for the legend', () => {
		const config: SimpleConfig = { type: 'bar', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.grid as Record<string, unknown>).bottom).toBeGreaterThan(0);
	});
});

describe('buildOption — line', () => {
	it('builds a line chart with correct series type', () => {
		const config: SimpleConfig = { type: 'line', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const series = option.series as { type: string }[];
		expect(series.every(s => s.type === 'line')).toBe(true);
	});

	it('auto-detects series columns for line chart', () => {
		const config: SimpleConfig = { type: 'line', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.series as unknown[]).length).toBe(2);
	});
});

describe('buildOption — pie', () => {
	it('builds a pie chart with correct series type', () => {
		const config: SimpleConfig = { type: 'pie', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const series = option.series as { type: string }[];
		expect(series[0].type).toBe('pie');
	});

	it('uses xAxis column as itemName and first other column as value', () => {
		const config: SimpleConfig = { type: 'pie', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const series = option.series as { encode: { itemName: string; value: string } }[];
		expect(series[0].encode.itemName).toBe('quarter');
		expect(series[0].encode.value).toBe('sales');
	});

	it('includes title when provided', () => {
		const config: SimpleConfig = { type: 'pie', title: 'Revenue Split', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.title as { text: string }).text).toBe('Revenue Split');
	});

	it('omits title when not provided', () => {
		const config: SimpleConfig = { type: 'pie', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect(option.title).toBeUndefined();
	});

	it('positions legend at the bottom', () => {
		const config: SimpleConfig = { type: 'pie', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.legend as Record<string, unknown>).bottom).toBe(10);
	});

	it('hides slice labels', () => {
		const config: SimpleConfig = { type: 'pie', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const series = (option.series as Record<string, unknown>[])[0];
		expect((series.label as Record<string, unknown>).show).toBe(false);
	});

	it('uses first column as xAxis when xAxis is omitted', () => {
		const config: SimpleConfig = { type: 'pie' };
		const option = buildOption(config, basicTable);
		const series = option.series as { encode: { itemName: string } }[];
		expect(series[0].encode.itemName).toBe('quarter');
	});
});

describe('buildOption — area', () => {
	it('produces line series with stack and areaStyle', () => {
		const config: SimpleConfig = { type: 'area', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const series = option.series as Record<string, unknown>[];
		expect(series[0].type).toBe('line');
		expect(series[0].stack).toBe('Total');
		expect(series[0].areaStyle).toBeDefined();
	});

	it('creates one series per non-xAxis column', () => {
		const config: SimpleConfig = { type: 'area', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const series = option.series as Record<string, unknown>[];
		expect(series).toHaveLength(2);
		expect((series[0].encode as Record<string, string>).y).toBe('sales');
		expect((series[1].encode as Record<string, string>).y).toBe('profit');
	});

	it('sets xAxis boundaryGap to false', () => {
		const config: SimpleConfig = { type: 'area', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.xAxis as Record<string, unknown>).boundaryGap).toBe(false);
	});

	it('positions legend at the bottom', () => {
		const config: SimpleConfig = { type: 'area', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.legend as Record<string, unknown>).bottom).toBe(10);
	});

	it('includes title when provided', () => {
		const config: SimpleConfig = { type: 'area', xAxis: 'quarter', title: 'Trends' };
		const option = buildOption(config, basicTable);
		expect((option.title as Record<string, unknown>).text).toBe('Trends');
	});
});

describe('buildOption — scatter', () => {
	it('builds a scatter chart with correct series type', () => {
		const config: SimpleConfig = { type: 'scatter', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		const series = option.series as { type: string }[];
		expect(series[0].type).toBe('scatter');
	});

	it('uses value axis type for both x and y', () => {
		const config: SimpleConfig = { type: 'scatter', xAxis: 'quarter' };
		const option = buildOption(config, basicTable);
		expect((option.xAxis as { type: string }).type).toBe('value');
		expect((option.yAxis as { type: string }).type).toBe('value');
	});

	it('uses explicit yAxis column when provided', () => {
		const config: SimpleConfig = { type: 'scatter', xAxis: 'quarter', yAxis: ['profit'] };
		const option = buildOption(config, basicTable);
		const series = option.series as { encode: { y: string } }[];
		expect(series[0].encode.y).toBe('profit');
	});
});
