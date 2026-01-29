import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  Layers,
  Box,
  Zap,
  Map as MapIcon,
  X,
  Info,
  ChevronUp,
  ChevronDown,
  GripHorizontal,
  BoxSelect,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { IGisNode, IGisLink, NodeType } from "@/types/infrastructure";

interface OverlayPanelsProps {
  nodes: IGisNode[];
  selectedLink: IGisLink | null;
  showCoverage: boolean;
  showLinkBudget: boolean;
  show3D: boolean;
  isRoutingMode: boolean;
  showHeatmap: boolean;
  showAreas: boolean;
  visibleLayers: Set<NodeType>;
  routingPoints: IGisNode[];
  otdrDistanceKm: string;
  otdrFaultMarker: [number, number] | null;
  onToggleLayer: (type: NodeType) => void;
  onToggleCoverage: () => void;
  onToggleLinkBudget: () => void;
  onToggle3D: () => void;
  onToggleRouting: () => void;
  onToggleHeatmap: () => void;
  onToggleAreas: () => void;
  onFindOptimalRoute: () => void;
  onCloseOtdr: () => void;
  onOtdrDistanceChange: (val: string) => void;
  onFindFaultLocation: () => void;
}

export function GisOverlayPanels({
  nodes,
  selectedLink,
  showCoverage,
  showLinkBudget,
  show3D,
  isRoutingMode,
  showHeatmap,
  showAreas,
  visibleLayers,
  routingPoints,
  otdrDistanceKm,
  otdrFaultMarker,
  onToggleCoverage,
  onToggleLinkBudget,
  onToggle3D,
  onToggleRouting,
  onToggleHeatmap,
  onToggleAreas,
  onToggleLayer,
  onFindOptimalRoute,
  onCloseOtdr,
  onOtdrDistanceChange,
  onFindFaultLocation,
}: OverlayPanelsProps) {
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(false);

  return (
    <>
      {/* Analysis Controls - Draggable & Collapsible */}
      <motion.div
        drag
        dragMomentum={false}
        initial={{ x: -24, y: 24 }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 p-2 bg-sidebar/80 backdrop-blur-2xl rounded-2xl border border-sidebar-border/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ring-1 ring-white/10"
      >
        <div className="flex items-center justify-between border-b border-sidebar-border/30 mb-2 px-1 pb-1.5">
          <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary transition-colors">
            <GripHorizontal className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground/80">
              Analysis
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-sidebar-accent"
            onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}
          >
            {isAnalysisCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <AnimatePresence>
          {!isAnalysisCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-2 overflow-hidden"
            >
              <Button
                variant={showCoverage ? "default" : "secondary"}
                className="h-9 text-[11px] justify-start px-3 rounded-lg"
                onClick={onToggleCoverage}
              >
                <Radar
                  className={`mr-2.5 h-4 w-4 ${showCoverage ? "animate-pulse font-bold" : ""}`}
                />
                Coverage Analysis
              </Button>
              <Button
                variant={showLinkBudget ? "default" : "secondary"}
                className="h-9 text-[11px] justify-start px-3 rounded-lg"
                onClick={onToggleLinkBudget}
              >
                <Layers className="mr-2.5 h-4 w-4" />
                Optical Link Budget
              </Button>
              <Button
                variant={show3D ? "default" : "secondary"}
                className="h-9 text-[11px] justify-start px-3 rounded-lg"
                onClick={onToggle3D}
              >
                <Box
                  className={`mr-2.5 h-4 w-4 ${show3D ? "animate-bounce" : ""}`}
                />
                Enable 3D View
              </Button>
              <Button
                variant={isRoutingMode ? "default" : "secondary"}
                className="h-9 text-[11px] justify-start px-3 rounded-lg"
                onClick={onToggleRouting}
              >
                <Zap
                  className={`mr-2.5 h-4 w-4 ${isRoutingMode ? "animate-pulse" : ""}`}
                />
                {isRoutingMode ? "Cancel Routing" : "Auto-Routing Engine"}
              </Button>
              {isRoutingMode && routingPoints.length === 2 && (
                <Button
                  className="h-9 text-[11px] bg-purple-600 hover:bg-purple-700 animate-in zoom-in-50 rounded-lg"
                  onClick={onFindOptimalRoute}
                >
                  Calculate Now
                </Button>
              )}
              <Button
                variant={showHeatmap ? "default" : "secondary"}
                className="h-9 text-[11px] justify-start px-3 rounded-lg"
                onClick={onToggleHeatmap}
              >
                <MapIcon
                  className={`mr-2.5 h-4 w-4 ${showHeatmap ? "animate-pulse" : ""}`}
                />
                Urban Planning (Heatmap)
              </Button>
              <Button
                variant={showAreas ? "default" : "secondary"}
                className="h-9 text-[11px] justify-start px-3 rounded-lg"
                onClick={onToggleAreas}
              >
                <BoxSelect
                  className={`mr-2.5 h-4 w-4 ${showAreas ? "animate-pulse" : ""}`}
                />
                Area Groupings
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* OTDR Side Panel - Draggable */}
      {selectedLink && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ x: -250, y: 24 }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-4 right-0 z-[1000] w-64 animate-in slide-in-from-right-4 duration-300"
        >
          <div className="bg-sidebar/80 backdrop-blur-2xl p-4 rounded-2xl border border-sidebar-border/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ring-1 ring-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-sidebar-border/30 pb-2 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.1em] text-primary/80">
                <GripHorizontal className="h-4 w-4 text-muted-foreground/50" />
                OTDR Analysis
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onCloseOtdr}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-0.5">
                <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
                  Kabel ID: #{selectedLink?.id}
                </label>
                <p className="text-xs font-bold">
                  Total Panjang:{" "}
                  {((selectedLink?.total_distance_meters || 0) / 1000).toFixed(
                    2,
                  )}{" "}
                  KM
                </p>
              </div>

              <div className="p-2 bg-background/50 rounded-lg border border-sidebar-border space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-tight">
                  Plot Jarak Fault
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={otdrDistanceKm}
                    onChange={(e) => onOtdrDistanceChange(e.target.value)}
                    className="flex-1 bg-background border border-input rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="KM..."
                  />
                  <Button
                    size="sm"
                    className="h-7 px-3 text-[10px]"
                    onClick={onFindFaultLocation}
                  >
                    Plot
                  </Button>
                </div>
              </div>

              {otdrFaultMarker && (
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-[9px] text-red-600 font-bold flex items-start gap-2">
                  <Info className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>
                    Fault terpetakan! Segera kirim tim teknisi ke lokasi yang
                    ditandai.
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend Footer - Draggable & Collapsible */}
      <motion.div
        drag
        dragMomentum={false}
        initial={{ x: 24, y: -24 }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-6 left-6 z-[1000] w-60"
      >
        <div className="bg-sidebar/80 backdrop-blur-2xl p-3 rounded-2xl border border-sidebar-border/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ring-1 ring-white/10 space-y-2.5">
          <div className="flex items-center justify-between border-b border-sidebar-border/30 pb-2 px-1">
            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary transition-colors">
              <GripHorizontal className="h-4 w-4" />
              <div className="flex items-center gap-1.5 font-black text-[10px] tracking-[0.1em] uppercase whitespace-nowrap text-foreground/80">
                <Info className="h-4 w-4 text-primary" />
                Legend & Stats
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-sidebar-accent"
              onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
            >
              {isLegendCollapsed ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>

          <AnimatePresence>
            {!isLegendCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2 pt-1"
              >
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="layer-pole"
                        checked={visibleLayers.has("POLE")}
                        onCheckedChange={() => onToggleLayer("POLE")}
                        className="scale-75 h-4 w-7 data-[state=checked]:bg-blue-600 shadow-none border-none ring-0 focus-visible:ring-0"
                      />
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="font-medium text-foreground/70">
                        Pole/Tiang
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground/50">
                      {nodes.filter((n: IGisNode) => n.type === "POLE").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="layer-odp"
                        checked={visibleLayers.has("ODP")}
                        onCheckedChange={() => onToggleLayer("ODP")}
                        className="scale-75 h-4 w-7 data-[state=checked]:bg-emerald-600 shadow-none border-none ring-0 focus-visible:ring-0"
                      />
                      <div className="w-2 h-2 rounded-sm bg-emerald-600"></div>
                      <span className="font-medium text-foreground/70">
                        ODP/Box
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground/50">
                      {nodes.filter((n: IGisNode) => n.type === "ODP").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="layer-customer"
                        checked={visibleLayers.has("CUSTOMER")}
                        onCheckedChange={() => onToggleLayer("CUSTOMER")}
                        className="scale-75 h-4 w-7 data-[state=checked]:bg-orange-500 shadow-none border-none ring-0 focus-visible:ring-0"
                      />
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="font-medium text-foreground/70">
                        Customer
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground/50">
                      {
                        nodes.filter((n: IGisNode) => n.type === "CUSTOMER")
                          .length
                      }
                    </span>
<<<<<<< HEAD
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="layer-issue"
                          checked={visibleLayers.has("ISSUE")}
                          onCheckedChange={() => onToggleLayer("ISSUE")}
                          className="scale-75 h-4 w-7 data-[state=checked]:bg-red-500 shadow-none border-none ring-0 focus-visible:ring-0"
                        />
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-medium text-foreground/70">
                          Issues/Laporan
                        </span>
                      </div>
                      <span className="font-mono text-muted-foreground/50">
                        {
                          nodes.filter((n: IGisNode) => n.type === "ISSUE")
                            .length
                        }
                      </span>
                    </div>
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
                  </div>
                </div>
                <div className="pt-1.5 text-[9px] text-muted-foreground italic border-t border-sidebar-border/50 leading-tight">
                  Double-click aset untuk hapus. Klik untuk detail engineering.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
