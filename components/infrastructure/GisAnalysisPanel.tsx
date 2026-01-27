import React from "react";
import { useMap } from "react-leaflet";
import * as turf from "@turf/turf";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network as OdpIcon,
  Zap,
  MapPin,
  BrainCircuit,
  GripHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  NodeType,
  IGisNode,
  IGisLink,
  ISpatialAnalysisResult,
} from "@/types/infrastructure";

interface GisAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analysisPolygon?: [number, number][] | null;
  currentAnalysis: ISpatialAnalysisResult | null;
  setCurrentAnalysis: (res: ISpatialAnalysisResult | null) => void;
  performSpatialAnalysis: (
    polygon: [number, number][],
  ) => ISpatialAnalysisResult | null;
  onAnalysisResults: (res: ISpatialAnalysisResult | null) => void;
  fetchOsmBuildings?: (
    polygon: [number, number][],
  ) => Promise<Partial<IGisNode>[]>;
  handleBulkSaveNodes?: (nodes: Partial<IGisNode>[]) => Promise<IGisNode[]>;
  handleBulkSaveLinks?: (links: Partial<IGisLink>[]) => Promise<IGisLink[]>;
  setDetectedHouses?: (nodes: Partial<IGisNode>[]) => void;
  detectedHouses: Partial<IGisNode>[];
  nodes: IGisNode[];
  generatedRoutes: Partial<IGisLink>[];
  setGeneratedRoutes: (routes: Partial<IGisLink>[]) => void;
}

