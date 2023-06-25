import pool from '../config/database.config.js';
import authenticationService from '../authentication/authentication.service.js';

class RoomsService {
  async getAllRooms(socket) {
    socket.on('getAllRooms', async () => {
      try {
        const rooms = await pool.query('SELECT * FROM rooms');
        socket.emit('getAllRoomsResponse', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: rooms.rows
        });
      } catch (error) {
        socket.emit('error', {
          status: 'fail',
          message: error.message,
          error,
          data: null
        });
      }
    });
  }

  async getRoomById(socket) {
    socket.on('getRoomById', async ({ roomId }) => {
      try {
        const room = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        if (room.rows[0]) {
          socket.emit('getRoomByIdResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: room.rows[0]
          });
        } else {
          socket.emit('getRoomByIdResponse', {
            status: 'fail',
            message: 'Room not found',
            error: null,
            data: null
          });
        }
      } catch (error) {
        socket.emit('error', {
          status: 'fail',
          message: error.message,
          error,
          data: null
        });
      }
    });
  }

  async createRoom(socket) {
    socket.on('newRoom', async (roomData) => {
      try {
        const { title, description } = roomData;
        const user = await authenticationService.getUserFromSocket(socket);
        if (!user) {
          socket.disconnect(true);
        }
        const newRoom = await pool.query(
          'INSERT INTO users (title, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
          [title, description, user.rows[0].id]
        );
        if (newRoom.rows[0]) {
          socket.join(newRoom.rows[0].id.toString());
          await pool.query('INSERT INTO room_members_user (room_id, user_id) VALUES ($1, $2)', [
            newRoom.rows[0].id,
            user.rows[0].id
          ]);
          socket.broadcast.emit('newRoomResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: newRoom.rows[0]
          });
          socket.emit('newRoomResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: newRoom.rows[0]
          });
        } else {
          socket.emit('newRoomResponse', {
            status: 'fail',
            message: 'Room not created',
            error: null,
            data: null
          });
        }
      } catch (error) {
        socket.emit('error', {
          status: 'fail',
          message: error.message,
          error,
          data: null
        });
      }
    });
  }

  async updateRoom(socket) {
    socket.on('updatedRoom', async (roomData) => {
      const { title, description, roomId } = roomData;
      try {
        const oldRoom = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        const updatedRoom = await pool.query(
          'UPDATE rooms SET title = $1, description = $2 WHERE id = $3 RETURNING *',
          [title ? title : oldRoom.rows[0].title, description ? description : oldRoom.rows[0].description, roomId]
        );
        if (updatedRoom.rows[0]) {
          socket.broadcast.emit('updatedRoomResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: updatedRoom.rows[0]
          });
          socket.emit('updatedRoomResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: updatedRoom.rows[0]
          });
        } else {
          socket.emit('updatedRoomResponse', {
            status: 'fail',
            message: 'Room not updated',
            error: null,
            data: null
          });
        }
      } catch (error) {
        socket.emit('error', {
          status: 'fail',
          message: error.message,
          error,
          data: null
        });
      }
    });
  }

  async deleteRoom(socket) {
    socket.on('deletedRoom', async ({ roomId }) => {
      try {
        const deletedRoom = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [roomId]);
        if (deletedRoom.rows[0]) {
          socket.emit('deletedRoomResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: deletedRoom.rows[0]
          });
        } else {
          socket.emit('deletedRoomResponse', {
            status: 'fail',
            message: 'Room not deleted',
            error: null,
            data: null
          });
        }
      } catch (error) {
        socket.emit('error', {
          status: 'fail',
          message: error.message,
          error,
          data: null
        });
      }
    });
  }
}

export default new RoomsService();
