
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { Header, ParsedRow, PivotState, PivotTableData } from '@/types';
import { generatePivotData } from '@/lib/data-helpers';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // MODIFIED: Added ScrollBar

interface PivotTabProps {
  parsedData: ParsedRow[];
  headers: Header[];
  pivotState: PivotState;
  setPivotState: (state: PivotState | ((prevState: PivotState) => PivotState)) => void;
}

export default function PivotTab({ parsedData, headers, pivotState, setPivotState }: PivotTabProps) {
  const [pivotTableData, setPivotTableData] = useState<PivotTableData | null>(null);

  const numericHeaders = useMemo(() => 
    headers.filter(header => 
      parsedData.length > 0 && parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    ), [headers, parsedData]);

  const handlePivotStateChange = (field: keyof PivotState, value: string) => {
    setPivotState(prev => ({ ...prev, [field]: value }));
  };
  
  useEffect(() => {
    if (headers.length > 0 && !pivotState.rows) {
        handlePivotStateChange('rows', headers[0]);
    }
    if (headers.length > 1 && !pivotState.columns) {
        handlePivotStateChange('columns', headers[1]);
    } else if (headers.length > 0 && !pivotState.columns) {
        handlePivotStateChange('columns', headers[0]);
    }
    if (numericHeaders.length > 0 && !pivotState.values) {
        handlePivotStateChange('values', numericHeaders[0] || '');
    }
  }, [headers, numericHeaders, pivotState.rows, pivotState.columns, pivotState.values]);


  const handleGeneratePivot = () => {
    if (pivotState.rows && pivotState.columns && pivotState.values) {
      const data = generatePivotData(parsedData, pivotState.rows, pivotState.columns, pivotState.values, pivotState.aggregation);
      setPivotTableData(data);
    } else {
      // TODO: Add toast notification for missing fields
      console.warn("Please select row, column, and value fields for the pivot table.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-cyan-900/20 rounded-lg p-4">
        <h3 className="text-lg font-tech text-primary mb-4">Pivot Settings</h3>
        <ScrollArea className="h-[calc(100vh-300px)] pr-3"> {/* Adjusted height */}
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
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  {['sum', 'avg', 'count', 'min', 'max'].map(agg => (
                    <SelectItem key={agg} value={agg}>{agg.charAt(0).toUpperCase() + agg.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button 
                id="generate-pivot" 
                onClick={handleGeneratePivot}
                className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-tech btn-shine"
                disabled={!pivotState.rows || !pivotState.columns || !pivotState.values}
              >
                GENERATE PIVOT
              </Button>
            </div>
          </div>
          <ScrollBar orientation="horizontal" /> {/* MODIFIED: Added horizontal scrollbar */}
        </ScrollArea>
      </div>

      <div className="lg:col-span-2 bg-cyan-900/20 rounded-lg p-4">
        <h3 className="text-lg font-tech text-primary mb-4">Pivot Table</h3>
        <ScrollArea className="max-h-[calc(100vh-220px)]" id="pivot-table-container"> {/* Adjusted height */}
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
          <ScrollBar orientation="horizontal" /> {/* MODIFIED: Added horizontal scrollbar */}
        </ScrollArea>
      </div>
    </div>
  );
}
