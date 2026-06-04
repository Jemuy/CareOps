import React from "react";
import { SidebarContent } from "./SidebarContent";

export function Sidebar() {
  return (
    <div className="w-64 fixed top-0 left-0 h-screen border-r border-sidebar-border hidden md:block">
      <SidebarContent />
    </div>
  );
}
