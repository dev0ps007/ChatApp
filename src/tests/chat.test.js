import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';

describe('My ChatApp project', () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    const app = express();
    const httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: '*'
      }
    });
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should work', (done) => {
    clientSocket.on('newMessage', (arg) => {
      expect(arg).toBe('Hello, how are you?');
      done();
    });
    serverSocket.emit('newMessage', 'Hello, how are you?');
  });

  test('should work (with ack)', (done) => {
    serverSocket.on('updatedMessage', (cb) => {
      cb('Hi, how are you?');
    });
    clientSocket.emit('updatedMessage', (arg) => {
      expect(arg).toBe('Hi, how are you?');
      done();
    });
  });
});
