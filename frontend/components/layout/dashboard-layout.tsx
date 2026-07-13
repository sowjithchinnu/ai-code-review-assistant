"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/reviews": "Reviews",
  "/analysis": "Analysis",
  "/settings": "Settings",
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const syncSidebarForViewport = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      setSidebarOpen(isDesktop);
    };

    syncSidebarForViewport();
    window.addEventListener("resize", syncSidebarForViewport);
    return () => window.removeEventListener("resize", syncSidebarForViewport);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const title = pageTitles[pathname] ?? "AI Code Review Assistant";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="flex min-h-screen w-full">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onCollapsedChange={setSidebarCollapsed}
        />

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out",
            !sidebarOpen
              ? "lg:ml-0"
              : sidebarCollapsed
                ? "lg:ml-20"
                : "lg:ml-64"
          )}
        >
          <TopNavbar
            title={title}
            onMenuClick={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}