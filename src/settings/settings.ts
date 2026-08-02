import { App, PluginSettingTab, Setting } from 'obsidian';
import type FancyChartsPlugin from '../../main';

export interface FancyChartsSettings {
	defaultHeight: number;
}

export const DEFAULT_SETTINGS: FancyChartsSettings = {
	defaultHeight: 300,
};

export function clampHeight(value: number): number {
	if (isNaN(value)) return DEFAULT_SETTINGS.defaultHeight;
	return Math.min(2000, Math.max(100, value));
}

export class FancyChartsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: FancyChartsPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Default chart height')
			.setDesc('Height in pixels for chart blocks (100–2000).')
			.addText(text =>
				text
					.setValue(String(this.plugin.settings.defaultHeight))
					.onChange(async (value) => {
						this.plugin.settings.defaultHeight = clampHeight(parseInt(value, 10));
						await this.plugin.saveSettings();
					})
			);
	}
}
