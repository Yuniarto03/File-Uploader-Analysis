
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import type { FileData, ParsedRow, Header, ColumnStats, PivotState, ChartState } from '@/types'; // Added ChartState

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
  pivotState: PivotState, 
  fileName: string,
  pivotTableContainer: HTMLElement | null
) {
  const wb = XLSX.utils.book_new();

  let dataForSheet = parsedData;
  if (pivotState.filterColumn && pivotState.filterValue && pivotState.filterValue.trim() !== '') {
    dataForSheet = dataForSheet.filter(row => {
      const cellValue = row[pivotState.filterColumn!];
      return String(cellValue ?? '').trim() === String(pivotState.filterValue).trim();
    });
  }
  if (pivotState.filterColumn2 && pivotState.filterValue2 && pivotState.filterValue2.trim() !== '') {
    dataForSheet = dataForSheet.filter(row => {
      const cellValue = row[pivotState.filterColumn2!];
      return String(cellValue ?? '').trim() === String(pivotState.filterValue2).trim();
    });
  }


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
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary Statistics');
  }
  
  if (pivotTableContainer) {
    try {
        const tableElement = pivotTableContainer.querySelector('table.data-table');
        if (tableElement && tableElement.rows.length > 1) { 
             const pivotWs = XLSX.utils.table_to_sheet(tableElement);
             XLSX.utils.book_append_sheet(wb, pivotWs, 'Pivot Table');
        }
    } catch (e) {
        console.error("Could not export pivot table to Excel:", e);
    }
  }

  XLSX.writeFile(wb, `${fileName.split('.')[0]}_analysis.xlsx`);
}

