import { parseTable } from '../data/table-parser';

function escapeCell(v: string): string {
	return v.replace(/\|/g, '\\|');
}

function serialize(headers: string[], rows: string[][]): string {
	const headerRow = '| ' + headers.map(escapeCell).join(' | ') + ' |';
	const sepRow    = '| ' + headers.map(() => '---').join(' | ') + ' |';
	const dataRows  = rows.map(r => '| ' + r.map(escapeCell).join(' | ') + ' |');
	return [headerRow, sepRow, ...dataRows].join('\n');
}

export class TableEditor {
	private headers: string[];
	private rows: string[][];
	private el: HTMLElement;

	constructor(
		private container: HTMLElement,
		initialMarkdown: string,
		private onChange: (markdown: string) => void,
	) {
		const parsed = parseTable(initialMarkdown);
		if (parsed) {
			this.headers = [...parsed.headers];
			this.rows    = parsed.rows.map(r => [...r]);
		} else {
			this.headers = ['column1', 'column2'];
			this.rows    = [['', ''], ['', '']];
		}

		this.el = document.createElement('div');
		this.el.className = 'fc-table-editor';
		this.container.appendChild(this.el);
		this.render();
	}

	getValue(): string {
		return serialize(this.headers, this.rows);
	}

	destroy(): void {
		this.el.remove();
	}

	private render(): void {
		this.el.innerHTML = '';

		const wrapper = document.createElement('div');
		wrapper.className = 'fc-table-wrapper';

		const table = document.createElement('table');
		table.className = 'fc-table';

		// Header row
		const thead = document.createElement('thead');
		const headerTr = document.createElement('tr');
		this.headers.forEach((h, col) => {
			const th = document.createElement('th');
			const input = this.makeInput(h, `column${col + 1}`, (val) => {
				this.headers[col] = val;
				this.onChange(this.getValue());
			});
			th.appendChild(input);
			headerTr.appendChild(th);
		});
		thead.appendChild(headerTr);
		table.appendChild(thead);

		// Data rows
		const tbody = document.createElement('tbody');
		this.rows.forEach((row, rowIdx) => {
			const tr = document.createElement('tr');
			this.headers.forEach((_, col) => {
				const td = document.createElement('td');
				const input = this.makeInput(row[col] ?? '', '', (val) => {
					this.rows[rowIdx][col] = val;
					this.onChange(this.getValue());
				});
				td.appendChild(input);
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
		table.appendChild(tbody);

		wrapper.appendChild(table);
		this.el.appendChild(wrapper);

		this.el.appendChild(this.makeToolbar());
		this.bindKeyboard();
	}

	private makeInput(value: string, placeholder: string, onInput: (val: string) => void): HTMLInputElement {
		const input = document.createElement('input');
		input.type = 'text';
		input.className = 'fc-table-cell';
		input.value = value;
		input.placeholder = placeholder;
		input.addEventListener('input', () => onInput(input.value));
		return input;
	}

	private makeToolbar(): HTMLElement {
		const toolbar = document.createElement('div');
		toolbar.className = 'fc-table-toolbar';

		const addRow = this.makeBtn('Add row', () => {
			this.rows.push(new Array(this.headers.length).fill(''));
			this.render();
			this.onChange(this.getValue());
		});

		const addCol = this.makeBtn('Add column', () => {
			this.headers.push('');
			this.rows = this.rows.map(r => [...r, '']);
			this.render();
			this.onChange(this.getValue());
		});

		const removeRow = this.makeBtn('Remove row', () => {
			if (this.rows.length <= 1) return;
			this.rows.pop();
			this.render();
			this.onChange(this.getValue());
		});

		toolbar.appendChild(addRow);
		toolbar.appendChild(addCol);
		toolbar.appendChild(removeRow);
		return toolbar;
	}

	private makeBtn(label: string, onClick: () => void): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'fc-table-btn';
		btn.textContent = label;
		btn.addEventListener('click', onClick);
		return btn;
	}

	private bindKeyboard(): void {
		const inputs = (): HTMLInputElement[] =>
			Array.from(this.el.querySelectorAll('input.fc-table-cell'));

		this.el.addEventListener('keydown', (e: KeyboardEvent) => {
			const target = e.target as HTMLInputElement;
			if (!target.classList.contains('fc-table-cell')) return;

			const all = inputs();
			const idx = all.indexOf(target);

			if (e.key === 'Tab') {
				e.preventDefault();
				if (!e.shiftKey) {
					if (idx === all.length - 1) {
						this.rows.push(new Array(this.headers.length).fill(''));
						this.render();
						this.onChange(this.getValue());
						inputs()[all.length]?.focus();
					} else {
						all[idx + 1]?.focus();
					}
				} else {
					all[idx - 1]?.focus();
				}
			} else if (e.key === 'Enter' && idx === all.length - 1) {
				e.preventDefault();
				this.rows.push(new Array(this.headers.length).fill(''));
				this.render();
				this.onChange(this.getValue());
				inputs()[all.length]?.focus();
			}
		});
	}
}
