import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import {
  BrainCircuit,
  Trash2,
  Home,
  PlusCircle,
  Settings2,
  AlertTriangle,
  Layers,
  Eye,
  EyeOff,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GisContextMenuProps {
  position: [number, number];
  onClose: () => void;
  onAnalyze: () => void;
  onDetectBuildings?: (polygon: [number, number][]) => Promise<void>;
  onPlaceODP?: (position: [number, number]) => void;
  onMarkIssue?: (position: [number, number]) => void;
  onDelete?: () => void;
  areaId?: string | number;
  areaPolygon?: [number, number][];
  showHeatmap?: boolean;
  setShowHeatmap?: (val: boolean) => void;
  showCoverage?: boolean;
  setShowCoverage?: (val: boolean) => void;
  detectedHousesCount?: number;
  onAutoPinDetected?: () => void;
}

export function GisContextMenu({
  position,
  onClose,
  onAnalyze,
  onDetectBuildings,
  onPlaceODP,
  onMarkIssue,
  onDelete,
  areaId,
  areaPolygon,
  showHeatmap,
  setShowHeatmap,
  showCoverage,
  setShowCoverage,
  detectedHousesCount = 0,
  onAutoPinDetected,
}: GisContextMenuProps) {
  const map = useMap();
  const containerPoint = map.latLngToContainerPoint(position);
  const ref = useRef<HTMLDivElement>(null);

  // Close on map move/zoom (but NOT on click - handled separately)
  useEffect(() => {
    const handleMapEvent = () => onClose();
    map.on("move", handleMapEvent);
    map.on("zoom", handleMapEvent);
    map.on("dragstart", handleMapEvent);

    return () => {
      map.off("move", handleMapEvent);
      map.off("zoom", handleMapEvent);
      map.off("dragstart", handleMapEvent);
    };
  }, [map, onClose]);

  // Close on click outside the menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use timeout to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Handler wrapper that closes menu and executes action
  const handleAction = (action: () => void) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      action();
      onClose();
    };
  };

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: containerPoint.y,
        left: containerPoint.x,
        zIndex: 9999,
      }}
      className="min-w-[220px] bg-sidebar/95 backdrop-blur-xl text-popover-foreground rounded-xl border border-blue-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider uppercase opacity-70">
            Map Intelligence
          </span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">
          {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </span>
      </div>

      <div className="p-1.5 space-y-0.5">
        {/* Analysis Group */}
        <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
          Analysis
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-9 text-xs font-medium hover:bg-blue-500/20 hover:text-blue-400 group transition-all"
          onClick={handleAction(() => {
            onAnalyze();
            toast.success("Smart Analyzer activated!");
          })}
        >
          <BrainCircuit className="mr-2.5 h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
          Smart Analyze Area
          <span className="ml-auto text-[9px] opacity-30 font-mono">⌘A</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-9 text-xs font-medium hover:bg-orange-500/20 hover:text-orange-400 group"
          onClick={handleAction(async () => {
            if (onDetectBuildings) {
              // Create polygon from area or generate small area around click point
              let polygon: [number, number][];
              if (areaPolygon && areaPolygon.length >= 3) {
                polygon = areaPolygon;
              } else {
                // Generate a small polygon (approx 200m x 200m) around the click point
                const lat = position[0];
                const lng = position[1];
                const offset = 0.0008; // ~80 meters for a focused search

                // Closed polygon: 5 points (start == end)
                polygon = [
                  [lat - offset, lng - offset],
                  [lat + offset, lng - offset],
                  [lat + offset, lng + offset],
                  [lat - offset, lng + offset],
                  [lat - offset, lng - offset],
                ];
              }
              toast.loading("Memindai bangunan lewat satelit (OSM)...", {
                id: "osm-detect",
              });
              try {
                await onDetectBuildings(polygon);
                // Success message handled in parent to include counts
              } catch {
                toast.error("Gagal mendeteksi bangunan", { id: "osm-detect" });
              }
            } else {
              toast.info(
                "Use Smart Analyze first to enable building detection.",
              );
            }
          })}
        >
          <Home className="mr-2.5 h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
          Detect Buildings (OSM)
          <span className="ml-auto text-[9px] opacity-30 font-mono">⌘D</span>
        </Button>

        {detectedHousesCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9 text-xs font-medium text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 group animate-in zoom-in"
            onClick={handleAction(() => {
              if (onAutoPinDetected) {
                onAutoPinDetected();
              }
            })}
          >
            <CheckSquare className="mr-2.5 h-4 w-4" />
            Auto-Pin {detectedHousesCount} Houses
            <span className="ml-auto text-[9px] opacity-30 font-mono">⌘S</span>
          </Button>
        )}

        <div className="h-px bg-white/5 my-1.5" />

        {/* Quick Actions Group */}
        <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
          Quick Actions
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-9 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-400 group"
          onClick={handleAction(() => {
            if (onPlaceODP) {
              onPlaceODP(position);
            } else {
              toast.info("Place ODP: Coming soon! Use toolbar for now.");
            }
          })}
        >
          <PlusCircle className="mr-2.5 h-4 w-4 text-emerald-500 group-hover:rotate-90 transition-transform" />
          Place Custom ODP
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-9 text-xs font-medium hover:bg-amber-500/10 hover:text-amber-400 group"
          onClick={handleAction(() => {
            if (onMarkIssue) {
              onMarkIssue(position);
            } else {
              toast.info("Mark Issue: Coming soon!");
            }
          })}
        >
          <AlertTriangle className="mr-2.5 h-4 w-4 text-amber-500" />
          Mark as Issue Location
        </Button>

        {/* View Layers Section */}
        {(setShowHeatmap || setShowCoverage) && (
          <>
            <div className="h-px bg-white/5 my-1.5" />
            <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter flex items-center gap-1">
              <Layers className="h-3 w-3" />
              View Layers
            </div>

            {setShowHeatmap && (
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-9 text-xs font-medium group ${showHeatmap ? "bg-orange-500/10 text-orange-400" : "hover:bg-white/5"}`}
                onClick={handleAction(() => {
                  setShowHeatmap(!showHeatmap);
                  toast.success(
                    showHeatmap ? "Heatmap disabled" : "Heatmap enabled",
                  );
                })}
              >
                {showHeatmap ? (
                  <Eye className="mr-2.5 h-4 w-4 text-orange-500" />
                ) : (
                  <EyeOff className="mr-2.5 h-4 w-4 text-white/40" />
                )}
                Heatmap Analysis
                <div
                  className={`ml-auto w-2 h-2 rounded-full ${showHeatmap ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-white/20"}`}
                />
              </Button>
            )}

            {setShowCoverage && (
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-9 text-xs font-medium group ${showCoverage ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5"}`}
                onClick={handleAction(() => {
                  setShowCoverage(!showCoverage);
                  toast.success(
                    showCoverage ? "Coverage disabled" : "Coverage enabled",
                  );
                })}
              >
                {showCoverage ? (
                  <Eye className="mr-2.5 h-4 w-4 text-blue-500" />
                ) : (
                  <EyeOff className="mr-2.5 h-4 w-4 text-white/40" />
                )}
                Signal Coverage
                <div
                  className={`ml-auto w-2 h-2 rounded-full ${showCoverage ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-white/20"}`}
                />
              </Button>
            )}
          </>
        )}

        {/* Area Management - only show if inside an area */}
        {areaId && onDelete && (
          <>
            <div className="h-px bg-white/5 my-1.5" />
            <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
              Area Management
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-9 text-xs font-medium hover:bg-indigo-500/10 hover:text-indigo-400 group"
              onClick={handleAction(() => {
                toast.info("Area Settings: Coming soon!");
              })}
            >
              <Settings2 className="mr-2.5 h-4 w-4 text-indigo-400" />
              Area Settings
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-9 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 group transition-all"
              onClick={handleAction(() => {
                onDelete();
                toast.success("Area deleted!");
              })}
            >
              <Trash2 className="mr-2.5 h-4 w-4 transition-transform group-hover:rotate-12" />
              Delete This Area
              <span className="ml-auto text-[9px] opacity-30 font-mono">⌫</span>
            </Button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-black/20 text-[8px] text-muted-foreground/50 border-t border-white/5 flex items-center justify-between">
        <span>GIS PRO v2.4</span>
        <div className="flex gap-2">
          <span>ESC: CLOSE</span>
        </div>
      </div>
    </div>
  );
}
