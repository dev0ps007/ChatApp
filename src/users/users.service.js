import bcrypt from 'bcrypt';
import pool from '../config/database.config.js';

class UsersService {
  async getAllUsers(socket) {
    socket.on('getAllUsers', () => {
      try {
        const users = pool.query('SELECT * FROM users');
        socket.emit('getAllUsers', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: users.rows
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

  async getAllUsersOfRoom(socket) {
    socket.on('getAllUsersOfRoom', ({ roomId }) => {
      try {
        const users = pool.query(
          `SELECT u.*
          FROM users u
          JOIN room_members_user rmu ON rmu.user_id = u.id
          WHERE rmu.room_id =$1`,
          [roomId]
        );
        socket.emit('getAllUsersOfRoom', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: users.rows
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

  async findUserById(userId) {
    const user = pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    return (await user).rows[0];
  }

  async getUserById(socket) {
    socket.on('getUserById', ({ userId }) => {
      try {
        const user = pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        socket.emit('getUserById', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: user.rows[0]
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

  async updateUser(socket) {
    socket.on('updatedUser', (userData) => {
      try {
        const { userName, firstName, lastName, userId } = userData;
        const user = pool.query('SELECT * FROM users WHERE userName = $1', [userName]);
        if (user.rows[0]) {
          socket.emit('userResponse', {
            status: 'fail',
            message: `User with ${userName} already exists`,
            error: null,
            data: null
          });
        } else {
          const oldUser = pool.query('SELECT * FROM users WHERE id = $1', [userId]);
          const updatedUser = pool.query(
            'UPDATE users SET userName = $1 ,firstName = $2, lastName = $3 WHERE id = $4 RETURNING *',
            [
              userName ? userName : oldUser.rows[0].userName,
              firstName ? firstName : oldUser.rows[0].firstName,
              lastName ? lastName : oldUser.rows[0].lastName,
              userId
            ]
          );
          socket.emit('updatedUser', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: updatedUser.rows[0]
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

  async deleteUser(socket) {
    socket.on('deletedUser', ({ userId }) => {
      try {
        const deletedUser = pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
        socket.emit('deletedUser', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: deletedUser.rows[0]
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

  async updateEmail(socket) {
    socket.on('updatedEmail', (userData) => {
      try {
        const { userId, email } = userData;
        const oldUser = pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const updatedUser = pool.query('UPDATE users SET email = $1 WHERE id = $2 RETURNING *', [
          email ? email : oldUser.rows[0].email,
          userId
        ]);
        socket.emit('updatedEmail', {
          status: 'success',
          message: 'Successful',
          error: null,
          data: updatedUser.rows[0]
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

  async updatePassword(socket) {
    socket.on('updatedPassword', (passwordData, { userId }) => {
      try {
        const { oldPassword, newPassword, newPasswordConfirm } = passwordData;
        const user = pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (newPassword.toString().trim() === newPasswordConfirm.toString().trim()) {
          const isPasswordMatching = bcrypt.compare(oldPassword, user.rows[0].password);
          if (isPasswordMatching) {
            const hashedPassword = bcrypt.hash(newPassword, 10);
            const updatedUser = pool.query('UPDATE users SET password = $1 WHERE id = $2 RETURNING *', [
              hashedPassword,
              userId
            ]);
            socket.emit('updatedPassword', {
              status: 'success',
              message: 'Successful',
              error: null,
              data: updatedUser.rows[0]
            });
          }
        } else {
          socket.emit('userResponse', {
            status: 'fail',
            message: 'Passwords do not match',
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

export default new UsersService();
