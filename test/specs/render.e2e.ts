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

describe('Chart render pipeline', function () {
    describe('bar chart', function () {
        before(async function () {
            await openInPreview('bar-chart.md');
        });

        it('renders .fancy-charts-block', async function () {
            const block = await $('.fancy-charts-block');
            await block.waitForExist({ timeout: 5000 });
            expect(await block.isExisting()).toBe(true);
        });

        it('renders an SVG element inside the block', async function () {
            const svg = await $('.fancy-charts-block svg');
            await svg.waitForExist({ timeout: 5000 });
            expect(await svg.isExisting()).toBe(true);
        });

        it('chart block has a height set via inline style', async function () {
            const height = await browser.execute(() => {
                const el = document.querySelector('.fancy-charts-block') as HTMLElement | null;
                return el ? el.style.height : '';
            });
            expect(height).not.toBe('');
        });

        it('does not render an error panel', async function () {
            const error = await $('.fc-error');
            expect(await error.isExisting()).toBe(false);
        });
    });

    describe('line chart', function () {
        before(async function () {
            await openInPreview('line-chart.md');
        });

        it('renders SVG for a line chart', async function () {
            const svg = await $('.fancy-charts-block svg');
            await svg.waitForExist({ timeout: 5000 });
            expect(await svg.isExisting()).toBe(true);
        });
    });

    describe('pie chart', function () {
        before(async function () {
            await openInPreview('pie-chart.md');
        });

        it('renders SVG for a pie chart', async function () {
            const svg = await $('.fancy-charts-block svg');
            await svg.waitForExist({ timeout: 5000 });
            expect(await svg.isExisting()).toBe(true);
        });
    });

    describe('funnel chart', function () {
        before(async function () {
            await openInPreview('funnel-chart.md');
        });

        it('renders SVG for a funnel chart', async function () {
            const svg = await $('.fancy-charts-block svg');
            await svg.waitForExist({ timeout: 5000 });
            expect(await svg.isExisting()).toBe(true);
        });
    });

    describe('heatmap chart', function () {
        before(async function () {
            await openInPreview('heatmap-chart.md');
        });

        it('renders SVG for a heatmap chart', async function () {
            const svg = await $('.fancy-charts-block svg');
            await svg.waitForExist({ timeout: 5000 });
            expect(await svg.isExisting()).toBe(true);
        });
    });

    describe('sankey chart', function () {
        before(async function () {
            await openInPreview('sankey-chart.md');
        });

        it('renders SVG for a sankey chart', async function () {
            const svg = await $('.fancy-charts-block svg');
            await svg.waitForExist({ timeout: 5000 });
            expect(await svg.isExisting()).toBe(true);
        });
    });

    describe('advanced (ECharts passthrough) chart', function () {
        before(async function () {
            await openInPreview('advanced-chart.md');
        });

        it('renders SVG for an advanced chart', async function () {
            const svg = await $('.fancy-charts-block svg');
            await svg.waitForExist({ timeout: 5000 });
            expect(await svg.isExisting()).toBe(true);
        });

        it('does not render an error panel for a valid advanced block', async function () {
            const error = await $('.fc-error');
            expect(await error.isExisting()).toBe(false);
        });
    });

    describe('error panel', function () {
        before(async function () {
            await openInPreview('error-chart.md');
        });

        it('renders .fc-error for an invalid block', async function () {
            const error = await $('.fc-error');
            await error.waitForExist({ timeout: 5000 });
            expect(await error.isExisting()).toBe(true);
        });

        it('error panel contains "Fancy Charts:" prefix', async function () {
            const error = await $('.fc-error');
            await error.waitForExist({ timeout: 5000 });
            const text = await browser.execute(() =>
                document.querySelector('.fc-error')?.textContent ?? ''
            );
            expect(text).toContain('Fancy Charts:');
        });

        it('does not render .fancy-charts-block for an invalid block', async function () {
            const block = await $('.fancy-charts-block');
            expect(await block.isExisting()).toBe(false);
        });
    });
});
