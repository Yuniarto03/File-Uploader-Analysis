
"use client";

import React from 'react';
import type { AIDataSummary } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIDataSummaryTabProps {
  aiDataSummary: AIDataSummary | null;
  isLoadingAIDataSummary: boolean;
  customAiPrompt: string;
  setCustomAiPrompt: (prompt: string) => void;
  onRegenerateAIDataSummary: () => Promise<void>;
  fileDataAvailable: boolean;
}

export default function AIDataSummaryTab({
  aiDataSummary,
  isLoadingAIDataSummary,
  customAiPrompt,
  setCustomAiPrompt,
  onRegenerateAIDataSummary,
  fileDataAvailable,
}: AIDataSummaryTabProps) {
  return (
    <Card className="bg-cyan-900/20 rounded-lg p-0 border-0 shadow-none">
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-tech text-primary flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" /> AI Data Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        {!fileDataAvailable && (
          <div className="flex flex-col items-center justify-center text-center bg-glass p-8 rounded-lg glow">
            <AlertTriangle className="h-12 w-12 text-accent mb-4" />
            <p className="text-lg font-tech text-primary">No Data Uploaded</p>
            <p className="text-sm text-foreground/80">
              Please upload a CSV or Excel file to generate an AI Data Summary.
            </p>
          </div>
        )}

        {fileDataAvailable && (
          <>
            <div className="space-y-2">
              <label htmlFor="custom-ai-prompt" className="block text-sm font-medium text-primary/80">
                Custom Instructions for AI (Optional):
              </label>
              <Textarea
                id="custom-ai-prompt"
                placeholder="e.g., Focus on sales trends in Q4, or identify anomalies in sensor readings..."
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                className="bg-cyan-900/30 border-cyan-700 focus:ring-cyan-500 min-h-[80px]"
              />
            </div>
            <Button
              onClick={onRegenerateAIDataSummary}
              disabled={isLoadingAIDataSummary}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-tech btn-shine"
            >
              {isLoadingAIDataSummary ? (
                <>
                  <LoadingSpinner /> <span className="ml-2">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Regenerate AI Summary
                </>
              )}
            </Button>

            {isLoadingAIDataSummary && !aiDataSummary && (
              <div className="flex flex-col items-center justify-center text-center bg-glass p-8 rounded-lg glow">
                <LoadingSpinner />
                <p className="mt-4 font-tech text-primary animate-pulse">
                  AI is analyzing your data...
                </p>
              </div>
            )}

            {!isLoadingAIDataSummary && aiDataSummary && (
              <div className="space-y-4 bg-glass p-6 rounded-lg glow">
                <div>
                  <h3 className="font-tech text-accent text-md mb-2">Narrative Summary:</h3>
                  <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                    {aiDataSummary.narrativeSummary}
                  </p>
                </div>
                <div>
                  <h3 className="font-tech text-accent text-md mb-2">Key Findings:</h3>
                  {aiDataSummary.keyFindings && aiDataSummary.keyFindings.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      {aiDataSummary.keyFindings.map((finding, index) => (
                        <li key={index} className="text-foreground/90 text-sm">
                          {finding}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No specific key findings were generated.</p>
                  )}
                </div>
              </div>
            )}
            
            {!isLoadingAIDataSummary && !aiDataSummary && fileDataAvailable && (
                <div className="text-center text-muted-foreground py-4">
                    Click "Regenerate AI Summary" to get insights.
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
