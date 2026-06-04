import React, { useState } from "react";
import { ShieldAlert, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground p-1.5 rounded-md">
            <ShieldAlert size={18} />
          </div>
          <span className="font-bold text-sidebar-foreground text-base">CareOps AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setOpen(true)}
            className="text-sidebar-foreground/80 hover:text-sidebar-foreground p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72 border-0 bg-sidebar">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground p-1 rounded-md hover:bg-sidebar-accent transition-colors z-10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
