import React, { useEffect, useCallback, useRef } from "react";
import { useMap, Polyline, Popup } from "react-leaflet";
import * as turf from "@turf/turf";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
  TowerControl as PoleIcon,
  MousePointer2,
  Move,
  Settings2,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  MapPin,
  BoxSelect,
  BrainCircuit,
  Network as OdpIcon,
  Zap,
  Users as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  NodeType,
  IGisNode,
  IGisLink,
  IAreaGroup,
  INetworkStandard,
  ISpatialAnalysisResult,
} from "@/types/infrastructure";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { GisAnalysisPanel } from "./GisAnalysisPanel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MapWithGeoman {
  pm: {
    setGlobalOptions: (options: object) => void;
    enableDraw: (shape: string, options?: object) => void;
    disableDraw: () => void;
    enableGlobalDragMode: () => void;
    disableGlobalDragMode: () => void;
    enableGlobalEditMode: () => void;
    disableGlobalEditMode: () => void;
    globalDragModeEnabled: () => boolean;
    globalEditModeEnabled: () => boolean;
  };
}

const REGIONS = [
  { id: "bandung", name: "Bandung", lat: -6.9175, lng: 107.6191, zoom: 12 },
  { id: "jakarta", name: "Jakarta", lat: -6.2088, lng: 106.8456, zoom: 12 },
  { id: "surabaya", name: "Surabaya", lat: -7.2575, lng: 112.7521, zoom: 12 },
  { id: "semarang", name: "Semarang", lat: -6.9666, lng: 110.4196, zoom: 12 },
  { id: "medan", name: "Medan", lat: 3.5952, lng: 98.6722, zoom: 12 },
  { id: "makassar", name: "Makassar", lat: -5.1477, lng: 119.4327, zoom: 12 },
  {
    id: "yogyakarta",
    name: "Yogyakarta",
    lat: -7.7956,
    lng: 110.3695,
    zoom: 13,
  },
  { id: "denpasar", name: "Denpasar", lat: -8.6705, lng: 115.2126, zoom: 13 },
];

interface MapControlsProps {
  onNodeAdded: (node: Omit<IGisNode, "id">) => Promise<IGisNode | null>;
  onLinkAdded: (link: Omit<IGisLink, "id">) => Promise<IGisLink | null>;
  canModify: boolean;
  nodes: IGisNode[];
  activeMode: string | null;
  setActiveMode: (mode: string | null) => void;
  onClearSelection: () => void;
  onCreateAreaGroup: (
    data: Partial<IAreaGroup> & { node_ids: number[] },
  ) => Promise<IAreaGroup | null>;
  standards: Record<string, INetworkStandard[] | INetworkStandard>;
  performSpatialAnalysis: (
    polygonCoords: [number, number][],
    customTargetNodes?: IGisNode[],
  ) => ISpatialAnalysisResult | null;
  onAnalysisResults: (results: ISpatialAnalysisResult | null) => void;
  fetchOsmBuildings?: (
    polygonCoords: [number, number][],
  ) => Promise<Partial<IGisNode>[]>;
  handleBulkSaveNodes?: (nodes: Partial<IGisNode>[]) => Promise<IGisNode[]>;
  setDetectedHouses?: (nodes: Partial<IGisNode>[]) => void;
  detectedHouses?: Partial<IGisNode>[];
  analysisPolygon?: [number, number][] | null;
  setAnalysisPolygon?: (polygon: [number, number][] | null) => void;
  handleBulkSaveLinks?: (links: Partial<IGisLink>[]) => Promise<IGisLink[]>;
}

