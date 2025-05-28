
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from '@/components/SummaryTab';
import VisualizationTab from '@/components/VisualizationTab';
import DashboardTab from '@/components/DashboardTab'; // Added
import type { Header, ParsedRow, AIInsight, ColumnStats, ChartState, CustomSummaryState, CustomSummaryData } from '@/types';

interface DataAnalysisTabsProps {
  parsedData: ParsedRow[];
  headers: Header[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aiInsights: AIInsight[];
  isLoadingAiInsights: boolean;
  columnStats: ColumnStats[];
  customAiPrompt: string;
  setCustomAiPrompt: (prompt: string) => void;
  onRegenerateInsights: () => Promise<void>;
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
  aiInsights,
  isLoadingAiInsights,
  columnStats,
  customAiPrompt,
  setCustomAiPrompt,
  onRegenerateInsights,
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
        <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-cyan-800/50 mb-6 p-0 rounded-none"> {/* Changed grid-cols-2 to grid-cols-3 */}
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
            aiInsights={aiInsights}
            customSummaryData={customSummaryData}
            chartState1={chartState1}
          />
        </TabsContent>
        <TabsContent value="summary" className="mt-0">
          <SummaryTab
            parsedData={parsedData}
            headers={headers}
            aiInsights={aiInsights}
            isLoadingAiInsights={isLoadingAiInsights}
            columnStats={columnStats} 
            customAiPrompt={customAiPrompt}
            setCustomAiPrompt={setCustomAiPrompt}
            onRegenerateInsights={onRegenerateInsights}
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
