import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Zap,
  Brain,
  ChevronDown,
  LayoutGrid,
  Route,
  Activity,
  X,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { IGisNode, IGisLink, NodeType } from "@/types/infrastructure";
import { Input } from "@/components/ui/input";

interface OverlayPanelsProps {
  nodes: IGisNode[];
  selectedLink: IGisLink | null;
  showCoverage: boolean;
  showLinkBudget: boolean;
  isRoutingMode: boolean;
  showHeatmap: boolean;
  showAreas: boolean;
  visibleLayers: Set<NodeType>;
  routingPoints: IGisNode[];
  otdrDistanceKm: string;
  otdrFaultMarker: [number, number] | null;
  onToggleCoverage: () => void;
  onToggleLinkBudget: () => void;
  onToggleRouting: () => void;
  onToggleHeatmap: () => void;
  onToggleAreas: () => void;
  onToggleLayer: (type: NodeType) => void;
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
  isRoutingMode,
  showHeatmap,
  showAreas,
  visibleLayers,
  routingPoints,
  otdrDistanceKm,
  otdrFaultMarker,
  onToggleCoverage,
  onToggleLinkBudget,
  onToggleRouting,
  onToggleHeatmap,
  onToggleAreas,
  onToggleLayer,
  onFindOptimalRoute,
  onCloseOtdr,
  onOtdrDistanceChange,
  onFindFaultLocation,
}: OverlayPanelsProps) {
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);

  return (
    <>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-4 right-4 z-[1000] flex flex-col gap-3 w-72"
      >
        <div className="bg-sidebar/95 backdrop-blur-xl border border-sidebar-border/60 rounded-2xl shadow-2xl overflow-hidden">
          <div
            className="px-4 py-3 bg-sidebar-muted/50 border-b border-sidebar-border/40 flex items-center justify-between cursor-pointer group"
            onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Layers className="size-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground/80">
                Layer Intelligence
              </span>
            </div>
            <motion.div
              animate={{ rotate: isLayerPanelOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronDown className="size-4 text-muted-foreground" />
            </motion.div>
          </div>

          <AnimatePresence initial={false}>
            {isLayerPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={showCoverage ? "default" : "outline"}
                      size="sm"
                      className="h-9 text-[10px] font-bold group rounded-xl"
                      onClick={onToggleCoverage}
                    >
                      <MapIcon className="size-3.5 mr-2 transition-transform group-hover:scale-110" />
                      Coverage
                    </Button>
                    <Button
                      variant={showLinkBudget ? "default" : "outline"}
                      size="sm"
                      className="h-9 text-[10px] font-bold group rounded-xl"
                      onClick={onToggleLinkBudget}
                    >
                      <Zap className="size-3.5 mr-2 transition-transform group-hover:scale-110" />
                      Budget
                    </Button>
                    <Button
                      variant={showHeatmap ? "default" : "outline"}
                      size="sm"
                      className="h-9 text-[10px] font-bold group rounded-xl"
                      onClick={onToggleHeatmap}
                    >
                      <LayoutGrid className="size-3.5 mr-2 transition-transform group-hover:scale-110" />
                      Heatmap
                    </Button>
                    <Button
                      variant={showAreas ? "default" : "outline"}
                      size="sm"
                      className="h-9 text-[10px] font-bold group rounded-xl"
                      onClick={onToggleAreas}
                    >
                      <LayoutGrid className="size-3.5 mr-2 transition-transform group-hover:scale-110" />
                      Areas
                    </Button>
                  </div>

                  <div className="h-px bg-sidebar-border/40" />

                  <div className="space-y-2.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                      Visibility Toggle
                    </p>
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
                        {nodes.filter((n) => n.type === "POLE").length}
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
                        {nodes.filter((n) => n.type === "ODP").length}
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
                        {nodes.filter((n) => n.type === "CUSTOMER").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="layer-issue"
                          checked={visibleLayers.has("ISSUE" as NodeType)}
                          onCheckedChange={() =>
                            onToggleLayer("ISSUE" as NodeType)
                          }
                          className="scale-75 h-4 w-7 data-[state=checked]:bg-red-500 shadow-none border-none ring-0 focus-visible:ring-0"
                        />
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-medium text-foreground/70">
                          Issues/Laporan
                        </span>
                      </div>
                      <span className="font-mono text-muted-foreground/50">
                        {
                          nodes.filter((n) => n.type === ("ISSUE" as NodeType))
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-1.5 p-4 text-[9px] text-muted-foreground italic border-t border-sidebar-border/50 leading-tight bg-sidebar-muted/20">
                  Double-click aset untuk hapus. Klik untuk detail engineering.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* OTDR / Link Detail Panel */}
        <AnimatePresence>
          {selectedLink && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-sidebar/95 backdrop-blur-2xl border border-primary/20 rounded-2xl shadow-2xl p-4 space-y-4 ring-1 ring-primary/10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                  onClick={onCloseOtdr}
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary animate-pulse">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="text-[12px] font-black uppercase text-foreground/90">
                    OTDR Intelligence
                  </h3>
                  <p className="text-[9px] text-muted-foreground font-bold leading-none mt-0.5">
                    Analyzing Link Segment: #{selectedLink.id}
                  </p>
                </div>
              </div>

              <div className="bg-sidebar-muted/50 rounded-xl p-3 border border-sidebar-border/40">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Segment Distance
                  </span>
                  <span className="text-xs font-black text-primary">
                    {selectedLink.total_distance_meters.toFixed(2)}m
                  </span>
                </div>
                <Progress
                  value={otdrFaultMarker ? 100 : 0}
                  className="h-1 bg-primary/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/70 pl-1">
                  FAULT DETECTION (KM)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Ex: 0.52"
                    value={otdrDistanceKm}
                    onChange={(e) => onOtdrDistanceChange(e.target.value)}
                    className="h-9 text-xs bg-sidebar-muted border-sidebar-border/60 focus-visible:ring-primary rounded-xl"
                  />
                  <Button
                    size="sm"
                    className="h-9 bg-red-600 hover:bg-red-700 text-white font-bold px-4 rounded-xl shadow-lg shadow-red-500/20"
                    onClick={onFindFaultLocation}
                  >
                    Locate
                  </Button>
                </div>
              </div>

              {otdrFaultMarker && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50/80 border border-red-100 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-red-600 rounded-lg text-white">
                      <Search className="size-3" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-red-900 leading-none">
                        CRITICAL FAULT DETECTED
                      </p>
                      <p className="text-[9px] text-red-700 mt-1 leading-relaxed">
                        Potential cable break at marker. Alert sent to field
                        technician.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Routing Panel */}
        <AnimatePresence>
          {isRoutingMode && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-sidebar/90 backdrop-blur-2xl border-2 border-primary/20 rounded-full py-2.5 px-6 shadow-2xl ring-1 ring-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                    <Brain className="size-4" />
                  </div>
                  <span className="text-[11px] font-black text-foreground/80 tracking-tight uppercase">
                    AI Auto-Route
                  </span>
                </div>

                <div className="h-4 w-px bg-sidebar-border mx-1" />

                <div className="flex items-center gap-2">
                  <Badge
                    variant={routingPoints.length >= 1 ? "default" : "outline"}
                    className="h-6 px-3 text-[9px] font-black"
                  >
                    Point A: {routingPoints[0]?.id || "?"}
                  </Badge>
                  <Route className="size-3 text-muted-foreground animate-pulse" />
                  <Badge
                    variant={routingPoints.length >= 2 ? "default" : "outline"}
                    className="h-6 px-3 text-[9px] font-black"
                  >
                    Point B: {routingPoints[1]?.id || "?"}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  disabled={routingPoints.length < 2}
                  className="h-8 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] px-5 shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:scale-100"
                  onClick={onFindOptimalRoute}
                >
                  Generate Path
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full hover:bg-sidebar-accent"
                  onClick={onToggleRouting}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
