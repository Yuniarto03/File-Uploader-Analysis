
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataPreview from '@/components/DataPreview';
import DataAnalysisTabs from '@/components/DataAnalysisTabs';
import AnalysisActions from '@/components/AnalysisActions';
import type { Header, ParsedRow, FileData, ColumnStats, ChartState, AIInsight, CustomSummaryState, CustomSummaryData, ChartAggregationType, AggregationType } from '@/types';
import { getDataInsights } from '@/ai/flows/data-insights';
import { useToast } from "@/hooks/use-toast";
import ChartModal from '@/components/ChartModal';
import { calculateColumnStats, generateCustomSummaryData } from '@/lib/data-helpers';
import { processUploadedFile, exportToPowerPointFile } from '@/lib/file-handlers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Added Input
import { Search } from 'lucide-react'; // Added Search icon


const initialChartState: ChartState = {
  chartType: 'bar',
  xAxis: '',
  yAxis: '',
  yAxisAggregation: 'avg',
  yAxis2: '',
  yAxis2Aggregation: 'avg',
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analyzing quantum patterns...");
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // Default to dashboard
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
  const [searchTerm, setSearchTerm] = useState(''); // Added for search

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
    setActiveTab('dashboard');
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
    setSearchTerm(''); // Reset search term
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast({ title: "Application Reset", description: "Ready for new analysis." });
  }, [toast]);

  const fetchAiInsights = useCallback(async (currentFileData: FileData) => {
    if (!currentFileData || currentFileData.parsedData.length === 0 || currentFileData.headers.length === 0) {
      setAiInsights([]);
      return;
    }
    try {
      setLoadingStatus(customAiPrompt ? "Re-generating AI insights with custom instructions..." : "Generating AI insights...");
      setAiInsights([]); // Clear previous insights before fetching new ones
      const insightsInput = {
        headers: currentFileData.headers,
         data: currentFileData.parsedData.slice(0, 50).map(row => {
          const record: Record<string, string | number | boolean | null> = {};
            currentFileData.headers.forEach(header => {
            record[header] = row[header] as (string | number | boolean | null);
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
      toast({ variant: "destructive", title: "AI Insights Error", description: `Could not generate AI insights. ${error instanceof Error ? error.message : String(error)}` });
      setAiInsights([]); // Ensure insights are cleared on error
    } finally {
      setLoadingStatus("Analyzing quantum patterns..."); // Reset status
    }
  }, [customAiPrompt, toast]);


  const handleFileProcessedInternal = useCallback(async (data: FileData) => {
    setFileData(data);
    setCustomAiPrompt('');
    setActiveTab('dashboard'); // Default to dashboard after new file/sheet
    setShowAllDataInPreview(false);
    setSearchTerm(''); // Reset search term on new file/sheet

    const newChartStateBase: ChartState = {...initialChartState};
    const newCustomSummaryStateBase = {...initialCustomSummaryState};

    const calculatedStats = calculateColumnStats(data.parsedData, data.headers);
    setColumnStats(calculatedStats);

    const currentNumericHeaders = data.headers.filter(header =>
        data.parsedData.length > 0 &&
        data.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    );

    if (data.headers.length > 0) {
        const firstHeader = data.headers[0] || '';
        const firstNumericHeader = currentNumericHeaders.length > 0 ? currentNumericHeaders[0] : (data.headers[0] || '');

        const commonChartUpdates: Partial<ChartState> = {
            xAxis: firstHeader,
            yAxis: firstNumericHeader,
            yAxisAggregation: 'avg' as ChartAggregationType,
            yAxis2: '',
            yAxis2Aggregation: 'avg' as ChartAggregationType,
            filterColumn: '', filterValue: '', filterColumn2: '', filterValue2: '',
        };

        setChartState1(prev => ({ ...newChartStateBase, ...commonChartUpdates }));
        setChartState2(prev => ({ ...newChartStateBase, chartType: 'line', ...commonChartUpdates }));

        setCustomSummaryState(prev => ({
            ...newCustomSummaryStateBase,
            rowsField: firstHeader,
            columnsField: data.headers.length > 1 ? data.headers[1] : firstHeader,
            valuesField: firstNumericHeader,
            aggregation: 'sum' as AggregationType,
            filterColumn1: '', filterValue1: '', filterColumn2: '', filterValue2: '',
        }));
    } else {
      setChartState1({...newChartStateBase});
      setChartState2({...newChartStateBase, chartType: 'line'});
      setCustomSummaryState({...newCustomSummaryStateBase});
    }
    setCustomSummaryData(null);

    toast({
        title: `File Processed: ${data.fileName} ${data.currentSheetName ? `(Sheet: ${data.currentSheetName})` : ''}`,
        description: `${data.fileName} loaded successfully.`
    });
    await fetchAiInsights(data);
  }, [fetchAiInsights, toast]);


  const handleFileSelected = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingStatus(`Processing ${file.name}...`);
    setUploadedFile(file); // Store the raw file object

    try {
      // Process the first sheet by default
      const processedData = await processUploadedFile(file);
      await handleFileProcessedInternal(processedData);
    } catch (error: any) {
      console.error("Error during initial file processing:", error);
      toast({ variant: "destructive", title: "File Processing Error", description: error.message || 'Failed to process file.' });
      resetApplication(); // Reset application state on error
    } finally {
      setIsLoading(false);
    }
  }, [handleFileProcessedInternal, toast, resetApplication]);


  const handleSheetChange = useCallback(async (newSheetName: string) => {
    if (!uploadedFile) {
      toast({ variant: "destructive", title: "Error", description: "No file uploaded to change sheet." });
      return;
    }
    if (fileData?.currentSheetName === newSheetName) return;

    setIsLoading(true);
    setLoadingStatus(`Processing sheet: ${newSheetName}...`);
    try {
      // Reprocess the file with the target sheet name
      const processedData = await processUploadedFile(uploadedFile, newSheetName);
      await handleFileProcessedInternal(processedData);
    } catch (error: any) {
      console.error(`Error processing sheet ${newSheetName}:`, error);
      toast({ variant: "destructive", title: "Sheet Change Error", description: `Could not process sheet ${newSheetName}. ${error.message || ''}` });
      // Optionally, reset to a known good state or the previous sheet if processing fails
    } finally {
      setIsLoading(false);
    }
  }, [uploadedFile, fileData, handleFileProcessedInternal, toast]);


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
        yAxis2: '',
        yAxis2Aggregation: 'avg',
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

  const filteredPreviewData = useMemo(() => {
    if (!fileData) return [];
    if (!searchTerm) return fileData.parsedData;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return fileData.parsedData.filter(row =>
      fileData.headers.some(header =>
        String(row[header]).toLowerCase().includes(lowerSearchTerm)
      )
    );
  }, [fileData, searchTerm]);

  const dataForPreviewComponent = useMemo(() => {
    return showAllDataInPreview ? filteredPreviewData : filteredPreviewData.slice(0, 5);
  }, [showAllDataInPreview, filteredPreviewData]);


  return (
    <div className="w-full max-w-6xl space-y-8">
      {!fileData && !isLoading && (
        <FileUpload
          onFileSelected={handleFileSelected}
          setLoading={setIsLoading}
          setLoadingStatus={setLoadingStatus}
          onFileUploadError={handleFileUploadError}
        />
      )}

      {isLoading && (
         <section id="loading-section" className="bg-glass rounded-lg p-6 glow flex flex-col items-center justify-center py-10">
           <LoadingSpinner />
           <div className="text-center mt-6">
             <p className="text-xl font-tech text-primary mb-2">PROCESSING DATA</p>
             <p id="loading-status-text" className="text-sm text-foreground/80 pulse-anim">{loadingStatus}</p>
           </div>
         </section>
      )}

      {fileData && !isLoading && (
        <>
          <div className="bg-glass p-4 glow rounded-lg mb-6 slide-in">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70" />
                <Input
                  id="search-data"
                  type="text"
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 custom-select" // Using custom-select for consistent dark theme styling
                />
              </div>
              {fileData.allSheetNames && fileData.allSheetNames.length > 1 && fileData.currentSheetName && (
                <div className="md:w-1/3 w-full">
                  <Label htmlFor="sheet-selector" className="sr-only">
                    Select Sheet
                  </Label>
                  <Select
                    value={fileData.currentSheetName}
                    onValueChange={handleSheetChange}
                  >
                    <SelectTrigger id="sheet-selector" className="custom-select w-full">
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
            </div>
          </div>

          <DataPreview
            fileName={fileData.fileName}
            rowCount={filteredPreviewData.length} // Use length of filtered data
            headers={fileData.headers}
            previewData={dataForPreviewComponent}
            showAllData={showAllDataInPreview}
            onToggleShowAllData={handleToggleShowAllDataPreview}
          />
          <DataAnalysisTabs
            parsedData={fileData.parsedData} // Pass original full data for analysis tabs
            headers={fileData.headers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            aiInsights={aiInsights}
            isLoadingAiInsights={isLoading && aiInsights.length === 0}
            columnStats={columnStats}
            customAiPrompt={customAiPrompt}
            setCustomAiPrompt={setCustomAiPrompt}
            onRegenerateInsights={() => fetchAiInsights(fileData)}
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
          <AnalysisActions onNewAnalysis={resetApplication} />

          {zoomedChartKey && (
            <ChartModal
              isOpen={isChartModalOpen}
              onClose={() => { setIsChartModalOpen(false); setZoomedChartKey(null); }}
              parsedData={fileData.parsedData} // Pass original full data to modal
              chartConfig={getChartConfigForModal()}
              title={`Zoomed - ${getChartConfigForModal().chartType.charAt(0).toUpperCase() + getChartConfigForModal().chartType.slice(1)} Chart (${zoomedChartKey === 'chart1' ? 'Chart 1' : 'Chart 2'})`}
            />
          )}
        </>
      )}
    </div>
  );
}

