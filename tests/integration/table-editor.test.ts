import { TableEditor } from '../../src/integration/table-editor';

const SIMPLE_MD = '| month | revenue |\n| --- | --- |\n| Jan | 100 |\n| Feb | 200 |';

afterEach(() => { document.body.innerHTML = ''; });

function make(markdown = SIMPLE_MD) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const onChange = vi.fn();
	const editor = new TableEditor(container, markdown, onChange);
	return { container, onChange, editor };
}

function headerInputs(container: HTMLElement): HTMLInputElement[] {
	return Array.from(container.querySelectorAll('.fc-table-editor thead input'));
}

function allCells(container: HTMLElement): HTMLInputElement[] {
	return Array.from(container.querySelectorAll('.fc-table-editor input.fc-table-cell'));
}

function toolbarBtn(container: HTMLElement, label: string): HTMLButtonElement {
	return Array.from(container.querySelectorAll('.fc-table-btn'))
		.find(b => b.textContent === label) as HTMLButtonElement;
}

describe('TableEditor — initial render', () => {
	it('renders the correct number of header inputs', () => {
		const { container } = make();
		expect(headerInputs(container)).toHaveLength(2);
	});

	it('header inputs have correct values', () => {
		const { container } = make();
		const [h1, h2] = headerInputs(container);
		expect(h1.value).toBe('month');
		expect(h2.value).toBe('revenue');
	});

	it('renders the correct number of data rows', () => {
		const { container } = make();
		const rows = container.querySelectorAll('.fc-table-editor tbody tr');
		expect(rows).toHaveLength(2);
	});

	it('falls back to 2-column 2-row grid for empty input', () => {
		const { container } = make('');
		expect(headerInputs(container)).toHaveLength(2);
		expect(container.querySelectorAll('.fc-table-editor tbody tr')).toHaveLength(2);
	});

	it('falls back to 2-column 2-row grid for invalid markdown', () => {
		const { container } = make('not a table at all');
		expect(headerInputs(container)).toHaveLength(2);
	});
});

describe('TableEditor — getValue', () => {
	it('returns a markdown table string', () => {
		const { editor } = make();
		const val = editor.getValue();
		expect(val).toContain('| month | revenue |');
		expect(val).toContain('| --- | --- |');
		expect(val).toContain('| Jan | 100 |');
	});

	it('escapes pipe characters in cell values', () => {
		const { container, editor } = make();
		const cell = allCells(container)[2]; // first data cell
		cell.value = 'a|b';
		cell.dispatchEvent(new Event('input'));
		expect(editor.getValue()).toContain('a\\|b');
	});

	it('editing a header updates getValue output', () => {
		const { container, editor } = make();
		const h1 = headerInputs(container)[0];
		h1.value = 'quarter';
		h1.dispatchEvent(new Event('input'));
		expect(editor.getValue()).toContain('quarter');
	});

	it('editing a data cell updates getValue output', () => {
		const { container, editor } = make();
		const cells = allCells(container);
		const firstDataCell = cells[2]; // after 2 header inputs
		firstDataCell.value = 'Mar';
		firstDataCell.dispatchEvent(new Event('input'));
		expect(editor.getValue()).toContain('Mar');
	});
});

describe('TableEditor — onChange', () => {
	it('calls onChange when a header is edited', () => {
		const { container, onChange } = make();
		headerInputs(container)[0].dispatchEvent(new Event('input'));
		expect(onChange).toHaveBeenCalled();
	});

	it('calls onChange when a data cell is edited', () => {
		const { container, onChange } = make();
		allCells(container)[2].dispatchEvent(new Event('input'));
		expect(onChange).toHaveBeenCalled();
	});
});

describe('TableEditor — Add row', () => {
	it('appends a new empty row', () => {
		const { container } = make();
		toolbarBtn(container, 'Add row').click();
		const rows = container.querySelectorAll('.fc-table-editor tbody tr');
		expect(rows).toHaveLength(3);
	});

	it('new row cells are empty', () => {
		const { container } = make();
		toolbarBtn(container, 'Add row').click();
		const rows = container.querySelectorAll('.fc-table-editor tbody tr');
		const lastRowCells = Array.from(rows[2].querySelectorAll('input')) as HTMLInputElement[];
		expect(lastRowCells.every(c => c.value === '')).toBe(true);
	});

	it('getValue reflects the new row', () => {
		const { editor, container } = make();
		toolbarBtn(container, 'Add row').click();
		expect(editor.getValue().split('\n')).toHaveLength(5); // header + sep + 3 data rows
	});

	it('calls onChange after adding a row', () => {
		const { container, onChange } = make();
		const before = onChange.mock.calls.length;
		toolbarBtn(container, 'Add row').click();
		expect(onChange.mock.calls.length).toBeGreaterThan(before);
	});
});

