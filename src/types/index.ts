
export type Header = string;

export type ParsedRow = Record<Header, string | number | boolean | null | undefined>;

export interface FileData {
  fileName: string;
  headers: Header[];
  parsedData: ParsedRow[];
  // allSheetNames?: string[]; // Removed
  // currentSheetName?: string; // Removed
  rawData?: any[]; 
}

export interface ColumnStats {
  column: Header;
  type: 'Numeric' | 'Text' | 'Boolean' | 'Date' | 'Other';
  min?: number;
  max?: number;
  average?: number;
  sum?: number;
  uniqueValues: number;
  valueCounts?: Record<string, number>; 
}

export interface AIInsight {
  id: string;
  text: string;
}

export type ChartAggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'unique' | 'sdev';

export interface ChartState {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'radar' | 'polarArea' | 'area';
  xAxis: string;
  yAxis: string;
  yAxisAggregation: ChartAggregationType;
  colorTheme: string;
  showLegend: boolean;
  showDataLabels: boolean;
  filterColumn: string;
  filterValue: string;
  filterColumn2: string;
  filterValue2: string;
}

export interface ChartDataset {
  label: string;
  data: number[] | { x: number | string; y: number }[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  tension?: number;
  fill?: boolean | string;
  pointBackgroundColor?: string;
  pointRadius?: number;
  hoverBorderWidth?: number;
  hoverOffset?: number;
  borderRadius?: number;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'unique' | 'sdev';

export interface CustomSummaryState {
  rowsField: string;
  columnsField: string;
  valuesField: string;
  aggregation: AggregationType;
  filterColumn1?: string;
  filterValue1?: string;
  filterColumn2?: string;
  filterValue2?: string;
}

export interface CustomSummaryData {
  rowValues: string[];
  columnValues: string[];
  data: Record<string, Record<string, number | string>>; 
  rowTotals: Record<string, number | string>;
  columnTotals: Record<string, number | string>;
  grandTotal: number | string;
  valueFieldName: string; 
  aggregationType: AggregationType; 
  rowsField: string; 
  columnsField: string; 
}

