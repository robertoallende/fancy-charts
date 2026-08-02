import { App, Modal } from 'obsidian';
import { parseTable } from '../data/table-parser';
import { parse } from '../data/parser';
import { splitSource, parseYaml } from '../data/yaml-parser';
import { ChartRenderer } from '../render/renderer';
import { echarts } from '../render/echarts-init';
import { isDarkMode, readThemeVars } from '../theme/theme-vars';
import { buildEChartsTheme } from '../theme/theme-builder';
import { TableEditor } from './table-editor';

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
const THEME_LIGHT = 'fancy-charts-light';
const THEME_DARK  = 'fancy-charts-dark';
const DEBOUNCE_MS = 300;

export function serializeBlock(state: ModalState): string {
	const yaml: string[] = [`type: ${state.type}`];
	if (state.title.trim()) yaml.push(`title: ${state.title.trim()}`);
	if (state.xAxis.trim()) yaml.push(`xAxis: ${state.xAxis.trim()}`);

	const inner = ['---', ...yaml, '---', state.tableText.trim()].join('\n');
	return `\`\`\`fancy-charts\n${inner}\n\`\`\``;
}

const VALID_TYPES: ReadonlyArray<ModalState['type']> = ['bar', 'line', 'pie', 'scatter'];

export function deserializeBlock(raw: string): ModalState {
	const split = splitSource(raw);
	if ('error' in split) return { ...DEFAULT_STATE };

	const config = parseYaml(split.yaml);
	if ('error' in config) return { ...DEFAULT_STATE };

	const rawType = config['type'];
	const type: ModalState['type'] = VALID_TYPES.includes(rawType as ModalState['type'])
		? (rawType as ModalState['type'])
		: DEFAULT_STATE.type;

	const title = typeof config['title'] === 'string' ? config['title'] : '';
	const xAxis = typeof config['xAxis'] === 'string' ? config['xAxis'] : '';
	const tableText = split.rest.trim() || DEFAULT_STATE.tableText;

	return { type, title, xAxis, tableText };
}

export class FancyChartsModal extends Modal {
	private state: ModalState;
	private xAxisInput: HTMLInputElement | null = null;
	private previewChartEl: HTMLElement | null = null;
	private previewErrorEl: HTMLElement | null = null;
	private renderer: ChartRenderer | null = null;
	private tableEditor: TableEditor | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(app: App, private onConfirm: (block: string) => void, initialState?: ModalState) {
		super(app);
		this.state = initialState ? { ...initialState } : { ...DEFAULT_STATE };
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.titleEl.textContent = 'Insert chart';
		contentEl.classList.add('fc-modal');

		const layout = contentEl.createDiv({ cls: 'fc-modal-layout' });
		const formEl = layout.createDiv({ cls: 'fc-modal-form' });
		const previewEl = layout.createDiv({ cls: 'fc-modal-preview' });

		this.renderForm(formEl);
		this.renderPreviewArea(previewEl);
		this.renderButtons(contentEl);

		this.schedulePreviewUpdate();
	}

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
				this.schedulePreviewUpdate();
			});
		});

		this.renderField(container, 'Title', el => {
			const inp = el.createEl('input', { cls: 'fc-modal-input', type: 'text' });
			inp.placeholder = 'Optional chart title';
			inp.value = this.state.title;
			inp.addEventListener('input', () => {
				this.state.title = inp.value;
				this.schedulePreviewUpdate();
			});
		});

		this.renderField(container, 'X axis column', el => {
			this.xAxisInput = el.createEl('input', { cls: 'fc-modal-input', type: 'text' });
			this.xAxisInput.placeholder = 'Auto-detected from table';
			this.xAxisInput.value = this.state.xAxis;
			this.xAxisInput.addEventListener('input', () => {
				this.state.xAxis = this.xAxisInput!.value;
				this.schedulePreviewUpdate();
			});
		});

		this.renderField(container, 'Data table', el => {
			this.tableEditor = new TableEditor(el, this.state.tableText, (markdown) => {
				this.state.tableText = markdown;
				this.autoDetectXAxis(markdown);
				this.schedulePreviewUpdate();
			});
		});
	}

	private renderPreviewArea(container: HTMLElement): void {
		container.createEl('p', { cls: 'fc-modal-preview-label', text: 'Preview' });
		this.previewChartEl = container.createDiv({ cls: 'fc-modal-preview-chart' });
		this.previewErrorEl = container.createDiv({ cls: 'fc-modal-preview-error' });
		this.previewErrorEl.style.display = 'none';
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

	private schedulePreviewUpdate(): void {
		if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			this.updatePreview();
		}, DEBOUNCE_MS);
	}

	private updatePreview(): void {
		if (!this.previewChartEl || !this.previewErrorEl) return;

		const source = serializeBlock(this.state)
			.replace(/^```fancy-charts\n/, '')
			.replace(/\n```$/, '');
		const result = parse(source);

		if (!result.ok) {
			this.showPreviewError(result.error);
			return;
		}

		this.hidePreviewError();
		if (!this.renderer) {
			const themeName = isDarkMode() ? THEME_DARK : THEME_LIGHT;
			echarts.registerTheme(themeName, buildEChartsTheme(readThemeVars()));
			this.renderer = new ChartRenderer(this.previewChartEl, themeName);
		}
		this.renderer.render(result.option);
	}

	private showPreviewError(message: string): void {
		if (!this.previewErrorEl || !this.previewChartEl) return;
		this.previewChartEl.style.display = 'none';
		this.previewErrorEl.style.display = '';
		this.previewErrorEl.textContent = message;
	}

	private hidePreviewError(): void {
		if (!this.previewErrorEl || !this.previewChartEl) return;
		this.previewErrorEl.style.display = 'none';
		this.previewChartEl.style.display = '';
	}

	private autoDetectXAxis(tableText: string): void {
		if (this.state.xAxis.trim()) return;
		const result = parseTable(tableText);
		if (!result) return;
		const first = result.headers[0];
		if (first && this.xAxisInput) {
			this.xAxisInput.value = first;
			this.state.xAxis = first;
		}
	}

	private renderField(container: HTMLElement, label: string, render: (el: HTMLElement) => void): void {
		const wrap = container.createDiv({ cls: 'fc-modal-field' });
		wrap.createEl('label', { cls: 'fc-modal-label', text: label });
		render(wrap);
	}

	onClose(): void {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		this.renderer?.dispose();
		this.renderer = null;
		this.tableEditor?.destroy();
		this.tableEditor = null;
		this.contentEl.empty();
		this.xAxisInput = null;
		this.previewChartEl = null;
		this.previewErrorEl = null;
	}
}
