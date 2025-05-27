import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import type { FileData, ParsedRow, Header, ColumnStats, PivotState } from '@/types';

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
            // Try to recover if it's just a few errors
          }
          headers = result.meta.fields || [];
          // Filter out rows that are entirely null or undefined due to PapaParse behavior with trailing empty lines
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
             // Filter out null/empty headers
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
            // Infer headers if PapaParse failed to get them but got data (e.g. no header row)
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
  pivotState: PivotState, // To determine if pivot table is active and its config
  fileName: string,
  pivotTableContainer: HTMLElement | null // Pass the pivot table DOM element
) {
  const wb = XLSX.utils.book_new();

  // Data Sheet
  const dataWs = XLSX.utils.json_to_sheet(parsedData, { header: headers });
  XLSX.utils.book_append_sheet(wb, dataWs, 'Data');

  // Summary Stats Sheet
  const summarySheetData = columnStats.map(stat => ({
    Column: stat.column,
    Type: stat.type,
    Minimum: stat.min ?? 'N/A',
    Maximum: stat.max ?? 'N/A',
    Average: stat.average ?? 'N/A',
    Sum: stat.sum ?? 'N/A',
    'Unique Values': stat.uniqueValues,
  }));
  const summaryWs = XLSX.utils.json_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary Statistics');
  
  // Pivot Table Sheet (if active and data exists)
  if (pivotTableContainer) {
    try {
        // Check if pivot table actually has content
        const tableElement = pivotTableContainer.querySelector('table');
        if (tableElement && tableElement.rows.length > 1) { // Check for more than just header
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
  chartCanvas: HTMLCanvasElement | null,
  pivotTableContainer: HTMLElement | null
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16X9';
  pptx.title = `${fileData.fileName} Analysis`;

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(fileData.fileName, { 
    x: 0.5, y: 2, w: 9, h: 1, 
    fontSize: 36, fontFace: 'Orbitron', color: '00F7FF', align: 'center' 
  });
  titleSlide.addText('Data Analysis Report', { 
    x: 0.5, y: 3, w: 9, h: 0.75, 
    fontSize: 24, fontFace: 'Roboto', color: 'E0F7FF', align: 'center' 
  });

  // Overview Slide
  const overviewSlide = pptx.addSlide();
  overviewSlide.addText('Dataset Overview', { x: 0.5, y: 0.25, w: 9, fontSize: 28, fontFace: 'Orbitron', color: '00F7FF' });
  const overviewText = `File: ${fileData.fileName}\nRows: ${fileData.parsedData.length}\nColumns: ${fileData.headers.length}`;
  overviewSlide.addText(overviewText, { x: 0.5, y: 1.0, w: 9, fontSize: 16, fontFace: 'Roboto', color: 'E0F7FF' });
  
  // Top 5 rows preview
  if (fileData.parsedData.length > 0) {
    const tableData: PptxGenJS.TableRow[] = [fileData.headers.map(h => ({ text: h, options: { bold: true, fill: '0A1014', color: '00F7FF' } }))];
    fileData.parsedData.slice(0, 5).forEach(row => {
      tableData.push(fileData.headers.map(header => String(row[header] ?? '')));
    });
    overviewSlide.addTable(tableData, { x: 0.5, y: 2.5, w:9, autoPage: true, rowH: 0.3, border: { type: 'solid', pt: 1, color: '0066FF' }, color: 'E0F7FF', fontSize: 10 });
  }


  // Chart Slide
  if (chartCanvas && chartCanvas.toDataURL) {
    try {
      const chartImage = chartCanvas.toDataURL('image/png');
      const chartSlide = pptx.addSlide();
      chartSlide.addText('Data Visualization', { x: 0.5, y: 0.25, w: '90%', fontSize: 28, fontFace: 'Orbitron', color: '00F7FF' });
      chartSlide.addImage({ data: chartImage, x: 1, y: 1, w: 8, h: 4.5 });
    } catch (e) {
      console.error("Error adding chart to PPT:", e);
    }
  }
  
  // Pivot Table Slide
  if (pivotTableContainer) {
     try {
        const tableElement = pivotTableContainer.querySelector('table');
        if (tableElement && tableElement.rows.length > 1) {
            const pivotSlide = pptx.addSlide();
            pivotSlide.addText('Pivot Table', { x: 0.5, y: 0.25, w: '90%', fontSize: 28, fontFace: 'Orbitron', color: '00F7FF' });
            
            // Extract data from HTML table for PptxGenJS
            const pptxTableData: PptxGenJS.TableRow[] = [];
            const rows = Array.from(tableElement.querySelectorAll('tr'));
            rows.forEach((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                const pptxRow: PptxGenJS.TableCell[] = cells.map(cell => ({
                    text: cell.textContent || '',
                    options: (cell.tagName === 'TH' || rowIndex === rows.length -1 || cell.classList.contains('font-bold') || cell.classList.contains('font-medium'))
                        ? { bold: true, fill: '0A1014', color: (rowIndex === rows.length -1 && cell.cellIndex === cells.length -1) ? 'FF00E1' : '00F7FF' } 
                        : { color: 'E0F7FF'}
                }));
                pptxTableData.push(pptxRow);
            });

            if (pptxTableData.length > 0) {
                 pivotSlide.addTable(pptxTableData, { x: 0.5, y: 1.0, w:9, autoPage: true, rowH: 0.3, border: { type: 'solid', pt: 1, color: '0066FF' }, fontSize: 10});
            }
        }
    } catch (e) {
        console.error("Could not export pivot table to PowerPoint:", e);
    }
  }


  pptx.writeFile({ fileName: `${fileData.fileName.split('.')[0]}_presentation.pptx` });
}
