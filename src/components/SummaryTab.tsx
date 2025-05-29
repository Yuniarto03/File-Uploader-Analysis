
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import type { Header, ParsedRow, ColumnStats, CustomSummaryState, CustomSummaryData, AggregationType } from '@/types'; // AIInsight removed
import LoadingSpinner from './LoadingSpinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Textarea } from '@/components/ui/textarea'; // Removed for AI
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Cog } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";


interface SummaryInfoCardProps {
  title: string;
  value: string | number;
  description?: string;
}

const SummaryInfoCard: React.FC<SummaryInfoCardProps> = ({ title, value, description }) => (
  <div className="bg-cyan-900/20 rounded-lg p-4 hex-border">
    <h3 className="text-md font-tech text-primary mb-1 truncate">{title}</h3>
    <p className="text-2xl font-semibold text-foreground mb-1">{value}</p>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);

const NO_FILTER_COLUMN_PLACEHOLDER = "NO_FILTER_COLUMN";
const ALL_FILTER_VALUES_PLACEHOLDER = "ALL_FILTER_VALUES";

interface SummaryTabProps {
  parsedData: ParsedRow[];
  headers: Header[];
  // aiInsights: AIInsight[]; // Removed
  // isLoadingAiInsights: boolean; // Removed
  columnStats: ColumnStats[]; 
  // customAiPrompt: string; // Removed
  // setCustomAiPrompt: (prompt: string) => void; // Removed
  // onRegenerateInsights: () => Promise<void>; // Removed
  customSummaryState: CustomSummaryState;
  setCustomSummaryState: (state: CustomSummaryState | ((prevState: CustomSummaryState) => CustomSummaryState)) => void;
  customSummaryData: CustomSummaryData | null;
  onGenerateCustomSummary: () => void;
  numericHeaders: Header[];
}

