// src/socket.js
import { io } from "socket.io-client";

// استخدم نفس البورت اللي شغّله السيرفر
export const socket = io("http://localhost:5001");
