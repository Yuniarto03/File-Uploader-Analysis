
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataPreview from '@/components/DataPreview';
import DataAnalysisTabs from '@/components/DataAnalysisTabs';
import ExportControls from '@/components/ExportControls';
import AnalysisActions from '@/components/AnalysisActions';
import type { Header, ParsedRow, FileData, ColumnStats, PivotState, ChartState, AIInsight } from '@/types';
import { processUploadedFile, exportToExcelFile, exportToPowerPointFile } from '@/lib/file-handlers';
import { getDataInsights } from '@/ai/flows/data-insights';
import { useToast } from "@/hooks/use-toast";
import ChartModal from '@/components/ChartModal';

const initialChartState: ChartState = {
  chartType: 'bar', 
  xAxis: '',
  yAxis: '',
  yAxisAggregation: 'avg', // Default aggregation
  colorTheme: 'neon',
  showLegend: true,
  showDataLabels: false,
  filterColumn: '',
  filterValue: '',
  filterColumn2: '',
  filterValue2: '',
};

const initialPivotState: PivotState = {
  rows: '',
  columns: '',
  values: '',
  aggregation: 'sum', 
  filterColumn: '',
  filterValue: '',
  filterColumn2: '',
  filterValue2: '',
};

export default function DataSphereApp() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analyzing quantum patterns...");
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  const [customAiPrompt, setCustomAiPrompt] = useState<string>('');
  
  const [chartState, setChartState] = useState<ChartState>(initialChartState);
  const [pivotState, setPivotState] = useState<PivotState>(initialPivotState);
  
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  
  const { toast } = useToast();

  const resetApplication = useCallback(() => {
    setFileData(null);
    setIsLoading(false);
    setLoadingStatus("Analyzing quantum patterns...");
    setActiveTab('summary');
    setAiInsights([]);
    setColumnStats([]);
    setCustomAiPrompt('');
    setChartState(initialChartState);
    setPivotState(initialPivotState);
    setIsChartModalOpen(false);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast({ title: "Application Reset", description: "Ready for new analysis." });
  }, [toast]);

  const fetchAiInsights = useCallback(async () => {
    if (!fileData || fileData.parsedData.length === 0 || fileData.headers.length === 0) {
      setAiInsights([]); 
      return;
    }
    try {
      setLoadingStatus(customAiPrompt ? "Re-generating AI insights with custom instructions..." : "Generating AI insights...");
      setIsLoading(true);
      setAiInsights([]); 
      const insightsInput = {
        headers: fileData.headers,
        data: fileData.parsedData.slice(0, 50).map(row => {
          const record: Record<string, any> = {};
          fileData.headers.forEach(header => {
            record[header] = row[header];
          });
          return record;
        }),
        customInstructions: customAiPrompt || undefined,
      };
      const result = await getDataInsights(insightsInput);
      setAiInsights(result.insights.map(insight => ({ id: Math.random().toString(), text: insight })));
      toast({ title: customAiPrompt ? "AI Insights Updated" : "AI Insights Generated", description: "Insights are available in the Summary tab." });
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      toast({ variant: "destructive", title: "AI Insights Error", description: "Could not generate AI insights." });
      setAiInsights([]);
    } finally {
      setIsLoading(false);
      setLoadingStatus("Analyzing quantum patterns...");
    }
  }, [fileData, customAiPrompt, toast, setLoadingStatus, setIsLoading, setAiInsights]);

  const handleFileProcessed = async (data: FileData) => {
    setFileData(data);
    setIsLoading(false);
    setCustomAiPrompt(''); 
    setActiveTab('summary'); 
    
    setChartState(initialChartState);
    setPivotState(initialPivotState);

    if (data.headers.length > 0) {
      const firstHeader = data.headers[0];
      const numericHeaders = data.headers.filter(header => 
        data.parsedData.length > 0 && data.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
      );
      const firstNumericHeader = numericHeaders.length > 0 ? numericHeaders[0] : ''; 

      setChartState(prev => ({
        ...prev, 
        xAxis: firstHeader || '', 
        yAxis: firstNumericHeader,
        yAxisAggregation: 'avg', // Reset to default
      }));
      setPivotState(prev => ({
        ...prev, 
        rows: firstHeader || '',
        columns: data.headers.length > 1 ? data.headers[1] : (firstHeader || ''),
        values: firstNumericHeader,
      }));
    }

    toast({ title: "File Processed", description: `${data.fileName} loaded successfully.` });
    await fetchAiInsights(); 
  };

  const handleFileUploadError = (errorMsg: string) => {
    setIsLoading(false);
    toast({ variant: "destructive", title: "File Upload Error", description: errorMsg });
    resetApplication();
  };

  const handleExportExcel = () => {
    if (!fileData) {
        toast({ variant: "destructive", title: "Export Error", description: "No data to export." });
        return;
    }
    try {
      const pivotTableContainer = activeTab === 'pivot' ? document.getElementById('pivot-table-container') : null;
      exportToExcelFile(fileData.parsedData, fileData.headers, columnStats, pivotState, fileData.fileName, pivotTableContainer);
      toast({ title: "Export Successful", description: `${fileData.fileName}_analysis.xlsx has been downloaded.` });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({ variant: "destructive", title: "Export Error", description: `Could not export to Excel. ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const handleExportPPT = () => {
    if (!fileData) {
        toast({ variant: "destructive", title: "Export Error", description: "No data to export." });
        return;
    }
    try {
      const chartCanvas = document.getElementById('data-sphere-chart') as HTMLCanvasElement | null;
      const pivotTableContainer = activeTab === 'pivot' ? document.getElementById('pivot-table-container') : null;
      
      exportToPowerPointFile(fileData, columnStats, chartState, chartCanvas, pivotState, pivotTableContainer); // Pass pivotState
      toast({ title: "Export Successful", description: `${fileData.fileName}_presentation.pptx has been downloaded.` });
    } catch (error) {
      console.error("PowerPoint export error:", error);
      toast({ variant: "destructive", title: "Export Error", description: `Could not export to PowerPoint. ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-8">
      {!fileData && !isLoading && (
        <FileUpload
          onFileProcessed={handleFileProcessed}
          setLoading={setIsLoading}
          setLoadingStatus={setLoadingStatus}
          onFileUploadError={handleFileUploadError}
        />
      )}

      {isLoading && !fileData && (
         <section id="loading-section" className="bg-glass rounded-lg p-6 glow flex flex-col items-center justify-center py-10">
           <LoadingSpinner />
           <div className="text-center mt-6">
             <p className="text-xl font-tech text-primary mb-2">PROCESSING DATA</p>
             <p id="loading-status-text" className="text-sm text-foreground/80 pulse-anim">{loadingStatus}</p>
           </div>
         </section>
      )}

      {fileData && (
        <>
          <DataPreview
            fileName={fileData.fileName}
            rowCount={fileData.parsedData.length}
            headers={fileData.headers}
            previewData={fileData.parsedData.slice(0, 10)}
          />
          <DataAnalysisTabs
            parsedData={fileData.parsedData}
            headers={fileData.headers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            aiInsights={aiInsights}
            isLoadingAiInsights={isLoading && aiInsights.length === 0} 
            columnStats={columnStats}
            setColumnStats={setColumnStats}
            customAiPrompt={customAiPrompt}
            setCustomAiPrompt={setCustomAiPrompt}
            onRegenerateInsights={fetchAiInsights}
            chartState={chartState}
            setChartState={setChartState}
            pivotState={pivotState}
            setPivotState={setPivotState}
            onOpenChartModal={() => setIsChartModalOpen(true)}
          />
          <ExportControls onExportExcel={handleExportExcel} onExportPPT={handleExportPPT} />
          <AnalysisActions onNewAnalysis={resetApplication} />
          
          <ChartModal
            isOpen={isChartModalOpen}
            onClose={() => setIsChartModalOpen(false)}
            parsedData={fileData.parsedData}
            chartConfig={chartState}
            title={`Zoomed - ${chartState.chartType.charAt(0).toUpperCase() + chartState.chartType.slice(1)} Chart`}
          />
        </>
      )}
    </div>
  );
}
