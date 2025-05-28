
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CloudUpload } from 'lucide-react';
// Removed FileData import as FileUpload no longer processes the file itself
// import type { FileData } from '@/types'; 
// import { processUploadedFile } from '@/lib/file-handlers'; // Removed as processing is moved to DataSphereApp

interface FileUploadProps {
  onFileSelected: (file: File) => void; // Changed prop name and signature
  setLoading: (loading: boolean) => void; // To inform DataSphereApp to show global loading
  setLoadingStatus: (status: string) => void; // To update global loading status
  onFileUploadError: (errorMsg: string) => void; // Remains for direct upload errors
}

export default function FileUpload({ 
  onFileSelected, 
  setLoading, 
  setLoadingStatus,
  onFileUploadError // Kept for consistency, though less likely to be used if file isn't processed here
}: FileUploadProps) {
  const [isActive, setIsActive] = useState(false);

  // Loading messages can be kept for local visual feedback if desired,
  // but primary loading status will be managed by DataSphereApp
  const loadingMessages = [
    "Initiating data uplink...",
    "Verifying file integrity...",
    "Preparing for quantum analysis...",
    "Transmitting to DataSphere core..."
  ];

  const handleFile = useCallback(async (file: File) => {
    setLoading(true); // Signal DataSphereApp to start loading
    setIsActive(false);
    
    // This local loading message cycle is for the FileUpload component's visual cue
    // if it has its own loading indicator. DataSphereApp will manage the main one.
    let messageIndex = 0;
    setLoadingStatus(loadingMessages[messageIndex]); // Update global loading status
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        // setLoadingStatus(loadingMessages[messageIndex]); // This might be too chatty for global status
    }, 1500);

    try {
      // Instead of processing, just pass the file to DataSphereApp
      onFileSelected(file);
      // DataSphereApp will handle setLoading(false) after its own processing.
    } catch (error: any) { // Catch errors from the file selection itself if any (rare)
      console.error("Error during file selection stage:", error);
      onFileUploadError(error.message || 'Failed to select file.');
      setLoading(false); // Ensure loading is stopped on error here
    } finally {
      clearInterval(messageInterval); // Stop local message cycle
      // setLoading(false) is now handled by DataSphereApp
    }
  }, [setLoading, setLoadingStatus, onFileSelected, onFileUploadError, loadingMessages]);

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
