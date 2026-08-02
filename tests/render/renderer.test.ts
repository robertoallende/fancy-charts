import { beforeEach, vi } from 'vitest';
import { ChartRenderer } from '../../src/render/renderer';
import { init, mockChartInstance } from '../__mocks__/echarts';

beforeEach(() => {
	vi.clearAllMocks();
});

describe('ChartRenderer', () => {
	it('calls echarts.init with the container and svg renderer', () => {
		const container = document.createElement('div');
		new ChartRenderer(container);
		expect(init).toHaveBeenCalledWith(container, null, { renderer: 'svg' });
	});

	it('render() calls setOption with the provided option', () => {
		const container = document.createElement('div');
		const renderer = new ChartRenderer(container);
		const option = { series: [{ type: 'bar' }] };
		renderer.render(option);
		expect(mockChartInstance.setOption).toHaveBeenCalledWith(option);
	});

	it('resize() calls chart.resize()', () => {
		const container = document.createElement('div');
		const renderer = new ChartRenderer(container);
		renderer.resize();
		expect(mockChartInstance.resize).toHaveBeenCalled();
	});

	it('dispose() calls chart.dispose()', () => {
		const container = document.createElement('div');
		const renderer = new ChartRenderer(container);
		renderer.dispose();
		expect(mockChartInstance.dispose).toHaveBeenCalled();
	});
});
