import { MarkdownRenderChild, Plugin } from 'obsidian';
import { parse } from '../data/parser';
import { ChartRenderer } from '../render/renderer';

export class FancyChartsRenderChild extends MarkdownRenderChild {
	private renderer: ChartRenderer | null = null;

	constructor(containerEl: HTMLElement, private source: string) {
		super(containerEl);
	}

	onload(): void {
		const result = parse(this.source);
		if (!result.ok) {
			this.renderError(result.error);
			return;
		}
		this.renderer = new ChartRenderer(this.containerEl);
		this.renderer.render(result.option);
	}

	onunload(): void {
		this.renderer?.dispose();
		this.renderer = null;
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
