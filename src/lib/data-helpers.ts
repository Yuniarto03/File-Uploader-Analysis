
import type { ParsedRow, Header, ColumnStats, CustomSummaryState, CustomSummaryData, AggregationType } from '@/types';

export function calculateColumnStats(parsedData: ParsedRow[], headers: Header[]): ColumnStats[] {
  if (!parsedData || parsedData.length === 0 || !headers || headers.length === 0) {
    return [];
  }

  return headers.map(header => {
    const values = parsedData.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
    
    let type: ColumnStats['type'] = 'Other';
    let min: number | undefined;
    let max: number | undefined;
    let sum: number | undefined;
    let average: number | undefined;
    
    const numericValues = values.map(val => parseFloat(String(val))).filter(val => !isNaN(val));

    if (numericValues.length / values.length > 0.8 && values.length > 0) { // Heuristic: if 80% are numbers
      type = 'Numeric';
      if (numericValues.length > 0) {
        min = Math.min(...numericValues);
        max = Math.max(...numericValues);
        sum = numericValues.reduce((a, b) => a + b, 0);
        average = sum / numericValues.length;
      }
    } else if (values.every(val => typeof val === 'boolean' || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 'false')) {
      type = 'Boolean';
    } else if (values.some(val => !isNaN(new Date(String(val)).getTime()))) {
      // Basic date check, can be improved
      const dateObjects = values.map(val => new Date(String(val)));
      if (dateObjects.filter(d => d.getFullYear() > 1900 && d.getFullYear() < 2100).length / values.length > 0.5) { // Heuristic for dates
        type = 'Date';
      } else {
        type = 'Text';
      }
    }
     else {
      type = 'Text';
    }

    const uniqueValues = new Set(values.map(String)).size;
    
    return { column: header, type, min, max, average, sum, uniqueValues };
  });
}


function calculateStdDev(arr: number[]): number {
  if (arr.length < 1) return 0; 
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  if (arr.length < 2) return 0; 
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function aggregateValues(values: (string | number | boolean | null | undefined)[], aggregation: AggregationType, valueFieldIsNumeric: boolean): number | string {
  const numericValues = values.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
  const stringValues = values.map(String);

  switch (aggregation) {
    case 'sum':
      return valueFieldIsNumeric && numericValues.length > 0 ? numericValues.reduce((s, v) => s + v, 0) : (valueFieldIsNumeric ? 0 : '-');
    case 'avg':
      return valueFieldIsNumeric && numericValues.length > 0 ? numericValues.reduce((s, v) => s + v, 0) / numericValues.length : (valueFieldIsNumeric ? 0 : '-');
    case 'count':
      return values.filter(v => v !== null && v !== undefined && String(v).trim() !== '').length;
    case 'min':
      return valueFieldIsNumeric && numericValues.length > 0 ? Math.min(...numericValues) : (valueFieldIsNumeric ? 0 : (stringValues.length > 0 ? stringValues.sort()[0] : '-'));
    case 'max':
      return valueFieldIsNumeric && numericValues.length > 0 ? Math.max(...numericValues) : (valueFieldIsNumeric ? 0 : (stringValues.length > 0 ? stringValues.sort().pop() : '-'));
    case 'unique':
      return new Set(values.filter(v => v !== null && v !== undefined && String(v).trim() !== '').map(String)).size;
    case 'sdev':
      return valueFieldIsNumeric && numericValues.length > 0 ? calculateStdDev(numericValues) : (valueFieldIsNumeric ? 0 : '-');
    default:
      return '-';
  }
}


export function generateCustomSummaryData(
  originalParsedData: ParsedRow[],
  config: CustomSummaryState,
  allHeaders: Header[]
): CustomSummaryData {
  const { 
    rowsField, 
    columnsField, 
    valuesField, 
    aggregation,
    filterColumn1,
    filterValue1,
    filterColumn2,
    filterValue2
  } = config;

  if (!rowsField || !columnsField || !valuesField) {
    throw new Error("Row, Column, and Value fields must be selected for custom summary.");
  }

  let parsedData = [...originalParsedData];

  // Apply first filter
  if (filterColumn1 && filterValue1) {
    parsedData = parsedData.filter(row => String(row[filterColumn1]) === filterValue1);
  }

  // Apply second filter on the result of the first filter
  if (filterColumn2 && filterValue2) {
    parsedData = parsedData.filter(row => String(row[filterColumn2]) === filterValue2);
  }


  const numericHeaders = allHeaders.filter(header => 
      parsedData.length > 0 && parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    );
  const valueFieldIsNumeric = numericHeaders.includes(valuesField);

  const data: Record<string, Record<string, number | string>> = {};
  const rowValuesSet = new Set<string>();
  const columnValuesSet = new Set<string>();
  const groupedData: Record<string, Record<string, (string | number | boolean | null | undefined)[]>> = {};

  parsedData.forEach(row => {
    const rowVal = String(row[rowsField] ?? 'N/A');
    const colVal = String(row[columnsField] ?? 'N/A');
    const valToAggregate = row[valuesField];

    rowValuesSet.add(rowVal);
    columnValuesSet.add(colVal);

    if (!groupedData[rowVal]) {
      groupedData[rowVal] = {};
    }
    if (!groupedData[rowVal][colVal]) {
      groupedData[rowVal][colVal] = [];
    }
    groupedData[rowVal][colVal].push(valToAggregate);
  });

  const rowValues = Array.from(rowValuesSet).sort();
  const columnValues = Array.from(columnValuesSet).sort();
  const rowTotals: Record<string, number | string> = {};
  const columnTotals: Record<string, number | string> = {};
  let grandTotalValues: (string | number | boolean | null | undefined)[] = [];


  rowValues.forEach(rv => {
    data[rv] = {};
    let currentRowTotalValues: (string | number | boolean | null | undefined)[] = [];
    columnValues.forEach(cv => {
      const valuesToAgg = groupedData[rv]?.[cv] || [];
      data[rv][cv] = aggregateValues(valuesToAgg, aggregation, valueFieldIsNumeric);
      currentRowTotalValues.push(...valuesToAgg);
      
      if (!columnTotals[cv]) {
        columnTotals[cv] = ''; 
      }
    });
    rowTotals[rv] = aggregateValues(currentRowTotalValues, aggregation, valueFieldIsNumeric);
    grandTotalValues.push(...currentRowTotalValues);
  });
  
  columnValues.forEach(cv => {
      let currentColTotalValues: (string | number | boolean | null | undefined)[] = [];
      rowValues.forEach(rv => {
          currentColTotalValues.push(...(groupedData[rv]?.[cv] || []));
      });
      columnTotals[cv] = aggregateValues(currentColTotalValues, aggregation, valueFieldIsNumeric);
  });

  const grandTotal = aggregateValues(grandTotalValues, aggregation, valueFieldIsNumeric);
  
  columnValues.forEach(cv => {
    if (columnTotals[cv] === undefined) {
      columnTotals[cv] = aggregateValues([], aggregation, valueFieldIsNumeric);
    }
  });


  return {
    rowValues,
    columnValues,
    data,
    rowTotals,
    columnTotals,
    grandTotal,
    valueFieldName: valuesField,
    aggregationType: aggregation,
  };
}

