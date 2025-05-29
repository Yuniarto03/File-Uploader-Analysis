
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from '@/components/SummaryTab';
import VisualizationTab from '@/components/VisualizationTab';
import DashboardTab from '@/components/DashboardTab';
import type { Header, ParsedRow, ColumnStats, ChartState, CustomSummaryState, CustomSummaryData } from '@/types'; // AIInsight removed

interface DataAnalysisTabsProps {
  parsedData: ParsedRow[];
  headers: Header[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // aiInsights: AIInsight[]; // Removed
  // isLoadingAiInsights: boolean; // Removed
  columnStats: ColumnStats[];
  // customAiPrompt: string; // Removed
  // setCustomAiPrompt: (prompt: string) => void; // Removed
  // onRegenerateInsights: () => Promise<void>; // Removed
  chartState1: ChartState;
  setChartState1: (state: ChartState | ((prevState: ChartState) => ChartState)) => void;
  chartState2: ChartState;
  setChartState2: (state: ChartState | ((prevState: ChartState) => ChartState)) => void;
  onOpenChartModal: (chartKey: 'chart1' | 'chart2') => void;
  customSummaryState: CustomSummaryState;
  setCustomSummaryState: (state: CustomSummaryState | ((prevState: CustomSummaryState) => CustomSummaryState)) => void;
  customSummaryData: CustomSummaryData | null;
  onGenerateCustomSummary: () => void;
  numericHeaders: Header[];
}

export default function DataAnalysisTabs({
  parsedData,
  headers,
  activeTab,
  setActiveTab,
  // aiInsights, // Removed
  // isLoadingAiInsights, // Removed
  columnStats,
  // customAiPrompt, // Removed
  // setCustomAiPrompt, // Removed
  // onRegenerateInsights, // Removed
  chartState1,
  setChartState1,
  chartState2,
  setChartState2,
  onOpenChartModal,
  customSummaryState,
  setCustomSummaryState,
  customSummaryData,
  onGenerateCustomSummary,
  numericHeaders,
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
            value="dashboard" 
            className={`font-tech p-4 border-b-2 border-transparent rounded-none data-[state=active]:tab-active data-[state=inactive]:tab-inactive data-[state=active]:shadow-none`}
          >
            Dashboard
          </TabsTrigger>
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
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-0">
          <DashboardTab
            parsedData={parsedData}
            headers={headers}
            columnStats={columnStats}
            // aiInsights={aiInsights} // Removed
            customSummaryData={customSummaryData}
            chartState1={chartState1}
          />
        </TabsContent>
        <TabsContent value="summary" className="mt-0">
          <SummaryTab
            parsedData={parsedData}
            headers={headers}
            // aiInsights={aiInsights} // Removed
            // isLoadingAiInsights={isLoadingAiInsights} // Removed
            columnStats={columnStats} 
            // customAiPrompt={customAiPrompt} // Removed
            // setCustomAiPrompt={setCustomAiPrompt} // Removed
            // onRegenerateInsights={onRegenerateInsights} // Removed
            customSummaryState={customSummaryState}
            setCustomSummaryState={setCustomSummaryState}
            customSummaryData={customSummaryData}
            onGenerateCustomSummary={onGenerateCustomSummary}
            numericHeaders={numericHeaders}
          />
        </TabsContent>
        <TabsContent value="visualization" className="mt-0">
          <VisualizationTab 
            parsedData={parsedData} 
            headers={headers}
            chartState1={chartState1}
            setChartState1={setChartState1}
            chartState2={chartState2}
            setChartState2={setChartState2}
            onOpenChartModal={onOpenChartModal}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
