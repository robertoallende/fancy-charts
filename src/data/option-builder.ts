import type { SimpleConfig, TableData } from '../model/chart';

export function buildOption(config: SimpleConfig, table: TableData): Record<string, unknown> {
	const { type } = config;
	if (type === 'pie') return buildPieOption(config, table);
	if (type === 'scatter') return buildScatterOption(config, table);
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
