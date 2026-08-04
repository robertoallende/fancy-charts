import { beforeEach, vi } from 'vitest';
import { ChartRenderer } from '../../src/render/renderer';
import { init, mockChartInstance } from '../__mocks__/echarts';

beforeEach(() => {
	vi.clearAllMocks();
});

describe('ChartRenderer', () => {
	it('calls echarts.init with the container, null theme, and svg renderer when no theme given', () => {
		const container = document.createElement('div');
		new ChartRenderer(container);
		expect(init).toHaveBeenCalledWith(container, null, { renderer: 'svg' });
	});

	it('passes the theme name to echarts.init when provided', () => {
		const container = document.createElement('div');
		new ChartRenderer(container, 'fancy-charts-dark');
		expect(init).toHaveBeenCalledWith(container, 'fancy-charts-dark', { renderer: 'svg' });
	});

	it('render() calls setOption with notMerge: true to prevent stale series overlap', () => {
		const container = document.createElement('div');
		const renderer = new ChartRenderer(container);
		const option = { series: [{ type: 'bar' }] };
		renderer.render(option);
		expect(mockChartInstance.setOption).toHaveBeenCalledWith(option, { notMerge: true });
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
