import { Notice, Plugin } from "obsidian";

export default class FancyChartsPlugin extends Plugin {
  async onload() {
    new Notice("Fancy Charts loaded");

    this.addCommand({
      id: "fancy-charts-hello",
      name: "Hello",
      callback: () => new Notice("Fancy Charts: Hello"),
    });

    // Unit 03: register fancy-charts code block processor here
  }

  onunload() {
    // Unit 03: dispose all active ECharts instances here
  }
}
