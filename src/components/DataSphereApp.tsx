
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataPreview from '@/components/DataPreview';
import DataAnalysisTabs from '@/components/DataAnalysisTabs';
import ExportControls from '@/components/ExportControls';
import AnalysisActions from '@/components/AnalysisActions';
import type { Header, ParsedRow, FileData, ColumnStats, ChartState, AIInsight, CustomSummaryState, CustomSummaryData, ChartAggregationType } from '@/types';
import { exportToExcelFile, exportToPowerPointFile } from '@/lib/file-handlers';
import { getDataInsights } from '@/ai/flows/data-insights';
import { useToast } from "@/hooks/use-toast";
import ChartModal from '@/components/ChartModal';
import { calculateColumnStats, generateCustomSummaryData } from '@/lib/data-helpers';


const initialChartState: ChartState = {
  chartType: 'bar', 
  xAxis: '',
  yAxis: '',
  yAxisAggregation: 'avg',
  colorTheme: 'neon',
  showLegend: true,
  showDataLabels: false,
  filterColumn: '',
  filterValue: '',
  filterColumn2: '',
  filterValue2: '',
};

const initialCustomSummaryState: CustomSummaryState = {
  rowsField: '',
  columnsField: '',
  valuesField: '',
  aggregation: 'sum',
  filterColumn1: '',
  filterValue1: '',
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
  const [customSummaryState, setCustomSummaryState] = useState<CustomSummaryState>(initialCustomSummaryState);
  const [customSummaryData, setCustomSummaryData] = useState<CustomSummaryData | null>(null);
  
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  
  const { toast } = useToast();

  const numericHeaders = useMemo(() => {
    if (!fileData) return [];
    return fileData.headers.filter(header => 
      fileData.parsedData.length > 0 && 
      fileData.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    );
  }, [fileData]);

  const resetApplication = useCallback(() => {
    setFileData(null);
    setIsLoading(false);
    setLoadingStatus("Analyzing quantum patterns...");
    setActiveTab('summary');
    setAiInsights([]);
    setColumnStats([]);
    setCustomAiPrompt('');
    setChartState(initialChartState);
    setCustomSummaryState(initialCustomSummaryState);
    setCustomSummaryData(null);
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
  }, [fileData, customAiPrompt, toast]);

  const handleFileProcessed = async (data: FileData) => {
    setFileData(data);
    setIsLoading(false);
    setCustomAiPrompt(''); 
    setActiveTab('summary'); 
    
    setChartState(initialChartState);
    setCustomSummaryState(initialCustomSummaryState);
    setCustomSummaryData(null);

    const calculatedStats = calculateColumnStats(data.parsedData, data.headers);
    setColumnStats(calculatedStats);
    
    // Auto-populate initial fields for summary and chart based on new file data
    if (data.headers.length > 0) {
        const firstHeader = data.headers[0] || '';
        const currentNumericHeaders = data.headers.filter(header => 
            data.parsedData.length > 0 && 
            data.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
        );
        const firstNumericHeader = currentNumericHeaders.length > 0 ? currentNumericHeaders[0] : '';

        setChartState(prev => ({
            ...prev,
            xAxis: firstHeader,
            yAxis: firstNumericHeader,
            yAxisAggregation: 'avg',
            filterColumn: '', filterValue: '', filterColumn2: '', filterValue2: '', // Reset filters
        }));

        setCustomSummaryState(prev => ({
            ...prev,
            rowsField: firstHeader,
            columnsField: data.headers.length > 1 ? data.headers[1] : firstHeader,
            valuesField: firstNumericHeader,
            aggregation: 'sum',
            filterColumn1: '', filterValue1: '', filterColumn2: '', filterValue2: '', // Reset filters
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

  const handleGenerateCustomSummary = useCallback(() => {
    if (!fileData || !customSummaryState.rowsField || !customSummaryState.valuesField) {
      toast({ variant: "destructive", title: "Summary Error", description: "Please select Row and Value fields for the summary." });
      setCustomSummaryData(null);
      return;
    }
    try {
      const summary = generateCustomSummaryData(fileData.parsedData, customSummaryState, fileData.headers);
      setCustomSummaryData(summary);

      // Automatically update chart state based on summary configuration
      const newChartStateUpdates: Partial<ChartState> = {
        xAxis: customSummaryState.rowsField,
        yAxisAggregation: customSummaryState.aggregation as ChartAggregationType,
        filterColumn: customSummaryState.filterColumn1 || '',
        filterValue: customSummaryState.filterValue1 || '',
        filterColumn2: customSummaryState.filterColumn2 || '',
        filterValue2: customSummaryState.filterValue2 || '',
      };

      const valueFieldIsNumeric = numericHeaders.some(h => h === customSummaryState.valuesField);

      if (['sum', 'avg', 'min', 'max', 'sdev'].includes(customSummaryState.aggregation)) {
        if (valueFieldIsNumeric) {
          newChartStateUpdates.yAxis = customSummaryState.valuesField;
        } else {
          newChartStateUpdates.yAxis = ''; // Clear yAxis if not numeric for these aggregations
          toast({
            title: "Chart Y-Axis Update",
            description: `Summary value field '${customSummaryState.valuesField}' is not numeric. Chart Y-axis cleared. Please select a numeric Y-axis for the chart if needed.`,
            variant: "default",
            duration: 7000,
          });
        }
      } else if (['count', 'unique'].includes(customSummaryState.aggregation)) {
        newChartStateUpdates.yAxis = customSummaryState.valuesField;
      }
      
      setChartState(prev => ({ ...prev, ...newChartStateUpdates }));
      setActiveTab('visualization'); // Switch to visualization tab after generating summary

      toast({ title: "Custom Summary Generated", description: "Summary table created and chart visualization updated."});
    } catch (error) {
        console.error("Error generating custom summary:", error);
        toast({ variant: "destructive", title: "Summary Generation Error", description: `Could not generate summary. ${error instanceof Error ? error.message : String(error)}` });
        setCustomSummaryData(null);
    }
  }, [fileData, customSummaryState, toast, numericHeaders, setActiveTab]);


  const handleExportExcel = () => {
    if (!fileData) {
        toast({ variant: "destructive", title: "Export Error", description: "No data to export." });
        return;
    }
    try {
      exportToExcelFile(fileData.parsedData, fileData.headers, columnStats, fileData.fileName, customSummaryData);
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
      exportToPowerPointFile(fileData, columnStats, chartState, chartCanvas, customSummaryData, customSummaryState);
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
            customAiPrompt={customAiPrompt}
            setCustomAiPrompt={setCustomAiPrompt}
            onRegenerateInsights={fetchAiInsights}
            chartState={chartState}
            setChartState={setChartState}
            onOpenChartModal={() => setIsChartModalOpen(true)}
            customSummaryState={customSummaryState}
            setCustomSummaryState={setCustomSummaryState}
            customSummaryData={customSummaryData}
            onGenerateCustomSummary={handleGenerateCustomSummary}
            numericHeaders={numericHeaders}
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

