import { MarkdownRenderChild, Plugin } from 'obsidian';
import { parse } from '../data/parser';
import { ChartRenderer } from '../render/renderer';

export class FancyChartsRenderChild extends MarkdownRenderChild {
	private renderer: ChartRenderer | null = null;
	private observer: ResizeObserver | null = null;
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
		this.renderer = new ChartRenderer(this.chartEl);
		this.renderer.render(result.option);

		this.observer = new ResizeObserver(() => this.renderer?.resize());
		this.observer.observe(this.chartEl);
	}

	onunload(): void {
		this.observer?.disconnect();
		this.observer = null;
		this.renderer?.dispose();
		this.renderer = null;
		this.chartEl = null;
	}

	private renderError(message: string): void {
		const el = this.containerEl.createDiv({ cls: 'fc-error' });
		el.createEl('strong', { text: 'Fancy Charts: ' });
		el.createSpan({ text: message });
	}
}

export function registerPostprocessor(plugin: Plugin): void {
	plugin.registerMarkdownCodeBlockProcessor('fancy-charts', (source, el, ctx) => {
		const child = new FancyChartsRenderChild(el, source);
		ctx.addChild(child);
	});
}
