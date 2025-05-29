
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from '@/components/SummaryTab';
import VisualizationTab from '@/components/VisualizationTab';
import AIDataSummaryTab from '@/components/AIDataSummaryTab';
import type { Header, ParsedRow, ColumnStats, ChartState, CustomSummaryState, CustomSummaryData, AIDataSummary, ApplicationSettings } from '@/types';

interface DataAnalysisTabsProps {
  parsedData: ParsedRow[];
  headers: Header[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  aiDataSummary: AIDataSummary | null;
  isLoadingAIDataSummary: boolean;
  columnStats: ColumnStats[];
  customAiPrompt: string;
  setCustomAiPrompt: (prompt: string) => void;
  onRegenerateAIDataSummary: () => Promise<void>;
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
  appSettings: ApplicationSettings; // Added
}

export default function DataAnalysisTabs({
  parsedData,
  headers,
  activeTab,
  setActiveTab,
  aiDataSummary,
  isLoadingAIDataSummary,
  columnStats,
  customAiPrompt,
  setCustomAiPrompt,
  onRegenerateAIDataSummary,
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
  appSettings, // Added
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
            value="aiSummary" 
            className={`font-tech p-4 border-b-2 border-transparent rounded-none data-[state=active]:tab-active data-[state=inactive]:tab-inactive data-[state=active]:shadow-none`}
          >
            AI Data Summary
          </TabsTrigger>
          <TabsTrigger 
            value="summary" 
            className={`font-tech p-4 border-b-2 border-transparent rounded-none data-[state=active]:tab-active data-[state=inactive]:tab-inactive data-[state=active]:shadow-none`}
          >
            Custom Summary
          </TabsTrigger>
          <TabsTrigger 
            value="visualization" 
            className={`font-tech p-4 border-b-2 border-transparent rounded-none data-[state=active]:tab-active data-[state=inactive]:tab-inactive data-[state=active]:shadow-none`}
          >
            Visualization
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="aiSummary" className="mt-0">
          <AIDataSummaryTab
            aiDataSummary={aiDataSummary}
            isLoadingAIDataSummary={isLoadingAIDataSummary}
            customAiPrompt={customAiPrompt}
            setCustomAiPrompt={setCustomAiPrompt}
            onRegenerateAIDataSummary={onRegenerateAIDataSummary}
            fileDataAvailable={parsedData.length > 0}
          />
        </TabsContent>
        <TabsContent value="summary" className="mt-0">
          <SummaryTab
            parsedData={parsedData}
            headers={headers}
            columnStats={columnStats} 
            customSummaryState={customSummaryState}
            setCustomSummaryState={setCustomSummaryState}
            customSummaryData={customSummaryData}
            onGenerateCustomSummary={onGenerateCustomSummary}
            numericHeaders={numericHeaders}
            appSettings={appSettings} // Pass appSettings
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
            appSettings={appSettings} // Pass appSettings
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
