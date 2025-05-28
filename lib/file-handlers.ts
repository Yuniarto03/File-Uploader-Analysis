
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import type { FileData, ParsedRow, Header, ColumnStats, ChartState, CustomSummaryData, CustomSummaryState, ChartAggregationType } from '@/types';

export function processUploadedFile(file: File): Promise<FileData> {
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

        if (fileExtension === 'csv') {
          const result = Papa.parse(fileContent as string, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          });
          if (result.errors.length > 0) {
            console.error('CSV Parsing Errors:', result.errors);
            // Optionally reject or handle minor errors
          }
          headers = result.meta.fields || [];
          parsedData = (result.data as ParsedRow[]).filter(row => 
            Object.values(row).some(val => val !== null && val !== undefined && val !== '')
          );

        } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
          const workbook = XLSX.read(fileContent, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            reject(new Error('No sheets found in the Excel file.'));
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1, defval: null });
          
          if (jsonData.length > 0) {
            const rawHeaders = jsonData[0] as Header[];
             const validRawHeadersWithOriginalIndex = rawHeaders
              .map((h, index) => ({ header: h, originalIndex: index }))
              .filter(item => item.header != null && String(item.header).trim() !== '');
            
            headers = validRawHeadersWithOriginalIndex.map(item => item.header);

            parsedData = jsonData.slice(1).map(rowArray => {
              const row: ParsedRow = {};
              validRawHeadersWithOriginalIndex.forEach(item => {
                row[item.header] = (rowArray as any[])[item.originalIndex];
              });
              return row;
            }).filter(row => Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== ''));
          }
        } else {
          reject(new Error('Unsupported file format. Please upload a CSV or Excel file.'));
          return;
        }
        
        if (headers.length === 0 && parsedData.length > 0) {
            headers = Object.keys(parsedData[0]);
        }

        resolve({ fileName: file.name, headers, parsedData });

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
      reject(new Error('Unsupported file format.'));
    }
  });
}


export function exportToExcelFile(
  parsedData: ParsedRow[], 
  headers: Header[], 
  columnStats: ColumnStats[],
  fileName: string,
  customSummaryData: CustomSummaryData | null
) {
  const wb = XLSX.utils.book_new();
  const safeSheetName = 'Data';


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

  XLSX.writeFile(wb, `${fileName.split('.')[0]}_analysis.xlsx`);
}

export function exportToPowerPointFile(
  fileData: FileData,
  columnStats: ColumnStats[],
  chartState: ChartState, 
  chartCanvas: HTMLCanvasElement | null,
  customSummaryData: CustomSummaryData | null,
  customSummaryState: CustomSummaryState | null 
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16X9';
  pptx.author = 'DataSphere';
  pptx.company = 'Firebase Studio';
  pptx.title = `${fileData.fileName} - Data Analysis`;
  
  const masterOpts: PptxGenJS.SlideMasterProps = {
    title: "MASTER_SLIDE",
    background: { color: "050A14" }, 
    objects: [
      {
        text: {
          text: `DataSphere Analysis`,
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
  let overviewTitle = 'Dataset Overview';
  overviewSlide.addText(overviewTitle, { 
    x: 0.5, y: 0.25, w: 9, fontSize: 28, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'} 
  });
  
  let filterTextLinesConfig: {label: string, column: string | undefined, value: string | undefined}[] = [
    {label: 'Chart 1 Filter 1', column: chartState.filterColumn, value: chartState.filterValue},
    {label: 'Chart 1 Filter 2', column: chartState.filterColumn2, value: chartState.filterValue2},
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
    { text: `${fileData.fileName}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} },
    { text: `Total Rows: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.parsedData.length.toLocaleString()}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} }
  ];

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

  if (chartCanvas && chartCanvas.toDataURL) { 
    try {
      const chartImage = chartCanvas.toDataURL('image/png');
      const chartSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
      
      const aggregationLabelMap: Record<ChartAggregationType, string> = {
        sum: "Sum", avg: "Average", count: "Count", min: "Minimum", max: "Maximum", unique: "Unique Count", sdev: "StdDev"
      };
      const aggLabel = aggregationLabelMap[chartState.yAxisAggregation] || chartState.yAxisAggregation.toUpperCase();
      let yAxisDesc = chartState.yAxis;
      if (chartState.yAxisAggregation === 'count' || chartState.yAxisAggregation === 'unique') {
        yAxisDesc = `${aggLabel} of ${chartState.yAxis}`;
      } else {
        yAxisDesc = `${chartState.yAxis} (${aggLabel})`;
      }

      let chartTitle = `${chartState.chartType.charAt(0).toUpperCase() + chartState.chartType.slice(1)} Chart: ${yAxisDesc} by ${chartState.xAxis}`;
      
      chartSlide.addText(chartTitle, { 
          x: 0.5, y: 0.25, w: 9, fontSize: 24, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'}  
      });

      let chartFilterText = "";
      if (chartState.filterColumn && chartState.filterValue) {
          chartFilterText += ` Filtered by ${chartState.filterColumn} = ${chartState.filterValue}`;
      }
      if (chartState.filterColumn2 && chartState.filterValue2) {
          chartFilterText += (chartFilterText ? " & " : " Filtered by ") + `${chartState.filterColumn2} = ${chartState.filterValue2}`;
      }
      if(chartFilterText) chartSlide.addText(chartFilterText.trim(), { x: 0.5, y: 0.65, w: 9, fontSize: 10, fontFace: 'Roboto', color: 'E0F7FF', align: 'center' });
      
      chartSlide.addImage({ data: chartImage, x: 0.5, y: 1, w: 9, h: 5, sizing: { type: 'contain', w: 9, h: 5 } });
    } catch (e) {
      console.error("Error adding chart to PPT:", e);
      const errorSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
      errorSlide.addText('Chart Export Error', { x:0.5, y:0.5, fontFace: 'Orbitron', color: 'FF0000', fontSize: 24 });
      errorSlide.addText(String(e), { x:0.5, y:1.5, fontFace: 'Roboto', color: 'E0F7FF', fontSize: 12 });
    }
  }
  
  if (customSummaryData && customSummaryState) {
    const summarySlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
    let summaryTitle = `Custom Summary: ${customSummaryData.aggregationType.toUpperCase()} of ${customSummaryData.valueFieldName}`;

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

  pptx.writeFile({ fileName: `${fileData.fileName.split('.')[0]}_presentation.pptx` });
}

