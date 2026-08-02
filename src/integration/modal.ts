import { App, Modal } from 'obsidian';

export interface ModalState {
	type: 'bar' | 'line' | 'pie' | 'scatter';
	title: string;
	xAxis: string;
	tableText: string;
}

export const DEFAULT_STATE: ModalState = {
	type: 'bar',
	title: '',
	xAxis: '',
	tableText: '| category | value |\n| --- | --- |\n| A | 10 |\n| B | 20 |',
};

export function serializeBlock(state: ModalState): string {
	const yaml: string[] = [`type: ${state.type}`];
	if (state.title.trim()) yaml.push(`title: ${state.title.trim()}`);
	if (state.xAxis.trim()) yaml.push(`xAxis: ${state.xAxis.trim()}`);

	const inner = ['---', ...yaml, '---', state.tableText.trim()].join('\n');
	return `\`\`\`fancy-charts\n${inner}\n\`\`\``;
}

export class FancyChartsModal extends Modal {
	private state: ModalState;

	constructor(app: App, private onConfirm: (block: string) => void) {
		super(app);
		this.state = { ...DEFAULT_STATE };
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.titleEl.textContent = 'Insert chart';
		contentEl.createEl('p', { text: 'Chart modal — coming in subunit 002.' });
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
