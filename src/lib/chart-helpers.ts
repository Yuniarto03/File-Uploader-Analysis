
import type { ParsedRow, Header, ChartDataset, ChartState } from '@/types';

const colorThemes: Record<string, string[]> = {
  neon: [
    'rgba(0, 247, 255, 0.7)', 'rgba(255, 0, 230, 0.7)', 'rgba(0, 255, 128, 0.7)',
    'rgba(255, 240, 0, 0.7)', 'rgba(0, 102, 255, 0.7)', 'rgba(255, 102, 0, 0.7)',
    'rgba(128, 0, 255, 0.7)', 'rgba(0, 255, 0, 0.7)'
  ],
  cyber: [
    'rgba(255, 213, 0, 0.7)', 'rgba(0, 255, 198, 0.7)', 'rgba(255, 0, 102, 0.7)',
    'rgba(0, 153, 255, 0.7)', 'rgba(255, 102, 0, 0.7)', 'rgba(0, 255, 102, 0.7)',
    'rgba(204, 0, 255, 0.7)', 'rgba(0, 204, 255, 0.7)'
  ],
  pastel: [
    'rgba(159, 226, 255, 0.7)', 'rgba(255, 159, 242, 0.7)', 'rgba(159, 255, 203, 0.7)',
    'rgba(255, 236, 159, 0.7)', 'rgba(190, 159, 255, 0.7)', 'rgba(255, 179, 159, 0.7)',
    'rgba(159, 255, 159, 0.7)', 'rgba(255, 159, 159, 0.7)'
  ],
  dark: [
    'rgba(0, 123, 255, 0.7)', 'rgba(220, 53, 69, 0.7)', 'rgba(40, 167, 69, 0.7)',
    'rgba(255, 193, 7, 0.7)', 'rgba(111, 66, 193, 0.7)', 'rgba(23, 162, 184, 0.7)',
    'rgba(253, 126, 20, 0.7)', 'rgba(108, 117, 125, 0.7)'
  ],
  rainbow: [
    'rgba(255, 0, 0, 0.7)', 'rgba(255, 127, 0, 0.7)', 'rgba(255, 255, 0, 0.7)',
    'rgba(0, 255, 0, 0.7)', 'rgba(0, 0, 255, 0.7)', 'rgba(75, 0, 130, 0.7)',
    'rgba(148, 0, 211, 0.7)', 'rgba(255, 0, 127, 0.7)'
  ]
};

