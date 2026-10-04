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

api.interceptors.request.use(
  async (config) => {
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

    // 419 = Laravel CSRF Token Mismatch / Session Expired
    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Fetch fresh CSRF cookie
        await axios.get(`${getSanctumBaseUrl()}/sanctum/csrf-cookie`, {
          withCredentials: true,
        });

        // Retry the original request
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;