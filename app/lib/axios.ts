import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const hasCsrfToken = () => {
  return document.cookie.split(";").some((item) => item.trim().startsWith("XSRF-TOKEN="));
};

const getSanctumBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return url.replace(/\/api\/?$/, "");
};

const ROOT_ROUTES = [
  "/login",
  "/logout",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/two-factor-challenge",
  "/sanctum/csrf-cookie",
  "user/profile-information",
  "user/password"
];

api.interceptors.request.use(
  async (config) => {

    if (config.url && ROOT_ROUTES.some((route) => config.url?.startsWith(route))) {
      config.baseURL = getSanctumBaseUrl();
    }

    const method = config.method?.toLowerCase();

    if (["post", "put", "delete", "patch"].includes(method || "")) {
      if (!hasCsrfToken()) {
        await axios.get(`${getSanctumBaseUrl()}/sanctum/csrf-cookie`, {
          withCredentials: true,
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 1. Handle 419 (CSRF Token Mismatch / Session Expired)
    if (status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.get(`${getSanctumBaseUrl()}/sanctum/csrf-cookie`, {
          withCredentials: true,
        });
        return api(originalRequest);
      } catch (csrfError) {
        // Kapag pumalpak pa rin ang pagkuha ng CSRF, i-redirect na sa login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(csrfError);
      }
    }

    // 2. Handle 401 (Unauthenticated)
    if (status === 401) {
      const requestUrl = originalRequest?.url || "";

      const isAuthEndpoint = 
        requestUrl.includes("/login") || 
        requestUrl.includes("/two-factor-challenge");

      if (!isAuthEndpoint && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;