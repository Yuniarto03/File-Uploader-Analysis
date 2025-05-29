
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type { ParsedRow, ChartState, ApplicationSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const DynamicDataVisualizationChart = dynamic(
  () => import('@/components/DataVisualizationChart'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
        <p className="ml-2 font-tech text-primary">Loading Chart...</p>
      </div>
    )
  }
);

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedRow[];
  chartConfig: ChartState;
  title?: string;
  appSettings: ApplicationSettings; // Added
}

export default function ChartModal({ 
  isOpen, 
  onClose, 
  parsedData, 
  chartConfig, 
  title = "Chart Details",
  appSettings, // Added
}: ChartModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1366px] max-w-[90vw] h-[768px] max-h-[85vh] flex flex-col p-0 bg-glass border-primary/50 glow">
        <DialogHeader className="p-4 border-b border-primary/30 flex flex-row justify-between items-center">
          <DialogTitle className="font-tech text-xl text-primary glow-text">{title}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-primary hover:text-accent hover:bg-transparent">
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex-grow p-4 overflow-hidden">
          <div className="relative w-full h-full"> 
            {chartConfig.xAxis && chartConfig.yAxis && parsedData.length > 0 ? (
              <DynamicDataVisualizationChart 
                parsedData={parsedData} 
                chartConfig={{...chartConfig, showDataLabels: true }} // Always show data labels in modal for clarity
                appSettings={appSettings} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Cannot display chart. Please ensure X/Y axes are selected and data is available.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
