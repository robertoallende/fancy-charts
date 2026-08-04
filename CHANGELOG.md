# Changelog

## 0.1.6 - 04/08/2026

- Fixed modal preview chart overlap when switching types: `setOption` now passes `notMerge: true` so changing from bar to pie (or any other type) fully replaces the chart state instead of merging, preventing stale axes and series from persisting in the preview
- Added custom ribbon icon using the Fancy Charts logo SVG

## 0.1.5 - 04/08/2026

- Removed unnecessary type assertions flagged by the Obsidian linter (`parseSingleQuoted` and `parseDoubleQuoted` already return `string`)

## 0.1.4 - 03/08/2026

- Fixed CSS `!important` violations — specificity is now achieved with parent-class selectors instead
- Replaced `document.createElement` calls with Obsidian's `createEl`, `createDiv`, and `el.empty()` DOM helpers to satisfy the Obsidian community plugin reviewer requirements
- Replaced `window.setTimeout` / `window.clearTimeout` throughout and typed the debounce timer as `number` to avoid conflicts with Node.js type definitions
- Replaced the `yaml` npm package with a hand-written minimal YAML parser, removing `atob` / `btoa` from the compiled bundle; the advanced mode textarea now notes which YAML features are not supported (anchors, aliases, merge keys)
- Implemented `getSettingDefinitions()` for Obsidian 1.13.0+ settings search compatibility
- Added a schema version guard: blocks created with a future version of the plugin show an "update the plugin" message instead of silently misrendering

## 0.1.0 - 03/08/2026

- Charts embedded in notes as fenced code blocks — the data lives as a plain Markdown table inside each block, readable even without the plugin
- Eight chart types: bar, line, pie, scatter, stacked area, funnel, heatmap, sankey
- Simple mode: a wizard UI with live preview, grid table editor, and auto-detected x-axis column
- Advanced mode: raw ECharts option written as YAML, full control over every chart property
- Theme-aware rendering: follows Obsidian's light and dark mode automatically
- Configurable default chart height in plugin settings
