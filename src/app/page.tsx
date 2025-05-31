
"use client";

import React, { useState } from 'react';
import DataSphereApp from '@/components/DataSphereApp';
import DigitalClock from '@/components/DigitalClock';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center w-full">
      <header className="mb-12 text-center w-full">
        <div className="flex justify-between items-center w-full px-4">
          <div className="flex-1"></div> {/* Spacer */}
          <div className="flex-1 text-center">
            <h1 className="text-5xl font-tech glow-text text-primary">
              masyun<span className="text-accent">AInalysis</span>
            </h1>
            <p className="text-xl text-foreground/80 mt-2">Quantum MasYunAI Insights Analytics</p>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-4">
             <DigitalClock />
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-primary hover:text-accent hover:bg-transparent glow"
                title="Application Settings"
              >
                <Settings className="h-6 w-6" />
                <span className="sr-only">Application Settings</span>
              </Button>
          </div>
        </div>
      </header>
      <DataSphereApp
        isSettingsModalOpen={isSettingsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />
    </div>
  );
}
