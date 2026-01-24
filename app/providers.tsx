"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { getQueryClient } from "@/lib/query-client";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  // Use optimized query client
  const queryClient = getQueryClient();

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CommandPaletteProvider>{children}</CommandPaletteProvider>
        </TooltipProvider>
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}
