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

async function setTheme(theme: 'moonstone' | 'obsidian'): Promise<void> {
    await browser.executeObsidian(async ({ app }, t) => {
        await (app as any).changeTheme(t as string);
    }, theme);
    await browser.pause(800);
}

describe('Theme switching', function () {
    beforeEach(async function () {
        await openInPreview('bar-chart.md');
        await setTheme('moonstone');
    });

    it('renders chart in light mode (default)', async function () {
        const svg = await $('.fancy-charts-block svg');
        await svg.waitForExist({ timeout: 5000 });
        expect(await svg.isExisting()).toBe(true);
    });

    it('body has theme-light class in light mode', async function () {
        const isDark = await browser.execute(() =>
            document.body.classList.contains('theme-dark')
        );
        expect(isDark).toBe(false);
    });

    it('chart re-renders SVG after switching to dark mode', async function () {
        await setTheme('obsidian');
        const svg = await $('.fancy-charts-block svg');
        await svg.waitForExist({ timeout: 8000 });
        expect(await svg.isExisting()).toBe(true);
    });

    it('body has theme-dark class after switching to dark mode', async function () {
        await setTheme('obsidian');
        const isDark = await browser.execute(() =>
            document.body.classList.contains('theme-dark')
        );
        expect(isDark).toBe(true);
    });

    it('chart re-renders SVG after switching back to light mode', async function () {
        await setTheme('obsidian');
        await setTheme('moonstone');
        const svg = await $('.fancy-charts-block svg');
        await svg.waitForExist({ timeout: 8000 });
        expect(await svg.isExisting()).toBe(true);
    });
});
