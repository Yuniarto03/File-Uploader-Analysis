
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
  rowCount: number; // Number of rows after global search
  headers: Header[];
  previewData: ParsedRow[]; // Data for table display (potentially sliced for "Top 5")
  originalDataForFilters: ParsedRow[]; // Full data for the current sheet, used to populate filter options
  showAllData: boolean;
  onToggleShowAllData: () => void;
}

const NO_FILTER_COLUMN_PLACEHOLDER = "NO_FILTER_COLUMN_PREVIEW";

// Helper functions
const isNonEmptyString = (val: string | null | undefined): boolean => 
  val !== null && val !== undefined && val !== '' && val !== 'null' && val !== 'undefined';

const localeSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const applySingleFilter = (data: ParsedRow[], column: string, values: string[]): ParsedRow[] => {
  if (column && values.length > 0) {
    return data.filter(row => values.includes(String(row[column])));
  }
  return data;
};

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

  // --- Cascading useEffects for unique values ---

  // Unique values for Filter 1 (based on original data)
  useEffect(() => {
    if (filterColumn1 && originalDataForFilters.length > 0) {
      const values = Array.from(new Set(originalDataForFilters.map(row => String(row[filterColumn1])).filter(isNonEmptyString)));
      setUniqueValues1(values.sort(localeSort));
    } else {
      setUniqueValues1([]);
    }
  }, [filterColumn1, originalDataForFilters]);

  // Unique values for Filter 2 (based on data filtered by Filter 1)
  useEffect(() => {
    if (filterColumn2 && originalDataForFilters.length > 0) {
      const dataForFilter2 = applySingleFilter(originalDataForFilters, filterColumn1, filterValue1);
      const values = Array.from(new Set(dataForFilter2.map(row => String(row[filterColumn2])).filter(isNonEmptyString)));
      setUniqueValues2(values.sort(localeSort));
    } else {
      setUniqueValues2([]);
    }
  }, [filterColumn2, originalDataForFilters, filterColumn1, filterValue1]);

  // Unique values for Filter 3 (based on data filtered by Filter 1 & 2)
  useEffect(() => {
    if (filterColumn3 && originalDataForFilters.length > 0) {
      let dataForFilter3 = originalDataForFilters;
      dataForFilter3 = applySingleFilter(dataForFilter3, filterColumn1, filterValue1);
      dataForFilter3 = applySingleFilter(dataForFilter3, filterColumn2, filterValue2);
      const values = Array.from(new Set(dataForFilter3.map(row => String(row[filterColumn3])).filter(isNonEmptyString)));
      setUniqueValues3(values.sort(localeSort));
    } else {
      setUniqueValues3([]);
    }
  }, [filterColumn3, originalDataForFilters, filterColumn1, filterValue1, filterColumn2, filterValue2]);

  // Unique values for Filter 4 (based on data filtered by Filter 1, 2, & 3)
  useEffect(() => {
    if (filterColumn4 && originalDataForFilters.length > 0) {
      let dataForFilter4 = originalDataForFilters;
      dataForFilter4 = applySingleFilter(dataForFilter4, filterColumn1, filterValue1);
      dataForFilter4 = applySingleFilter(dataForFilter4, filterColumn2, filterValue2);
      dataForFilter4 = applySingleFilter(dataForFilter4, filterColumn3, filterValue3);
      const values = Array.from(new Set(dataForFilter4.map(row => String(row[filterColumn4])).filter(isNonEmptyString)));
      setUniqueValues4(values.sort(localeSort));
    } else {
      setUniqueValues4([]);
    }
  }, [filterColumn4, originalDataForFilters, filterColumn1, filterValue1, filterColumn2, filterValue2, filterColumn3, filterValue3]);

  // Unique values for Filter 5 (based on data filtered by Filter 1, 2, 3, & 4)
  useEffect(() => {
    if (filterColumn5 && originalDataForFilters.length > 0) {
      let dataForFilter5 = originalDataForFilters;
      dataForFilter5 = applySingleFilter(dataForFilter5, filterColumn1, filterValue1);
      dataForFilter5 = applySingleFilter(dataForFilter5, filterColumn2, filterValue2);
      dataForFilter5 = applySingleFilter(dataForFilter5, filterColumn3, filterValue3);
      dataForFilter5 = applySingleFilter(dataForFilter5, filterColumn4, filterValue4);
      const values = Array.from(new Set(dataForFilter5.map(row => String(row[filterColumn5])).filter(isNonEmptyString)));
      setUniqueValues5(values.sort(localeSort));
    } else {
      setUniqueValues5([]);
    }
  }, [filterColumn5, originalDataForFilters, filterColumn1, filterValue1, filterColumn2, filterValue2, filterColumn3, filterValue3, filterColumn4, filterValue4]);


  const resetSubsequentFilters = (startIndex: number) => {
    // startIndex is 1-based index of the filter whose column changed
    if (startIndex <= 1) { setFilterColumn2(''); setFilterValue2([]); }
    if (startIndex <= 2) { setFilterColumn3(''); setFilterValue3([]); }
    if (startIndex <= 3) { setFilterColumn4(''); setFilterValue4([]); }
    if (startIndex <= 4) { setFilterColumn5(''); setFilterValue5([]); }
  };
  
  const clearSubsequentSelectedValues = (startIndex: number) => {
    // startIndex is 1-based index of the filter whose value changed
    if (startIndex <= 1) { setFilterValue2([]); }
    if (startIndex <= 2) { setFilterValue3([]); }
    if (startIndex <= 3) { setFilterValue4([]); }
    if (startIndex <= 4) { setFilterValue5([]); }
  };


  const handleFilterColumnChange = (newColumn: string, filterSetIndex: 1 | 2 | 3 | 4 | 5) => {
    const effectiveNewColumn = newColumn === NO_FILTER_COLUMN_PLACEHOLDER ? '' : newColumn;
    const valueSetter = [setFilterValue1, setFilterValue2, setFilterValue3, setFilterValue4, setFilterValue5][filterSetIndex - 1];
    
    switch (filterSetIndex) {
      case 1: setFilterColumn1(effectiveNewColumn); break;
      case 2: setFilterColumn2(effectiveNewColumn); break;
      case 3: setFilterColumn3(effectiveNewColumn); break;
      case 4: setFilterColumn4(effectiveNewColumn); break;
      case 5: setFilterColumn5(effectiveNewColumn); break;
    }
    valueSetter([]); // Always reset values for the current filter when its column changes
    resetSubsequentFilters(filterSetIndex); // Reset columns and values for subsequent filters
  };

  const handleCheckboxFilterValueChange = (
    valueToToggle: string,
    filterSetIndex: 1 | 2 | 3 | 4 | 5,
    isChecked: boolean
  ) => {
    const setter = [setFilterValue1, setFilterValue2, setFilterValue3, setFilterValue4, setFilterValue5][filterSetIndex - 1];
    setter(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(valueToToggle);
      } else {
        newSet.delete(valueToToggle);
      }
      return Array.from(newSet);
    });
    clearSubsequentSelectedValues(filterSetIndex); // Clear selected values for subsequent filters
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
    clearSubsequentSelectedValues(filterSetIndex); // Clear selected values for subsequent filters
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
    data = applySingleFilter(data, filterColumn1, filterValue1);
    data = applySingleFilter(data, filterColumn2, filterValue2);
    data = applySingleFilter(data, filterColumn3, filterValue3);
    data = applySingleFilter(data, filterColumn4, filterValue4);
    data = applySingleFilter(data, filterColumn5, filterValue5);
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
    uniqueValuesForColumn: string[] 
  ) => {
    const isAllSelected = uniqueValuesForColumn.length > 0 && filterValues.length === uniqueValuesForColumn.length;
    
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
        {filterColumn && ( 
          <div>
            <Label className="block text-sm font-medium text-primary/80 mb-1 mt-2">Select Value(s) for {filterColumn}</Label>
            {uniqueValuesForColumn.length > 0 ? (
              <>
                <div className="flex items-center space-x-2 mb-2 p-1 border-b border-primary/20">
                  <Checkbox
                    id={`select-all-${index}`}
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAllValuesChange(index, !!checked)}
                    className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    aria-label={isAllSelected ? "Deselect all values" : "Select all values"}
                  />
                  <Label htmlFor={`select-all-${index}`} className="text-xs font-normal text-foreground cursor-pointer">
                    {isAllSelected ? "Deselect All" : "Select All"} ({uniqueValuesForColumn.length})
                  </Label>
                </div>
                <ScrollArea className="h-36 border rounded-md p-2 bg-cyan-900/30">
                  {uniqueValuesForColumn.map(val => (
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
                </ScrollArea>
              </>
            ) : (
              <p className="text-xs text-muted-foreground p-2 mt-2">No unique values in '{filterColumn}' based on preceding filters.</p>
            )}
          </div>
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
                  {previewData.length > 0 ? "No data matches your current preview filters." : 
                   (hasActiveFilters ? "No data matches your current preview filters." : "No data from global search to display in preview.")
                  }
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
        {(previewData.length === 0 && !hasActiveFilters) && 
         (headers.length > 0 && <p className="text-center py-4 text-muted-foreground">No data from global search to display in preview.</p>)
        }
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
    

    

    