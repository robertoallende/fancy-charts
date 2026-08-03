import type { ParseResult, SimpleConfig } from '../model/chart';
import { SUPPORTED_VERSION } from '../model/chart';
import { splitSource, parseYaml, detectMode } from './yaml-parser';
import { parseTable } from './table-parser';
import { buildOption } from './option-builder';
import { buildAdvancedOption } from './sanitizer';

const VALID_TYPES = ['bar', 'line', 'pie', 'scatter', 'area', 'funnel', 'heatmap', 'sankey'] as const;
const VALID_TYPES_STR = VALID_TYPES.join(', ');

function validateSimpleConfig(
	raw: Record<string, unknown>,
	headers: string[],
): SimpleConfig | { error: string } {
	const version = typeof raw['version'] === 'number' ? raw['version'] : 1;
	if (version > SUPPORTED_VERSION) {
		return { error: `This chart was created with version ${version} of the Fancy Charts format. Update the plugin to view it.` };
	}

	const type = raw['type'];
	if (!type) return { error: `Missing required field 'type'. Supported types: ${VALID_TYPES_STR}.` };
	if (!VALID_TYPES.includes(type as SimpleConfig['type'])) {
		return { error: `Unknown chart type '${type}'. Supported types: ${VALID_TYPES_STR}.` };
	}

	const xAxis = raw['xAxis'];
	if (xAxis !== undefined) {
		if (typeof xAxis !== 'string') return { error: "Field 'xAxis' must be a string column name." };
		if (!headers.includes(xAxis)) {
			return { error: `Column '${xAxis}' not found. Available columns: ${headers.join(', ')}.` };
		}
	}

	const yAxis = raw['yAxis'];
	if (yAxis !== undefined) {
		if (!Array.isArray(yAxis)) return { error: "Field 'yAxis' must be a list of column names." };
		for (const col of yAxis as string[]) {
			if (!headers.includes(col)) {
				return { error: `Column '${col}' not found. Available columns: ${headers.join(', ')}.` };
			}
		}
	}

	return {
		version,
		type: type as SimpleConfig['type'],
		...(typeof raw['title'] === 'string' ? { title: raw['title'] } : {}),
		...(typeof xAxis === 'string' ? { xAxis } : {}),
		...(Array.isArray(yAxis) ? { yAxis: yAxis as string[] } : {}),
	};
}

export function parse(source: string): ParseResult {
	const split = splitSource(source);
	if ('error' in split) return { ok: false, error: split.error };

	const config = parseYaml(split.yaml);
	if ('error' in config) return { ok: false, error: config.error as string };

	const mode = detectMode(config);

	if (mode === 'advanced') {
		const option = buildAdvancedOption(config);
		if ('error' in option) return { ok: false, error: option.error as string };
		return { ok: true, mode: 'advanced', option };
	}

	const table = parseTable(split.rest);
	if (!table) return { ok: false, error: 'No valid table found. Add a markdown table below the --- delimiter.' };

	const validConfig = validateSimpleConfig(config, table.headers);
	if ('error' in validConfig) return { ok: false, error: validConfig.error };

	const option = buildOption(validConfig, table);
	return { ok: true, mode: 'simple', option };
}
