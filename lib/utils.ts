import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export function getProxyImageUrl(url: string | null) {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  try {
    // Parse the backend URL to get structured data (host, port, etc.)
    const backendUrlString = getBackendUrl();
    const backendUrl = new URL(backendUrlString);
    const targetUrl = new URL(url);

    // Helper to normalize localhost vs 127.0.0.1
    const isLocalhost = (hostname: string) => 
      hostname === "localhost" || hostname === "127.0.0.1";

    const hostsMatch = 
      targetUrl.hostname === backendUrl.hostname || 
      (isLocalhost(targetUrl.hostname) && isLocalhost(backendUrl.hostname));
      
    // Check ports match (if defined in env)
    const portsMatch = targetUrl.port === backendUrl.port || (targetUrl.port === "" && backendUrl.port === "") || (isLocalhost(targetUrl.hostname) && targetUrl.port === backendUrl.port);

    // If generic domain/host matches AND port matches AND path starts with /storage/
    if (hostsMatch && portsMatch && targetUrl.pathname.startsWith("/storage/")) {
      // Logic: /storage/avatars/abc.jpg -> /laravel-storage/avatars/abc.jpg
      const newPath = targetUrl.pathname.replace(/^\/storage/, "/laravel-storage");
      return newPath;
    }
  } catch (e) {
    // Fallback: If URL parsing fails (e.g. invalid URL), return original
    console.warn("Failed to parse URL for proxying:", e);
    return url;
  }

  return url;
}
