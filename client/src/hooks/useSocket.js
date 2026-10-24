
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth/AuthContext.jsx";

export function useSocket(roomId) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const s = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
    });

    const onConnect = () => {
      console.log("Socket connected successfully");
      s.emit("room:join", roomId);
    };

    const onMessage = (msg) => {
      console.log("Received chat message:", msg);
      setMessages((previous) => [...previous, msg]);
    };

    const onConnectError = (err) => {
      console.error("SOCKET ERROR DETAILS:", {
        message: err.message,
        description: err.description,
        context: err.context,
      });
    };

    s.on("connect", onConnect);
    s.on("chat:message", onMessage);
    s.on("connect_error", onConnectError);

    setSocket(s);

    return () => {
      s.off("connect", onConnect);
      s.off("chat:message", onMessage);
      s.off("connect_error", onConnectError);
      s.disconnect();
    };
  }, [token, roomId]);

  const sendMessage = useCallback(
    (text) => {
      if (!socket?.connected) {
        console.error("Cannot send: socket is not connected");
        return;
      }

      socket.emit("chat:message", { roomId, text });
    },
    [socket, roomId]
  );

  return { messages, sendMessage };
}
