
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react'; // Presentation icon removed

interface AnalysisActionsProps {
  onNewAnalysis: () => void;
  // onExportPPT prop removed
}

export default function AnalysisActions({ onNewAnalysis }: AnalysisActionsProps) { // onExportPPT removed from props
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
      {/* PowerPoint Export Button Removed */}
    </div>
  );
}

