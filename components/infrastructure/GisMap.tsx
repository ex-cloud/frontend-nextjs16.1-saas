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
} from "react-leaflet";
import { useSession } from "next-auth/react";
import * as turf from "@turf/turf";
import { toast } from "sonner";
import L from "leaflet";
import { Button } from "@/components/ui/button";

// Leaflet CSS
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

// Shared Types & Hooks
import { IGisNode, IGisLink, NodeType } from "@/types/infrastructure";
import { useGisTopology } from "@/hooks/useGisTopology";

// Modular Components
import { GisMapControls } from "./GisMapControls";
import { GisNodeMarker } from "./GisNodeMarker";
import { GisLinkPolyline } from "./GisLinkPolyline";
import { GisOverlayPanels } from "./GisOverlayPanels";
import { GisInternalWiringDialog } from "./GisInternalWiringDialog";

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

export default function GisMap() {
  const { data: session } = useSession() as { data: UserSession | null };
  const userRoles = session?.user?.roles || [];
  const canModify = userRoles.some((role) =>
    ["Super Admin", "Admin", "Network Engineer"].includes(role),
  );

  // Core Topology Logic
  const {
    nodes,
    links,
    areaGroups,
    loading,
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
    standards,
  } = useGisTopology(session?.user?.email);

  // UI Toggle States
  const [showCoverage, setShowCoverage] = useState(false);
  const [showLinkBudget, setShowLinkBudget] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showAreas, setShowAreas] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState<Set<NodeType>>(
    new Set(["POLE", "ODP", "CUSTOMER"]),
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
        center={[-6.2088, 106.8456]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <LayersControl position="bottomright">
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
        />
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

      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
