import { serializeBlock, deserializeBlock, FancyChartsModal } from '../../src/integration/modal';
import type { ModalState } from '../../src/integration/modal';
import { ChartRenderer } from '../../src/render/renderer';

vi.mock('../../src/render/renderer', () => {
	const ChartRenderer = vi.fn();
	ChartRenderer.prototype.render = vi.fn();
	ChartRenderer.prototype.dispose = vi.fn();
	ChartRenderer.prototype.resize = vi.fn();
	return { ChartRenderer };
});

vi.mock('../../src/render/echarts-init', () => ({
	echarts: { registerTheme: vi.fn() },
}));

vi.mock('../../src/theme/theme-vars', () => ({
	isDarkMode: vi.fn().mockReturnValue(false),
	readThemeVars: vi.fn().mockReturnValue({}),
}));

vi.mock('../../src/theme/theme-builder', () => ({
	buildEChartsTheme: vi.fn().mockReturnValue({}),
}));

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
});

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

	it('renders a select for chart type with all options', () => {
		const modal = openModal();
		const select = modal.contentEl.querySelector('select') as HTMLSelectElement;
		expect(select).not.toBeNull();
		const values = Array.from(select.options).map(o => o.value);
		expect(values).toContain('bar');
		expect(values).toContain('line');
		expect(values).toContain('pie');
		expect(values).toContain('scatter');
		expect(values).toContain('area');
		expect(values).toContain('funnel');
		expect(values).toContain('heatmap');
		expect(values).toContain('sankey');
	});

	it('renders a title text input', () => {
		const modal = openModal();
		const inputs = Array.from(modal.contentEl.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
		expect(inputs.length).toBeGreaterThanOrEqual(1);
	});

	it('renders a table editor for the data', () => {
		const modal = openModal();
		expect(modal.contentEl.querySelector('.fc-table-editor')).not.toBeNull();
	});

	it('table editor is pre-filled with default table columns', () => {
		const modal = openModal();
		const firstHeader = modal.contentEl.querySelector('.fc-table-editor thead input') as HTMLInputElement;
		expect(firstHeader.value).toBe('category');
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

		// Edit the first header in the table editor
		const firstHeader = modal.contentEl.querySelector('.fc-table-editor thead input') as HTMLInputElement;
		firstHeader.value = 'month';
		firstHeader.dispatchEvent(new Event('input'));

		expect(xAxisInput.value).toBe('month');
	});

	it('does not overwrite a manually set xAxis', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();

		const xAxisInput = Array.from(modal.contentEl.querySelectorAll('input[type="text"]'))
			.at(1) as HTMLInputElement;
		xAxisInput.value = 'quarter';
		xAxisInput.dispatchEvent(new Event('input'));

		// Edit the first header in the table editor
		const firstHeader = modal.contentEl.querySelector('.fc-table-editor thead input') as HTMLInputElement;
		firstHeader.value = 'month';
		firstHeader.dispatchEvent(new Event('input'));

		expect(xAxisInput.value).toBe('quarter');
	});
});

describe('FancyChartsModal — live preview', () => {
	beforeEach(() => {
		vi.mocked(ChartRenderer).prototype.render = vi.fn();
		vi.mocked(ChartRenderer).prototype.dispose = vi.fn();
		vi.mocked(ChartRenderer).prototype.resize = vi.fn();
	});

	it('renders chart after 300ms debounce on open', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();
		vi.advanceTimersByTime(300);
		expect(ChartRenderer.prototype.render).toHaveBeenCalledOnce();
	});

	it('does not render before debounce fires', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();
		vi.advanceTimersByTime(299);
		expect(ChartRenderer.prototype.render).not.toHaveBeenCalled();
	});

	it('shows error panel when parse fails', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();

		// Point xAxis at a column that doesn't exist → parse returns an error
		const xAxisInput = Array.from(
			modal.contentEl.querySelectorAll('input[type="text"]'),
		).at(1) as HTMLInputElement;
		xAxisInput.value = 'nonexistent-column';
		xAxisInput.dispatchEvent(new Event('input'));

		vi.advanceTimersByTime(300);

		const errEl = modal.contentEl.querySelector('.fc-modal-preview-error') as HTMLElement;
		expect(errEl.style.display).not.toBe('none');
	});

	it('hides error panel when parse succeeds', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();
		vi.advanceTimersByTime(300);

		const errEl = modal.contentEl.querySelector('.fc-modal-preview-error') as HTMLElement;
		expect(errEl.style.display).toBe('none');
	});

	it('disposes renderer on close', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();
		vi.advanceTimersByTime(300);
		modal.onClose();
		expect(ChartRenderer.prototype.dispose).toHaveBeenCalledOnce();
	});

	it('clears pending debounce on close without rendering', () => {
		const modal = new FancyChartsModal({} as never, vi.fn());
		modal.onOpen();
		modal.onClose();
		vi.advanceTimersByTime(300);
		expect(ChartRenderer.prototype.render).not.toHaveBeenCalled();
	});
});

