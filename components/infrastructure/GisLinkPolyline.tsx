import React, { useCallback } from "react";
import { Polyline, Popup, Tooltip as MapTooltip } from "react-leaflet";
import { IGisLink } from "@/types/infrastructure";

interface LinkPolylineProps {
  link: IGisLink;
  selectedLinkId: number | null;
  showLinkBudget: boolean;
  onSelect: (link: IGisLink) => void;
  onSaveMetadata?: (
    link: IGisLink,
    metadata: Record<string, unknown>,
  ) => Promise<void>;
}

export function GisLinkPolyline({
  link,
  selectedLinkId,
  showLinkBudget,
  onSelect,
  onSaveMetadata,
}: LinkPolylineProps) {
  const getLinkColorByLoss = useCallback(
    (distanceMeters: number): string => {
      if (!showLinkBudget) return "#3b82f6"; // Default Blue

      // Check if we have backend calculation, otherwise fallback to frontend estimate
      const loss = link.metadata?.link_budget?.estimated_loss_db;
      if (loss !== undefined) {
        if (loss > 2.0) return "#ef4444"; // Red (High Loss > 2dB)
        if (loss > 1.0) return "#f59e0b"; // Amber (Warning > 1dB)
        return "#10b981"; // Green (Healthy < 1dB)
      }

      const distanceKm = distanceMeters / 1000;
      const estLoss = distanceKm * 0.35 + Math.floor(distanceKm / 2) * 0.1;
      if (estLoss > 2.0) return "#ef4444";
      if (estLoss > 1.0) return "#f59e0b";
      return "#10b981";
    },
    [showLinkBudget, link.metadata?.link_budget],
  );

  return (
    <Polyline
      positions={link.path_geometry}
      color={getLinkColorByLoss(link.total_distance_meters)}
      weight={selectedLinkId === link.id ? 8 : 4}
      opacity={selectedLinkId === link.id ? 1 : 0.8}
      pathOptions={{ lineJoin: "round" }}
      eventHandlers={{
        click: () => onSelect(link),
      }}
    >
      <Popup>
        <div className="p-1 text-xs">
          <p className="font-bold border-b pb-1 mb-1 text-primary">
            Link Fiber Trace
          </p>
          <div className="space-y-1 mt-1">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Jarak:</span>
              <span className="font-semibold">
                {(link.total_distance_meters / 1000).toFixed(2)} KM
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">dB Loss:</span>
              <span className="text-blue-600 font-bold uppercase tracking-tight">
                {link.metadata?.link_budget?.estimated_loss_db ||
                  ((link.total_distance_meters / 1000) * 0.35).toFixed(2)}{" "}
                dB
              </span>
            </p>
            {onSaveMetadata && (
              <div className="pt-1 space-y-1">
                <label className="text-[9px] text-muted-foreground uppercase font-bold">
                  Tipe Kabel
                </label>
                <select
                  defaultValue={link.cable_type || "24C"}
                  className="w-full text-[10px] px-1 py-0.5 bg-background border rounded outline-none focus:ring-1 focus:ring-primary"
                  onChange={(e) =>
                    onSaveMetadata(link, {
                      ...link.metadata,
                      cable_type: e.target.value,
                    })
                  }
                >
                  <option value="12C">12 Core</option>
                  <option value="24C">24 Core</option>
                  <option value="48C">48 Core</option>
                  <option value="96C">96 Core</option>
                  <option value="288C">288 Core</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </Popup>

      {showLinkBudget && (
        <MapTooltip
          permanent
          direction="center"
          className="bg-transparent border-none shadow-none font-bold text-[10px] text-blue-700 drop-shadow-md"
        >
          {link.metadata?.link_budget?.estimated_loss_db ||
            ((link.total_distance_meters / 1000) * 0.35).toFixed(2)}{" "}
          dB
        </MapTooltip>
      )}
    </Polyline>
  );
}
