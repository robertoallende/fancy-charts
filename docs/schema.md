# Fancy Charts Block Schema — Version 1

A self-contained specification for the markdown-based chart format. Any app that reads files following this schema will produce compatible charts.

## Overview

Each chart lives inside a fenced code block with the identifier `fancy-charts`. This means:

- A chart can be **embedded anywhere in a note**, alongside prose, links, and other content
- A note may contain **zero, one, or multiple** charts
- Without the plugin installed, the block renders as an unstyled code block — the raw config and table remain fully human-readable

There are two modes:

- **Simple mode** — a short config section + a markdown table; the plugin builds the ECharts option automatically
- **Advanced mode** — a single `echarts:` key containing a full ECharts option object in YAML; the table is omitted

## Complete Example — Simple Mode

````markdown
```fancy-charts
---
version: 1
type: bar
title: Quarterly Revenue
xAxis: quarter
yAxis:
  - revenue
  - costs
---
| quarter | revenue | costs |
| --- | --- | --- |
| Q1 | 120 | 80 |
| Q2 | 200 | 110 |
| Q3 | 150 | 90 |
| Q4 | 180 | 100 |
```
````

## Complete Example — Advanced Mode

````markdown
```fancy-charts
echarts:
  xAxis:
    type: category
    data: [Q1, Q2, Q3, Q4]
  yAxis:
    type: value
  series:
    - type: bar
      data: [120, 200, 150, 180]
      name: Revenue
```
````

## Block Structure

### Simple Mode

```
```fancy-charts
---
{config}
---
{markdown table}
```
```

The block contains two sections divided by a `---` line:

1. A **config section** (YAML) specifying the chart type, title, and column mappings
2. A **markdown table** containing the data rows

Both the front-matter style (`---\nYAML\n---`) and the inline style (`YAML\n---`) are accepted.

### Advanced Mode

```
```fancy-charts
echarts:
  {ECharts option object}
```
```

When the top-level key `echarts:` is present, the block is treated as advanced mode. No `---` delimiter or markdown table is required.

## Config Keys — Simple Mode

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `version` | no | `1` | Block format version. Blocks without this key are treated as version 1 |
| `type` | yes | — | Chart type. One of: `bar`, `line`, `pie`, `scatter`, `area`, `funnel`, `heatmap`, `sankey` |
| `title` | no | none | Chart title displayed above the chart |
| `xAxis` | no | first column | Column name to use as the category / X axis |
| `yAxis` | no | all other columns | Ordered list of column names to plot as series |

### `type`

```yaml
type: bar
```

Controls the chart type rendered by ECharts. All types share the same table-driven data format.

| Value | Description |
|-------|-------------|
| `bar` | Vertical bar chart; one bar series per `yAxis` column |
| `line` | Line chart; one line series per `yAxis` column |
| `pie` | Pie chart; `xAxis` column provides slice names, first `yAxis` column provides values |
| `scatter` | Scatter plot; `xAxis` column provides X values, first `yAxis` column provides Y values |
| `area` | Stacked area chart; one filled series per `yAxis` column, stacked cumulatively |
| `funnel` | Funnel chart; `xAxis` column provides stage names, first other column provides values |
| `heatmap` | Heatmap; first column = X category, second = Y category, third = numeric value; colour scale auto-computed |
| `sankey` | Sankey flow diagram; first column = source node, second = target node, third = flow value; nodes are derived automatically |

### Area chart example

````markdown
```fancy-charts
---
type: area
title: Monthly Trends
xAxis: month
---
| month | series A | series B | series C |
| --- | --- | --- | --- |
| Jan | 120 | 220 | 150 |
| Feb | 132 | 182 | 232 |
| Mar | 101 | 191 | 201 |
| Apr | 134 | 234 | 154 |
| May | 90 | 290 | 190 |
```
````

### Funnel chart example

````markdown
```fancy-charts
---
type: funnel
title: Sales Funnel
---
| stage | value |
| --- | --- |
| Awareness | 1000 |
| Interest | 600 |
| Consideration | 300 |
| Purchase | 100 |
```
````

### Heatmap example

````markdown
```fancy-charts
---
type: heatmap
title: Activity by Day and Time
---
| day | time | value |
| --- | --- | --- |
| Mon | Morning | 10 |
| Mon | Afternoon | 25 |
| Tue | Morning | 15 |
| Tue | Afternoon | 30 |
```
````

