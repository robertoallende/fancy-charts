import { App, MarkdownRenderChild, Plugin } from 'obsidian';
import { parse } from '../data/parser';
import { ChartRenderer } from '../render/renderer';
import { echarts } from '../render/echarts-init';
import { isDarkMode, readThemeVars } from '../theme/theme-vars';
import { buildEChartsTheme } from '../theme/theme-builder';
import { FancyChartsModal, deserializeBlock } from './modal';

const THEME_LIGHT = 'fancy-charts-light';
const THEME_DARK  = 'fancy-charts-dark';

export class FancyChartsRenderChild extends MarkdownRenderChild {
	private renderer: ChartRenderer | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private themeObserver: MutationObserver | null = null;
	private chartEl: HTMLElement | null = null;

	constructor(
		containerEl: HTMLElement,
		private source: string,
		private defaultHeight = 300,
		private app?: App,
		private onEdit?: (newBlock: string) => void,
	) {
		super(containerEl);
	}

	onload(): void {
		const result = parse(this.source);
		if (!result.ok) {
			this.renderError(result.error);
		} else {
			this.chartEl = this.containerEl.createDiv({ cls: 'fancy-charts-block' });
			this.chartEl.style.height = `${this.defaultHeight}px`;
			this.initChart(result.option);

			this.resizeObserver = new ResizeObserver(() => this.renderer?.resize());
			this.resizeObserver.observe(this.chartEl);

			this.themeObserver = new MutationObserver(() => this.reinitChart(result.option));
			this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
		}

		this.renderEditButton();
	}

	onunload(): void {
		this.themeObserver?.disconnect();
		this.themeObserver = null;
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.renderer?.dispose();
		this.renderer = null;
		this.chartEl = null;
	}

	private initChart(option: Record<string, unknown>): void {
		const themeName = isDarkMode() ? THEME_DARK : THEME_LIGHT;
		echarts.registerTheme(themeName, buildEChartsTheme(readThemeVars()));
		this.renderer = new ChartRenderer(this.chartEl!, themeName);
		this.renderer.render(option);
	}

	private reinitChart(option: Record<string, unknown>): void {
		this.renderer?.dispose();
		this.renderer = null;
		this.initChart(option);
	}

	private renderEditButton(): void {
		if (!this.app || !this.onEdit) return;
		const btn = this.containerEl.createEl('button', {
			cls: 'fc-edit-btn',
			attr: { 'aria-label': 'Edit chart' },
		});
		btn.textContent = 'Edit';
		btn.addEventListener('click', () => {
			const state = deserializeBlock(this.source);
			new FancyChartsModal(this.app!, (block) => this.onEdit!(block), state).open();
		});
	}

	private renderError(message: string): void {
		const el = this.containerEl.createDiv({ cls: 'fc-error' });
		el.createEl('strong', { text: 'Fancy Charts: ' });
		el.createSpan({ text: message });
	}
}

export function registerPostprocessor(plugin: Plugin, getHeight: () => number = () => 300): void {
	plugin.registerMarkdownCodeBlockProcessor('fancy-charts', (source, el, ctx) => {
		const onEdit = (newBlock: string) => {
			const ws = (plugin.app as unknown as { workspace: { activeEditor?: { editor?: { replaceRange(s: string, f: unknown, t: unknown): void } } } }).workspace;
			const editor = ws.activeEditor?.editor;
			if (!editor) return;
			const info = ctx.getSectionInfo(el);
			if (!info) return;
			editor.replaceRange(
				newBlock + '\n',
				{ line: info.lineStart, ch: 0 },
				{ line: info.lineEnd + 1, ch: 0 },
			);
		};
		ctx.addChild(new FancyChartsRenderChild(el, source, getHeight(), plugin.app, onEdit));
	});
}
