/**
 * Minimal YAML parser — supports the subset used by fancy-charts.
 *
 * Handles: block/flow mappings, block/flow sequences, scalars (string,
 * number, boolean, null), single/double-quoted strings, comments.
 *
 * Not supported: anchors/aliases, merge keys (<<:), explicit tags (!!type),
 * multi-line block scalars (| >), binary tags — no atob/btoa anywhere.
 */

export function parseYamlValue(source: string): unknown {
	const lines = source
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.split('\n')
		.map(stripComment);

	const ctx: Ctx = { lines, pos: 0 };
	skipEmpty(ctx);

	if (ctx.pos >= ctx.lines.length) return null;

	return parseBlockNode(ctx);
}

// ── internal state ───────────────────────────────────────────────────────────

interface Ctx {
	lines: string[];
	pos: number;
}

// ── line helpers ─────────────────────────────────────────────────────────────

function skipEmpty(ctx: Ctx): void {
	while (ctx.pos < ctx.lines.length && ctx.lines[ctx.pos].trim() === '') {
		ctx.pos++;
	}
}

function indentOf(line: string): number {
	let n = 0;
	while (n < line.length && line[n] === ' ') n++;
	return n;
}

function stripComment(line: string): string {
	let inS = false, inD = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (c === "'" && !inD) { inS = !inS; continue; }
		if (c === '"' && !inS) { inD = !inD; continue; }
		if (c === '#' && !inS && !inD) {
			if (i === 0 || line[i - 1] === ' ' || line[i - 1] === '\t') {
				return line.slice(0, i).trimEnd();
			}
		}
	}
	return line;
}

// Find the ': ' (or trailing ':') that separates a block mapping key from its value.
function findMapColon(s: string): number {
	let inS = false, inD = false;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (c === "'" && !inD) { inS = !inS; continue; }
		if (c === '"' && !inS) { inD = !inD; continue; }
		if (c === ':' && !inS && !inD) {
			const nx = s[i + 1];
			if (nx === ' ' || nx === '\t' || nx === undefined) return i;
		}
	}
	return -1;
}

function isSeqLine(content: string): boolean {
	return content === '-' || content.startsWith('- ') || content.startsWith('-\t');
}

// ── block parsing ────────────────────────────────────────────────────────────

function parseBlockNode(ctx: Ctx): unknown {
	skipEmpty(ctx);
	if (ctx.pos >= ctx.lines.length) return null;

	const line    = ctx.lines[ctx.pos];
	const ind     = indentOf(line);
	const content = line.trimStart();

	if (isSeqLine(content))     return parseBlockSeq(ctx, ind);
	if (content.startsWith('[')) { ctx.pos++; return parseFlowSeq(content); }
	if (content.startsWith('{')) { ctx.pos++; return parseFlowMap(content); }

	const ci = findMapColon(content);
	if (ci > 0) return parseBlockMap(ctx, ind);

	ctx.pos++;
	return parseScalarToken(content);
}

function parseBlockMap(ctx: Ctx, mapIndent: number): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (;;) {
		skipEmpty(ctx);
		if (ctx.pos >= ctx.lines.length) break;

		const line    = ctx.lines[ctx.pos];
		const ind     = indentOf(line);
		const content = line.trimStart();

		if (ind !== mapIndent) break;
		if (isSeqLine(content)) break;

		const ci = findMapColon(content);
		if (ci <= 0) break;

		const key    = parseScalarKey(content.slice(0, ci));
		const rest   = content.slice(ci + 1);
		const valStr = rest.startsWith(' ') ? rest.slice(1) : rest.trimStart();

		ctx.pos++;
		result[key] = resolveValue(ctx, valStr, mapIndent);
	}

	return result;
}

