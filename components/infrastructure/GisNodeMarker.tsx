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
  routingPoints: IGisNode[];
  onDelete: (id: number) => void;
  onSelectForRouting: (node: IGisNode) => void;
  onPredictFailure: (id: number) => void;
  onToggleMaintenance: (node: IGisNode) => void;
  onViewInternals: (node: IGisNode) => void;
  onMove: (node: IGisNode, lat: number, lng: number) => Promise<void>;
  isDrawing: boolean;
}

export const GisNodeMarker = React.memo(function GisNodeMarker({
  node,
  show3D,
  canModify,
  routingPoints,
  onDelete,
  onSelectForRouting,
  onPredictFailure,
  onToggleMaintenance,
  onViewInternals,
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
    switch (node.type) {
      case "POLE":
        return poleMarkerIcon;
      case "ODP":
        return odpMarkerIcon;
      case "CUSTOMER":
        return customerMarkerIcon;
      case "ISSUE":
        return issueMarkerIcon;
      default:
        return poleMarkerIcon;
    }
  };

  const isSelectedForRouting = routingPoints.some((n) => n.id === node.id);

  return (
    <Marker
      position={[node.lat, node.lng]}
      icon={getIcon()}
      draggable={canModify && !isDrawing}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          onMove(node, lat, lng);
        },
        dblclick: () => {
          if (canModify) onDelete(node.id);
        },
      }}
    >
      <Popup className="rounded-xl overflow-hidden shadow-2xl border-none">
        <div className="flex flex-col w-[240px]">
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-extrabold text-sm tracking-tight flex items-center gap-2">
              <Layers className="size-4" /> {node.type} ID: {node.id}
            </h3>
            {node.metadata?.status === "MAINTENANCE" && (
              <span className="bg-white/20 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                FIXING
              </span>
            )}
          </div>

          <div className="p-4 space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Lat
                </p>
                <p className="text-xs font-mono font-bold">
                  {node.lat.toFixed(5)}
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Lng
                </p>
                <p className="text-xs font-mono font-bold">
                  {node.lng.toFixed(5)}
                </p>
              </div>
            </div>

            {node.type === "ODP" && (
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-slate-600">
                    Port Capacity
                  </p>
                  <p className="text-xs font-black text-primary">
                    {node.metadata?.occupied_ports || 0}/
                    {node.metadata?.capacity || 16}
                  </p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${((node.metadata?.occupied_ports || 0) / (node.metadata?.capacity || 16)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {node.type === "ODP" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-[10px] h-8 font-bold"
                  onClick={() => onViewInternals(node)}
                >
                  <Wrench className="size-3 mr-2" /> Detail Wiring & Splits
                </Button>
              )}

              <Button
                size="sm"
                variant={isSelectedForRouting ? "secondary" : "default"}
                className={`w-full text-[10px] h-8 font-bold ${isSelectedForRouting ? "bg-amber-100 text-amber-900 border-amber-200" : ""}`}
                onClick={() => onSelectForRouting(node)}
              >
                {isSelectedForRouting
                  ? "Source Selected"
                  : "Select for Auto-Route"}
              </Button>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`flex-1 text-[10px] h-8 font-bold ${node.metadata?.status === "MAINTENANCE" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "text-orange-600 border-orange-100 hover:bg-orange-50"}`}
                  onClick={() => onToggleMaintenance(node)}
                >
                  <ShieldCheck className="size-3 mr-1.5" />
                  {node.metadata?.status === "MAINTENANCE"
                    ? "Resolve"
                    : "Report Fault"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] h-8 font-bold text-blue-600 hover:bg-blue-50"
                  onClick={() => onPredictFailure(node.id)}
                >
                  AI Risk
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Popup>
      <MapTooltip direction="top" opacity={0.9} permanent={false}>
        <div className="px-2 py-1 flex items-center gap-1.5 font-bold text-[10px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${node.type === "ODP" ? "bg-emerald-500" : node.type === "POLE" ? "bg-blue-500" : "bg-orange-500"}`}
          />
          {node.type} #{node.id}
          {node.type === "ODP" && (
            <span className="text-slate-400">
              ({node.metadata?.occupied_ports || 0}/
              {node.metadata?.capacity || 16})
            </span>
          )}
        </div>
      </MapTooltip>
    </Marker>
  );
});
