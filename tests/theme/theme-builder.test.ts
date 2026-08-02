import { buildEChartsTheme, FALLBACK_PALETTE } from '../../src/theme/theme-builder';
import type { ObsidianThemeVars } from '../../src/theme/theme-vars';

const lightVars: ObsidianThemeVars = {
	backgroundPrimary: '#ffffff',
	textNormal:        '#262626',
	textMuted:         '#888888',
	colorAccent:       '#7c3aed',
	fontInterface:     'Inter, sans-serif',
	fontUiSmall:       '12px',
};

const darkVars: ObsidianThemeVars = {
	backgroundPrimary: '#1e1e1e',
	textNormal:        '#dcddde',
	textMuted:         '#888888',
	colorAccent:       '#a78bfa',
	fontInterface:     'Inter, sans-serif',
	fontUiSmall:       '12px',
};

describe('buildEChartsTheme', () => {
	it('sets backgroundColor from backgroundPrimary', () => {
		const theme = buildEChartsTheme(lightVars);
		expect(theme.backgroundColor).toBe('#ffffff');
	});

	it('sets textStyle color from textNormal', () => {
		const theme = buildEChartsTheme(lightVars);
		expect((theme.textStyle as Record<string, unknown>).color).toBe('#262626');
	});

	it('sets textStyle fontFamily from fontInterface', () => {
		const theme = buildEChartsTheme(lightVars);
		expect((theme.textStyle as Record<string, unknown>).fontFamily).toBe('Inter, sans-serif');
	});

	it('sets axis label color from textNormal', () => {
		const theme = buildEChartsTheme(lightVars);
		const cat = theme.categoryAxis as Record<string, unknown>;
		const val = theme.valueAxis as Record<string, unknown>;
		const catLabel = (cat.axisLabel as Record<string, unknown>);
		const valLabel = (val.axisLabel as Record<string, unknown>);
		expect(catLabel.color).toBe('#262626');
		expect(valLabel.color).toBe('#262626');
	});

	it('sets grid line color from textMuted', () => {
		const theme = buildEChartsTheme(lightVars);
		const cat = theme.categoryAxis as Record<string, unknown>;
		const splitLine = (cat.splitLine as Record<string, unknown>);
		const lineStyle = (splitLine.lineStyle as Record<string, unknown>);
		expect(lineStyle.color).toBe('#888888');
	});

	it('sets tooltip background from backgroundPrimary', () => {
		const theme = buildEChartsTheme(darkVars);
		const tooltip = theme.tooltip as Record<string, unknown>;
		expect(tooltip.backgroundColor).toBe('#1e1e1e');
	});

	it('sets tooltip text color from textNormal', () => {
		const theme = buildEChartsTheme(darkVars);
		const tooltip = theme.tooltip as Record<string, unknown>;
		const textStyle = tooltip.textStyle as Record<string, unknown>;
		expect(textStyle.color).toBe('#dcddde');
	});

	it('sets title text color from textNormal', () => {
		const theme = buildEChartsTheme(lightVars);
		const title = theme.title as Record<string, unknown>;
		const textStyle = title.textStyle as Record<string, unknown>;
		expect(textStyle.color).toBe('#262626');
	});

	it('sets title subtext color from textMuted', () => {
		const theme = buildEChartsTheme(darkVars);
		const title = theme.title as Record<string, unknown>;
		const subtextStyle = title.subtextStyle as Record<string, unknown>;
		expect(subtextStyle.color).toBe('#888888');
	});

	it('sets legend text color from textNormal', () => {
		const theme = buildEChartsTheme(lightVars);
		const legend = theme.legend as Record<string, unknown>;
		const textStyle = legend.textStyle as Record<string, unknown>;
		expect(textStyle.color).toBe('#262626');
	});


	it('includes accent color first in the palette', () => {
		const theme = buildEChartsTheme(lightVars);
		expect((theme.color as string[])[0]).toBe('#7c3aed');
	});

	it('fills remaining palette with FALLBACK_PALETTE entries not equal to accent', () => {
		const theme = buildEChartsTheme(lightVars);
		const colors = theme.color as string[];
		expect(colors.length).toBeGreaterThan(1);
		expect(colors.slice(1).every((c: string) => c !== lightVars.colorAccent)).toBe(true);
	});

	it('uses FALLBACK_PALETTE when accent is empty', () => {
		const vars = { ...lightVars, colorAccent: '' };
		const theme = buildEChartsTheme(vars);
		const colors = theme.color as string[];
		expect(colors).toEqual(FALLBACK_PALETTE);
	});

	it('produces the same structure for dark vars', () => {
		const theme = buildEChartsTheme(darkVars);
		expect(theme.backgroundColor).toBe('#1e1e1e');
		expect((theme.textStyle as Record<string, unknown>).color).toBe('#dcddde');
	});
});

describe('FALLBACK_PALETTE', () => {
	it('is a non-empty array of hex strings', () => {
		expect(Array.isArray(FALLBACK_PALETTE)).toBe(true);
		expect(FALLBACK_PALETTE.length).toBeGreaterThan(0);
		FALLBACK_PALETTE.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
	});
});
