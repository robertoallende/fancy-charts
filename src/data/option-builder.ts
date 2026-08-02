import type { SimpleConfig, TableData } from '../model/chart';

export function buildOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const { type } = config;
	if (type === 'pie')     return buildPieOption(config, table);
	if (type === 'scatter') return buildScatterOption(config, table);
	if (type === 'area')    return buildAreaOption(config, table);
	if (type === 'funnel')  return buildFunnelOption(config, table);
	if (type === 'heatmap') return buildHeatmapOption(config, table);
	if (type === 'sankey')  return buildSankeyOption(config, table);
	return buildCartesianOption(config, table);
}

function buildCartesianOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const xAxisCol = config.xAxis ?? table.headers[0];
	const seriesCols = config.yAxis ?? table.headers.filter(h => h !== xAxisCol);

	const option: Record<string, unknown> = {
		tooltip: { trigger: 'axis' },
		legend: { data: seriesCols, bottom: 10 },
		grid: { bottom: 60 },
		dataset: {
			source: [
				table.headers,
				...table.rows,
			],
		},
		xAxis: { type: 'category' },
		yAxis: { type: 'value' },
		series: seriesCols.map(col => ({
			type: config.type,
			name: col,
			encode: { x: xAxisCol, y: col },
		})),
	};

	if (config.title) option.title = { text: config.title };
	return option;
}

function buildPieOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const xAxisCol = config.xAxis ?? table.headers[0];
	const valueCol = (config.yAxis?.[0]) ?? table.headers.find(h => h !== xAxisCol) ?? table.headers[1];

	const option: Record<string, unknown> = {
		tooltip: { trigger: 'item' },
		legend: { bottom: 10 },
		dataset: {
			source: [
				[xAxisCol, valueCol],
				...table.rows.map(row => {
					const xi = table.headers.indexOf(xAxisCol);
					const yi = table.headers.indexOf(valueCol);
					return [row[xi], row[yi]];
				}),
			],
		},
		series: [{
			type: 'pie',
			encode: { itemName: xAxisCol, value: valueCol },
			label: { show: false },
		}],
	};

	if (config.title) option.title = { text: config.title };
	return option;
}

function buildAreaOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const xAxisCol = config.xAxis ?? table.headers[0];
	const seriesCols = config.yAxis ?? table.headers.filter(h => h !== xAxisCol);

	const option: Record<string, unknown> = {
		tooltip: { trigger: 'axis' },
		legend: { data: seriesCols, bottom: 10 },
		grid: { bottom: 60 },
		dataset: {
			source: [
				table.headers,
				...table.rows,
			],
		},
		xAxis: { type: 'category', boundaryGap: false },
		yAxis: { type: 'value' },
		series: seriesCols.map(col => ({
			type: 'line',
			name: col,
			stack: 'Total',
			areaStyle: {},
			emphasis: { focus: 'series' },
			encode: { x: xAxisCol, y: col },
		})),
	};

	if (config.title) option.title = { text: config.title };
	return option;
}

function buildScatterOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const xAxisCol = config.xAxis ?? table.headers[0];
	const yCol = (config.yAxis?.[0]) ?? table.headers.find(h => h !== xAxisCol) ?? table.headers[1];

	const option: Record<string, unknown> = {
		tooltip: { trigger: 'item' },
		xAxis: { type: 'value' },
		yAxis: { type: 'value' },
		dataset: {
			source: [
				[xAxisCol, yCol],
				...table.rows.map(row => {
					const xi = table.headers.indexOf(xAxisCol);
					const yi = table.headers.indexOf(yCol);
					return [row[xi], row[yi]];
				}),
			],
		},
		series: [{
			type: 'scatter',
			encode: { x: xAxisCol, y: yCol },
		}],
	};

	if (config.title) option.title = { text: config.title };
	return option;
}

function buildFunnelOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const nameCol  = config.xAxis ?? table.headers[0];
	const valueCol = config.yAxis?.[0] ?? table.headers.find(h => h !== nameCol) ?? table.headers[1];
	const ni = table.headers.indexOf(nameCol);
	const vi = table.headers.indexOf(valueCol);

	const option: Record<string, unknown> = {
		tooltip: { trigger: 'item' },
		legend: { bottom: 10 },
		series: [{
			type: 'funnel',
			data: table.rows.map(r => ({ name: r[ni], value: Number(r[vi]) })),
		}],
	};

	if (config.title) option.title = { text: config.title };
	return option;
}

function buildHeatmapOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const xCol = config.xAxis ?? table.headers[0];
	const xi   = table.headers.indexOf(xCol);
	const yCol = table.headers.find((_, i) => i !== xi) ?? table.headers[1];
	const yi   = table.headers.indexOf(yCol);
	const vCol = table.headers.find((_, i) => i !== xi && i !== yi) ?? table.headers[2];
	const vi   = table.headers.indexOf(vCol);

	const xValues = [...new Set(table.rows.map(r => r[xi]))];
	const yValues = [...new Set(table.rows.map(r => r[yi]))];
	const data    = table.rows.map(r => [r[xi], r[yi], Number(r[vi])]);
	const nums    = table.rows.map(r => Number(r[vi])).filter(v => !isNaN(v));
	const min     = nums.length ? Math.min(...nums) : 0;
	const max     = nums.length ? Math.max(...nums) : 1;

	const option: Record<string, unknown> = {
		tooltip: { trigger: 'item' },
		grid: { bottom: 80 },
		xAxis: { type: 'category', data: xValues },
		yAxis: { type: 'category', data: yValues },
		visualMap: { min, max, calculable: true, orient: 'horizontal', bottom: 10 },
		series: [{
			type: 'heatmap',
			data,
			emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
		}],
	};

	if (config.title) option.title = { text: config.title };
	return option;
}

function buildSankeyOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const nodeNames = [...new Set(table.rows.flatMap(r => [r[0], r[1]]))];
	const nodes     = nodeNames.map(name => ({ name }));
	const links     = table.rows.map(r => ({ source: r[0], target: r[1], value: Number(r[2]) }));

	const option: Record<string, unknown> = {
		tooltip: { trigger: 'item' },
		series: [{
			type: 'sankey',
			nodes,
			links,
			emphasis: { focus: 'adjacency' },
		}],
	};

	if (config.title) option.title = { text: config.title };
	return option;
}
