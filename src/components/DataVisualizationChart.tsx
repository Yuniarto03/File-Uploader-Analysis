
"use client";

import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Bar, Line, Pie, Scatter, Radar, PolarArea, Chart } from 'react-chartjs-2';
import type { ParsedRow, ChartState } from '@/types';
import { getChartColors, prepareChartData } from '@/lib/chart-helpers';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler, ChartDataLabels,
  zoomPlugin 
);

interface DataVisualizationChartProps {
  parsedData: ParsedRow[];
  chartConfig: ChartState;
}

const chartComponents: Record<ChartState['chartType'], typeof Chart> = {
  bar: Bar as typeof Chart,
  line: Line as typeof Chart,
  pie: Pie as typeof Chart,
  scatter: Scatter as typeof Chart,
  radar: Radar as typeof Chart,
  polarArea: PolarArea as typeof Chart,
  area: Line as typeof Chart, 
};

export default function DataVisualizationChart({ parsedData, chartConfig }: DataVisualizationChartProps) {
  const chartRef = useRef<ChartJS>(null);

  const { chartType, xAxis, yAxis, colorTheme, showLegend, showDataLabels } = chartConfig;
  
  if (!xAxis || !yAxis || parsedData.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">Please upload data and select X/Y axes to generate a chart.</div>;
  }

  const { labels, datasets } = prepareChartData(parsedData, xAxis, yAxis, chartType, colorTheme);
  
  const data = {
    labels,
    datasets,
  };

  const options: any = { 
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: '#e0f7ff', 
          font: { family: "'Orbitron', sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 20, 30, 0.8)', 
        titleColor: '#00f7ff', 
        bodyColor: '#e0f7ff', 
        borderColor: '#00f7ff', 
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
      } : { display: false },
      zoom: { 
        pan: {
          enabled: true,
          mode: 'xy' as const,
          threshold: 5, 
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          drag: {
            enabled: true,
            backgroundColor: 'rgba(0, 247, 255, 0.1)', 
            borderColor: 'hsl(var(--primary))',       
            borderWidth: 1,
          },
          pinch: {
            enabled: true 
          },
          mode: 'xy' as const,
        }
      }
    },
    scales: !['pie', 'polarArea', 'radar'].includes(chartType) ? {
      x: {
        ticks: { color: '#e0f7ff', font: { family: "'Roboto', sans-serif" } },
        grid: { color: 'rgba(0, 247, 255, 0.1)' }, 
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
        point: { radius: chartType === 'area' ? 2 : 4, hoverRadius: chartType === 'area' ? 4 : 6 }
    }
  };

  const ChartComponent = chartComponents[chartType] || Bar;
  
  if (['pie', 'polarArea'].includes(chartType)) {
    delete options.scales; 
    // options.plugins.zoom.zoom.wheel.enabled = false;
    // options.plugins.zoom.pan.enabled = false;
    // options.plugins.zoom.zoom.drag.enabled = false;
  }


  return <ChartComponent ref={chartRef} id="data-sphere-chart" type={chartType === 'area' ? 'line' : chartType} data={data} options={options} />;
}

