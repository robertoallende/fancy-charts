import { Editor, Plugin } from "obsidian";
import { registerPostprocessor } from "./src/integration/postprocessor";
import { FancyChartsSettings, DEFAULT_SETTINGS, FancyChartsSettingTab } from "./src/settings/settings";
import { FancyChartsModal } from "./src/integration/modal";

export default class FancyChartsPlugin extends Plugin {
  settings: FancyChartsSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();

    registerPostprocessor(this, () => this.settings.defaultHeight);

    this.addSettingTab(new FancyChartsSettingTab(this.app, this));

    this.addRibbonIcon('bar-chart-2', 'Insert chart block', () => {
      this.openInsertModal();
    });

    this.addCommand({
      id: 'insert-chart-block',
      name: 'Insert chart block',
      editorCallback: (editor: Editor) => {
        new FancyChartsModal(this.app, (block) => {
          editor.replaceRange(block, editor.getCursor());
        }).open();
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

  private openInsertModal() {
    const editor = (this.app as unknown as { workspace: { activeEditor?: { editor?: Editor } } }).workspace.activeEditor?.editor;
    new FancyChartsModal(this.app, (block) => {
      if (editor) editor.replaceRange(block, editor.getCursor());
    }).open();
  }
}
