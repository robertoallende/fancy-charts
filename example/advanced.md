# Advanced Mode

Pass a raw ECharts option directly using the `echarts:` key. Full ECharts API available.

```fancy-charts
---
echarts:
  title:
    text: Sales Trend (Advanced)
  tooltip:
    trigger: axis
  legend:
    data: [Sales, Target]
  xAxis:
    type: category
    data: [Q1, Q2, Q3, Q4]
  yAxis:
    type: value
  series:
    - name: Sales
      type: bar
      data: [120, 200, 150, 180]
    - name: Target
      type: line
      data: [150, 150, 160, 160]
```
