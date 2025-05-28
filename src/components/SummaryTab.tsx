
"use client";

import React, { useEffect } from 'react';
import type { Header, ParsedRow, AIInsight, ColumnStats, CustomSummaryState, CustomSummaryData, AggregationType } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Cog } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";


interface SummaryInfoCardProps {
  title: string;
  value: string | number;
  description?: string;
}

const SummaryInfoCard: React.FC<SummaryInfoCardProps> = ({ title, value, description }) => (
  <div className="bg-cyan-900/20 rounded-lg p-4 hex-border">
    <h3 className="text-md font-tech text-primary mb-1 truncate">{title}</h3>
    <p className="text-2xl font-semibold text-foreground mb-1">{value}</p>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);


interface SummaryTabProps {
  parsedData: ParsedRow[];
  headers: Header[];
  aiInsights: AIInsight[];
  isLoadingAiInsights: boolean;
  columnStats: ColumnStats[]; // For basic overview cards
  customAiPrompt: string;
  setCustomAiPrompt: (prompt: string) => void;
  onRegenerateInsights: () => Promise<void>;
  customSummaryState: CustomSummaryState;
  setCustomSummaryState: (state: CustomSummaryState | ((prevState: CustomSummaryState) => CustomSummaryState)) => void;
  customSummaryData: CustomSummaryData | null;
  onGenerateCustomSummary: () => void;
  numericHeaders: Header[];
}

