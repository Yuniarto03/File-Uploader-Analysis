"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import DataVisualizationChart from '@/components/DataVisualizationChart';
import type { Header, ParsedRow, ChartState } from '@/types';
import { ScrollArea } from './ui/scroll-area';

interface VisualizationTabProps {
  parsedData: ParsedRow[];
  headers: Header[];
  chartState: ChartState;
  setChartState: (state: ChartState | ((prevState: ChartState) => ChartState)) => void;
}

export default function VisualizationTab({ parsedData, headers, chartState, setChartState }: VisualizationTabProps) {
  
  const numericHeaders = useMemo(() => 
    headers.filter(header => 
      parsedData.length > 0 && parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    ), [headers, parsedData]);

  const handleChartStateChange = (field: keyof ChartState, value: any) => {
    setChartState(prev => ({ ...prev, [field]: value }));
  };
  
  // Ensure default selections are valid
  React.useEffect(() => {
    if (headers.length > 0 && !chartState.xAxis) {
      handleChartStateChange('xAxis', headers[0]);
    }
    if (numericHeaders.length > 0 && !chartState.yAxis) {
      handleChartStateChange('yAxis', numericHeaders[0] || '');
    }
  }, [headers, numericHeaders, chartState.xAxis, chartState.yAxis]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-cyan-900/20 rounded-lg p-4">
        <h3 className="text-lg font-tech text-primary mb-4">Chart Settings</h3>
        <ScrollArea className="h-[calc(100vh-300px)] pr-3"> {/* Adjusted height */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="chart-type" className="block text-sm font-medium text-primary/80 mb-1">Chart Type</Label>
              <Select 
                value={chartState.chartType} 
                onValueChange={(value) => handleChartStateChange('chartType', value)}
              >
                <SelectTrigger id="chart-type" className="custom-select">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  {['bar', 'line', 'pie', 'scatter', 'radar', 'polarArea'].map(type => (
                    <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)} Chart</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="x-axis" className="block text-sm font-medium text-primary/80 mb-1">X-Axis</Label>
              <Select 
                value={chartState.xAxis} 
                onValueChange={(value) => handleChartStateChange('xAxis', value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="x-axis" className="custom-select">
                  <SelectValue placeholder="Select X-axis" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="y-axis" className="block text-sm font-medium text-primary/80 mb-1">Y-Axis</Label>
              <Select 
                value={chartState.yAxis} 
                onValueChange={(value) => handleChartStateChange('yAxis', value)}
                disabled={numericHeaders.length === 0}
              >
                <SelectTrigger id="y-axis" className="custom-select">
                  <SelectValue placeholder="Select Y-axis (numeric)" />
                </SelectTrigger>
                <SelectContent>
                  {numericHeaders.map(header => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color-theme" className="block text-sm font-medium text-primary/80 mb-1">Color Theme</Label>
              <Select 
                value={chartState.colorTheme} 
                onValueChange={(value) => handleChartStateChange('colorTheme', value)}
              >
                <SelectTrigger id="color-theme" className="custom-select">
                  <SelectValue placeholder="Select color theme" />
                </SelectTrigger>
                <SelectContent>
                  {['neon', 'cyber', 'pastel', 'dark', 'rainbow'].map(theme => (
                    <SelectItem key={theme} value={theme}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="show-legend" 
                checked={chartState.showLegend} 
                onCheckedChange={(checked) => handleChartStateChange('showLegend', !!checked)}
                className="accent-primary"
              />
              <Label htmlFor="show-legend" className="text-sm text-primary/80">Show Legend</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-data-labels" 
                checked={chartState.showDataLabels} 
                onCheckedChange={(checked) => handleChartStateChange('showDataLabels', !!checked)}
                className="accent-primary"
              />
              <Label htmlFor="show-data-labels" className="text-sm text-primary/80">Show Data Labels</Label>
            </div>
            
            {/* The "Generate Chart" button can be removed if charts update live or on option change */}
            {/* For now, we assume live updates or updates handled by DataVisualizationChart component */}
          </div>
        </ScrollArea>
      </div>

      <div className="lg:col-span-2 bg-cyan-900/20 rounded-lg p-4">
        <h3 className="text-lg font-tech text-primary mb-4">Visualization</h3>
        <div className="chart-container-wrapper">
          <DataVisualizationChart 
            parsedData={parsedData}
            chartConfig={chartState}
          />
        </div>
      </div>
    </div>
  );
}
