import { DEFAULT_SETTINGS, clampHeight, FancyChartsSettingTab } from '../../src/settings/settings';

describe('DEFAULT_SETTINGS', () => {
	it('has defaultHeight of 300', () => {
		expect(DEFAULT_SETTINGS.defaultHeight).toBe(300);
	});
});

describe('clampHeight', () => {
	it('returns the value unchanged when within range', () => {
		expect(clampHeight(300)).toBe(300);
		expect(clampHeight(100)).toBe(100);
		expect(clampHeight(2000)).toBe(2000);
	});

	it('clamps values below 100 to 100', () => {
		expect(clampHeight(0)).toBe(100);
		expect(clampHeight(50)).toBe(100);
		expect(clampHeight(-1)).toBe(100);
	});

	it('clamps values above 2000 to 2000', () => {
		expect(clampHeight(2001)).toBe(2000);
		expect(clampHeight(9999)).toBe(2000);
	});

	it('handles NaN by returning the default 300', () => {
		expect(clampHeight(NaN)).toBe(300);
	});
});

describe('FancyChartsSettingTab', () => {
	it('can be instantiated with an app and plugin mock', () => {
		const tab = new FancyChartsSettingTab({} as never, {
			settings: { defaultHeight: 300 },
			saveSettings: async () => {},
		} as never);
		expect(tab).toBeDefined();
	});

	it('display() adds a setting element to containerEl', () => {
		const saveSettings = vi.fn().mockResolvedValue(undefined);
		const tab = new FancyChartsSettingTab({} as never, {
			settings: { defaultHeight: 400 },
			saveSettings,
		} as never);
		tab.display();
		expect(tab.containerEl.children.length).toBeGreaterThan(0);
	});
});