export default function SummaryTab({ 
  parsedData, 
  headers, 
  aiInsights, 
  isLoadingAiInsights,
  columnStats,
  customAiPrompt,
  setCustomAiPrompt,
  onRegenerateInsights,
  customSummaryState,
  setCustomSummaryState,
  customSummaryData,
  onGenerateCustomSummary,
  numericHeaders,
}: SummaryTabProps) {

  const handleSummaryStateChange = (field: keyof CustomSummaryState, value: string) => {
    setCustomSummaryState(prev => ({ ...prev, [field]: value }));
  };
  
  const aggregationOptions: { value: AggregationType, label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'unique', label: 'Unique Count' },
    { value: 'sdev', label: 'Standard Deviation' },
  ];

  useEffect(() => {
    // Auto-select first valid options if not already set and headers are available
    if (headers.length > 0) {
      setCustomSummaryState(prev => {
        const newRowsField = prev.rowsField || headers[0];
        const newColumnsField = prev.columnsField || (headers.length > 1 ? headers[1] : headers[0]);
        const newValuesField = prev.valuesField && numericHeaders.includes(prev.valuesField) ? prev.valuesField : (numericHeaders[0] || '');
        
        // Avoid infinite loop if state doesn't actually change
        if (newRowsField !== prev.rowsField || newColumnsField !== prev.columnsField || newValuesField !== prev.valuesField) {
          return {
            ...prev,
            rowsField: newRowsField,
            columnsField: newColumnsField,
            valuesField: newValuesField,
          };
        }
        return prev;
      });
    }
  }, [headers, numericHeaders, setCustomSummaryState]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryInfoCard title="Total Rows" value={parsedData.length.toLocaleString()} description="Number of records in the dataset." />
        <SummaryInfoCard title="Total Columns" value={headers.length.toLocaleString()} description="Number of features in the dataset."/>
        {columnStats.length > 0 && (
          <SummaryInfoCard 
            title="Numeric Columns" 
            value={columnStats.filter(stat => stat.type === 'Numeric').length} 
            description="Columns identified as numerical." 
          />
        )}
      </div>

      <Card className="bg-cyan-900/20 rounded-lg p-0 border-0 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-tech text-primary flex items-center">
            <Cog className="mr-2 h-5 w-5 text-primary" /> Custom Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="summary-rows" className="block text-sm font-medium text-primary/80 mb-1">Rows</Label>
              <Select 
                value={customSummaryState.rowsField} 
                onValueChange={(value) => handleSummaryStateChange('rowsField', value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="summary-rows" className="custom-select">
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
              <Label htmlFor="summary-columns" className="block text-sm font-medium text-primary/80 mb-1">Columns</Label>
              <Select 
                value={customSummaryState.columnsField} 
                onValueChange={(value) => handleSummaryStateChange('columnsField', value)}
                disabled={headers.length === 0}
              >
                <SelectTrigger id="summary-columns" className="custom-select">
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
              <Label htmlFor="summary-values" className="block text-sm font-medium text-primary/80 mb-1">Values (Numeric)</Label>
              <Select 
                value={customSummaryState.valuesField} 
                onValueChange={(value) => handleSummaryStateChange('valuesField', value)}
                disabled={numericHeaders.length === 0}
              >
                <SelectTrigger id="summary-values" className="custom-select">
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
              <Label htmlFor="summary-agg" className="block text-sm font-medium text-primary/80 mb-1">Aggregation</Label>
              <Select 
                value={customSummaryState.aggregation} 
                onValueChange={(value) => handleSummaryStateChange('aggregation', value as AggregationType)}
                disabled={!customSummaryState.valuesField}
              >
                <SelectTrigger id="summary-agg" className="custom-select">
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  {aggregationOptions.map(agg => (
                    <SelectItem key={agg.value} value={agg.value}>{agg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={onGenerateCustomSummary}
            disabled={!customSummaryState.rowsField || !customSummaryState.columnsField || !customSummaryState.valuesField || headers.length === 0}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-tech btn-shine"
          >
            Generate Summary
          </Button>

          {customSummaryData && (
            <div className="mt-6">
              <h4 className="text-md font-tech text-primary glow-text mb-2">
                Summary: {customSummaryData.aggregationType.toUpperCase()} of {customSummaryData.valueFieldName}
              </h4>
              <ScrollArea className="h-[400px] w-full">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-cyan-800/30">{customSummaryState.rowsField} / {customSummaryState.columnsField}</TableHead>
                      {customSummaryData.columnValues.map(colVal => (
                        <TableHead key={colVal} className="whitespace-nowrap">{colVal}</TableHead>
                      ))}
                      <TableHead className="bg-cyan-800/30 whitespace-nowrap">Row Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customSummaryData.rowValues.map(rowVal => (
                      <TableRow key={rowVal}>
                        <TableHead className="whitespace-nowrap">{rowVal}</TableHead>
                        {customSummaryData.columnValues.map(colVal => (
                          <TableCell key={`${rowVal}-${colVal}`} className="whitespace-nowrap font-tech text-primary">
                            {typeof customSummaryData.data[rowVal]?.[colVal] === 'number' 
                              ? (customSummaryData.data[rowVal]?.[colVal] as number).toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                              : customSummaryData.data[rowVal]?.[colVal] ?? '-'}
                          </TableCell>
                        ))}
                        <TableCell className="bg-cyan-800/30 font-medium whitespace-nowrap font-tech text-primary">
                           {typeof customSummaryData.rowTotals[rowVal] === 'number'
                              ? (customSummaryData.rowTotals[rowVal] as number).toLocaleString(undefined, { maximumFractionDigits: 2 })
                              : customSummaryData.rowTotals[rowVal] ?? '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableHead className="bg-cyan-800/30 whitespace-nowrap">Column Total</TableHead>
                      {customSummaryData.columnValues.map(colVal => (
                        <TableCell key={`total-${colVal}`} className="bg-cyan-800/30 font-medium whitespace-nowrap font-tech text-primary">
                          {typeof customSummaryData.columnTotals[colVal] === 'number'
                            ? (customSummaryData.columnTotals[colVal] as number).toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : customSummaryData.columnTotals[colVal] ?? '-'}
                        </TableCell>
                      ))}
                      <TableCell className="bg-cyan-700/50 font-bold whitespace-nowrap font-tech text-primary">
                        {typeof customSummaryData.grandTotal === 'number'
                          ? (customSummaryData.grandTotal as number).toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : customSummaryData.grandTotal}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
          {!customSummaryData && headers.length > 0 && (
             <p className="text-center py-4 text-muted-foreground">
                Configure summary options and click "Generate Summary".
             </p>
          )}
           {!customSummaryData && headers.length === 0 && (
             <p className="text-center py-4 text-muted-foreground">
                Upload data to generate a custom summary.
             </p>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-cyan-900/20 rounded-lg p-0 border-0 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-tech text-accent flex items-center">
            <Sparkles className="mr-2 h-4 w-4 text-accent" /> AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div>
            <Label htmlFor="custom-ai-prompt" className="block text-sm font-medium text-primary/80 mb-1">
              Customize AI Instructions (Optional)
            </Label>
            <Textarea
              id="custom-ai-prompt"
              placeholder="e.g., Focus on correlations between sales and marketing spend, or suggest potential new product lines based on customer preferences."
              value={customAiPrompt}
              onChange={(e) => setCustomAiPrompt(e.target.value)}
              className="bg-black/20 border-accent/30 focus:border-accent focus:ring-accent/50 min-h-[80px]"
              disabled={parsedData.length === 0}
            />
            <Button
              onClick={onRegenerateInsights}
              disabled={isLoadingAiInsights || parsedData.length === 0}
              className="mt-3 bg-gradient-to-r from-accent to-pink-500 text-white font-tech btn-shine"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isLoadingAiInsights && customAiPrompt ? 'Generating...' : (isLoadingAiInsights ? 'Generating...' : 'Regenerate Insights')}
            </Button>
          </div>

          {isLoadingAiInsights ? (
            <div className="flex flex-col items-center justify-center h-32">
              <LoadingSpinner />
              <p className="mt-2 text-muted-foreground">{customAiPrompt ? 'Applying custom instructions...' : 'Generating initial insights...'}</p>
            </div>
          ) : aiInsights.length > 0 ? (
            <ScrollArea className="h-[200px] w-full">
              <ul className="space-y-3">
                {aiInsights.map((insight) => (
                  <li key={insight.id} className="text-sm text-foreground p-3 bg-black/20 rounded-md border border-accent/30">
                    {insight.text}
                  </li>
                ))}
              </ul>
              <ScrollBar orientation="horizontal" />
               <ScrollBar orientation="vertical" />
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {parsedData.length === 0 ? "Upload data to generate insights." : "No AI insights generated. Try different instructions or check the data."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
