import axios from 'axios';

// Falls back to the local backend default if VITE_API_URL isn't set in
// .env — without this, baseURL silently resolves to `undefined` and every
// request goes out as a relative path (e.g. '/requests' instead of
// 'http://localhost:5000/api/requests'), which the backend then reports as
// "Route not found" since nothing is mounted outside of /api/*.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Better Auth authenticates via an httpOnly session cookie. Without
  // withCredentials, every cross-origin request from the Vite dev server
  // (5173) to the API (5000) goes out without that cookie and comes back
  // 401 even though the user is genuinely logged in. The server side of
  // this (cors({ credentials: true }) in app.js) already expects it —
  // this was the missing half.
  withCredentials: true
});

export default axiosInstance;