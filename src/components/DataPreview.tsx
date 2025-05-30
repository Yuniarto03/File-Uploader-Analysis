
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { Header, ParsedRow } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, FilterX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';

interface DataPreviewProps {
  fileName: string;
  rowCount: number;
  headers: Header[];
  previewData: ParsedRow[];
  originalDataForFilters: ParsedRow[];
  showAllData: boolean;
  onToggleShowAllData: () => void;
}

const NO_FILTER_COLUMN_PLACEHOLDER = "NO_FILTER_COLUMN_PREVIEW";

export default function DataPreview({
  fileName,
  rowCount,
  headers,
  previewData,
  originalDataForFilters,
  showAllData,
  onToggleShowAllData
}: DataPreviewProps) {
  const [filterColumn1, setFilterColumn1] = useState<string>('');
  const [filterValue1, setFilterValue1] = useState<string[]>([]);
  const [uniqueValues1, setUniqueValues1] = useState<string[]>([]);

  const [filterColumn2, setFilterColumn2] = useState<string>('');
  const [filterValue2, setFilterValue2] = useState<string[]>([]);
  const [uniqueValues2, setUniqueValues2] = useState<string[]>([]);

  const [filterColumn3, setFilterColumn3] = useState<string>('');
  const [filterValue3, setFilterValue3] = useState<string[]>([]);
  const [uniqueValues3, setUniqueValues3] = useState<string[]>([]);

  const [filterColumn4, setFilterColumn4] = useState<string>('');
  const [filterValue4, setFilterValue4] = useState<string[]>([]);
  const [uniqueValues4, setUniqueValues4] = useState<string[]>([]);

  const [filterColumn5, setFilterColumn5] = useState<string>('');
  const [filterValue5, setFilterValue5] = useState<string[]>([]);
  const [uniqueValues5, setUniqueValues5] = useState<string[]>([]);

  const createUniqueValuesSetter = (
    filterColumn: string,
    data: ParsedRow[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (filterColumn && data && data.length > 0) {
      const values = Array.from(new Set(data.map(row => String(row[filterColumn])).filter(val => val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined')));
      setter(values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })));
    } else {
      setter([]);
    }
  };

  useEffect(() => createUniqueValuesSetter(filterColumn1, originalDataForFilters, setUniqueValues1), [filterColumn1, originalDataForFilters]);
  useEffect(() => createUniqueValuesSetter(filterColumn2, originalDataForFilters, setUniqueValues2), [filterColumn2, originalDataForFilters]);
  useEffect(() => createUniqueValuesSetter(filterColumn3, originalDataForFilters, setUniqueValues3), [filterColumn3, originalDataForFilters]);
  useEffect(() => createUniqueValuesSetter(filterColumn4, originalDataForFilters, setUniqueValues4), [filterColumn4, originalDataForFilters]);
  useEffect(() => createUniqueValuesSetter(filterColumn5, originalDataForFilters, setUniqueValues5), [filterColumn5, originalDataForFilters]);

  const handleFilterColumnChange = (newColumn: string, filterSetIndex: 1 | 2 | 3 | 4 | 5) => {
    const effectiveNewColumn = newColumn === NO_FILTER_COLUMN_PLACEHOLDER ? '' : newColumn;
    switch (filterSetIndex) {
      case 1: setFilterColumn1(effectiveNewColumn); setFilterValue1([]); break;
      case 2: setFilterColumn2(effectiveNewColumn); setFilterValue2([]); break;
      case 3: setFilterColumn3(effectiveNewColumn); setFilterValue3([]); break;
      case 4: setFilterColumn4(effectiveNewColumn); setFilterValue4([]); break;
      case 5: setFilterColumn5(effectiveNewColumn); setFilterValue5([]); break;
    }
  };

  const handleCheckboxFilterValueChange = (
    valueToToggle: string,
    filterSetIndex: 1 | 2 | 3 | 4 | 5,
    isChecked: boolean
  ) => {
    const setter = [setFilterValue1, setFilterValue2, setFilterValue3, setFilterValue4, setFilterValue5][filterSetIndex - 1];
    setter(prev => {
      if (isChecked) {
        return [...prev, valueToToggle];
      } else {
        return prev.filter(val => val !== valueToToggle);
      }
    });
  };

  const handleSelectAllValuesChange = (
    filterSetIndex: 1 | 2 | 3 | 4 | 5,
    isChecked: boolean
  ) => {
    const uniqueValuesSet = [uniqueValues1, uniqueValues2, uniqueValues3, uniqueValues4, uniqueValues5][filterSetIndex - 1];
    const setter = [setFilterValue1, setFilterValue2, setFilterValue3, setFilterValue4, setFilterValue5][filterSetIndex - 1];
    if (isChecked) {
      setter([...uniqueValuesSet]);
    } else {
      setter([]);
    }
  };

  const resetLocalFilters = () => {
    setFilterColumn1(''); setFilterValue1([]);
    setFilterColumn2(''); setFilterValue2([]);
    setFilterColumn3(''); setFilterValue3([]);
    setFilterColumn4(''); setFilterValue4([]);
    setFilterColumn5(''); setFilterValue5([]);
  };

  const locallyFilteredData = useMemo(() => {
    let data = previewData;
    const applyFilter = (col: string, values: string[]) => {
      if (col && values.length > 0) {
        data = data.filter(row => values.includes(String(row[col])));
      }
    };
    applyFilter(filterColumn1, filterValue1);
    applyFilter(filterColumn2, filterValue2);
    applyFilter(filterColumn3, filterValue3);
    applyFilter(filterColumn4, filterValue4);
    applyFilter(filterColumn5, filterValue5);
    return data;
  }, [previewData,
      filterColumn1, filterValue1,
      filterColumn2, filterValue2,
      filterColumn3, filterValue3,
      filterColumn4, filterValue4,
      filterColumn5, filterValue5
    ]);

  const displayedRowCount = locallyFilteredData.length;
  const hasActiveFilters =
    filterColumn1 || filterValue1.length > 0 ||
    filterColumn2 || filterValue2.length > 0 ||
    filterColumn3 || filterValue3.length > 0 ||
    filterColumn4 || filterValue4.length > 0 ||
    filterColumn5 || filterValue5.length > 0;

  const renderFilterSet = (
    index: 1 | 2 | 3 | 4 | 5,
    filterColumn: string,
    filterValues: string[],
    uniqueValues: string[]
  ) => {
    const isAllSelected = uniqueValues.length > 0 && filterValues.length === uniqueValues.length;
    const isIndeterminate = filterValues.length > 0 && filterValues.length < uniqueValues.length;

    return (
      <div key={`filter-set-${index}`} className="space-y-2 p-3 bg-cyan-900/10 rounded-md border border-primary/20">
        <div>
          <Label htmlFor={`preview-filter-column${index}`} className="block text-sm font-medium text-primary/80 mb-1">{`Filter Preview By ${index}`}</Label>
          <Select
            value={filterColumn || NO_FILTER_COLUMN_PLACEHOLDER}
            onValueChange={(value) => handleFilterColumnChange(value, index)}
            disabled={headers.length === 0}
          >
            <SelectTrigger id={`preview-filter-column${index}`} className="custom-select">
              <SelectValue placeholder="Select column to filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FILTER_COLUMN_PLACEHOLDER}>- No Column Filter -</SelectItem>
              {headers.map(header => (
                <SelectItem key={`preview-filter-col${index}-${header}`} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filterColumn && uniqueValues.length > 0 && (
          <div>
            <Label className="block text-sm font-medium text-primary/80 mb-1 mt-2">Select Value(s) for {filterColumn}</Label>
            <div className="flex items-center space-x-2 mb-2 p-1 border-b border-primary/20">
              <Checkbox
                id={`select-all-${index}`}
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAllValuesChange(index, !!checked)}
                className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                aria-label={isAllSelected ? "Deselect all values" : "Select all values"}
              />
              <Label htmlFor={`select-all-${index}`} className="text-xs font-normal text-foreground cursor-pointer">
                {isAllSelected ? "Deselect All" : "Select All"} ({uniqueValues.length})
              </Label>
            </div>
            <ScrollArea className="h-36 border rounded-md p-2 bg-cyan-900/30">
              {uniqueValues.map(val => (
                <div key={`cb-${index}-${val}`} className="flex items-center space-x-2 mb-1">
                  <Checkbox
                    id={`cb-${index}-${val}`}
                    checked={filterValues.includes(val)}
                    onCheckedChange={(checked) => handleCheckboxFilterValueChange(val, index, !!checked)}
                    className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor={`cb-${index}-${val}`} className="text-xs font-normal text-foreground cursor-pointer">
                    {String(val)}
                  </Label>
                </div>
              ))}
              {uniqueValues.length === 0 && <p className="text-xs text-muted-foreground p-2">No unique values to display.</p>}
            </ScrollArea>
          </div>
        )}
        {filterColumn && uniqueValues.length === 0 && (
           <p className="text-xs text-muted-foreground p-2 mt-2">No unique values in '{filterColumn}' to filter by.</p>
        )}
      </div>
    );
  };


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
          {originalDataForFilters.length > 5 && (
            <Button
              onClick={onToggleShowAllData}
              variant="outline"
              size="sm"
              className="font-tech text-xs border-primary/50 text-primary/90 hover:bg-primary/10 hover:text-primary"
            >
              {showAllData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAllData ? "Show Top 5" : `Show All (${originalDataForFilters.length.toLocaleString()})`}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 mb-6">
        {renderFilterSet(1, filterColumn1, filterValue1, uniqueValues1)}
        {renderFilterSet(2, filterColumn2, filterValue2, uniqueValues2)}
        {renderFilterSet(3, filterColumn3, filterValue3, uniqueValues3)}
        {renderFilterSet(4, filterColumn4, filterValue4, uniqueValues4)}
        {renderFilterSet(5, filterColumn5, filterValue5, uniqueValues5)}
      </div>
       {hasActiveFilters && (
            <div className="mb-4">
                <Button
                    onClick={resetLocalFilters}
                    variant="outline"
                    size="sm"
                    className="font-tech text-xs border-accent/50 text-accent/90 hover:bg-accent/10 hover:text-accent w-full sm:w-auto"
                    title="Clear all local preview filters"
                >
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear All Preview Filters
                </Button>
            </div>
        )}

      <ScrollArea className="h-[70vh] w-full">
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
                    <TableCell key={`cell-${rowIndex}-${colIndex}`} className="whitespace-nowrap">
                      {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="text-center text-muted-foreground py-8">
                  {previewData.length > 0 ? "No data matches your current preview filters." : "No data from global search to display in preview."}
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
        {(previewData.length === 0 && !hasActiveFilters) && <p className="text-center py-4 text-muted-foreground">No data from global search to display in preview.</p>}
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
    

    