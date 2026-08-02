import { echarts } from './echarts-init';

export class ChartRenderer {
	private chart: ReturnType<typeof echarts.init>;

	constructor(container: HTMLElement) {
		this.chart = echarts.init(container, null, { renderer: 'svg' });
	}

	render(option: Record<string, unknown>): void {
		this.chart.setOption(option);
	}

	resize(): void {
		this.chart.resize();
	}

	dispose(): void {
		this.chart.dispose();
	}
}
