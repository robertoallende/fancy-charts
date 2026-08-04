import { browser, $ } from '@wdio/globals';

const VAULT = './test/vaults/simple';

async function openInPreview(fileName: string): Promise<void> {
    await browser.reloadObsidian({ vault: VAULT });
    await browser.executeObsidian(async ({ app }, name) => {
        const file = app.vault.getAbstractFileByPath(name as string);
        if (file) await app.workspace.getLeaf().openFile(file as any);
    }, fileName);
    await browser.executeObsidian(async ({ app }) => {
        const leaf = app.workspace.activeLeaf;
        if (leaf?.view) {
            await (leaf.view as any).setState({ mode: 'preview' }, { history: false });
        }
    });
    await browser.pause(1500);
}

async function clickEditBtn(): Promise<void> {
    await browser.execute(() => {
        (document.querySelector('.fc-edit-btn') as HTMLElement | null)?.click();
    });
    await browser.pause(500);
}

describe('Edit chart modal', function () {
    before(async function () {
        await openInPreview('bar-chart.md');
    });

    it('edit button is present on a rendered chart block', async function () {
        const btn = await $('.fc-edit-btn');
        await btn.waitForExist({ timeout: 5000 });
        expect(await btn.isExisting()).toBe(true);
    });

    it('clicking the edit button opens a modal', async function () {
        await clickEditBtn();
        const modal = await $('.fc-modal');
        await modal.waitForExist({ timeout: 5000 });
        expect(await modal.isExisting()).toBe(true);
    });

    it('modal type select is pre-filled with bar', async function () {
        const value = await browser.execute(() => {
            const select = document.querySelector('.fc-modal select') as HTMLSelectElement | null;
            return select?.value ?? '';
        });
        expect(value).toBe('bar');
    });

    it('modal table editor shows the correct column headers', async function () {
        const headers = await browser.execute(() => {
            const inputs = Array.from(
                document.querySelectorAll('.fc-modal .fc-table-editor thead input'),
            ) as HTMLInputElement[];
            return inputs.map(i => i.value);
        });
        expect(headers).toContain('quarter');
        expect(headers).toContain('sales');
        expect(headers).toContain('profit');
    });

    it('modal title input is pre-filled from block', async function () {
        const title = await browser.execute(() => {
            const inputs = Array.from(
                document.querySelectorAll('.fc-modal input[type="text"]'),
            ) as HTMLInputElement[];
            return inputs[0]?.value ?? '';
        });
        expect(title).toBe('Sales by Quarter');
    });
});

describe('Modal preview — chart type switching', function () {
    async function openFreshModal(): Promise<void> {
        await browser.reloadObsidian({ vault: VAULT });
        await browser.executeObsidian(async ({ app }, name) => {
            const file = app.vault.getAbstractFileByPath(name as string);
            if (file) await app.workspace.getLeaf().openFile(file as any);
        }, 'bar-chart.md');
        await browser.executeObsidian(async ({ app }) => {
            const leaf = app.workspace.activeLeaf;
            if (leaf?.view) {
                await (leaf.view as any).setState({ mode: 'preview' }, { history: false });
            }
        });
        await browser.pause(1500);
        await browser.execute(() => {
            (document.querySelector('.fc-edit-btn') as HTMLElement | null)?.click();
        });
        await browser.pause(800);
    }

    async function svgDescendantCount(): Promise<number> {
        return browser.execute(() => {
            const svg = document.querySelector('.fc-modal-preview-chart svg');
            return svg ? svg.querySelectorAll('*').length : 0;
        });
    }

    async function selectChartType(type: string): Promise<void> {
        await browser.execute((t) => {
            const select = document.querySelector('.fc-modal select') as HTMLSelectElement | null;
            if (select) { select.value = t; select.dispatchEvent(new Event('change')); }
        }, type);
        await browser.pause(600);
    }

    async function clickModeBtn(label: string): Promise<void> {
        await browser.execute((l) => {
            const btn = Array.from(document.querySelectorAll('.fc-modal-mode-btn'))
                .find(b => b.textContent?.trim() === l) as HTMLElement | undefined;
            btn?.click();
        }, label);
        await browser.pause(800);
    }

    it('switching Advanced → Simple → Pie leaves no bar-chart axis labels in the preview', async function () {
        // Pie charts have no x/y axes, so there should be no purely-numeric
        // <text> elements (y-axis tick labels like "0", "50", "100") after the switch.
        // The bug caused the bar chart axes to persist because setOption merged
        // rather than replacing the chart state.
        await openFreshModal();
        await clickModeBtn('Advanced');
        await clickModeBtn('Simple');
        await selectChartType('pie');

        const numericAxisLabels = await browser.execute(() => {
            const texts = Array.from(
                document.querySelectorAll('.fc-modal-preview-chart svg text'),
            ) as SVGTextElement[];
            return texts.filter(t => /^\d+$/.test((t.textContent ?? '').trim())).length;
        });

        expect(numericAxisLabels).toBe(0);
    });
});
