import { parse } from '../../src/data/parser';

const VALID_BAR = `type: bar
title: Sales
xAxis: quarter
---
| quarter | sales | profit |
| --- | --- | --- |
| Q1 | 120 | 30 |
| Q2 | 200 | 50 |`;

const VALID_PIE = `type: pie
xAxis: product
---
| product | share |
| --- | --- |
| A | 40 |
| B | 60 |`;

const VALID_ADVANCED = `echarts:
  xAxis:
    type: category
    data: [Q1, Q2, Q3]
  yAxis:
    type: value
  series:
    - type: bar
      data: [120, 200, 150]`;

describe('parse — simple mode happy path', () => {
	it('parses a bar chart block', () => {
		const result = parse(VALID_BAR);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.mode).toBe('simple');
		expect(result.option['series']).toBeDefined();
	});

	it('parses a line chart block', () => {
		const result = parse(VALID_BAR.replace('type: bar', 'type: line'));
		expect(result.ok).toBe(true);
	});

	it('parses a pie chart block', () => {
		const result = parse(VALID_PIE);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.mode).toBe('simple');
	});

	it('parses a scatter chart block', () => {
		const source = `type: scatter
xAxis: x
---
| x | y |
| --- | --- |
| 1 | 2 |`;
		const result = parse(source);
		expect(result.ok).toBe(true);
	});
});

describe('parse — simple mode validation errors', () => {
	it('returns error when type field is missing', () => {
		const source = `title: No Type
---
| a | b |
| --- | --- |
| 1 | 2 |`;
		const result = parse(source);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.toLowerCase()).toContain('type');
	});

	it('returns error with helpful message for unknown type', () => {
		const source = `type: donut
---
| a | b |
| --- | --- |
| 1 | 2 |`;
		const result = parse(source);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('donut');
		expect(result.error).toContain('bar');
	});

	it('returns error when xAxis column is not in table', () => {
		const source = `type: bar
xAxis: missing
---
| quarter | sales |
| --- | --- |
| Q1 | 120 |`;
		const result = parse(source);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('missing');
		expect(result.error).toContain('quarter');
	});

	it('returns error when a yAxis column is not in table', () => {
		const source = `type: bar
xAxis: quarter
yAxis:
  - ghost
---
| quarter | sales |
| --- | --- |
| Q1 | 120 |`;
		const result = parse(source);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('ghost');
	});

	it('returns error when no --- delimiter and no echarts key', () => {
		const result = parse('type: bar\ntitle: Missing delimiter');
		expect(result.ok).toBe(false);
	});

	it('returns error when table is missing or invalid', () => {
		const source = `type: bar
---
not a table`;
		const result = parse(source);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.toLowerCase()).toContain('table');
	});
});

describe('parse — advanced mode', () => {
	it('parses a valid echarts block', () => {
		const result = parse(VALID_ADVANCED);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.mode).toBe('advanced');
		expect(result.option['xAxis']).toBeDefined();
	});

	it('returns error when echarts key is not an object', () => {
		const result = parse('echarts: "just a string"');
		expect(result.ok).toBe(false);
	});
});
