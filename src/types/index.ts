
export type Header = string;

export type ParsedRow = Record<Header, string | number | boolean | null | undefined>;

export interface FileData {
  fileName: string;
  headers: Header[];
  parsedData: ParsedRow[];
  allSheetNames?: string[];
  currentSheetName?: string;
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

export type ChartAggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'unique' | 'sdev';

export interface ChartState {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'radar' | 'polarArea' | 'area';
  xAxis: string;
  yAxis: string;
  yAxisAggregation: ChartAggregationType;
  yAxis2?: string;
  yAxis2Aggregation?: ChartAggregationType;
  colorTheme: string; // This will now be mainly for chart internal palettes, not the global app theme
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
  yAxisID?: string;
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

export interface AIDataSummary {
  narrativeSummary: string;
  keyFindings: string[];
  rootCauseAnalysis: string;
  suggestedSolutions: string[];
}

export type AppThemeSetting = 'cyber' | 'dark' | 'neon' | 'quantum' | 'matrix' | 'void' | 'glitch' | 'arcade';

export interface ApplicationSettings {
  theme: AppThemeSetting;
  chartAnimations: boolean;
  autoGenerateAIInsights: boolean;
  dataPrecision: number; // Number of decimal places
}

