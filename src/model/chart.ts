export const SUPPORTED_VERSION = 1;

export type ChartMode = 'simple' | 'advanced';

export interface TableData {
	headers: string[];
	rows: string[][];
}

export interface SimpleConfig {
	version: number;
	type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'funnel' | 'heatmap' | 'sankey';
	title?: string;
	xAxis?: string;
	yAxis?: string[];
}

export type AdvancedConfig = Record<string, unknown>;

export type ParseResult =
	| { ok: true; mode: ChartMode; option: Record<string, unknown> }
	| { ok: false; error: string };
