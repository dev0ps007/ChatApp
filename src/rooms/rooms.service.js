import pool from '../config/database.config.js';

class RoomsService {
  async getAllRooms(socket) {
    socket.on('getAllRooms', () => {
      try {
        const rooms = pool.query('SELECT * FROM rooms');
        socket.emit('getAllRooms', {
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
    socket.on('getRoomById', ({ roomId }) => {
      try {
        const room = pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
        socket.emit('getRoomById', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: room.rows[0]
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

  async createRoom(socket) {
    socket.on('newRoom', (roomData) => {
      try {
        const { title, description, userId } = roomData;
        const newRoom = pool.query('INSERT INTO users (title, description, owner_id) VALUES ($1, $2, $3) RETURNING *', [
          title,
          description,
          userId
        ]);
        socket.join(newRoom.rows[0].id.toString());
        pool.query('INSERT INTO room_members_user (room_id, user_id) VALUES ($1, $2)', [newRoom.rows[0].id, userId]);
        socket.broadcast.emit('newRoom', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: newRoom.rows[0]
        });
        socket.emit('newRoom', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: newRoom.rows[0]
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

  async updateRoom(socket) {
    socket.on('updatedRoom', (roomData) => {
      const { title, description, roomId } = roomData;
      try {
        const updatedRoom = pool.query('UPDATE rooms SET title = $1, description = $2 WHERE id = $3 RETURNING *', [
          title,
          description,
          roomId
        ]);
        socket.emit('updatedRoom', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: updatedRoom.rows[0]
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

  async deleteRoom(socket) {
    socket.on('deletedRoom', ({ roomId }) => {
      try {
        const deletedRoom = pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [roomId]);
        socket.emit('deletedRoom', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: deletedRoom.rows[0]
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
}

export default new RoomsService();
