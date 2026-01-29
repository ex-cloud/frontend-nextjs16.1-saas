"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  Marker,
  Popup,
  LayersControl,
  Polygon,
<<<<<<< HEAD
  useMapEvents,
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
} from "react-leaflet";
import { useSession } from "next-auth/react";
import * as turf from "@turf/turf";
import { toast } from "sonner";
import L from "leaflet";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { BrainCircuit } from "lucide-react";
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb

// Leaflet CSS
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

// Shared Types & Hooks
<<<<<<< HEAD
import {
  IGisNode,
  IGisLink,
  NodeType,
  INetworkStandard,
  ISpatialAnalysisResult,
} from "@/types/infrastructure";
=======
import { IGisNode, IGisLink, NodeType } from "@/types/infrastructure";
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
import { useGisTopology } from "@/hooks/useGisTopology";

// Modular Components
import { GisMapControls } from "./GisMapControls";
import { GisNodeMarker } from "./GisNodeMarker";
import { GisLinkPolyline } from "./GisLinkPolyline";
import { GisOverlayPanels } from "./GisOverlayPanels";
import { GisInternalWiringDialog } from "./GisInternalWiringDialog";
<<<<<<< HEAD
import { GisContextMenu } from "./GisContextMenu";
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb

// Fix Leaflet Icons
// @ts-expect-error - Leaflet icon internal fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface UserSession {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
    permissions?: string[];
    accessToken?: string;
  };
}

<<<<<<< HEAD
// Helper component to handle map events
function MapEvents({
  onContextMenu,
  onBoundsChange,
}: {
  onContextMenu: (e: L.LeafletMouseEvent) => void;
  onBoundsChange: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}) {
  const map = useMapEvents({
    contextmenu: (e) => {
      onContextMenu(e);
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
      }
    },
    moveend: () => {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
      // Save center and zoom
      localStorage.setItem(
        "gis_last_view",
        JSON.stringify({
          center: [map.getCenter().lat, map.getCenter().lng],
          zoom: map.getZoom(),
        }),
      );
    },
  });
  return null;
}

=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
export default function GisMap() {
  const { data: session } = useSession() as { data: UserSession | null };
  const userRoles = session?.user?.roles || [];
  const canModify = userRoles.some((role) =>
    ["Super Admin", "Admin", "Network Engineer"].includes(role),
  );

<<<<<<< HEAD
  // Intelligence & Analysis States
  const [detectedHouses, setDetectedHouses] = useState<Partial<IGisNode>[]>([]);
  const [suggestedOdpPoints, setSuggestedOdpPoints] = useState<
    [number, number][]
  >([]);
  const [analysisPolygon, setAnalysisPolygon] = useState<
    [number, number][] | null
  >(null);
  const [contextMenu, setContextMenu] = useState<{
    latlng: [number, number];
    visible: boolean;
    areaId?: number;
    bounds?: [number, number][];
  }>({ latlng: [0, 0], visible: false });

=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
  // Core Topology Logic
  const {
    nodes,
    links,
    areaGroups,
    loading,
<<<<<<< HEAD
    isSyncing,
    fetchData,
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
    handleAddNode,
    handleAddLink,
    handleDeleteNode,
    handleUpdateNodePorts,
    handlePredictFailure,
    handleToggleMaintenance,
    handleSaveMetadata,
    handleMoveNode,
    handleCreateAreaGroup,
    handleDeleteAreaGroup,
<<<<<<< HEAD
    handleBulkSaveNodes,
    handleBulkSaveLinks,
    fetchOsmBuildings,
    performSpatialAnalysis,
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
    standards,
  } = useGisTopology(session?.user?.email);

  // UI Toggle States
  const [showCoverage, setShowCoverage] = useState(false);
  const [showLinkBudget, setShowLinkBudget] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAreas, setShowAreas] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState<Set<NodeType>>(
<<<<<<< HEAD
    new Set(["POLE", "ODP", "CUSTOMER", "ISSUE"]),
=======
    new Set(["POLE", "ODP", "CUSTOMER"]),
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
  );
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routingPoints, setRoutingPoints] = useState<IGisNode[]>([]);
  const [autoRoute, setAutoRoute] = useState<[number, number][] | null>(null);

  // OTDR & Selection States
  const [selectedLink, setSelectedLink] = useState<IGisLink | null>(null);
  const [otdrDistanceKm, setOtdrDistanceKm] = useState<string>("");
  const [otdrFaultMarker, setOtdrFaultMarker] = useState<
    [number, number] | null
  >(null);
  const [internalViewNode, setInternalViewNode] = useState<IGisNode | null>(
    null,
  );

  // Drawing Mode State (Lifted for Marker Interactivity Control)
  const [activeMode, setActiveMode] = useState<string | null>(null);

  // --- Handlers ---

