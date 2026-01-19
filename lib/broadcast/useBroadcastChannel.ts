/**
 * BroadcastChannel Hook for Real-time Cross-Tab Synchronization
 *
 * This hook enables communication between browser tabs on the same origin.
 * When data changes in one tab (e.g., Kanban board), other tabs (e.g., Projects list)
 * can automatically refresh their data.
 */

import { useEffect, useRef, useCallback, useState } from "react";

// Define message types for type safety
export type BroadcastEventType =
  | "TASK_MOVED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "PROJECT_UPDATED"
  | "PROJECT_PROGRESS_CHANGED"
  | "REFRESH_PROJECTS"
  | "REFRESH_KANBAN";

export interface BroadcastMessage {
  type: BroadcastEventType;
  payload?: {
    projectId?: string | number;
    taskId?: string | number;
    listId?: string | number;
    data?: unknown;
  };
  timestamp: number;
  sourceTabId: string;
}

// Generate unique tab ID
const getTabId = () => {
  if (typeof window === "undefined") return "server";

  let tabId = sessionStorage.getItem("tabId");
  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("tabId", tabId);
  }
  return tabId;
};

const CHANNEL_NAME = "k2net-admin-sync";

/**
 * Hook to use BroadcastChannel for cross-tab communication
 */
export function useBroadcastChannel(
  onMessage?: (message: BroadcastMessage) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  // Use lazy initialization for tabId (only calculated once)
  const [tabId] = useState(() => getTabId());

  useEffect(() => {
    // Check if BroadcastChannel is supported
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      console.warn("BroadcastChannel is not supported in this browser");
      return;
    }

    // Create or get the broadcast channel
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    // Handle incoming messages
    const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data;

      // Ignore messages from the same tab
      if (message.sourceTabId === tabId) {
        return;
      }

      console.log(
        "[BroadcastChannel] Received:",
        message.type,
        message.payload
      );

      if (onMessage) {
        onMessage(message);
      }
    };

    channelRef.current.addEventListener("message", handleMessage);

    return () => {
      if (channelRef.current) {
        channelRef.current.removeEventListener("message", handleMessage);
        channelRef.current.close();
      }
    };
  }, [onMessage, tabId]);

  /**
   * Send a message to all other tabs
   */
  const broadcast = useCallback(
    (type: BroadcastEventType, payload?: BroadcastMessage["payload"]) => {
      if (!channelRef.current) {
        console.warn("BroadcastChannel not initialized");
        return;
      }

      const message: BroadcastMessage = {
        type,
        payload,
        timestamp: Date.now(),
        sourceTabId: tabId,
      };

      console.log("[BroadcastChannel] Sending:", type, payload);
      channelRef.current.postMessage(message);
    },
    [tabId]
  );

  return { broadcast, tabId };
}

/**
 * Singleton broadcast instance for non-hook usage
 */
class BroadcastService {
  private channel: BroadcastChannel | null = null;
  private tabId: string = "";

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.tabId = getTabId();
    }
  }

  broadcast(type: BroadcastEventType, payload?: BroadcastMessage["payload"]) {
    if (!this.channel) return;

    const message: BroadcastMessage = {
      type,
      payload,
      timestamp: Date.now(),
      sourceTabId: this.tabId,
    };

    this.channel.postMessage(message);
  }
}

// Export singleton for use in services
export const broadcastService =
  typeof window !== "undefined" ? new BroadcastService() : null;
