"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface GlobalFooterSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface GlobalFooterProps {
  sections: GlobalFooterSection[];
}

export function GlobalFooter({ sections }: GlobalFooterProps) {
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="divide-y divide-border">
      {sections.map((section) => (
        <Collapsible
          key={section.id}
          open={openSection === section.id}
          onOpenChange={() => toggleSection(section.id)}
          className="bg-card"
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-4 py-2 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <section.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{section.title}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-4 border-t bg-background animate-in slide-in-from-top-2">
            {section.content}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
