import { isDarkMode, readThemeVars } from '../../src/theme/theme-vars';

describe('isDarkMode', () => {
	beforeEach(() => {
		document.body.className = '';
	});

	it('returns false when body has theme-light class', () => {
		document.body.classList.add('theme-light');
		expect(isDarkMode()).toBe(false);
	});

	it('returns true when body has theme-dark class', () => {
		document.body.classList.add('theme-dark');
		expect(isDarkMode()).toBe(true);
	});

	it('returns false when body has no theme class', () => {
		expect(isDarkMode()).toBe(false);
	});
});

describe('readThemeVars', () => {
	beforeEach(() => {
		document.body.removeAttribute('style');
	});

	it('reads --background-primary', () => {
		document.body.style.setProperty('--background-primary', '#1e1e1e');
		const vars = readThemeVars();
		expect(vars.backgroundPrimary).toBe('#1e1e1e');
	});

	it('reads --text-normal', () => {
		document.body.style.setProperty('--text-normal', '#dcddde');
		const vars = readThemeVars();
		expect(vars.textNormal).toBe('#dcddde');
	});

	it('reads --text-muted', () => {
		document.body.style.setProperty('--text-muted', '#888888');
		const vars = readThemeVars();
		expect(vars.textMuted).toBe('#888888');
	});

	it('reads --color-accent', () => {
		document.body.style.setProperty('--color-accent', '#7c3aed');
		const vars = readThemeVars();
		expect(vars.colorAccent).toBe('#7c3aed');
	});

	it('reads --font-interface', () => {
		document.body.style.setProperty('--font-interface', 'Inter, sans-serif');
		const vars = readThemeVars();
		expect(vars.fontInterface).toBe('Inter, sans-serif');
	});

	it('reads --font-ui-small', () => {
		document.body.style.setProperty('--font-ui-small', '12px');
		const vars = readThemeVars();
		expect(vars.fontUiSmall).toBe('12px');
	});

	it('returns fallback string when CSS var is not set', () => {
		const vars = readThemeVars();
		expect(typeof vars.backgroundPrimary).toBe('string');
		expect(typeof vars.textNormal).toBe('string');
	});

	it('trims whitespace from values', () => {
		document.body.style.setProperty('--text-normal', '  #dcddde  ');
		const vars = readThemeVars();
		expect(vars.textNormal).toBe('#dcddde');
	});
});
