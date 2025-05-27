import type { ParsedRow, Header, ColumnStats, PivotTableData } from '@/types';

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
    
    const numericValues = values.map(Number).filter(val => !isNaN(val));

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
    } else if (values.every(val => !isNaN(new Date(String(val)).getTime()))) {
      // Basic date check, can be improved
      const dateObjects = values.map(val => new Date(String(val)));
      if (dateObjects.every(d => d.getFullYear() > 1900 && d.getFullYear() < 2100)) { // Ensure reasonable dates
        type = 'Date';
      } else {
        type = 'Text';
      }
    }
     else {
      type = 'Text';
    }

    const uniqueValues = new Set(values).size;
    
    // For text columns, can add value counts if needed
    // const valueCounts: Record<string, number> = {};
    // if (type === 'Text') {
    //   values.forEach(val => {
    //     const strVal = String(val);
    //     valueCounts[strVal] = (valueCounts[strVal] || 0) + 1;
    //   });
    // }

    return { column: header, type, min, max, average, sum, uniqueValues };
  });
}

export function generatePivotData(
  parsedData: ParsedRow[],
  rowField: Header,
  colField: Header,
  valueField: Header,
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
): PivotTableData {
  const rowValuesSet = new Set<string>();
  const colValuesSet = new Set<string>();
  const pivotDataIntermediate: Record<string, Record<string, number[]>> = {};

  parsedData.forEach(row => {
    const rowVal = String(row[rowField]);
    const colVal = String(row[colField]);
    const val = Number(row[valueField]);

    if (rowVal && colVal && !isNaN(val)) {
      rowValuesSet.add(rowVal);
      colValuesSet.add(colVal);
      if (!pivotDataIntermediate[rowVal]) pivotDataIntermediate[rowVal] = {};
      if (!pivotDataIntermediate[rowVal][colVal]) pivotDataIntermediate[rowVal][colVal] = [];
      pivotDataIntermediate[rowVal][colVal].push(val);
    }
  });

  const rowValues = Array.from(rowValuesSet).sort();
  const columnValues = Array.from(colValuesSet).sort();
  const data: Record<string, Record<string, number>> = {};
  const rowTotals: Record<string, number> = {};
  const columnTotals: Record<string, number> = {};
  let grandTotal = 0;

  rowValues.forEach(rowVal => {
    data[rowVal] = {};
    rowTotals[rowVal] = 0;
    columnValues.forEach(colVal => {
      const values = pivotDataIntermediate[rowVal]?.[colVal] || [];
      let result = 0;
      if (values.length > 0) {
        switch (aggregation) {
          case 'sum': result = values.reduce((s, v) => s + v, 0); break;
          case 'avg': result = values.reduce((s, v) => s + v, 0) / values.length; break;
          case 'count': result = values.length; break;
          case 'min': result = Math.min(...values); break;
          case 'max': result = Math.max(...values); break;
        }
      }
      data[rowVal][colVal] = result;
      rowTotals[rowVal] += result;
      columnTotals[colVal] = (columnTotals[colVal] || 0) + result;
      grandTotal += result;
    });
  });
  
  // Ensure all column totals are initialized even if some columns have no data for some rows
  columnValues.forEach(colVal => {
    if (!columnTotals[colVal]) {
      columnTotals[colVal] = 0;
    }
  });


  return { rowValues, columnValues, data, rowTotals, columnTotals, grandTotal };
}
