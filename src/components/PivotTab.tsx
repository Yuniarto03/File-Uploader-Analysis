
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { Header, ParsedRow, PivotState, PivotTableData } from '@/types';
import { generatePivotData } from '@/lib/data-helpers';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface PivotTabProps {
  parsedData: ParsedRow[];
  headers: Header[];
  pivotState: PivotState;
  setPivotState: (state: PivotState | ((prevState: PivotState) => PivotState)) => void;
}

const NO_FILTER_COLUMN_PLACEHOLDER = "NO_FILTER_COLUMN_PLACEHOLDER";
const ALL_FILTER_VALUES_PLACEHOLDER = "ALL_FILTER_VALUES_PLACEHOLDER";

export default function PivotTab({ parsedData, headers, pivotState, setPivotState }: PivotTabProps) {
  const [pivotTableData, setPivotTableData] = useState<PivotTableData | null>(null);
  const [uniquePivotFilterValues, setUniquePivotFilterValues] = useState<string[]>([]);
  const [uniquePivotFilterValues2, setUniquePivotFilterValues2] = useState<string[]>([]);


  const numericHeaders = useMemo(() => 
    headers.filter(header => 
      parsedData.length > 0 && parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    ), [headers, parsedData]);

  useEffect(() => {
    if (pivotState.filterColumn && parsedData.length > 0) {
      const values = Array.from(new Set(parsedData.map(row => String(row[pivotState.filterColumn!])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniquePivotFilterValues(values.sort());
    } else {
      setUniquePivotFilterValues([]);
    }
  }, [pivotState.filterColumn, parsedData]);

  useEffect(() => {
    if (pivotState.filterColumn2 && parsedData.length > 0) {
      const values = Array.from(new Set(parsedData.map(row => String(row[pivotState.filterColumn2!])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniquePivotFilterValues2(values.sort());
    } else {
      setUniquePivotFilterValues2([]);
    }
  }, [pivotState.filterColumn2, parsedData]);

  const handlePivotStateChange = (field: keyof PivotState, value: string) => {
    setPivotState(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'filterColumn' && newState.filterColumn !== prev.filterColumn) {
        newState.filterValue = ''; // Reset filter value when filter column changes
      }
      if (field === 'filterColumn2' && newState.filterColumn2 !== prev.filterColumn2) {
        newState.filterValue2 = ''; // Reset filter value 2 when filter column 2 changes
      }
      return newState;
    });
  };
  
  useEffect(() => {
    if (headers.length > 0 && pivotState.rows === '') {
        handlePivotStateChange('rows', headers[0]);
    }
    if (headers.length > 0 && pivotState.columns === '') {
        handlePivotStateChange('columns', headers.length > 1 ? headers[1] : headers[0]);
    }
    if (numericHeaders.length > 0 && pivotState.values === '') {
       if (!numericHeaders.includes(pivotState.values)) {
        handlePivotStateChange('values', numericHeaders[0]);
      }
    } else if (numericHeaders.length === 0 && pivotState.values !== '') {
      handlePivotStateChange('values', '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, numericHeaders, pivotState.rows, pivotState.columns, pivotState.values]);


  const handleGeneratePivot = () => {
    if (pivotState.rows && pivotState.columns && pivotState.values && numericHeaders.includes(pivotState.values)) {
      const data = generatePivotData(
        parsedData, 
        pivotState.rows, 
        pivotState.columns, 
        pivotState.values, 
        pivotState.aggregation,
        pivotState.filterColumn,
        pivotState.filterValue,
        pivotState.filterColumn2,
        pivotState.filterValue2
      );
      setPivotTableData(data);
    } else {
      // TODO: Add toast notification for missing or invalid fields
      console.warn("Please select row, column, and a valid numeric value field for the pivot table.");
      setPivotTableData(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-cyan-900/20 rounded-lg p-4">
        <h3 className="text-lg font-tech text-primary mb-4">Pivot Settings</h3>
        <ScrollArea className="h-[calc(100vh-300px)] pr-3">
          <div className="space-y-4">
            <div>
              <Label htmlFor="pivot-rows" className="block text-sm font-medium text-primary/80 mb-1">Rows</Label>
              <Select 
                value={pivotState.rows} 
                onValueChange={(value) => handlePivotStateChange('rows', value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="pivot-rows" className="custom-select">
                  <SelectValue placeholder="Select row field" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={`row-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pivot-columns" className="block text-sm font-medium text-primary/80 mb-1">Columns</Label>
              <Select 
                value={pivotState.columns} 
                onValueChange={(value) => handlePivotStateChange('columns', value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="pivot-columns" className="custom-select">
                  <SelectValue placeholder="Select column field" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={`col-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pivot-values" className="block text-sm font-medium text-primary/80 mb-1">Values (Numeric)</Label>
              <Select 
                value={pivotState.values} 
                onValueChange={(value) => handlePivotStateChange('values', value)}
                disabled={numericHeaders.length === 0}
              >
                <SelectTrigger id="pivot-values" className="custom-select">
                  <SelectValue placeholder="Select value field" />
                </SelectTrigger>
                <SelectContent>
                  {numericHeaders.map(header => (
                    <SelectItem key={`val-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pivot-agg" className="block text-sm font-medium text-primary/80 mb-1">Aggregation</Label>
              <Select 
                value={pivotState.aggregation} 
                onValueChange={(value) => handlePivotStateChange('aggregation', value)}
              >
                <SelectTrigger id="pivot-agg" className="custom-select">
                  <SelectValue placeholder="Select aggregation type" />
                </SelectTrigger>
                <SelectContent>
                  {['sum', 'avg', 'count', 'min', 'max'].map(agg => (
                    <SelectItem key={agg} value={agg}>{agg.charAt(0).toUpperCase() + agg.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pivot-filter-column" className="block text-sm font-medium text-primary/80 mb-1">Filter By (Optional)</Label>
              <Select
                value={pivotState.filterColumn || NO_FILTER_COLUMN_PLACEHOLDER}
                onValueChange={(value) => handlePivotStateChange('filterColumn', value === NO_FILTER_COLUMN_PLACEHOLDER ? '' : value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="pivot-filter-column" className="custom-select">
                  <SelectValue placeholder="No column filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FILTER_COLUMN_PLACEHOLDER}>No column filter</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`pivot-filter-col-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pivot-filter-value" className="block text-sm font-medium text-primary/80 mb-1">Filter Value (Optional)</Label>
              <Select
                value={pivotState.filterValue || ALL_FILTER_VALUES_PLACEHOLDER}
                onValueChange={(value) => handlePivotStateChange('filterValue', value === ALL_FILTER_VALUES_PLACEHOLDER ? '' : value)}
                disabled={!pivotState.filterColumn || uniquePivotFilterValues.length === 0}
              >
                <SelectTrigger id="pivot-filter-value" className="custom-select">
                  <SelectValue placeholder="All values" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUES_PLACEHOLDER}>All values</SelectItem>
                  {uniquePivotFilterValues.map(val => (
                    <SelectItem key={`pivot-filter-val-${val}`} value={val}>{String(val)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pivot-filter-column-2" className="block text-sm font-medium text-primary/80 mb-1">Additional Filter By (Optional)</Label>
              <Select
                value={pivotState.filterColumn2 || NO_FILTER_COLUMN_PLACEHOLDER}
                onValueChange={(value) => handlePivotStateChange('filterColumn2', value === NO_FILTER_COLUMN_PLACEHOLDER ? '' : value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="pivot-filter-column-2" className="custom-select">
                  <SelectValue placeholder="No additional filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FILTER_COLUMN_PLACEHOLDER}>No additional filter</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={`pivot-filter-col-2-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pivot-filter-value-2" className="block text-sm font-medium text-primary/80 mb-1">Additional Filter Value (Optional)</Label>
              <Select
                value={pivotState.filterValue2 || ALL_FILTER_VALUES_PLACEHOLDER}
                onValueChange={(value) => handlePivotStateChange('filterValue2', value === ALL_FILTER_VALUES_PLACEHOLDER ? '' : value)}
                disabled={!pivotState.filterColumn2 || uniquePivotFilterValues2.length === 0}
              >
                <SelectTrigger id="pivot-filter-value-2" className="custom-select">
                  <SelectValue placeholder="All values" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUES_PLACEHOLDER}>All values</SelectItem>
                  {uniquePivotFilterValues2.map(val => (
                    <SelectItem key={`pivot-filter-val-2-${val}`} value={val}>{String(val)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button 
                id="generate-pivot" 
                onClick={handleGeneratePivot}
                className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-tech btn-shine"
                disabled={!pivotState.rows || !pivotState.columns || !pivotState.values || !numericHeaders.includes(pivotState.values)}
              >
                GENERATE PIVOT
              </Button>
            </div>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      <div className="lg:col-span-2 bg-cyan-900/20 rounded-lg p-4">
        <h3 className="text-lg font-tech text-primary mb-4">Pivot Table</h3>
        <ScrollArea className="max-h-[calc(100vh-220px)]" id="pivot-table-container">
          {pivotTableData ? (
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-cyan-800/30">{pivotState.rows} / {pivotState.columns}</TableHead>
                  {pivotTableData.columnValues.map(colVal => (
                    <TableHead key={colVal}>{colVal}</TableHead>
                  ))}
                  <TableHead className="bg-cyan-800/30">Row Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pivotTableData.rowValues.map(rowVal => (
                  <TableRow key={rowVal}>
                    <TableHead>{rowVal}</TableHead>
                    {pivotTableData.columnValues.map(colVal => (
                      <TableCell key={`${rowVal}-${colVal}`}>
                        {pivotTableData.data[rowVal]?.[colVal]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 0}
                      </TableCell>
                    ))}
                    <TableCell className="bg-cyan-800/30 font-medium">
                      {pivotTableData.rowTotals[rowVal]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableHead className="bg-cyan-800/30">Column Total</TableHead>
                  {pivotTableData.columnValues.map(colVal => (
                    <TableCell key={`total-${colVal}`} className="bg-cyan-800/30 font-medium">
                      {pivotTableData.columnTotals[colVal]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 0}
                    </TableCell>
                  ))}
                  <TableCell className="bg-cyan-700/50 font-bold">
                    {pivotTableData.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Configure and generate a pivot table to see results.</p>
            </div>
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
