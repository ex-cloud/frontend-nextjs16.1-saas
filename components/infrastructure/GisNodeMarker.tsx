import React, { useMemo } from "react";
import { Marker, Popup, Tooltip as MapTooltip } from "react-leaflet";
import L from "leaflet";
import { Wrench, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IGisNode } from "@/types/infrastructure";

interface NodeMarkerProps {
  node: IGisNode;
  show3D: boolean;
  canModify: boolean;
  isRoutingMode: boolean;
  routingPoints: IGisNode[];
  onDelete: (id: number) => void;
  onSelectForRouting: (node: IGisNode) => void;
  onUpdatePorts: (node: IGisNode, newOccupied: number) => void;
  onPredictFailure: (id: number) => void;
  onToggleMaintenance: (node: IGisNode) => void;
  onViewInternals: (node: IGisNode) => void;
  onSaveMetadata: (
    node: IGisNode,
    metadata: Record<string, unknown>,
  ) => Promise<void>;
  onMove: (node: IGisNode, lat: number, lng: number) => Promise<void>;
  isDrawing: boolean;
}

export const GisNodeMarker = React.memo(function GisNodeMarker({
  node,
  show3D,
  canModify,
  isRoutingMode,
  routingPoints,
  onDelete,
  onSelectForRouting,
  onUpdatePorts,
  onPredictFailure,
  onToggleMaintenance,
  onViewInternals,
  onSaveMetadata,
  onMove,
  isDrawing,
}: NodeMarkerProps) {
  const poleMarkerIcon = useMemo(() => {
    const transform = show3D
      ? "perspective(100px) rotateX(20deg) scale(1.1)"
      : "none";
    const shadow = show3D ? "0 10px 15px -3px rgb(0 0 0 / 0.3)" : "none";

    return L.divIcon({
      html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white transition-all duration-500 shadow-lg" style="transform: ${transform}; box-shadow: ${shadow}">
               <i class="lucide-tower-control size-3"></i>
             </div>`,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, [show3D]);

  const odpMarkerIcon = useMemo(() => {
    const occupied = node.metadata?.occupied_ports || 0;
    const capacity = node.metadata?.capacity || 16;
    const isFull = occupied >= capacity;
    const bgColor = isFull ? "bg-red-600" : "bg-emerald-600";
    return L.divIcon({
      html: `<div class="w-6 h-6 ${bgColor} rounded-sm border-2 border-white shadow-lg flex items-center justify-center text-white"><i class="lucide-network size-3"></i></div>`,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, [node.metadata?.occupied_ports, node.metadata?.capacity]);

  const customerMarkerIcon = useMemo(
    () =>
      L.divIcon({
        html: '<div class="w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white"><i class="lucide-user size-2"></i></div>',
        className: "custom-div-icon",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    [],
  );

  const issueMarkerIcon = useMemo(
    () =>
      L.divIcon({
        html: '<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white"><i class="lucide-alert-triangle size-3"></i></div>',
        className: "custom-div-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  const getIcon = () => {
    if (node.type === "POLE") return poleMarkerIcon;
    if (node.type === "CUSTOMER") return customerMarkerIcon;
    if (node.type === "ISSUE") return issueMarkerIcon;
    return odpMarkerIcon;
  };

  return (
    <Marker
      position={[node.lat, node.lng]}
      icon={getIcon()}
      interactive={!isDrawing}
      draggable={canModify && !isDrawing}
      eventHandlers={{
        dblclick: () => canModify && onDelete(node.id),
        click: () => {
          if (isRoutingMode) {
            onSelectForRouting(node);
          }
        },
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onMove(node, position.lat, position.lng);
        },
      }}
    >
      {isRoutingMode && routingPoints.find((p) => p.id === node.id) && (
        <MapTooltip permanent direction="top">
          <div className="bg-purple-600 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
            Check Point {routingPoints.findIndex((p) => p.id === node.id) + 1}
          </div>
        </MapTooltip>
      )}

      {node.metadata?.status === "MAINTENANCE" && (
        <MapTooltip
          permanent
          direction="top"
          className="bg-transparent border-none shadow-none p-0"
        >
          <div className="animate-pulse bg-orange-500 p-1 rounded-full border-2 border-white shadow-lg -mt-10 mr-10 relative z-[2000]">
            <Wrench className="size-3 text-white" />
          </div>
        </MapTooltip>
      )}

      <Popup>
        <div className="p-1 min-w-[150px] space-y-2">
          <h4 className="font-bold border-b pb-1 text-primary flex items-center justify-between">
            <span>
              {node.type} #{node.id}
            </span>
            {node.metadata?.status === "MAINTENANCE" && (
              <span className="bg-orange-100 text-orange-600 text-[8px] px-1 rounded animate-pulse">
                FAULTY
              </span>
            )}
          </h4>
          <div className="text-[10px] space-y-1">
            <p>
              <b>Lng:</b> {node.lng.toFixed(6)}
            </p>

            <div className="pt-2 space-y-2 border-t">
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground uppercase font-bold">
                  Nama Aset
                </label>
                <input
                  type="text"
                  defaultValue={(node.metadata?.name as string) || ""}
                  placeholder="Contoh: ODP-JKT-01"
                  className="w-full text-[10px] px-1.5 py-1 bg-background border rounded outline-none focus:ring-1 focus:ring-primary"
                  onBlur={(e) =>
                    onSaveMetadata(node, {
                      ...node.metadata,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground uppercase font-bold">
                  Deskripsi / Lokasi
                </label>
                <textarea
                  defaultValue={(node.metadata?.description as string) || ""}
                  placeholder="Detail lokasi..."
                  rows={2}
                  className="w-full text-[10px] px-1.5 py-1 bg-background border rounded outline-none focus:ring-1 focus:ring-primary resize-none"
                  onBlur={(e) =>
                    onSaveMetadata(node, {
                      ...node.metadata,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="pt-2 border-t flex flex-col gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-6 text-[10px] w-full"
                onClick={() => onViewInternals(node)}
              >
                <Layers className="size-2 mr-1" /> View Internals
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] w-full border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => onPredictFailure(node.id)}
              >
                <ShieldCheck className="size-2 mr-1" /> AI Health Check
              </Button>
              <Button
                variant={
                  node.metadata?.status === "MAINTENANCE"
                    ? "default"
                    : "outline"
                }
                size="sm"
                disabled={!canModify}
                className="h-6 text-[10px] w-full"
                onClick={() => onToggleMaintenance(node)}
              >
                {node.metadata?.status === "MAINTENANCE"
                  ? "Selesaikan Perbaikan"
                  : "Lapor Kerusakan"}
              </Button>
            </div>

            {node.metadata?.status === "MAINTENANCE" && (
              <div className="mt-2 p-1.5 bg-orange-50 border border-orange-200 rounded text-[9px] text-orange-700 animate-in fade-in zoom-in">
                <p className="font-bold flex items-center gap-1">
                  <Wrench className="size-2" /> PSM Work Order
                </p>
                <p>Teknisi ditugaskan untuk memperbaiki {node.type} ini.</p>
              </div>
            )}

            {node.type === "ODP" && (
              <div className="pt-2 border-t mt-2">
                <p className="font-semibold mb-1 text-[9px]">Manajemen Port:</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">
                    {node.metadata?.occupied_ports || 0} /{" "}
                    {node.metadata?.capacity || 16}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-5 w-5"
                      disabled={
                        !canModify || (node.metadata?.occupied_ports || 0) <= 0
                      }
                      onClick={() =>
                        onUpdatePorts(
                          node,
                          (node.metadata?.occupied_ports || 0) - 1,
                        )
                      }
                    >
                      -
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-5 w-5"
                      disabled={
                        !canModify ||
                        (node.metadata?.occupied_ports || 0) >=
                          (node.metadata?.capacity || 16)
                      }
                      onClick={() =>
                        onUpdatePorts(
                          node,
                          (node.metadata?.occupied_ports || 0) + 1,
                        )
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});
