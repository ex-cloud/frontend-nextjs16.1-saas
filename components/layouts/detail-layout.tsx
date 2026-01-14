import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DetailLayoutProps {
  header?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DetailLayout({
  header,
  children,
  sidebar,
  footer,
  className,
}: DetailLayoutProps) {
  return (
    <div
      className={cn(
        "border border-gray-400 rounded-md overflow-hidden bg-background",
        className
      )}
    >
      {/* Header Area */}
      {header && (
        <div className="border-b border-gray-400 bg-background">{header}</div>
      )}

      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Main Content Area */}
        <div className="flex-1 p-2 min-w-0">{children}</div>

        {/* Dynamic Sidebar Area */}
        {sidebar && (
          <aside className="w-full md:w-[350px] p-2 shrink-0">{sidebar}</aside>
        )}
      </div>

      {/* Global Footer Area */}
      {footer && (
        <div className="border-t border-gray-400 bg-muted/20">{footer}</div>
      )}
    </div>
  );
}
