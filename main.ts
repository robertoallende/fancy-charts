import { Editor, Plugin } from "obsidian";
import { registerPostprocessor } from "./src/integration/postprocessor";
import { FancyChartsSettings, DEFAULT_SETTINGS, FancyChartsSettingTab } from "./src/settings/settings";

const CHART_TEMPLATE = `\`\`\`fancy-charts
---
type: bar
title: My Chart
xAxis: category
---
| category | value |
| --- | --- |
| A | 10 |
| B | 20 |
| C | 15 |
\`\`\``;

export default class FancyChartsPlugin extends Plugin {
  settings: FancyChartsSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();

    registerPostprocessor(this, () => this.settings.defaultHeight);

    this.addSettingTab(new FancyChartsSettingTab(this.app, this));

    this.addRibbonIcon('bar-chart-2', 'Insert chart block', () => {
      this.insertChartBlock();
    });

    this.addCommand({
      id: 'insert-chart-block',
      name: 'Insert chart block',
      editorCallback: (editor: Editor) => {
        editor.replaceRange(CHART_TEMPLATE, editor.getCursor());
      },
    });
  }

  onunload() {}

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private insertChartBlock() {
    const editor = (this.app as unknown as { workspace: { activeEditor?: { editor?: Editor } } }).workspace.activeEditor?.editor;
    if (editor) {
      editor.replaceRange(CHART_TEMPLATE, editor.getCursor());
    }
  }
}
