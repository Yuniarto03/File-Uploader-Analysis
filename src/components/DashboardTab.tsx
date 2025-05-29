
"use client";

import React from 'react';
import type { Header, ParsedRow, ColumnStats, CustomSummaryData, ChartState } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, TableIcon, Info } from 'lucide-react'; // Lightbulb removed

interface DashboardTabProps {
  parsedData: ParsedRow[];
  headers: Header[];
  columnStats: ColumnStats[];
  customSummaryData: CustomSummaryData | null;
  chartState1: ChartState;
}

export default function DashboardTab({ // This component is currently not used. AIDataSummaryTab is used instead of a general Dashboard.
  parsedData,
  headers,
  columnStats,
  customSummaryData,
  chartState1,
}: DashboardTabProps) {
  const totalRows = parsedData.length;
  const totalColumns = headers.length;
  const numericColumnCount = columnStats.filter(stat => stat.type === 'Numeric').length;

  return (
    <div className="space-y-6">
      <Card className="bg-cyan-900/20 rounded-lg p-0 border-0 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-tech text-primary flex items-center">
            <Info className="mr-2 h-5 w-5" /> Dashboard Overview (Sample Structure)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-glass p-5 rounded-lg glow flex flex-col justify-between">
            <div>
              <h3 className="text-md font-tech text-accent mb-2 flex items-center">
                <TableIcon className="mr-2 h-5 w-5" /> Dataset Metrics
              </h3>
              <p className="text-2xl font-semibold text-foreground">{totalRows.toLocaleString()} <span className="text-sm font-normal text-primary/80">Rows</span></p>
              <p className="text-2xl font-semibold text-foreground">{totalColumns.toLocaleString()} <span className="text-sm font-normal text-primary/80">Columns</span></p>
              <p className="text-lg font-medium text-foreground mt-1">{numericColumnCount.toLocaleString()} <span className="text-sm font-normal text-primary/80">Numeric Columns</span></p>
            </div>
          </div>
          
          <div className="bg-glass p-5 rounded-lg glow flex flex-col justify-between">
            <div>
              <h3 className="text-md font-tech text-accent mb-2 flex items-center">
                 <BarChart2 className="mr-2 h-5 w-5" /> Chart 1 Configuration
              </h3>
              {chartState1.xAxis && chartState1.yAxis ? (
                <>
                  <p className="text-sm text-foreground/90">
                    Type: <span className="font-semibold text-primary">{chartState1.chartType.toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-foreground/90 truncate" title={chartState1.xAxis}>
                    X-Axis: <span className="font-semibold text-primary">{chartState1.xAxis}</span>
                  </p>
                  <p className="text-sm text-foreground/90 truncate" title={chartState1.yAxis}>
                    Y-Axis: <span className="font-semibold text-primary">{chartState1.yAxis}</span> ({chartState1.yAxisAggregation.toUpperCase()})
                  </p>
                  {(chartState1.filterColumn && chartState1.filterValue) && (
                     <p className="text-xs text-muted-foreground mt-1 truncate" title={`${chartState1.filterColumn}=${chartState1.filterValue}`}>Filter 1: {chartState1.filterColumn}={chartState1.filterValue}</p>
                  )}
                  {(chartState1.filterColumn2 && chartState1.filterValue2) && (
                     <p className="text-xs text-muted-foreground truncate" title={`${chartState1.filterColumn2}=${chartState1.filterValue2}`}>Filter 2: {chartState1.filterColumn2}={chartState1.filterValue2}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Chart 1 not configured. Visit Visualization tab.</p>
              )}
            </div>
          </div>

          {customSummaryData && (
             <div className="bg-glass p-5 rounded-lg glow flex flex-col justify-between md:col-span-2 lg:col-span-1">
                <div>
                    <h3 className="text-md font-tech text-accent mb-2 flex items-center">
                       Custom Summary
                    </h3>
                    <p className="text-sm text-foreground/90">
                        Type: <span className="font-semibold text-primary">{customSummaryData.aggregationType.toUpperCase()}</span> of <span className="font-semibold text-primary truncate" title={customSummaryData.valueFieldName}>{customSummaryData.valueFieldName}</span>
                    </p>
                    <p className="text-sm text-foreground/90">
                        Rows: <span className="font-semibold text-primary truncate" title={customSummaryData.rowsField}>{customSummaryData.rowsField}</span>
                    </p>
                    {customSummaryData.columnsField && customSummaryData.columnsField !== "_TOTAL_" && (
                        <p className="text-sm text-foreground/90">
                            Columns: <span className="font-semibold text-primary truncate" title={customSummaryData.columnsField}>{customSummaryData.columnsField}</span>
                        </p>
                    )}
                </div>
                <div>
                    <p className="text-2xl font-semibold text-foreground mt-2">{typeof customSummaryData.grandTotal === 'number' ? customSummaryData.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2}) : customSummaryData.grandTotal}</p>
                    <p className="text-xs text-muted-foreground">Grand Total</p>
                </div>
             </div>
          )}
           {!customSummaryData && (
             <div className="bg-glass p-5 rounded-lg glow flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-tech text-accent mb-2 flex items-center">
                    Data Snapshot
                  </h3>
                  <p className="text-sm text-muted-foreground">Summary or other data points can be shown here.</p>
                </div>
              </div>
           )}
        </CardContent>
      </Card>
      {parsedData.length > 0 && (
        <p className="text-center text-muted-foreground font-tech p-4 text-sm">
          This dashboard provides a quick glance. For detailed configurations, please visit the Summary and Visualization tabs.
        </p>
      )}
      {parsedData.length === 0 && (
         <p className="text-center text-muted-foreground font-tech p-8 text-lg">
            Upload a file to begin your DataSphere journey!
        </p>
      )}
    </div>
  );
}
