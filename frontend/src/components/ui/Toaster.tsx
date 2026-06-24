// --- TOASTER — UI COMPONENT ---

"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className:
          "!bg-sand !text-ink !border !border-line !shadow-md !rounded-lg !font-sans",
        classNames: {
          success: "!border-sea/30",
          error: "!border-coral/30",
        },
      }}
    />
  );
}