### Sankey example

````markdown
```fancy-charts
---
type: sankey
title: Energy Flow
---
| source | target | value |
| --- | --- | --- |
| Coal | Electricity | 120 |
| Gas | Electricity | 80 |
| Renewables | Electricity | 50 |
| Electricity | Industry | 100 |
| Electricity | Residential | 90 |
```
````

### `title`

```yaml
title: Quarterly Revenue
```

Optional. Rendered as the chart heading by ECharts. Omit the key to show no title.

### `xAxis`

```yaml
xAxis: quarter
```

The name of the column to use as the horizontal axis (bar/line), the slice label source (pie), or the X coordinate (scatter). Must exactly match a column header in the markdown table.

**Default**: the first column in the table.

### `yAxis`

```yaml
yAxis:
  - revenue
  - costs
```

An ordered list of column names to plot as series. Each entry must exactly match a column header in the markdown table. For `pie` and `scatter`, only the first entry is used.

**Default**: all columns except the `xAxis` column.

## Config Keys — Advanced Mode

| Key | Required | Description |
|-----|----------|-------------|
| `echarts` | yes | A YAML mapping that is passed directly to ECharts as the option object |

```yaml
echarts:
  xAxis:
    type: category
    data: [Mon, Tue, Wed]
  yAxis:
    type: value
  series:
    - type: bar
      data: [10, 20, 30]
```

The value of `echarts:` must be a YAML mapping (not a list or scalar). It is forwarded to ECharts after sanitization (see Security below).

Advanced mode gives full access to ECharts features — multiple series types, custom axes, `dataset`, `visualMap`, etc. — at the cost of writing the option object by hand.

## Markdown Table — Simple Mode

The table appears immediately after the closing `---` of the config section.

### Structure

```
| column1 | column2 | column3 |
| --- | --- | --- |
| value   | value   | value   |
```

1. **Header row** — column names; these are referenced by `xAxis` and `yAxis`
2. **Separator row** — standard markdown table separator (`| --- |`)
3. **Data rows** — one row per data point; all cells are treated as strings and coerced to numbers by ECharts where needed

### Rules

- Column names are case-sensitive and must match `xAxis` / `yAxis` values exactly
- Empty cells are valid — ECharts handles missing values according to the series type
- Row order determines display order
- A table with only a header and separator row (no data rows) is valid and renders an empty chart
- Extra columns not referenced by `xAxis` or `yAxis` are ignored

## Parsing Algorithm

1. Extract the raw string from the `fancy-charts` fenced block
2. Strip an optional leading `---` line (front-matter style)
3. If the source contains the `echarts:` key at the top level and no `---` delimiter, treat as **advanced mode** (step 8)
4. Otherwise, split on the first `---` line to separate config from table
5. Parse the config as YAML
6. Validate required keys: `type` must be present and one of the allowed values
7. Validate column references: `xAxis` and `yAxis` values must match headers in the table
8. **Advanced mode**: extract the `echarts:` value, sanitize (see Security), and pass to ECharts
9. **Simple mode**: parse the markdown table; auto-detect `xAxis` (first column) and `yAxis` (remaining columns) if not specified; build the ECharts option

**On parse failure**: a styled error panel is displayed in place of the chart.

## Security

Advanced mode sanitizes the `echarts:` option before it reaches ECharts:

- `title.link` values starting with `javascript:` (case-insensitive) are removed
- `tooltip.formatter` string values are removed (only function formatters are safe, and YAML cannot express functions)

These restrictions prevent XSS when the plugin is used in a shared vault context.

## Minimum Viable Block

```
```fancy-charts
---
type: bar
---
| category | value |
| --- | --- |
| A | 10 |
| B | 20 |
```
```

With no `xAxis` or `yAxis` specified, the first column becomes the X axis and all remaining columns become series.

## Compatibility Notes

- Without the plugin, the block renders as a plain code block — all config and table data remain visible as plain text
- The markdown table inside a simple-mode block is valid markdown and readable in any text editor or Markdown viewer
- Removing the plugin leaves all data intact and recoverable
- The `echarts:` key in advanced mode follows standard YAML 1.1 conventions (as parsed by `js-yaml`)
