
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Presentation } from 'lucide-react'; // FileSpreadsheet removed

interface ExportControlsProps {
  // onExportExcel removed
  onExportPPT: () => void;
}

export default function ExportControls({ onExportPPT }: ExportControlsProps) { // onExportExcel removed from props
  return (
    <section id="export-section" className="bg-glass p-6 glow slide-in">
      <h2 className="text-2xl font-tech text-primary glow-text mb-4">Export Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Export Section Removed */}
        <div className="bg-cyan-900/20 rounded-lg p-6 text-center md:col-span-2"> {/* Adjusted to span full width if it's the only one */}
          <Presentation className="h-12 w-12 mx-auto mb-4 text-orange-400" />
          <h3 className="text-lg font-tech text-orange-400 mb-2">PowerPoint Export</h3>
          <p className="text-sm text-primary/80 mb-4">Create a presentation with your visualizations and insights.</p>
          <Button
            id="export-ppt"
            onClick={onExportPPT}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-tech btn-shine"
          >
            EXPORT TO POWERPOINT
          </Button>
        </div>
      </div>
    </section>
  );
}
