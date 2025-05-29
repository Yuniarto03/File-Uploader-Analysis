
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApplicationSettings, AppThemeSetting } from '@/types';
import { Sparkles, Brain, Gauge, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: ApplicationSettings;
  onSaveSettings: (newSettings: ApplicationSettings) => void;
}

const themeOptions: { value: AppThemeSetting; label: string; gradient: string }[] = [
  { value: 'dark', label: 'Dark', gradient: 'bg-gradient-to-r from-slate-800 to-slate-900' },
  { value: 'cyber', label: 'Cyber', gradient: 'bg-gradient-to-r from-blue-600 to-cyan-500' },
  { value: 'neon', label: 'Neon', gradient: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  { value: 'quantum', label: 'Quantum', gradient: 'bg-gradient-to-r from-indigo-700 to-purple-500' },
  { value: 'matrix', label: 'Matrix', gradient: 'bg-gradient-to-r from-green-700 to-lime-500' },
  { value: 'void', label: 'Void', gradient: 'bg-gradient-to-r from-gray-800 to-black' },
  { value: 'glitch', label: 'Glitch', gradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500' },
  { value: 'arcade', label: 'Arcade', gradient: 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500' },
];

export default function ApplicationSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}: ApplicationSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<ApplicationSettings>(currentSettings);

  useEffect(() => {
    setLocalSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const handleSettingChange = <K extends keyof ApplicationSettings>(
    key: K,
    value: ApplicationSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-glass border-primary/50 glow sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-primary/30 flex flex-row justify-between items-center">
          <DialogTitle className="font-tech text-xl text-primary glow-text">Application Settings</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-primary hover:text-accent hover:bg-transparent">
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="text-base font-medium text-primary/90 mb-2 block">Theme</Label>
            <div className="grid grid-cols-4 gap-3"> {/* Changed to grid-cols-4 */}
              {themeOptions.map((themeOpt) => (
                <Button
                  key={themeOpt.value}
                  variant="outline"
                  className={cn(
                    "h-20 flex flex-col justify-center items-center border-2 text-foreground hover:bg-primary/10",
                    localSettings.theme === themeOpt.value ? 'border-primary glow' : 'border-primary/30'
                  )}
                  onClick={() => handleSettingChange('theme', themeOpt.value)}
                >
                  <div className={cn("w-10 h-5 rounded mb-1", themeOpt.gradient)}></div>
                  <span className="text-sm">{themeOpt.label}</span>
                  {localSettings.theme === themeOpt.value && (
                    <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                  )}
                </Button>
              ))}
            </div>
             <p className="text-xs text-muted-foreground mt-2">Changes overall application color scheme. Chart colors will also update.</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-cyan-900/20 rounded-lg">
            <div className='flex items-center'>
              <Sparkles className="h-5 w-5 text-primary mr-3" />
              <Label htmlFor="chart-animations" className="text-base text-primary/90">
                Chart Animations
              </Label>
            </div>
            <Switch
              id="chart-animations"
              checked={localSettings.chartAnimations}
              onCheckedChange={(checked) => handleSettingChange('chartAnimations', checked)}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-cyan-900/20 rounded-lg">
            <div className='flex items-center'>
              <Brain className="h-5 w-5 text-primary mr-3" />
              <Label htmlFor="auto-ai-insights" className="text-base text-primary/90">
                Auto-generate AI Insights
              </Label>
            </div>
            <Switch
              id="auto-ai-insights"
              checked={localSettings.autoGenerateAIInsights}
              onCheckedChange={(checked) => handleSettingChange('autoGenerateAIInsights', checked)}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>

          <div className="p-3 bg-cyan-900/20 rounded-lg">
             <div className='flex items-center mb-2'>
                <Gauge className="h-5 w-5 text-primary mr-3" />
                <Label htmlFor="data-precision" className="text-base text-primary/90">
                    Data Precision (Decimals)
                </Label>
             </div>
            <Select
              value={String(localSettings.dataPrecision)}
              onValueChange={(value) => handleSettingChange('dataPrecision', parseInt(value, 10))}
            >
              <SelectTrigger id="data-precision" className="w-full custom-select">
                <SelectValue placeholder="Select decimal places" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 decimal places</SelectItem>
                <SelectItem value="1">1 decimal place</SelectItem>
                <SelectItem value="2">2 decimal places</SelectItem>
                <SelectItem value="3">3 decimal places</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t border-primary/30">
          <Button variant="outline" onClick={onClose} className="font-tech border-primary/50 text-primary/90 hover:bg-primary/10 hover:text-primary">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-tech btn-shine">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

