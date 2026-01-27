"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Box,
  Server,
  Router,
  Network as SwitchIcon,
  Wifi,
  MoreVertical,
  RefreshCw,
  LayoutGrid,
  List,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { INetworkAsset } from "@/types/infrastructure";
import { ProtectedRoute } from "@/components/protected-route";

export default function AssetsInventoryPage() {
  const [assets, setAssets] = useState<INetworkAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/network-assets");
      // @ts-expect-error - Response structure handling
      if (response.data.success) {
        // @ts-expect-error - Response structure handling
        setAssets(response.data.data.data);
      }
    } catch {
      toast.error("Gagal mengambil data aset", {
        description: "Pastikan Anda memiliki izin akses yang cukup.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const getAssetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "server":
        return <Server className="size-4" />;
      case "router":
        return <Router className="size-4" />;
      case "switch":
        return <SwitchIcon className="size-4" />;
      case "ap":
        return <Wifi className="size-4" />;
      default:
        return <Box className="size-4" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Super Admin", "Admin", "Network Engineer"]}>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 animate-in fade-in duration-500">
        <div className="px-4 lg:px-6">
          {/* Header Section like ERPNext */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Assets Inventory
              </h1>
              <p className="text-muted-foreground">
                Kelola infrastruktur fisik, perangkat jaringan, dan inventaris
                server secara terpusat.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex border-gray-300"
              >
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button className="bg-primary shadow-md hover:shadow-lg transition-all rounded-md">
                <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </div>
          </div>

          <Card className="border-gray-400 shadow-none rounded-md overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Toolbar Section */}
              <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4 bg-gray-50/50">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari Aset, IP, atau Kode..."
                    className="pl-10 h-10 border-gray-300 bg-white"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 text-slate-600 border border-gray-200 bg-white"
                  >
                    <Filter className="mr-2 h-3.5 w-3.5" /> Filter
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 border border-gray-200 bg-white"
                    onClick={fetchAssets}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block" />
                  <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-white shadow-sm text-primary"
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent border-gray-200">
                      <TableHead className="w-[120px] font-bold text-slate-700">
                        CODE
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        ASSET NAME
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        TYPE
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        IP ADDRESS
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        DEPARTMENT
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        STATUS
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700">
                        ACTIONS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-gray-100">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full opacity-50" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : assets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-48 text-center text-muted-foreground italic bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center gap-2 py-8">
                            <Box className="size-10 text-gray-300 mb-2" />
                            <p>Tidak ada data aset ditemukan.</p>
                            <Button variant="link" onClick={fetchAssets}>
                              Muat ulang data
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      assets.map((asset) => (
                        <TableRow
                          key={asset.id}
                          className="hover:bg-slate-50/80 border-gray-100 transition-colors group"
                        >
                          <TableCell className="font-mono text-xs font-bold text-primary group-hover:underline">
                            {asset.asset_code || `#${asset.id}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {getAssetIcon(asset.asset_type)}
                              </div>
                              <div className="flex flex-col leading-tight">
                                <span className="font-semibold text-slate-800">
                                  {asset.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  {asset.manufacturer || "General"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-medium text-[10px] py-0 h-5 border-gray-200 bg-white"
                            >
                              {asset.asset_type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-slate-600">
                            {asset.ip_address || "—"}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-600">
                            {asset.department?.name || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`size-1.5 rounded-full ${asset.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
                              />
                              <span
                                className={`capitalize text-xs font-semibold ${asset.status === "active" ? "text-emerald-700" : "text-slate-500"}`}
                              >
                                {asset.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-slate-900"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 shadow-xl border-gray-200"
                              >
                                <DropdownMenuItem className="cursor-pointer">
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  Edit Configuration
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-blue-600">
                                  Track Topology
                                </DropdownMenuItem>
                                <div className="h-px bg-gray-100 my-1" />
                                <DropdownMenuItem className="text-destructive cursor-pointer">
                                  Decommission
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Placeholder (ERPNext style) */}
              {!loading && assets.length > 0 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    Showing 1 to {assets.length} of {assets.length} entries
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled
                    >
                      1
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
