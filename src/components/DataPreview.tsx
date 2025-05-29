
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { Header, ParsedRow } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, FilterX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface DataPreviewProps {
  fileName: string;
  rowCount: number; // Total rows matching global search, before showAll/top5 toggle
  headers: Header[];
  previewData: ParsedRow[]; // Data passed after global search and showAll/top5 toggle
  originalDataForFilters: ParsedRow[]; // Full dataset for populating filter dropdowns accurately
  showAllData: boolean;
  onToggleShowAllData: () => void;
}

const NO_FILTER_COLUMN_PLACEHOLDER = "NO_FILTER_COLUMN_PREVIEW";
const ALL_FILTER_VALUES_PLACEHOLDER = "ALL_FILTER_VALUES_PREVIEW";

export default function DataPreview({
  fileName,
  rowCount,
  headers,
  previewData,
  originalDataForFilters,
  showAllData,
  onToggleShowAllData
}: DataPreviewProps) {
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);

  useEffect(() => {
    if (filterColumn && originalDataForFilters && originalDataForFilters.length > 0) {
      const values = Array.from(new Set(originalDataForFilters.map(row => String(row[filterColumn])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setUniqueValues(values.sort());
    } else {
      setUniqueValues([]);
    }
  }, [filterColumn, originalDataForFilters]);

  const handleFilterColumnChange = (newColumn: string) => {
    const effectiveNewColumn = newColumn === NO_FILTER_COLUMN_PLACEHOLDER ? '' : newColumn;
    setFilterColumn(effectiveNewColumn);
    setFilterValue(''); // Reset filter value when filter column changes
  };

  const handleFilterValueChange = (newValue: string) => {
    const effectiveNewValue = newValue === ALL_FILTER_VALUES_PLACEHOLDER ? '' : newValue;
    setFilterValue(effectiveNewValue);
  };
  
  const resetLocalFilters = () => {
    setFilterColumn('');
    setFilterValue('');
  };

  const locallyFilteredData = useMemo(() => {
    if (!filterColumn || !filterValue) {
      return previewData;
    }
    return previewData.filter(row => String(row[filterColumn]) === filterValue);
  }, [previewData, filterColumn, filterValue]);

  const displayedRowCount = locallyFilteredData.length;

  return (
    <section id="preview-section" className="bg-glass p-6 glow slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-tech text-primary glow-text">Data Preview</h2>
        <div className="flex flex-wrap items-center space-x-2">
          <span className="text-sm text-primary/80 bg-cyan-900/30 px-3 py-1 rounded-full font-mono">
            {fileName}
          </span>
          <span className="text-sm text-primary/80 bg-cyan-900/30 px-3 py-1 rounded-full font-mono">
            {rowCount.toLocaleString()} rows (global search)
          </span>
          {rowCount > 5 && ( 
            <Button
              onClick={onToggleShowAllData}
              variant="outline"
              size="sm"
              className="font-tech text-xs border-primary/50 text-primary/90 hover:bg-primary/10 hover:text-primary"
            >
              {showAllData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAllData ? "Show Top 5" : `Show All (${rowCount.toLocaleString()})`}
            </Button>
          )}
        </div>
      </div>

      {/* Local Filters for Data Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-end">
        <div>
          <Label htmlFor="preview-filter-column" className="block text-sm font-medium text-primary/80 mb-1">Filter Preview By</Label>
          <Select
            value={filterColumn || NO_FILTER_COLUMN_PLACEHOLDER}
            onValueChange={handleFilterColumnChange}
            disabled={headers.length === 0}
          >
            <SelectTrigger id="preview-filter-column" className="custom-select">
              <SelectValue placeholder="Select column to filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER_COLUMN_PLACEHOLDER}>- No Column Filter -</SelectItem>
              {headers.map(header => (
                <SelectItem key={`preview-filter-col-${header}`} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preview-filter-value" className="block text-sm font-medium text-primary/80 mb-1">Filter Preview Value</Label>
          <Select
            value={filterValue || ALL_FILTER_VALUES_PLACEHOLDER}
            onValueChange={handleFilterValueChange}
            disabled={!filterColumn || uniqueValues.length === 0}
          >
            <SelectTrigger id="preview-filter-value" className="custom-select">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUES_PLACEHOLDER}>- All Values -</SelectItem>
              {uniqueValues.map(val => (
                <SelectItem key={`preview-filter-val-${val}`} value={val}>{String(val)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(filterColumn || filterValue) && (
            <Button
                onClick={resetLocalFilters}
                variant="outline"
                size="sm"
                className="font-tech text-xs border-accent/50 text-accent/90 hover:bg-accent/10 hover:text-accent"
                title="Clear local preview filters"
            >
                <FilterX className="h-4 w-4 mr-2" />
                Clear Preview Filters
            </Button>
        )}
      </div>

      <ScrollArea className="h-[500px] w-full">
        <Table className="data-table">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={`${header}-${index}`} className="whitespace-nowrap">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {locallyFilteredData.length > 0 ? (
              locallyFilteredData.map((row, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  {headers.map((header, colIndex) => (
                    <TableCell key={`cell-${rowIndex}-${colIndex}`} className="whitespace-nowrap font-tech text-primary">
                      {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="text-center text-muted-foreground py-8">
                  No data matches your current preview filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          { previewData.length > 0 && displayedRowCount < previewData.length && !showAllData && (
             <TableFooter>
                <TableRow>
                    <TableCell colSpan={headers.length} className="text-center text-primary/70 italic">
                    Showing top {displayedRowCount.toLocaleString()} rows (of {previewData.length.toLocaleString()} after global search/toggle) matching local preview filters.
                    </TableCell>
                </TableRow>
            </TableFooter>
          )}
          { previewData.length > 0 && showAllData && displayedRowCount < previewData.length && (
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={headers.length} className="text-center text-primary/70 italic">
                    Showing {displayedRowCount.toLocaleString()} rows (of {previewData.length.toLocaleString()} after global search/toggle) matching local preview filters.
                    </TableCell>
                </TableRow>
            </TableFooter>
          )}
        </Table>
        {previewData.length === 0 && <p className="text-center py-4 text-muted-foreground">No data from global search to display in preview.</p>}
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
