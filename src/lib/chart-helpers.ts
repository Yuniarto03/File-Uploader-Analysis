
import type { ParsedRow, Header, ChartDataset, ChartState, ChartAggregationType, ApplicationSettings } from '@/types';
import { calculateStdDev, aggregateValuesForChart } from './data-helpers';

const colorThemes: Record<string, string[]> = {
  neon: [ // For chart internal palettes, ensure full opacity for base colors
    'rgba(0, 247, 255, 1)', 'rgba(255, 0, 230, 1)', 'rgba(0, 255, 128, 1)',
    'rgba(255, 240, 0, 1)', 'rgba(0, 102, 255, 1)', 'rgba(255, 102, 0, 1)',
    'rgba(128, 0, 255, 1)', 'rgba(0, 255, 0, 1)'
  ],
  cyber: [
    'rgba(255, 213, 0, 1)', 'rgba(0, 255, 198, 1)', 'rgba(255, 0, 102, 1)',
    'rgba(0, 153, 255, 1)', 'rgba(255, 102, 0, 1)', 'rgba(0, 255, 102, 1)',
    'rgba(204, 0, 255, 1)', 'rgba(0, 204, 255, 1)'
  ],
  pastel: [
    'rgba(159, 226, 255, 1)', 'rgba(255, 159, 242, 1)', 'rgba(159, 255, 203, 1)',
    'rgba(255, 236, 159, 1)', 'rgba(190, 159, 255, 1)', 'rgba(255, 179, 159, 1)',
    'rgba(159, 255, 159, 1)', 'rgba(255, 159, 159, 1)'
  ],
  dark: [ // Uses HSL vars defined in globals.css
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
    'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--secondary))', // Added secondary as an option
    'hsl(25, 100%, 50%)', 'hsl(150, 100%, 50%)' // Example bright orange and sea green
  ],
  rainbow: [
    'rgba(255, 0, 0, 1)', 'rgba(255, 127, 0, 1)', 'rgba(255, 255, 0, 1)',
    'rgba(0, 255, 0, 1)', 'rgba(0, 0, 255, 1)', 'rgba(75, 0, 130, 1)',
    'rgba(148, 0, 211, 1)', 'rgba(255, 0, 127, 1)'
  ]
};

export function getChartColors(themeKey: string, count: number, offset: number = 0): string[] {
  const effectiveThemeKey = Object.keys(colorThemes).includes(themeKey) ? themeKey : 'neon';
  const colors = colorThemes[effectiveThemeKey] || colorThemes.neon;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[(i + offset) % colors.length]);
  }
  return result;
}

// Helper functions for color manipulation
function parseColor(colorString: string): { type: 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'unknown', values: (number | string)[] } | null {
  let match = colorString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = match[4] ? parseFloat(match[4]) : 1;
    return { type: match[4] ? 'rgba' : 'rgb', values: [r, g, b, a] };
  }
  match = colorString.match(/^hsla?\(([\d.]+),\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)$/i);
  if (match) {
    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]);
    const l = parseFloat(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1;
    return { type: match[4] ? 'hsla' : 'hsl', values: [h, s, l, a] };
  }
   // Handle HSL variables like hsl(var(--chart-1)) - this is a simplification
  match = colorString.match(/^hsl\(var\((--[\w-]+)\)\)$/i);
  if (match) {
    // We can't resolve CSS variables here, so we return a special type or the original string
    // For now, we'll treat it as HSL without alpha for structure, knowing Chart.js handles it.
    return { type: 'hsl', values: [colorString, '', '', 1] }; // Store full string for HSL vars
  }
  return null;
}

function formatColorWithAlpha(colorString: string, alpha: number): string {
  const parsed = parseColor(colorString);
  if (!parsed) return colorString; // Return original if unparsable

  const v = parsed.values;
  if (parsed.type.startsWith('rgb')) {
    return `rgba(${v[0]}, ${v[1]}, ${v[2]}, ${alpha})`;
  }
  if (parsed.type.startsWith('hsl')) {
    // If it was a CSS variable, we try to make it hsla. This might not be perfect if var already has alpha.
    if (typeof v[0] === 'string' && v[0].includes('var(')) {
        return v[0].replace('hsl(var(', 'hsla(var(').replace('))', `, ${alpha}))`);
    }
    return `hsla(${v[0]}, ${v[1]}%, ${v[2]}%, ${alpha})`;
  }
  return colorString; // Fallback
}

