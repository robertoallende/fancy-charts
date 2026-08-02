import { beforeEach, vi } from 'vitest';
import { FancyChartsRenderChild } from '../../src/integration/postprocessor';

const mockRenderer = vi.hoisted(() => ({
	render:  vi.fn(),
	resize:  vi.fn(),
	dispose: vi.fn(),
}));

const mockThemeVars = vi.hoisted(() => ({
	backgroundPrimary: '#ffffff',
	textNormal: '#262626',
	textMuted: '#888888',
	colorAccent: '#7c3aed',
	fontInterface: 'sans-serif',
	fontUiSmall: '12px',
}));

vi.mock('../../src/data/parser',       () => ({ parse: vi.fn() }));
vi.mock('../../src/render/renderer',   () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ChartRenderer: vi.fn(function(this: any) { Object.assign(this, mockRenderer); }),
}));
vi.mock('../../src/render/echarts-init', () => ({
	echarts: { registerTheme: vi.fn() },
}));
vi.mock('../../src/theme/theme-vars',   () => ({
	isDarkMode:    vi.fn(() => false),
	readThemeVars: vi.fn(() => mockThemeVars),
}));
vi.mock('../../src/theme/theme-builder', () => ({
	buildEChartsTheme: vi.fn(() => ({ backgroundColor: '#ffffff' })),
}));

import { parse }                       from '../../src/data/parser';
import { ChartRenderer }               from '../../src/render/renderer';
import { echarts }                     from '../../src/render/echarts-init';
import { isDarkMode }                  from '../../src/theme/theme-vars';
import { buildEChartsTheme }           from '../../src/theme/theme-builder';

const mockParse         = parse           as ReturnType<typeof vi.fn>;
const MockChartRenderer = ChartRenderer   as ReturnType<typeof vi.fn>;
const mockRegisterTheme = (echarts.registerTheme) as ReturnType<typeof vi.fn>;
const mockIsDarkMode    = isDarkMode      as ReturnType<typeof vi.fn>;
const mockBuildTheme    = buildEChartsTheme as ReturnType<typeof vi.fn>;

beforeEach(() => { vi.clearAllMocks(); });

function makeChild(source = 'type: bar') {
	const container = document.createElement('div');
	return { child: new FancyChartsRenderChild(container, source), container };
}

describe('FancyChartsRenderChild — successful parse', () => {
	const option = { series: [{ type: 'bar' }] };
	beforeEach(() => {
		mockParse.mockReturnValue({ ok: true, mode: 'simple', option });
	});

	it('constructs ChartRenderer with a .fancy-charts-block div and theme name on onload', () => {
		const { child, container } = makeChild();
		child.onload();
		const chartEl = container.querySelector('.fancy-charts-block');
		expect(chartEl).not.toBeNull();
		expect(MockChartRenderer).toHaveBeenCalledWith(chartEl, 'fancy-charts-light');
	});

	it('calls renderer.render() with the parsed option', () => {
		const { child } = makeChild();
		child.onload();
		expect(mockRenderer.render).toHaveBeenCalledWith(option);
	});

	it('does not render an error panel', () => {
		const { child, container } = makeChild();
		child.onload();
		expect(container.querySelector('.fc-error')).toBeNull();
	});

	it('calls renderer.dispose() on onunload', () => {
		const { child } = makeChild();
		child.onload();
		child.onunload();
		expect(mockRenderer.dispose).toHaveBeenCalled();
	});
});

describe('FancyChartsRenderChild — default height', () => {
	const option = { series: [{ type: 'bar' }] };
	beforeEach(() => {
		mockParse.mockReturnValue({ ok: true, mode: 'simple', option });
	});

	it('applies defaultHeight as inline style on the chart div', () => {
		const container = document.createElement('div');
		const child = new FancyChartsRenderChild(container, 'type: bar', 450);
		child.onload();
		const chartEl = container.querySelector('.fancy-charts-block') as HTMLElement;
		expect(chartEl.style.height).toBe('450px');
	});

	it('uses 300px when no defaultHeight is provided', () => {
		const container = document.createElement('div');
		const child = new FancyChartsRenderChild(container, 'type: bar');
		child.onload();
		const chartEl = container.querySelector('.fancy-charts-block') as HTMLElement;
		expect(chartEl.style.height).toBe('300px');
	});
});