export function GisMapControls({
  onNodeAdded,
  onLinkAdded,
  canModify,
  nodes,
  activeMode,
  setActiveMode,
  onClearSelection,
  onCreateAreaGroup,
  standards,
  performSpatialAnalysis,
  onAnalysisResults,
  fetchOsmBuildings,
  handleBulkSaveNodes,
  setDetectedHouses,
  detectedHouses = [],
  analysisPolygon,
  setAnalysisPolygon,
  handleBulkSaveLinks,
}: MapControlsProps) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [regionPopoverOpen, setRegionPopoverOpen] = React.useState(false);
  const [areaDialogPortalOpen, setAreaDialogPortalOpen] = React.useState(false);
  const [newAreaBounds, setNewAreaBounds] = React.useState<[number, number][]>(
    [],
  );
  const [areaFormData, setAreaFormData] = React.useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [analysisPanelOpen, setAnalysisPanelOpen] = React.useState(false);
  const [currentAnalysis, setCurrentAnalysis] =
    React.useState<ISpatialAnalysisResult | null>(null);

  const [generatedRoutes, setGeneratedRoutes] = React.useState<
    Partial<IGisLink>[]
  >([]);

  const prevPolygonRef = useRef<[number, number][] | null>(null);

  useEffect(() => {
    const polygonChanged =
      analysisPolygon &&
      analysisPolygon.length >= 3 &&
      prevPolygonRef.current !== analysisPolygon;

    if (polygonChanged && activeMode === "analyzer") {
      const timeoutId = setTimeout(() => {
        setAnalysisPanelOpen(true);
      }, 0);
      prevPolygonRef.current = analysisPolygon;
      return () => clearTimeout(timeoutId);
    }
  }, [analysisPolygon, activeMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const disableMapInteraction = () => {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    };

    const enableMapInteraction = () => {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    };

    container.addEventListener("mouseenter", disableMapInteraction);
    container.addEventListener("mouseleave", enableMapInteraction);

    return () => {
      container.removeEventListener("mouseenter", disableMapInteraction);
      container.removeEventListener("mouseleave", enableMapInteraction);
      enableMapInteraction();
    };
  }, [map]);

  const calculateTotalDistance = useCallback(
    (latlngs: L.LatLng[]) => {
      let total = 0;
      for (let i = 0; i < latlngs.length - 1; i++) {
        total += map.distance(latlngs[i], latlngs[i + 1]);
      }
      return total;
    },
    [map],
  );

  const handleRegionChange = (regionId: string) => {
    const region = REGIONS.find((r) => r.id === regionId);
    if (region) {
      map.setView([region.lat, region.lng], region.zoom, { animate: true });
      toast.success(`Pindah ke area ${region.name}`);
      setRegionPopoverOpen(false);
    }
  };

  useEffect(() => {
    if (!map || !canModify) return;

    const geomanMap = map as unknown as MapWithGeoman;
    if (!geomanMap.pm) return;

    geomanMap.pm.setGlobalOptions({
      allowSelfIntersection: false,
      snappable: true,
      snapDistance: 30,
    });
    const pm = geomanMap.pm;

    const handleCreate = (
      e: { shape: string; layer: L.Layer } | L.LeafletEvent,
    ) => {
      const event = e as { shape: string; layer: L.Layer };
      const { shape, layer } = event;

      if (shape === "Marker" && "getLatLng" in layer) {
        const markerLayer = layer as L.Marker;
        const latlng = markerLayer.getLatLng();
        const odpStandards = standards.odp;
        const defaultCapacity = Array.isArray(odpStandards)
          ? (odpStandards as INetworkStandard[]).find(
              (s) => s.config_key === "odp_standards",
            )?.config_value?.default_capacity || 16
          : 16;

        onNodeAdded({
          lat: latlng.lat,
          lng: latlng.lng,
          type: (activeMode === "pole"
            ? "POLE"
            : activeMode === "customer"
              ? "CUSTOMER"
              : "ODP") as NodeType,
          metadata: {
            capacity: activeMode === "odp" ? defaultCapacity : undefined,
            occupied_ports: 0,
          },
        });
        map.removeLayer(layer);
      } else if (shape === "Line" && "getLatLngs" in layer) {
        const polylineLayer = layer as L.Polyline;
        const latlngs = polylineLayer.getLatLngs() as L.LatLng[];

        const findNearestNode = (latlng: L.LatLng) => {
          let nearest = null;
          let minDistance = 100;
          nodes.forEach((node) => {
            const dist = map.distance(latlng, [node.lat, node.lng]);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = node.id;
            }
          });
          return nearest;
        };

        const sourceId = findNearestNode(latlngs[0]);
        const targetId = findNearestNode(latlngs[latlngs.length - 1]);

        if (sourceId && targetId) {
          onLinkAdded({
            source_node_id: sourceId,
            target_node_id: targetId,
            path_geometry: latlngs.map((l: L.LatLng) => [l.lat, l.lng]),
            total_distance_meters: calculateTotalDistance(latlngs),
          });
        } else {
          toast.error("Gagal menyambung kabel: Ujung terlalu jauh dari node.");
        }
      } else if (shape === "Polygon" && "getLatLngs" in layer) {
        const polygonLayer = layer as L.Polygon;
        const latlngs = (polygonLayer.getLatLngs()[0] as L.LatLng[]).map(
          (l) => [l.lat, l.lng] as [number, number],
        );

        if (activeMode === "analyzer") {
          setAnalysisPolygon?.(latlngs);
          const results = performSpatialAnalysis(latlngs);
          setCurrentAnalysis(results);
          if (results) onAnalysisResults(results);
          setAnalysisPanelOpen(true);
        } else {
          setNewAreaBounds(latlngs);
          setAreaDialogPortalOpen(true);
        }
        map.removeLayer(layer);
      }

      setActiveMode(null);
      pm.disableDraw();
    };

    map.on("pm:create", handleCreate as L.LeafletEventHandlerFn);

    return () => {
      map.off("pm:create", handleCreate as L.LeafletEventHandlerFn);
    };
  }, [
    map,
    activeMode,
    onNodeAdded,
    onLinkAdded,
    calculateTotalDistance,
    nodes,
    canModify,
    setActiveMode,
    onAnalysisResults,
    performSpatialAnalysis,
    standards.odp,
    setAnalysisPolygon,
  ]);

  if (!canModify) return null;

  const enableDrawMarker = (type: string) => {
    const pm = (map as unknown as MapWithGeoman).pm;
    if (!pm) return;
    setActiveMode(type);
    pm.enableDraw("Marker", { snappable: true });
  };

  const enableDrawLine = () => {
    const pm = (map as unknown as MapWithGeoman).pm;
    if (!pm) return;
    setActiveMode("line");
    pm.enableDraw("Line", { snappable: true });
  };

  const enableDrawArea = () => {
    const pm = (map as unknown as MapWithGeoman).pm;
    if (!pm) return;
    setActiveMode("area");
    pm.enableDraw("Polygon", { snappable: true });
  };

  const enableAnalyzer = () => {
    const pm = (map as unknown as MapWithGeoman).pm;
    if (!pm) return;
    setActiveMode("analyzer");
    pm.enableDraw("Polygon", { snappable: true });
    onAnalysisResults(null);
    setCurrentAnalysis(null);
    setAnalysisPanelOpen(false);
  };

  const clearModes = () => {
    setActiveMode(null);
    onClearSelection();
    const pm = (map as unknown as MapWithGeoman).pm;
    pm.disableDraw();
    pm.disableGlobalDragMode();
    pm.disableGlobalEditMode();
  };

  const toggleDragMode = () => {
    const pm = (map as unknown as MapWithGeoman).pm;
    const isDragging = pm.globalDragModeEnabled();
    clearModes();
    if (!isDragging) {
      setActiveMode("move");
      pm.enableGlobalDragMode();
    }
  };

  const toggleEditMode = () => {
    const pm = (map as unknown as MapWithGeoman).pm;
    const isEditing = pm.globalEditModeEnabled();
    clearModes();
    if (!isEditing) {
      setActiveMode("edit");
      pm.enableGlobalEditMode();
    }
  };

  return (
    <>
      <motion.div
        ref={containerRef}
        drag
        dragMomentum={false}
        initial={{ x: 16, y: 16 }}
        className="absolute z-[1000] flex flex-col p-2 bg-sidebar/95 backdrop-blur-2xl rounded-xl border border-sidebar-border/60 shadow-2xl cursor-default"
        style={{ touchAction: "none" }}
      >
        <div className="flex items-center justify-between gap-2 px-1 py-1 border-b border-sidebar-border/40 mb-2">
          <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors">
            <GripHorizontal className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/90">
              GIS Tools
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-sidebar-accent"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-1 overflow-hidden"
            >
              <TooltipProvider delayDuration={100}>
                <Popover
                  open={regionPopoverOpen}
                  onOpenChange={setRegionPopoverOpen}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Navigasi Area</TooltipContent>
                  </Tooltip>
                  <PopoverContent side="right" className="w-40 p-1">
                    <div className="flex flex-col gap-0.5">
                      {REGIONS.map((region) => (
                        <Button
                          key={region.id}
                          variant="ghost"
                          size="sm"
                          className="justify-start text-xs h-7"
                          onClick={() => handleRegionChange(region.id)}
                        >
                          {region.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === "area" ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={enableDrawArea}
                    >
                      <BoxSelect className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Buat Grup Area</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        activeMode === "analyzer" ? "default" : "outline"
                      }
                      size="icon"
                      className="h-9 w-9 border-blue-500/50 hover:bg-blue-500/10 text-blue-600"
                      onClick={enableAnalyzer}
                    >
                      <BrainCircuit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Smart Area Analyzer
                  </TooltipContent>
                </Tooltip>

                <div className="h-px bg-sidebar-border/40 my-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === null ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={clearModes}
                    >
                      <MousePointer2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Mode Seleksi</TooltipContent>
                </Tooltip>

                <div className="h-px bg-sidebar-border/40 my-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === "pole" ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => enableDrawMarker("pole")}
                    >
                      <PoleIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Tambah Tiang</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === "odp" ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => enableDrawMarker("odp")}
                    >
                      <OdpIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Tambah ODP</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={
                        activeMode === "customer" ? "default" : "outline"
                      }
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => enableDrawMarker("customer")}
                    >
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Tambah Lokasi Pelanggan
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === "line" ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={enableDrawLine}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Tarik Kabel</TooltipContent>
                </Tooltip>

                <div className="h-px bg-sidebar-border/40 my-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === "move" ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={toggleDragMode}
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Mode Geser Aset</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === "edit" ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={toggleEditMode}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Mode Edit Geometri
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog
          open={areaDialogPortalOpen}
          onOpenChange={setAreaDialogPortalOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Buat Grup Area Baru</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-xs">
                  Nama
                </Label>
                <Input
                  id="name"
                  value={areaFormData.name}
                  onChange={(e) =>
                    setAreaFormData({ ...areaFormData, name: e.target.value })
                  }
                  className="col-span-3 h-8 text-xs"
                  placeholder="Misal: Area Perumahan X"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right text-xs">
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  value={areaFormData.description}
                  onChange={(e) =>
                    setAreaFormData({
                      ...areaFormData,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3 h-20 text-xs"
                  placeholder="Detail area..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right text-xs">
                  Warna
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={areaFormData.color}
                    onChange={(e) =>
                      setAreaFormData({
                        ...areaFormData,
                        color: e.target.value,
                      })
                    }
                    className="h-8 w-12 p-0 border-none bg-transparent"
                  />
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {areaFormData.color}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAreaDialogPortalOpen(false)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!areaFormData.name) {
                    toast.error("Nama area wajib diisi");
                    return;
                  }
                  const polygon = turf.polygon([
                    [
                      ...newAreaBounds.map((b) => [b[1], b[0]]),
                      [newAreaBounds[0][1], newAreaBounds[0][0]],
                    ],
                  ]);
                  const nodeIds = nodes
                    .filter((node) => {
                      const pt = turf.point([node.lng, node.lat]);
                      return turf.booleanPointInPolygon(pt, polygon);
                    })
                    .map((n) => n.id);

                  await onCreateAreaGroup({
                    ...areaFormData,
                    bounds: newAreaBounds,
                    node_ids: nodeIds,
                  });

                  setAreaDialogPortalOpen(false);
                  setAreaFormData({
                    name: "",
                    description: "",
                    color: "#3B82F6",
                  });
                  setNewAreaBounds([]);
                }}
              >
                Simpan Area
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <GisAnalysisPanel
          isOpen={analysisPanelOpen}
          onClose={() => setAnalysisPanelOpen(false)}
          analysisPolygon={analysisPolygon}
          currentAnalysis={currentAnalysis}
          setCurrentAnalysis={setCurrentAnalysis}
          performSpatialAnalysis={performSpatialAnalysis}
          onAnalysisResults={onAnalysisResults}
          fetchOsmBuildings={fetchOsmBuildings}
          handleBulkSaveNodes={handleBulkSaveNodes}
          handleBulkSaveLinks={handleBulkSaveLinks}
          setDetectedHouses={setDetectedHouses}
          detectedHouses={detectedHouses}
          nodes={nodes}
          generatedRoutes={generatedRoutes}
          setGeneratedRoutes={setGeneratedRoutes}
        />
      </motion.div>
      {generatedRoutes.map((route, i) => (
        <Polyline
          key={`draft-route-${i}`}
          positions={route.path_geometry as [number, number][]}
          pathOptions={{
            color: "#fbbf24",
            weight: 3,
            dashArray: "5, 10",
            opacity: 0.8,
          }}
        >
          <Popup>
            <div className="p-1 text-[10px]">
              <p className="font-bold text-amber-600">
                Draft Cable (AI Suggested)
              </p>
              <p>Length: {route.total_distance_meters?.toFixed(1)}m</p>
              <p>Type: {route.cable_type}</p>
            </div>
          </Popup>
        </Polyline>
      ))}
    </>
  );
}