<<<<<<< HEAD
  // Debounce fetchData to prevent spamming during map movement
  const fetchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleBoundsChange = useCallback(
    (b: { north: number; south: number; east: number; west: number }) => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = setTimeout(() => {
        fetchData(b);
      }, 400); // 400ms debounce
    },
    [fetchData],
  );

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, []);

=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
  const findFaultLocation = useCallback(() => {
    if (!selectedLink || !otdrDistanceKm) return;
    try {
      const distance = parseFloat(otdrDistanceKm);
      const line = turf.lineString(
        selectedLink.path_geometry.map((p) => [p[1], p[0]]),
      );
      const point = turf.along(line, distance, { units: "kilometers" });
      const coords = point.geometry.coordinates;
      setOtdrFaultMarker([coords[1], coords[0]]);
      toast.info(`Lokasi fault ditemukan pada ${distance} KM`);
    } catch {
      toast.error("Format jarak tidak valid");
    }
  }, [selectedLink, otdrDistanceKm]);

  const findOptimalRoute = useCallback(() => {
    if (routingPoints.length < 2) return;
    try {
      const start = [routingPoints[0].lng, routingPoints[0].lat];
      const end = [routingPoints[1].lng, routingPoints[1].lat];
      const line = turf.lineString([start, end]);
      const curved = turf.bezierSpline(line);
      const coords = curved.geometry.coordinates.map(
        (c) => [c[1], c[0]] as [number, number],
      );
      setAutoRoute(coords);
      toast.success("Rute optimal berhasil dihitung");
    } catch {
      toast.error("Gagal menghitung rute");
    }
  }, [routingPoints]);

  const toggleLayer = useCallback((type: NodeType) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const heatmapLayer = useMemo(() => {
    if (!showHeatmap || nodes.length === 0) return null;
    try {
      const customers = nodes.filter((n) => n.type === "CUSTOMER");
      if (customers.length === 0) return null;
      const points = turf.featureCollection(
        customers.map((c) => turf.point([c.lng, c.lat])),
      );
      const bbox = turf.bbox(points);
      const cellSide = 0.5;
      const grid = turf.collect(
        turf.squareGrid(bbox, cellSide, { units: "kilometers" }),
        points,
        "id",
        "values",
      );

      return grid.features
        .filter((f) => f.properties?.values?.length > 0)
        .map((feature, i) => {
          const count = feature.properties?.values.length || 0;
          const color =
            count > 3 ? "#ef4444" : count > 1 ? "#f59e0b" : "#10b981";
          const geometry = feature.geometry as {
            type: string;
            coordinates: number[][][];
          };
          const coords = geometry.coordinates[0].map((c: number[]) => [
            c[1],
            c[0],
          ]) as [number, number][];
          return (
            <Polyline
              key={`grid-${i}`}
              positions={coords}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: Math.min(count * 0.2, 0.6),
                weight: 1,
                fill: true,
              }}
            />
          );
        });
    } catch {
      return null;
    }
  }, [showHeatmap, nodes]);

  return (
    <div className="relative h-[750px] w-full bg-sidebar-muted group overflow-hidden rounded-xl border border-sidebar-border shadow-inner">
      <MapContainer
<<<<<<< HEAD
        center={(() => {
          const saved = localStorage.getItem("gis_last_view");
          if (saved) {
            try {
              return JSON.parse(saved).center;
            } catch {
              return [-6.9147, 107.6098]; // Bandung
            }
          }
          return [-6.9147, 107.6098]; // Bandung Default
        })()}
        zoom={(() => {
          const saved = localStorage.getItem("gis_last_view");
          if (saved) {
            try {
              return JSON.parse(saved).zoom;
            } catch {
              return 13;
            }
          }
          return 13;
        })()}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        preferCanvas={true}
      >
        <LayersControl position="bottomright">
          <MapEvents
            onContextMenu={(e) => {
              setContextMenu({
                latlng: [e.latlng.lat, e.latlng.lng],
                visible: true,
                bounds: undefined,
                areaId: undefined,
              });
            }}
            onBoundsChange={handleBoundsChange}
          />
=======
        center={[-6.2088, 106.8456]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <LayersControl position="bottomright">
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
          <LayersControl.BaseLayer checked name="OpenStreetMap (Street)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Esri (Satellite)">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="CartoDB (Dark)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <GisMapControls
          onNodeAdded={handleAddNode}
          onLinkAdded={handleAddLink}
          canModify={canModify}
          nodes={nodes}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          onClearSelection={() => {
            setSelectedLink(null);
            setRoutingPoints([]);
            setAutoRoute(null);
            setOtdrFaultMarker(null);
            setOtdrDistanceKm("");
          }}
          onCreateAreaGroup={handleCreateAreaGroup}
          standards={standards}
<<<<<<< HEAD
          performSpatialAnalysis={performSpatialAnalysis}
          onAnalysisResults={(results: ISpatialAnalysisResult | null) => {
            if (results) {
              setSuggestedOdpPoints(results.suggestions);
            } else {
              setSuggestedOdpPoints([]);
              setDetectedHouses([]);
              setAnalysisPolygon(null);
            }
          }}
          fetchOsmBuildings={fetchOsmBuildings}
          handleBulkSaveNodes={handleBulkSaveNodes}
          handleBulkSaveLinks={handleBulkSaveLinks}
          setDetectedHouses={setDetectedHouses}
          detectedHouses={detectedHouses}
          analysisPolygon={analysisPolygon}
          setAnalysisPolygon={setAnalysisPolygon}
        />

        {/* Custom Context Menu */}
        {contextMenu.visible && (
          <GisContextMenu
            position={contextMenu.latlng}
            onClose={() =>
              setContextMenu((prev) => ({ ...prev, visible: false }))
            }
            areaId={contextMenu.areaId}
            areaPolygon={contextMenu.bounds}
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
            showCoverage={showCoverage}
            setShowCoverage={setShowCoverage}
            onDetectBuildings={async (polygon) => {
              const buildings = await fetchOsmBuildings(polygon);
              if (buildings && buildings.length > 0) {
                setDetectedHouses(buildings);
                toast.success(
                  `${buildings.length} bangunan baru terdeteksi di area ini!`,
                  {
                    description:
                      "Anda sekarang bisa melakukan 'Auto-Pin' dari Analysis Panel atau klik marker satu per satu.",
                    id: "osm-detect",
                  },
                );
              } else {
                toast.info(
                  "Tidak ada bangunan baru yang terdeteksi di area koordinat ini.",
                  {
                    description:
                      "Coba area lain atau pastikan layer OpenStreetMap memiliki data bangunan di sini.",
                    id: "osm-detect",
                  },
                );
              }
            }}
            onPlaceODP={(pos) => {
              const odpStandards = (standards.odp as INetworkStandard[])?.find(
                (s) => s.config_key === "odp_standards",
              );
              const defaultCapacity =
                (odpStandards?.config_value?.default_capacity as number) || 16;

              handleAddNode({
                lat: pos[0],
                lng: pos[1],
                type: "ODP",
                metadata: {
                  capacity: defaultCapacity,
                  occupied_ports: 0,
                  status: "ACTIVE",
                },
              });
            }}
            onMarkIssue={(pos) => {
              handleAddNode({
                lat: pos[0],
                lng: pos[1],
                type: "ISSUE",
                metadata: {
                  status: "FAULTY",
                  reported_at: new Date().toISOString(),
                  issue_type: "FIELD_REPORT",
                },
              });
            }}
            onAnalyze={() => {
              // Create a polygon from bounds or generate a small area around click point
              let polygon: [number, number][];
              if (contextMenu.bounds && contextMenu.bounds.length >= 3) {
                polygon = contextMenu.bounds;
              } else {
                // Generate a small polygon (approx 100m x 100m) around the click point
                const lat = contextMenu.latlng[0];
                const lng = contextMenu.latlng[1];
                const offset = 0.0005; // ~50 meters
                polygon = [
                  [lat - offset, lng - offset],
                  [lat + offset, lng - offset],
                  [lat + offset, lng + offset],
                  [lat - offset, lng + offset],
                ];
              }

              setActiveMode("analyzer");
              setAnalysisPolygon(polygon);

              // Run spatial analysis immediately
              const results = performSpatialAnalysis(polygon);
              if (results?.suggestions?.length) {
                setSuggestedOdpPoints(results.suggestions);
              }
            }}
            onDelete={() => {
              if (contextMenu.areaId) handleDeleteAreaGroup(contextMenu.areaId);
            }}
            detectedHousesCount={detectedHouses.length}
            onAutoPinDetected={async () => {
              if (detectedHouses.length > 0) {
                const results = await handleBulkSaveNodes(detectedHouses);
                if (results && results.length > 0) {
                  setDetectedHouses([]);
                  toast.success(
                    `${results.length} rumah berhasil disimpan ke database!`,
                  );
                }
              }
            }}
          />
        )}
=======
        />
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
        {showAreas &&
          areaGroups.map((group) =>
            group.bounds ? (
              <Polygon
                key={`area-${group.id}`}
                positions={group.bounds as [number, number][]}
                pathOptions={{
                  color: group.color,
                  fillColor: group.color,
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: "5, 5",
                }}
<<<<<<< HEAD
                eventHandlers={{
                  contextmenu: (e) => {
                    L.DomEvent.stopPropagation(e);
                    // Prevent default browser context menu
                    if (e.originalEvent) {
                      e.originalEvent.preventDefault();
                    }
                    setContextMenu({
                      latlng: [e.latlng.lat, e.latlng.lng],
                      visible: true,
                      areaId: group.id,
                      bounds: group.bounds as [number, number][],
                    });
                  },
                }}
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
              >
                <Popup>
                  <div className="p-1">
                    <h3
                      className="font-bold text-sm"
                      style={{ color: group.color }}
                    >
                      {group.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {group.description || "Tidak ada deskripsi"}
                    </p>
                    <div className="mt-2 pt-2 border-t flex flex-col gap-1 text-[10px]">
                      <span>Nodes: {group.node_count}</span>
                      <Button
<<<<<<< HEAD
                        variant="default"
                        size="sm"
                        className="h-6 text-[10px] mt-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          const results = performSpatialAnalysis(
                            group.bounds as [number, number][],
                          );
                          if (results) {
                            setSuggestedOdpPoints(results.suggestions);
                            toast.success(
                              `Analisa Berhasil: ${results.counts.CUSTOMER} Rumah terdeteksi`,
                            );
                          }
                        }}
                      >
                        <BrainCircuit className="h-3 w-3 mr-1" />
                        Smart Analyze Area
                      </Button>
                      <Button
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
                        variant="destructive"
                        size="sm"
                        className="h-6 text-[10px] mt-1"
                        onClick={() => handleDeleteAreaGroup(group.id)}
                      >
                        Hapus Area
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ) : null,
          )}
        {heatmapLayer}
        {autoRoute && (
          <Polyline
            positions={autoRoute}
            color="#8b5cf6"
            weight={6}
            dashArray="10, 10"
            className="animate-pulse"
          >
            <Popup>
              <b>Auto-Suggested Route</b>
              <br />
              Gunakan rute ini untuk efisiensi penarikan kabel.
            </Popup>
          </Polyline>
        )}
