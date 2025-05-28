
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import type { FileData, ParsedRow, Header, ColumnStats, ChartState, CustomSummaryData, CustomSummaryState, ChartAggregationType } from '@/types';

export function processUploadedFile(file: File, targetSheetName?: string): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result;
        if (!fileContent) {
          reject(new Error("Failed to read file content."));
          return;
        }

        let headers: Header[] = [];
        let parsedData: ParsedRow[] = [];
        let allSheetNames: string[] | undefined = undefined;
        let currentSheetName: string | undefined = undefined;

        if (fileExtension === 'csv') {
          const result = Papa.parse(fileContent as string, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          });
          if (result.errors.length > 0) {
            console.error('CSV Parsing Errors:', result.errors);
            // Potentially reject or return partial data based on error severity
          }
          headers = result.meta.fields || [];
          parsedData = (result.data as ParsedRow[]).filter(row => 
            Object.values(row).some(val => val !== null && val !== undefined && val !== '')
          );
          currentSheetName = file.name; // For CSV, use filename as sheet name

        } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
          const workbook = XLSX.read(fileContent, { type: 'array' });
          allSheetNames = workbook.SheetNames;

          if (!allSheetNames || allSheetNames.length === 0) {
            reject(new Error('No sheets found in the Excel file.'));
            return;
          }

          currentSheetName = targetSheetName && allSheetNames.includes(targetSheetName) 
                             ? targetSheetName 
                             : allSheetNames[0];
          
          if (!currentSheetName) { // Should not happen if allSheetNames has items
            reject(new Error('Could not determine sheet to process.'));
            return;
          }
          
          const worksheet = workbook.Sheets[currentSheetName];
          if (!worksheet) {
            // This case might happen if the sheet is truly empty or unreadable
            console.warn(`Sheet '${currentSheetName}' not found or is empty. Returning empty data for this sheet.`);
             resolve({ fileName: file.name, headers: [], parsedData: [], allSheetNames, currentSheetName });
            return;
          }
          
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1, defval: null });
          
          if (jsonData && jsonData.length > 0) {
            const rawHeaders = jsonData[0] as Header[];
             if (rawHeaders && Array.isArray(rawHeaders) && rawHeaders.some(h => h !== null && String(h).trim() !== '')) {
              const validRawHeadersWithOriginalIndex = rawHeaders
                .map((h, index) => ({ header: String(h).trim(), originalIndex: index })) 
                .filter(item => item.header !== null && item.header !== '');
              
              headers = validRawHeadersWithOriginalIndex.map(item => item.header);

              if (jsonData.length > 1) { 
                parsedData = jsonData.slice(1).map(rowArray => {
                  const row: ParsedRow = {};
                  if (Array.isArray(rowArray)) { 
                    validRawHeadersWithOriginalIndex.forEach(item => {
                      row[item.header] = (rowArray as any[])[item.originalIndex];
                    });
                  }
                  return row;
                }).filter(row => Object.keys(row).length > 0 && Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== ''));
              } else {
                parsedData = []; 
              }
            } else {
              // No valid headers found, treat as empty sheet
              headers = []; 
              parsedData = [];
            }
          } else {
            // jsonData is null or empty, treat as empty sheet
            headers = [];
            parsedData = [];
          }
        } else {
          reject(new Error('Unsupported file format. Please upload a CSV or Excel file.'));
          return;
        }
        
        // Fallback if headers are still empty but data rows suggest headers
        if (headers.length === 0 && parsedData.length > 0 && parsedData[0]) {
            headers = Object.keys(parsedData[0]);
        }

        resolve({ fileName: file.name, headers, parsedData, allSheetNames, currentSheetName });

      } catch (error) {
        console.error("Error during file processing:", error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file.'));
    };

    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file format. Please upload a CSV or Excel file.'));
    }
  });
}


