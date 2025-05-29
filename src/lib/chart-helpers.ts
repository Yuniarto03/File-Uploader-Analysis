
import type { ParsedRow, Header, ChartDataset, ChartState, ChartAggregationType, ApplicationSettings } from '@/types';
import { calculateStdDev, aggregateValuesForChart } from './data-helpers';

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
  dark: [ // Already defined in globals.css effectively as chart-1, chart-2 etc.
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
    'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'rgba(23, 162, 184, 0.7)',
    'rgba(253, 126, 20, 0.7)', 'rgba(108, 117, 125, 0.7)'
  ],
  rainbow: [
    'rgba(255, 0, 0, 0.7)', 'rgba(255, 127, 0, 0.7)', 'rgba(255, 255, 0, 0.7)',
    'rgba(0, 255, 0, 0.7)', 'rgba(0, 0, 255, 0.7)', 'rgba(75, 0, 130, 0.7)',
    'rgba(148, 0, 211, 0.7)', 'rgba(255, 0, 127, 0.7)'
  ]
};

export function getChartColors(themeKey: string, count: number, offset: number = 0): string[] {
  const effectiveThemeKey = themeKey === 'dark' ? 'neon' : themeKey; // Use 'neon' as a stand-in if 'dark' is selected for chart colors
  const colors = colorThemes[effectiveThemeKey] || colorThemes.neon;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[(i + offset) % colors.length]);
  }
  return result;
}

const aggregationLabelMap: Record<ChartAggregationType, string> = {
  sum: "Sum", avg: "Average", count: "Count", min: "Minimum", max: "Maximum", unique: "Unique Count", sdev: "StdDev"
};

function getDatasetLabel(yAxis: string, aggregation: ChartAggregationType): string {
    const aggLabel = aggregationLabelMap[aggregation] || aggregation.toUpperCase();
    if (aggregation === 'count' || aggregation === 'unique') {
        return `${aggLabel} of ${yAxis}`;
    }
    return `${yAxis} (${aggLabel})`;
}


