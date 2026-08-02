import { beforeEach, vi } from 'vitest';
import { FancyChartsRenderChild } from '../../src/integration/postprocessor';

const mockRenderer = vi.hoisted(() => ({
	render:  vi.fn(),
	resize:  vi.fn(),
	dispose: vi.fn(),
}));

vi.mock('../../src/data/parser', () => ({ parse: vi.fn() }));
vi.mock('../../src/render/renderer', () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ChartRenderer: vi.fn(function(this: any) { Object.assign(this, mockRenderer); }),
}));

import { parse } from '../../src/data/parser';
import { ChartRenderer } from '../../src/render/renderer';

const mockParse = parse as ReturnType<typeof vi.fn>;
const MockChartRenderer = ChartRenderer as ReturnType<typeof vi.fn>;

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

	it('constructs ChartRenderer with the container element on onload', () => {
		const { child, container } = makeChild();
		child.onload();
		expect(MockChartRenderer).toHaveBeenCalledWith(container);
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