export function exportToExcelFile(
  parsedData: ParsedRow[], 
  headers: Header[], 
  columnStats: ColumnStats[],
  fileName: string,
  customSummaryData: CustomSummaryData | null,
  currentSheetName?: string
) {
  const wb = XLSX.utils.book_new();
  const safeSheetName = currentSheetName ? currentSheetName.replace(/[\/\?\*\[\]]/g, '_').substring(0, 30) : 'Data';

  const dataForSheet = parsedData; 
  const dataWs = XLSX.utils.json_to_sheet(dataForSheet, { header: headers });
  XLSX.utils.book_append_sheet(wb, dataWs, safeSheetName);

  if (columnStats.length > 0) {
    const summarySheetData = columnStats.map(stat => ({
      Column: stat.column,
      Type: stat.type,
      Minimum: stat.min ?? 'N/A',
      Maximum: stat.max ?? 'N/A',
      Average: stat.average?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 'N/A',
      Sum: stat.sum?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 'N/A',
      'Unique Values': stat.uniqueValues.toLocaleString(),
    }));
    const summaryWs = XLSX.utils.json_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Basic Column Stats');
  }
  
  if (customSummaryData) {
    const summaryTitle = `${customSummaryData.aggregationType.toUpperCase()} of ${customSummaryData.valueFieldName}`;
    const headerLabel = customSummaryData.columnsField && customSummaryData.columnsField !== '_TOTAL_' 
        ? `${customSummaryData.rowsField} / ${customSummaryData.columnsField}`
        : customSummaryData.rowsField;

    const sheetData: any[] = [[headerLabel, ...customSummaryData.columnValues.filter(cv => cv !== '_TOTAL_'), 'Row Total']]; 
    
    customSummaryData.rowValues.forEach(rv => {
        const row = [rv];
        customSummaryData.columnValues.filter(cv => cv !== '_TOTAL_').forEach(cv => {
            const cellValue = customSummaryData.data[rv]?.[cv] ?? (customSummaryData.data[rv]?.['_TOTAL_'] ?? '-');
            row.push(typeof cellValue === 'number' ? cellValue : String(cellValue));
        });
        const rowTotalValue = customSummaryData.rowTotals[rv] ?? '-';
        row.push(typeof rowTotalValue === 'number' ? rowTotalValue : String(rowTotalValue));
        sheetData.push(row);
    });

    if (customSummaryData.columnsField && customSummaryData.columnsField !== '_TOTAL_') {
        const footerRow = ['Column Total'];
        customSummaryData.columnValues.filter(cv => cv !== '_TOTAL_').forEach(cv => {
            const colTotalValue = customSummaryData.columnTotals[cv] ?? '-';
            footerRow.push(typeof colTotalValue === 'number' ? colTotalValue : String(colTotalValue));
        });
         const grandTotalValue = customSummaryData.grandTotal ?? '-';
        footerRow.push(typeof grandTotalValue === 'number' ? grandTotalValue : String(grandTotalValue));
        sheetData.push(footerRow);
    } else { 
        const grandTotalValue = customSummaryData.grandTotal ?? '-';
        const footerRow = ['Grand Total', typeof grandTotalValue === 'number' ? grandTotalValue : String(grandTotalValue)];
        for (let i = 2; i < sheetData[0].length; i++) { footerRow.push(''); }
        sheetData.push(footerRow);
    }
    
    const customSummaryWs = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.sheet_add_aoa(customSummaryWs, [[summaryTitle]], {origin: "A1"});

    XLSX.utils.book_append_sheet(wb, customSummaryWs, 'Custom Summary');
  }

  const baseFileName = fileName.split('.')[0];
  const sheetIdentifier = currentSheetName ? `_${currentSheetName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const exportFileName = `${baseFileName}${sheetIdentifier}_analysis.xlsx`;
  XLSX.writeFile(wb, exportFileName);
}

export function exportToPowerPointFile(
  fileData: FileData,
  columnStats: ColumnStats[],
  chartState1: ChartState, 
  chartCanvas1: HTMLCanvasElement | null,
  customSummaryData: CustomSummaryData | null,
  customSummaryState: CustomSummaryState | null 
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16X9';
  pptx.author = 'DataSphere';
  pptx.company = 'Firebase Studio';
  const sheetNamePart = fileData.currentSheetName ? ` (${fileData.currentSheetName})` : '';
  const pptxTitle = `${fileData.fileName}${sheetNamePart} - Data Analysis`;
  pptx.title = pptxTitle;
  
  const masterOpts: PptxGenJS.SlideMasterProps = {
    title: "MASTER_SLIDE",
    background: { color: "050A14" }, 
    objects: [
      {
        text: {
          text: `DataSphere Analysis - ${fileData.fileName}${sheetNamePart}`,
          options: {
            x: 0.5, y: '92%', w: '90%', 
            fontFace: "Roboto", fontSize: 10, color: "00F7FF", 
            align: "center"
          },
        },
      },
    ],
  };
  pptx.defineSlideMaster(masterOpts);

  const titleSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  titleSlide.addText(fileData.fileName, { 
    x: 0.5, y: 2, w: 9, h: 1, 
    fontFace: 'Orbitron', fontSize: 36, color: '00F0FF', align: 'center', bold: true 
  });
  let currentYPos = 2.8;
  if (fileData.currentSheetName) {
    titleSlide.addText(`Sheet: ${fileData.currentSheetName}`, {
        x: 0.5, y: currentYPos, w: 9, h: 0.5, 
        fontFace: 'Roboto', fontSize: 16, color: '00F0FF', align: 'center'
    });
    currentYPos += 0.5;
  }
  titleSlide.addText('Quantum Insights Unleashed', { 
    x: 0.5, y: currentYPos, w: 9, h: 0.75, 
    fontFace: 'Roboto', fontSize: 20, color: 'E0F7FF', align: 'center', italic: true 
  });
  currentYPos += 0.75;
   titleSlide.addText(new Date().toLocaleDateString(), { 
    x: 0.5, y: currentYPos, w: 9, h: 0.5, 
    fontFace: 'Roboto', fontSize: 14, color: 'FF00E6', align: 'center' 
  });

  const overviewSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  let overviewTitle = `Dataset Overview${sheetNamePart}`;
  overviewSlide.addText(overviewTitle, { 
    x: 0.5, y: 0.25, w: 9, fontSize: 28, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'} 
  });
  
  let filterTextLinesConfig: {label: string, column: string | undefined, value: string | undefined}[] = [
    {label: 'Chart 1 Filter 1', column: chartState1.filterColumn, value: chartState1.filterValue},
    {label: 'Chart 1 Filter 2', column: chartState1.filterColumn2, value: chartState1.filterValue2},
  ];

  if (customSummaryState) {
    filterTextLinesConfig.push(
        {label: 'Summary Filter 1', column: customSummaryState.filterColumn1, value: customSummaryState.filterValue1},
        {label: 'Summary Filter 2', column: customSummaryState.filterColumn2, value: customSummaryState.filterValue2}
    );
  }
  
  let appliedFiltersText: PptxGenJS.TextProps[] = [];
  filterTextLinesConfig.forEach(f => {
    if (f.column && f.value && f.value.trim() !== '') {
        appliedFiltersText.push(
            { text: `${f.label}: `, options: { fontFace: 'Roboto', fontSize: 10, color: 'FF00E1', bold: true } },
            { text: `${f.column} = ${f.value}\n`, options: { fontFace: 'Roboto', fontSize: 10, color: 'E0F7FF'} }
        );
    }
  });

  const overviewTextContent: PptxGenJS.TextProps[] = [
    { text: `File: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.fileName}${sheetNamePart}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} },
  ];
  overviewTextContent.push(
    { text: `Total Rows: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.parsedData.length.toLocaleString()}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} }
  );

  if (appliedFiltersText.length > 0) {
     overviewTextContent.push(...appliedFiltersText);
  }
  
   overviewTextContent.push(
    { text: `Total Columns: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.headers.length.toLocaleString()}`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} }
   );

  overviewSlide.addText(overviewTextContent, { x: 0.5, y: 1.0, w: 4, h:3, charSpacing: 0.5 });
  
  if (fileData.parsedData.length > 0 && fileData.headers.length > 0) {
    const tableDataRaw: PptxGenJS.TableRow[] = [
        fileData.headers.map(h => ({ 
            text: h, 
            options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} 
        }))
    ];
    fileData.parsedData.slice(0, 5).forEach(row => { 
      tableDataRaw.push(fileData.headers.map(header => ({
          text: String(row[header] ?? ''),
          options: {fontFace: 'Roboto', color: 'E0F7FF', fontSize: 8, border: {pt:1, color: '007A80'} }
      })));
    });
    overviewSlide.addTable(tableDataRaw, { 
        x: 0.5, y: 4.0, w:9, h: 1.5, 
        autoPage: false, 
        colW: fileData.headers.map(() => 9/fileData.headers.length),
    });
  }

  if (chartCanvas1 && chartCanvas1.toDataURL) { 
    try {
      const chartImage = chartCanvas1.toDataURL('image/png');
      if (chartImage && chartImage.length > 200 && chartImage.startsWith('data:image/png;base64,')) {
        const chartSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
        
        const aggregationLabelMap: Record<ChartAggregationType, string> = {
          sum: "Sum", avg: "Average", count: "Count", min: "Minimum", max: "Maximum", unique: "Unique Count", sdev: "StdDev"
        };
        const aggLabel = aggregationLabelMap[chartState1.yAxisAggregation] || chartState1.yAxisAggregation.toUpperCase();
        let yAxisDesc = chartState1.yAxis;
        if (chartState1.yAxisAggregation === 'count' || chartState1.yAxisAggregation === 'unique') {
          yAxisDesc = `${aggLabel} of ${chartState1.yAxis}`;
        } else {
          yAxisDesc = `${chartState1.yAxis} (${aggLabel})`;
        }

        let chartTitle = `Chart 1: ${chartState1.chartType.charAt(0).toUpperCase() + chartState1.chartType.slice(1)} Chart: ${yAxisDesc} by ${chartState1.xAxis}`;
        
        chartSlide.addText(chartTitle, { 
            x: 0.5, y: 0.25, w: 9, fontSize: 24, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'}  
        });

        let chartFilterText = "";
        if (chartState1.filterColumn && chartState1.filterValue) {
            chartFilterText += ` Filtered by ${chartState1.filterColumn} = ${chartState1.filterValue}`;
        }
        if (chartState1.filterColumn2 && chartState1.filterValue2) {
            chartFilterText += (chartFilterText ? " & " : " Filtered by ") + `${chartState1.filterColumn2} = ${chartState1.filterValue2}`;
        }
        if(chartFilterText) chartSlide.addText(chartFilterText.trim(), { x: 0.5, y: 0.65, w: 9, fontSize: 10, fontFace: 'Roboto', color: 'E0F7FF', align: 'center' });
        
        chartSlide.addImage({ data: chartImage, x: 0.5, y: 1, w: 9, h: 5, sizing: { type: 'contain', w: 9, h: 5 } });
      } else {
        console.warn("Chart canvas produced an empty or too small image. Adding placeholder slide for chart.");
        const errorSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
        errorSlide.addText('Chart 1 Image Not Generated', { x:0.5, y:0.5, fontFace: 'Orbitron', color: 'FFFF00', fontSize: 24 });
        errorSlide.addText('The chart image could not be generated. The canvas might be empty, too small, or not yet rendered.', { x:0.5, y:1.5, fontFace: 'Roboto', color: 'E0F7FF', fontSize: 12 });
      }
    } catch (e) {
      console.error("Error adding chart 1 to PPT:", e);
      const errorSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
      errorSlide.addText('Chart 1 Export Error', { x:0.5, y:0.5, fontFace: 'Orbitron', color: 'FF0000', fontSize: 24 });
      errorSlide.addText(String(e), { x:0.5, y:1.5, fontFace: 'Roboto', color: 'E0F7FF', fontSize: 12 });
    }
  } else {
    const noChartSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
    noChartSlide.addText('Chart 1 Not Available', { x:0.5, y:0.5, fontFace: 'Orbitron', color: 'FFFF00', fontSize: 24 });
    noChartSlide.addText('The canvas for Chart 1 was not found during export.', { x:0.5, y:1.5, fontFace: 'Roboto', color: 'E0F7FF', fontSize: 12 });
  }
  
  if (customSummaryData && customSummaryState) {
    const summarySlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
    let summaryTitle = `Custom Summary: ${customSummaryData.aggregationType.toUpperCase()} of ${customSummaryData.valueFieldName}${sheetNamePart}`;

    summarySlide.addText(summaryTitle, { 
        x: 0.5, y: 0.25, w: 9, fontSize: 24, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'}  
    });

    let summaryFilterText = "";
    if (customSummaryState.filterColumn1 && customSummaryState.filterValue1) {
        summaryFilterText += ` Filtered by ${customSummaryState.filterColumn1} = ${customSummaryState.filterValue1}`;
    }
    if (customSummaryState.filterColumn2 && customSummaryState.filterValue2) {
        summaryFilterText += (summaryFilterText ? " & " : " Filtered by ") + `${customSummaryState.filterColumn2} = ${customSummaryState.filterValue2}`;
    }
    if(summaryFilterText) summarySlide.addText(summaryFilterText.trim(), { x: 0.5, y: 0.65, w: 9, fontSize: 10, fontFace: 'Roboto', color: 'E0F7FF', align: 'center' });

    const tableData: PptxGenJS.TableRow[] = [];
    const headerLabelPPT = customSummaryData.columnsField && customSummaryData.columnsField !== '_TOTAL_'
        ? `${customSummaryData.rowsField} / ${customSummaryData.columnsField}`
        : customSummaryData.rowsField;

    const headerRow: PptxGenJS.TableCell[] = [
        { text: headerLabelPPT, 
          options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} }
    ];
    customSummaryData.columnValues.filter(cv => cv !== '_TOTAL_').forEach(cv => headerRow.push({ text: cv, options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} }));
    headerRow.push({ text: 'Row Total', options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} });
    tableData.push(headerRow);

    customSummaryData.rowValues.forEach(rv => {
        const row: PptxGenJS.TableCell[] = [{ text: rv, options: {fontFace: 'Roboto', bold:true, color: '00F0FF', fontSize: 8, border: {pt:1, color: '007A80'}} }];
        customSummaryData.columnValues.filter(cv => cv !== '_TOTAL_').forEach(cv => {
            row.push({ text: String(customSummaryData.data[rv]?.[cv] ?? (customSummaryData.data[rv]?.['_TOTAL_'] ?? '-')), options: {fontFace: 'Roboto', color: 'E0F7FF', fontSize: 8, border: {pt:1, color: '007A80'}} });
        });
        row.push({ text: String(customSummaryData.rowTotals[rv] ?? '-'), options: {fontFace: 'Roboto', bold:true, color: '00F0FF', fontSize: 8, border: {pt:1, color: '007A80'}} });
        tableData.push(row);
    });

    const footerRowPPT: PptxGenJS.TableCell[] = [{ text: customSummaryData.columnsField && customSummaryData.columnsField !== '_TOTAL_' ? 'Column Total' : 'Grand Total', options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} }];
    if (customSummaryData.columnsField && customSummaryData.columnsField !== '_TOTAL_') {
        customSummaryData.columnValues.filter(cv => cv !== '_TOTAL_').forEach(cv => {
            footerRowPPT.push({ text: String(customSummaryData.columnTotals[cv] ?? '-'), options: {fontFace: 'Roboto', bold:true, color: '00F0FF', fontSize: 8, border: {pt:1, color: '007A80'}} });
        });
        footerRowPPT.push({ text: String(customSummaryData.grandTotal ?? '-'), options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: 'FF00E1', fontSize: 9, border: {pt:1, color: 'FF00E1'}} });
    } else {
         footerRowPPT.push({ text: String(customSummaryData.grandTotal ?? '-'), options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: 'FF00E1', fontSize: 9, border: {pt:1, color: 'FF00E1'}} });
        for (let i = 2; i < headerRow.length; i++) { footerRowPPT.push({text: ''}); } 
    }
    tableData.push(footerRowPPT);
    
    const numCols = headerRow.length;
    const colWidths = Array(numCols).fill(9 / numCols);

    summarySlide.addTable(tableData, { 
        x: 0.5, y: 1.0, w: 9, autoPage: true, colW: colWidths
    });
  }

  const baseFileName = fileData.fileName.split('.')[0];
  const sheetIdentifier = fileData.currentSheetName ? `_${fileData.currentSheetName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const exportFileName = `${baseFileName}${sheetIdentifier}_presentation.pptx`;
  pptx.writeFile({ fileName: exportFileName });
}
