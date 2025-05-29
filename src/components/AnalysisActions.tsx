
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Presentation } from 'lucide-react'; // Added Presentation

interface AnalysisActionsProps {
  onNewAnalysis: () => void;
  onExportPPT: () => void; // Added
}

export default function AnalysisActions({ onNewAnalysis, onExportPPT }: AnalysisActionsProps) {
  return (
    <div id="action-buttons" className="flex flex-wrap justify-center gap-4 mt-8">
      <Button
        id="new-file-btn"
        onClick={onNewAnalysis}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full font-tech btn-shine text-lg"
      >
        <Plus className="h-5 w-5 mr-2" />
        NEW ANALYSIS
      </Button>
      <Button
            id="export-ppt-btn" // Changed id for clarity
            onClick={onExportPPT}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-tech btn-shine text-lg"
          >
            <Presentation className="h-5 w-5 mr-2" />
            DOWNLOAD AS POWERPOINT
      </Button>
    </div>
  );
}
