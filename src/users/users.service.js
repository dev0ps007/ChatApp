import bcrypt from 'bcrypt';
import pool from '../config/database.config.js';

class UsersService {
  async getAllUsers(socket) {
    socket.on('getAllUsers', async () => {
      try {
        const users = await pool.query('SELECT * FROM users');
        socket.emit('getAllUsersResponse', {
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
    socket.on('getAllUsersOfRoom', async ({ roomId }) => {
      try {
        const users = await pool.query(
          'SELECT u.* FROM users u JOIN room_members_user rmu ON rmu.user_id = u.id WHERE rmu.room_id =$1',
          [roomId]
        );
        socket.emit('getAllUsersOfRoomResponse', {
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
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    return user.rows[0];
  }

  async getUserById(socket) {
    socket.on('getUserById', async ({ userId }) => {
      try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (user.rows[0]) {
          socket.emit('getUserByIdResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: user.rows[0]
          });
        } else {
          socket.emit('getUserByIdResponse', {
            status: 'fail',
            message: 'User not found',
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

  async updateUser(socket) {
    socket.on('updatedUser', async (userData) => {
      try {
        const { userName, firstName, lastName, userId } = userData;
        const user = await pool.query('SELECT * FROM users WHERE userName = $1', [userName]);
        if (user.rows[0]) {
          socket.emit('updatedUserResponse', {
            status: 'fail',
            message: `User with ${userName} already exists`,
            error: null,
            data: null
          });
        } else {
          const oldUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
          const updatedUser = await pool.query(
            'UPDATE users SET userName = $1 ,firstName = $2, lastName = $3 WHERE id = $4 RETURNING *',
            [
              userName ? userName : oldUser.rows[0].userName,
              firstName ? firstName : oldUser.rows[0].firstName,
              lastName ? lastName : oldUser.rows[0].lastName,
              userId
            ]
          );
          if (updatedUser.rows[0]) {
            socket.emit('updatedUserResponse', {
              status: 'success',
              message: 'Successful',
              error: null,
              data: updatedUser.rows[0]
            });
          } else {
            socket.emit('updatedUserResponse', {
              status: 'fail',
              message: 'User not updated',
              error: null,
              data: null
            });
          }
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
    socket.on('deletedUser', async ({ userId }) => {
      try {
        const deletedUser = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
        if (deletedUser.rows[0]) {
          socket.emit('deletedUserResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: deletedUser.rows[0]
          });
        } else {
          socket.emit('deletedUserResponse', {
            status: 'fail',
            message: 'User not deleted',
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

  async updateEmail(socket) {
    socket.on('updatedEmail', async (userData) => {
      try {
        const { userId, email } = userData;
        const oldUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const updatedEmail = await pool.query('UPDATE users SET email = $1 WHERE id = $2 RETURNING *', [
          email ? email : oldUser.rows[0].email,
          userId
        ]);
        if (updatedEmail.rows[0]) {
          socket.emit('updatedEmailResponse', {
            status: 'success',
            message: 'Successful',
            error: null,
            data: updatedEmail.rows[0]
          });
        } else {
          socket.emit('updatedEmailResponse', {
            status: 'fail',
            message: 'User not updated',
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

  async updatePassword(socket) {
    socket.on('updatedPassword', async (passwordData, { userId }) => {
      try {
        const { oldPassword, newPassword, newPasswordConfirm } = passwordData;
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (newPassword.toString().trim() === newPasswordConfirm.toString().trim()) {
          const isPasswordMatching = bcrypt.compare(oldPassword, user.rows[0].password);
          if (isPasswordMatching) {
            const hashedPassword = bcrypt.hash(newPassword, 10);
            const updatedPassword = await pool.query('UPDATE users SET password = $1 WHERE id = $2 RETURNING *', [
              hashedPassword,
              userId
            ]);
            if (updatedPassword.rows[0]) {
              socket.emit('updatedPasswordResponse', {
                status: 'success',
                message: 'Successful',
                error: null,
                data: updatedPassword.rows[0]
              });
            } else {
              socket.emit('updatedPasswordResponse', {
                status: 'fail',
                message: 'User not updated',
                error: null,
                data: null
              });
            }
          }
        } else {
          socket.emit('updatedPasswordResponse', {
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
