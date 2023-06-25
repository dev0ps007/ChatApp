import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import pool from '../config/database.config.js';

class AuthenticationService {
  async register(socket) {
    socket.on('register', async (registerData) => {
      try {
        const { email, userName, firstName, lastName, password } = registerData;
        const candidate = await pool.query('SELECT * FROM users WHERE email = $1 OR userName = $2', [email, userName]);
        if (candidate.rows[0]) {
          socket.emit('registerResponse', {
            status: 'fail',
            message: `User with ${email} or ${userName} already exists`,
            error: null,
            data: null
          });
        } else {
          const hashedPassword = bcrypt.hash(password, 10);
          const newUser = await pool.query(
            'INSERT INTO users (email, userName, firstName, lastName, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [email, userName, firstName, lastName, hashedPassword]
          );
          if (newUser.rows[0]) {
            socket.emit('registerResponse', {
              status: 'success',
              message: 'Successful registration',
              error: null,
              data: newUser.rows[0]
            });
          } else {
            socket.emit('registerResponse', {
              status: 'fail',
              message: 'Failed registration',
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

  async logIn(socket) {
    socket.on('logIn', async (logInData) => {
      try {
        const { email, password } = logInData;
        const candidate = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (candidate.rows[0]) {
          const isPasswordMatching = bcrypt.compare(password, candidate.rows[0].password);
          if (isPasswordMatching) {
            const cookie = serialize(this.#getCookieWithJwtToken(candidate.rows[0].id));
            socket.handshake.headers.cookie = cookie;
            socket.emit('logInResponse', {
              status: 'success',
              message: 'Successful logIn',
              error: null,
              data: cookie
            });
          } else {
            socket.emit('logInResponse', {
              status: 'fail',
              message: 'Incorrect password',
              error: null,
              data: null
            });
          }
        } else {
          socket.emit('logInResponse', {
            status: 'fail',
            message: 'Incorrect email',
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

  async logOut(socket) {
    socket.on('logOut', async () => {
      const cookie = serialize(this.#getCookieForLogOut());
      socket.handshake.headers.cookie = cookie;
      socket.emit('logOutResponse', {
        status: 'success',
        message: 'Successful logOut',
        error: null,
        data: cookie
      });
    });
  }

  async #getCookieWithJwtToken(userId) {
    const payload = { userId };
    const secret = process.env.JWT_TOKEN_SECRET;
    const expiresIn = { expiresIn: `${process.env.JWT_TOKEN_EXPIRATION_TIME}s` };
    const token = jwt.sign(payload, secret, expiresIn);
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${process.env.JWT_TOKEN_EXPIRATION_TIME}`;
  }

  async #getCookieForLogOut() {
    return 'Authentication=; HttpOnly; Path=/; Max-Age=0';
  }

  async getUserFromSocket(socket) {
    const cookie = socket.handshake.headers.cookie;
    const { Authentication: authenticationToken } = parse(cookie);
    const payload = jwt.verify(authenticationToken, process.env.JWT_TOKEN_SECRET);
    if (payload.userId) {
      return await pool.query('SELECT * FROM users WHERE id = $1', [payload.userId]);
    }
  }
}

export default new AuthenticationService();
