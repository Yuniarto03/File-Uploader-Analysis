"use client";

import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Pie, Scatter, Radar, PolarArea, Chart } from 'react-chartjs-2';
import type { ParsedRow, ChartState } from '@/types';
import { getChartColors, prepareChartData } from '@/lib/chart-helpers';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler, ChartDataLabels
);

interface DataVisualizationChartProps {
  parsedData: ParsedRow[];
  chartConfig: ChartState;
}

const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  scatter: Scatter,
  radar: Radar,
  polarArea: PolarArea,
};

export default function DataVisualizationChart({ parsedData, chartConfig }: DataVisualizationChartProps) {
  const chartRef = useRef<ChartJS>(null);

  const { chartType, xAxis, yAxis, colorTheme, showLegend, showDataLabels } = chartConfig;
  
  if (!xAxis || !yAxis) {
      if (parsedData.length === 0 || !chartConfig.xAxis || !chartConfig.yAxis) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Please upload data and select X/Y axes to generate a chart.</div>;
    }
  }

  const { labels, datasets } = prepareChartData(parsedData, xAxis, yAxis, chartType, colorTheme);
  
  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: '#e0f7ff', // var(--custom-light)
          font: { family: "'Orbitron', sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 20, 30, 0.8)', // var(--custom-dark) with alpha
        titleColor: '#00f7ff', // var(--custom-primary)
        bodyColor: '#e0f7ff', // var(--custom-light)
        borderColor: '#00f7ff', // var(--custom-primary)
        borderWidth: 1,
        titleFont: { family: "'Orbitron', sans-serif", size: 14 },
        bodyFont: { family: "'Roboto', sans-serif", size: 12 },
        padding: 12,
        displayColors: true,
        cornerRadius: 4
      },
      datalabels: showDataLabels ? {
        color: '#e0f7ff',
        anchor: 'end' as const,
        align: 'end' as const,
        formatter: (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        font: { family: "'Roboto', sans-serif", size: 10 }
      } : { display: false }, // Explicitly set display to false
    },
    scales: !['pie', 'polarArea', 'radar'].includes(chartType) ? {
      x: {
        ticks: { color: '#e0f7ff', font: { family: "'Roboto', sans-serif" } },
        grid: { color: 'rgba(0, 247, 255, 0.1)' }, // primary with alpha
        title: { display: true, text: xAxis, color: '#00f7ff', font: { family: "'Orbitron', sans-serif", size: 12 } }
      },
      y: {
        ticks: { color: '#e0f7ff', font: { family: "'Roboto', sans-serif" } },
        grid: { color: 'rgba(0, 247, 255, 0.1)' },
        title: { display: true, text: yAxis, color: '#00f7ff', font: { family: "'Orbitron', sans-serif", size: 12 } }
      }
    } : (chartType === 'radar' ? {
        r: {
            angleLines: { color: 'rgba(0, 247, 255, 0.2)' },
            grid: { color: 'rgba(0, 247, 255, 0.2)' },
            pointLabels: { font: { family: "'Roboto', sans-serif", size: 10 }, color: '#e0f7ff' },
            ticks: { backdropColor: 'transparent', color: '#e0f7ff' }
        }
    } : undefined),
    animation: { duration: 1500, easing: 'easeOutQuart' as const },
    elements: {
        line: { borderWidth: 2 },
        point: { radius: 4, hoverRadius: 6 }
    }
  };

  // @ts-ignore
  const ChartComponent = chartComponents[chartType] || Bar;
  
  // For some chart types like Pie, PolarArea, Radar, scales should not be defined or chart.js throws error.
  // This effect ensures that scales are correctly set/unset based on chart type.
  if (['pie', 'polarArea'].includes(chartType)) {
    // @ts-ignore
    delete options.scales;
  }


  return <ChartComponent ref={chartRef} id="data-sphere-chart" type={chartType} data={data} options={options} />;
}
