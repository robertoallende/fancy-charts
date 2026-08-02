import { App, Modal } from 'obsidian';
import { parseTable } from '../data/table-parser';

export interface ModalState {
	type: 'bar' | 'line' | 'pie' | 'scatter';
	title: string;
	xAxis: string;
	tableText: string;
}

export const DEFAULT_STATE: ModalState = {
	type: 'bar',
	title: '',
	xAxis: '',
	tableText: '| category | value |\n| --- | --- |\n| A | 10 |\n| B | 20 |',
};

const CHART_TYPES: ModalState['type'][] = ['bar', 'line', 'pie', 'scatter'];

export function serializeBlock(state: ModalState): string {
	const yaml: string[] = [`type: ${state.type}`];
	if (state.title.trim()) yaml.push(`title: ${state.title.trim()}`);
	if (state.xAxis.trim()) yaml.push(`xAxis: ${state.xAxis.trim()}`);

	const inner = ['---', ...yaml, '---', state.tableText.trim()].join('\n');
	return `\`\`\`fancy-charts\n${inner}\n\`\`\``;
}

export class FancyChartsModal extends Modal {
	private state: ModalState;
	private xAxisInput: HTMLInputElement | null = null;

	constructor(app: App, private onConfirm: (block: string) => void) {
		super(app);
		this.state = { ...DEFAULT_STATE };
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.titleEl.textContent = 'Insert chart';
		contentEl.classList.add('fc-modal');

		const layout = contentEl.createDiv({ cls: 'fc-modal-layout' });
		const formEl = layout.createDiv({ cls: 'fc-modal-form' });
		this.previewContainer = layout.createDiv({ cls: 'fc-modal-preview' });

		this.renderForm(formEl);
		this.renderButtons(contentEl);
	}

	// overridden in subunit 003 to hold ChartRenderer
	protected previewContainer: HTMLElement | null = null;
	protected onFormChange(): void {}

	private renderForm(container: HTMLElement): void {
		this.renderField(container, 'Chart type', el => {
			const select = el.createEl('select', { cls: 'fc-modal-input' });
			for (const t of CHART_TYPES) {
				const opt = select.createEl('option', { text: t });
				opt.value = t;
				if (t === this.state.type) opt.selected = true;
			}
			select.addEventListener('change', () => {
				this.state.type = select.value as ModalState['type'];
				this.onFormChange();
			});
		});

		this.renderField(container, 'Title', el => {
			const inp = el.createEl('input', { cls: 'fc-modal-input', type: 'text' });
			inp.placeholder = 'Optional chart title';
			inp.value = this.state.title;
			inp.addEventListener('input', () => {
				this.state.title = inp.value;
				this.onFormChange();
			});
		});

		this.renderField(container, 'X axis column', el => {
			this.xAxisInput = el.createEl('input', { cls: 'fc-modal-input', type: 'text' });
			this.xAxisInput.placeholder = 'Auto-detected from table';
			this.xAxisInput.value = this.state.xAxis;
			this.xAxisInput.addEventListener('input', () => {
				this.state.xAxis = this.xAxisInput!.value;
				this.onFormChange();
			});
		});

		this.renderField(container, 'Data table', el => {
			const ta = el.createEl('textarea', { cls: 'fc-modal-textarea' });
			ta.value = this.state.tableText;
			ta.rows = 8;
			ta.addEventListener('input', () => {
				this.state.tableText = ta.value;
				this.autoDetectXAxis(ta.value);
				this.onFormChange();
			});
		});
	}

	private autoDetectXAxis(tableText: string): void {
		if (this.state.xAxis.trim()) return;
		const result = parseTable(tableText);
		if ('error' in result) return;
		const first = result.headers[0];
		if (first && this.xAxisInput) {
			this.xAxisInput.value = first;
			this.state.xAxis = first;
		}
	}

	private renderButtons(container: HTMLElement): void {
		const row = container.createDiv({ cls: 'fc-modal-buttons' });

		const insertBtn = row.createEl('button', { cls: ['fc-modal-insert', 'mod-cta'], text: 'Insert' });
		insertBtn.addEventListener('click', () => {
			this.onConfirm(serializeBlock(this.state));
			this.close();
		});

		const cancelBtn = row.createEl('button', { cls: 'fc-modal-cancel', text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());
	}

	private renderField(container: HTMLElement, label: string, render: (el: HTMLElement) => void): void {
		const wrap = container.createDiv({ cls: 'fc-modal-field' });
		wrap.createEl('label', { cls: 'fc-modal-label', text: label });
		render(wrap);
	}

	onClose(): void {
		this.contentEl.empty();
		this.xAxisInput = null;
		this.previewContainer = null;
	}
}
