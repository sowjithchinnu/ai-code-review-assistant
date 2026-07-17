"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, MoonStar, SunMedium } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface TopNavbarProps {
  title: string;
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export function TopNavbar({ title, onMenuClick }: TopNavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("theme") as "light" | "dark" | null;
    if (storedTheme) {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    // Load user from localStorage
    const userStr = typeof window !== "undefined" ? window.localStorage.getItem("user") : null;
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      toast({ title: "Theme updated", description: `Switched to ${nextTheme} mode.`, variant: "success" });
      return nextTheme;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      variant: "success",
    });
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:gap-4 sm:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="shrink-0 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="hidden shrink-0 lg:flex"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* App Title */}
      <div className="min-w-0 flex-1 lg:flex-none">
        <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="shrink-0"
          aria-label="Toggle theme"
          suppressHydrationWarning
        >
          {!mounted ? (
            <span className="h-5 w-5" />
          ) : theme === "dark" ? (
            <SunMedium className="h-5 w-5" />
          ) : (
            <MoonStar className="h-5 w-5" />
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.name ?? "User")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email ?? "No email"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}