export function GisAnalysisPanel({
  isOpen,
  onClose,
  analysisPolygon,
  currentAnalysis,
  setCurrentAnalysis,
  performSpatialAnalysis,
  onAnalysisResults,
  fetchOsmBuildings,
  handleBulkSaveNodes,
  handleBulkSaveLinks,
  setDetectedHouses,
  detectedHouses,
  nodes,
  generatedRoutes,
  setGeneratedRoutes,
}: GisAnalysisPanelProps) {
  const map = useMap();

  if (!isOpen || !currentAnalysis) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="absolute top-4 right-4 z-[1000] w-80 bg-sidebar/95 backdrop-blur-2xl rounded-xl border border-sidebar-border/60 shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5 cursor-grab active:cursor-grabbing handle">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">
                Smart Area Analyzer
              </h3>
              <p className="text-[9px] text-muted-foreground">
                AI-Powered Design Assistant
              </p>
            </div>
          </div>
          <GripHorizontal className="h-4 w-4 text-muted-foreground/50" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-500">
                {currentAnalysis.counts.CUSTOMER}
              </div>
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Home
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
              <div className="text-xl font-bold text-emerald-500">
                {currentAnalysis.counts.POLE}
              </div>
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Pole
              </div>
            </div>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-500">
                {currentAnalysis.counts.ODP}
              </div>
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">
                ODP
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* Step 0: Area Persistence (Replaced by context menu action generally, but useful to keep if new area) */}
            {/* Assuming area is already persistent if invoked from context menu, but logic can be added here if needed */}

            {/* Step 1: House Detection */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/20 transition-all">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500 mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-bold">Step 1: Detect Houses</h4>
                <p className="text-[9px] text-muted-foreground mb-2 leading-snug">
                  Scan satelit (OSM) untuk mencari bangunan yang belum terdata.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-[10px] flex-1 bg-white/5 hover:bg-white/10"
                    onClick={async () => {
                      if (analysisPolygon && fetchOsmBuildings) {
                        const buildings =
                          await fetchOsmBuildings(analysisPolygon);
                        setDetectedHouses?.(buildings);
                        toast.success(`${buildings.length} Rumah dideteksi`);
                      }
                    }}
                  >
                    Detect (OSM)
                  </Button>
                  <span className="text-[10px] font-mono text-orange-500 font-bold px-2 py-1 bg-orange-500/10 rounded-lg">
                    {detectedHouses.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Auto-Pin (Persistence) */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500 mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-bold">
                  Step 2: Auto-Pin Houses
                </h4>
                <p className="text-[9px] text-muted-foreground mb-2 leading-snug">
                  Simpan semua rumah terdeteksi ke database.
                </p>
                <Button
                  size="sm"
                  className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 w-full"
                  disabled={detectedHouses.length === 0}
                  onClick={async () => {
                    if (handleBulkSaveNodes && detectedHouses.length > 0) {
                      await handleBulkSaveNodes(detectedHouses);
                      setDetectedHouses?.([]);
                      toast.success("Nodes berhasil dipin!");
                    }
                  }}
                >
                  Pin to Database
                </Button>
              </div>
            </div>

            {/* Step 3: ODP Recommendations */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500 mt-0.5">
                <OdpIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-bold">
                  Step 3: ODP Suggestions
                </h4>
                <p className="text-[9px] text-muted-foreground mb-2 leading-snug">
                  Cari lokasi penempatan ODP terbaik.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-[10px] flex-1 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                      onClick={() => {
                        if (analysisPolygon) {
                          const results =
                            performSpatialAnalysis(analysisPolygon);
                          if (results) {
                            setCurrentAnalysis(results);
                            onAnalysisResults(results);
                            if (results.suggestions.length > 0)
                              map.panTo(results.suggestions[0]);
                          }
                        }
                      }}
                    >
                      Generate ODP
                    </Button>
                    <div className="flex flex-col items-center px-1">
                      <span className="text-[10px] font-black text-purple-500 leading-none">
                        {currentAnalysis?.suggestions.length || 0}
                      </span>
                      <span className="text-[7px] font-bold text-muted-foreground">
                        ODP
                      </span>
                    </div>
                  </div>
                  {currentAnalysis?.suggestions &&
                    currentAnalysis.suggestions.length > 0 && (
                      <Button
                        size="sm"
                        className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 w-full"
                        onClick={async () => {
                          if (handleBulkSaveNodes) {
                            const newOdps = currentAnalysis.suggestions.map(
                              (coord) => ({
                                lat: coord[0],
                                lng: coord[1],
                                type: "ODP" as NodeType,
                                metadata: { capacity: 16 },
                              }),
                            );
                            const saved = await handleBulkSaveNodes(newOdps);
                            if (saved.length > 0) {
                              toast.success(`${saved.length} ODP disimpan`);
                            }
                          }
                        }}
                      >
                        Pin {currentAnalysis.suggestions.length} ODPs
                      </Button>
                    )}
                </div>
              </div>
            </div>

            {/* Step 4: Auto-Routing */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/20 transition-all">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500 mt-0.5">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-bold">Step 4: Auto-Route</h4>
                <p className="text-[9px] text-muted-foreground mb-2 leading-snug">
                  Tarik kabel otomatis dari ODP baru ke Tiang terdekat.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-[10px] bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 w-full"
                    onClick={() => {
                      if (!analysisPolygon) return;

                      // Convert polygon to proper format for Turf
                      const poly = turf.polygon([
                        [
                          ...analysisPolygon.map((c) => [c[1], c[0]]),
                          [analysisPolygon[0][1], analysisPolygon[0][0]],
                        ],
                      ]);

                      // Get ODPs inside the analysis area
                      const odpsInArea = nodes.filter(
                        (n) =>
                          n.type === "ODP" &&
                          turf.booleanPointInPolygon(
                            turf.point([n.lng, n.lat]),
                            poly,
                          ),
                      );

                      // Get potential parent nodes
                      const parents = nodes.filter((n) =>
                        ["POLE", "ODC", "CABINET", "SLACK_LOOP"].includes(
                          n.type,
                        ),
                      );

                      if (odpsInArea.length === 0) {
                        toast.error(
                          "Tidak ada ODP di dalam area untuk di-route. Pastikan ODP sudah di-'Pin' (Step 2/3)!",
                        );
                        return;
                      }

                      if (parents.length === 0) {
                        toast.error(
                          "Gagal tarik rute: Tidak ada Tiang (Pole) atau ODC ditemukan sebagai titik induk rute. Silakan tambahkan tiang terlebih dahulu!",
                        );
                        return;
                      }

                      const newRoutes: Partial<IGisLink>[] = [];

                      odpsInArea.forEach((odp) => {
                        let nearest = null;
                        let minDistance = Infinity;

                        parents.forEach((parent) => {
                          const dist = turf.distance(
                            turf.point([odp.lng, odp.lat]),
                            turf.point([parent.lng, parent.lat]),
                            { units: "meters" },
                          );
                          if (dist < minDistance) {
                            minDistance = dist;
                            nearest = parent;
                          }
                        });

                        if (nearest && minDistance < 500) {
                          // Increased tolerance to 500m
                          newRoutes.push({
                            source_node_id: (nearest as IGisNode).id,
                            target_node_id: odp.id,
                            cable_type: "24C",
                            path_geometry: [
                              [
                                (nearest as IGisNode).lat,
                                (nearest as IGisNode).lng,
                              ],
                              [odp.lat, odp.lng],
                            ],
                            total_distance_meters: minDistance,
                          });
                        }
                      });

                      setGeneratedRoutes(newRoutes);
                      toast.success(
                        `${newRoutes.length} Rute kabel terdeteksi`,
                      );
                    }}
                  >
                    Generate Routes
                  </Button>

                  {generatedRoutes.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <div className="text-[9px] text-muted-foreground flex justify-between">
                        <span>Total: {generatedRoutes.length} Kabel</span>
                        <span>
                          ~
                          {(
                            generatedRoutes.reduce(
                              (acc, curr) =>
                                acc + (curr.total_distance_meters || 0),
                              0,
                            ) / 1000
                          ).toFixed(2)}{" "}
                          km
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-[10px] bg-yellow-600 hover:bg-yellow-700 w-full"
                        onClick={async () => {
                          if (handleBulkSaveLinks) {
                            const saved =
                              await handleBulkSaveLinks(generatedRoutes);
                            if (saved.length > 0) {
                              toast.success(
                                `${saved.length} Kabel berhasil disimpan!`,
                              );
                              setGeneratedRoutes([]);
                            }
                          }
                        }}
                      >
                        Save Routes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info (Analysis Stats) */}
        <div className="p-4 bg-black/20 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground">
              Area: {currentAnalysis.area_sqkm.toFixed(4)} km²
            </span>
            <Button
              variant="ghost"
              className="h-6 text-[10px] text-red-500 hover:bg-red-500/10"
              onClick={() => {
                onAnalysisResults(null);
                onClose();
              }}
            >
              Reset & Close
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
