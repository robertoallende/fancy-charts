import { MarkdownRenderChild, Plugin } from 'obsidian';
import { parse } from '../data/parser';
import { ChartRenderer } from '../render/renderer';
import { echarts } from '../render/echarts-init';
import { isDarkMode, readThemeVars } from '../theme/theme-vars';
import { buildEChartsTheme } from '../theme/theme-builder';

const THEME_LIGHT = 'fancy-charts-light';
const THEME_DARK  = 'fancy-charts-dark';

export class FancyChartsRenderChild extends MarkdownRenderChild {
	private renderer: ChartRenderer | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private themeObserver: MutationObserver | null = null;
	private chartEl: HTMLElement | null = null;

	constructor(containerEl: HTMLElement, private source: string) {
		super(containerEl);
	}

	onload(): void {
		const result = parse(this.source);
		if (!result.ok) {
			this.renderError(result.error);
			return;
		}

		this.chartEl = this.containerEl.createDiv({ cls: 'fancy-charts-block' });
		this.initChart(result.option);

		this.resizeObserver = new ResizeObserver(() => this.renderer?.resize());
		this.resizeObserver.observe(this.chartEl);

		this.themeObserver = new MutationObserver(() => this.reinitChart(result.option));
		this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
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

	private renderError(message: string): void {
		const el = this.containerEl.createDiv({ cls: 'fc-error' });
		el.createEl('strong', { text: 'Fancy Charts: ' });
		el.createSpan({ text: message });
	}
}

export function registerPostprocessor(plugin: Plugin): void {
	plugin.registerMarkdownCodeBlockProcessor('fancy-charts', (source, el, ctx) => {
		ctx.addChild(new FancyChartsRenderChild(el, source));
	});
}
