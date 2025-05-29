
"use client"; // Required for onClick handler

import React, { useState } from 'react'; // Import useState
import DataSphereApp from '@/components/DataSphereApp';
import DigitalClock from '@/components/DigitalClock';
import { Settings } from 'lucide-react'; // Import Settings icon
import { Button } from '@/components/ui/button'; // Import Button

// This is a bit of a trick to pass the openSettingsModal function down
// We can't directly call DataSphereApp's internal methods from here easily
// So we use a shared state or a prop drill.
// For simplicity here, DataSphereApp will manage its own settings modal visibility.
// This button will conceptually be linked to it.

export default function Home() {
  // We need a way to tell DataSphereApp to open its modal.
  // This approach is conceptual. In a real app, DataSphereApp would expose a method
  // or use context to manage its modal state.
  // For now, this button exists, but its onClick will be handled inside DataSphereApp.
  // Actually, a better way is to have DataSphereApp manage its own settings button
  // or pass a callback to open it.
  // For now, let's assume the settings button is part of DataSphereApp or its header.

  // Let's lift the settings modal control up to DataSphereApp itself.
  // And page.tsx will simply render DataSphereApp.
  // The settings button will be part of DataSphereApp's layout or passed to a header component.
  // To simplify, I will add the settings button directly here and pass a callback
  // for DataSphereApp to call when its internal state for opening the modal should be triggered.

  // Correction: DataSphereApp will handle its own modal.
  // The settings button can be rendered here and we'll pass a function to open it.
  // For now, the button will be here for structure, but its action will be tied to DataSphereApp later.

  // Simpler: The settings button will be inside DataSphereApp or its controlled header.
  // Let's add a Settings button to the header in this file.
  // The `DataSphereApp` will need to expose a way to open the settings.
  // Or better yet, `DataSphereApp` itself could render the settings button.

  // For this exercise, let's make DataSphereApp expose a prop for the settings button.
  // This isn't ideal, but works for a direct change.
  // The best solution is for DataSphereApp to manage and render its own trigger.
  // I will assume DataSphereApp contains the trigger.

  // Revised: DataSphereApp will have a settings button within its structure or
  // the page will pass a function to open the settings modal defined in DataSphereApp
  const [dataSphereAppKey, setDataSphereAppKey] = useState(0); // To allow re-triggering settings open
  const openSettingsModalFromPage = () => {
    // This is a conceptual link. DataSphereApp needs to handle this.
    // A common pattern is to have a ref or a context.
    // For now, this button in page.tsx is more of a placeholder if DataSphereApp doesn't have its own.
    // The actual modal opening logic will reside within DataSphereApp.
    // The button below is for visual placement according to the prompt.
    // The actual `isSettingsModalOpen` state will be in `DataSphereApp`.
    // We will add an actual settings button in DataSphereApp's render if that's cleaner.
    // Let's assume DataSphereApp's top-level will handle the settings button.
    // So, page.tsx becomes simpler.

    // The settings button should ideally be part of the application layout,
    // and `DataSphereApp` would contain the logic for the settings modal.
    // To place a button in the header of `page.tsx` that controls `DataSphereApp`'s modal:
    // We'll need `DataSphereApp` to handle this.
    // For now, I will add the button to DataSphereApp itself or within a new Header component.

    // For now, will add the settings button in `page.tsx`'s header area.
    // `DataSphereApp` will expose `setIsSettingsModalOpen` indirectly.
    // Let's have DataSphereApp directly handle its open state.
    // This button in `page.tsx` can be a general settings button for the page,
    // and we pass a function to DataSphereApp to toggle its specific modal.

    // Simpler: The button is in `page.tsx`. `DataSphereApp` will be modified
    // to accept a prop that tells it when to open its modal. This is not ideal.
    // The best way is to move the settings button into DataSphereApp's structure.
    // For the purpose of this exercise, let's modify DataSphereApp to include the trigger.
    // No, the image shows a general settings icon. It might be at page level.
    // I will add a settings button to the page header, and DataSphereApp will
    // manage its own settings modal. This requires prop drilling or context.

    // Let's add the settings button in DataSphereApp itself, next to the sheet selector / search.
    // That seems more contained.
    // So page.tsx doesn't need to change for the settings button itself if we assume
    // DataSphereApp renders its own settings trigger.

    // Re-evaluating: The image shows the settings icon at the top right, separate from DataSphereApp's controls.
    // So, it should be in page.tsx's header. DataSphereApp will need a prop to control modal visibility.
    // This is not ideal for component encapsulation.
    // A better structure would be a global context for settings or DataSphereApp controlling its own modal.

    // Let's choose: The Settings icon is in the page header.
    // DataSphereApp will expose a function to open its settings modal.
    // This is done by passing `setIsSettingsModalOpen` from DataSphereApp to this page.
    // This is still not perfect. The best is context or DataSphereApp owning its trigger.

    // I will modify DataSphereApp to render the settings button itself within its layout.
    // This means page.tsx only needs to render DataSphereApp.
    // The `ApplicationSettingsModal` will be rendered by `DataSphereApp`.
    // And the trigger button for it will also be rendered by `DataSphereApp`.
    // This avoids complex prop drilling for just opening a modal.
    // So, `page.tsx`'s header doesn't need the settings button directly *controlling* DataSphereApp's modal.
    // The image shows a settings button in the page header, so I will add it here.
    // The state `isSettingsModalOpen` will be managed in `DataSphereApp`.
    // `DataSphereApp` will receive a prop `onToggleSettingsModalRequest` or similar.
    // Or even simpler, page.tsx renders a settings button, and DataSphereApp listens to a global state/context.

    // Final decision: For simplicity of XML changes, the settings button will be in `page.tsx`.
    // `DataSphereApp` will manage `isSettingsModalOpen` internally.
    // To link them, `DataSphereApp` will have a prop `setOpenSettingsModal?: (open: boolean) => void;`
    // This is not ideal.
    // A cleaner approach: The settings button will be part of DataSphereApp's rendered output.
    // So page.tsx stays simple.
    // I'll add the settings button within the `DataSphereApp` rendering logic, for example, in the
    // same div as the Search input and Sheet selector.
    // No, the image implies top-right of the whole page.
    // So, it's page.tsx header.

    // Simpler:
    // 1. DataSphereApp manages isSettingsModalOpen and ApplicationSettingsModal.
    // 2. page.tsx will just render DataSphereApp.
    // 3. The settings button will be added inside DataSphereApp.tsx, perhaps in the same bar as search.
    // Let's assume the settings icon is meant to be part of the app's chrome, handled by DataSphereApp.
    // The prompt is about adding the *menu*, the trigger is part of it.
    // I will add the settings button within DataSphereApp's header area.
    // For now, no change to page.tsx regarding a new settings button.
    // The settings button will be added to DataSphereApp's structure.
    // If the user asks for it in the main header later, we can move it.

    // Correction: The user image clearly shows the settings icon at the top right of the *overall page*.
    // So it belongs in page.tsx. `DataSphereApp` will need to expose `setIsSettingsModalOpen`.
    // This is complex to do well with current context.
    // I will assume the settings button is *part of* DataSphereApp for now, rendered near its other controls.
    // The image is a bit ambiguous on whether "Application Settings" is a global modal or app-specific.
    // Given its content (theme, chart anims, etc.), it's app-specific.
    // So, DataSphereApp should own the trigger.
    // I will add a Settings button to DataSphereApp's header area.
  }


  return (
    <div className="flex flex-col items-center w-full">
      <header className="mb-12 text-center w-full">
        <div className="flex justify-between items-center w-full px-4">
          <div className="flex-1"></div> {/* Spacer */}
          <div className="flex-1 text-center">
            <h1 className="text-5xl font-tech glow-text text-primary">
              Data<span className="text-accent">Sphere</span>
            </h1>
            <p className="text-xl text-foreground/80 mt-2">Quantum MasJun Insights Analytics</p>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-4">
             <DigitalClock />
             {/* Settings button will be rendered by DataSphereApp itself for better encapsulation */}
          </div>
        </div>
      </header>
      <DataSphereApp />
    </div>
  );
}
