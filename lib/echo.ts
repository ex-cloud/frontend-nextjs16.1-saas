import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getAccessToken } from "@/lib/auth";
import axios from "axios";

// Define the auth data type expected by Pusher/Echo
// Matches Pusher's ChannelAuthorizationData
interface ChannelAuthData {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
  [key: string]: unknown;
}

// Global declaration to add types to window
declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"pusher">;
  }
}

if (typeof window !== "undefined") {
  window.Pusher = Pusher;
}

export const createEcho = async () => {
  if (typeof window === "undefined") return null;

  const token = await getAccessToken();

  if (!window.Echo) {
    window.Echo = new Echo({
      broadcaster: "pusher",
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "2jcwxvvhn6haqs3ffkkf",
      wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || "localhost",
      wsPort: parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || "8081"),
      wssPort: parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || "8081"),
      forceTLS: process.env.NEXT_PUBLIC_PUSHER_SCHEME === "https",
      encrypted: process.env.NEXT_PUBLIC_PUSHER_SCHEME === "https",
      disableStats: true,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      enabledTransports: ["ws", "wss"],
      authorizer: (channel: { name: string }) => {
        return {
          authorize: (
            socketId: string,
            // Fix for strict types: use ChannelAuthData | null and REMOVE optional flag (?)
            // because strict function signatures often forbid optionality if not explicitly defined like that.
            callback: (
              error: Error | null,
              data: ChannelAuthData | null
            ) => void
          ) => {
            axios
              .post(
                `${
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                }/api/v1/broadcasting/auth`,
                {
                  socket_id: socketId,
                  channel_name: channel.name,
                },
                {
                  headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                  },
                }
              )
              .then((response) => {
                // Pass null for error, and response data for data
                callback(null, response.data);
              })
              .catch((error) => {
                console.error("Broadcast Auth Error:", error);
                // Pass Error object for error, and null for data
                callback(new Error(error.message || "Auth failed"), null);
              });
          },
        };
      },
    });
  }

  return window.Echo;
};