function parseBlockSeq(ctx: Ctx, seqIndent: number): unknown[] {
	const items: unknown[] = [];

	for (;;) {
		skipEmpty(ctx);
		if (ctx.pos >= ctx.lines.length) break;

		const line    = ctx.lines[ctx.pos];
		const ind     = indentOf(line);
		const content = line.trimStart();

		if (ind !== seqIndent) break;
		if (!isSeqLine(content)) break;

		const afterDashRaw = content.slice(1);
		// '-' must be followed by whitespace or end of line
		if (afterDashRaw !== '' && afterDashRaw[0] !== ' ' && afterDashRaw[0] !== '\t') break;

		const spacesAfterDash = afterDashRaw.length - afterDashRaw.trimStart().length;
		const afterDash       = afterDashRaw.trimStart();
		// itemIndent: the column where inline content starts (used for subsequent mapping keys)
		const itemIndent = seqIndent + 1 + Math.max(spacesAfterDash, 1);

		ctx.pos++;

		if (afterDash === '') {
			skipEmpty(ctx);
			if (ctx.pos < ctx.lines.length && indentOf(ctx.lines[ctx.pos]) > seqIndent) {
				items.push(parseBlockNode(ctx));
			} else {
				items.push(null);
			}
			continue;
		}

		if (afterDash.startsWith('[')) { items.push(parseFlowSeq(afterDash)); continue; }
		if (afterDash.startsWith('{')) { items.push(parseFlowMap(afterDash)); continue; }

		const ci = findMapColon(afterDash);
		if (ci > 0) {
			items.push(parseSeqMapItem(ctx, afterDash, seqIndent, itemIndent));
			continue;
		}

		items.push(parseScalarToken(afterDash));
	}

	return items;
}

// Parse a sequence item whose first line is an inline mapping entry ("- key: val").
// Subsequent mapping keys for the same item appear at itemIndent.
function parseSeqMapItem(
	ctx: Ctx,
	afterDash: string,
	seqIndent: number,
	itemIndent: number,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	const ci     = findMapColon(afterDash);
	const key    = parseScalarKey(afterDash.slice(0, ci));
	const rest   = afterDash.slice(ci + 1);
	const valStr = rest.startsWith(' ') ? rest.slice(1) : rest.trimStart();

	result[key] = resolveValue(ctx, valStr, itemIndent);

	for (;;) {
		skipEmpty(ctx);
		if (ctx.pos >= ctx.lines.length) break;

		const line    = ctx.lines[ctx.pos];
		const ind     = indentOf(line);
		const content = line.trimStart();

		if (ind !== itemIndent) break;
		if (isSeqLine(content)) break;

		const kci = findMapColon(content);
		if (kci <= 0) break;

		const k  = parseScalarKey(content.slice(0, kci));
		const r  = content.slice(kci + 1);
		const vs = r.startsWith(' ') ? r.slice(1) : r.trimStart();

		ctx.pos++;
		result[k] = resolveValue(ctx, vs, itemIndent);
	}

	return result;
}

// Resolve a value that appeared inline after "key: " (when valStr !== ''),
// or as a block on the following lines (when valStr === '').
function resolveValue(ctx: Ctx, valStr: string, parentIndent: number): unknown {
	if (valStr !== '') {
		if (valStr.startsWith('[')) return parseFlowSeq(valStr);
		if (valStr.startsWith('{')) return parseFlowMap(valStr);
		return parseScalarToken(valStr);
	}

	skipEmpty(ctx);
	if (ctx.pos >= ctx.lines.length) return null;
	if (indentOf(ctx.lines[ctx.pos]) <= parentIndent) return null;
	return parseBlockNode(ctx);
}

// ── flow parsing ─────────────────────────────────────────────────────────────

function parseFlowSeq(s: string): unknown[] {
	const end   = matchingClose(s, 0, '[', ']');
	const inner = s.slice(1, end);
	return splitFlowItems(inner).map(item => parseFlowItem(item.trim()));
}

function parseFlowMap(s: string): Record<string, unknown> {
	const end    = matchingClose(s, 0, '{', '}');
	const inner  = s.slice(1, end);
	const result: Record<string, unknown> = {};

	for (const item of splitFlowItems(inner)) {
		const ci = findFlowColon(item);
		if (ci < 0) continue;
		const k = parseFlowItem(item.slice(0, ci).trim()) as string;
		const v = parseFlowItem(item.slice(ci + 1).trim());
		result[String(k)] = v;
	}

	return result;
}