describe('FancyChartsRenderChild — theme wiring', () => {
	const option = { series: [{ type: 'bar' }] };
	beforeEach(() => {
		mockParse.mockReturnValue({ ok: true, mode: 'simple', option });
	});

	it('calls registerTheme with fancy-charts-light in light mode', () => {
		mockIsDarkMode.mockReturnValue(false);
		const { child } = makeChild();
		child.onload();
		expect(mockRegisterTheme).toHaveBeenCalledWith('fancy-charts-light', expect.any(Object));
	});

	it('calls registerTheme with fancy-charts-dark in dark mode', () => {
		mockIsDarkMode.mockReturnValue(true);
		const { child } = makeChild();
		child.onload();
		expect(mockRegisterTheme).toHaveBeenCalledWith('fancy-charts-dark', expect.any(Object));
		expect(MockChartRenderer).toHaveBeenCalledWith(expect.any(HTMLElement), 'fancy-charts-dark');
	});

	it('passes the built theme object to registerTheme', () => {
		const builtTheme = { backgroundColor: '#1e1e1e' };
		mockBuildTheme.mockReturnValue(builtTheme);
		const { child } = makeChild();
		child.onload();
		expect(mockRegisterTheme).toHaveBeenCalledWith(expect.any(String), builtTheme);
	});

	it('disposes and re-inits chart when MutationObserver fires', () => {
		const MockMO = global.MutationObserver as unknown as ReturnType<typeof vi.fn>;
		vi.spyOn(global, 'MutationObserver').mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			vi.fn(function(this: any, cb: MutationCallback) {
				this.observe = vi.fn();
				this.disconnect = vi.fn();
				this._cb = cb;
			}) as unknown as typeof MutationObserver
		);

		const { child } = makeChild();
		child.onload();

		const firstCallCount = MockChartRenderer.mock.calls.length;
		expect(mockRenderer.dispose).not.toHaveBeenCalled();

		// Simulate a theme mutation
		const moInstance = (MutationObserver as unknown as ReturnType<typeof vi.fn>).mock.instances[0] as unknown as { _cb: MutationCallback };
		moInstance._cb([], {} as MutationObserver);

		expect(mockRenderer.dispose).toHaveBeenCalled();
		expect(MockChartRenderer.mock.calls.length).toBeGreaterThan(firstCallCount);

		vi.restoreAllMocks();
	});

	it('disconnects MutationObserver on onunload', () => {
		vi.spyOn(global, 'MutationObserver').mockImplementation(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			vi.fn(function(this: any) {
				this.observe = vi.fn();
				this.disconnect = vi.fn();
			}) as unknown as typeof MutationObserver
		);

		const { child } = makeChild();
		child.onload();
		const moInstance = (MutationObserver as unknown as ReturnType<typeof vi.fn>).mock.instances[0];
		child.onunload();
		expect(moInstance.disconnect).toHaveBeenCalled();

		vi.restoreAllMocks();
	});
});

describe('FancyChartsRenderChild — resize wiring', () => {
	const option = { series: [{ type: 'bar' }] };
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const MockRO = global.ResizeObserver as unknown as { mock: { instances: any[]; calls: any[] } };

	beforeEach(() => {
		mockParse.mockReturnValue({ ok: true, mode: 'simple', option });
	});

	it('constructs a ResizeObserver and observes the chart div on onload', () => {
		const { child, container } = makeChild();
		child.onload();
		const chartEl = container.querySelector('.fancy-charts-block');
		expect(MockRO.mock.instances[0].observe).toHaveBeenCalledWith(chartEl);
	});

	it('calls renderer.resize() when ResizeObserver callback fires', () => {
		const { child } = makeChild();
		child.onload();
		const callback = MockRO.mock.calls[0][0] as ResizeObserverCallback;
		callback([], {} as ResizeObserver);
		expect(mockRenderer.resize).toHaveBeenCalled();
	});

	it('calls observer.disconnect() before renderer.dispose() on onunload', () => {
		const { child } = makeChild();
		child.onload();
		const instance = MockRO.mock.instances[0];
		child.onunload();
		expect(instance.disconnect).toHaveBeenCalled();
		expect(mockRenderer.dispose).toHaveBeenCalled();
	});

	it('does not construct ResizeObserver when parse fails', () => {
		mockParse.mockReturnValue({ ok: false, error: 'bad input' });
		const { child } = makeChild();
		const before = MockRO.mock.instances.length;
		child.onload();
		expect(MockRO.mock.instances.length).toBe(before);
	});

	it('does not throw on onunload when no observer was created', () => {
		mockParse.mockReturnValue({ ok: false, error: 'bad' });
		const { child } = makeChild();
		child.onload();
		expect(() => child.onunload()).not.toThrow();
	});
});

describe('FancyChartsRenderChild — failed parse', () => {
	beforeEach(() => {
		mockParse.mockReturnValue({ ok: false, error: 'Unknown chart type' });
	});

	it('does not construct ChartRenderer', () => {
		const { child } = makeChild();
		child.onload();
		expect(MockChartRenderer).not.toHaveBeenCalled();
	});

	it('renders a .fc-error div in the container', () => {
		const { child, container } = makeChild();
		child.onload();
		expect(container.querySelector('.fc-error')).not.toBeNull();
	});

	it('includes the error message in the error panel', () => {
		const { child, container } = makeChild();
		child.onload();
		expect(container.querySelector('.fc-error')!.textContent).toContain('Unknown chart type');
	});

	it('does not throw on onunload when no renderer was created', () => {
		const { child } = makeChild();
		child.onload();
		expect(() => child.onunload()).not.toThrow();
	});
});
