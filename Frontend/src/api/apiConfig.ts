// Single source of truth for the API origin.
//
// In development this defaults to the local API (http://localhost:5128); in a
// deployed environment set REACT_APP_API_URL to the API's public origin
// (e.g. https://meal-planner-api.onrender.com) at build time. Create React App
// inlines REACT_APP_* variables into the bundle during `npm run build`.
//
// `apiBase(path)` appends a path to the "<origin>/api" prefix. Pass the same
// suffix each module used before (e.g. "/", "/user/") so routes are unchanged.
const ORIGIN = (process.env.REACT_APP_API_URL || "http://localhost:5128").replace(/\/+$/, "");

export const apiBase = (path: string = "/"): string => `${ORIGIN}/api${path}`;

export default apiBase;
