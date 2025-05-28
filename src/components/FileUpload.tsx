
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CloudUpload } from 'lucide-react';
// FileData type is not directly used for onFileSelected prop anymore
// import type { FileData } from '@/types'; 
// processUploadedFile is not called here anymore
// import { processUploadedFile } from '@/lib/file-handlers';

interface FileUploadProps {
  onFileSelected: (file: File) => void; // Changed from onFileProcessed
  setLoading: (loading: boolean) => void; 
  setLoadingStatus: (status: string) => void; 
  onFileUploadError: (errorMsg: string) => void; 
}

export default function FileUpload({ 
  onFileSelected, // Changed
  setLoading, 
  setLoadingStatus,
  onFileUploadError
}: FileUploadProps) {
  const [isActive, setIsActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true); 
    setIsActive(false);
    setLoadingStatus(`Initiating processing for ${file.name}...`); // Status update

    try {
      // No longer processes file here, just passes the file object
      onFileSelected(file); 
      // setLoading(false) will be handled by DataSphereApp after processing
    } catch (error: any) { 
      console.error("Error during file selection in FileUpload:", error);
      onFileUploadError(error.message || 'Failed to select file.');
      setLoading(false); // Ensure loading is false on error here
    }
  }, [onFileSelected, setLoading, setLoadingStatus, onFileUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <section id="upload-section" className="bg-glass p-6 glow">
      <h2 className="text-2xl font-tech mb-4 text-primary glow-text">Data Input</h2>
      <div
        id="upload-area"
        className={`upload-area ${isActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="flex flex-col items-center">
          <CloudUpload className="h-16 w-16 text-primary mb-4" strokeWidth={1.5} />
          <p className="text-lg mb-2 font-tech">Drag & Drop CSV or Excel File</p>
          <p className="text-sm text-primary/80 mb-4">or click to browse</p>
          <Button
            id="browse-btn"
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-2 rounded-full font-tech btn-shine"
            onClick={(e) => {
              e.stopPropagation(); 
              document.getElementById('file-input')?.click();
            }}
          >
            SELECT FILE
          </Button>
          <input
            type="file"
            id="file-input"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleInputChange}
          />
        </div>
      </div>
    </section>
  );
}
