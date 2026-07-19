// In production, Netlify handles the functions route directly on the same domain.
// In development, netlify-cli dev runs on port 8888.
const isDev = import.meta.env.DEV;
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions');
