// Production requests stay on the Vercel origin so authentication cookies are
// first-party on Safari/iPad. Vercel forwards /api/* to the Render backend.
// During local development, Vite's proxy forwards the same paths to localhost.
export const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL ?? '')
  : ''
