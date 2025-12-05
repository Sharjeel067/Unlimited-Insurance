import { User, Heart, Shield, Landmark, Info, MessageSquare, FileText, History, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "personal" | "medical" | "insurance" | "banking" | "system" | "notes" | "policies" | "callHistory";

interface Tab {
  id: TabType;
  label: string;
  icon: LucideIcon;
}

interface LeadDetailTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: Tab[] = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "medical", label: "Medical Info", icon: Heart },
  { id: "insurance", label: "Insurance", icon: Shield },
  { id: "banking", label: "Banking", icon: Landmark },
  { id: "system", label: "System Info", icon: Info },
  { id: "notes", label: "Notes", icon: MessageSquare },
  { id: "policies", label: "Policy Info", icon: FileText },
  { id: "callHistory", label: "Call Update History", icon: History },
];

export function LeadDetailTabs({ activeTab, onTabChange }: LeadDetailTabsProps) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-1 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

