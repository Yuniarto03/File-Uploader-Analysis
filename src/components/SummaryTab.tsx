
"use client";

import React, { useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Header, ParsedRow, AIInsight, ColumnStats } from '@/types';
import { calculateColumnStats } from '@/lib/data-helpers';
import LoadingSpinner from './LoadingSpinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
}

const SummaryInfoCard: React.FC<SummaryCardProps> = ({ title, value, description }) => (
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
  columnStats: ColumnStats[];
  setColumnStats: (stats: ColumnStats[]) => void;
  customAiPrompt: string;
  setCustomAiPrompt: (prompt: string) => void;
  onRegenerateInsights: () => Promise<void>;
}

export default function SummaryTab({ 
  parsedData, 
  headers, 
  aiInsights, 
  isLoadingAiInsights,
  columnStats,
  setColumnStats,
  customAiPrompt,
  setCustomAiPrompt,
  onRegenerateInsights 
}: SummaryTabProps) {

  useEffect(() => {
    if (parsedData.length > 0 && headers.length > 0) {
      setColumnStats(calculateColumnStats(parsedData, headers));
    }
  }, [parsedData, headers, setColumnStats]);

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
          <CardTitle className="text-lg font-tech text-primary">Column Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ScrollArea className="h-[300px] w-full">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  {['Column', 'Type', 'Min', 'Max', 'Average', 'Sum', 'Unique Values'].map((header, idx) => (
                    <TableHead key={idx} className="whitespace-nowrap">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {columnStats.map((stat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="whitespace-nowrap">{stat.column}</TableCell>
                    <TableCell className="whitespace-nowrap">{stat.type}</TableCell>
                    <TableCell className="whitespace-nowrap">{stat.min !== undefined ? stat.min.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{stat.max !== undefined ? stat.max.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{stat.average !== undefined ? stat.average.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{stat.sum !== undefined ? stat.sum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{stat.uniqueValues.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {columnStats.length === 0 && <p className="text-center py-4 text-muted-foreground">No statistics to display.</p>}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card className="bg-cyan-900/20 rounded-lg p-0 border-0 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-tech text-accent">AI-Powered Insights</CardTitle>
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
