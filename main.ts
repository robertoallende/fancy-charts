import { Plugin } from "obsidian";
import { registerPostprocessor } from "./src/integration/postprocessor";

export default class FancyChartsPlugin extends Plugin {
  async onload() {
    registerPostprocessor(this);
  }

  onunload() {}
}
