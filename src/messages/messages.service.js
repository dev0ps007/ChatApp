import pool from '../config/database.config.js';
import authenticationService from '../authentication/authentication.service.js';

class MessagesService {
  async getAllMessagesOfRoom(socket) {
    socket.on('getAllMessagesOfRoom', async ({ roomId }) => {
      try {
        const messages = await pool.query('SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC', [
          roomId
        ]);
        socket.emit('getAllMessagesOfRoomResponse', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: messages.rows
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

  async getMessageById(socket) {
    socket.on('getMessageById', async ({ messageId }) => {
      try {
        const message = await pool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        if (message.rows[0]) {
          socket.emit('getMessageByIdResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: message.rows[0]
          });
        } else {
          socket.emit('getMessageByIdResponse', {
            status: 'fail',
            message: 'Message not found',
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

  async createMessage(io, socket) {
    socket.on('newMessage', async (messageData) => {
      try {
        const { content, roomId } = messageData;
        const user = await authenticationService.getUserFromSocket(socket);
        if (!user) {
          socket.disconnect(true);
        }
        const newMessage = await pool.query(
          'INSERT INTO messages (content, author_id, room_id) VALUES ($1, $2, $3) RETURNING *',
          [content, user.rows[0].id, roomId]
        );
        if (newMessage.rows[0]) {
          io.sockets.emit('newMessageResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: newMessage.rows[0]
          });
          io.sockets.to(roomId.toString()).emit('newMessageResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: newMessage.rows[0]
          });
        } else {
          socket.emit('newMessageResponse', {
            status: 'fail',
            message: 'Message not created',
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

  async updateMessage(io, socket) {
    socket.on('updatedMessage', async (messageData) => {
      const { content, messageId, roomId } = messageData;
      try {
        const oldMessage = await pool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        const updatedMessage = await pool.query('UPDATE messages SET content = $1 WHERE id = $2 RETURNING *', [
          content ? content : oldMessage.rows[0].content,
          messageId
        ]);
        if (updatedMessage.rows[0]) {
          io.sockets.emit('updatedMessageResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: updatedMessage.rows[0]
          });
          io.sockets.to(roomId.toString()).emit('updatedMessageResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: updatedMessage.rows[0]
          });
        } else {
          socket.emit('updatedMessageResponse', {
            status: 'fail',
            message: 'Message not updated',
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

  async deleteMessage(io, socket) {
    socket.on('deletedMessage', async ({ messageId }) => {
      try {
        const deletedMessage = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [messageId]);
        if (deletedMessage.rows[0]) {
          socket.emit('deletedMessageResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: deletedMessage.rows[0]
          });
        } else {
          socket.emit('deletedMessageResponse', {
            status: 'fail',
            message: 'Message not deleted',
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

export default new MessagesService();
