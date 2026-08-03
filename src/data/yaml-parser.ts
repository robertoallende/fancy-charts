import { parseYamlValue } from './mini-yaml';
import type { ChartMode } from '../model/chart';

const DELIMITER = /^---$/m;

export function splitSource(source: string): { yaml: string; rest: string } | { error: string } {
	// Strip optional leading --- (front-matter style: ---\nYAML\n---\nTABLE)
	const normalized = source.replace(/^---\r?\n/, '');
	const match = normalized.match(DELIMITER);
	if (match && match.index !== undefined) {
		return {
			yaml: normalized.slice(0, match.index).trim(),
			rest: normalized.slice(match.index + 3).trim(),
		};
	}

	// No delimiter — valid only for advanced mode (echarts: key present)
	const parsed = parseYaml(normalized.trim());
	if (!('error' in parsed) && 'echarts' in parsed) {
		return { yaml: normalized.trim(), rest: '' };
	}

	return { error: 'Missing --- delimiter. Add --- between the config and the table, or use an echarts: key for advanced mode.' };
}

export function parseYaml(yamlStr: string): Record<string, unknown> | { error: string } {
	if (!yamlStr.trim()) return { error: 'Empty configuration block.' };
	try {
		const parsed = parseYamlValue(yamlStr);
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return { error: 'Configuration must be a YAML mapping, not a list or scalar.' };
		}
		return parsed as Record<string, unknown>;
	} catch (e) {
		return { error: `Invalid YAML: ${(e as Error).message}` };
	}
}

export function detectMode(config: Record<string, unknown>): ChartMode {
	return 'echarts' in config ? 'advanced' : 'simple';
}
