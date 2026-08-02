import type { AdvancedConfig } from '../model/chart';

export function buildAdvancedOption(
	config: AdvancedConfig,
): Record<string, unknown> | { error: string } {
	const raw = config['echarts'];
	if (raw === undefined) return { error: 'Advanced mode requires an echarts: key.' };
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		return { error: 'The echarts: key must be a YAML mapping.' };
	}
	return sanitize(raw as Record<string, unknown>);
}

function sanitize(option: Record<string, unknown>): Record<string, unknown> {
	const result = { ...option };

	if (result['title'] && typeof result['title'] === 'object') {
		const title = { ...(result['title'] as Record<string, unknown>) };
		if (typeof title['link'] === 'string' && title['link'].toLowerCase().startsWith('javascript:')) {
			delete title['link'];
		}
		result['title'] = title;
	}

	if (result['tooltip'] && typeof result['tooltip'] === 'object') {
		const tooltip = { ...(result['tooltip'] as Record<string, unknown>) };
		if (typeof tooltip['formatter'] === 'string') {
			delete tooltip['formatter'];
		}
		result['tooltip'] = tooltip;
	}

	return result;
}
