import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Better Auth authenticates via an httpOnly session cookie. Without
  // withCredentials, every cross-origin request from the Vite dev server
  // (5173) to the API (5000) goes out without that cookie and comes back
  // 401 even though the user is genuinely logged in. The server side of
  // this (cors({ credentials: true }) in app.js) already expects it —
  // this was the missing half.
  withCredentials: true
});

export default axiosInstance;