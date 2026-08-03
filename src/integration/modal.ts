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
	mode?: 'simple' | 'advanced';
	type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'funnel' | 'heatmap' | 'sankey';
	title: string;
	xAxis: string;
	tableText: string;
	echartsYaml?: string;
}

export const DEFAULT_STATE: ModalState = {
	type: 'bar',
	title: '',
	xAxis: '',
	tableText: '| category | value |\n| --- | --- |\n| A | 10 |\n| B | 20 |',
};

const SCATTER_TABLE = '| x | y |\n| --- | --- |\n| 1 | 5 |\n| 3 | 8 |\n| 5 | 2 |';
const AREA_TABLE    = '| month | series A | series B |\n| --- | --- | --- |\n| Jan | 120 | 220 |\n| Feb | 132 | 182 |\n| Mar | 101 | 191 |';
const FUNNEL_TABLE  = '| stage | value |\n| --- | --- |\n| Awareness | 1000 |\n| Interest | 600 |\n| Consideration | 300 |\n| Purchase | 100 |';
const HEATMAP_TABLE = '| x | y | value |\n| --- | --- | --- |\n| Mon | Morning | 10 |\n| Mon | Afternoon | 25 |\n| Tue | Morning | 15 |\n| Tue | Afternoon | 30 |';
const SANKEY_TABLE  = '| source | target | value |\n| --- | --- | --- |\n| A | X | 10 |\n| A | Y | 5 |\n| B | X | 8 |\n| B | Y | 12 |';

const TYPE_DEFAULTS: Partial<Record<ModalState['type'], string>> = {
	scatter: SCATTER_TABLE,
	area:    AREA_TABLE,
	funnel:  FUNNEL_TABLE,
	heatmap: HEATMAP_TABLE,
	sankey:  SANKEY_TABLE,
};

const DEFAULT_ADVANCED_YAML =
`echarts:
  xAxis:
    type: category
    data: [A, B, C]
  yAxis:
    type: value
  series:
    - type: bar
      data: [10, 20, 30]`;

const CHART_TYPES: ModalState['type'][] = ['bar', 'line', 'pie', 'scatter', 'area', 'funnel', 'heatmap', 'sankey'];
const THEME_LIGHT = 'fancy-charts-light';
const THEME_DARK  = 'fancy-charts-dark';
const DEBOUNCE_MS = 300;

export function serializeBlock(state: ModalState): string {
	const yaml: string[] = ['version: 1', `type: ${state.type}`];
	if (state.title.trim()) yaml.push(`title: ${state.title.trim()}`);
	if (state.xAxis.trim()) yaml.push(`xAxis: ${state.xAxis.trim()}`);

	const inner = ['---', ...yaml, '---', state.tableText.trim()].join('\n');
	return `\`\`\`fancy-charts\n${inner}\n\`\`\``;
}

const VALID_TYPES: ReadonlyArray<ModalState['type']> = ['bar', 'line', 'pie', 'scatter', 'area', 'funnel', 'heatmap', 'sankey'];

