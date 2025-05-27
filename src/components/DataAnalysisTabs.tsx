"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from '@/components/SummaryTab';
import VisualizationTab from '@/components/VisualizationTab';
import PivotTab from '@/components/PivotTab';
import type { Header, ParsedRow, AIInsight, ColumnStats, ChartState, PivotState } from '@/types';

interface DataAnalysisTabsProps {
  parsedData: ParsedRow[];
  headers: Header[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aiInsights: AIInsight[];
  isLoadingAiInsights: boolean;
  columnStats: ColumnStats[];
  setColumnStats: (stats: ColumnStats[]) => void;
  chartState: ChartState;
  setChartState: (state: ChartState | ((prevState: ChartState) => ChartState)) => void;
  pivotState: PivotState;
  setPivotState: (state: PivotState | ((prevState: PivotState) => PivotState)) => void;
}

export default function DataAnalysisTabs({
  parsedData,
  headers,
  activeTab,
  setActiveTab,
  aiInsights,
  isLoadingAiInsights,
  columnStats,
  setColumnStats,
  chartState,
  setChartState,
  pivotState,
  setPivotState,
}: DataAnalysisTabsProps) {
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <section id="analysis-section" className="bg-glass p-6 glow slide-in">
      <h2 className="text-2xl font-tech text-primary glow-text mb-4">Data Analysis</h2>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-cyan-800/50 mb-6 p-0 rounded-none">
          <TabsTrigger 
            value="summary" 
            className={`font-tech p-4 border-b-2 border-transparent rounded-none data-[state=active]:tab-active data-[state=inactive]:tab-inactive data-[state=active]:shadow-none`}
          >
            Summary
          </TabsTrigger>
          <TabsTrigger 
            value="visualization" 
            className={`font-tech p-4 border-b-2 border-transparent rounded-none data-[state=active]:tab-active data-[state=inactive]:tab-inactive data-[state=active]:shadow-none`}
          >
            Visualization
          </TabsTrigger>
          <TabsTrigger 
            value="pivot" 
            className={`font-tech p-4 border-b-2 border-transparent rounded-none data-[state=active]:tab-active data-[state=inactive]:tab-inactive data-[state=active]:shadow-none`}
          >
            Pivot Table
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-0">
          <SummaryTab
            parsedData={parsedData}
            headers={headers}
            aiInsights={aiInsights}
            isLoadingAiInsights={isLoadingAiInsights}
            columnStats={columnStats}
            setColumnStats={setColumnStats}
          />
        </TabsContent>
        <TabsContent value="visualization" className="mt-0">
          <VisualizationTab 
            parsedData={parsedData} 
            headers={headers}
            chartState={chartState}
            setChartState={setChartState}
          />
        </TabsContent>
        <TabsContent value="pivot" className="mt-0">
          <PivotTab 
            parsedData={parsedData} 
            headers={headers}
            pivotState={pivotState}
            setPivotState={setPivotState}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