describe('deserializeBlock', () => {
	it('recovers type from a serialized block', () => {
		const state: ModalState = { type: 'line', title: '', xAxis: '', tableText: '| a | b |\n| --- | --- |\n| 1 | 2 |' };
		const raw = serializeBlock(state).replace(/^```fancy-charts\n/, '').replace(/\n```$/, '');
		expect(deserializeBlock(raw).type).toBe('line');
	});

	it('round-trips all chart types', () => {
		for (const type of ['bar', 'line', 'pie', 'scatter', 'area', 'funnel', 'heatmap', 'sankey'] as const) {
			const state: ModalState = { type, title: '', xAxis: '', tableText: '| a | b |\n| --- | --- |\n| 1 | 2 |' };
			const raw = serializeBlock(state).replace(/^```fancy-charts\n/, '').replace(/\n```$/, '');
			expect(deserializeBlock(raw).type).toBe(type);
		}
	});

	it('recovers title from a serialized block', () => {
		const state: ModalState = { type: 'bar', title: 'My Chart', xAxis: '', tableText: '| a | b |\n| --- | --- |\n| 1 | 2 |' };
		const raw = serializeBlock(state).replace(/^```fancy-charts\n/, '').replace(/\n```$/, '');
		expect(deserializeBlock(raw).title).toBe('My Chart');
	});

	it('recovers xAxis from a serialized block', () => {
		const state: ModalState = { type: 'bar', title: '', xAxis: 'quarter', tableText: '| quarter | sales |\n| --- | --- |\n| Q1 | 10 |' };
		const raw = serializeBlock(state).replace(/^```fancy-charts\n/, '').replace(/\n```$/, '');
		expect(deserializeBlock(raw).xAxis).toBe('quarter');
	});

	it('recovers tableText from a serialized block', () => {
		const tableText = '| quarter | sales |\n| --- | --- |\n| Q1 | 10 |';
		const state: ModalState = { type: 'bar', title: '', xAxis: '', tableText };
		const raw = serializeBlock(state).replace(/^```fancy-charts\n/, '').replace(/\n```$/, '');
		expect(deserializeBlock(raw).tableText).toBe(tableText);
	});

	it('falls back to empty string when title is absent', () => {
		const state: ModalState = { type: 'bar', title: '', xAxis: '', tableText: '| a | b |\n| --- | --- |\n| 1 | 2 |' };
		const raw = serializeBlock(state).replace(/^```fancy-charts\n/, '').replace(/\n```$/, '');
		expect(deserializeBlock(raw).title).toBe('');
	});

	it('falls back to empty string when xAxis is absent', () => {
		const state: ModalState = { type: 'bar', title: '', xAxis: '', tableText: '| a | b |\n| --- | --- |\n| 1 | 2 |' };
		const raw = serializeBlock(state).replace(/^```fancy-charts\n/, '').replace(/\n```$/, '');
		expect(deserializeBlock(raw).xAxis).toBe('');
	});

	it('falls back to bar when type is unknown', () => {
		expect(deserializeBlock('type: unknown\n---\n| a | b |\n| --- | --- |\n| 1 | 2 |').type).toBe('bar');
	});

	it('falls back to DEFAULT_STATE on missing delimiter', () => {
		const result = deserializeBlock('no delimiter here');
		expect(result.type).toBe('bar');
	});
});

describe('FancyChartsModal — pre-fill from initialState', () => {
	const editState: ModalState = {
		type: 'pie',
		title: 'Revenue Breakdown',
		xAxis: 'category',
		tableText: '| category | revenue |\n| --- | --- |\n| A | 50 |\n| B | 50 |',
	};

	function openWithState() {
		const modal = new FancyChartsModal({} as never, vi.fn(), editState);
		modal.onOpen();
		return modal;
	}

	it('pre-selects the correct chart type', () => {
		const modal = openWithState();
		const select = modal.contentEl.querySelector('select') as HTMLSelectElement;
		expect(select.value).toBe('pie');
	});

	it('pre-fills the title input', () => {
		const modal = openWithState();
		const titleInput = modal.contentEl.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;
		expect(titleInput.value).toBe('Revenue Breakdown');
	});

	it('pre-fills the xAxis input', () => {
		const modal = openWithState();
		const xAxisInput = modal.contentEl.querySelectorAll('input[type="text"]')[1] as HTMLInputElement;
		expect(xAxisInput.value).toBe('category');
	});

	it('pre-fills the table editor with the correct first header', () => {
		const modal = openWithState();
		const firstHeader = modal.contentEl.querySelector('.fc-table-editor thead input') as HTMLInputElement;
		expect(firstHeader.value).toBe('category');
	});

	it('Update button serializes the pre-filled state', () => {
		const onConfirm = vi.fn();
		const modal = new FancyChartsModal({} as never, onConfirm, editState);
		modal.onOpen();
		const insertBtn = Array.from(modal.contentEl.querySelectorAll('button'))
			.find(b => b.textContent === 'Update') as HTMLButtonElement;
		insertBtn.click();
		expect(onConfirm.mock.calls[0][0]).toContain('type: pie');
		expect(onConfirm.mock.calls[0][0]).toContain('title: Revenue Breakdown');
	});
});
