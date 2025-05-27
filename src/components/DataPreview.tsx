
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter, TableCaption } from "@/components/ui/table";
import type { Header, ParsedRow } from '@/types';

interface DataPreviewProps {
  fileName: string;
  rowCount: number;
  headers: Header[];
  previewData: ParsedRow[];
}

export default function DataPreview({ fileName, rowCount, headers, previewData }: DataPreviewProps) {
  return (
    <section id="preview-section" className="bg-glass p-6 glow slide-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-tech text-primary glow-text">Data Preview</h2>
        <div className="flex space-x-2">
          <span className="text-sm text-primary/80 bg-cyan-900/30 px-3 py-1 rounded-full font-mono">
            {fileName}
          </span>
          <span className="text-sm text-primary/80 bg-cyan-900/30 px-3 py-1 rounded-full font-mono">
            {rowCount} rows
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
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
          {rowCount > previewData.length && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={headers.length} className="text-center text-primary/70 italic">
                  Showing {previewData.length} of {rowCount} rows
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
        {previewData.length === 0 && <p className="text-center py-4 text-muted-foreground">No data to display in preview.</p>}
      </div>
    </section>
  );
}

