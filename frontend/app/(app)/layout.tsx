"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineBanner } from "@/components/offline-banner";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <>
      <AppSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <OfflineBanner />
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}
