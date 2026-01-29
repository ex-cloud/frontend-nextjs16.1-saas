import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import * as turf from "@turf/turf";
import { toast } from "sonner";
import { createEcho } from "@/lib/echo";
import {
  IGisNode,
  IGisLink,
  IAreaGroup,
  NodeType,
  INetworkStandard,
} from "@/types/infrastructure";

interface GisUpdateEvent {
  action:
    | "node_created"
    | "node_updated"
    | "node_deleted"
    | "link_created"
    | "link_updated"
    | "link_deleted"
    | "bulk_nodes_created"
    | "bulk_links_created";
  data:
    | IGisNode
    | IGisLink
    | IGisNode[]
    | IGisLink[]
    | { id: number }
    | { count: number };
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
  const [isSyncing, setIsSyncing] = useState(false); // Subtler loading state for area sync

  const fetchData = useCallback(
    async (bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    }) => {
      try {
        // Initial load uses regular loading, sub-updates use isSyncing
        if (nodes.length === 0) setLoading(true);
        else setIsSyncing(true);

        const savedBoundsItem = localStorage.getItem("gis_last_bounds");
        let parsedBounds = null;
        if (savedBoundsItem) {
          try {
            parsedBounds = JSON.parse(savedBoundsItem);
          } catch (e) {
            console.warn(
              "[GIS] Failed to parse saved bounds, using defaults",
              e,
            );
            localStorage.removeItem("gis_last_bounds");
          }
        }

        const query = bounds ||
          parsedBounds || {
            north: -6.89,
            south: -6.92,
            east: 107.65,
            west: 107.6,
          };

        const response = await api.get<{
          success: boolean;
          status: string;
          data: { nodes: IGisNode[]; links: IGisLink[] };
        }>("/gis/area", { params: query });

        if (response.data.success || response.data.status === "success") {
          const newNodes = response.data.data.nodes;
          const newLinks = response.data.data.links;

          // Smart Merge: Only add nodes that don't exist yet
          setNodes((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const uniqueNewNodes = newNodes.filter(
              (n) => !existingIds.has(n.id),
            );
            return [...prev, ...uniqueNewNodes];
          });

          // Smart Merge: Only add links that don't exist yet
          setLinks((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const uniqueNewLinks = newLinks.filter(
              (l) => !existingIds.has(l.id),
            );
            return [...prev, ...uniqueNewLinks];
          });

          localStorage.setItem("gis_last_bounds", JSON.stringify(query));
        }

        // Fetch area groups - this can be less frequent
        const areasResponse = await api.get<{
          success: boolean;
          data: IAreaGroup[];
        }>("/gis/area-groups");
        if (areasResponse.data.success) {
          setAreaGroups(areasResponse.data.data);
        }

        // Fetch network standards - only if not loaded
        if (Object.keys(standards).length === 0) {
          const standardsResponse = await api.get<{
            success: boolean;
            data: Record<string, INetworkStandard[]>;
          }>("/gis/config");
          if (standardsResponse.data.success) {
            setStandards(standardsResponse.data.data);
          }
        }
      } catch (error: unknown) {
        const err = error as {
          message?: string;
          response?: { data?: Record<string, unknown> };
        };
        console.error("[GIS Sync Error]", err?.message || error);
        if (err?.message?.includes("JSON")) {
          console.error(
            "[GIS] Server returned non-JSON response:",
            err?.response?.data,
          );
        }
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    },
    [nodes.length, standards],
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

              if (
                currentUserId &&
                e.userId &&
                String(e.userId).toLowerCase() !==
                  String(currentUserId).toLowerCase()
              ) {
                toast.info(`Update: ${node.type} diperbarui`);
              }
            } else if ((action as string) === "bulk_nodes_created") {
              const bulkData = data as IGisNode[] | { count: number };
              if (Array.isArray(bulkData)) {
                setNodes((prev) => {
                  const filtered = prev.filter(
                    (n) => !bulkData.find((newNode) => newNode.id === n.id),
                  );
                  return [...filtered, ...bulkData];
                });
                if (
                  currentUserId &&
                  e.userId &&
                  String(e.userId).toLowerCase() !==
                    String(currentUserId).toLowerCase()
                ) {
                  toast.info(`${bulkData.length} Node baru ditambahkan`);
                }
              } else {
                fetchData();
                if (
                  currentUserId &&
                  e.userId &&
                  String(e.userId).toLowerCase() !==
                    String(currentUserId).toLowerCase()
                ) {
                  toast.info(
                    `${bulkData.count} Node baru ditambahkan (Refreshing...)`,
                  );
                }
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

              if (
                currentUserId &&
                e.userId &&
                String(e.userId).toLowerCase() !==
                  String(currentUserId).toLowerCase()
              ) {
                toast.info(`Update: Jalur Kabel #${link.id} diperbarui`);
              }
            } else if ((action as string) === "bulk_links_created") {
              const bulkData = data as IGisLink[] | { count: number };
              if (Array.isArray(bulkData)) {
                setLinks((prev) => {
                  const filtered = prev.filter(
                    (l) => !bulkData.find((newLink) => newLink.id === l.id),
                  );
                  return [...filtered, ...bulkData];
                });
                if (
                  currentUserId &&
                  e.userId &&
                  String(e.userId).toLowerCase() !==
                    String(currentUserId).toLowerCase()
                ) {
                  toast.info(`${bulkData.length} Jalur Kabel baru ditambahkan`);
                }
              } else {
                fetchData();
                if (
                  currentUserId &&
                  e.userId &&
                  String(e.userId).toLowerCase() !==
                    String(currentUserId).toLowerCase()
                ) {
                  toast.info(
                    `${bulkData.count} Jalur Kabel baru ditambahkan (Refreshing...)`,
                  );
                }
              }
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

            if (e.config.deleted_key) {
              return {
                ...prev,
                [category]: currentItems.filter(
                  (c) => c.config_key !== e.config.deleted_key,
                ),
              };
            }

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
  }, [currentUserId, fetchData]);

