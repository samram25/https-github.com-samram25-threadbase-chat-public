
import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "./middleware/auth.js";

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Demo users for testing live chat.
const USERS = [
  {
    userId: 1,
    name: "Ada",
    email: "ada@threadbase.dev",
    password: "password",
  },
  {
    userId: 2,
    name: "Linus",
    email: "linus@threadbase.dev",
    password: "password",
  },
];

// POST /auth/login
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};

  const found = USERS.find(
    (user) => user.email === email && user.password === password
  );

  if (!found) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = jwt.sign(
    { userId: found.userId, name: found.name },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.json({
    accessToken,
    user: { userId: found.userId, name: found.name },
  });
});

// Protected HTTP route.
app.get("/api/me", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Create the Socket.io server.
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// Authenticate Socket.io connections with JWT.
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = payload;
    return next();
  } catch {
    return next(new Error("Invalid token"));
  }
});

// Handle room joining and live chat messages.
io.on("connection", (socket) => {
  socket.on("room:join", (roomId) => {
    socket.join(roomId);
  });

  socket.on("chat:message", ({ roomId, text }) => {
    const message = {
      id: crypto.randomUUID(),
      text,
      user: socket.data.user.name,
      timestamp: Date.now(),
    };

    // Broadcast to everyone in the room, including the sender.
    io.to(roomId).emit("chat:message", message);
  });
});

// Start the server.
const PORT = process.env.PORT ?? 3001;

httpServer.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  console.log("  POST /auth/login");
  console.log("  Socket.io: ready for connections");
});
