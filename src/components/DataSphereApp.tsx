
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataPreview from '@/components/DataPreview';
import DataAnalysisTabs from '@/components/DataAnalysisTabs';
import AnalysisActions from '@/components/AnalysisActions';
import type { Header, ParsedRow, FileData, ColumnStats, ChartState, CustomSummaryState, CustomSummaryData, ChartAggregationType, AggregationType, AIDataSummary, ApplicationSettings, AppThemeSetting } from '@/types';
import { getDataInsights } from '@/ai/flows/data-insights';
import { useToast } from "@/hooks/use-toast";
import ChartModal from '@/components/ChartModal';
import ApplicationSettingsModal from '@/components/ApplicationSettingsModal';
import { calculateColumnStats, generateCustomSummaryData } from '@/lib/data-helpers';
import { processUploadedFile } from '@/lib/file-handlers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';


const initialChartState: ChartState = {
  chartType: 'bar',
  xAxis: '',
  yAxis: '',
  yAxisAggregation: 'avg',
  yAxis2: '',
  yAxis2Aggregation: 'avg',
  showYAxis2: true,
  colorTheme: 'dark', 
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

const initialApplicationSettings: ApplicationSettings = {
  theme: 'dark', 
  chartAnimations: true,
  autoGenerateAIInsights: true,
  dataPrecision: 2,
};

// Define HSL color palettes for themes
const themePalettes: Record<AppThemeSetting, Record<string, string>> = {
  dark: { 
    '--background': '216 50% 5%', 
    '--foreground': '196 100% 94%', 
    '--card': '220 31% 7%', 
    '--card-foreground': '196 100% 94%',
    '--popover': '220 31% 10%',
    '--popover-foreground': '196 100% 94%',
    '--primary': '180 100% 50%', 
    '--primary-foreground': '216 50% 5%',
    '--secondary': '217 100% 50%', 
    '--secondary-foreground': '196 100% 94%',
    '--muted': '218 38% 9%', 
    '--muted-foreground': '196 100% 65%', 
    '--accent': '307 100% 50%', 
    '--accent-foreground': '196 100% 94%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '180 100% 30%', 
    '--input': '218 38% 12%', 
    '--ring': '180 100% 60%', 
  },
  cyber: {
    '--background': '220 40% 6%',
    '--foreground': '200 100% 95%',
    '--card': '220 40% 8%',
    '--card-foreground': '200 100% 95%',
    '--popover': '220 40% 11%',
    '--popover-foreground': '200 100% 95%',
    '--primary': '190 100% 50%',
    '--primary-foreground': '220 40% 6%',
    '--secondary': '210 100% 55%',
    '--secondary-foreground': '200 100% 95%',
    '--muted': '220 30% 10%',
    '--muted-foreground': '200 100% 70%',
    '--accent': '240 100% 60%',
    '--accent-foreground': '200 100% 95%',
    '--destructive': '0 80% 55%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '190 100% 35%',
    '--input': '220 40% 10%',
    '--ring': '190 100% 65%',
  },
  neon: {
    '--background': '270 30% 4%',
    '--foreground': '60 100% 90%',
    '--card': '270 30% 6%',
    '--card-foreground': '60 100% 90%',
    '--popover': '270 30% 9%',
    '--popover-foreground': '60 100% 90%',
    '--primary': '320 100% 55%',
    '--primary-foreground': '270 30% 4%',
    '--secondary': '180 100% 50%',
    '--secondary-foreground': '270 30% 4%',
    '--muted': '270 20% 8%',
    '--muted-foreground': '60 100% 70%',
    '--accent': '120 100% 50%',
    '--accent-foreground': '270 30% 4%',
    '--destructive': '0 100% 50%',
    '--destructive-foreground': '60 100% 90%',
    '--border': '320 100% 35%',
    '--input': '270 30% 7%',
    '--ring': '320 100% 65%',
  },
  quantum: {
    '--background': '240 60% 5%', 
    '--foreground': '200 80% 90%', 
    '--card': '240 50% 8%', 
    '--card-foreground': '200 80% 90%',
    '--popover': '240 50% 11%',
    '--popover-foreground': '200 80% 90%',
    '--primary': '180 100% 45%', 
    '--primary-foreground': '240 60% 5%',
    '--secondary': '275 100% 60%', 
    '--secondary-foreground': '200 80% 90%',
    '--muted': '240 40% 10%', 
    '--muted-foreground': '200 80% 65%', 
    '--accent': '220 100% 60%', 
    '--accent-foreground': '200 80% 90%',
    '--destructive': '350 70% 50%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '180 100% 25%', 
    '--input': '240 50% 9%', 
    '--ring': '180 100% 55%', 
  },
  matrix: {
    '--background': '120 60% 5%', 
    '--foreground': '120 100% 85%', 
    '--card': '120 50% 8%', 
    '--card-foreground': '120 100% 85%',
    '--popover': '120 50% 11%',
    '--popover-foreground': '120 100% 85%',
    '--primary': '120 100% 50%', 
    '--primary-foreground': '120 60% 5%',
    '--secondary': '120 80% 70%', 
    '--secondary-foreground': '120 60% 5%',
    '--muted': '120 40% 10%', 
    '--muted-foreground': '120 100% 60%', 
    '--accent': '120 70% 40%', 
    '--accent-foreground': '120 100% 85%',
    '--destructive': '0 70% 45%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '120 100% 25%', 
    '--input': '120 50% 9%', 
    '--ring': '120 100% 60%', 
  },
  void: {
    '--background': '0 0% 2%', 
    '--foreground': '0 0% 95%', 
    '--card': '0 0% 5%', 
    '--card-foreground': '0 0% 95%',
    '--popover': '0 0% 8%',
    '--popover-foreground': '0 0% 95%',
    '--primary': '0 0% 80%', 
    '--primary-foreground': '0 0% 2%',
    '--secondary': '0 0% 50%', 
    '--secondary-foreground': '0 0% 95%',
    '--muted': '0 0% 10%', 
    '--muted-foreground': '0 0% 60%', 
    '--accent': '25 100% 50%', 
    '--accent-foreground': '0 0% 2%',
    '--destructive': '0 80% 50%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '0 0% 20%', 
    '--input': '0 0% 6%', 
    '--ring': '25 100% 60%', 
  },
  glitch: {
    '--background': '240 10% 10%', 
    '--foreground': '210 15% 85%', 
    '--card': '240 10% 13%', 
    '--card-foreground': '210 15% 85%',
    '--popover': '240 10% 16%',
    '--popover-foreground': '210 15% 85%',
    '--primary': '180 100% 50%', 
    '--primary-foreground': '240 10% 10%',
    '--secondary': '300 100% 50%', 
    '--secondary-foreground': '240 10% 10%',
    '--muted': '240 8% 15%', 
    '--muted-foreground': '210 15% 60%', 
    '--accent': '270 100% 65%', 
    '--accent-foreground': '210 15% 85%',
    '--destructive': '0 75% 55%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '180 100% 30%', 
    '--input': '240 10% 14%', 
    '--ring': '180 100% 60%', 
  },
  arcade: {
    '--background': '260 50% 8%', 
    '--foreground': '45 100% 90%', 
    '--card': '260 50% 11%', 
    '--card-foreground': '45 100% 90%',
    '--popover': '260 50% 14%',
    '--popover-foreground': '45 100% 90%',
    '--primary': '50 100% 50%', 
    '--primary-foreground': '260 50% 8%',
    '--secondary': '330 100% 55%', 
    '--secondary-foreground': '260 50% 8%',
    '--muted': '260 40% 12%', 
    '--muted-foreground': '45 100% 70%', 
    '--accent': '170 100% 45%', 
    '--accent-foreground': '260 50% 8%',
    '--destructive': '0 90% 55%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '50 100% 30%', 
    '--input': '260 50% 12%', 
    '--ring': '50 100% 60%', 
  },
};


interface DataSphereAppProps {
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
}

export default function DataSphereApp({ isSettingsModalOpen, setIsSettingsModalOpen }: DataSphereAppProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analyzing quantum patterns...");
  const [activeTab, setActiveTab] = useState<string>('aiSummary');
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  
  const [aiDataSummary, setAiDataSummary] = useState<AIDataSummary | null>(null);
  const [isLoadingAIDataSummary, setIsLoadingAIDataSummary] = useState<boolean>(false);
  const [customAiPrompt, setCustomAiPrompt] = useState<string>('');

  const [chartState1, setChartState1] = useState<ChartState>({...initialChartState});
  const [chartState2, setChartState2] = useState<ChartState>({...initialChartState, chartType: 'line'});

  const [customSummaryState, setCustomSummaryState] = useState<CustomSummaryState>(initialCustomSummaryState);
  const [customSummaryData, setCustomSummaryData] = useState<CustomSummaryData | null>(null);

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [zoomedChartKey, setZoomedChartKey] = useState<'chart1' | 'chart2' | null>(null);
  const [showAllDataInPreview, setShowAllDataInPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [appSettings, setAppSettings] = useState<ApplicationSettings>(initialApplicationSettings);

  const { toast } = useToast();

  useEffect(() => {
    const root = document.documentElement;
    const palette = themePalettes[appSettings.theme];
    for (const [key, value] of Object.entries(palette)) {
      root.style.setProperty(key, value);
    }
    
    setChartState1(prev => ({ ...prev, colorTheme: appSettings.theme }));
    setChartState2(prev => ({ ...prev, colorTheme: appSettings.theme }));
  }, [appSettings.theme]);


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
    setActiveTab('aiSummary');
    setColumnStats([]);
    setAiDataSummary(null);
    setIsLoadingAIDataSummary(false);
    setCustomAiPrompt('');
    setChartState1({...initialChartState, colorTheme: appSettings.theme});
    setChartState2({...initialChartState, chartType: 'line', colorTheme: appSettings.theme});
    setCustomSummaryState(initialCustomSummaryState);
    setCustomSummaryData(null);
    setIsChartModalOpen(false);
    setZoomedChartKey(null);
    setShowAllDataInPreview(false);
    setSearchTerm('');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast({ title: "Application Reset", description: "Ready for new analysis." });
  }, [toast, appSettings.theme]);

  const fetchAIDataSummary = useCallback(async (data: FileData, prompt?: string) => {
    if (!data || data.parsedData.length === 0) {
      setAiDataSummary(null);
      return;
    }
    if (!appSettings.autoGenerateAIInsights && !prompt && !customAiPrompt) { 
        setAiDataSummary(null);
        if (!prompt && !customAiPrompt) { 
          toast({ title: "AI Summary Skipped", description: "Auto-generation of AI Summary is turned off in settings.", duration: 3000});
        }
        return;
    }
    setIsLoadingAIDataSummary(true);
    setAiDataSummary(null); 
    try {
      const insightsInput = {
        headers: data.headers,
        data: data.parsedData, 
        customInstructions: prompt || customAiPrompt || undefined,
      };
      const result = await getDataInsights(insightsInput);
      setAiDataSummary(result);
      toast({ title: "AI Data Summary Generated", description: "Insights are ready in the AI Data Summary tab." });
    } catch (error) {
      console.error("Error fetching AI data summary:", error);
      toast({ variant: "destructive", title: "AI Summary Error", description: "Could not generate AI insights." });
      setAiDataSummary(null);
    } finally {
      setIsLoadingAIDataSummary(false);
    }
  }, [toast, appSettings.autoGenerateAIInsights, customAiPrompt]);


  const handleFileProcessedInternal = useCallback(async (data: FileData) => {
    setFileData(data);
    setCustomAiPrompt(''); 
    setActiveTab('aiSummary'); 
    setShowAllDataInPreview(false);
    setSearchTerm('');

    const newChartStateBase: ChartState = {...initialChartState, colorTheme: appSettings.theme, showYAxis2: true };
    const newCustomSummaryStateBase = {...initialCustomSummaryState};

    const calculatedStats = calculateColumnStats(data.parsedData, data.headers);
    setColumnStats(calculatedStats);

    const currentNumericHeaders = data.headers.filter(header =>
        data.parsedData.length > 0 &&
        data.parsedData.some(row => row[header] !== null && row[header] !== undefined && !isNaN(Number(row[header])))
    );

    if (data.headers.length > 0) {
        const firstHeader = data.headers[0] || '';
        let firstNumericHeader = currentNumericHeaders.length > 0 ? currentNumericHeaders[0] : '';
        if (!firstNumericHeader && data.headers.length > 0) { 
            firstNumericHeader = data.headers[0];
        }

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
            columnsField: data.headers.length > 1 ? data.headers[1] : (data.headers[0] || ''),
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
        title: `File Processed: ${data.fileName}${data.currentSheetName ? ` (Sheet: ${data.currentSheetName})` : ''}`,
        description: `${data.fileName} loaded successfully.`
    });
    if (appSettings.autoGenerateAIInsights) {
      await fetchAIDataSummary(data, customAiPrompt); 
    }
  }, [toast, fetchAIDataSummary, customAiPrompt, appSettings.theme, appSettings.autoGenerateAIInsights]);


  const handleFileSelected = useCallback(async (file: File, targetSheetName?: string) => {
    setIsLoading(true);
    setLoadingStatus(`Processing ${file.name}${targetSheetName ? ` (Sheet: ${targetSheetName})` : ''}...`);
    if (!targetSheetName) { 
        setUploadedFile(file);
    }
    setAiDataSummary(null); 

    try {
      const processedData = await processUploadedFile(file, targetSheetName);
      await handleFileProcessedInternal(processedData);
    } catch (error: any) {
      console.error("Error during file processing:", error);
      toast({ variant: "destructive", title: "File Processing Error", description: error.message || 'Failed to process file.' });
      resetApplication(); 
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
    await handleFileSelected(uploadedFile, newSheetName);
  }, [uploadedFile, fileData, handleFileSelected, toast]);

  const handleRegenerateAIDataSummary = useCallback(async () => {
    if (fileData) {
      await fetchAIDataSummary(fileData, customAiPrompt);
    } else {
      toast({ title: "No Data", description: "Please upload a file first to generate AI summary." });
    }
  }, [fileData, customAiPrompt, fetchAIDataSummary, toast]);


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
        colorTheme: appSettings.theme,
        showYAxis2: true,
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
  }, [fileData, customSummaryState, toast, setActiveTab, appSettings.theme]);

  const handleOpenChartModal = (chartKey: 'chart1' | 'chart2') => {
    setZoomedChartKey(chartKey);
    setIsChartModalOpen(true);
  };

  const getChartConfigForModal = () => {
    if (zoomedChartKey === 'chart1') return {...chartState1, showDataLabels: true };
    if (zoomedChartKey === 'chart2') return {...chartState2, showDataLabels: true };
    return initialChartState; 
  };

  const handleToggleShowAllDataPreview = useCallback(() => {
    setShowAllDataInPreview(prev => !prev);
  }, []);

  const globallyFilteredData = useMemo(() => {
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
    return showAllDataInPreview ? globallyFilteredData : globallyFilteredData.slice(0, 5);
  }, [showAllDataInPreview, globallyFilteredData]);

  const handleSaveSettings = (newSettings: ApplicationSettings) => {
    setAppSettings(newSettings);
    
    if (newSettings.autoGenerateAIInsights && !appSettings.autoGenerateAIInsights && fileData) {
        fetchAIDataSummary(fileData, customAiPrompt);
    }
    toast({ title: "Settings Saved", description: "Application settings have been updated." });
  };


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
                  className="pl-10 custom-select"
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
            rowCount={globallyFilteredData.length} 
            headers={fileData.headers}
            previewData={dataForPreviewComponent}
            originalDataForFilters={fileData.parsedData}
            showAllData={showAllDataInPreview}
            onToggleShowAllData={handleToggleShowAllDataPreview}
          />
          <DataAnalysisTabs
            parsedData={fileData.parsedData}
            headers={fileData.headers}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            aiDataSummary={aiDataSummary}
            isLoadingAIDataSummary={isLoadingAIDataSummary}
            customAiPrompt={customAiPrompt}
            setCustomAiPrompt={setCustomAiPrompt}
            onRegenerateAIDataSummary={handleRegenerateAIDataSummary}
            columnStats={columnStats}
            chartState1={{...chartState1, showDataLabels: chartState1.showDataLabels}} 
            setChartState1={setChartState1}
            chartState2={{...chartState2, showDataLabels: chartState2.showDataLabels}} 
            setChartState2={setChartState2}
            onOpenChartModal={handleOpenChartModal}
            customSummaryState={customSummaryState}
            setCustomSummaryState={setCustomSummaryState}
            customSummaryData={customSummaryData}
            onGenerateCustomSummary={handleGenerateCustomSummary}
            numericHeaders={numericHeaders}
            appSettings={appSettings}
          />
          <AnalysisActions onNewAnalysis={resetApplication} />

          {zoomedChartKey && (
            <ChartModal
              isOpen={isChartModalOpen}
              onClose={() => { setIsChartModalOpen(false); setZoomedChartKey(null); }}
              parsedData={fileData.parsedData}
              chartConfig={getChartConfigForModal()}
              title={`Zoomed - ${getChartConfigForModal().chartType.charAt(0).toUpperCase() + getChartConfigForModal().chartType.slice(1)} Chart (${zoomedChartKey === 'chart1' ? 'Chart 1' : 'Chart 2'})`}
              appSettings={appSettings}
            />
          )}
        </>
      )}
       <ApplicationSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={appSettings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
