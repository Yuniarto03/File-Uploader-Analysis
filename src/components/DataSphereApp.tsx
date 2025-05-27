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

const initialChartState: ChartState = {
  chartType: 'bar',
  xAxis: '',
  yAxis: '',
  colorTheme: 'neon',
  showLegend: true,
  showDataLabels: false,
};

const initialPivotState: PivotState = {
  rows: '',
  columns: '',
  values: '',
  aggregation: 'sum',
};

export default function DataSphereApp() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analyzing quantum patterns...");
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  
  const [chartState, setChartState] = useState<ChartState>(initialChartState);
  const [pivotState, setPivotState] = useState<PivotState>(initialPivotState);
  
  const { toast } = useToast();

  const resetApplication = useCallback(() => {
    setFileData(null);
    setIsLoading(false);
    setLoadingStatus("Analyzing quantum patterns...");
    setActiveTab('summary');
    setAiInsights([]);
    setColumnStats([]);
    setChartState(initialChartState);
    setPivotState(initialPivotState);
    // Clear file input visually if possible (or instruct user)
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast({ title: "Application Reset", description: "Ready for new analysis." });
  }, [toast]);

  const handleFileProcessed = async (data: FileData) => {
    setFileData(data);
    setIsLoading(false);
    
    // Set initial chart and pivot axes
    if (data.headers.length > 0) {
      const firstHeader = data.headers[0];
      const numericHeaders = data.headers.filter(header => 
        data.parsedData.length > 0 && !isNaN(Number(data.parsedData[0][header]))
      );
      const firstNumericHeader = numericHeaders.length > 0 ? numericHeaders[0] : firstHeader;

      setChartState(prev => ({
        ...prev,
        xAxis: firstHeader,
        yAxis: firstNumericHeader || '',
      }));
      setPivotState(prev => ({
        ...prev,
        rows: firstHeader,
        columns: data.headers.length > 1 ? data.headers[1] : firstHeader,
        values: firstNumericHeader || '',
      }));
    }

    toast({ title: "File Processed", description: `${data.fileName} loaded successfully.` });

    // Fetch AI Insights
    if (data.parsedData.length > 0 && data.headers.length > 0) {
      try {
        setLoadingStatus("Generating AI insights...");
        setIsLoading(true);
        const insightsInput = {
          headers: data.headers,
          // Send a sample of data for AI processing
          data: data.parsedData.slice(0, 50).map(row => {
            const record: Record<string, any> = {};
            data.headers.forEach(header => {
              record[header] = row[header];
            });
            return record;
          }),
        };
        const result = await getDataInsights(insightsInput);
        setAiInsights(result.insights.map(insight => ({ id: Math.random().toString(), text: insight })));
        toast({ title: "AI Insights Generated", description: "Insights are available in the Summary tab." });
      } catch (error) {
        console.error("Error fetching AI insights:", error);
        toast({ variant: "destructive", title: "AI Insights Error", description: "Could not generate AI insights." });
        setAiInsights([]);
      } finally {
        setIsLoading(false);
        setLoadingStatus("Analyzing quantum patterns...");
      }
    }
  };

  const handleFileUploadError = (errorMsg: string) => {
    setIsLoading(false);
    toast({ variant: "destructive", title: "File Upload Error", description: errorMsg });
    resetApplication();
  };

  const handleExportExcel = () => {
    if (!fileData) return;
    try {
      exportToExcelFile(fileData.parsedData, fileData.headers, columnStats, pivotState, fileData.fileName, activeTab === 'pivot' ? document.getElementById('pivot-table-container') : null);
      toast({ title: "Export Successful", description: "Data exported to Excel." });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({ variant: "destructive", title: "Export Error", description: "Could not export to Excel." });
    }
  };

  const handleExportPPT = () => {
    if (!fileData) return;
    try {
      const chartCanvas = document.getElementById('data-sphere-chart') as HTMLCanvasElement;
      exportToPowerPointFile(fileData, columnStats, chartCanvas, activeTab === 'pivot' ? document.getElementById('pivot-table-container') : null);
      toast({ title: "Export Successful", description: "Data exported to PowerPoint." });
    } catch (error) {
      console.error("PowerPoint export error:", error);
      toast({ variant: "destructive", title: "Export Error", description: "Could not export to PowerPoint." });
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

      {isLoading && !fileData && ( // Show loading only when initially processing file
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
            isLoadingAiInsights={isLoading && aiInsights.length === 0} // Loading for AI insights
            columnStats={columnStats}
            setColumnStats={setColumnStats}
            chartState={chartState}
            setChartState={setChartState}
            pivotState={pivotState}
            setPivotState={setPivotState}
          />
          <ExportControls onExportExcel={handleExportExcel} onExportPPT={handleExportPPT} />
          <AnalysisActions onNewAnalysis={resetApplication} />
        </>
      )}
    </div>
  );
}