  const handleAddNode = useCallback(async (nodeData: Omit<IGisNode, "id">) => {
    try {
      const response = await api.post<{ status: string; data: IGisNode }>(
        "/gis/nodes",
        nodeData,
      );
      if (response.data.status === "success") {
        toast.success(`${nodeData.type} berhasil disimpan`);
        return response.data.data;
      }
    } catch {
      toast.error("Gagal menyimpan data node");
    }
    return null;
  }, []);

  const handleAddLink = useCallback(async (linkData: Omit<IGisLink, "id">) => {
    try {
      if (linkData.path_geometry.length < 2) return null;
      const response = await api.post<{ status: string; data: IGisLink }>(
        "/gis/links",
        linkData,
      );
      if (response.data.status === "success") {
        toast.success("Jalur kabel fiber berhasil dipetakan");
        return response.data.data;
      }
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const message =
        axiosError.response?.data?.message || "Gagal menyimpan jalur kabel";
      toast.error(message);
    }
    return null;
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

  const fetchOsmBuildings = async (polygonCoords: [number, number][]) => {
    try {
      setLoading(true);
      const closedCoords = [...polygonCoords];
      if (
        closedCoords.length > 0 &&
        (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] ||
          closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1])
      ) {
        closedCoords.push(closedCoords[0]);
      }

      const bounds = closedCoords.map((c) => `${c[0]} ${c[1]}`).join(" ");
      const query = `
        [out:json][timeout:25];
        (
          way["building"](poly:"${bounds}");
          relation["building"](poly:"${bounds}");
        );
        out center;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      const data = await response.json();
      const buildings = data.elements.map(
        (el: {
          id: number;
          center?: { lat: number; lon: number };
          lat?: number;
          lon?: number;
        }) => ({
          lat: el.center ? el.center.lat : el.lat!,
          lng: el.center ? el.center.lon : el.lon!,
          type: "CUSTOMER" as NodeType,
          metadata: {
            osm_id: el.id,
            source: "OSM_DETECTION",
            status: "DRAFT_HOUSE",
          },
        }),
      );

      return buildings;
    } catch (error) {
      console.error("OSM Detection Error:", error);
      toast.error("Gagal mendeteksi rumah dari satelit");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSaveNodes = async (nodesToSave: Partial<IGisNode>[]) => {
    try {
      setLoading(true);
      const response = await api.post<{
        success: boolean;
        status: string;
        data: IGisNode[];
      }>("/gis/bulk-nodes", {
        nodes: nodesToSave,
      });
      if (response.data.success || response.data.status === "success") {
        toast.success(`${response.data.data.length} Node berhasil disimpan`);
        const savedNodes = response.data.data;
        setNodes((prev) => [...prev, ...savedNodes]);
        return savedNodes;
      }
    } catch {
      toast.error("Gagal menyimpan data bulk");
    } finally {
      setLoading(false);
    }
    return [];
  };

  const handleBulkSaveLinks = useCallback(
    async (linksToSave: Partial<IGisLink>[]) => {
      try {
        const response = await api.post<{
          success: boolean;
          status: string;
          data: IGisLink[];
        }>("/gis/bulk-links", {
          links: linksToSave,
        });
        if (
          (response.data.status === "success" || response.data.success) &&
          Array.isArray(response.data.data)
        ) {
          const savedLinks = response.data.data as IGisLink[];
          setLinks((prev) => [...prev, ...savedLinks]);
          toast.success(`${savedLinks.length} Rute kabel berhasil disimpan`);
          return savedLinks;
        }
        return [];
      } catch (error) {
        console.error("Failed to bulk save links:", error);
        toast.error("Gagal menyimpan banyak link");
        return [];
      }
    },
    [],
  );

  const performSpatialAnalysis = useCallback(
    (polygonCoords: [number, number][], customTargetNodes?: IGisNode[]) => {
      try {
        const polygon = turf.polygon([
          [
            ...polygonCoords.map((c) => [
              Number(c[1].toFixed(7)),
              Number(c[0].toFixed(7)),
            ]),
            [
              Number(polygonCoords[0][1].toFixed(7)),
              Number(polygonCoords[0][0].toFixed(7)),
            ],
          ],
        ]);

        const targetSource = customTargetNodes || nodes;
        const assetsInArea = targetSource.filter((node) => {
          const pt = turf.point([
            Number(node.lng.toFixed(7)),
            Number(node.lat.toFixed(7)),
          ]);
          return turf.booleanPointInPolygon(pt, polygon);
        });

        const counts = {
          CUSTOMER: assetsInArea.filter((n) => n.type === "CUSTOMER").length,
          POLE: assetsInArea.filter((n) => n.type === "POLE").length,
          ODP: assetsInArea.filter((n) => n.type === "ODP").length,
        };

        const customersInArea = assetsInArea.filter(
          (n) => n.type === "CUSTOMER",
        );
        let suggestions: [number, number][] = [];

        if (customersInArea.length > 0) {
          const odpStandards = (standards.odp as INetworkStandard[])?.find(
            (s) => s.config_key === "odp_standards",
          );
          const cap =
            (odpStandards?.config_value?.default_capacity as number) || 16;
          const clusterCount = Math.max(
            1,
            Math.ceil(customersInArea.length / cap),
          );

          const points = turf.featureCollection(
            customersInArea.map((c) => turf.point([c.lng, c.lat])),
          );

          const clusters = turf.clustersKmeans(points, {
            numberOfClusters: clusterCount,
          });

          const clusterGroups: Record<
            number,
            (typeof clusters.features)[number][]
          > = {};
          clusters.features.forEach((f) => {
            const clusterId = f.properties?.cluster as number;
            if (!clusterGroups[clusterId]) clusterGroups[clusterId] = [];
            clusterGroups[clusterId].push(f);
          });

          suggestions = Object.values(clusterGroups).map((group) => {
            const center = turf.center(turf.featureCollection(group));
            return [
              center.geometry.coordinates[1],
              center.geometry.coordinates[0],
            ] as [number, number];
          });
        }

        return {
          counts,
          suggestions,
          area_sqkm: turf.area(polygon) / 1000000,
        };
      } catch (error) {
        console.error("Spatial Analysis Error:", error);
        return null;
      }
    },
    [nodes, standards],
  );

  return {
    nodes,
    links,
    areaGroups,
    isSyncing,
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
    handleBulkSaveNodes,
    handleBulkSaveLinks,
    fetchOsmBuildings,
    performSpatialAnalysis,
    standards,
  };
}
