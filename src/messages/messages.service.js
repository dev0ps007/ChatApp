import pool from '../config/database.config.js';

class MessagesService {
  async getAllMessages(socket) {
    socket.on('getAllMessages', () => {
      try {
        const messages = pool.query('SELECT * FROM messages');
        socket.emit('getAllMessages', {
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

  async getAllMessagesOfRoom(socket) {
    socket.on('getAllMessagesOfRoom', ({ roomId }) => {
      try {
        const messages = pool.query('SELECT * FROM messages WHERE room_id = $1', [roomId]);
        socket.emit('getAllMessagesOfRoom', {
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
    socket.on('getMessageById', ({ messageId }) => {
      try {
        const message = pool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        socket.emit('getMessageById', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: message.rows[0]
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

  async createMessage(socket) {
    socket.on('newMessage', (messageData) => {
      try {
        const { content, userId, roomId } = messageData;
        const newMessage = pool.query(
          'INSERT INTO messages (content, author_id, room_id) VALUES ($1, $2, $3) RETURNING *',
          [content, userId, roomId]
        );
        socket.to(roomId.toString()).emit('newMessage', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: newMessage.rows[0]
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

  async updateMessage(socket) {
    socket.on('updatedMessage', (messageData) => {
      const { content, messageId, roomId } = messageData;
      try {
        const oldMessage = pool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
        const updatedMessage = pool.query('UPDATE messages SET content = $1 WHERE id = $2 RETURNING *', [
          content ? content : oldMessage.rows[0].content,
          messageId
        ]);
        socket.to(roomId.toString()).emit('updatedMessage', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: updatedMessage.rows[0]
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

  async deleteMessage(socket) {
    socket.on('deletedMessage', ({ messageId }) => {
      try {
        const deletedMessage = pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [messageId]);
        socket.emit('deletedMessage', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: deletedMessage.rows[0]
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

export default new MessagesService();
