import type { TableData } from '../model/chart';

const SEPARATOR_RE = /^\s*-+\s*$/;

function splitRow(line: string): string[] {
	return line
		.replace(/^\||\|$/g, '')
		.split(/(?<!\\)\|/)
		.map(cell => cell.trim().replace(/\\\|/g, '|'));
}

export function parseTable(text: string): TableData | null {
	if (!text.trim()) return null;

	const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
	if (lines.length < 3) return null;

	const separatorIndex = lines.findIndex(l =>
		l.replace(/^\||\|$/g, '').split('|').every(cell => SEPARATOR_RE.test(cell))
	);
	if (separatorIndex === -1) return null;

	const headers = splitRow(lines[separatorIndex - 1] ?? '');
	if (headers.length === 0) return null;

	const dataLines = lines.slice(separatorIndex + 1);
	if (dataLines.length === 0) return null;

	const rows = dataLines.map(splitRow);
	return { headers, rows };
}
