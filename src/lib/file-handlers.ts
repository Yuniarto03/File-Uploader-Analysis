
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import type { FileData, ParsedRow, Header, ColumnStats, ChartState, CustomSummaryData, CustomSummaryState } from '@/types';

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
          }
          headers = result.meta.fields || [];
          parsedData = (result.data as ParsedRow[]).filter(row => 
            Object.values(row).some(val => val !== null && val !== undefined && val !== '')
          );

        } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
          const workbook = XLSX.read(fileContent, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1, defval: null });
          
          if (jsonData.length > 0) {
            headers = jsonData[0] as Header[];
            headers = headers.filter(h => h != null && String(h).trim() !== '');

            parsedData = jsonData.slice(1).map(rowArray => {
              const row: ParsedRow = {};
              headers.forEach((header, index) => {
                row[header] = (rowArray as any[])[index];
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

  const dataForSheet = parsedData; 
  const dataWs = XLSX.utils.json_to_sheet(dataForSheet, { header: headers });
  XLSX.utils.book_append_sheet(wb, dataWs, 'Data');

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
    const sheetData: any[] = [[customSummaryData.rowValues.length > 0 ? customSummaryData.rowsField || 'Row Field' : 'Row Field', ...customSummaryData.columnValues, 'Row Total']]; 
    
    customSummaryData.rowValues.forEach(rv => {
        const row = [rv];
        customSummaryData.columnValues.forEach(cv => {
            row.push(customSummaryData.data[rv]?.[cv] ?? '-');
        });
        row.push(customSummaryData.rowTotals[rv] ?? '-');
        sheetData.push(row);
    });

    const footerRow = ['Column Total'];
    customSummaryData.columnValues.forEach(cv => {
        footerRow.push(customSummaryData.columnTotals[cv] ?? '-');
    });
    footerRow.push(customSummaryData.grandTotal ?? '-');
    sheetData.push(footerRow);
    
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
  customSummaryState: CustomSummaryState | null // Added for custom summary config
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
          text: "DataSphere Analysis",
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
  titleSlide.addText('Quantum Insights Unleashed', { 
    x: 0.5, y: 3, w: 9, h: 0.75, 
    fontFace: 'Roboto', fontSize: 20, color: 'E0F7FF', align: 'center', italic: true 
  });
   titleSlide.addText(new Date().toLocaleDateString(), { 
    x: 0.5, y: 3.75, w: 9, h: 0.5, 
    fontFace: 'Roboto', fontSize: 14, color: 'FF00E6', align: 'center' 
  });

  const overviewSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  overviewSlide.addText('Dataset Overview', { 
    x: 0.5, y: 0.25, w: 9, fontSize: 28, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'} 
  });
  
  let dataForOverview = fileData.parsedData; 
  let filterTextLines: PptxGenJS.TextProps[] = [];

  if (chartState.filterColumn && chartState.filterValue && chartState.filterValue.trim() !== '') {
     dataForOverview = dataForOverview.filter(row => String(row[chartState.filterColumn!]) === chartState.filterValue);
    filterTextLines.push(
        { text: `Chart Filter 1: `, options: { fontFace: 'Roboto', fontSize: 10, color: 'FF00E1', bold: true } },
        { text: `${chartState.filterColumn} = ${chartState.filterValue}\n`, options: { fontFace: 'Roboto', fontSize: 10, color: 'E0F7FF'} }
    );
  }
  if (chartState.filterColumn2 && chartState.filterValue2 && chartState.filterValue2.trim() !== '') {
    dataForOverview = dataForOverview.filter(row => String(row[chartState.filterColumn2!]) === chartState.filterValue2);
     filterTextLines.push(
        { text: `Chart Filter 2: `, options: { fontFace: 'Roboto', fontSize: 10, color: 'FF00E1', bold: true } },
        { text: `${chartState.filterColumn2} = ${chartState.filterValue2}\n`, options: { fontFace: 'Roboto', fontSize: 10, color: 'E0F7FF'} }
    );
  }


  const overviewTextContent: PptxGenJS.TextProps[] = [
    { text: `File: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.fileName}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} },
    { text: `Original Rows: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.parsedData.length.toLocaleString()}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} },
  ];

  if (filterTextLines.length > 0) {
    overviewTextContent.push(
        { text: `Rows after Chart Filters: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
        { text: `${dataForOverview.length.toLocaleString()}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} }
    );
     overviewTextContent.push(...filterTextLines);
  }
  
   overviewTextContent.push(
    { text: `Columns: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.headers.length.toLocaleString()}`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} }
   );

  overviewSlide.addText(overviewTextContent, { x: 0.5, y: 1.0, w: 4, h:2.0, charSpacing: 0.5 });
  
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
        x: 0.5, y: 3.2, w:9, h: 2.5, 
        autoPage: false, 
        colW: fileData.headers.map(() => 9/fileData.headers.length),
    });
  }

  if (chartCanvas && chartCanvas.toDataURL) {
    try {
      const chartImage = chartCanvas.toDataURL('image/png');
      const chartSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
      let chartTitle = 'Data Visualization';
      if (chartState.chartType) {
          chartTitle = `${chartState.chartType.charAt(0).toUpperCase() + chartState.chartType.slice(1)} Chart`;
          if (chartState.xAxis && chartState.yAxis) {
            let yAxisDesc = chartState.yAxis;
            if (chartState.yAxisAggregation === 'count') yAxisDesc = `Count of ${chartState.yAxis}`;
            else yAxisDesc = `${chartState.yAxis} (${chartState.yAxisAggregation.toUpperCase()})`;
            chartTitle += `: ${yAxisDesc} by ${chartState.xAxis}`;
          }
           let chartFilterText = "";
            if (chartState.filterColumn && chartState.filterValue) {
                chartFilterText += ` Filtered by ${chartState.filterColumn} = ${chartState.filterValue}`;
            }
            if (chartState.filterColumn2 && chartState.filterValue2) {
                chartFilterText += (chartFilterText ? " & " : " Filtered by ") + `${chartState.filterColumn2} = ${chartState.filterValue2}`;
            }
            if(chartFilterText) chartSlide.addText(chartFilterText, { x: 0.5, y: 0.65, w: 9, fontSize: 10, fontFace: 'Roboto', color: 'E0F7FF', align: 'center' });
      }
      chartSlide.addText(chartTitle, { 
          x: 0.5, y: 0.25, w: 9, fontSize: 24, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'}  
      });
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
    let summaryFilterText = "";
    if (customSummaryState.filterColumn1 && customSummaryState.filterValue1) {
        summaryFilterText += ` Filtered by ${customSummaryState.filterColumn1} = ${customSummaryState.filterValue1}`;
    }
    if (customSummaryState.filterColumn2 && customSummaryState.filterValue2) {
        summaryFilterText += (summaryFilterText ? " & " : " Filtered by ") + `${customSummaryState.filterColumn2} = ${customSummaryState.filterValue2}`;
    }

    summarySlide.addText(summaryTitle, { 
        x: 0.5, y: 0.25, w: 9, fontSize: 24, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'}  
    });
    if(summaryFilterText) summarySlide.addText(summaryFilterText, { x: 0.5, y: 0.65, w: 9, fontSize: 10, fontFace: 'Roboto', color: 'E0F7FF', align: 'center' });


    const tableData: PptxGenJS.TableRow[] = [];
    const headerRow: PptxGenJS.TableCell[] = [
        { text: `${customSummaryState.rowsField} / ${customSummaryState.columnsField}`, 
          options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} }
    ];
    customSummaryData.columnValues.forEach(cv => headerRow.push({ text: cv, options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} }));
    headerRow.push({ text: 'Row Total', options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} });
    tableData.push(headerRow);

    customSummaryData.rowValues.forEach(rv => {
        const row: PptxGenJS.TableCell[] = [{ text: rv, options: {fontFace: 'Roboto', bold:true, color: '00F0FF', fontSize: 8, border: {pt:1, color: '007A80'}} }];
        customSummaryData.columnValues.forEach(cv => {
            row.push({ text: String(customSummaryData.data[rv]?.[cv] ?? '-'), options: {fontFace: 'Roboto', color: 'E0F7FF', fontSize: 8, border: {pt:1, color: '007A80'}} });
        });
        row.push({ text: String(customSummaryData.rowTotals[rv] ?? '-'), options: {fontFace: 'Roboto', bold:true, color: '00F0FF', fontSize: 8, border: {pt:1, color: '007A80'}} });
        tableData.push(row);
    });

    const footerRowPPT: PptxGenJS.TableCell[] = [{ text: 'Column Total', options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} }];
    customSummaryData.columnValues.forEach(cv => {
        footerRowPPT.push({ text: String(customSummaryData.columnTotals[cv] ?? '-'), options: {fontFace: 'Roboto', bold:true, color: '00F0FF', fontSize: 8, border: {pt:1, color: '007A80'}} });
    });
    footerRowPPT.push({ text: String(customSummaryData.grandTotal ?? '-'), options: { fontFace: 'Orbitron', bold: true, fill: '0A0E17', color: 'FF00E1', fontSize: 9, border: {pt:1, color: 'FF00E1'}} });
    tableData.push(footerRowPPT);
    
    const numCols = (customSummaryData.columnValues.length || 0) + 2; 
    const colWidths = Array(numCols).fill(9 / numCols);

    summarySlide.addTable(tableData, { 
        x: 0.5, y: 1.0, w: 9, autoPage: true, colW: colWidths
    });
  }

  pptx.writeFile({ fileName: `${fileData.fileName.split('.')[0]}_presentation.pptx` });
}