<<<<<<< HEAD
        {/* Render Detected Houses (DRAFT) - Wrapped in Fragment for better keying */}
        {useMemo(
          () => (
            <>
              {detectedHouses.map((house, i) => (
                <Marker
                  key={`draft-house-${i}-${house.lat}-${house.lng}`}
                  position={[house.lat!, house.lng!]}
                  icon={L.divIcon({
                    html: `
                    <div class="relative w-6 h-6 animate-in zoom-in duration-300">
                      <div class="absolute inset-0 bg-orange-500/20 rounded-full animate-pulse"></div>
                      <div class="absolute inset-1 bg-orange-600 rounded-full border border-white shadow-sm flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </div>
                    </div>
                  `,
                    className: "draft-house-icon",
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="text-xs font-bold text-orange-600 mb-1">
                        Rumah Terdeteksi (Draft)
                      </p>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        Beliau terdeteksi lewat satelit namun belum masuk
                        database.
                      </p>
                      <Button
                        size="sm"
                        className="h-7 w-full text-[10px] bg-orange-600"
                        onClick={async () => {
                          const saved = await handleAddNode({
                            type: "CUSTOMER",
                            lat: house.lat!,
                            lng: house.lng!,
                            metadata: house.metadata,
                          });
                          if (saved) {
                            setDetectedHouses((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            );
                          }
                        }}
                      >
                        Pin Rumah Ini
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          ),
          [detectedHouses, handleAddNode],
        )}

        {suggestedOdpPoints.map((pos, i) => (
          <Marker
            key={`suggested-odp-${i}`}
            position={pos}
            icon={L.divIcon({
              html: `
                <div class="relative w-8 h-8">
                  <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
                  <div class="absolute inset-0 bg-blue-500/80 backdrop-blur-sm rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-network"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>
                  </div>
                </div>
              `,
              className: "suggested-odp-wrapper",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-blue-600 text-xs text-center">
                  💡 AI Recommendation
                </h4>
                <p className="text-[10px] text-center mt-1">
                  Optimal ODP placement based on customer clusters.
                </p>
                <Button
                  size="sm"
                  variant="default"
                  className="w-full h-7 text-[10px] mt-2 bg-blue-600"
                  onClick={() => {
                    const odpStandards = (
                      standards.odp as INetworkStandard[]
                    )?.find((s) => s.config_key === "odp_standards");
                    const defaultCapacity =
                      (odpStandards?.config_value
                        ?.default_capacity as number) || 16;

                    handleAddNode({
                      lat: pos[0],
                      lng: pos[1],
                      type: "ODP",
                      metadata: {
                        capacity: defaultCapacity,
                        occupied_ports: 0,
                      },
                    });
                    setSuggestedOdpPoints((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    );
                  }}
                >
                  Approve & Place ODP
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
=======
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
        {nodes
          .filter((node) => visibleLayers.has(node.type))
          .map((node) => (
            <React.Fragment key={node.id}>
              {showCoverage && node.type === "ODP" && (
                <Circle
                  center={[node.lat, node.lng]}
                  radius={150}
                  pathOptions={{
                    color: "#10b981",
                    fillColor: "#10b981",
                    fillOpacity: 0.1,
                    weight: 1,
                    dashArray: "5, 5",
                  }}
                />
              )}
              <GisNodeMarker
                node={node}
                show3D={show3D}
                canModify={canModify}
                isRoutingMode={isRoutingMode}
                routingPoints={routingPoints}
                onDelete={handleDeleteNode}
                onSelectForRouting={(n) =>
                  setRoutingPoints((prev) =>
                    prev.length >= 2 ? [n] : [...prev, n],
                  )
                }
                onUpdatePorts={handleUpdateNodePorts}
                onPredictFailure={handlePredictFailure}
                onToggleMaintenance={handleToggleMaintenance}
                onViewInternals={setInternalViewNode}
                onSaveMetadata={(node, metadata) =>
                  handleSaveMetadata(node, metadata, "node")
                }
                onMove={handleMoveNode}
                isDrawing={!!activeMode}
              />
            </React.Fragment>
          ))}
        {links.map((link) => (
          <GisLinkPolyline
            key={link.id}
            link={link}
            selectedLinkId={selectedLink?.id || null}
            showLinkBudget={showLinkBudget}
            onSelect={(l) => {
              setSelectedLink(l);
              setOtdrFaultMarker(null);
              setOtdrDistanceKm("");
            }}
            onSaveMetadata={(link, metadata) =>
              handleSaveMetadata(link, metadata, "link")
            }
          />
        ))}
        {otdrFaultMarker && (
          <Marker
            position={otdrFaultMarker}
            icon={L.divIcon({
              html: '<div class="w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white animate-bounce"><i class="lucide-alert-triangle size-4"></i></div>',
              className: "custom-fault-icon",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup className="rounded-xl overflow-hidden shadow-2xl border-none">
              <div className="p-2 bg-red-50 text-red-900">
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  ⚠️ POTENSI CABLE CUT
                </h4>
                <p className="text-[10px] mt-1">
                  Fault terdeteksi pada jarak <b>{otdrDistanceKm} KM</b>.
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

<<<<<<< HEAD
      {loading && !nodes.length && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-background/40 backdrop-blur-md">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full"></div>
          </div>
          <p className="mt-4 text-sm font-bold animate-pulse">
            Initializing GIS Topology...
          </p>
        </div>
      )}

      {isSyncing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sidebar/80 backdrop-blur-xl border border-sidebar-border rounded-full shadow-lg">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
              Refining Topology Area...
            </span>
          </div>
=======
      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
        </div>
      )}

      <GisOverlayPanels
        nodes={nodes}
        selectedLink={selectedLink}
        showCoverage={showCoverage}
        showLinkBudget={showLinkBudget}
        show3D={show3D}
        isRoutingMode={isRoutingMode}
        showHeatmap={showHeatmap}
        showAreas={showAreas}
        visibleLayers={visibleLayers}
        routingPoints={routingPoints}
        otdrDistanceKm={otdrDistanceKm}
        otdrFaultMarker={otdrFaultMarker}
        onToggleCoverage={() => setShowCoverage(!showCoverage)}
        onToggleLinkBudget={() => setShowLinkBudget(!showLinkBudget)}
        onToggle3D={() => setShow3D(!show3D)}
        onToggleRouting={() => {
          setIsRoutingMode(!isRoutingMode);
          setRoutingPoints([]);
          setAutoRoute(null);
        }}
        onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
        onToggleAreas={() => setShowAreas(!showAreas)}
        onToggleLayer={toggleLayer}
        onFindOptimalRoute={findOptimalRoute}
        onCloseOtdr={() => {
          setSelectedLink(null);
          setOtdrFaultMarker(null);
        }}
        onOtdrDistanceChange={setOtdrDistanceKm}
        onFindFaultLocation={findFaultLocation}
      />

      <GisInternalWiringDialog
        node={internalViewNode}
        onClose={() => setInternalViewNode(null)}
      />
    </div>
  );
}
