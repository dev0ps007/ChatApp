import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import pool from './config/database.config.js';
import authenticationService from './authentication/authentication.service.js';
import usersService from './users/users.service.js';
import roomsService from './rooms/rooms.service.js';
import messagesService from './messages/messages.service.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (joinData) => {
    const { userId, roomId } = joinData;
    socket.join(roomId.toString());
    pool.query('INSERT INTO room_members_user (room_id, user_id) VALUES ($1, $2)', [roomId, userId]);
    io.to(roomId.toString()).emit('A new user has joined the room');
  });

  socket.on('leave', (leaveData) => {
    const { userId, roomId } = leaveData;
    socket.leave(roomId.toString());
    pool.query('DELETE FROM room_members_user WHERE room_id = $1 AND user_id = $2', [roomId, userId]);
    io.to(roomId.toString()).emit(`User ${socket.id} has left the room`);
  });

  // auth middleware
  io.use(async (socket, next) => {
    const cookie = socket.handshake.headers.cookie;
    const { Authentication: authenticationToken } = parse(cookie);
    if (authenticationToken) {
      const decoded = jwt.verify(authenticationToken, process.env.JWT_TOKEN_SECRET);
      const candidate = await usersService.findUserById(decoded.userId);
      if (!candidate) {
        socket.disconnect(true);
        return next(new Error('Unauthorized'));
      }
      next();
    } else {
      next(new Error('Unauthorized'));
    }
  });

  authenticationService.register(socket);
  authenticationService.login(socket);
  authenticationService.logout(socket);

  usersService.getAllUsers(socket);
  usersService.getAllUsersOfRoom(socket);
  usersService.getUserById(socket);
  usersService.updateUser(socket);
  usersService.deleteUser(socket);
  usersService.updateEmail(socket);
  usersService.updatePassword(socket);

  roomsService.getAllRooms(socket);
  roomsService.getRoomById(socket);
  roomsService.createRoom(socket);
  roomsService.updateRoom(socket);
  roomsService.deleteRoom(socket);

  messagesService.getAllMessages(socket);
  messagesService.getAllMessagesOfRoom(socket);
  messagesService.getMessageById(socket);
  messagesService.createMessage(io, socket);
  messagesService.updateMessage(io, socket);
  messagesService.deleteMessage(io, socket);

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT ?? 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
