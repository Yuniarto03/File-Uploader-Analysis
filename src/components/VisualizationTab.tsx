
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Header, ParsedRow, ChartState } from '@/types';
import { ScrollArea } from './ui/scroll-area';
import { Maximize } from 'lucide-react'; 
import LoadingSpinner from './LoadingSpinner';

const DynamicDataVisualizationChart = dynamic(
  () => import('@/components/DataVisualizationChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner /> 
        <p className="ml-2 font-tech text-primary">Loading Chart...</p>
      </div>
    )
  }
);

interface VisualizationTabProps {
  parsedData: ParsedRow[];
  headers: Header[];
  chartState: ChartState;
  setChartState: (state: ChartState | ((prevState: ChartState) => ChartState)) => void;
  onOpenChartModal: () => void; 
}

export default function VisualizationTab({ 
  parsedData, 
  headers, 
  chartState, 
  setChartState, 
  onOpenChartModal 
}: VisualizationTabProps) {
  
  const numericHeaders = useMemo(() => 
    headers.filter(header => 
      parsedData.length > 0 && parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    ), [headers, parsedData]);

  const [uniqueFilterValues, setUniqueFilterValues] = useState<string[]>([]);

  useEffect(() => {
    if (chartState.filterColumn && parsedData.length > 0) {
      const values = Array.from(new Set(parsedData.map(row => String(row[chartState.filterColumn])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniqueFilterValues(values.sort());
    } else {
      setUniqueFilterValues([]);
    }
  }, [chartState.filterColumn, parsedData]);


  const handleChartStateChange = (field: keyof ChartState, value: any) => {
    setChartState(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'filterColumn') {
        newState.filterValue = ''; // Reset filter value when filter column changes
      }
      return newState;
    });
  };
  
  // Effect to set initial sensible defaults if no selection is made and data is available
  React.useEffect(() => {
    if (headers.length > 0 && chartState.xAxis === '') {
      handleChartStateChange('xAxis', headers[0]);
    }
    // Ensure Y-axis defaults to a numeric header if available and not yet set
    if (numericHeaders.length > 0 && chartState.yAxis === '') {
       // Check if current yAxis is still valid, if not, reset or pick first numeric
       if (!numericHeaders.includes(chartState.yAxis)) {
        handleChartStateChange('yAxis', numericHeaders[0]);
      }
    } else if (numericHeaders.length === 0 && chartState.yAxis !== '') {
      // If no numeric headers available, clear yAxis selection
      handleChartStateChange('yAxis', '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, numericHeaders]); // Dependencies intentionally limited to avoid re-triggering on chartState changes by this effect


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-cyan-900/20 rounded-lg p-4">
        <h3 className="text-lg font-tech text-primary mb-4">Chart Settings</h3>
        <ScrollArea className="h-[calc(100vh-300px)] pr-3"> 
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
                  {['bar', 'line', 'area', 'pie', 'scatter', 'radar', 'polarArea'].map(type => (
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
                    <SelectItem key={`x-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="y-axis" className="block text-sm font-medium text-primary/80 mb-1">Y-Axis (Numeric)</Label>
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
                    <SelectItem key={`y-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filter-column" className="block text-sm font-medium text-primary/80 mb-1">Filter By (Optional)</Label>
              <Select
                value={chartState.filterColumn}
                onValueChange={(value) => handleChartStateChange('filterColumn', value === 'NO_FILTER_COLUMN' ? '' : value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="filter-column" className="custom-select">
                  <SelectValue placeholder="No column filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_FILTER_COLUMN">No column filter</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`filter-col-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-value" className="block text-sm font-medium text-primary/80 mb-1">Filter Value (Optional)</Label>
              <Select
                value={chartState.filterValue}
                onValueChange={(value) => handleChartStateChange('filterValue', value === 'ALL_FILTER_VALUES' ? '' : value)}
                disabled={!chartState.filterColumn || uniqueFilterValues.length === 0}
              >
                <SelectTrigger id="filter-value" className="custom-select">
                  <SelectValue placeholder="All values" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_FILTER_VALUES">All values</SelectItem>
                  {uniqueFilterValues.map(val => (
                    <SelectItem key={`filter-val-${val}`} value={val}>{String(val)}</SelectItem>
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
          </div>
        </ScrollArea>
      </div>

      <div className="lg:col-span-2 bg-cyan-900/20 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-tech text-primary">Visualization</h3>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onOpenChartModal} 
            className="border-primary text-primary hover:bg-primary/10 hover:text-primary glow"
            title="Zoom Chart"
            disabled={!chartState.xAxis || !chartState.yAxis || parsedData.length === 0 || numericHeaders.length === 0}
          >
            <Maximize className="h-5 w-5" />
            <span className="sr-only">Zoom Chart</span>
          </Button>
        </div>
        <div className="chart-container-wrapper">
         {chartState.xAxis && chartState.yAxis && parsedData.length > 0 && numericHeaders.includes(chartState.yAxis) ? (
            <DynamicDataVisualizationChart 
              parsedData={parsedData}
              chartConfig={chartState}
            />
          ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground">
                Please select valid X and Y (numeric) axes. Or, if filters are applied, they may result in no data.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

