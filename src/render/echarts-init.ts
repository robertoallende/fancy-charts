import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
	TitleComponent, TooltipComponent, LegendComponent,
	GridComponent, DatasetComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
	BarChart, LineChart, PieChart, ScatterChart,
	TitleComponent, TooltipComponent, LegendComponent,
	GridComponent, DatasetComponent,
	SVGRenderer,
]);

export { echarts };
