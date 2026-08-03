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

		this.el = this.container.createEl('div', { cls: 'fc-table-editor' });
		this.render();
		this.bindKeyboard();
	}

	getValue(): string {
		return serialize(this.headers, this.rows);
	}

	destroy(): void {
		this.el.remove();
	}

	private render(): void {
		this.el.innerHTML = '';

		const wrapper = this.el.createEl('div', { cls: 'fc-table-wrapper' });
		const table   = wrapper.createEl('table', { cls: 'fc-table' });

		const thead    = table.createEl('thead');
		const headerTr = thead.createEl('tr');
		this.headers.forEach((h, col) => {
			const th = headerTr.createEl('th');
			this.makeInput(th, h, `column${col + 1}`, (val) => {
				this.headers[col] = val;
				this.onChange(this.getValue());
			});
		});

		const tbody = table.createEl('tbody');
		this.rows.forEach((row, rowIdx) => {
			const tr = tbody.createEl('tr');
			this.headers.forEach((_, col) => {
				const td = tr.createEl('td');
				this.makeInput(td, row[col] ?? '', '', (val) => {
					this.rows[rowIdx][col] = val;
					this.onChange(this.getValue());
				});
			});
		});

		this.makeToolbar(this.el);
	}

	private makeInput(parent: HTMLElement, value: string, placeholder: string, onInput: (val: string) => void): HTMLInputElement {
		const input = parent.createEl('input', { cls: 'fc-table-cell', type: 'text', placeholder });
		input.value = value;
		input.addEventListener('input', () => onInput(input.value));
		return input;
	}

	private makeToolbar(parent: HTMLElement): void {
		const toolbar = parent.createEl('div', { cls: 'fc-table-toolbar' });

		this.makeBtn(toolbar, 'Add row', () => {
			this.rows.push(new Array(this.headers.length).fill(''));
			this.render();
			this.onChange(this.getValue());
		});

		this.makeBtn(toolbar, 'Add column', () => {
			this.headers.push('');
			this.rows = this.rows.map(r => [...r, '']);
			this.render();
			this.onChange(this.getValue());
		});

		this.makeBtn(toolbar, 'Remove row', () => {
			if (this.rows.length <= 1) return;
			this.rows.pop();
			this.render();
			this.onChange(this.getValue());
		});

		this.makeBtn(toolbar, 'Remove column', () => {
			if (this.headers.length <= 1) return;
			this.headers.pop();
			this.rows = this.rows.map(r => r.slice(0, -1));
			this.render();
			this.onChange(this.getValue());
		});
	}

	private makeBtn(parent: HTMLElement, label: string, onClick: () => void): void {
		const btn = parent.createEl('button', { cls: 'fc-table-btn', text: label });
		btn.type = 'button';
		btn.addEventListener('click', onClick);
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