export default function SummaryTab({ 
  parsedData, 
  headers, 
  // aiInsights, // Removed
  // isLoadingAiInsights, // Removed
  columnStats,
  // customAiPrompt, // Removed
  // setCustomAiPrompt, // Removed
  // onRegenerateInsights, // Removed
  customSummaryState,
  setCustomSummaryState,
  customSummaryData,
  onGenerateCustomSummary,
  numericHeaders,
}: SummaryTabProps) {

  const [uniqueFilterValuesSummary1, setUniqueFilterValuesSummary1] = useState<string[]>([]);
  const [uniqueFilterValuesSummary2, setUniqueFilterValuesSummary2] = useState<string[]>([]);


  const handleSummaryStateChange = (field: keyof CustomSummaryState, value: any) => {
    setCustomSummaryState(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'filterColumn1' && newState.filterColumn1 !== prev.filterColumn1) {
        newState.filterValue1 = ''; 
      }
      if (field === 'filterColumn2' && newState.filterColumn2 !== prev.filterColumn2) {
        newState.filterValue2 = '';
      }
      return newState;
    });
  };
  
  const aggregationOptions: { value: AggregationType, label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'unique', label: 'Unique Count' },
    { value: 'sdev', label: 'Standard Deviation' },
  ];

  useEffect(() => {
    if (headers.length > 0) {
      setCustomSummaryState(prev => {
        const newRowsField = prev.rowsField || headers[0] || '';
        const newColumnsField = prev.columnsField || (headers.length > 1 ? headers[1] : headers[0]) || '';
        const newValuesField = prev.valuesField && numericHeaders.includes(prev.valuesField) ? prev.valuesField : (numericHeaders[0] || '');
        
        if (newRowsField !== prev.rowsField || newColumnsField !== prev.columnsField || newValuesField !== prev.valuesField) {
          return {
            ...prev,
            rowsField: newRowsField,
            columnsField: newColumnsField,
            valuesField: newValuesField,
          };
        }
        return prev;
      });
    }
  }, [headers, numericHeaders, setCustomSummaryState]);

  useEffect(() => {
    if (customSummaryState.filterColumn1 && parsedData.length > 0) {
      const values = Array.from(new Set(parsedData.map(row => String(row[customSummaryState.filterColumn1!])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniqueFilterValuesSummary1(values.sort());
    } else {
      setUniqueFilterValuesSummary1([]);
    }
  }, [customSummaryState.filterColumn1, parsedData]);

  useEffect(() => {
    if (customSummaryState.filterColumn2 && parsedData.length > 0) {
      const values = Array.from(new Set(parsedData.map(row => String(row[customSummaryState.filterColumn2!])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniqueFilterValuesSummary2(values.sort());
    } else {
      setUniqueFilterValuesSummary2([]);
    }
  }, [customSummaryState.filterColumn2, parsedData]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryInfoCard title="Total Rows" value={parsedData.length.toLocaleString()} description="Number of records in the dataset." />
        <SummaryInfoCard title="Total Columns" value={headers.length.toLocaleString()} description="Number of features in the dataset."/>
        {columnStats.length > 0 && (
          <SummaryInfoCard 
            title="Numeric Columns" 
            value={columnStats.filter(stat => stat.type === 'Numeric').length} 
            description="Columns identified as numerical." 
          />
        )}
      </div>

      <Card className="bg-cyan-900/20 rounded-lg p-0 border-0 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-tech text-primary flex items-center">
            <Cog className="mr-2 h-5 w-5 text-primary" /> Custom Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="summary-rows" className="block text-sm font-medium text-primary/80 mb-1">Rows</Label>
              <Select 
                value={customSummaryState.rowsField} 
                onValueChange={(value) => handleSummaryStateChange('rowsField', value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="summary-rows" className="custom-select">
                  <SelectValue placeholder="Select row field" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={`sum-row-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="summary-columns" className="block text-sm font-medium text-primary/80 mb-1">Columns</Label>
              <Select 
                value={customSummaryState.columnsField} 
                onValueChange={(value) => handleSummaryStateChange('columnsField', value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="summary-columns" className="custom-select">
                  <SelectValue placeholder="Select column field" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={`sum-col-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="summary-values" className="block text-sm font-medium text-primary/80 mb-1">Values (Numeric)</Label>
              <Select 
                value={customSummaryState.valuesField} 
                onValueChange={(value) => handleSummaryStateChange('valuesField', value)}
                disabled={numericHeaders.length === 0}
              >
                <SelectTrigger id="summary-values" className="custom-select">
                  <SelectValue placeholder="Select value field" />
                </SelectTrigger>
                <SelectContent>
                  {numericHeaders.map(header => (
                    <SelectItem key={`sum-val-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="summary-agg" className="block text-sm font-medium text-primary/80 mb-1">Aggregation</Label>
              <Select 
                value={customSummaryState.aggregation} 
                onValueChange={(value) => handleSummaryStateChange('aggregation', value as AggregationType)}
                disabled={!customSummaryState.valuesField}
              >
                <SelectTrigger id="summary-agg" className="custom-select">
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  {aggregationOptions.map(agg => (
                    <SelectItem key={agg.value} value={agg.value}>{agg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters for Custom Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="summary-filter-column1" className="block text-sm font-medium text-primary/80 mb-1">Filter By 1 (Optional)</Label>
              <Select
                value={customSummaryState.filterColumn1 || NO_FILTER_COLUMN_PLACEHOLDER}
                onValueChange={(value) => handleSummaryStateChange('filterColumn1', value === NO_FILTER_COLUMN_PLACEHOLDER ? '' : value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="summary-filter-column1" className="custom-select">
                  <SelectValue placeholder="No column filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FILTER_COLUMN_PLACEHOLDER}>No column filter</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`sum-filter-col1-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="summary-filter-value1" className="block text-sm font-medium text-primary/80 mb-1">Filter Value 1 (Optional)</Label>
              <Select
                value={customSummaryState.filterValue1 || ALL_FILTER_VALUES_PLACEHOLDER}
                onValueChange={(value) => handleSummaryStateChange('filterValue1', value === ALL_FILTER_VALUES_PLACEHOLDER ? '' : value)}
                disabled={!customSummaryState.filterColumn1 || uniqueFilterValuesSummary1.length === 0}
              >
                <SelectTrigger id="summary-filter-value1" className="custom-select">
                  <SelectValue placeholder="All values" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUES_PLACEHOLDER}>All values</SelectItem>
                  {uniqueFilterValuesSummary1.map(val => (
                    <SelectItem key={`sum-filter-val1-${val}`} value={val}>{String(val)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="summary-filter-column2" className="block text-sm font-medium text-primary/80 mb-1">Filter By 2 (Optional)</Label>
              <Select
                value={customSummaryState.filterColumn2 || NO_FILTER_COLUMN_PLACEHOLDER}
                onValueChange={(value) => handleSummaryStateChange('filterColumn2', value === NO_FILTER_COLUMN_PLACEHOLDER ? '' : value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="summary-filter-column2" className="custom-select">
                  <SelectValue placeholder="No column filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FILTER_COLUMN_PLACEHOLDER}>No column filter</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`sum-filter-col2-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="summary-filter-value2" className="block text-sm font-medium text-primary/80 mb-1">Filter Value 2 (Optional)</Label>
              <Select
                value={customSummaryState.filterValue2 || ALL_FILTER_VALUES_PLACEHOLDER}
                onValueChange={(value) => handleSummaryStateChange('filterValue2', value === ALL_FILTER_VALUES_PLACEHOLDER ? '' : value)}
                disabled={!customSummaryState.filterColumn2 || uniqueFilterValuesSummary2.length === 0}
              >
                <SelectTrigger id="summary-filter-value2" className="custom-select">
                  <SelectValue placeholder="All values" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUES_PLACEHOLDER}>All values</SelectItem>
                  {uniqueFilterValuesSummary2.map(val => (
                    <SelectItem key={`sum-filter-val2-${val}`} value={val}>{String(val)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={onGenerateCustomSummary}
            disabled={!customSummaryState.rowsField || !customSummaryState.columnsField || !customSummaryState.valuesField || headers.length === 0}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-tech btn-shine"
          >
            Generate Summary
          </Button>

          {customSummaryData && (
            <div className="mt-6">
              <h4 className="text-md font-tech text-primary glow-text mb-2">
                Summary: {customSummaryData.aggregationType.toUpperCase()} of {customSummaryData.valueFieldName}
              </h4>
              <ScrollArea className="h-[400px] w-full">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-cyan-800/30 whitespace-nowrap">{customSummaryState.rowsField} / {customSummaryState.columnsField}</TableHead>
                      {customSummaryData.columnValues.map(colVal => (
                        <TableHead key={colVal} className="whitespace-nowrap">{colVal}</TableHead>
                      ))}
                      <TableHead className="bg-cyan-800/30 whitespace-nowrap">Row Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customSummaryData.rowValues.map(rowVal => (
                      <TableRow key={rowVal}>
                        <TableHead className="whitespace-nowrap">{rowVal}</TableHead>
                        {customSummaryData.columnValues.map(colVal => (
                          <TableCell key={`${rowVal}-${colVal}`} className="whitespace-nowrap font-tech text-primary">
                            {typeof customSummaryData.data[rowVal]?.[colVal] === 'number' 
                              ? (customSummaryData.data[rowVal]?.[colVal] as number).toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                              : customSummaryData.data[rowVal]?.[colVal] ?? '-'}
                          </TableCell>
                        ))}
                        <TableCell className="bg-cyan-800/30 font-medium whitespace-nowrap font-tech text-primary">
                           {typeof customSummaryData.rowTotals[rowVal] === 'number'
                              ? (customSummaryData.rowTotals[rowVal] as number).toLocaleString(undefined, { maximumFractionDigits: 2 })
                              : customSummaryData.rowTotals[rowVal] ?? '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableHead className="bg-cyan-800/30 whitespace-nowrap">Column Total</TableHead>
                      {customSummaryData.columnValues.map(colVal => (
                        <TableCell key={`total-${colVal}`} className="bg-cyan-800/30 font-medium whitespace-nowrap font-tech text-primary">
                          {typeof customSummaryData.columnTotals[colVal] === 'number'
                            ? (customSummaryData.columnTotals[colVal] as number).toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : customSummaryData.columnTotals[colVal] ?? '-'}
                        </TableCell>
                      ))}
                      <TableCell className="bg-cyan-700/50 font-bold whitespace-nowrap font-tech text-primary">
                        {typeof customSummaryData.grandTotal === 'number'
                          ? (customSummaryData.grandTotal as number).toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : customSummaryData.grandTotal}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
          {!customSummaryData && headers.length > 0 && (
             <p className="text-center py-4 text-muted-foreground">
                Configure summary options and click "Generate Summary".
             </p>
          )}
           {!customSummaryData && headers.length === 0 && (
             <p className="text-center py-4 text-muted-foreground">
                Upload data to generate a custom summary.
             </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
