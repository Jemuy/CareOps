import React from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  BellRing, 
  Users, 
  ShieldAlert, 
  AlertTriangle, 
  BriefcaseBusiness, 
  GraduationCap, 
  ClipboardCheck, 
  Building2, 
  SearchCheck,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const [location] = useLocation();
  const { data: summary, isLoading } = useGetDashboardSummary();

  const navGroups = [
    {
      title: "Overview",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/alerts", label: "Alert Centre", icon: BellRing },
      ],
    },
    {
      title: "Children & Families",
      items: [
        { href: "/children", label: "Young People", icon: Users },
      ],
    },
    {
      title: "Safety & Risk",
      items: [
        { href: "/safeguarding", label: "Safeguarding", icon: ShieldAlert },
        { href: "/incidents", label: "Incidents", icon: AlertTriangle },
      ],
    },
    {
      title: "Workforce",
      items: [
        { href: "/workforce", label: "Workforce Compliance", icon: BriefcaseBusiness },
        { href: "/training", label: "Training & Supervisions", icon: GraduationCap },
      ],
    },
    {
      title: "Governance & Compliance",
      items: [
        { href: "/regulation", label: "Regulation 44 & 45", icon: ClipboardCheck },
        { href: "/governance", label: "Governance", icon: Building2 },
      ],
    },
    {
      title: "Inspection",
      items: [
        { href: "/inspection", label: "Inspection Mode", icon: SearchCheck },
      ],
    },
  ];

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed top-0 left-0 border-r border-sidebar-border overflow-y-auto hidden md:flex">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-md">
            <ShieldAlert size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight">CareOps AI</span>
            <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wider font-semibold">Readiness Platform</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-4">
        <div className="bg-sidebar-accent/50 p-4 rounded-xl flex items-center justify-between border border-sidebar-border">
          <div className="flex flex-col">
            <span className="text-xs text-sidebar-foreground/70 font-medium">Readiness Score</span>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mt-1 text-sidebar-primary" />
            ) : (
              <span className="text-2xl font-bold text-white">{summary?.overallScore ?? 0}%</span>
            )}
          </div>
          <Badge variant="outline" className="bg-sidebar-primary text-white border-transparent">
            Live
          </Badge>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <div className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-sidebar-primary text-white" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <Icon size={18} className={cn(isActive ? "text-white" : "text-sidebar-foreground/60")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50 text-center">
        v0.1.0 • Connected
      </div>
    </div>
  );
}
