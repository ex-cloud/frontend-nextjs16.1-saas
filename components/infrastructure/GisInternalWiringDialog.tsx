import React from "react";
import { Box } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IGisNode } from "@/types/infrastructure";

const FIBER_COLORS = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Orange", color: "#f97316" },
  { name: "Green", color: "#22c55e" },
  { name: "Brown", color: "#78350f" },
  { name: "Slate", color: "#64748b" },
  { name: "White", color: "#ffffff" },
  { name: "Red", color: "#ef4444" },
  { name: "Black", color: "#000000" },
  { name: "Yellow", color: "#eab308" },
  { name: "Violet", color: "#a855f7" },
  { name: "Rose", color: "#ec4899" },
  { name: "Aqua", color: "#06b6d4" },
];

interface InternalWiringDialogProps {
  node: IGisNode | null;
  onClose: () => void;
}

export function GisInternalWiringDialog({
  node,
  onClose,
}: InternalWiringDialogProps) {
  if (!node) return null;

  return (
    <Dialog open={!!node} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-sidebar/95 backdrop-blur-2xl border-sidebar-border shadow-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            Internal Wiring Detail: {node.type} #{node.id}
          </DialogTitle>
          <DialogDescription>
            Detail core management dan port status di dalam box infrastruktur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="p-3 bg-background/50 rounded-lg border border-sidebar-border flex flex-col items-center gap-2"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: FIBER_COLORS[i % 12].color }}
              ></div>
              <div className="text-[10px] text-center">
                <p className="font-bold">Core {i + 1}</p>
                <p className="text-muted-foreground">
                  {FIBER_COLORS[i % 12].name}
                </p>
              </div>
              <div
                className={`mt-1 text-[8px] px-2 rounded-full ${
                  i < (node.metadata?.occupied_ports || 0)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-sidebar-border text-muted-foreground"
                }`}
              >
                {i < (node.metadata?.occupied_ports || 0)
                  ? "CONNECTED"
                  : "IDLE"}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="default">Cetak Label Port</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
