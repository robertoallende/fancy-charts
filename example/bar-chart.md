# Bar Chart

Simple bar chart with multiple series, auto-detected from the table columns.

```fancy-charts
---
type: bar
title: Quarterly Revenue
xAxis: quarter
---
| quarter | sales | profit |
| --- | --- | --- |
| Q1 | 120 | 30 |
| Q2 | 200 | 50 |
| Q3 | 150 | 35 |
| Q4 | 180 | 45 |
```

Single series using explicit `yAxis`:

```fancy-charts
---
type: bar
title: Sales Only
xAxis: quarter
yAxis:
  - sales
---
| quarter | sales | profit |
| --- | --- | --- |
| Q1 | 120 | 30 |
| Q2 | 200 | 50 |
| Q3 | 150 | 35 |
| Q4 | 180 | 45 |
```