export function deserializeBlock(raw: string): ModalState {
	const split = splitSource(raw);
	if ('error' in split) return { ...DEFAULT_STATE };

	const config = parseYaml(split.yaml);
	if ('error' in config) return { ...DEFAULT_STATE };

	if ('echarts' in config) {
		return { ...DEFAULT_STATE, mode: 'advanced', echartsYaml: raw.trim() };
	}

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
	private isAdvancedMode: boolean;
	private isEditMode: boolean;
	private advancedYaml: string;
	private formEl: HTMLElement | null = null;
	private xAxisInput: HTMLInputElement | null = null;
	private previewChartEl: HTMLElement | null = null;
	private previewErrorEl: HTMLElement | null = null;
	private renderer: ChartRenderer | null = null;
	private tableEditor: TableEditor | null = null;
	private debounceTimer: number | null = null;

	constructor(app: App, private onConfirm: (block: string) => void, initialState?: ModalState) {
		super(app);
		this.state = initialState ? { ...initialState } : { ...DEFAULT_STATE };
		this.isAdvancedMode = initialState?.mode === 'advanced';
		this.advancedYaml = initialState?.echartsYaml ?? DEFAULT_ADVANCED_YAML;
		this.isEditMode = initialState !== undefined;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.titleEl.textContent = this.isEditMode ? 'Edit chart' : 'Insert chart';
		contentEl.classList.add('fc-modal');

		const layout = contentEl.createDiv({ cls: 'fc-modal-layout' });
		this.formEl = layout.createDiv({ cls: 'fc-modal-form' });
		const previewEl = layout.createDiv({ cls: 'fc-modal-preview' });

		this.renderForm(this.formEl);
		this.renderPreviewArea(previewEl);
		this.renderButtons(contentEl);

		this.schedulePreviewUpdate();
	}

	private renderForm(container: HTMLElement): void {
		this.renderModeToggle(container);
		if (this.isAdvancedMode) {
			this.renderAdvancedFields(container);
		} else {
			this.renderSimpleFields(container);
		}
	}

	private renderModeToggle(container: HTMLElement): void {
		const wrap = container.createDiv({ cls: 'fc-modal-mode-toggle' });
		const simpleBtn = wrap.createEl('button', { cls: 'fc-modal-mode-btn', text: 'Simple' });
		const advBtn    = wrap.createEl('button', { cls: 'fc-modal-mode-btn', text: 'Advanced' });

		const refresh = () => {
			simpleBtn.classList.toggle('is-active', !this.isAdvancedMode);
			advBtn.classList.toggle('is-active', this.isAdvancedMode);
		};
		refresh();

		simpleBtn.addEventListener('click', () => this.switchMode(false));
		advBtn.addEventListener('click', () => this.switchMode(true));
	}

	private refreshForm(): void {
		this.tableEditor?.destroy();
		this.tableEditor = null;
		this.xAxisInput = null;
		if (this.formEl) {
			this.formEl.innerHTML = '';
			this.renderForm(this.formEl);
		}
	}

	private switchMode(toAdvanced: boolean): void {
		if (this.isAdvancedMode === toAdvanced) return;
		this.isAdvancedMode = toAdvanced;
		this.refreshForm();
		this.schedulePreviewUpdate();
	}

	private renderSimpleFields(container: HTMLElement): void {
		this.renderField(container, 'Chart type', el => {
			const select = el.createEl('select', { cls: 'fc-modal-input' });
			for (const t of CHART_TYPES) {
				const opt = select.createEl('option', { text: t });
				opt.value = t;
				if (t === this.state.type) opt.selected = true;
			}
			select.addEventListener('change', () => {
				const prev = this.state.type;
				this.state.type = select.value as ModalState['type'];

				const prevDefault = TYPE_DEFAULTS[prev] ?? DEFAULT_STATE.tableText;
				const nextDefault = TYPE_DEFAULTS[this.state.type] ?? DEFAULT_STATE.tableText;
				if (prevDefault !== nextDefault && this.state.tableText === prevDefault) {
					this.state.tableText = nextDefault;
					this.refreshForm();
				}

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

	private renderAdvancedFields(container: HTMLElement): void {
		this.renderField(container, 'ECharts option (YAML)', el => {
			const ta = el.createEl('textarea', { cls: 'fc-modal-advanced-textarea' });
			ta.value = this.advancedYaml;
			ta.rows = 14;
			ta.addEventListener('input', () => {
				this.advancedYaml = ta.value;
				this.schedulePreviewUpdate();
			});
		});
	}

	private renderPreviewArea(container: HTMLElement): void {
		container.createEl('p', { cls: 'fc-modal-preview-label', text: 'Preview' });
		this.previewChartEl = container.createDiv({ cls: 'fc-modal-preview-chart' });
		this.previewErrorEl = container.createDiv({ cls: 'fc-modal-preview-error' });
		this.previewErrorEl.classList.add('fc-modal-preview-hidden');
	}

	private currentBlock(): string {
		if (this.isAdvancedMode) {
			return `\`\`\`fancy-charts\n${this.advancedYaml.trim()}\n\`\`\``;
		}
		return serializeBlock(this.state);
	}

	private renderButtons(container: HTMLElement): void {
		const row = container.createDiv({ cls: 'fc-modal-buttons' });

		const insertBtn = row.createEl('button', { cls: ['fc-modal-insert', 'mod-cta'], text: this.isEditMode ? 'Update' : 'Insert' });
		insertBtn.addEventListener('click', () => {
			this.onConfirm(this.currentBlock());
			this.close();
		});

		const cancelBtn = row.createEl('button', { cls: 'fc-modal-cancel', text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());
	}

	private schedulePreviewUpdate(): void {
		if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
		this.debounceTimer = window.setTimeout(() => {
			this.debounceTimer = null;
			this.updatePreview();
		}, DEBOUNCE_MS);
	}

	private updatePreview(): void {
		if (!this.previewChartEl || !this.previewErrorEl) return;

		const source = this.currentBlock()
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
		this.previewChartEl.classList.add('fc-modal-preview-hidden');
		this.previewErrorEl.classList.remove('fc-modal-preview-hidden');
		this.previewErrorEl.textContent = message;
	}

	private hidePreviewError(): void {
		if (!this.previewErrorEl || !this.previewChartEl) return;
		this.previewErrorEl.classList.add('fc-modal-preview-hidden');
		this.previewChartEl.classList.remove('fc-modal-preview-hidden');
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
			window.clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		this.renderer?.dispose();
		this.renderer = null;
		this.tableEditor?.destroy();
		this.tableEditor = null;
		this.contentEl.empty();
		this.xAxisInput = null;
		this.formEl = null;
		this.previewChartEl = null;
		this.previewErrorEl = null;
	}
}
