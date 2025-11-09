import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "exp://your-expo-url"],
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Admin joins admin room
    socket.on("join_admin", () => {
      socket.join("admin-room");
      console.log(`Admin joined admin-room`);
    });

    // Employee joins their own room
    socket.on("join_employee", (empId) => {
      socket.join(`employee:${empId}`);
      console.log(`Employee joined room employee:${empId}`);
    });

     // User joins their private room
    socket.on("join_user", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User joined user:${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
