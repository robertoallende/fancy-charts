import { serializeBlock } from '../../src/integration/modal';
import type { ModalState } from '../../src/integration/modal';

const baseState: ModalState = {
	type: 'bar',
	title: 'Sales',
	xAxis: 'quarter',
	tableText: '| quarter | sales |\n| --- | --- |\n| Q1 | 120 |',
};

describe('serializeBlock', () => {
	it('opens and closes with fancy-charts fence', () => {
		const block = serializeBlock(baseState);
		expect(block.startsWith('```fancy-charts\n')).toBe(true);
		expect(block.endsWith('\n```')).toBe(true);
	});

	it('includes type in YAML section', () => {
		const block = serializeBlock(baseState);
		expect(block).toContain('type: bar');
	});

	it('includes title when provided', () => {
		const block = serializeBlock(baseState);
		expect(block).toContain('title: Sales');
	});

	it('omits title line when title is empty', () => {
		const block = serializeBlock({ ...baseState, title: '' });
		expect(block).not.toContain('title:');
	});

	it('includes xAxis when provided', () => {
		const block = serializeBlock(baseState);
		expect(block).toContain('xAxis: quarter');
	});

	it('omits xAxis line when xAxis is empty', () => {
		const block = serializeBlock({ ...baseState, xAxis: '' });
		expect(block).not.toContain('xAxis:');
	});

	it('includes the YAML delimiter ---', () => {
		const block = serializeBlock(baseState);
		expect(block).toContain('---');
	});

	it('includes the table text after the delimiter', () => {
		const block = serializeBlock(baseState);
		expect(block).toContain('| quarter | sales |');
		expect(block).toContain('| Q1 | 120 |');
	});

	it('YAML section comes before table text', () => {
		const block = serializeBlock(baseState);
		expect(block.indexOf('type: bar')).toBeLessThan(block.indexOf('| quarter |'));
	});

	it('works for all chart types', () => {
		for (const type of ['bar', 'line', 'pie', 'scatter'] as const) {
			const block = serializeBlock({ ...baseState, type });
			expect(block).toContain(`type: ${type}`);
		}
	});

	it('trims trailing whitespace from tableText', () => {
		const block = serializeBlock({ ...baseState, tableText: '| a | b |\n| --- | --- |\n   ' });
		expect(block.endsWith('\n```')).toBe(true);
	});
});
