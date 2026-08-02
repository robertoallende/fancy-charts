export interface ObsidianThemeVars {
	backgroundPrimary: string;
	textNormal: string;
	textMuted: string;
	colorAccent: string;
	fontInterface: string;
	fontUiSmall: string;
}

const FALLBACKS: Record<string, string> = {
	'--background-primary': '#ffffff',
	'--text-normal':        '#000000',
	'--text-muted':         '#888888',
	'--color-accent':       '#5470c6',
	'--font-interface':     'sans-serif',
	'--font-ui-small':      '12px',
};

export function isDarkMode(): boolean {
	return document.body.classList.contains('theme-dark');
}

export function readThemeVars(): ObsidianThemeVars {
	const style = getComputedStyle(document.body);
	const get = (v: string): string =>
		style.getPropertyValue(v).trim() || FALLBACKS[v] || '';

	return {
		backgroundPrimary: get('--background-primary'),
		textNormal:        get('--text-normal'),
		textMuted:         get('--text-muted'),
		colorAccent:       get('--color-accent'),
		fontInterface:     get('--font-interface'),
		fontUiSmall:       get('--font-ui-small'),
	};
}
