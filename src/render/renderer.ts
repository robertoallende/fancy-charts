import { echarts } from './echarts-init';

export class ChartRenderer {
	private chart: ReturnType<typeof echarts.init>;

	constructor(container: HTMLElement, themeName: string = '') {
		this.chart = echarts.init(container, themeName || null, { renderer: 'svg' });
	}

	render(option: Record<string, unknown>): void {
		this.chart.setOption(option, { notMerge: true });
	}

	resize(): void {
		this.chart.resize();
	}

	dispose(): void {
		this.chart.dispose();
	}
}
