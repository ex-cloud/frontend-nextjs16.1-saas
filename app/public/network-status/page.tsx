"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  ShieldCheck,
  Search,
  Wifi,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { IGisNode } from "@/types/infrastructure";
import "leaflet/dist/leaflet.css";

// Peta harus di-import secara dinamis untuk Next.js client-side
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false },
);

export default function CustomerNetworkPortal() {
  const [nodes, setNodes] = useState<IGisNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"IDLE" | "CHECKING" | "FOUND" | "CLEAR">(
    "IDLE",
  );

  useEffect(() => {
    // Load data maintenance publik
    const loadPublicIssues = async () => {
      try {
        // Panggil endpoint khusus publik yang sudah difilter di backend
        const response = await api.get<{
          status: string;
          data: { nodes: IGisNode[] };
        }>("/gis/public/maintenance", {
<<<<<<< HEAD
          params: { north: -6.8, south: -7.1, east: 107.8, west: 107.4 },
=======
          params: { north: -6.1, south: -6.4, east: 106.9, west: 106.7 },
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
        });
        if (response.data.status === "success") {
          setNodes(response.data.data.nodes);
        }
      } catch {
        console.error("Gagal load data publik");
      }
    };
    loadPublicIssues();
  }, []);

  const handleSearch = () => {
    setStatus("CHECKING");
    setTimeout(() => {
      setStatus(nodes.length > 0 ? "FOUND" : "CLEAR");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* Navbar Premium */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Wifi className="size-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            NET<span className="text-primary">CORE</span> PORTAL
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-600 hidden md:flex">
            Pusat Bantuan
          </Button>
          <Button className="rounded-full shadow-lg">Login Pelanggan</Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kontrol Kiri */}
        <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-left duration-500">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
            <div className="bg-primary h-1.5 w-full" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                <ShieldCheck className="text-emerald-500 size-6" /> Status
                Jaringan
              </CardTitle>
              <CardDescription>
                Cek kondisi infrastruktur ISP di area kamu secara real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Navigation className="absolute left-3 top-3 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Masukkan Lokasi atau No Pelanggan..."
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full h-12 text-lg font-semibold group"
                  onClick={handleSearch}
                >
                  <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Periksa Area Saya
                </Button>
              </div>

              {status !== "IDLE" && (
                <div className="p-4 rounded-xl border animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center space-y-3 bg-white">
                  {status === "CHECKING" && (
                    <>
                      <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <p className="text-sm font-medium text-slate-600">
                        Menganalisis topologi fisis...
                      </p>
                    </>
                  )}
                  {status === "CLEAR" && (
                    <>
                      <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="size-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">
                        Area Normal
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Tidak terdeteksi adanya gangguan fisis atau pemeliharaan
                        kabel pada area ini.
                      </p>
                    </>
                  )}
                  {status === "FOUND" && (
                    <>
                      <div className="size-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 animate-pulse">
                        <AlertCircle className="size-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">
                        Ada Pemeliharaan
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Kami terdeteksi sedang melakukan perbaikan aset di area
                        sekitar Anda. Estimasi selesai: 2 Jam.
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">
                    Up-Time
                  </p>
                  <p className="text-xl font-black text-emerald-700">99.9%</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-[10px] text-blue-600 font-bold uppercase">
                    Active Nodes
                  </p>
                  <p className="text-xl font-black text-blue-700">1.2K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Peta Kanan */}
        <div className="lg:col-span-8 h-[600px] md:h-full min-h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative animate-in slide-in-from-right duration-500">
          <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur shadow-md px-4 py-2 rounded-full flex items-center gap-2 border border-slate-200">
            <div className="size-3 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">
              Live Maintenance View
            </span>
          </div>

          <MapContainer
<<<<<<< HEAD
            center={[-6.9147, 107.6098]}
=======
            center={[-6.2088, 106.8456]}
>>>>>>> 13143cd8f7fc161a80670278aa4e334a49fe49eb
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {nodes.map((node, i) => (
              <Circle
                key={i}
                center={[node.lat, node.lng]}
                radius={300}
                pathOptions={{
                  color: "#f97316",
                  fillColor: "#f97316",
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              />
            ))}
          </MapContainer>
        </div>
      </main>

      <footer className="h-12 bg-white/50 border-t flex items-center justify-center text-[10px] text-slate-400 font-medium tracking-wide">
        &copy; 2026 NETCORE MASTERCLASS SYSTEM - PROFESSIONAL GIS INTERFACE
      </footer>
    </div>
  );
}
