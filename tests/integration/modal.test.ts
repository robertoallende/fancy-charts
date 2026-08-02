import { serializeBlock, FancyChartsModal } from '../../src/integration/modal';
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

describe('FancyChartsModal — form rendering', () => {
	function openModal(onConfirm = vi.fn()) {
		const modal = new FancyChartsModal({} as never, onConfirm);
		modal.onOpen();
		return modal;
	}

	it('renders a select for chart type with all four options', () => {
		const modal = openModal();
		const select = modal.contentEl.querySelector('select') as HTMLSelectElement;
		expect(select).not.toBeNull();
		const values = Array.from(select.options).map(o => o.value);
		expect(values).toContain('bar');
		expect(values).toContain('line');
		expect(values).toContain('pie');
		expect(values).toContain('scatter');
	});

	it('renders a title text input', () => {
		const modal = openModal();
		const inputs = Array.from(modal.contentEl.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
		expect(inputs.length).toBeGreaterThanOrEqual(1);
	});

	it('renders a textarea for the data table', () => {
		const modal = openModal();
		const ta = modal.contentEl.querySelector('textarea');
		expect(ta).not.toBeNull();
	});

	it('textarea is pre-filled with default table', () => {
		const modal = openModal();
		const ta = modal.contentEl.querySelector('textarea') as HTMLTextAreaElement;
		expect(ta.value).toContain('| category | value |');
	});

	it('renders Insert and Cancel buttons', () => {
		const modal = openModal();
		const buttons = Array.from(modal.contentEl.querySelectorAll('button')).map(b => b.textContent);
		expect(buttons).toContain('Insert');
		expect(buttons).toContain('Cancel');
	});

	it('Insert button calls onConfirm with serialized block', () => {
		const onConfirm = vi.fn();
		const modal = openModal(onConfirm);
		const insertBtn = Array.from(modal.contentEl.querySelectorAll('button'))
			.find(b => b.textContent === 'Insert') as HTMLButtonElement;
		insertBtn.click();
		expect(onConfirm).toHaveBeenCalledOnce();
		expect(onConfirm.mock.calls[0][0]).toContain('```fancy-charts');
	});
});

describe('FancyChartsModal — xAxis auto-detection', () => {
	it('auto-fills xAxis from first table column header', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();

		// Clear default xAxis
		const xAxisInput = Array.from(modal.contentEl.querySelectorAll('input[type="text"]'))
			.at(1) as HTMLInputElement;
		xAxisInput.value = '';
		xAxisInput.dispatchEvent(new Event('input'));

		// Type a table into the textarea
		const ta = modal.contentEl.querySelector('textarea') as HTMLTextAreaElement;
		ta.value = '| month | revenue |\n| --- | --- |\n| Jan | 100 |';
		ta.dispatchEvent(new Event('input'));

		expect(xAxisInput.value).toBe('month');
	});

	it('does not overwrite a manually set xAxis', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();

		const xAxisInput = Array.from(modal.contentEl.querySelectorAll('input[type="text"]'))
			.at(1) as HTMLInputElement;
		xAxisInput.value = 'quarter';
		xAxisInput.dispatchEvent(new Event('input'));

		const ta = modal.contentEl.querySelector('textarea') as HTMLTextAreaElement;
		ta.value = '| month | revenue |\n| --- | --- |\n| Jan | 100 |';
		ta.dispatchEvent(new Event('input'));

		expect(xAxisInput.value).toBe('quarter');
	});
});
