import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { store } from "@/redux/store";
import { setTokens as reduxSetTokens, logout as reduxLogout } from "@/redux/slices/authSlice";

const BASE_URL = "https://api.trestechsolutions.com/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const url = config.url ?? '';

      // Storefront endpoints are AllowAny (guest-friendly) or use a
      // separate customer JWT — never attach the admin staff token to them.
      // Attaching a staff token causes the backend to return 403 because
      // StaffJWTAuthentication succeeds but the staff user lacks storefront
      // permissions.
      const isStorefront = url.startsWith('/storefront/') || url.includes('/storefront/');

      if (!isStorefront) {
        // Admin API — attach staff JWT if present
        const token = localStorage.getItem("trestech_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // Storefront — attach customer JWT if present, otherwise send no
        // Authorization header so AllowAny endpoints work for guests.
        const customerToken = localStorage.getItem("trestech_customer_token");
        if (customerToken) {
          config.headers.Authorization = `Bearer ${customerToken}`;
        } else {
          // Explicitly remove any inherited Authorization header
          delete config.headers.Authorization;
        }
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Customer token refresh ───────────────────────────────────────────────────
// The access token lives 30 min. On a 401 from a storefront endpoint we trade the
// refresh token for a new access token once, then replay the request. Only if that
// fails is the customer really signed out (localStorage + Redux, so the UI agrees).
let customerRefresh: Promise<string | null> | null = null;

async function refreshCustomerAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("trestech_customer_refresh_token");
  if (!refresh) return null;
  try {
    // plain axios: this call must not go through our interceptors
    const { data } = await axios.post<{ access: string }>(
      `${BASE_URL}/storefront/customers/refresh/`,
      { refresh },
      { timeout: 10000 },
    );
    localStorage.setItem("trestech_customer_token", data.access);
    store.dispatch(reduxSetTokens({ accessToken: data.access, refreshToken: refresh }));
    return data.access;
  } catch {
    return null;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<any>) => {
    const status = error.response?.status;

    const cfg = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const reqUrl = cfg?.url ?? "";
    const isStorefrontReq = reqUrl.includes("/storefront/");
    const isCustomerAuthCall = /\/customers\/(login|register|refresh)\//.test(reqUrl);

    if (
      status === 401 && typeof window !== "undefined" && cfg && isStorefrontReq &&
      !isCustomerAuthCall && !cfg._retry && localStorage.getItem("trestech_customer_refresh_token")
    ) {
      cfg._retry = true;
      customerRefresh ??= refreshCustomerAccessToken().finally(() => { customerRefresh = null; });
      const fresh = await customerRefresh;
      if (fresh) {
        cfg.headers.Authorization = `Bearer ${fresh}`;
        return axiosInstance(cfg);
      }
    }

    switch (status) {
      case 401:
        if (typeof window !== "undefined") {
          // Admin / Staff session
          localStorage.removeItem("trestech_token");
          localStorage.removeItem("trestech_refresh_token");
          localStorage.removeItem("trestech_user");
          // Storefront Customer session
          localStorage.removeItem("trestech_customer_token");
          localStorage.removeItem("trestech_customer_refresh_token");
          localStorage.removeItem("trestech_customer_user");
          document.cookie = "user=; path=/; max-age=0";
          // Redux-persist still held the customer: without this the UI looks signed in but sends no token
          if (isStorefrontReq) store.dispatch(reduxLogout());
        }
        break;

      case 403: {
        const detail = error.response?.data?.detail;
        const isMissingCreds =
          typeof detail === 'string' &&
          detail.toLowerCase().includes('authentication credentials');
        if (isMissingCreds) {
          // Guest users hitting customer-protected endpoints — normal, not an error
          console.warn('403 (guest/no token):', detail);
        } else {
          console.error('Forbidden:', error.response?.data);
        }
        break;
      }

      case 404:
        // 404s are handled by the calling hook — no global log needed
        break;

      case 500:
        console.error("Internal Server Error:", error.response?.data);
        break;

      default:
        break;
    }

    return Promise.reject(error.response?.data ?? error);
  }
);

export default axiosInstance;