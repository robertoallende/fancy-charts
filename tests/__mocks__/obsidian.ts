Object.assign(globalThis, { activeDocument: document });

export class WorkspaceLeaf {}

type ElOpts = { cls?: string | string[]; text?: string; type?: string; value?: string; placeholder?: string; attr?: Record<string, string> };

class ObsidianHTMLElement extends HTMLElement {
  empty(): void { this.innerHTML = ""; }
  createEl<K extends keyof HTMLElementTagNameMap>(tag: K, opts?: ElOpts): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (opts?.cls) {
      const classes = Array.isArray(opts.cls) ? opts.cls : [opts.cls];
      el.classList.add(...classes);
    }
    if (opts?.text !== undefined) el.textContent = opts.text;
    if (opts?.type !== undefined) (el as HTMLInputElement).type = opts.type;
    if (opts?.value !== undefined) (el as HTMLInputElement).value = opts.value;
    if (opts?.placeholder !== undefined) (el as HTMLInputElement).placeholder = opts.placeholder;
    if (opts?.attr) {
      for (const [k, v] of Object.entries(opts.attr)) el.setAttribute(k, v);
    }
    this.appendChild(el);
    return el;
  }
  createDiv(opts?: ElOpts): HTMLDivElement { return this.createEl("div", opts); }
  createSpan(opts?: ElOpts): HTMLSpanElement { return this.createEl("span", opts); }
}

customElements.define("obsidian-content-el", ObsidianHTMLElement);

export class ItemView {
  contentEl: ObsidianHTMLElement = new ObsidianHTMLElement();
  app: unknown = {};
  leaf: unknown;
  constructor(leaf: unknown) { this.leaf = leaf; }
  registerEvent(_e: unknown): void {}
}

export class MarkdownRenderChild {
  constructor(public containerEl: HTMLElement) {}
  onload(): void {}
  onunload(): void {}
}

export class Plugin {}
export class Notice { constructor(_msg: string) {} }
