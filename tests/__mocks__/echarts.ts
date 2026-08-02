import { vi } from 'vitest';

export const mockChartInstance = {
	setOption: vi.fn(),
	resize:    vi.fn(),
	dispose:   vi.fn(),
};

export const init = vi.fn(() => mockChartInstance);
export const use  = vi.fn();

// Tree-shaken stubs — all aliased to this file
export const BarChart       = {};
export const LineChart      = {};
export const PieChart       = {};
export const ScatterChart   = {};
export const TitleComponent    = {};
export const TooltipComponent  = {};
export const LegendComponent   = {};
export const GridComponent     = {};
export const DatasetComponent  = {};
export const SVGRenderer       = {};
