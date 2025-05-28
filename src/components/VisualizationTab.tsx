
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Header, ParsedRow, ChartState, ChartAggregationType } from '@/types';
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

  const allHeadersIncludingNonNumeric = headers;

  const [uniqueFilterValues, setUniqueFilterValues] = useState<string[]>([]);
  const [uniqueFilterValues2, setUniqueFilterValues2] = useState<string[]>([]);

  useEffect(() => {
    if (chartState.filterColumn && parsedData.length > 0) {
      const values = Array.from(new Set(parsedData.map(row => String(row[chartState.filterColumn])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniqueFilterValues(values.sort());
    } else {
      setUniqueFilterValues([]);
    }
  }, [chartState.filterColumn, parsedData]);

  useEffect(() => {
    if (chartState.filterColumn2 && parsedData.length > 0) {
      const values = Array.from(new Set(parsedData.map(row => String(row[chartState.filterColumn2])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniqueFilterValues2(values.sort());
    } else {
      setUniqueFilterValues2([]);
    }
  }, [chartState.filterColumn2, parsedData]);


  const handleChartStateChange = (field: keyof ChartState, value: any) => {
    setChartState(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'filterColumn') {
        newState.filterValue = ''; 
      }
      if (field === 'filterColumn2') {
        newState.filterValue2 = ''; 
      }
      if (field === 'chartType' && value === 'scatter') {
        newState.yAxisAggregation = 'avg'; 
      }
      if (field === 'yAxisAggregation' && ['count', 'unique'].includes(value) && prev.yAxis && !allHeadersIncludingNonNumeric.includes(prev.yAxis)) {
        newState.yAxis = allHeadersIncludingNonNumeric[0] || '';
      } else if (field === 'yAxisAggregation' && ['sum', 'avg', 'min', 'max', 'sdev'].includes(value) && prev.yAxis && !numericHeaders.includes(prev.yAxis)) {
        newState.yAxis = '';
      }
      return newState;
    });
  };
  
  React.useEffect(() => {
    if (headers.length > 0 && chartState.xAxis === '') {
      handleChartStateChange('xAxis', headers[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  const yAxisOptions = useMemo(() => {
    if (['count', 'unique'].includes(chartState.yAxisAggregation)) {
      return allHeadersIncludingNonNumeric;
    }
    return numericHeaders;
  }, [chartState.yAxisAggregation, allHeadersIncludingNonNumeric, numericHeaders]);

  const chartAggregationOptions: { value: ChartAggregationType, label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'unique', label: 'Unique Count' },
    { value: 'sdev', label: 'Standard Deviation' },
  ];

  const canDisplayChart = chartState.xAxis && chartState.yAxis && parsedData.length > 0 && (yAxisOptions.includes(chartState.yAxis) || (yAxisOptions.length > 0 && chartState.yAxis !== ''));

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
              <Label htmlFor="y-axis-aggregation" className="block text-sm font-medium text-primary/80 mb-1">Y-Axis Aggregation</Label>
              <Select
                value={chartState.yAxisAggregation}
                onValueChange={(value) => handleChartStateChange('yAxisAggregation', value as ChartAggregationType)}
                disabled={chartState.chartType === 'scatter'}
              >
                <SelectTrigger id="y-axis-aggregation" className="custom-select">
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  {chartAggregationOptions.map(agg => (
                    <SelectItem key={agg.value} value={agg.value}>
                      {agg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="y-axis" className="block text-sm font-medium text-primary/80 mb-1">
                Y-Axis ({['count', 'unique'].includes(chartState.yAxisAggregation) ? 'Any Field' : 'Numeric'})
              </Label>
              <Select 
                value={chartState.yAxis} 
                onValueChange={(value) => handleChartStateChange('yAxis', value)}
                disabled={yAxisOptions.length === 0 || chartState.chartType === 'scatter'}
              >
                <SelectTrigger id="y-axis" className="custom-select">
                  <SelectValue placeholder={`Select Y-axis (${['count', 'unique'].includes(chartState.yAxisAggregation) ? 'any field' : 'numeric'})`} />
                </SelectTrigger>
                <SelectContent>
                  {yAxisOptions.map(header => (
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

      <div className="lg:col-span-2 bg-cyan-900/20 rounded-lg p-4 flex flex-col space-y-6">
        {/* Chart 1 Section */}
        <div className="flex-1 flex flex-col min-h-[350px]"> {/* Ensure flex-1 and min-height for chart sections */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-tech text-primary">Visualization 1</h3>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onOpenChartModal} 
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary glow"
              title="Zoom Chart 1"
              disabled={!canDisplayChart}
            >
              <Maximize className="h-5 w-5" />
              <span className="sr-only">Zoom Chart 1</span>
            </Button>
          </div>
          <div className="chart-container-wrapper flex-grow">
           {canDisplayChart ? (
              <DynamicDataVisualizationChart 
                parsedData={parsedData}
                chartConfig={chartState}
                chartId="data-sphere-chart-1"
              />
            ) : (
               <div className="flex items-center justify-center h-full text-muted-foreground text-center p-4">
                  Please select valid X-axis, Y-axis, and Y-axis Aggregation.
                  For Sum, Average, Min, Max, or SDev aggregation, the Y-axis must be a numeric field.
                  Filters applied may also result in no data.
               </div>
            )}
          </div>
        </div>

        {/* Chart 2 Section */}
        <div className="flex-1 flex flex-col min-h-[350px]"> {/* Ensure flex-1 and min-height for chart sections */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-tech text-primary">Visualization 2</h3>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onOpenChartModal} // This will open the modal with the same config as chart 1 for now
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary glow"
              title="Zoom Chart 2"
              disabled={!canDisplayChart}
            >
              <Maximize className="h-5 w-5" />
              <span className="sr-only">Zoom Chart 2</span>
            </Button>
          </div>
          <div className="chart-container-wrapper flex-grow">
           {canDisplayChart ? (
              <DynamicDataVisualizationChart 
                parsedData={parsedData}
                chartConfig={chartState} // Uses the same chartState as Chart 1
                chartId="data-sphere-chart-2"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-center p-4">
                (Configure Chart Settings to see Visualization 2)
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Filters Section */}
        <div className="pt-4 border-t border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-column-2" className="block text-sm font-medium text-primary/80 mb-1">Additional Filter By (Optional)</Label>
                  <Select
                    value={chartState.filterColumn2}
                    onValueChange={(value) => handleChartStateChange('filterColumn2', value === 'NO_FILTER_COLUMN_2' ? '' : value)}
                    disabled={headers.length === 0}
                  >
                    <SelectTrigger id="filter-column-2" className="custom-select">
                      <SelectValue placeholder="No additional filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_FILTER_COLUMN_2">No additional filter</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={`filter-col-2-${header}`} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-value-2" className="block text-sm font-medium text-primary/80 mb-1">Additional Filter Value (Optional)</Label>
                  <Select
                    value={chartState.filterValue2}
                    onValueChange={(value) => handleChartStateChange('filterValue2', value === 'ALL_FILTER_VALUES_2' ? '' : value)}
                    disabled={!chartState.filterColumn2 || uniqueFilterValues2.length === 0}
                  >
                    <SelectTrigger id="filter-value-2" className="custom-select">
                      <SelectValue placeholder="All values" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_FILTER_VALUES_2">All values</SelectItem>
                      {uniqueFilterValues2.map(val => (
                        <SelectItem key={`filter-val-2-${val}`} value={val}>{String(val)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