function parseFlowItem(s: string): unknown {
	if (s.startsWith('[')) return parseFlowSeq(s);
	if (s.startsWith('{')) return parseFlowMap(s);
	if (s.startsWith("'")) return parseSingleQuoted(s);
	if (s.startsWith('"')) return parseDoubleQuoted(s);
	return coerceScalar(s);
}

// Split a flow collection's inner string on commas, respecting nesting and quotes.
function splitFlowItems(inner: string): string[] {
	const items: string[] = [];
	let depth = 0, inS = false, inD = false, start = 0;

	for (let i = 0; i < inner.length; i++) {
		const c = inner[i];
		if (c === "'" && !inD) { inS = !inS; continue; }
		if (c === '"' && !inS) { inD = !inD; continue; }
		if (!inS && !inD) {
			if (c === '[' || c === '{') depth++;
			else if (c === ']' || c === '}') depth--;
			else if (c === ',' && depth === 0) {
				items.push(inner.slice(start, i));
				start = i + 1;
			}
		}
	}
	if (start <= inner.length) items.push(inner.slice(start));
	return items.filter(s => s.trim() !== '');
}

// Find the colon separator inside a flow mapping item, respecting nesting.
function findFlowColon(s: string): number {
	let inS = false, inD = false, depth = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (c === "'" && !inD) { inS = !inS; continue; }
		if (c === '"' && !inS) { inD = !inD; continue; }
		if (!inS && !inD) {
			if (c === '[' || c === '{') depth++;
			else if (c === ']' || c === '}') depth--;
			else if (c === ':' && depth === 0) {
				const nx = s[i + 1];
				if (nx === ' ' || nx === '\t' || nx === undefined) return i;
			}
		}
	}
	return -1;
}

// Return the index of the closing bracket that matches the opening at `start`.
function matchingClose(s: string, start: number, open: string, close: string): number {
	let depth = 0, inS = false, inD = false;
	for (let i = start; i < s.length; i++) {
		const c = s[i];
		if (c === "'" && !inD) { inS = !inS; continue; }
		if (c === '"' && !inS) { inD = !inD; continue; }
		if (!inS && !inD) {
			if (c === open)  depth++;
			else if (c === close && --depth === 0) return i;
		}
	}
	throw new Error(`Unterminated '${open}...${close}' near: ${s.slice(start, start + 40)}`);
}

// ── scalar helpers ────────────────────────────────────────────────────────────

function parseScalarToken(s: string): unknown {
	const t = s.trim();
	if (t.startsWith("'")) return parseSingleQuoted(t);
	if (t.startsWith('"')) return parseDoubleQuoted(t);
	return coerceScalar(t);
}

function parseScalarKey(s: string): string {
	const t = s.trim();
	if (t.startsWith("'")) return parseSingleQuoted(t) as string;
	if (t.startsWith('"')) return parseDoubleQuoted(t) as string;
	return t;
}

function parseSingleQuoted(s: string): string {
	const inner = s.startsWith("'") && s.endsWith("'") ? s.slice(1, -1) : s;
	return inner.replace(/''/g, "'");
}

function parseDoubleQuoted(s: string): string {
	const inner = s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s;
	return inner
		.replace(/\\"/g,  '"')
		.replace(/\\\\/g, '\\')
		.replace(/\\n/g,  '\n')
		.replace(/\\t/g,  '\t')
		.replace(/\\r/g,  '\r');
}

function coerceScalar(t: string): unknown {
	if (t === '' || t === 'null' || t === '~') return null;
	if (t === 'true')  return true;
	if (t === 'false') return false;
	if (t === '.inf' || t === '+.inf') return Infinity;
	if (t === '-.inf') return -Infinity;
	if (t === '.nan')  return NaN;
	if (/^-?(?:0|[1-9]\d*)$/.test(t)) {
		const n = Number(t);
		if (Number.isSafeInteger(n)) return n;
	}
	if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(t)) {
		const n = Number(t);
		if (!Number.isNaN(n)) return n;
	}
	return t;
}
