
export type Header = string;

export type ParsedRow = Record<Header, string | number | boolean | null | undefined>;

export interface FileData {
  fileName: string;
  headers: Header[];
  parsedData: ParsedRow[];
  rawData?: any[]; // Optional: for specific parsing library outputs
}

export interface ColumnStats {
  column: Header;
  type: 'Numeric' | 'Text' | 'Boolean' | 'Date' | 'Other';
  min?: number;
  max?: number;
  average?: number;
  sum?: number;
  uniqueValues: number;
  valueCounts?: Record<string, number>; // For categorical data
}

export interface AIInsight {
  id: string;
  text: string;
}

export interface ChartState {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'radar' | 'polarArea' | 'area';
  xAxis: string;
  yAxis: string;
  yAxisAggregation: 'sum' | 'avg' | 'count'; // New field for Y-axis aggregation
  colorTheme: string;
  showLegend: boolean;
  showDataLabels: boolean;
  filterColumn: string;
  filterValue: string;
  filterColumn2: string;
  filterValue2: string;
}

// Chart.js specific types, can be expanded
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
}

