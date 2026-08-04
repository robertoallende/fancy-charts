import { addIcon, Editor, Plugin } from "obsidian";
import { registerPostprocessor } from "./src/integration/postprocessor";
import { FancyChartsSettings, DEFAULT_SETTINGS, FancyChartsSettingTab } from "./src/settings/settings";
import { FancyChartsModal } from "./src/integration/modal";

const FANCY_CHARTS_ICON = 'fancy-charts-icon';

function registerIcon(): void {
    addIcon(FANCY_CHARTS_ICON, `<g transform="scale(1.4706)" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
<path d="M51.3504 24.4017L45.9699 7.42633C45.7344 6.74839 45.3584 6.12779 44.8666 5.60511C44.3748 5.08242 43.7782 4.66943 43.1158 4.39312C42.4534 4.11681 41.7402 3.98341 41.0228 4.00165C40.3053 4.01988 39.5998 4.18934 38.9523 4.49893L35.6985 6.05443C35.012 6.38202 34.261 6.55192 33.5004 6.55168H24.5754C23.4645 6.55146 22.3838 6.91398 21.4978 7.58414C20.6118 8.2543 19.9688 9.19544 19.6666 10.2645L15.6504 24.4017"/>
<path d="M8 24.4012H59"/>
<path d="M34 50V59"/>
<path d="M40 48V59"/>
<path d="M47 42V59"/>
<path d="M50 30L35.7341 44.41C35.6575 44.4876 35.5664 44.5492 35.4662 44.5912C35.366 44.6332 35.2585 44.6548 35.15 44.6548C35.0415 44.6548 34.934 44.6332 34.8338 44.5912C34.7336 44.5492 34.6425 44.4876 34.5659 44.41L29.1341 38.9233C28.9794 38.7671 28.7696 38.6793 28.5508 38.6793C28.3321 38.6793 28.1223 38.7671 27.9676 38.9233L17 50"/>
<path d="M20 55V59"/>
<path d="M27 48V59"/>
</g>`);
}

export default class FancyChartsPlugin extends Plugin {
  settings: FancyChartsSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    registerIcon();
    await this.loadSettings();

    registerPostprocessor(this, () => this.settings.defaultHeight);

    this.addSettingTab(new FancyChartsSettingTab(this.app, this));

    this.addRibbonIcon(FANCY_CHARTS_ICON, 'Insert chart block', () => {
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
    const data = (await this.loadData()) as Partial<FancyChartsSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
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
