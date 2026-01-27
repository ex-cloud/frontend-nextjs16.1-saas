import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { createEcho } from "@/lib/echo";
import {
  IGisNode,
  IGisLink,
  IAreaGroup,
  INetworkStandard,
} from "@/types/infrastructure";

interface GisUpdateEvent {
  action:
    | "node_created"
    | "node_updated"
    | "node_deleted"
    | "link_created"
    | "link_updated"
    | "link_deleted";
  data: IGisNode | IGisLink | { id: number };
  userId?: number | string;
}

interface NetworkConfigUpdateEvent {
  category: string;
  config: INetworkStandard & { deleted_key?: string };
}

export function useGisTopology(currentUserId?: string | null) {
  const [nodes, setNodes] = useState<IGisNode[]>([]);
  const [links, setLinks] = useState<IGisLink[]>([]);
  const [areaGroups, setAreaGroups] = useState<IAreaGroup[]>([]);
  const [standards, setStandards] = useState<
    Record<string, INetworkStandard[] | INetworkStandard>
  >({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(
    async (bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    }) => {
      try {
        setLoading(true);
        const query = bounds || {
          north: -6.1,
          south: -6.4,
          east: 106.9,
          west: 106.7,
        };
        const response = await api.get<{
          status: string;
          data: { nodes: IGisNode[]; links: IGisLink[] };
        }>("/gis/area", { params: query });
        if (response.data.status === "success") {
          setNodes(response.data.data.nodes);
          setLinks(response.data.data.links);
        }

        // Fetch area groups
        const areasResponse = await api.get<{
          success: boolean;
          data: IAreaGroup[];
        }>("/gis/area-groups");
        if (areasResponse.data.success) {
          setAreaGroups(areasResponse.data.data);
        }

        // Fetch network standards (Grouped by category)
        const standardsResponse = await api.get<{
          success: boolean;
          data: Record<string, INetworkStandard[]>;
        }>("/gis/config");
        if (standardsResponse.data.success) {
          setStandards(standardsResponse.data.data);
        }
      } catch (error) {
        console.error("GIS Sync Error:", error);
        toast.error("Gagal sinkronisasi data peta");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket Integration
  useEffect(() => {
    const setupEcho = async () => {
      const echo = await createEcho();
      if (!echo) return;

      echo
        .channel("infrastructure-gis")
        .listen(
          ".App\\Events\\Infrastructure\\GisDataUpdated",
          (e: GisUpdateEvent) => {
            const { action, data } = e;

            if (action === "node_created" || action === "node_updated") {
              const node = data as IGisNode;
              setNodes((prev) => {
                const exists = prev.find((n) => n.id === node.id);
                if (exists) {
                  return prev.map((n) => (n.id === node.id ? node : n));
                }
                return [...prev, node];
              });

              // Only show toast for other users' actions
              if (
                currentUserId &&
                e.userId &&
                String(e.userId).toLowerCase() !==
                  String(currentUserId).toLowerCase()
              ) {
                toast.info(`Update: ${node.type} #${node.id} diperbarui`);
              }
            } else if (action === "node_deleted") {
              const id = (data as { id: number }).id;
              setNodes((prev) => prev.filter((n) => n.id !== id));
            } else if (action === "link_created" || action === "link_updated") {
              const link = data as IGisLink;
              setLinks((prev) => {
                const exists = prev.find((l) => l.id === link.id);
                if (exists) {
                  return prev.map((l) => (l.id === link.id ? link : l));
                }
                return [...prev, link];
              });
            } else if (action === "link_deleted") {
              const id = (data as { id: number }).id;
              setLinks((prev) => prev.filter((l) => l.id !== id));
            }
          },
        )
        .listen(".NetworkConfigUpdated", (e: NetworkConfigUpdateEvent) => {
          setStandards((prev) => {
            const category = e.category;
            const currentItems = (prev[category] as INetworkStandard[]) || [];

            // Handle deletion
            if (e.config.deleted_key) {
              return {
                ...prev,
                [category]: currentItems.filter(
                  (c) => c.config_key !== e.config.deleted_key,
                ),
              };
            }

            // Handle update/create
            const exists = currentItems.find(
              (c) => c.config_key === e.config.config_key,
            );
            const updatedItems = exists
              ? currentItems.map((c) =>
                  c.config_key === e.config.config_key ? e.config : c,
                )
              : [...currentItems, e.config];

            return {
              ...prev,
              [category]: updatedItems,
            };
          });

          toast.info(
            `Standar ${e.category.toUpperCase()} telah diperbarui secara real-time`,
          );
        });
    };

    setupEcho();

    return () => {
      createEcho().then((echo) => {
        echo?.leaveChannel("infrastructure-gis");
      });
    };
  }, [currentUserId]);

  const handleAddNode = useCallback(async (nodeData: Omit<IGisNode, "id">) => {
    try {
      const response = await api.post<{ status: string }>(
        "/gis/nodes",
        nodeData,
      );
      if (response.data.status === "success") {
        toast.success(`${nodeData.type} berhasil disimpan`);
      }
    } catch {
      toast.error("Gagal menyimpan data node");
    }
  }, []);

  const handleAddLink = useCallback(async (linkData: Omit<IGisLink, "id">) => {
    try {
      if (linkData.path_geometry.length < 2) return;
      const response = await api.post<{ status: string }>(
        "/gis/links",
        linkData,
      );
      if (response.data.status === "success") {
        toast.success("Jalur kabel fiber berhasil dipetakan");
      }
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const message =
        axiosError.response?.data?.message || "Gagal menyimpan jalur kabel";
      toast.error(message);
    }
  }, []);

  const handleDeleteNode = useCallback(async (id: number) => {
    if (!confirm("Hapus aset infrastruktur ini dari database?")) return;
    try {
      await api.delete(`/gis/nodes/${id}`);
      toast.success("Aset dihapus");
    } catch {
      toast.error("Gagal menghapus aset");
    }
  }, []);

  const handleUpdateNodePorts = async (node: IGisNode, newOccupied: number) => {
    try {
      const response = await api.post<{ status: string }>("/gis/nodes", {
        ...node,
        metadata: {
          ...node.metadata,
          occupied_ports: newOccupied,
        },
      });
      if (response.data.status === "success") {
        toast.success("Kapasitas port diperbarui");
      }
    } catch {
      toast.error("Gagal update port");
    }
  };

  const handleToggleMaintenance = async (node: IGisNode) => {
    const isMaintenance = node.metadata?.status === "MAINTENANCE";
    try {
      const response = await api.post<{ status: string }>("/gis/nodes", {
        ...node,
        metadata: {
          ...node.metadata,
          status: isMaintenance ? "ACTIVE" : "MAINTENANCE",
        },
      });

      if (!isMaintenance) {
        toast.warning("Laporan Kerusakan terkirim ke modul PSM");
      }

      if (response.data.status === "success") {
        toast.success(
          isMaintenance ? "Aset kembali aktif" : "Tiket perbaikan dibuat",
        );
      }
    } catch {
      toast.error("Gagal mengubah status maintenance");
    }
  };

  const handlePredictFailure = async (nodeId: number) => {
    try {
      const response = await api.get<{
        status: string;
        data: {
          health_score: number;
          risk_level: string;
          recommendation: string;
        };
      }>(`/gis/analysis/predict/${nodeId}`);

      if (response.data.status === "success") {
        const data = response.data.data;
        toast.info(`Health Score: ${data.health_score}% - ${data.risk_level}`, {
          description: `Recommendation: ${data.recommendation}`,
          duration: 5000,
        });
      }
    } catch {
      toast.error("Gagal melakukan analisis AI");
    }
  };

  const handleSaveMetadata = async (
    item: IGisNode | IGisLink,
    metadata: Record<string, unknown>,
    type: "node" | "link",
  ) => {
    try {
      const endpoint = type === "node" ? "/gis/nodes" : "/gis/links";
      const response = await api.post<{ status: string }>(endpoint, {
        ...item,
        metadata,
      });
      if (response.data.status === "success") {
        toast.success("Data berhasil diperbarui");
      }
    } catch {
      toast.error("Gagal memperbarui data");
    }
  };

  const handleMoveNode = async (node: IGisNode, lat: number, lng: number) => {
    try {
      const response = await api.post<{ status: string }>("/gis/nodes", {
        ...node,
        lat,
        lng,
      });
      if (response.data.status === "success") {
        toast.success("Posisi aset berhasil diperbarui");
      }
    } catch {
      toast.error("Gagal memindahkan aset");
    }
  };

  const handleCreateAreaGroup = async (
    areaData: Partial<IAreaGroup> & { node_ids?: number[] },
  ) => {
    try {
      setLoading(true);
      const response = await api.post<{ success: boolean; data: IAreaGroup }>(
        "/gis/area-groups",
        areaData,
      );
      if (response.data.success) {
        toast.success(`Area "${areaData.name}" berhasil dibuat`);
        setAreaGroups((prev) => [...prev, response.data.data]);
        return response.data.data;
      }
    } catch {
      toast.error("Gagal membuat area grouping");
    } finally {
      setLoading(false);
    }
    return null;
  };

  const handleDeleteAreaGroup = async (id: number) => {
    if (!confirm("Hapus area grouping ini?")) return;
    try {
      const response = await api.delete<{ success: boolean }>(
        `/gis/area-groups/${id}`,
      );
      if (response.data.success) {
        toast.success("Area grouping dihapus");
        setAreaGroups((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      toast.error("Gagal menghapus area grouping");
    }
  };

  const handleUpdateAreaGroup = async (
    id: number,
    data: Partial<IAreaGroup>,
  ) => {
    try {
      const response = await api.put<{ success: boolean; data: IAreaGroup }>(
        `/gis/area-groups/${id}`,
        data,
      );
      if (response.data.success) {
        toast.success("Area grouping diperbarui");
        setAreaGroups((prev) =>
          prev.map((a) => (a.id === id ? response.data.data : a)),
        );
      }
    } catch {
      toast.error("Gagal memperbarui area grouping");
    }
  };

  return {
    nodes,
    links,
    areaGroups,
    loading,
    fetchData,
    handleAddNode,
    handleAddLink,
    handleDeleteNode,
    handleUpdateNodePorts,
    handleToggleMaintenance,
    handlePredictFailure,
    handleSaveMetadata,
    handleMoveNode,
    handleCreateAreaGroup,
    handleDeleteAreaGroup,
    handleUpdateAreaGroup,
    standards,
  };
}