function makeOpaque(colorString: string): string {
    const parsed = parseColor(colorString);
    if (!parsed) return colorString;
    const v = parsed.values;
    if (parsed.type.startsWith('rgb')) {
        return `rgb(${v[0]}, ${v[1]}, ${v[2]})`;
    }
    if (parsed.type.startsWith('hsl')) {
         if (typeof v[0] === 'string' && v[0].includes('var(')) {
            return v[0]; // Assume CSS var is already opaque or Chart.js handles it
        }
        return `hsl(${v[0]}, ${v[1]}%, ${v[2]}%)`;
    }
    return colorString;
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
  const useSecondYAxis = isMultiSeriesType && yAxis2 && yAxis2 && effectiveYAxis2Aggregation && chartType !== 'scatter';


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
    dataset1.backgroundColor = getChartColors(colorTheme, labels.length).map(color => formatColorWithAlpha(color, 0.7));
    if (chartType === 'radar') {
      dataset1.borderColor = getChartColors(colorTheme, 1)[0];
      dataset1.fill = true;
      dataset1.backgroundColor = formatColorWithAlpha(getChartColors(colorTheme, 1)[0], 0.3);
      dataset1.borderWidth = 2;
    } else { 
      dataset1.borderColor = 'rgba(10, 20, 30, 0.8)'; 
      dataset1.borderWidth = 3;
      dataset1.hoverBorderWidth = 4;
      dataset1.hoverOffset = 20;
      (dataset1 as any).borderRadius = 0; 
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

      const mainLineColor = makeOpaque(getChartColors(colorTheme, 1, 0)[0]);
      const areaFillColorBase = getChartColors(colorTheme, 1, 1)[0];

      if (chartType === 'line' || chartType === 'area') {
        dataset1.borderColor = mainLineColor;
        dataset1.pointBackgroundColor = mainLineColor;
        dataset1.pointBorderColor = '#FFFFFF'; // White border for "glow"
        dataset1.pointBorderWidth = 1.5;
        dataset1.pointRadius = 4;
        dataset1.pointHoverRadius = 6;
        dataset1.pointHoverBorderWidth = 2;

        if (chartType === 'area') {
            dataset1.backgroundColor = formatColorWithAlpha(areaFillColorBase, 0.4);
            dataset1.fill = 'origin';
        } else { // 'line'
            dataset1.backgroundColor = mainLineColor; // For legend key consistency
            dataset1.fill = false;
        }
        dataset1.tension = 0.4;
        dataset1.borderWidth = 2;
      } else { // bar
        dataset1.backgroundColor = getChartColors(colorTheme, useSecondYAxis ? 1 : labels.length, 0).map(color => formatColorWithAlpha(color, 0.7));
        dataset1.borderColor = 'rgba(10, 20, 30, 0.8)';
        dataset1.borderWidth = 2; 
        (dataset1 as any).borderRadius = 6; 
      }
    }
  }
  datasets.push(dataset1);

  if (useSecondYAxis && yAxis2) { 
    const dataset2: ChartDataset = {
      label: getDatasetLabel(yAxis2, effectiveYAxis2Aggregation),
      data: [],
      yAxisID: 'y2',
    };

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

    const mainLineColor2 = makeOpaque(getChartColors(colorTheme, 1, 2)[0]); // Use next color in sequence
    const areaFillColorBase2 = getChartColors(colorTheme, 1, 3)[0]; // Use another distinct color for fill

    if (chartType === 'line' || chartType === 'area') {
         dataset2.borderColor = mainLineColor2;
         dataset2.pointBackgroundColor = mainLineColor2;
         dataset2.pointBorderColor = '#FFFFFF';
         dataset2.pointBorderWidth = 1.5;
         dataset2.pointRadius = 4;
         dataset2.pointHoverRadius = 6;
         dataset2.pointHoverBorderWidth = 2;

        if (chartType === 'area') {
            dataset2.backgroundColor = formatColorWithAlpha(areaFillColorBase2, 0.4);
            dataset2.fill = 'origin';
        } else { // 'line'
            dataset2.backgroundColor = mainLineColor2;
            dataset2.fill = false;
        }
        dataset2.tension = 0.4;
        dataset2.borderWidth = 2;
    } else { // bar - yAxisID should handle dual axis for bar if chart options are set correctly
        dataset2.backgroundColor = formatColorWithAlpha(getChartColors(colorTheme, 1, 1)[0], 0.7); 
        dataset2.borderColor = 'rgba(10, 20, 30, 0.8)';
        dataset2.borderWidth = 2; 
        (dataset2 as any).borderRadius = 6; 
    }
    datasets.push(dataset2);
  }
  
  return { labels, datasets };
}
