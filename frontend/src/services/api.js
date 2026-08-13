import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// We will write a small AsyncStorage fallback wrapper since AsyncStorage is standard and easy to use.
// Let's check if AsyncStorage or SecureStore is available. For React Native, we can write a simple token storage.
// We can use LocalStorage on web, and a simple memory/AsyncStorage on mobile.
// Let's implement a storage helper in a separate file or directly inside api.ts to make it simple.

import Constants from "expo-constants";

const getBaseUrl = () => {
  // Use environment variable if specified, otherwise default to local development port
  let url = process.env.EXPO_PUBLIC_API_URL || "https://aims-classes.onrender.com";

  // Check if we are running in web mode
  if (Platform.OS === "web") {
    return url;
  }

  // On mobile (Android/iOS), 'localhost' or '127.0.0.1' points to the device itself.
  // We need to resolve the computer's actual local IP address so the app can communicate with the backend.
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      return url.replace("localhost", ip).replace("127.0.0.1", ip);
    }

    // Fallbacks
    if (Platform.OS === "android") {
      return url.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2"); // Android Emulator Loopback
    }
  }

  return url;
};

export const API_BASE_URL = getBaseUrl();
console.log("API Base URL initialized:", API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Storage helper for tokens (AsyncStorage on mobile, localStorage on web)
export const tokenStorage = {
  async getAccessToken() {
    if (Platform.OS === "web") {
      return localStorage.getItem("accessToken");
    }
    try {
      return await AsyncStorage.getItem("accessToken");
    } catch (e) {
      console.error("Error getting accessToken from AsyncStorage:", e);
      return null;
    }
  },
  async getRefreshToken() {
    if (Platform.OS === "web") {
      return localStorage.getItem("refreshToken");
    }
    try {
      return await AsyncStorage.getItem("refreshToken");
    } catch (e) {
      console.error("Error getting refreshToken from AsyncStorage:", e);
      return null;
    }
  },
  async getUser() {
    if (Platform.OS === "web") {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    }
    try {
      const u = await AsyncStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      console.error("Error getting user from AsyncStorage:", e);
      return null;
    }
  },
  async saveTokens(accessToken, refreshToken, user) {
    if (Platform.OS === "web") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      try {
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        await AsyncStorage.setItem("user", JSON.stringify(user));
      } catch (e) {
        console.error("Error saving tokens to AsyncStorage:", e);
      }
    }
  },
  async clear() {
    if (Platform.OS === "web") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    } else {
      try {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        await AsyncStorage.removeItem("user");
      } catch (e) {
        console.error("Error clearing AsyncStorage:", e);
      }
    }
  },
};

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle Refresh Token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops on auth endpoints
    if (
      originalRequest.url?.includes("/api/auth/login") ||
      originalRequest.url?.includes("/api/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refresh = await tokenStorage.getRefreshToken();
        if (!refresh) {
          throw new Error("No refresh token available");
        }

        // Request new access token
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          {
            refreshToken: refresh,
          },
        );

        const { accessToken } = response.data;
        const currentUser = await tokenStorage.getUser();
        await tokenStorage.saveTokens(accessToken, refresh, currentUser);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        await tokenStorage.clear();
        if (unauthorizedCallback) {
          unauthorizedCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

let unauthorizedCallback = null;

export const registerUnauthorizedCallback = (cb) => {
  unauthorizedCallback = cb;
};

export default api;
