"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCommandPalette } from "@/components/command-palette-provider";

export function SearchButton() {
  const { setIsOpen } = useCommandPalette();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search - (Ctrl+K)</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Search - (Ctrl+K)</p>
      </TooltipContent>
    </Tooltip>
  );
}
