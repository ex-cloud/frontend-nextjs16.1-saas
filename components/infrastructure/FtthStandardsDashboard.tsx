"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkConfigForm } from "./NetworkConfigForm";
import {
  Network,
  Box,
  Ruler,
  AlertTriangle,
  Loader2,
  Settings2,
  Plus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface NetworkConfig {
  id: number;
  config_key: string;
  category: string;
  config_value: Record<string, unknown>;
  label: string;
  description: string;
  is_editable: boolean;
}

export function FtthStandardsDashboard() {
  const [configs, setConfigs] = useState<Record<string, NetworkConfig[]>>({});
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    label: "",
    category: "odp",
    description: "",
  });

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{
        success: boolean;
        data: Record<string, NetworkConfig[]>;
      }>("/gis/config");
      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch {
      console.error("Fetch Config Error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroup.label) {
      toast.error("Label grup harus diisi");
      return;
    }

    try {
      setLoading(true);
      const configKey =
        newGroup.label.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
      await api.post("/gis/config", {
        config_key: configKey,
        category: newGroup.category,
        label: newGroup.label,
        description: newGroup.description,
        config_value: {},
        is_editable: true,
      });

      toast.success("Grup standar baru berhasil dibuat");
      setIsCreateOpen(false);
      setNewGroup({ label: "", category: "odp", description: "" });
      fetchConfigs();
    } catch {
      toast.error("Gagal membuat grup standar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const sections = [
    {
      id: "odp",
      label: "ODP Standards",
      icon: Box,
      category: "odp",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      id: "pole",
      label: "Pole Standards",
      icon: Network,
      category: "pole",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      id: "link_budget",
      label: "Link Budget",
      icon: Ruler,
      category: "link_budget",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      id: "validation",
      label: "Validation Rules",
      icon: AlertTriangle,
      category: "validation",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 mr-1 rounded-lg bg-primary/10 text-primary">
              <Settings2 className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              Standarisasi Infrastruktur
            </h2>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Konfigurasi parameter teknis FTTH & parameter validasi GIS secara
            real-time.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Plus className="mr-2 h-5 w-5" /> Buat Standar Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Buat Standar Baru</DialogTitle>
              <DialogDescription>
                Tambahkan grup konfigurasi baru untuk menambah fleksibilitas
                jaringan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="label">Nama Standar</Label>
                <Input
                  id="label"
                  placeholder="Contoh: Spek Kabel Backbone"
                  value={newGroup.label}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, label: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={newGroup.category}
                  onValueChange={(val) =>
                    setNewGroup({ ...newGroup, category: val })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.category} value={s.category}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Deskripsi</Label>
                <Input
                  id="desc"
                  placeholder="Penjelasan singkat standar ini"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateGroup}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Buat Grup Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Tabs defaultValue="odp" className="w-full">
        <GlassCard intensity="low" className="p-1 mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-transparent border-none">
            {sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className={cn(
                  "gap-2 py-2.5 transition-all duration-300 data-[state=active]:shadow-sm",
                  "data-[state=active]:bg-background/60",
                )}
              >
                <section.icon
                  className={cn("h-4 w-4 transition-colors", section.color)}
                />
                <span className="font-semibold text-xs tracking-wide uppercase">
                  {section.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </GlassCard>

        <AnimatePresence mode="wait">
          {sections.map((section) => (
            <TabsContent
              key={section.id}
              value={section.id}
              className="mt-0 outline-none"
            >
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid grid-cols-1 @4xl:grid-cols-2 gap-6"
              >
                {configs[section.category]?.map((config) => (
                  <NetworkConfigForm
                    key={config.id}
                    config={config}
                    onUpdate={fetchConfigs}
                  />
                ))}
                {(!configs[section.category] ||
                  configs[section.category].length === 0) && (
                  <GlassCard className="col-span-full border-dashed p-12 flex flex-col items-center justify-center opacity-60">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium text-center">
                      Data standar kategori {section.label} tidak ditemukan.
                    </p>
                  </GlassCard>
                )}
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
