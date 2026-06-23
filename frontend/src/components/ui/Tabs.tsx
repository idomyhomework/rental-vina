// --- TABS — UI COMPONENT ---

"use client";

import { createContext, useContext, useState, useCallback } from "react";

import { cn } from "@/utils/cn";

// --- Context ---

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab components must be used within Tabs");
  return context;
}

// --- Tabs root ---

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// --- Tab list ---

export function TabList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { activeTab, setActiveTab } = useTabsContext();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tabs = Array.from(
        (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
          '[role="tab"]',
        ),
      );
      const currentIndex = tabs.findIndex(
        (tab) => tab.getAttribute("data-tab-id") === activeTab,
      );

      let nextIndex = currentIndex;
      if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
      if (e.key === "ArrowLeft")
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;

      if (nextIndex !== currentIndex) {
        e.preventDefault();
        const nextTab = tabs[nextIndex].getAttribute("data-tab-id");
        if (nextTab) {
          setActiveTab(nextTab);
          tabs[nextIndex].focus();
        }
      }
    },
    [activeTab, setActiveTab],
  );

  return (
    <div
      role="tablist"
      className={cn("flex gap-1 border-b border-hairline", className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

// --- Tab button ---

interface TabProps {
  id: string;
  children: React.ReactNode;
}

export function Tab({ id, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      role="tab"
      data-tab-id={id}
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab(id)}
      className={cn(
        "px-4 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1",
        isActive
          ? "border-b-2 border-ink text-ink"
          : "text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

// --- Tab panel ---

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={id}
      tabIndex={0}
      className={cn("pt-4", className)}
    >
      {children}
    </div>
  );
}
