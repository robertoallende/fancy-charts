import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart, FunnelChart, HeatmapChart, SankeyChart } from 'echarts/charts';
import {
	TitleComponent, TooltipComponent, LegendComponent,
	GridComponent, DatasetComponent, VisualMapComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
	BarChart, LineChart, PieChart, ScatterChart, FunnelChart, HeatmapChart, SankeyChart,
	TitleComponent, TooltipComponent, LegendComponent,
	GridComponent, DatasetComponent, VisualMapComponent,
	SVGRenderer,
]);

export { echarts };
