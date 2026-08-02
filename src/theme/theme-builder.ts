import type { ObsidianThemeVars } from './theme-vars';

export const FALLBACK_PALETTE = [
	'#5470c6',
	'#91cc75',
	'#fac858',
	'#ee6666',
	'#73c0de',
	'#3ba272',
];

export function buildEChartsTheme(vars: ObsidianThemeVars): Record<string, unknown> {
	const palette = vars.colorAccent
		? [vars.colorAccent, ...FALLBACK_PALETTE.filter(c => c !== vars.colorAccent)]
		: FALLBACK_PALETTE;

	const axisLabel = { color: vars.textNormal };
	const splitLine = { lineStyle: { color: vars.backgroundModifierBorder } };
	const axis = { axisLabel, splitLine };

	return {
		backgroundColor: vars.backgroundPrimary,
		textStyle: {
			color:      vars.textNormal,
			fontFamily: vars.fontInterface,
		},
		title: {
			textStyle:    { color: vars.textNormal },
			subtextStyle: { color: vars.textMuted },
		},
		categoryAxis: axis,
		valueAxis:    axis,
		tooltip: {
			backgroundColor: vars.backgroundPrimary,
			textStyle: { color: vars.textNormal },
		},
		legend: {
			textStyle: { color: vars.textNormal },
			bottom: 10,
		},
		color: palette,
	};
}