export function prepareChartData(
  parsedData: ParsedRow[],
  chartConfig: ChartState
): { labels: string[]; datasets: ChartDataset[] } {
  const {
    xAxis, yAxis, chartType, colorTheme,
    filterColumn, filterValue, filterColumn2, filterValue2,
    yAxisAggregation, yAxis2, yAxis2Aggregation
  } = chartConfig;

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
  const datasets: ChartDataset[] = [];

  const isMultiSeriesType = ['bar', 'line', 'area', 'scatter'].includes(chartType);
  const effectiveYAxis2Aggregation = yAxis2Aggregation || 'avg';
  const useSecondYAxis = isMultiSeriesType && yAxis2 && effectiveYAxis2Aggregation;


  // --- Process First Y-Axis (yAxis) ---
  const dataset1: ChartDataset = {
    label: getDatasetLabel(yAxis, yAxisAggregation),
    data: [],
  };

  if (['pie', 'polarArea', 'radar'].includes(chartType)) {
    const valueMap = new Map<string, (string | number | boolean | null | undefined)[]>();
    dataToProcess.forEach(row => {
      const xValue = String(row[xAxis]);
      const yValueToAgg = row[yAxis];
      if (xValue && xValue !== 'null' && xValue !== 'undefined') {
        if (!valueMap.has(xValue)) valueMap.set(xValue, []);
        valueMap.get(xValue)!.push(yValueToAgg);
      }
    });
    labels = Array.from(valueMap.keys()).sort((a, b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
    dataset1.data = labels.map(label => {
      const values = valueMap.get(label) || [];
      const isNumericY = values.length > 0 && typeof values[0] === 'number' && !isNaN(Number(values[0]));
      return aggregateValuesForChart(values, yAxisAggregation, isNumericY);
    });
    dataset1.backgroundColor = getChartColors(colorTheme, labels.length);
    if (chartType === 'radar') {
      dataset1.borderColor = getChartColors(colorTheme, 1)[0];
      dataset1.fill = true;
      dataset1.backgroundColor = getChartColors(colorTheme, 1)[0].replace('0.7', '0.3');
      dataset1.borderWidth = 2;
    } else { 
      dataset1.borderColor = 'rgba(10, 20, 30, 0.8)'; 
      dataset1.borderWidth = 2;
      dataset1.hoverBorderWidth = 3;
      dataset1.hoverOffset = 15;
      (dataset1 as any).borderRadius = 6; 
    }
  } else { 
    if (chartType === 'scatter') {
      const scatterData: { x: string; y: number }[] = [];
      dataToProcess.forEach(row => {
        const xValue = String(row[xAxis]);
        const yValueNum = Number(row[yAxis]);
        if (xValue && xValue !== 'null' && xValue !== 'undefined' && !isNaN(yValueNum)) {
          scatterData.push({ x: xValue, y: yValueNum });
        }
      });
      labels = Array.from(new Set(scatterData.map(p => p.x))).sort((a, b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
      dataset1.data = scatterData;
      dataset1.backgroundColor = getChartColors(colorTheme, 1)[0];
      dataset1.pointRadius = 6;
      dataset1.label = yAxis; 
    } else { 
      const groupedData: Record<string, (string | number | boolean | null | undefined)[]> = {};
      dataToProcess.forEach(row => {
        const xValue = String(row[xAxis]);
        const yValueToAgg = row[yAxis];
        if (xValue && xValue !== 'null' && xValue !== 'undefined') {
          if (!groupedData[xValue]) groupedData[xValue] = [];
          groupedData[xValue].push(yValueToAgg);
        }
      });
      labels = Object.keys(groupedData).sort((a, b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
      dataset1.data = labels.map(label => {
        const values = groupedData[label] || [];
        const isNumericY = values.length > 0 && typeof values[0] === 'number' && !isNaN(Number(values[0]));
        return aggregateValuesForChart(values, yAxisAggregation, isNumericY);
      });

      if (chartType === 'line' || chartType === 'area') {
        dataset1.borderColor = getChartColors(colorTheme, 1, 0)[0];
        dataset1.tension = 0.4;
        dataset1.fill = chartType === 'area' ? 'origin' : false;
        dataset1.backgroundColor = chartType === 'area'
          ? getChartColors(colorTheme, 1, 0)[0].replace('0.7', '0.3')
          : getChartColors(colorTheme, 1, 0)[0];
        dataset1.pointBackgroundColor = getChartColors(colorTheme, 1, 0)[0];
        dataset1.borderWidth = 2;
      } else { 
        dataset1.backgroundColor = getChartColors(colorTheme, useSecondYAxis ? 1 : labels.length, 0); 
        dataset1.borderColor = 'rgba(10, 20, 30, 0.8)';
        dataset1.borderWidth = 1.5;
        (dataset1 as any).borderRadius = 6;
      }
    }
  }
  datasets.push(dataset1);

  if (useSecondYAxis && yAxis2) { 
    const dataset2: ChartDataset = {
      label: getDatasetLabel(yAxis2, effectiveYAxis2Aggregation),
      data: [],
    };

    if (chartType === 'scatter') {
        const scatterData2: { x: string; y: number }[] = [];
        dataToProcess.forEach(row => {
            const xValue = String(row[xAxis]);
            const yValueNum = Number(row[yAxis2]); 
            if (xValue && xValue !== 'null' && xValue !== 'undefined' && !isNaN(yValueNum)) {
            scatterData2.push({ x: xValue, y: yValueNum });
            }
        });
        dataset2.data = scatterData2;
        dataset2.backgroundColor = getChartColors(colorTheme, 1, 1)[0]; 
        dataset2.pointRadius = 6;
        dataset2.label = yAxis2; 
    } else { 
        const groupedData2: Record<string, (string | number | boolean | null | undefined)[]> = {};
        dataToProcess.forEach(row => {
            const xValue = String(row[xAxis]);
            const yValueToAgg = row[yAxis2]; 
            if (xValue && xValue !== 'null' && xValue !== 'undefined') {
            if (!groupedData2[xValue]) groupedData2[xValue] = [];
            groupedData2[xValue].push(yValueToAgg);
            }
        });
        dataset2.data = labels.map(label => { 
            const values = groupedData2[label] || [];
            const isNumericY = values.length > 0 && typeof values[0] === 'number' && !isNaN(Number(values[0]));
            return aggregateValuesForChart(values, effectiveYAxis2Aggregation, isNumericY);
        });

        if (chartType === 'line' || chartType === 'area') {
            dataset2.borderColor = getChartColors(colorTheme, 1, 1)[0]; 
            dataset2.tension = 0.4;
            dataset2.fill = chartType === 'area' ? 'origin' : false;
            dataset2.backgroundColor = chartType === 'area'
            ? getChartColors(colorTheme, 1, 1)[0].replace('0.7', '0.3')
            : getChartColors(colorTheme, 1, 1)[0];
            dataset2.pointBackgroundColor = getChartColors(colorTheme, 1, 1)[0];
            dataset2.borderWidth = 2;
        } else { 
            dataset2.backgroundColor = getChartColors(colorTheme, 1, 1)[0]; 
            dataset2.borderColor = 'rgba(10, 20, 30, 0.8)';
            dataset2.borderWidth = 1.5;
            (dataset2 as any).borderRadius = 6;
        }
    }
    datasets.push(dataset2);
  }
  
  return { labels, datasets };
}