export function exportToPowerPointFile(
  fileData: FileData,
  columnStats: ColumnStats[],
  chartState: ChartState, 
  chartCanvas: HTMLCanvasElement | null,
  pivotState: PivotState, 
  pivotTableContainer: HTMLElement | null
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16X9';
  pptx.author = 'DataSphere';
  pptx.company = 'Firebase Studio';
  pptx.title = `${fileData.fileName} - Data Analysis`;
  
  pptx.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: "0A1014" }, // Dark background
    objects: [
      {
        text: {
          text: "DataSphere Analysis",
          options: {
            x: 0.5, y: '92%', w: '90%', 
            fontFace: "Roboto", fontSize: 10, color: "00F0FF", // Cyan
            align: "center"
          },
        },
      },
    ],
  });

  const titleSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  titleSlide.addText(fileData.fileName, { 
    x: 0.5, y: 2, w: 9, h: 1, 
    fontFace: 'Orbitron', fontSize: 36, color: '00F0FF', align: 'center', bold: true // Cyan
  });
  titleSlide.addText('Quantum Insights Unleashed', { 
    x: 0.5, y: 3, w: 9, h: 0.75, 
    fontFace: 'Roboto', fontSize: 20, color: 'E0F7FF', align: 'center', italic: true // Light foreground
  });
   titleSlide.addText(new Date().toLocaleDateString(), { 
    x: 0.5, y: 3.75, w: 9, h: 0.5, 
    fontFace: 'Roboto', fontSize: 14, color: 'FF00E1', align: 'center' // Accent pink
  });

  const overviewSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  overviewSlide.addText('Dataset Overview', { 
    x: 0.5, y: 0.25, w: 9, fontSize: 28, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'} 
  });
  
  let dataForOverview = fileData.parsedData;
  let filterText = "";
  let filterTextLines: PptxGenJS.TextProps[] = [];

  if (pivotState.filterColumn && pivotState.filterValue && pivotState.filterValue.trim() !== '') {
    dataForOverview = dataForOverview.filter(row => {
      const cellValue = row[pivotState.filterColumn!];
      return String(cellValue ?? '').trim() === String(pivotState.filterValue).trim();
    });
    filterTextLines.push(
        { text: `Primary Filter: `, options: { fontFace: 'Roboto', fontSize: 10, color: 'FF00E1', bold: true } },
        { text: `${pivotState.filterColumn} = ${pivotState.filterValue}\n`, options: { fontFace: 'Roboto', fontSize: 10, color: 'E0F7FF'} }
    );
    filterText = ` (Filtered by: ${pivotState.filterColumn} = ${pivotState.filterValue})`; // For simple text
  }
  if (pivotState.filterColumn2 && pivotState.filterValue2 && pivotState.filterValue2.trim() !== '') {
    dataForOverview = dataForOverview.filter(row => {
      const cellValue = row[pivotState.filterColumn2!];
      return String(cellValue ?? '').trim() === String(pivotState.filterValue2).trim();
    });
     filterTextLines.push(
        { text: `Additional Filter: `, options: { fontFace: 'Roboto', fontSize: 10, color: 'FF00E1', bold: true } },
        { text: `${pivotState.filterColumn2} = ${pivotState.filterValue2}\n`, options: { fontFace: 'Roboto', fontSize: 10, color: 'E0F7FF'} }
    );
    if (filterText) filterText += ` & ${pivotState.filterColumn2} = ${pivotState.filterValue2}`;
    else filterText = ` (Filtered by: ${pivotState.filterColumn2} = ${pivotState.filterValue2})`;
  }


  const overviewTextContent: PptxGenJS.TextProps[] = [
    { text: `File: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.fileName}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} },
    { text: `Original Rows: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.parsedData.length.toLocaleString()}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} },
  ];

  if (filterTextLines.length > 0) {
    overviewTextContent.push(
        { text: `Filtered Rows: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
        { text: `${dataForOverview.length.toLocaleString()}\n`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} }
    );
     overviewTextContent.push(...filterTextLines);
  }
  
   overviewTextContent.push(
    { text: `Columns: `, options: { fontFace: 'Roboto', fontSize: 14, color: '00F0FF', bold: true } },
    { text: `${fileData.headers.length.toLocaleString()}`, options: { fontFace: 'Roboto', fontSize: 14, color: 'E0F7FF'} }
   );

  overviewSlide.addText(overviewTextContent, { x: 0.5, y: 1.0, w: 4, h:2.0, charSpacing: 0.5 });
  
  if (dataForOverview.length > 0 && fileData.headers.length > 0) {
    const tableData: PptxGenJS.TableRow[] = [
        fileData.headers.map(h => ({ 
            text: h, 
            options: { fontFace: 'Orbitron', bold: true, fill: '050A14', color: '00F0FF', fontSize: 9, border: {pt:1, color: 'FF00E1'}} 
        }))
    ];
    dataForOverview.slice(0, 5).forEach(row => {
      tableData.push(fileData.headers.map(header => ({
          text: String(row[header] ?? ''),
          options: {fontFace: 'Roboto', color: 'E0F7FF', fontSize: 8, border: {pt:1, color: '007A80'} }
      })));
    });
    overviewSlide.addTable(tableData, { 
        x: 0.5, y: 3.2, w:9, h: 2.5, // Adjusted Y position
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
  
  if (pivotTableContainer) {
     try {
        const tableElement = pivotTableContainer.querySelector('table.data-table');
        if (tableElement && tableElement.rows.length > 1) {
            const pivotSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
            let pivotTitle = 'Pivot Table Analysis';
             if (pivotState.rows && pivotState.columns && pivotState.values) {
                pivotTitle = `Pivot: ${pivotState.aggregation.toUpperCase()} of ${pivotState.values} by ${pivotState.rows} and ${pivotState.columns}`;
            }
            let pivotFilterInfo = "";
            if (pivotState.filterColumn && pivotState.filterValue) {
                pivotFilterInfo = `(Filtered by: ${pivotState.filterColumn} = ${pivotState.filterValue}`;
                 if (pivotState.filterColumn2 && pivotState.filterValue2) {
                    pivotFilterInfo += ` & ${pivotState.filterColumn2} = ${pivotState.filterValue2}`;
                }
                pivotFilterInfo += ")";
            } else if (pivotState.filterColumn2 && pivotState.filterValue2) {
                 pivotFilterInfo = `(Filtered by: ${pivotState.filterColumn2} = ${pivotState.filterValue2})`;
            }


            pivotSlide.addText(pivotTitle, { 
                x: 0.5, y: 0.25, w: 9, fontSize: 24, fontFace: 'Orbitron', color: '00F0FF', underline: {color: 'FF00E1', style:'wavy'}  
            });
             if (pivotFilterInfo) {
                pivotSlide.addText(pivotFilterInfo, { x: 0.5, y: 0.65, w:9, fontSize: 10, fontFace: 'Roboto', color: 'E0F7FF', align: 'center' });
            }
            
            const pptxTableData: PptxGenJS.TableRow[] = [];
            const rowsHtml = Array.from(tableElement.querySelectorAll('tr'));
            
            rowsHtml.forEach((rowHtml, rowIndex) => {
                const cellsHtml = Array.from(rowHtml.querySelectorAll('th, td'));
                const pptxRow: PptxGenJS.TableCell[] = cellsHtml.map((cellHtml, cellIndex) => {
                    let text = cellHtml.textContent || '';
                    let cellOptions: PptxGenJS.TableCellOptions = {
                        fontFace: 'Roboto',
                        color: 'E0F7FF',
                        fontSize: 8,
                        border: {pt:1, color: '007A80'}, // Darker cyan border
                        margin: [2,2,2,2]
                    };

                    // Header row or first column or footer row styling
                    if (cellHtml.tagName === 'TH' || 
                        (rowIndex === rowsHtml.length - 1 && cellHtml.tagName === 'TD' && tableElement.querySelector('tfoot')) || 
                        (cellIndex === 0 && cellHtml.tagName === 'TD' && tableElement.querySelector('tbody th')) 
                    ) { 
                        cellOptions.bold = true;
                        cellOptions.fill = '050A14'; // Very dark blue
                        cellOptions.color = '00F0FF'; // Cyan text
                        cellOptions.fontFace = 'Orbitron';
                         cellOptions.fontSize = 9;
                    }
                    // Grand total cell special styling
                    if (rowIndex === rowsHtml.length - 1 && cellIndex === cellsHtml.length -1 && tableElement.querySelector('tfoot')) { 
                        cellOptions.color = 'FF00E1'; // Accent pink
                    }
                    return { text, options: cellOptions };
                });
                pptxTableData.push(pptxRow);
            });

            if (pptxTableData.length > 0) {
                 pivotSlide.addTable(pptxTableData, { 
                     x: 0.5, y: 1.0, w:9, h:5,
                     autoPage: true, 
                     rowH: 0.25, // Adjust row height if needed
                 });
            }
        }
    } catch (e) {
        console.error("Could not export pivot table to PowerPoint:", e);
        const errorSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
        errorSlide.addText('Pivot Table Export Error', { x:0.5, y:0.5, fontFace: 'Orbitron', color: 'FF0000', fontSize: 24 });
        errorSlide.addText(String(e), { x:0.5, y:1.5, fontFace: 'Roboto', color: 'E0F7FF', fontSize: 12 });
    }
  }

  pptx.writeFile({ fileName: `${fileData.fileName.split('.')[0]}_presentation.pptx` });
}
