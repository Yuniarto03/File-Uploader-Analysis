
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { Header, ParsedRow } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface DataPreviewProps {
  fileName: string;
  rowCount: number;
  headers: Header[];
  previewData: ParsedRow[];
  showAllData: boolean;
  onToggleShowAllData: () => void;
}

export default function DataPreview({ 
  fileName, 
  rowCount, 
  headers, 
  previewData,
  showAllData,
  onToggleShowAllData 
}: DataPreviewProps) {
  return (
    <section id="preview-section" className="bg-glass p-6 glow slide-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-tech text-primary glow-text">Data Preview</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-primary/80 bg-cyan-900/30 px-3 py-1 rounded-full font-mono">
            {fileName}
          </span>
          <span className="text-sm text-primary/80 bg-cyan-900/30 px-3 py-1 rounded-full font-mono">
            {rowCount.toLocaleString()} rows
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
      <ScrollArea className="h-[500px] w-full">
        <Table className="data-table">
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={`${header}-${index}`} className="whitespace-nowrap">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {headers.map((header, colIndex) => (
                  <TableCell key={`cell-${rowIndex}-${colIndex}`} className="whitespace-nowrap">
                    {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {!showAllData && rowCount > previewData.length && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={headers.length} className="text-center text-primary/70 italic">
                  Showing {previewData.length} of {rowCount.toLocaleString()} rows
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
        {previewData.length === 0 && <p className="text-center py-4 text-muted-foreground">No data to display in preview.</p>}
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

