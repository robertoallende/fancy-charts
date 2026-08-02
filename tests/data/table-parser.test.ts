import { parseTable } from '../../src/data/table-parser';

describe('parseTable', () => {
	it('parses a basic two-column table', () => {
		const input = `| quarter | sales |
| --- | --- |
| Q1 | 120 |
| Q2 | 200 |`;
		const result = parseTable(input);
		expect(result).not.toBeNull();
		expect(result!.headers).toEqual(['quarter', 'sales']);
		expect(result!.rows).toEqual([['Q1', '120'], ['Q2', '200']]);
	});

	it('parses a single-column table', () => {
		const input = `| name |
| --- |
| Alice |`;
		const result = parseTable(input);
		expect(result!.headers).toEqual(['name']);
		expect(result!.rows).toEqual([['Alice']]);
	});

	it('parses a table with multiple columns and rows', () => {
		const input = `| a | b | c |
| --- | --- | --- |
| 1 | 2 | 3 |
| 4 | 5 | 6 |
| 7 | 8 | 9 |`;
		const result = parseTable(input);
		expect(result!.headers).toEqual(['a', 'b', 'c']);
		expect(result!.rows).toHaveLength(3);
	});

	it('trims whitespace around cell values', () => {
		const input = `|  month  |  value  |
| ------- | ------- |
|  Jan    |   10    |`;
		const result = parseTable(input);
		expect(result!.headers).toEqual(['month', 'value']);
		expect(result!.rows[0]).toEqual(['Jan', '10']);
	});

	it('unescapes \\| to | within cell values', () => {
		const input = `| label | notes |
| --- | --- |
| A\\|B | foo |`;
		const result = parseTable(input);
		expect(result!.rows[0][0]).toBe('A|B');
	});

	it('returns null for empty string', () => {
		expect(parseTable('')).toBeNull();
	});

	it('returns null when separator row is missing', () => {
		const input = `| a | b |
| 1 | 2 |`;
		expect(parseTable(input)).toBeNull();
	});

	it('returns null for header row only with no data rows', () => {
		const input = `| a | b |
| --- | --- |`;
		expect(parseTable(input)).toBeNull();
	});

	it('numeric-looking values remain as strings', () => {
		const input = `| x | y |
| --- | --- |
| 1 | 2.5 |`;
		const result = parseTable(input);
		expect(typeof result!.rows[0][0]).toBe('string');
		expect(result!.rows[0][0]).toBe('1');
	});
});
