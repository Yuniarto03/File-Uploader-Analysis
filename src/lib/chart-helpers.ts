import type { ParsedRow, Header, ChartDataset } from '@/types';

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
  xAxis: Header,
  yAxis: Header,
  chartType: string,
  colorTheme: string
): { labels: string[]; datasets: ChartDataset[] } {
  if (!parsedData || parsedData.length === 0 || !xAxis || !yAxis) {
    return { labels: [], datasets: [] };
  }

  let labels: string[] = [];
  const dataset: ChartDataset = {
    label: yAxis,
    data: [],
  };

  if (['pie', 'polarArea', 'radar'].includes(chartType)) {
    const valueMap = new Map<string, number>();
    parsedData.forEach(row => {
      const xValue = String(row[xAxis]);
      const yValue = Number(row[yAxis]) || 0;
      if (xValue && xValue !== 'null' && xValue !== 'undefined') {
        valueMap.set(xValue, (valueMap.get(xValue) || 0) + yValue);
      }
    });
    labels = Array.from(valueMap.keys());
    dataset.data = Array.from(valueMap.values());
    dataset.backgroundColor = getChartColors(colorTheme, labels.length);
    if (chartType === 'radar') {
      dataset.borderColor = getChartColors(colorTheme, 1)[0];
      dataset.fill = true;
      dataset.backgroundColor = getChartColors(colorTheme,1)[0].replace('0.7', '0.3'); // Lighter fill for radar
    } else {
      dataset.borderColor = 'rgba(255, 255, 255, 0.2)';
    }
    dataset.borderWidth = 1;
  } else { // bar, line, scatter
    const groupedData: Record<string, number[]> = {};
    parsedData.forEach(row => {
      const xValue = String(row[xAxis]);
      const yValue = Number(row[yAxis]);
      if (xValue && xValue !== 'null' && xValue !== 'undefined' && !isNaN(yValue)) {
        if (!groupedData[xValue]) {
          groupedData[xValue] = [];
        }
        groupedData[xValue].push(yValue);
      }
    });

    labels = Object.keys(groupedData).sort(); // Sort labels for consistency

    if (chartType === 'scatter') {
        const scatterData: { x: string; y: number }[] = [];
        labels.forEach(label => {
            groupedData[label].forEach(val => {
                scatterData.push({ x: label, y: val });
            });
        });
        dataset.data = scatterData;
        dataset.backgroundColor = getChartColors(colorTheme, 1)[0]; 
        dataset.pointRadius = 6;

    } else { // bar, line
        const aggregatedValues = labels.map(label => {
            const values = groupedData[label];
            // For bar/line, usually sum or average. Let's use average.
            return values.reduce((sum, val) => sum + val, 0) / values.length;
        });
        dataset.data = aggregatedValues;
        dataset.backgroundColor = getChartColors(colorTheme, chartType === 'line' ? 1 : labels.length)[0]; // Single color for line, multiple for bar
        if(chartType === 'line') {
          dataset.borderColor = getChartColors(colorTheme, 1)[0];
          dataset.tension = 0.4;
          dataset.fill = false;
          dataset.pointBackgroundColor = getChartColors(colorTheme,1)[0];
        } else { // bar
          dataset.backgroundColor = getChartColors(colorTheme, labels.length);
          dataset.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
        dataset.borderWidth = chartType === 'line' ? 2 : 1;
    }
  }
  return { labels, datasets: [dataset] };
}