export function getChartColors(theme: string, count: number): string[] {
  const colors = colorThemes[theme] || colorThemes.neon;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

export function prepareChartData(
  parsedData: ParsedRow[],
  chartConfig: ChartState
): { labels: string[]; datasets: ChartDataset[] } {
  const { xAxis, yAxis, chartType, colorTheme, filterColumn, filterValue, filterColumn2, filterValue2, yAxisAggregation } = chartConfig;

  if (!parsedData || parsedData.length === 0 || !xAxis || !yAxis) {
    return { labels: [], datasets: [] };
  }

  let dataToProcess = parsedData;

  if (filterColumn && filterValue) {
    dataToProcess = dataToProcess.filter(row => String(row[filterColumn]) === filterValue);
  }
  if (filterColumn2 && filterValue2) {
    dataToProcess = dataToProcess.filter(row => String(row[filterColumn2]) === filterValue2);
  }

  if (dataToProcess.length === 0) {
    return { labels: [], datasets: [] };
  }

  let labels: string[] = [];
  const dataset: ChartDataset = {
    label: `${yAxis} (${yAxisAggregation.charAt(0).toUpperCase() + yAxisAggregation.slice(1)})`,
    data: [],
  };
   if (yAxisAggregation === 'count') {
    dataset.label = `Count of ${yAxis}`;
  }


  if (['pie', 'polarArea', 'radar'].includes(chartType)) {
    const valueMap = new Map<string, number[]>();
    dataToProcess.forEach(row => {
      const xValue = String(row[xAxis]);
      const yValue = Number(row[yAxis]);
      if (xValue && xValue !== 'null' && xValue !== 'undefined' && !isNaN(yValue)) {
        if (!valueMap.has(xValue)) {
          valueMap.set(xValue, []);
        }
        valueMap.get(xValue)!.push(yValue);
      }
    });
    labels = Array.from(valueMap.keys()).sort();

    if (yAxisAggregation === 'sum') {
      dataset.data = labels.map(label => (valueMap.get(label) || []).reduce((s, v) => s + v, 0));
    } else if (yAxisAggregation === 'avg') {
      dataset.data = labels.map(label => {
        const values = valueMap.get(label) || [];
        return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
      });
    } else if (yAxisAggregation === 'count') {
      dataset.data = labels.map(label => (valueMap.get(label) || []).length);
    }
    
    dataset.backgroundColor = getChartColors(colorTheme, labels.length);
    if (chartType === 'radar') {
      dataset.borderColor = getChartColors(colorTheme, 1)[0];
      dataset.fill = true;
      dataset.backgroundColor = getChartColors(colorTheme,1)[0].replace('0.7', '0.3');
    } else {
      dataset.borderColor = 'rgba(255, 255, 255, 0.2)';
    }
    dataset.borderWidth = 1;

  } else { // bar, line, area, scatter
    if (chartType === 'scatter') {
      // Scatter plot shows individual points, aggregation is less direct
      const scatterData: { x: string; y: number }[] = [];
      dataToProcess.forEach(row => {
        const xValue = String(row[xAxis]);
        const yValue = Number(row[yAxis]);
        if (xValue && xValue !== 'null' && xValue !== 'undefined' && !isNaN(yValue)) {
          scatterData.push({ x: xValue, y: yValue });
        }
      });
      // For scatter, labels might be categories or individual x-values if numeric
      // This might need further refinement based on how scatter is intended for categorical X
      labels = Array.from(new Set(scatterData.map(p => p.x))).sort();
      dataset.data = scatterData;
      dataset.backgroundColor = getChartColors(colorTheme, 1)[0]; 
      dataset.pointRadius = 6;
      dataset.label = yAxis; // Scatter label usually just the Y-axis name
    } else { // bar, line, area
      const groupedData: Record<string, number[]> = {};
      dataToProcess.forEach(row => {
        const xValue = String(row[xAxis]);
        const yValue = Number(row[yAxis]);
        if (xValue && xValue !== 'null' && xValue !== 'undefined' && !isNaN(yValue)) {
          if (!groupedData[xValue]) {
            groupedData[xValue] = [];
          }
          groupedData[xValue].push(yValue);
        }
      });
      labels = Object.keys(groupedData).sort();

      if (yAxisAggregation === 'sum') {
        dataset.data = labels.map(label => (groupedData[label] || []).reduce((s, v) => s + v, 0));
      } else if (yAxisAggregation === 'avg') {
        dataset.data = labels.map(label => {
          const values = groupedData[label] || [];
          return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
        });
      } else if (yAxisAggregation === 'count') {
        dataset.data = labels.map(label => (groupedData[label] || []).length);
      }

      if(chartType === 'line' || chartType === 'area') {
        dataset.borderColor = getChartColors(colorTheme, 1)[0];
        dataset.tension = 0.4;
        dataset.fill = chartType === 'area' ? 'origin' : false;
        dataset.backgroundColor = chartType === 'area' 
          ? getChartColors(colorTheme, 1)[0].replace('0.7', '0.3')
          : getChartColors(colorTheme, 1)[0]; 
        dataset.pointBackgroundColor = getChartColors(colorTheme,1)[0];
        dataset.borderWidth = 2;
      } else { // bar
        dataset.backgroundColor = getChartColors(colorTheme, labels.length);
        dataset.borderColor = 'rgba(255, 255, 255, 0.2)';
        dataset.borderWidth = 1;
      }
    }
  }
  return { labels, datasets: [dataset] };
}