describe('TableEditor — Add column', () => {
	it('appends a new column header input', () => {
		const { container } = make();
		toolbarBtn(container, 'Add column').click();
		expect(headerInputs(container)).toHaveLength(3);
	});

	it('new column header is empty', () => {
		const { container } = make();
		toolbarBtn(container, 'Add column').click();
		expect(headerInputs(container)[2].value).toBe('');
	});

	it('each existing row gains a new empty cell', () => {
		const { container } = make();
		toolbarBtn(container, 'Add column').click();
		const rows = container.querySelectorAll('.fc-table-editor tbody tr');
		rows.forEach(row => {
			expect(row.querySelectorAll('input')).toHaveLength(3);
		});
	});

	it('getValue reflects the new column', () => {
		const { editor, container } = make();
		toolbarBtn(container, 'Add column').click();
		expect(editor.getValue()).toMatch(/\| month \| revenue \|  \|/);
	});
});

describe('TableEditor — Remove row', () => {
	it('removes the last data row', () => {
		const { container } = make();
		toolbarBtn(container, 'Remove row').click();
		expect(container.querySelectorAll('.fc-table-editor tbody tr')).toHaveLength(1);
	});

	it('getValue no longer contains the removed row', () => {
		const { editor, container } = make();
		toolbarBtn(container, 'Remove row').click();
		expect(editor.getValue()).not.toContain('Feb');
	});

	it('does not remove the last remaining row', () => {
		const { container } = make();
		toolbarBtn(container, 'Remove row').click(); // 2 → 1
		toolbarBtn(container, 'Remove row').click(); // should stay at 1
		expect(container.querySelectorAll('.fc-table-editor tbody tr')).toHaveLength(1);
	});

	it('calls onChange after removing a row', () => {
		const { container, onChange } = make();
		const before = onChange.mock.calls.length;
		toolbarBtn(container, 'Remove row').click();
		expect(onChange.mock.calls.length).toBeGreaterThan(before);
	});
});

describe('TableEditor — keyboard navigation', () => {
	function tab(el: HTMLElement, shift = false): void {
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true }));
	}

	function enter(el: HTMLElement): void {
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
	}

	it('Tab moves focus to the next cell', () => {
		const { container } = make();
		const cells = allCells(container);
		cells[0].focus();
		tab(cells[0]);
		expect(document.activeElement).toBe(cells[1]);
	});

	it('Shift+Tab moves focus to the previous cell', () => {
		const { container } = make();
		const cells = allCells(container);
		cells[1].focus();
		tab(cells[1], true);
		expect(document.activeElement).toBe(cells[0]);
	});

	it('Tab on the last cell adds a new row', () => {
		const { container } = make();
		const cells = allCells(container);
		cells[cells.length - 1].focus();
		tab(cells[cells.length - 1]);
		expect(container.querySelectorAll('.fc-table-editor tbody tr')).toHaveLength(3);
	});

	it('Tab on last cell focuses first cell of the new row', () => {
		const { container } = make();
		const before = allCells(container);
		before[before.length - 1].focus();
		tab(before[before.length - 1]);
		const after = allCells(container);
		expect(document.activeElement).toBe(after[before.length]);
	});

	it('Enter on the last cell adds a new row', () => {
		const { container } = make();
		const cells = allCells(container);
		cells[cells.length - 1].focus();
		enter(cells[cells.length - 1]);
		expect(container.querySelectorAll('.fc-table-editor tbody tr')).toHaveLength(3);
	});

	it('Enter on a non-last cell does not add a row', () => {
		const { container } = make();
		const cells = allCells(container);
		cells[0].focus();
		enter(cells[0]);
		expect(container.querySelectorAll('.fc-table-editor tbody tr')).toHaveLength(2);
	});
});

describe('TableEditor — destroy', () => {
	it('removes the editor element from the container', () => {
		const { container, editor } = make();
		expect(container.querySelector('.fc-table-editor')).not.toBeNull();
		editor.destroy();
		expect(container.querySelector('.fc-table-editor')).toBeNull();
	});
});
