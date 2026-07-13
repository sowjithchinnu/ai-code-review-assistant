"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: "Overview and analytics",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: <FolderKanban className="h-5 w-5" />,
    description: "Manage your code projects",
  },
  {
    title: "Reviews",
    href: "/reviews",
    icon: <FileText className="h-5 w-5" />,
    description: "Code review history",
  },
  {
    title: "Analysis",
    href: "/analysis",
    icon: <ScanSearch className="h-5 w-5" />,
    description: "Static analysis results",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    description: "Application settings",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ isOpen, onClose, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isHydrated || isMobile) return;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, isHydrated, isMobile, onCollapsedChange]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isMobile]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleLogout = () => {
    // Add your logout logic here
    router.push("/login");
  };

  const navSection = (
    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
      <TooltipProvider delay={isCollapsed ? 100 : 0}>
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Tooltip key={item.href} disabled={!isCollapsed}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobile) onClose();
                  }}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300 ease-in-out",
                    isActive
                      ? "bg-primary/10 font-medium text-primary hover:bg-primary/15"
                      : "font-medium text-muted-foreground hover:translate-x-0.5 hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "justify-center px-2 hover:translate-x-0"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 transition-transform duration-300 ease-in-out",
                      !isActive && "group-hover:scale-110"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                      isCollapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100"
                    )}
                  >
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "ml-auto h-2 w-2 shrink-0 rounded-full transition-all duration-300 ease-in-out",
                      isCollapsed || !isActive
                        ? "max-w-0 scale-0 opacity-0"
                        : "scale-100 bg-primary opacity-100"
                    )}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </nav>
  );

  const footerSection = (
    <div className="border-t border-border p-2">
      <TooltipProvider delay={isCollapsed ? 100 : 0}>
        <Tooltip disabled={!isCollapsed}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground transition-all duration-300 ease-in-out hover:bg-destructive/10 hover:text-destructive",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out" />
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                  isCollapsed ? "max-w-0 opacity-0" : "max-w-24 opacity-100"
                )}
              >
                Logout
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Logout</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  const desktopHeader = (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center border-b border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "justify-center px-2" : "justify-between px-4 lg:px-6"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "max-w-0 opacity-0" : "max-w-full opacity-100"
        )}
      >
        <Logo />
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap text-lg font-semibold transition-all duration-300 ease-in-out",
            isCollapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
          )}
        >
          Code Review
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className={cn(
          "hidden shrink-0 transition-all duration-300 ease-in-out lg:flex",
          isCollapsed && "mx-auto"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 transition-transform duration-300" />
        ) : (
          <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
        )}
      </Button>
    </div>
  );

  const desktopSidebarContent = (
    <div className="flex h-full flex-col">
      {desktopHeader}
      {navSection}
      {footerSection}
    </div>
  );

  const mobileDrawerContent = (
    <div className="flex h-full flex-col">
      {navSection}
      {footerSection}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-border bg-background transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Logo />
            <span className="truncate text-lg font-semibold">Code Review</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {mobileDrawerContent}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-border bg-background transition-[width] duration-300 ease-in-out lg:flex",
          isOpen && !isCollapsed ? "w-64" : isOpen && isCollapsed ? "w-20" : "w-0"
        )}
      >
        {isOpen && (
          <div className="h-full w-full">
            {desktopSidebarContent}
          </div>
        )}
      </aside>
    </>
  );
}