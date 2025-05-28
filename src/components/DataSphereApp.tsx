
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataPreview from '@/components/DataPreview';
import DataAnalysisTabs from '@/components/DataAnalysisTabs';
import ExportControls from '@/components/ExportControls';
import AnalysisActions from '@/components/AnalysisActions';
import type { Header, ParsedRow, FileData, ColumnStats, ChartState, AIInsight, CustomSummaryState, CustomSummaryData, ChartAggregationType } from '@/types';
import { exportToExcelFile, exportToPowerPointFile, processUploadedFile } from '@/lib/file-handlers';
import { getDataInsights } from '@/ai/flows/data-insights';
import { useToast } from "@/hooks/use-toast";
import ChartModal from '@/components/ChartModal';
import { calculateColumnStats, generateCustomSummaryData } from '@/lib/data-helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Store the raw uploaded file
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analyzing quantum patterns...");
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  const [customAiPrompt, setCustomAiPrompt] = useState<string>('');
  
  const [chartState1, setChartState1] = useState<ChartState>({...initialChartState});
  const [chartState2, setChartState2] = useState<ChartState>({...initialChartState, chartType: 'line'}); 
  
  const [customSummaryState, setCustomSummaryState] = useState<CustomSummaryState>(initialCustomSummaryState);
  const [customSummaryData, setCustomSummaryData] = useState<CustomSummaryData | null>(null);
  
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [zoomedChartKey, setZoomedChartKey] = useState<'chart1' | 'chart2' | null>(null);
  const [showAllDataInPreview, setShowAllDataInPreview] = useState(false);
  
  const { toast } = useToast();

  const numericHeaders = useMemo(() => {
    if (!fileData) return [];
    return fileData.headers.filter(header => 
      fileData.parsedData.length > 0 && 
      fileData.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    );
  }, [fileData]);

  const resetApplication = useCallback(() => {
    setUploadedFile(null);
    setFileData(null);
    setIsLoading(false);
    setLoadingStatus("Analyzing quantum patterns...");
    setActiveTab('summary');
    setAiInsights([]);
    setColumnStats([]);
    setCustomAiPrompt('');
    setChartState1({...initialChartState});
    setChartState2({...initialChartState, chartType: 'line'});
    setCustomSummaryState(initialCustomSummaryState);
    setCustomSummaryData(null);
    setIsChartModalOpen(false);
    setZoomedChartKey(null);
    setShowAllDataInPreview(false);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast({ title: "Application Reset", description: "Ready for new analysis." });
  }, [toast]);

  const fetchAiInsights = useCallback(async (currentFileData: FileData) => { // Pass FileData
    if (!currentFileData || currentFileData.parsedData.length === 0 || currentFileData.headers.length === 0) {
      setAiInsights([]); 
      return;
    }
    try {
      setLoadingStatus(customAiPrompt ? "Re-generating AI insights with custom instructions..." : "Generating AI insights...");
      // setIsLoading(true); // isLoading is managed by the calling function
      setAiInsights([]); 
      const insightsInput = {
        headers: currentFileData.headers,
        data: currentFileData.parsedData.slice(0, 50).map(row => {
          const record: Record<string, any> = {};
          currentFileData.headers.forEach(header => {
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
      // setIsLoading(false); // isLoading is managed by the calling function
      setLoadingStatus("Analyzing quantum patterns...");
    }
  }, [customAiPrompt, toast]);


  const handleFileProcessed = useCallback(async (data: FileData) => {
    setFileData(data);
    // setIsLoading(false); // Moved to caller
    setCustomAiPrompt(''); 
    setActiveTab('summary'); 
    setShowAllDataInPreview(false);
    
    // Reset chart and summary states based on new data
    const newChartStateBase = {...initialChartState};
    const newCustomSummaryStateBase = {...initialCustomSummaryState};

    const calculatedStats = calculateColumnStats(data.parsedData, data.headers);
    setColumnStats(calculatedStats);
    
    if (data.headers.length > 0) {
        const firstHeader = data.headers[0] || '';
        const currentNumericHeaders = data.headers.filter(header => 
            data.parsedData.length > 0 && 
            data.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
        );
        const firstNumericHeader = currentNumericHeaders.length > 0 ? currentNumericHeaders[0] : '';

        const commonChartUpdates = {
            xAxis: firstHeader,
            yAxis: firstNumericHeader,
            yAxisAggregation: 'avg' as ChartAggregationType,
            filterColumn: '', filterValue: '', filterColumn2: '', filterValue2: '',
        };

        setChartState1(prev => ({ ...newChartStateBase, ...commonChartUpdates }));
        setChartState2(prev => ({ ...newChartStateBase, chartType: 'line', ...commonChartUpdates }));

        setCustomSummaryState(prev => ({
            ...newCustomSummaryStateBase,
            rowsField: firstHeader,
            columnsField: data.headers.length > 1 ? data.headers[1] : firstHeader,
            valuesField: firstNumericHeader,
            aggregation: 'sum',
            filterColumn1: '', filterValue1: '', filterColumn2: '', filterValue2: '',
        }));
    } else {
      setChartState1({...newChartStateBase});
      setChartState2({...newChartStateBase, chartType: 'line'});
      setCustomSummaryState({...newCustomSummaryStateBase});
    }
    setCustomSummaryData(null); // Reset custom summary data explicitly

    toast({ title: "File Processed", description: `${data.fileName} (Sheet: ${data.currentSheetName || 'Default'}) loaded successfully.` });
    await fetchAiInsights(data); 
  }, [fetchAiInsights, toast]);


  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setUploadedFile(file); // Store the raw file
    setLoadingStatus("Processing initial sheet...");
    try {
      const initialFileData = await processUploadedFile(file); // Process first sheet by default
      await handleFileProcessed(initialFileData);
    } catch (error: any) {
      console.error("Error processing file:", error);
      handleFileUploadError(error.message || 'Failed to process file.');
    } finally {
      setIsLoading(false);
      setLoadingStatus("Analyzing quantum patterns...");
    }
  };

  const handleSheetChange = async (newSheetName: string) => {
    if (!uploadedFile) {
      toast({ variant: "destructive", title: "Error", description: "No file uploaded to switch sheets." });
      return;
    }
    if (fileData && fileData.currentSheetName === newSheetName) {
      return; // No change if the same sheet is selected
    }

    setIsLoading(true);
    setLoadingStatus(`Processing sheet: ${newSheetName}...`);
    try {
      const newSheetFileData = await processUploadedFile(uploadedFile, newSheetName);
      await handleFileProcessed(newSheetFileData); // Re-use the processing logic
    } catch (error: any) {
      console.error(`Error processing sheet ${newSheetName}:`, error);
      toast({ variant: "destructive", title: "Sheet Change Error", description: `Could not process sheet ${newSheetName}. ${error.message}` });
      // Optionally, revert to previous sheet or reset, for now, it keeps the error state
    } finally {
      setIsLoading(false);
      setLoadingStatus("Analyzing quantum patterns...");
    }
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

      const newChartStateUpdates: Partial<ChartState> = {
        xAxis: customSummaryState.rowsField,
        yAxisAggregation: customSummaryState.aggregation as ChartAggregationType,
        filterColumn: customSummaryState.filterColumn1 || '',
        filterValue: customSummaryState.filterValue1 || '',
        filterColumn2: customSummaryState.filterColumn2 || '',
        filterValue2: customSummaryState.filterValue2 || '',
      };

      const currentNumericHeaders = fileData.headers.filter(header => 
        fileData.parsedData.length > 0 && 
        fileData.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
      );
      const valueFieldIsNumeric = currentNumericHeaders.includes(customSummaryState.valuesField);


      if (['sum', 'avg', 'min', 'max', 'sdev'].includes(customSummaryState.aggregation)) {
        if (valueFieldIsNumeric) {
          newChartStateUpdates.yAxis = customSummaryState.valuesField;
        } else {
          newChartStateUpdates.yAxis = ''; 
          toast({
            title: "Chart 1 Y-Axis Update",
            description: `Summary value field '${customSummaryState.valuesField}' is not numeric. Chart 1 Y-axis cleared. Please select a numeric Y-axis for Chart 1 if needed.`,
            variant: "default",
            duration: 7000,
          });
        }
      } else if (['count', 'unique'].includes(customSummaryState.aggregation)) {
        newChartStateUpdates.yAxis = customSummaryState.valuesField;
      }
      
      setChartState1(prev => ({ ...prev, ...newChartStateUpdates }));
      setActiveTab('visualization'); 

      toast({ title: "Custom Summary Generated", description: "Summary table created. Chart 1 visualization updated."});
    } catch (error) {
        console.error("Error generating custom summary:", error);
        toast({ variant: "destructive", title: "Summary Generation Error", description: `Could not generate summary. ${error instanceof Error ? error.message : String(error)}` });
        setCustomSummaryData(null);
    }
  }, [fileData, customSummaryState, toast, setActiveTab]);

  const handleOpenChartModal = (chartKey: 'chart1' | 'chart2') => {
    setZoomedChartKey(chartKey);
    setIsChartModalOpen(true);
  };

  const getChartConfigForModal = () => {
    if (zoomedChartKey === 'chart1') return chartState1;
    if (zoomedChartKey === 'chart2') return chartState2;
    return initialChartState; 
  };

  const handleToggleShowAllDataPreview = useCallback(() => {
    setShowAllDataInPreview(prev => !prev);
  }, []);


  const handleExportExcel = () => {
    if (!fileData) {
        toast({ variant: "destructive", title: "Export Error", description: "No data to export." });
        return;
    }
    try {
      exportToExcelFile(fileData.parsedData, fileData.headers, columnStats, fileData.fileName, customSummaryData, fileData.currentSheetName);
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
      const chartCanvas = document.getElementById('data-sphere-chart-1') as HTMLCanvasElement | null;
      exportToPowerPointFile(fileData, columnStats, chartState1, chartCanvas, customSummaryData, customSummaryState);
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
          onFileSelected={handleFileSelected} // Changed prop
          setLoading={setIsLoading} // FileUpload signals start of loading
          setLoadingStatus={setLoadingStatus}
          onFileUploadError={handleFileUploadError}
        />
      )}

      {isLoading && !fileData && ( // This covers the initial loading after file select
         <section id="loading-section" className="bg-glass rounded-lg p-6 glow flex flex-col items-center justify-center py-10">
           <LoadingSpinner />
           <div className="text-center mt-6">
             <p className="text-xl font-tech text-primary mb-2">PROCESSING DATA</p>
             <p id="loading-status-text" className="text-sm text-foreground/80 pulse-anim">{loadingStatus}</p>
           </div>
         </section>
      )}
      
      {isLoading && fileData && ( // This covers loading when switching sheets
         <section id="loading-sheet-section" className="bg-glass rounded-lg p-6 glow flex flex-col items-center justify-center py-10 my-4">
           <LoadingSpinner />
           <div className="text-center mt-6">
             <p className="text-xl font-tech text-primary mb-2">PROCESSING SHEET</p>
             <p id="loading-sheet-status-text" className="text-sm text-foreground/80 pulse-anim">{loadingStatus}</p>
           </div>
         </section>
      )}


      {fileData && !isLoading && ( // Render content when not loading
        <>
          {fileData.allSheetNames && fileData.allSheetNames.length > 1 && (
            <div className="mb-4 bg-glass p-4 rounded-lg glow slide-in">
              <Label htmlFor="sheet-selector" className="font-tech text-primary glow-text text-lg">Select Sheet:</Label>
              <Select
                value={fileData.currentSheetName || ''}
                onValueChange={handleSheetChange}
              >
                <SelectTrigger id="sheet-selector" className="custom-select mt-2">
                  <SelectValue placeholder="Select a sheet" />
                </SelectTrigger>
                <SelectContent>
                  {fileData.allSheetNames.map(sheetName => (
                    <SelectItem key={sheetName} value={sheetName}>
                      {sheetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DataPreview
            fileName={fileData.fileName}
            rowCount={fileData.parsedData.length}
            headers={fileData.headers}
            previewData={showAllDataInPreview ? fileData.parsedData : fileData.parsedData.slice(0, 5)}
            showAllData={showAllDataInPreview}
            onToggleShowAllData={handleToggleShowAllDataPreview}
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
            onRegenerateInsights={() => fetchAiInsights(fileData)} // Pass current fileData
            chartState1={chartState1}
            setChartState1={setChartState1}
            chartState2={chartState2}
            setChartState2={setChartState2}
            onOpenChartModal={handleOpenChartModal}
            customSummaryState={customSummaryState}
            setCustomSummaryState={setCustomSummaryState}
            customSummaryData={customSummaryData}
            onGenerateCustomSummary={handleGenerateCustomSummary}
            numericHeaders={numericHeaders}
          />
          <ExportControls onExportExcel={handleExportExcel} onExportPPT={handleExportPPT} />
          <AnalysisActions onNewAnalysis={resetApplication} />
          
          {zoomedChartKey && (
            <ChartModal
              isOpen={isChartModalOpen}
              onClose={() => { setIsChartModalOpen(false); setZoomedChartKey(null); }}
              parsedData={fileData.parsedData}
              chartConfig={getChartConfigForModal()}
              title={`Zoomed - ${getChartConfigForModal().chartType.charAt(0).toUpperCase() + getChartConfigForModal().chartType.slice(1)} Chart (${zoomedChartKey === 'chart1' ? 'Chart 1' : 'Chart 2'})`}
            />
          )}
        </>
      )}
    </div>
  );
}
